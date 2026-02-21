Code: Wirth-Dawn Specification v8.1: Progression & Growth
1. 概要 (Overview)
本ドキュメントは、キャラクターのレベルアップ（成長）と経験値ロジックの定義である。 Code: Wirth-Dawn におけるレベルアップは、単なるステータスのインフレではない。「扱えるカード（戦術）の格」「世界への影響力」を広げる手段であり、「寿命（Vitality）」は回復しないという制約を維持する。
v8.1では、基礎攻撃力（ATK）と防御力（DEF）の成長限界を定義し、装備（カード）依存のバランスを維持しつつ、長期的な育成の意義を持たせる。
Dependencies:
• spec_v2_battle_parameters.md (Battle Logic & Stats)
• spec_v3_quest_system.md (Quest Experience)
• spec_v7_lifecycle_economy.md (Lifecycle)
• spec_v9_character_creation.md (Initial Stats)

--------------------------------------------------------------------------------
2. 成長パラメータ (Growth Parameters)
レベルアップ時に変動するパラメータは、主に「許容量（Capacity）」と「影響力（Influence）」である。 基礎ステータスの成長は非常に緩やかであり、上限（Cap）が存在する。
2.1 Battle Stats (戦闘能力)
Parameter
Increase Logic
Cap (Max)
Description
Max HP
+5 / Lv
999
戦闘ごとの耐久値。高難易度クエスト（敵攻撃力増）に耐えるための基礎体力。<br>※宿屋で回復可能なHPのみ上昇する。
Deck Cost
+2 / Lv
99
[重要] デッキに組み込めるカードの合計コスト上限。<br>Lv1では「銅の剣(Cost:1)」程度だが、成長すると「聖剣(Cost:5)」や「禁術(Cost:8)」を装備可能になる。
Base ATK
+1 / 3 Levels
15
基礎攻撃力。<br>Lv 3, 6, 9... のタイミングで上昇する。<br>成長は遅いが、カード威力への底上げとなる。
Base DEF
+1 / 3 Levels
15
基礎防御力。<br>Lv 3, 6, 9... のタイミングで上昇する。<br>初期値(1-5)に加え、最大でも15までしか成長しない。
Hand Size
+1 (Lv10, 20)
5
初期手札枚数。事故率を下げ、コンボ成立率を高める。<br>Lv 1-9: 3枚 / Lv 10-19: 4枚 / Lv 20+: 5枚。
2.2 Social Stats (社会的影響力)
Parameter
Increase Logic
Description
Royalty Cap
+1000G / Lv
spec_v7 で定義。<br>残影（Shadow）として他者に雇われた際に、1日で受け取れる報酬の上限額。<br>高レベルであるほど、放置収益（不労所得）の枠が広がる。
Prayer Potency
Scaling
spec_v1 で定義。<br>「祈り」を行った際の属性変動値（Impact Value）への係数。<br>高レベルプレイヤーの祈りは、サーバー（神）に届きやすくなる。
2.3 Static Constraints (不変の制約)
以下のパラメータは、レベルアップによって回復・上昇しない。
• Current Vitality: 若返ることはない。
• Max Vitality: 寿命の総量は増えない（ごく微量の補正を除く）。

--------------------------------------------------------------------------------
3. 経験値ロジック (EXP Logic)
3.1 経験値テーブル (Curve)
初期は早く、後半は「死ぬまでに次のレベルに到達できるか？」という緊張感を持たせる曲線とする。
• Formula: NextLevelExp = Base * (CurrentLevel ^ 2)
• Phases:
    ◦ Lv 1-5 (Novice): チュートリアル期間。数クエストで上昇。spec_v7 の「初心者の加護」適用期間。
    ◦ Lv 6-20 (Adventurer): 成長期。Deck Costが増え、戦略が広がる楽しさを感じる期間。
    ◦ Lv 21+ (Heroic): 熟練期。成長鈍化。ここからは「英霊（Shadow Heroic）」としての資産価値を高めるためのエンドコンテンツ。
3.2 獲得ソース
• Quests: quests.days_success や difficulty に応じて設定された固定値。
• Battle: 敵ごとの exp 値（enemies.csv 参照）。

--------------------------------------------------------------------------------
4. デッキコストシステム (Deck Cost System)
TCG的な「コスト制」を導入し、強力なカードの乱用を防ぐ。
4.1 データ構造拡張 (items.csv)
アイテム（スキルカード）定義に cost カラムを追加する。
id
name
type
cost
effect
3001
錆びた剣
skill
1
Damage: 3
3005
近衛騎士の剣
skill
4
Damage: 12, Bleed
3036
禁術・血の契約
skill
8
VitCost: 2, Damage: 50
4.2 バリデーション
デッキ保存時 (POST /api/deck/save)、以下の検証を行う。
TotalCost = Sum(Card.cost for Card in NewDeck)
If (TotalCost > User.max_deck_cost) {
  Return Error("Cost Limit Exceeded");
}

--------------------------------------------------------------------------------
5. UI/UX: Level Up Event
クエストリザルト画面にて、レベルアップが発生した場合の演出を定義する。
• Visual: "LEVEL UP!" のカットイン演出。
• Feedback:
    ◦ 上昇したステータス（HP, Cost）の差分表示。
    ◦ ATK/DEF上昇時: 「身体のキレが増した (ATK +1)」等の特別なメッセージを表示。
    ◦ Tips: "デッキコスト上限が {n} になりました。より強力なカードを装備できます。"
• Warning: 画面の隅に現在のVitalityを表示し、「力は増したが、死は近づいている」ことを暗に示唆する。

--------------------------------------------------------------------------------
6. Antigravity Implementation Tasks
Task 1: Constants & Schema Update
• src/constants/game_rules.ts に成長定数を定義すること。
    ◦ BASE_HP = 20, HP_PER_LEVEL = 5
    ◦ BASE_DECK_COST = 10, COST_PER_LEVEL = 2
    ◦ MAX_ATK = 15, MAX_DEF = 15
• user_profiles テーブルに atk (Int), def (Int) カラムを追加すること。
Task 2: Level Up Logic (checkLevelUp)
POST /api/quest/complete 内のレベルアップ処理に以下のロジックを実装する。
1. level インクリメント。
2. max_hp 再計算 & hp を最大値まで回復（Vitalityは回復しない）。
3. max_deck_cost 再計算。
4. ATK/DEF Growth Check:
5. レスポンスの level_up_info オブジェクトに atk_increase, def_increase (boolean or int) を含める。
Task 3: Deck Builder API (POST /api/deck/save)
• クライアントから送信されたカードリストに対し、max_deck_cost 以内に収まっているかのバリデーションロジックを追加すること。