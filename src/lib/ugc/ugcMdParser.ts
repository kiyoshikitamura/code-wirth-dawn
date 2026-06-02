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

/** ノードタイプ判定マップ（日本語名＋英語名対応） */
const NODE_TYPE_MAP: Record<string, UgcNodeType> = {
  // 日本語
  'テキスト': 'text',
  'バトル': 'battle',
  'NPC加入': 'npc_join',
  'NPC離脱': 'npc_leave',
  '納品': 'delivery',
  'ランダム分岐': 'random_branch',
  '罠': 'trap',
  '成功': 'success',
  '失敗': 'failure',
  // 英語（AI生成テンプレート対応）
  'text': 'text',
  'battle': 'battle',
  'npc_join': 'npc_join',
  'npc_leave': 'npc_leave',
  'delivery': 'delivery',
  'random_branch': 'random_branch',
  'trap': 'trap',
  'success': 'success',
  'failure': 'failure',
};

/**
 * シナリオ本文をフローノード配列にパースする。
 * 以下の2形式に対応:
 *   - 公式形式: `## ノード N: タイトル（タイプ）`
 *   - AI生成形式: `### node_id [type]`  (## も可)
 */
export function parseScenarioBody(body: string): UgcFlowNode[] {
  // ── 報酬セクションを先に抽出 ──
  const rewardsData = parseRewardsSection(body);
  // 報酬セクションを除去してノード解析に回す
  const bodyWithoutRewards = body.replace(/^## 報酬[\s\S]*?(?=^#{2,3}\s+(?!アイテム|スキルカード)|$)/m, '').trim();

  const nodes: UgcFlowNode[] = [];

  // 公式形式: ## ノード N: タイトル（タイプ）
  const officialPattern = /^## ノード\s+(\d+):\s*(.+?)(?:\uff08|（)(.+?)(?:\uff09|）)/;
  // AI生成形式: ### node_id [type]  (##でも###でも可)
  const aiPattern = /^#{2,3}\s+(\S+)\s+\[([^\]]+)\]/;

  // 両形式のヘッダーで分割
  const sectionSplitter = /(?=^#{2,3}\s+(?:ノード\s+\d+:|\S+\s+\[))/m;
  const sections = bodyWithoutRewards.split(sectionSplitter).filter(s => s.trim());

  let fullDescription = '';

  for (const section of sections) {
    // 公式形式を試行
    const officialMatch = section.match(officialPattern);
    if (officialMatch) {
      const nodeNum = officialMatch[1];
      const nodeId = nodeNum === '1' ? 'start' : `node_${nodeNum}`;
      const typeName = officialMatch[3].trim();
      const nodeType = NODE_TYPE_MAP[typeName] || 'text';
      const content = section.slice(officialMatch[0].length).trim();
      const node = parseNodeContent(nodeId, nodeType, content);
      nodes.push(node);
      continue;
    }

    // AI生成形式を試行
    const aiMatch = section.match(aiPattern);
    if (aiMatch) {
      const nodeId = aiMatch[1].trim();
      const typeName = aiMatch[2].trim();
      const nodeType = NODE_TYPE_MAP[typeName] || 'text';
      const content = section.slice(aiMatch[0].length).trim();
      const node = parseNodeContent(nodeId, nodeType, content);
      nodes.push(node);
      continue;
    }

    // ヘッダーにマッチしないセクション → full_description として扱う
    const trimmed = section.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      fullDescription += (fullDescription ? '\n\n' : '') + trimmed;
    }
  }

  // full_description を最初のノードに付与（後でfrontmatterにマージされる）
  // rewardsData があれば _rewards メタデータを付与
  if (nodes.length > 0) {
    (nodes as any).__fullDescription = fullDescription;
    (nodes as any).__rewards = rewardsData;
  }

  return nodes;
}

/**
 * ## 報酬 セクションをパースする（AI生成テンプレート対応）
 *
 * 期待する形式:
 * ## 報酬
 * ### アイテム
 * - アイテム名 (type)
 * - アイテム名 (type, rarity, heal_hp=30)
 * ### スキルカード
 * - カード名 (power=12, effect=attack, ap_cost=3)
 */
function parseRewardsSection(body: string): { items?: any[]; skill_card?: any } | null {
  const rewardsMatch = body.match(/^## 報酬([\s\S]*?)(?=^#{2}\s+(?!アイテム|スキルカード)|$(?!\n))/m);
  if (!rewardsMatch) return null;

  const rewardsBody = rewardsMatch[1];
  const result: { items?: any[]; skill_card?: any } = {};

  // ### アイテム セクション
  const itemsMatch = rewardsBody.match(/###\s*アイテム([\s\S]*?)(?=###|$)/);
  if (itemsMatch) {
    const items: any[] = [];
    const itemLines = itemsMatch[1].split('\n').filter(l => l.trim().startsWith('-'));
    for (const line of itemLines) {
      const item = parseRewardItemLine(line.trim().replace(/^-\s*/, ''));
      if (item) items.push(item);
    }
    if (items.length > 0) result.items = items;
  }

  // ### スキルカード セクション
  const cardMatch = rewardsBody.match(/###\s*スキルカード([\s\S]*?)(?=###|$)/);
  if (cardMatch) {
    const cardLines = cardMatch[1].split('\n').filter(l => l.trim().startsWith('-'));
    if (cardLines.length > 0) {
      const card = parseRewardCardLine(cardLines[0].trim().replace(/^-\s*/, ''));
      if (card) result.skill_card = card;
    }
  }

  return Object.keys(result).length > 0 ? result : null;
}

/** 報酬アイテム行をパース: "アイテム名 (type, rarity, heal_hp=30)" */
function parseRewardItemLine(text: string): any | null {
  const match = text.match(/^(.+?)\s*\(([^)]+)\)/);
  if (!match) return { name: text.trim(), type: 'trade_good', rarity: 'common' };

  const name = match[1].trim();
  const params = match[2].split(',').map(s => s.trim());

  const item: any = { name, type: 'trade_good', rarity: 'common' };
  for (const p of params) {
    const kvMatch = p.match(/^(\w+)=(.+)$/);
    if (kvMatch) {
      const key = kvMatch[1];
      const val = kvMatch[2];
      if (key === 'heal_hp') {
        item.effect_data = { ...(item.effect_data || {}), heal_hp: parseInt(val, 10) };
      }
    } else if (['consumable', 'trade_good'].includes(p)) {
      item.type = p;
    } else if (['common', 'uncommon', 'rare'].includes(p)) {
      item.rarity = p;
    }
  }
  return item;
}

/** 報酬スキルカード行をパース: "カード名 (power=12, effect=attack, ap_cost=3)" */
function parseRewardCardLine(text: string): any | null {
  const match = text.match(/^(.+?)\s*\(([^)]+)\)/);
  if (!match) return null;

  const name = match[1].trim();
  const params = match[2].split(',').map(s => s.trim());

  const card: any = { name, power: 10, ap_cost: 2, target_type: 'single_enemy', effect_id: 'attack', effect_duration: 0, description: '' };
  for (const p of params) {
    const kvMatch = p.match(/^(\w+)=(.+)$/);
    if (kvMatch) {
      const key = kvMatch[1];
      const val = kvMatch[2];
      switch (key) {
        case 'power': card.power = parseInt(val, 10); break;
        case 'ap_cost': card.ap_cost = parseInt(val, 10); break;
        case 'effect': card.effect_id = val; break;
        case 'target': card.target_type = val; break;
        case 'duration': card.effect_duration = parseInt(val, 10); break;
      }
    }
  }
  return card;
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

    // メタデータ行: **キー**: 値
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

    // インラインエネミー定義: **enemy:** 名前 (Lv40, HP450, ATK120, DEF80, skills: pierce_attack)
    const inlineEnemyMatch = trimmed.match(/^\*\*enemy:\*\*\s*(.+)$/);
    if (inlineEnemyMatch) {
      const enemyData = parseInlineEnemy(inlineEnemyMatch[1]);
      if (enemyData) node.enemyData = enemyData;
      continue;
    }

    // インラインNPC定義: **npc:** 名前 (Lv40, HP300, skills: buff_party, heal)
    const inlineNpcMatch = trimmed.match(/^\*\*npc:\*\*\s*(.+)$/);
    if (inlineNpcMatch) {
      const npcData = parseInlineNpc(inlineNpcMatch[1]);
      if (npcData) node.npcData = npcData;
      continue;
    }

    // trap_damage_pct: 20（キー:値形式、AI生成対応）
    const trapDmgMatch = trimmed.match(/^trap_damage_pct:\s*(\d+)/);
    if (trapDmgMatch) {
      node.trap_damage_pct = parseInt(trapDmgMatch[1], 10);
      continue;
    }

    // 選択肢ブロック（公式形式）
    if (trimmed === '**選択肢**:') continue;
    const choiceMatch = trimmed.match(/^-\s*\[(.+?)\]\s*→\s*ノード\s*(\d+)$/);
    if (choiceMatch) {
      node.choices.push({
        label: choiceMatch[1],
        next: `node_${choiceMatch[2]}`,
      });
      continue;
    }

    // 自動進行（公式形式）: → ノード N
    const nextMatch = trimmed.match(/^→\s*ノード\s*(\d+)$/);
    if (nextMatch) {
      node.next = `node_${nextMatch[1]}`;
      continue;
    }

    // 自動進行（AI生成形式）: → next: node_id
    const nextAiMatch = trimmed.match(/^→\s*next:\s*(\S+)/);
    if (nextAiMatch) {
      node.next = nextAiMatch[1];
      continue;
    }

    // エネミーブロック（公式形式）
    if (trimmed === '**エネミー**:') {
      const enemyData = parseEnemyBlock(lines, lines.indexOf(line));
      if (enemyData) node.enemyData = enemyData;
      continue;
    }

    // NPCブロック（公式形式）
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
 * インラインエネミー定義をパース:
 * 名前 (LvN, HPN, ATKN, DEFN, skills: skill1, skill2)
 */
function parseInlineEnemy(text: string): UgcFlowNode['enemyData'] {
  const match = text.match(/^(.+?)\s*\(([^)]+)\)/);
  if (!match) return { name: text.trim(), level: 1, hp: 50, atk: 5, def: 5, skills: [], image_url: '', flavor_text: '', asset_type: 'enemy' as const };

  const name = match[1].trim();
  const params = match[2];

  let level = 1, hp = 50, atk = 5, def = 5;
  const skills: string[] = [];

  // Lv, HP, ATK, DEF をパース
  const lvMatch = params.match(/Lv\s*(\d+)/i);
  if (lvMatch) level = parseInt(lvMatch[1], 10);
  const hpMatch = params.match(/HP\s*(\d+)/i);
  if (hpMatch) hp = parseInt(hpMatch[1], 10);
  const atkMatch = params.match(/ATK\s*(\d+)/i);
  if (atkMatch) atk = parseInt(atkMatch[1], 10);
  const defMatch = params.match(/DEF\s*(\d+)/i);
  if (defMatch) def = parseInt(defMatch[1], 10);

  // skills: skill1, skill2
  const skillsMatch = params.match(/skills?:\s*(.+?)(?:\)|$)/);
  if (skillsMatch) {
    skills.push(...skillsMatch[1].split(',').map(s => s.trim()).filter(Boolean));
  }

  return { name, level, hp, atk, def, skills, image_url: '', flavor_text: '', asset_type: 'enemy' as const };
}

/**
 * インラインNPC定義をパース:
 * 名前 (LvN, HPN, skills: skill1, skill2)
 */
function parseInlineNpc(text: string): UgcFlowNode['npcData'] {
  const match = text.match(/^(.+?)\s*\(([^)]+)\)/);
  if (!match) return { name: text.trim(), level: 1, atk: 5, def: 5, durability: 100, cover_rate: 10, ai_role: 'striker' as const, ai_grade: 'random' as const, signature_skills: [], image_url: '', flavor_text: '', is_escort: false };

  const name = match[1].trim();
  const params = match[2];

  let level = 1, atk = 5, def = 5, durability = 100, cover_rate = 10;
  const skills: string[] = [];
  let ai_role: 'striker' | 'guardian' | 'medic' = 'striker';

  const lvMatch = params.match(/Lv\s*(\d+)/i);
  if (lvMatch) level = parseInt(lvMatch[1], 10);
  const hpMatch = params.match(/HP\s*(\d+)/i);
  if (hpMatch) durability = parseInt(hpMatch[1], 10);
  const atkMatch = params.match(/ATK\s*(\d+)/i);
  if (atkMatch) atk = parseInt(atkMatch[1], 10);
  const defMatch = params.match(/DEF\s*(\d+)/i);
  if (defMatch) def = parseInt(defMatch[1], 10);

  // skills: skill1, skill2
  const skillsMatch = params.match(/skills?:\s*(.+?)(?:\)|$)/);
  if (skillsMatch) {
    skills.push(...skillsMatch[1].split(',').map(s => s.trim()).filter(Boolean));
  }

  // ai_role detection from skills
  if (skills.some(s => s.includes('heal'))) ai_role = 'medic';
  else if (skills.some(s => s.includes('guard') || s.includes('buff'))) ai_role = 'guardian';

  return { name, level, atk, def, durability, cover_rate, ai_role, ai_grade: 'random' as const, signature_skills: skills, image_url: '', flavor_text: '', is_escort: false };
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
