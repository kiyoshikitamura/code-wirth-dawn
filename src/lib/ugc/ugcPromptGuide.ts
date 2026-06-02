/**
 * UGC System v2 — AIプロンプトガイド生成
 * @module ugcPromptGuide
 *
 * テンプレートタイプごとに AI 向けプロンプトテキストを生成する。
 * JSON / MD 両フォーマットに対応。
 */

export type PromptTemplateType = 'quest' | 'enemy' | 'item' | 'skill_card' | 'npc';

// ── 共通ヘッダー ────────────────────────────────────────────────────────────

const ROLE_SETTING =
  `あなたはゲーム『Code: Wirth-Dawn』のUGCコンテンツ作成アシスタントです。\n` +
  `ユーザーとの対話を通じて、ゲーム内にインポート可能なテンプレートを作成してください。`;

const TEMPLATE_VERSION = '1.0';
const TEMPLATE_MARKER = 'wirth-dawn-ugc';

const ALLOWED_SKILL_EFFECTS = [
  'attack', 'pierce_attack', 'multi_attack', 'heal',
  'buff_self', 'buff_party', 'debuff_enemy', 'aoe_attack',
] as const;

const FORBIDDEN_SKILL_EFFECTS = [
  'instakill', 'recoil_attack', 'escape', 'taunt', 'support_activate',
] as const;

const NODE_TYPES = [
  'text', 'battle', 'npc_join', 'npc_leave',
  'delivery', 'random_branch', 'trap', 'success', 'failure',
] as const;

const SCENARIO_TYPES = ['Subjugation', 'Delivery', 'Politics', 'Dungeon', 'Other'] as const;

// ── テンプレートタイプ表示名 ─────────────────────────────────────────────────

const TYPE_LABELS: Record<PromptTemplateType, string> = {
  quest: 'クエスト',
  enemy: 'エネミー',
  item: 'アイテム',
  skill_card: 'スキルカード',
  npc: 'NPC',
};

// ── バランスルール ───────────────────────────────────────────────────────────

function getBalanceRules(type: PromptTemplateType): string {
  switch (type) {
    case 'enemy':
      return [
        '## バランスルール（TP: 脅威度ポイント）',
        '',
        'エネミーは TP 上限以内でステータスを設定する必要があります。',
        '',
        '- TP上限 = 10 + level × 5',
        '- HP +1 = 1 TP',
        '- ATK +1 = 2 TP',
        '- DEF +1 = 2 TP',
        '- AoE系スキル（fireball, ice_storm, thunder_storm, aoe_slash, earthquake, whirlwind） = 各20 TP',
        '- VIT吸収スキル（drain_vit, life_drain） = 各30 TP',
        '- その他スキル = 0 TP',
        '',
        '例: level=10 → TP上限=60。HP=30(30TP) + ATK=10(20TP) + DEF=5(10TP) = 60TP → 有効',
        '',
        '**consumed_points ≤ total_points を満たすこと。**',
      ].join('\n');

    case 'npc':
      return [
        '## バランスルール（NP: NPCポイント）',
        '',
        'NPCは NP 上限以内でステータスを設定する必要があります。',
        '',
        '- NP上限 = 10 + level × 5',
        '- ATK +1 = 2 NP',
        '- DEF +1 = 2 NP',
        '- 耐久度(durability) +10 = 1 NP（端数切り捨て）',
        '- カバー率(cover_rate) +5% = 2 NP（端数切り捨て後に ×2）',
        '- スキル1つ = 3 NP',
        '',
        '例: level=10 → NP上限=60。ATK=8(16NP) + DEF=5(10NP) + durability=100(10NP) + cover_rate=20(8NP) + skills=2(6NP) = 50NP → 有効',
        '',
        '**consumed_points ≤ total_points を満たすこと。**',
      ].join('\n');

    case 'quest':
      return [
        '## バランスルール（PB: パワーバジェット）',
        '',
        'クエスト報酬は PB 上限以内で設定する必要があります。',
        '',
        '- PB上限 = rec_level × 2 + battle_count × 5 + node_count × 1',
        '  （battle_count = battleタイプノード数、node_count = 全ノード数）',
        '',
        '### アイテムコスト:',
        '- heal_hp付き: ceil(heal_hp / 10)',
        '- cure_status付き: 5',
        '- trade_good: 3',
        '',
        '### スキルカードコスト:',
        '- コスト = max(0, power + effect_bonus + ap_discount)',
        '- effect_bonus: attack=0, pierce_attack=0, multi_attack=8, heal=3, buff_self=5, buff_party=5, debuff_enemy=5, aoe_attack=8',
        '- ap_discount: ap_cost≤1→+5, ap_cost=2→0, ap_cost=3→-1, ap_cost≥4→-3',
        '',
        '### 報酬制限:',
        '- 報酬アイテム: 最大3個',
        '- 報酬スキルカード: 最大1枚',
        '- gold/exp は固定値（gold=50, exp=30）のため指定不可',
        '- reputation, alignment_shift も指定不可',
        '',
        '**consumed_points ≤ total_points を満たすこと。**',
      ].join('\n');

    case 'skill_card':
      return [
        '## バランスルール',
        '',
        '- power: 1〜25（max_skill_power=25）',
        '- ap_cost: 1〜5',
        '- 許可されたeffect_id: ' + ALLOWED_SKILL_EFFECTS.join(', '),
        '- 禁止されたeffect: ' + FORBIDDEN_SKILL_EFFECTS.join(', '),
      ].join('\n');

    case 'item':
      return [
        '## バランスルール',
        '',
        '- type: consumable（消費アイテム）または trade_good（交易品）',
        '- base_price: 固定値1（変更不可）',
        '- rarity: common / uncommon / rare',
        '- heal_hp: 1〜200（consumableのみ）',
        '- cure_status: boolean（consumableのみ）',
        '- restore_vitality は禁止',
      ].join('\n');
  }
}

