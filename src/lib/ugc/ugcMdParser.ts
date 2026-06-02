/**
 * UGC System v2 — MDテンプレートパーサー
 * @module ugcMdParser
 *
 * Markdownテンプレートを UgcQuestTemplate オブジェクトに変換する。
 * Frontmatter (YAML) + シナリオ本文 (Markdown) を解析する。
 */

import type { UgcFlowNode } from './ugcTemplateSchema';
import type { UgcNodeType } from './ugcConfig';

// ── Frontmatter パース ──────────────────────────────────────────────────────

/**
 * MD文字列からFrontmatter（---で囲まれた部分）を抽出・パースする
 */
export function extractFrontmatter(md: string): {
  frontmatter: Record<string, unknown>;
  body: string;
} {
  const fmRegex = /^---\r?\n([\s\S]*?)\r?\n---/;
  const match = md.match(fmRegex);

  if (!match) {
    throw new Error('Frontmatterが見つかりません。テンプレートの先頭に --- で囲んだヘッダーが必要です。');
  }

  const yamlStr = match[1];
  const body = md.slice(match[0].length).trim();
  const frontmatter = parseSimpleYaml(yamlStr);

  return { frontmatter, body };
}

/**
 * 簡易YAMLパーサー（外部依存なし）
 * ネストされた構造（conditions, rewards）にも対応する。
 */
export function parseSimpleYaml(yamlStr: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = yamlStr.split(/\r?\n/);
  let currentKey = '';
  let currentIndent = 0;
  let nestedObj: Record<string, unknown> = {};
  let inNested = false;
  let arrayKey = '';
  let currentArray: Record<string, unknown>[] = [];
  let currentArrayItem: Record<string, unknown> = {};
  let inArray = false;
  let multiLineKey = '';
  let multiLineValue = '';
  let inMultiLine = false;

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, '');

    // コメント行スキップ
    if (line.trim().startsWith('#') || line.trim() === '') {
      continue;
    }

    // マルチライン値の処理
    if (inMultiLine) {
      const indent = line.length - line.trimStart().length;
      if (indent > currentIndent && line.trim() !== '') {
        multiLineValue += (multiLineValue ? '\n' : '') + line.trim();
        continue;
      } else {
        result[multiLineKey] = multiLineValue;
        inMultiLine = false;
      }
    }

    const indent = line.length - line.trimStart().length;
    const trimmed = line.trim();

    // 配列アイテム
    if (trimmed.startsWith('- ') && inArray) {
      if (Object.keys(currentArrayItem).length > 0) {
        currentArray.push({ ...currentArrayItem });
      }
      currentArrayItem = {};
      const kvMatch = trimmed.slice(2).match(/^(\w+):\s*(.*)$/);
      if (kvMatch) {
        currentArrayItem[kvMatch[1]] = parseYamlValue(kvMatch[2]);
      }
      continue;
    }

    // 配列アイテムの子プロパティ
    if (inArray && indent > 4 && !trimmed.startsWith('-')) {
      const kvMatch = trimmed.match(/^(\w+):\s*(.*)$/);
      if (kvMatch) {
        currentArrayItem[kvMatch[1]] = parseYamlValue(kvMatch[2]);
      }
      continue;
    }

    // 配列終了検出
    if (inArray && indent <= 2 && !trimmed.startsWith('-')) {
      if (Object.keys(currentArrayItem).length > 0) {
        currentArray.push({ ...currentArrayItem });
        currentArrayItem = {};
      }
      if (inNested) {
        nestedObj[arrayKey] = currentArray;
      } else {
        result[arrayKey] = currentArray;
      }
      inArray = false;
      currentArray = [];
    }

    // ネストオブジェクトの子プロパティ
    if (inNested && indent > 0 && !trimmed.includes(':')) {
      continue;
    }

    if (inNested && indent > 0) {
      const kvMatch = trimmed.match(/^(\w+):\s*(.*)$/);
      if (kvMatch) {
        const key = kvMatch[1];
        const val = kvMatch[2].trim();
        if (val === '') {
          // さらにネスト or 配列開始
          arrayKey = key;
          currentArray = [];
          currentArrayItem = {};
          inArray = true;
        } else {
          nestedObj[key] = parseYamlValue(val);
        }
      }
      continue;
    }

    // ネスト終了検出
    if (inNested && indent === 0) {
      result[currentKey] = { ...nestedObj };
      inNested = false;
      nestedObj = {};
    }

    // トップレベルの key: value
    const kvMatch = trimmed.match(/^(\w+):\s*(.*)$/);
    if (kvMatch) {
      const key = kvMatch[1];
      const val = kvMatch[2].trim();

      if (val === '|') {
        // マルチライン値
        inMultiLine = true;
        multiLineKey = key;
        multiLineValue = '';
        currentIndent = indent;
        continue;
      }

      if (val === '') {
        // ネストされたオブジェクト開始
        currentKey = key;
        currentIndent = indent;
        inNested = true;
        nestedObj = {};
        continue;
      }

      result[key] = parseYamlValue(val);
    }
  }

  // 最終フラッシュ
  if (inMultiLine) {
    result[multiLineKey] = multiLineValue;
  }
  if (inArray) {
    if (Object.keys(currentArrayItem).length > 0) {
      currentArray.push({ ...currentArrayItem });
    }
    if (inNested) {
      nestedObj[arrayKey] = currentArray;
    } else {
      result[arrayKey] = currentArray;
    }
  }
  if (inNested) {
    result[currentKey] = { ...nestedObj };
  }

  return result;
}

