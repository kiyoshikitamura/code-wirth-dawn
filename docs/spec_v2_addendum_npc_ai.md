Code: Wirth-Dawn Specification v2.4: Shadow/NPC AI Logic
1. 概要 (Overview)
本ドキュメントは、spec_v2.3（バトルシステム）および spec_v5（残影システム）の拡張定義である。 味方NPC（Shadow）および敵AIの具体的なカード選択ロジックとターゲット思考ルーチンを規定する。 特に、課金要素である「英霊（Heroic）」と無料の「一般（Active/System）」の間に行動パターンの格差を設け、資産価値を差別化する。
Dependencies:
• spec_v2_battle_parameters.md (AP System, Battle Core)
• spec_v5_shadow_system.md (Shadow Types, Signature Deck)

--------------------------------------------------------------------------------
2. NPCの行動原則 (Core Principles)
プレイヤーはランダムなドローに依存するが、NPCは**「信頼できる機能（Function）」**として振る舞うため、以下の独自ルールを持つ。
2.1 固定手札 (Fixed Hand)
• NPCは山札・捨て札を持たない。
• 登録された signature_deck（最大5枚）を、**「常に使用可能なスキルリスト」**として保持する。
• Cooldown: 同一ターン内で同じカードを複数回使用することはできない（1ターン1回制限）。
2.2 AP準拠 (AP Compliance)
• NPCもプレイヤー同様、Max 10 / Regen +5 のAPルールに従う。
• これにより、「毎ターン強力な魔法を連発する」といった壊れた挙動を防ぎ、「溜め（Wait）」の戦略性を生む。

--------------------------------------------------------------------------------
3. ロール定義 (Role Definitions)
NPCはステータスやデッキ構成に基づき、自動的に「ロール（役割）」が割り当てられる。これにより行動の優先順位（Priority）が変化する。
Role
判定基準 (Criteria)
行動優先度 (Priority)
Guardian (盾)
DEF >= 3 または cover_rate >= 30%
1. 挑発/防御バフ (Aggro/Buff)<br>2. 攻撃 (Attack)
Medic (回復)
デッキに Heal 系カードが含まれる
1. 瀕死の味方を回復 (Rescue)<br>2. 攻撃 (Attack)
Striker (攻撃)
上記以外
1. 敵を倒し切る (Kill Confirm)<br>2. 最大ダメージ (Max DPS)

--------------------------------------------------------------------------------
4. 意思決定アルゴリズム (Decision Logic)
NPCのターンが回ってきた際、以下のフェーズ順に評価を行い、行動を決定する。
Phase 1: リソース確認 (Resource Check)
• 現在の NPC.current_ap を確認。
• signature_deck の中から、コスト不足のカードを除外した「使用可能リスト」を作成する。
Phase 2: 緊急アクション (Emergency Check)
• Role: Medic の場合のみ発動。
• Condition: 味方（プレイヤーまたは他NPC）のHPが 50%以下 である。
• Action: 使用可能リストに回復カードがあれば、最優先で使用する。
Phase 3: "溜め" 判定 (The Wait Logic) - [Heroic Only]
英霊（Heroic）のみが持つ高度な思考ルーチン。
• Condition:
    1. 使用可能リストに有効打がない、またはAPが枯渇している。
    2. デッキ内に**「現在APでは使えないが、APが10あれば使える強力なカード（Cost 5など）」**が存在する。
• Action:
    ◦ Heroic (英霊): ターン終了 (Pass) を選択し、次ターンのためにAPを温存する。
    ◦ Normal (一般): 溜め行動を行わず、Phase 4へ進む（小技を無駄撃ちする）。
Phase 4: スキル選択 (Execution)
Phase 2, 3に該当しない場合、AP内で最も効率的な行動をとる。
• Logic:
    ◦ 使用可能リストを APコスト（＝威力目安）の高い順 にソートする。
    ◦ APが残る限り、上から順に使用を試みる。
    ◦ 例: APが6ある場合 → Cost 4の「強攻撃」を使用 → 残りAP 2 → Cost 1の「小攻撃」を使用 → 終了。

--------------------------------------------------------------------------------
5. ターゲット選択 (Targeting Logic)
攻撃スキルを使用する際、誰を狙うか。
5.1 Smart Targeting (Heroic / Boss Enemy)
• Kill Confirm: 現在HPが低く、この攻撃で確実に倒せる敵がいれば優先する。
• Weakness: 属性弱点を持つ敵がいれば優先する（未実装機能への布石）。
• Focus: ターゲットをコロコロ変えず、HPが減っている敵を集中攻撃する。
5.2 Random Targeting (Active Shadow / System NPC / Mob Enemy)
• 生存している敵の中から完全ランダムに選択する。

--------------------------------------------------------------------------------
6. Antigravity Implementation Tasks
Task 1: Schema Update (party_members)
NPCの思考パターンを決定するカラムを追加。
• ai_role: TEXT (Enum: 'striker', 'guardian', 'medic') - デフォルトはStriker。
• ai_grade: TEXT (Enum: 'smart', 'random')
    ◦ shadow_heroic は自動的に 'smart'。
    ◦ それ以外は 'random'。
Task 2: AI Engine Implementation (POST /api/battle/npc-turn)
バトルAPIにNPC行動処理を実装。
// 擬似コード: NPCターン処理
export function resolveNpcTurn(npc, battleState) {
  // 1. AP Recovery (+5, Max 10)
  npc.current_ap = Math.min(10, npc.current_ap + 5);
  
  // 2. Emergency Heal (Medic Only)
  if (npc.ai_role === 'medic') {
    const dangerAlly = findAllyBelowHP(battleState, 0.5);
    if (dangerAlly) {
       const healCard = findPlayableCard(npc, 'heal');
       if (healCard) return executeCard(npc, healCard, dangerAlly);
    }
  }

  // 3. Wait Logic (Smart AI Only)
  if (npc.ai_grade === 'smart') {
    const hasUltimate = npc.deck.some(c => c.ap_cost >= 5);
    if (hasUltimate && npc.current_ap < 5) {
      return passTurn(npc); // 溜める
    }
  }

  // 4. Aggressive Execution
  // コストが高い順にカードを使用
  const playableCards = npc.deck
    .filter(c => c.ap_cost <= npc.current_ap)
    .sort((a, b) => b.ap_cost - a.ap_cost);

  for (const card of playableCards) {
    const target = selectTarget(npc.ai_grade, battleState.enemies);
    executeCard(npc, card, target);
    npc.current_ap -= card.ap_cost;
    // 1ターン1回制限のため、ループはせず1枚使って終了か、AP余りなら連撃するかはバランス次第
    // 現状は「APが尽きるまで連撃」推奨
  }
}
Task 3: Deck Validation
• NPC登録時、デッキ枚数が0枚にならないようバリデーションを追加する。