// ── フィールド定義 ───────────────────────────────────────────────────────────

function getFieldSpec(type: PromptTemplateType): string {
  switch (type) {
    case 'enemy':
      return [
        '## フィールド定義（enemy）',
        '',
        '| フィールド | 型 | 必須 | 制約 | デフォルト |',
        '|---|---|---|---|---|',
        '| name | string | ✅ | 1〜20文字 | - |',
        '| level | int | ✅ | 1〜50 | - |',
        '| hp | int | ✅ | 1〜9999 | - |',
        '| atk | int | ✅ | 0〜99 | - |',
        '| def | int | ✅ | 0〜99 | - |',
        '| skills | string[] | - | 最大10個 | [] |',
        '| action_pattern | ActionPattern[] | - | 最大10個 | - |',
        '| image_url | string | - | "ugc://..." or "" | - |',
        '| flavor_text | string | - | 最大200文字 | - |',
        '| asset_type | "enemy" \\| "npc_companion" | - | - | "enemy" |',
        '',
        '### ActionPattern:',
        '| フィールド | 型 | 必須 | 制約 |',
        '|---|---|---|---|',
        '| skill | string | ✅ | スキル名 |',
        '| prob | int | ✅ | 1〜100 |',
        '| condition | string | - | "hp_under_50", "hp_under_25", "turn_mod_3", "" |',
      ].join('\n');

    case 'item':
      return [
        '## フィールド定義（item）',
        '',
        '| フィールド | 型 | 必須 | 制約 | デフォルト |',
        '|---|---|---|---|---|',
        '| name | string | ✅ | 1〜20文字 | - |',
        '| type | "consumable" \\| "trade_good" | ✅ | - | - |',
        '| sub_type | string | - | 任意サブタイプ | - |',
        '| description | string | - | 最大100文字 | "" |',
        '| base_price | 1 | - | 固定値1 | 1 |',
        '| effect_data.heal_hp | int | - | 1〜200 | - |',
        '| effect_data.cure_status | boolean | - | - | - |',
        '| rarity | "common" \\| "uncommon" \\| "rare" | - | - | "common" |',
        '| use_timing | "battle" \\| "field" | - | - | - |',
        '| image_url | string | - | "ugc://..." or "" | - |',
      ].join('\n');

    case 'skill_card':
      return [
        '## フィールド定義（skill_card）',
        '',
        '| フィールド | 型 | 必須 | 制約 | デフォルト |',
        '|---|---|---|---|---|',
        '| name | string | ✅ | 1〜20文字 | - |',
        '| power | int | ✅ | 1〜25 | - |',
        '| ap_cost | int | ✅ | 1〜5 | - |',
        '| target_type | enum | ✅ | "single_enemy", "all_enemies", "self", "single_ally" | - |',
        '| effect_id | enum | ✅ | ' + ALLOWED_SKILL_EFFECTS.join(', ') + ' | - |',
        '| effect_duration | int | - | 0〜3 | 0 |',
        '| description | string | - | 最大100文字 | "" |',
        '| image_url | string | - | "ugc://..." or "" | - |',
      ].join('\n');

    case 'npc':
      return [
        '## フィールド定義（npc）',
        '',
        '| フィールド | 型 | 必須 | 制約 | デフォルト |',
        '|---|---|---|---|---|',
        '| name | string | ✅ | 1〜20文字 | - |',
        '| level | int | ✅ | 1〜50 | - |',
        '| atk | int | ✅ | 0〜99 | - |',
        '| def | int | ✅ | 0〜99 | - |',
        '| durability | int | ✅ | 1〜999 | - |',
        '| cover_rate | int | ✅ | 0〜100 | - |',
        '| ai_role | "striker" \\| "guardian" \\| "medic" | - | - | "striker" |',
        '| ai_grade | "random" | - | 固定値 | "random" |',
        '| signature_skills | string[] | - | 最大5個 | [] |',
        '| image_url | string | - | "ugc://..." or "" | - |',
        '| flavor_text | string | - | 最大200文字 | - |',
        '| is_escort | boolean | - | 護衛対象フラグ | false |',
      ].join('\n');

    case 'quest':
      return [
        '## フィールド定義（quest）',
        '',
        '### 基本情報:',
        '| フィールド | 型 | 必須 | 制約 | デフォルト |',
        '|---|---|---|---|---|',
        '| title | string | ✅ | 1〜30文字 | - |',
        '| short_description | string | ✅ | 1〜40文字 | - |',
        '| full_description | string | - | 最大500文字 | - |',
        '| client_name | string | - | 最大20文字 | "謎の依頼人" |',
        '| scenario_type | enum | - | ' + SCENARIO_TYPES.join(', ') + ' | "Other" |',
        '| difficulty | int | - | 1〜10 | 1 |',
        '| rec_level | int | - | 1〜50 | 1 |',
        '| days_success | int | - | 1〜10 | 1 |',
        '| days_failure | int | - | 1〜10 | 1 |',
        '',
        '### 受注条件 (conditions):',
        '| フィールド | 型 | 制約 |',
        '|---|---|---|',
        '| min_align_order_pct | number | 0〜100 |',
        '| min_align_chaos_pct | number | 0〜100 |',
        '| min_align_justice_pct | number | 0〜100 |',
        '| min_align_evil_pct | number | 0〜100 |',
        '',
        '### 報酬 (rewards):',
        '- items: UgcItemData[]（最大3個）',
        '- skill_card: UgcSkillCardData（最大1枚）',
        '- gold, exp, reputation, alignment_shift は指定不可（サーバー側で固定）',
        '',
        '### ノード (nodes): 1〜100個',
        '',
        '| フィールド | 型 | 必須 | 制約 |',
        '|---|---|---|---|',
        '| id | string | ✅ | ユニークID |',
        '| type | enum | ✅ | ' + NODE_TYPES.join(', ') + ' |',
        '| text | string | - | 最大2000文字（テキスト表示内容） |',
        '| speaker_name | string | - | 最大20文字 |',
        '| speaker_image_url | string | - | 画像キー |',
        '| bg_key | string | - | 背景キー |',
        '| bgm_key | string | - | BGMキー |',
        '| se_key | string | - | SEキー |',
        '| choices | Choice[] | - | 最大5個（label: 1〜40文字, next: 遷移先ノードID） |',
        '| next | string | - | 自動進行先ノードID |',
        '| enemyData | EnemyData | - | battleノード時に指定 |',
        '| npcData | NpcData | - | npc_joinノード時に指定 |',
        '| delivery_item | string | - | deliveryノード時に指定 |',
        '| delivery_count | int | - | deliveryノード時（1以上） |',
        '| probability | int | - | random_branchノード時（1〜99） |',
        '| trap_damage_pct | int | - | trapノード時（1〜100, HP%ダメージ） |',
        '',
        '### ノードタイプ説明:',
        '- **text**: テキスト表示。choices で選択肢分岐、または next で自動進行。',
        '- **battle**: 戦闘。enemyData にエネミー定義を含める。',
        '- **npc_join**: NPC加入。npcData にNPC定義を含める。',
        '- **npc_leave**: NPC離脱。',
        '- **delivery**: 納品。delivery_item, delivery_count を指定。',
        '- **random_branch**: ランダム分岐。probability(%) で next へ、残りは choices[0].next へ。',
        '- **trap**: 罠。trap_damage_pct でHP%ダメージ。',
        '- **success**: クエスト成功終端ノード。',
        '- **failure**: クエスト失敗終端ノード。',
      ].join('\n');
  }
}