/** YAML値を適切なJS型に変換する */
function parseYamlValue(val: string): unknown {
  if (val === 'true') return true;
  if (val === 'false') return false;
  if (val === 'null' || val === '~') return null;

  // 文字列（引用符付き）
  const strMatch = val.match(/^"(.*)"$/) || val.match(/^'(.*)'$/);
  if (strMatch) return strMatch[1];

  // インラインリスト [a, b, c]
  const listMatch = val.match(/^\[(.+)\]$/);
  if (listMatch) {
    return listMatch[1].split(',').map(s => {
      const trimmed = s.trim();
      return parseYamlValue(trimmed);
    });
  }

  // 数値
  const num = Number(val);
  if (!isNaN(num) && val !== '') return num;

  return val;
}

// ── シナリオ本文パース ──────────────────────────────────────────────────────

/** ノードタイプ判定マップ */
const NODE_TYPE_MAP: Record<string, UgcNodeType> = {
  'テキスト': 'text',
  'バトル': 'battle',
  'NPC加入': 'npc_join',
  'NPC離脱': 'npc_leave',
  '納品': 'delivery',
  'ランダム分岐': 'random_branch',
  '罠': 'trap',
  '成功': 'success',
  '失敗': 'failure',
};

/**
 * シナリオ本文をフローノード配列にパースする
 */
