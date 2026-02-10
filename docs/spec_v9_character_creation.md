2. Spec v8.2: Progression & Growth (Complete Version)
HPの上昇量を +5 から +10 に変更しました。これにより Lv20 で約 +200 され、合計 300HP に到達します。
# Code: Wirth-Dawn Specification v8.2: Progression & Growth

## 1. 概要 (Overview)
本ドキュメントは、キャラクターの**レベルアップ（成長）と経験値ロジック**の定義である。
HPのスケールを初期100/最大300程度と定義し、**「扱えるカード（戦術）の格」**と**「物理的な硬さ」**を拡張する一方で、**「寿命（Vitality）」は回復しない**という制約を維持する。

**Dependencies:**
*   `spec_v9_character_creation.md` (Initial Stats & Age Logic)
*   `spec_v2_battle_parameters.md` (Battle Logic & Vitality)

---

## 2. 成長パラメータ (Growth Parameters)

レベルアップ時に上昇するパラメータ定義。

### 2.1 Battle Stats (戦闘能力)
| Parameter | Increase | Description |
| :--- | :--- | :--- |
| **Max HP** | **+10 / Lv** | **耐久値の大幅向上。**<br>初期HP100に対し、Lv20で+190(合計290)となり、約3倍のタフネスを得る。<br>※宿屋で回復可能なHPのみ上昇する。 |
| **Deck Cost** | **+2 / Lv** | **[重要]** デッキに組み込めるカードの合計コスト上限。<br>Lv1では「銅の剣(Cost:1)」が主だが、成長すると「聖剣(Cost:5)」や「禁術(Cost:8)」を装備可能になる。 |
| **Defense (DEF)** | **+1 / 5 Lv** | **物理防御力。**<br>Lv 5, 10, 15, 20... の節目（Milestone）で上昇。<br>敵の物理攻撃ダメージを減算する（下限1）。 |
| **Hand Size** | **+1 (Lv10, 20)** | 初期手札枚数。事故率を下げ、コンボ成立率を高める。<br>Lv 1-9: 3枚 / Lv 10-19: 4枚 / Lv 20+: 5枚。 |

### 2.2 Social Stats (社会的影響力)
| Parameter | Increase | Description |
| :--- | :--- | :--- |
| **Royalty Cap** | **+1000G / Lv** | `spec_v7` で定義。<br>残影（Shadow）として他者に雇われた際に、1日で受け取れる報酬の上限額。 |
| **Prayer Potency** | **Scaling** | `spec_v1` で定義。<br>「祈り」を行った際の属性変動値（Impact Value）への係数。 |

### 2.3 Static Constraints (不変の制約)
以下のパラメータは、レベルアップによって**回復・上昇しない**。
*   **Current Vitality:** 若返ることはない。
*   **Max Vitality:** 寿命の総量は増えない（加齢による減少のみ）。

---

## 3. 経験値ロジック (EXP Logic)

### 3.1 経験値テーブル (Curve)
*   **Formula:** `NextLevelExp = 100 * (CurrentLevel ^ 2)`
*   **Phases:**
    *   **Lv 1-5 (Novice):** チュートリアル。HP 100 -> 140 急成長期。
    *   **Lv 6-20 (Adventurer):** 成長期。HP 150 -> 290。戦略の幅が広がる。
    *   **Lv 21+ (Heroic):** 熟練期。HP 300〜。ここからはエンドコンテンツ。

### 3.2 獲得ソース
*   **Quests:** 難易度に応じた固定値。
*   **Battle:** 敵ごとの `exp` 値。

---

## 4. デッキコストシステム (Deck Cost System)

### 4.1 データ構造拡張 (`items.csv`)
アイテム（スキルカード）定義に `cost` カラムを追加する。

| id | name | type | cost | effect |
| :--- | :--- | :--- | :--- | :--- |
| 3001 | 錆びた剣 | skill | **1** | Damage: 15 |
| 3005 | 近衛騎士の剣 | skill | **4** | Damage: 40, Bleed |
| 3036 | 禁術・血の契約 | skill | **8** | VitCost: 2, Damage: 150 |
*   ※ HP増加に伴い、カードのダメージ値もスケールアップさせる必要がある。

### 4.2 バリデーション
デッキ保存時にコスト上限チェックを行う。

---

## 5. UI/UX: Level Up Event

クエストリザルト画面にて、レベルアップが発生した場合の演出を定義する。

*   **Visual:** "LEVEL UP!" のカットイン演出。
*   **Feedback:**
    *   上昇したステータス（HP, Cost, DEF）の差分表示。
    *   **"MAX HP +10"** を強調表示。
*   **Warning:** 画面の隅に現在のVitalityを表示する。

---

## 6. Antigravity Implementation Tasks

### Task 1: Constants & Schema Update
*   `src/constants/game_rules.ts` の定数を更新。
    *   **`HP_PER_LEVEL = 10`**
    *   `COST_PER_LEVEL = 2`
*   `items` テーブル（およびCSV）に `cost` (Int) カラムを追加。

### Task 2: Level Up Logic (`POST /api/quest/complete`)
*   レベルアップ時、`max_hp` を再計算 (`InitialHP + (Level-1)*10`) し、現在HPを最大まで回復する。
*   `vitality` は回復させない。