// ── JSONサンプル ─────────────────────────────────────────────────────────────

function getJsonExample(type: PromptTemplateType): string {
  switch (type) {
    case 'enemy':
      return JSON.stringify({
        $template: TEMPLATE_MARKER,
        version: TEMPLATE_VERSION,
        type: 'enemy',
        enemy: {
          name: '腐敗の騎士',
          level: 10,
          hp: 30,
          atk: 10,
          def: 5,
          skills: ['aoe_slash'],
          action_pattern: [
            { skill: 'aoe_slash', prob: 40, condition: 'hp_under_50' },
          ],
          flavor_text: '朽ちた鎧に宿る怨念',
          asset_type: 'enemy',
        },
      }, null, 2);

    case 'item':
      return JSON.stringify({
        $template: TEMPLATE_MARKER,
        version: TEMPLATE_VERSION,
        type: 'item',
        item: {
          name: '月光草',
          type: 'consumable',
          description: 'ほのかに光る薬草',
          base_price: 1,
          effect_data: { heal_hp: 50 },
          rarity: 'uncommon',
          use_timing: 'field',
        },
      }, null, 2);

    case 'skill_card':
      return JSON.stringify({
        $template: TEMPLATE_MARKER,
        version: TEMPLATE_VERSION,
        type: 'skill_card',
        card: {
          name: '暗黒斬',
          power: 15,
          ap_cost: 2,
          target_type: 'single_enemy',
          effect_id: 'attack',
          effect_duration: 0,
          description: '闇を纏った一撃',
        },
      }, null, 2);

    case 'npc':
      return JSON.stringify({
        $template: TEMPLATE_MARKER,
        version: TEMPLATE_VERSION,
        type: 'npc',
        npc: {
          name: '聖騎士エルザ',
          level: 10,
          atk: 8,
          def: 5,
          durability: 100,
          cover_rate: 20,
          ai_role: 'guardian',
          ai_grade: 'random',
          signature_skills: ['shield_bash', 'heal'],
          flavor_text: '正義を信じる若き騎士',
          is_escort: false,
        },
      }, null, 2);

    case 'quest':
      return JSON.stringify({
        version: TEMPLATE_VERSION,
        type: 'quest',
        title: '腐敗の森の討伐',
        short_description: '森に巣食う魔物を討伐せよ',
        full_description: '交易路近くの森に腐敗の騎士が出現。旅商人たちが被害を受けている。',
        client_name: '旅商人ギルド',
        scenario_type: 'Subjugation',
        difficulty: 3,
        rec_level: 10,
        days_success: 2,
        days_failure: 1,
        rewards: {
          items: [
            { name: '月光草', type: 'consumable', description: '回復草', base_price: 1, effect_data: { heal_hp: 50 }, rarity: 'common' },
          ],
        },
        nodes: [
          { id: 'start', type: 'text', text: '森の入口に到着した。奥から不穏な気配がする。', next: 'battle1' },
          { id: 'battle1', type: 'battle', text: '腐敗の騎士が現れた！', enemyData: { name: '腐敗の騎士', level: 10, hp: 30, atk: 10, def: 5, skills: ['aoe_slash'] }, next: 'end' },
          { id: 'end', type: 'success', text: '森に平穏が戻った。' },
        ],
      }, null, 2);
  }
}