export function parseScenarioBody(body: string): UgcFlowNode[] {
  const nodes: UgcFlowNode[] = [];

  // ## ノード N: タイトル（タイプ） で分割
  const nodeRegex = /^## ノード\s+(\d+):\s*(.+?)(?:\uff08|（)(.+?)(?:\uff09|）)/gm;
  const sections = body.split(/(?=^## ノード\s+\d+:)/m).filter(s => s.trim());

  for (const section of sections) {
    const headerMatch = section.match(/^## ノード\s+(\d+):\s*(.+?)(?:\uff08|（)(.+?)(?:\uff09|）)/);
    if (!headerMatch) continue;

    const nodeNum = headerMatch[1];
    const nodeId = nodeNum === '1' ? 'start' : `node_${nodeNum}`;
    const typeName = headerMatch[3].trim();
    const nodeType = NODE_TYPE_MAP[typeName] || 'text';

    const content = section.slice(headerMatch[0].length).trim();
    const node = parseNodeContent(nodeId, nodeType, content);
    nodes.push(node);
  }

  return nodes;
}

/**
 * 個別ノードの内容をパースする
 */
function parseNodeContent(id: string, type: UgcNodeType, content: string): UgcFlowNode {
  const node: UgcFlowNode = {
    id,
    type,
    text: '',
    choices: [],
  };

  const lines = content.split(/\r?\n/);
  const textLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // メタデータ行
    const metaMatch = trimmed.match(/^\*\*(.+?)\*\*:\s*(.+)$/);
    if (metaMatch) {
      const key = metaMatch[1];
      const val = metaMatch[2].trim();

      switch (key) {
        case '話者': node.speaker_name = val; break;
        case '画像': node.speaker_image_url = val; break;
        case '背景': node.bg_key = val; break;
        case 'BGM': node.bgm_key = val; break;
        case 'SE': node.se_key = val; break;
        case '確率': node.probability = parseInt(val, 10); break;
        case 'ダメージ':
          node.trap_damage_pct = parseInt(val.replace('%', ''), 10);
          break;
        case '納品アイテム': {
          const dMatch = val.match(/^(.+?)\s*[×x]\s*(\d+)$/);
          if (dMatch) {
            node.delivery_item = dMatch[1];
            node.delivery_count = parseInt(dMatch[2], 10);
          } else {
            node.delivery_item = val;
            node.delivery_count = 1;
          }
          break;
        }
        default: break;
      }
      continue;
    }

    // 選択肢ブロック
    if (trimmed === '**選択肢**:') continue;
    const choiceMatch = trimmed.match(/^-\s*\[(.+?)\]\s*→\s*ノード\s*(\d+)$/);
    if (choiceMatch) {
      node.choices.push({
        label: choiceMatch[1],
        next: `node_${choiceMatch[2]}`,
      });
      continue;
    }

    // 自動進行
    const nextMatch = trimmed.match(/^→\s*ノード\s*(\d+)$/);
    if (nextMatch) {
      node.next = `node_${nextMatch[1]}`;
      continue;
    }

    // エネミーブロック
    if (trimmed === '**エネミー**:') {
      const enemyData = parseEnemyBlock(lines, lines.indexOf(line));
      if (enemyData) node.enemyData = enemyData;
      continue;
    }

    // NPCブロック
    if (trimmed === '**NPC**:') {
      const npcData = parseNpcBlock(lines, lines.indexOf(line));
      if (npcData) node.npcData = npcData;
      continue;
    }

    // 通常テキスト（引用符 > も含む）
    if (trimmed && !trimmed.startsWith('---')) {
      textLines.push(trimmed.replace(/^>\s*/, ''));
    }
  }

  node.text = textLines.join('\n');
  return node;
}

/**
 * エネミーブロックのパース
 */
function parseEnemyBlock(lines: string[], startIdx: number): UgcFlowNode['enemyData'] {
  const data: Record<string, unknown> = {};

  for (let i = startIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '' || line.startsWith('---') || line.startsWith('##')) break;

    const match = line.match(/^(.+?):\s*(.+)$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim();

      switch (key) {
        case '名前': data.name = val; break;
        case 'レベル': data.level = parseInt(val, 10); break;
        case 'HP': data.hp = parseInt(val, 10); break;
        case 'ATK': data.atk = parseInt(val, 10); break;
        case 'DEF': data.def = parseInt(val, 10); break;
        case 'スキル': {
          const listMatch = val.match(/^\[(.+)\]$/);
          data.skills = listMatch
            ? listMatch[1].split(',').map(s => s.trim())
            : [val];
          break;
        }
        case '画像': data.image_url = val; break;
        case 'フレーバー': data.flavor_text = val; break;
      }
    }
  }

  if (!data.name) return undefined;

  return {
    name: data.name as string,
    level: (data.level as number) || 1,
    hp: (data.hp as number) || 50,
    atk: (data.atk as number) || 5,
    def: (data.def as number) || 5,
    skills: (data.skills as string[]) || [],
    image_url: (data.image_url as string) || '',
    flavor_text: (data.flavor_text as string) || '',
    asset_type: 'enemy' as const,
  };
}

/**
 * NPCブロックのパース
 */
function parseNpcBlock(lines: string[], startIdx: number): UgcFlowNode['npcData'] {
  const data: Record<string, unknown> = {};

  for (let i = startIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '' || line.startsWith('---') || line.startsWith('##')) break;

    const match = line.match(/^(.+?):\s*(.+)$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim();

      switch (key) {
        case '名前': data.name = val; break;
        case 'レベル': data.level = parseInt(val, 10); break;
        case 'ATK': data.atk = parseInt(val, 10); break;
        case 'DEF': data.def = parseInt(val, 10); break;
        case '耐久度': data.durability = parseInt(val, 10); break;
        case 'カバー率': data.cover_rate = parseInt(val, 10); break;
        case 'AI': data.ai_role = val; break;
        case 'スキル': {
          const listMatch = val.match(/^\[(.+)\]$/);
          data.signature_skills = listMatch
            ? listMatch[1].split(',').map(s => s.trim())
            : [val];
          break;
        }
        case '画像': data.image_url = val; break;
        case '護衛対象': data.is_escort = val === 'true'; break;
      }
    }
  }

  if (!data.name) return undefined;

  return {
    name: data.name as string,
    level: (data.level as number) || 1,
    atk: (data.atk as number) || 5,
    def: (data.def as number) || 5,
    durability: (data.durability as number) || 100,
    cover_rate: (data.cover_rate as number) || 10,
    ai_role: (data.ai_role as 'striker' | 'guardian' | 'medic') || 'striker',
    ai_grade: 'random' as const,
    signature_skills: (data.signature_skills as string[]) || [],
    image_url: (data.image_url as string) || '',
    flavor_text: '',
    is_escort: (data.is_escort as boolean) || false,
  };
}

