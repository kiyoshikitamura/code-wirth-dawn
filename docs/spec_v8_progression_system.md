初期値の定義を spec_v9 (年齢システム) に委譲し、防御力 (DEF) の成長ルールを追加しました。
# Code: Wirth-Dawn Specification v8.1: Progression & Growth

## 1. 概要 (Overview)
本ドキュメントは、キャラクターの**レベルアップ（成長）と経験値ロジック**の定義である。
Code: Wirth-Dawn におけるレベルアップは、単なるステータスのインフレではない。**「扱えるカード（戦術）の格」**と**「物理的な硬さ」**を拡張する一方で、**「寿命（Vitality）」は回復しない**という制約を維持し、「強くなるほど死に近づく」ゲーム性を担保する。

**Dependencies:**
*   `spec_v9_character_creation.md` (Initial Stats & Age Logic)
*   `spec_v2_battle_parameters.md` (Battle Logic & Vitality)

---

## 2. 成長パラメータ (Growth Parameters)

レベルアップ時に上昇するパラメータ定義。
※初期値（Base Stats）は `spec_v9` に基づき、年齢とランダム性によって決定される。

### 2.1 Battle Stats (戦闘能力)
| Parameter | Increase | Description |
| :--- | :--- | :--- |
| **Max HP** | **+5 / Lv** | 戦闘ごとの耐久値。高難易度クエストに耐えるための基礎体力。<br>※宿屋で回復可能なHPのみ上昇する。 |
| **Deck Cost** | **+2 / Lv** | **[重要]** デッキに組み込めるカードの合計コスト上限。<br>Lv1では「銅の剣(Cost:1)」が主だが、成長すると「聖剣(Cost:5)」や「禁術(Cost:8)」を装備可能になる。 |
| **Defense (DEF)** | **+1 / 5 Lv** | **物理防御力。**<br>Lv 5, 10, 15, 20... の節目（Milestone）で上昇。<br>敵の物理攻撃ダメージを減算する（下限1）。 |
| **Hand Size** | **+1 (Lv10, 20)** | 初期手札枚数。事故率を下げ、コンボ成立率を高める。<br>Lv 1-9: 3枚 / Lv 10-19: 4枚 / Lv 20+: 5枚。 |

### 2.2 Social Stats (社会的影響力)
| Parameter | Increase | Description |
| :--- | :--- | :--- |
| **Royalty Cap** | **+1000G / Lv** | `spec_v7` で定義。<br>残影（Shadow）として他者に雇われた際に、1日で受け取れる報酬の上限額。 |
| **Prayer Potency** | **Scaling** | `spec_v1` で定義。<br>「祈り」を行った際の属性変動値（Impact Value）への係数。<br>高レベルプレイヤーの祈りは、サーバー（神）に届きやすくなる。 |

### 2.3 Static Constraints (不変の制約)
以下のパラメータは、レベルアップによって**回復・上昇しない**。
*   **Current Vitality:** 若返ることはない。
*   **Max Vitality:** 寿命の総量は増えない（加齢による減少のみ）。

---

## 3. 経験値ロジック (EXP Logic)

### 3.1 経験値テーブル (Curve)
初期は早く、後半は「死ぬまでに次のレベルに到達できるか？」という緊張感を持たせる曲線とする。

*   **Formula:** `NextLevelExp = 100 * (CurrentLevel ^ 2)`
*   **Phases:**
    *   **Lv 1-5 (Novice):** チュートリアル期間。数クエストで上昇。
    *   **Lv 6-20 (Adventurer):** 成長期。Deck Costが増え、戦略が広がる期間。
    *   **Lv 21+ (Heroic):** 熟練期。成長鈍化。ここからは「英霊」としての資産価値を高めるエンドコンテンツ。

### 3.2 獲得ソース
*   **Quests:** `quests.days_success` や `difficulty` に応じて設定された固定値。
*   **Battle:** 敵ごとの `exp` 値（`enemies.csv` 参照）。

---

## 4. デッキコストシステム (Deck Cost System)

TCG的な「コスト制」を導入し、強力なカードの乱用を防ぐ。

### 4.1 データ構造拡張 (`items.csv`)
アイテム（スキルカード）定義に `cost` カラムを追加する。

| id | name | type | cost | effect |
| :--- | :--- | :--- | :--- | :--- |
| 3001 | 錆びた剣 | skill | **1** | Damage: 3 |
| 3005 | 近衛騎士の剣 | skill | **4** | Damage: 12, Bleed |
| 3036 | 禁術・血の契約 | skill | **8** | VitCost: 2, Damage: 50 |

### 4.2 バリデーション
デッキ保存時 (`POST /api/deck/save`)、以下の検証を行う。
```typescript
TotalCost = Sum(Card.cost for Card in NewDeck)
If (TotalCost > User.max_deck_cost) {
  Return Error("Cost Limit Exceeded");
}

--------------------------------------------------------------------------------
5. UI/UX: Level Up Event
クエストリザルト画面にて、レベルアップが発生した場合の演出を定義する。
• Visual: "LEVEL UP!" のカットイン演出。
• Feedback:
    ◦ 上昇したステータス（HP, Cost, DEF）の差分表示。
    ◦ "デッキコスト上限が {new_val} になりました。" というTips表示。
• Warning: 画面の隅に現在のVitalityを表示し、「力は増したが、死は近づいている」ことを暗に示唆する。