// ── MDサンプル ───────────────────────────────────────────────────────────────

function getMdExample(type: PromptTemplateType): string {
  switch (type) {
    case 'enemy':
      return [
        '---',
        `version: "${TEMPLATE_VERSION}"`,
        'type: enemy',
        '---',
        '',
        '# エネミー: 腐敗の騎士',
        '',
        '- level: 10',
        '- hp: 30',
        '- atk: 10',
        '- def: 5',
        '- skills: aoe_slash',
        '- asset_type: enemy',
        '',
        '## アクションパターン',
        '',
        '| skill | prob | condition |',
        '|---|---|---|',
        '| aoe_slash | 40 | hp_under_50 |',
        '',
        '> 朽ちた鎧に宿る怨念',
      ].join('\n');

    case 'item':
      return [
        '---',
        `version: "${TEMPLATE_VERSION}"`,
        'type: item',
        '---',
        '',
        '# アイテム: 月光草',
        '',
        '- type: consumable',
        '- description: ほのかに光る薬草',
        '- base_price: 1',
        '- rarity: uncommon',
        '- use_timing: field',
        '',
        '## 効果',
        '',
        '- heal_hp: 50',
      ].join('\n');

    case 'skill_card':
      return [
        '---',
        `version: "${TEMPLATE_VERSION}"`,
        'type: skill_card',
        '---',
        '',
        '# スキルカード: 暗黒斬',
        '',
        '- power: 15',
        '- ap_cost: 2',
        '- target_type: single_enemy',
        '- effect_id: attack',
        '- effect_duration: 0',
        '- description: 闇を纏った一撃',
      ].join('\n');

    case 'npc':
      return [
        '---',
        `version: "${TEMPLATE_VERSION}"`,
        'type: npc',
        '---',
        '',
        '# NPC: 聖騎士エルザ',
        '',
        '- level: 10',
        '- atk: 8',
        '- def: 5',
        '- durability: 100',
        '- cover_rate: 20',
        '- ai_role: guardian',
        '- ai_grade: random',
        '- signature_skills: shield_bash, heal',
        '- is_escort: false',
        '',
        '> 正義を信じる若き騎士',
      ].join('\n');

    case 'quest':
      return [
        '---',
        `version: "${TEMPLATE_VERSION}"`,
        'type: quest',
        'title: 腐敗の森の討伐',
        'short_description: 森に巣食う魔物を討伐せよ',
        'client_name: 旅商人ギルド',
        'scenario_type: Subjugation',
        'difficulty: 3',
        'rec_level: 10',
        'days_success: 2',
        'days_failure: 1',
        '---',
        '',
        '交易路近くの森に腐敗の騎士が出現。旅商人たちが被害を受けている。',
        '',
        '## 報酬',
        '',
        '### アイテム',
        '',
        '- 月光草 (consumable, common, heal_hp=50)',
        '',
        '## ノード',
        '',
        '### start [text]',
        '',
        '森の入口に到着した。奥から不穏な気配がする。',
        '',
        '→ next: battle1',
        '',
        '### battle1 [battle]',
        '',
        '腐敗の騎士が現れた！',
        '',
        '**enemy:** 腐敗の騎士 (Lv10, HP30, ATK10, DEF5, skills: aoe_slash)',
        '',
        '→ next: end',
        '',
        '### end [success]',
        '',
        '森に平穏が戻った。',
      ].join('\n');
  }
}