// ── 個別アセットMD本文パーサー ──────────────────────────────────────────────

/**
 * キー/値ペアのブロックを汎用的にパースするヘルパー
 */
function parseKeyValueBlock(body: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = body.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    // セクションヘッダー・空行・コメントをスキップ
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('---')) continue;

    const match = trimmed.match(/^(.+?):\s*(.*)$/);
    if (match) {
      let val = match[2].trim();
      // クォーテーションを除去（YAML互換）
      const strMatch = val.match(/^"(.*)"$/) || val.match(/^'(.*)'$/);
      if (strMatch) val = strMatch[1];
      result[match[1].trim()] = val;
    }
  }

  return result;
}


/**
 * インラインリスト文字列をパース: "[a, b, c]" → ["a", "b", "c"], "[]" → []
 */
function parseInlineList(val: string): string[] {
  if (!val || val === '[]') return [];
  const listMatch = val.match(/^\[(.+)\]$/);
  if (listMatch) {
    return listMatch[1].split(',').map(s => s.trim());
  }
  return val ? [val] : [];
}

/**
 * エネミーMD本文をパースする（個別アセットテンプレート用）
 */
export function parseEnemyMdBody(body: string): Record<string, unknown> {
  const kv = parseKeyValueBlock(body);

  const enemy: Record<string, unknown> = {
    name: kv['名前'] || '',
    level: parseInt(kv['レベル'], 10) || 5,
    hp: parseInt(kv['HP'], 10) || 50,
    atk: parseInt(kv['ATK'], 10) || 5,
    def: parseInt(kv['DEF'], 10) || 3,
    skills: parseInlineList(kv['スキル'] || ''),
    image_url: kv['画像'] || '',
    flavor_text: kv['フレーバーテキスト'] || kv['フレーバー'] || '',
    asset_type: 'enemy',
  };

  // 行動パターンのパース（複数行ブロック）
  const actionPattern = parseActionPatternBlock(body);
  if (actionPattern.length > 0) {
    enemy.action_pattern = actionPattern;
  }

  return enemy;
}

/**
 * 行動パターンブロックのパース
 * 形式:
 *   - skill: attack
 *     prob: 100
 *   - skill: fireball
 *     prob: 50
 *     condition: hp_under_50
 */
function parseActionPatternBlock(body: string): Array<{ skill: string; prob: number; condition?: string }> {
  const patterns: Array<{ skill: string; prob: number; condition?: string }> = [];
  const lines = body.split(/\r?\n/);
  let inBlock = false;
  let current: Record<string, string> = {};

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === '行動パターン:' || trimmed === '行動パターン：') {
      inBlock = true;
      continue;
    }

    if (!inBlock) continue;

    // ブロック終了判定
    if (trimmed && !trimmed.startsWith('-') && !trimmed.startsWith('skill') &&
        !trimmed.startsWith('prob') && !trimmed.startsWith('condition') &&
        !/^\s/.test(line)) {
      // 新しいトップレベルキーに当たったら終了
      if (Object.keys(current).length > 0) {
        if (current.skill) {
          patterns.push({
            skill: current.skill,
            prob: parseInt(current.prob, 10) || 100,
            ...(current.condition ? { condition: current.condition } : {}),
          });
        }
        current = {}; // 最終フラッシュでの重複を防止
      }
      break;
    }

    // 新しいアイテム
    if (trimmed.startsWith('- ')) {
      if (Object.keys(current).length > 0 && current.skill) {
        patterns.push({
          skill: current.skill,
          prob: parseInt(current.prob, 10) || 100,
          ...(current.condition ? { condition: current.condition } : {}),
        });
      }
      current = {};
      const kvMatch = trimmed.slice(2).match(/^(\w+):\s*(.+)$/);
      if (kvMatch) {
        current[kvMatch[1]] = kvMatch[2].trim();
      }
      continue;
    }

    // 子プロパティ
    const kvMatch = trimmed.match(/^(\w+):\s*(.+)$/);
    if (kvMatch && inBlock) {
      current[kvMatch[1]] = kvMatch[2].trim();
    }
  }

  // 最終フラッシュ
  if (Object.keys(current).length > 0 && current.skill) {
    patterns.push({
      skill: current.skill,
      prob: parseInt(current.prob, 10) || 100,
      ...(current.condition ? { condition: current.condition } : {}),
    });
  }

  return patterns;
}

/**
 * アイテムMD本文をパースする（個別アセットテンプレート用）
 */
export function parseItemMdBody(body: string): Record<string, unknown> {
  const kv = parseKeyValueBlock(body);

  const item: Record<string, unknown> = {
    name: kv['名前'] || '',
    type: kv['種別'] || 'consumable',
    description: kv['説明'] || '',
    base_price: 1,
    rarity: kv['レアリティ'] || 'common',
    image_url: kv['画像'] || '',
  };

  if (kv['使用タイミング']) {
    item.use_timing = kv['使用タイミング'];
  }

  // 効果データのパース
  const effectData: Record<string, unknown> = {};
  const healHp = kv['HP回復'] || kv['回復量'];
  if (healHp) {
    effectData.heal_hp = parseInt(healHp, 10);
  }
  const cureStatus = kv['状態回復'];
  if (cureStatus === 'true') {
    effectData.cure_status = true;
  }

  // 効果ブロック（ネスト形式）のパース
  const lines = body.split(/\r?\n/);
  let inEffect = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '効果:' || trimmed === '効果：') {
      inEffect = true;
      continue;
    }
    if (inEffect) {
      if (trimmed === '' || (!trimmed.startsWith(' ') && !line.startsWith('\t') && !trimmed.startsWith('HP') && !trimmed.startsWith('状態'))) {
        // 別のキーが開始 → エフェクトブロック終了
        if (trimmed.match(/^[^\s]/) && !trimmed.startsWith('HP') && !trimmed.startsWith('状態')) {
          inEffect = false;
          continue;
        }
      }
      const effectMatch = trimmed.match(/^(.+?):\s*(.+)$/);
      if (effectMatch) {
        const ek = effectMatch[1].trim();
        const ev = effectMatch[2].trim();
        if (ek === 'HP回復') effectData.heal_hp = parseInt(ev, 10);
        if (ek === '状態回復') effectData.cure_status = ev === 'true';
      }
    }
  }

  if (Object.keys(effectData).length > 0) {
    item.effect_data = effectData;
  }

  return item;
}

/**
 * スキルカードMD本文をパースする（個別アセットテンプレート用）
 */
export function parseSkillCardMdBody(body: string): Record<string, unknown> {
  const kv = parseKeyValueBlock(body);

  return {
    name: kv['名前'] || '',
    power: parseInt(kv['威力'], 10) || 10,
    ap_cost: parseInt(kv['AP消費'], 10) || 2,
    target_type: kv['対象'] || 'single_enemy',
    effect_id: kv['効果'] || 'attack',
    effect_duration: parseInt(kv['効果持続'], 10) || 0,
    description: kv['説明'] || '',
    image_url: kv['画像'] || '',
  };
}

/**
 * NPC MD本文をパースする（個別アセットテンプレート用）
 */
export function parseNpcMdBody(body: string): Record<string, unknown> {
  const kv = parseKeyValueBlock(body);

  return {
    name: kv['名前'] || '',
    level: parseInt(kv['レベル'], 10) || 5,
    atk: parseInt(kv['ATK'], 10) || 5,
    def: parseInt(kv['DEF'], 10) || 5,
    durability: parseInt(kv['耐久度'], 10) || 100,
    cover_rate: parseInt(kv['カバー率'], 10) || 10,
    ai_role: kv['AI'] || 'striker',
    ai_grade: 'random',
    signature_skills: parseInlineList(kv['スキル'] || ''),
    image_url: kv['画像'] || '',
    flavor_text: kv['フレーバーテキスト'] || kv['フレーバー'] || '',
    is_escort: kv['護衛対象'] === 'true',
  };
}