// ── 対話フロー ──────────────────────────────────────────────────────────────

function getConversationFlow(type: PromptTemplateType): string {
  const common = [
    '## 対話フロー',
    '',
    '以下の手順でユーザーと対話してテンプレートを作成してください:',
    '',
  ];

  switch (type) {
    case 'enemy':
      return [...common,
        '1. コンセプト確認: どんなエネミーを作りたいか（名前・テーマ・世界観）',
        '2. レベル設定: 難易度に応じたレベル（1〜50）を決定 → TP上限を提示',
        '3. ステータス配分: HP/ATK/DEF をTP上限内で調整',
        '4. スキル選択: 使用スキルとアクションパターンの設定',
        '5. フレーバーテキスト: 200文字以内の説明文',
        '6. 最終確認: TP消費量を計算して上限内であることを確認',
        '7. テンプレート出力: 指定フォーマットで完成テンプレートを出力',
      ].join('\n');

    case 'item':
      return [...common,
        '1. コンセプト確認: アイテムの名前・用途・テーマ',
        '2. タイプ選択: consumable（消費アイテム）/ trade_good（交易品）',
        '3. 効果設定: heal_hp / cure_status（consumableの場合）',
        '4. レアリティ: common / uncommon / rare',
        '5. 説明文: 100文字以内',
        '6. 最終確認とテンプレート出力',
      ].join('\n');

    case 'skill_card':
      return [...common,
        '1. コンセプト確認: スキル名・戦闘での役割',
        '2. 効果タイプ選択: 許可リストから effect_id を選択',
        '3. パラメータ設定: power(1〜25), ap_cost(1〜5), target_type',
        '4. 効果持続: effect_duration(0〜3ターン)',
        '5. 説明文: 100文字以内',
        '6. 最終確認とテンプレート出力',
      ].join('\n');

    case 'npc':
      return [...common,
        '1. コンセプト確認: NPC名・役割・性格',
        '2. レベル設定: 難易度に応じたレベル（1〜50）→ NP上限を提示',
        '3. AI役割: striker / guardian / medic',
        '4. ステータス配分: ATK/DEF/durability/cover_rate をNP上限内で調整',
        '5. スキル設定: signature_skills（最大5個）',
        '6. 護衛フラグ: is_escort の設定',
        '7. フレーバーテキスト: 200文字以内',
        '8. 最終確認: NP消費量の検証とテンプレート出力',
      ].join('\n');

    case 'quest':
      return [...common,
        '1. コンセプト確認: クエストのテーマ・ストーリー概要',
        '2. 基本情報: タイトル(30文字), 概要(40文字), scenario_type, difficulty, rec_level',
        '3. 依頼人: client_name の設定',
        '4. 受注条件: アライメント条件（任意）',
        '5. シナリオフロー: ノードを1つずつ作成',
        '   - 開始テキスト → 分岐 → 戦闘 → NPC加入 → etc. → 成功/失敗',
        '   - 各ノードで type, text, 遷移先を設定',
        '6. エネミー・NPC設計: battleノード/npc_joinノード内のデータをTP/NP上限内で設計',
        '7. 報酬設定: アイテム・スキルカードをPB上限内で設定',
        '8. 最終確認: PB計算の検証とテンプレート出力',
      ].join('\n');
  }
}

// ── メイン生成関数 ──────────────────────────────────────────────────────────

/**
 * 指定テンプレートタイプに対応するAI向けプロンプトガイドを生成する。
 *
 * @param type - テンプレートタイプ
 * @param outputFormat - 出力フォーマット（json または md）
 * @returns プロンプトテキスト（日本語）
 */
export function generatePromptGuide(
  type: PromptTemplateType,
  outputFormat: 'json' | 'md',
): string {
  const label = TYPE_LABELS[type];
  const formatLabel = outputFormat === 'json' ? 'JSON' : 'Markdown';
  const example = outputFormat === 'json' ? getJsonExample(type) : getMdExample(type);

  const sections: string[] = [
    // 1. ロール設定
    `# ${label}テンプレート作成ガイド`,
    '',
    ROLE_SETTING,
    '',
    `今回は「${label}」テンプレートを${formatLabel}形式で作成します。`,
    '',

    // 2. 共通ルール
    '## 共通ルール',
    '',
    `- テンプレートバージョン: "${TEMPLATE_VERSION}"`,
    `- テンプレートマーカー（JSONのみ）: "$template": "${TEMPLATE_MARKER}"`,
    `- type: "${type}"`,
    '- UGCクエスト受注最低レベル: 5',
    '- テンプレート最大サイズ: 200KB',
    '- 画像URL形式: "ugc://images/..." またはゲーム内キー',
    '',

    // 3. 許可スキル効果
    '## 許可されたスキル効果',
    '',
    ALLOWED_SKILL_EFFECTS.map(e => `- ${e}`).join('\n'),
    '',
    '## 禁止されたスキル効果（使用不可）',
    '',
    FORBIDDEN_SKILL_EFFECTS.map(e => `- ${e}`).join('\n'),
    '',

    // 4. フィールド定義
    getFieldSpec(type),
    '',

    // 5. バランスルール
    getBalanceRules(type),
    '',

    // 6. 対話フロー
    getConversationFlow(type),
    '',

    // 7. 出力フォーマット
    `## 出力フォーマット: ${formatLabel}`,
    '',
    `完成したテンプレートは以下の${formatLabel}形式で出力してください。`,
    'ユーザーが「インポート」タブからそのままインポートできる形式です。',
    '',
    '### 出力例:',
    '',
    '```' + (outputFormat === 'json' ? 'json' : 'markdown'),
    example,
    '```',
    '',

    // 8. 注意事項
    '## 注意事項',
    '',
    '- すべてのフィールド制約を厳密に守ってください。',
    '- バランス計算（TP/NP/PB）が上限を超えないよう確認してください。',
    '- 禁止されたスキル効果は絶対に使用しないでください。',
    '- image_url は空文字列("")で構いません（画像は後から設定可能）。',
    '- ユーザーの希望を聞きながら、ステップバイステップで作成を進めてください。',
    '- 最終出力の前に、バランス値の内訳を提示して確認を取ってください。',
  ];

  return sections.join('\n');
}
