# Code: Wirth-Dawn Specification v2.2: Battle System & Data Architecture

## 1. 概要 (Overview)
本仕様書は、Code: Wirth-Dawn のバトルシステムの定義である。
v2.2では、敵データ管理を**CSVベースのリレーショナル構造**へ移行し、**「防御力 (DEF) による軽減」「Deck Injection (異物混入)」「Meat Shield (NPCの盾)」**を中心とした戦略的戦闘を定義する。

---

## 2. データアーキテクチャ (Data Architecture)

敵データは4つのCSVファイルに分割管理し、インポート時に結合してDBへ格納する。

### 2.1 CSVファイル構成 (`src/data/csv/`)

| File Name | Description | Key Columns |
| :--- | :--- | :--- |
| **`enemies.csv`** | 敵の基本ステータス。 | `id`, `slug`, `hp`, `def` (NEW), `exp`, `drop_item_id` |
| **`enemy_skills.csv`** | 敵が使用するスキル定義。 | `id`, `slug`, `effect_type`, `value`, `inject_card_id` |
| **`enemy_actions.csv`** | 敵の行動ロジック（AI）。 | `id`, `enemy_slug`, `skill_slug`, `prob`, `condition_type` |
| **`enemy_groups.csv`** | 敵の編成パターン。 | `id`, `slug`, `members` (例: `"rat|rat|succubus"`) |

### 2.2 データベーススキーマ (`schema.sql`)

1.  **`enemies` Table**
    *   `def` (Int): 物理防御力。
    *   `action_pattern` (JSONB): `enemy_actions.csv` の内容を集約したAIロジック配列。
        *   Structure: `[{ "skill": "bite", "prob": 70, "condition": "target_gender:Male" }, ...]`
2.  **`enemy_skills` Table**
    *   `effect_type`: `damage` (物理), `magic` (魔法), `drain_vit` (寿命吸収), `inject` (カード混入), `buff`, `debuff`。

---

## 3. バトルロジック: AI & Deck Injection

### 3.1 敵AIの行動決定プロセス
1.  **Target Selection:** プレイヤーまたは生存NPCを仮ターゲットとする。
2.  **Condition Check:** `action_pattern` を順に走査。
    *   `condition` (例: `target_gender:Male`) がある場合、ターゲットと照合。
3.  **Skill Execution:** 条件に合致したスキルを実行。

### 3.2 Deck Injection (ノイズ混入)
敵のスキル効果が `inject` の場合、プレイヤーの**「山札 (Draw Pile)」**にマイナス効果カード（ノイズ）を強制追加する。
*   **例:** サキュバスの「誘惑」 → `Card: 9002 (魅了/行動不能)` を混入。

---

## 4. ダメージ解決プロセス (Damage Resolution)

### 4.1 Meat Shield (カバー判定)
敵の攻撃時、生存しているNPC（Durability > 0）が確率でプレイヤーを庇う。
```typescript
// NPCの cover_rate に基づく判定
if (Roll(100) < npc.cover_rate) Target = NPC;
4.2 ダメージ軽減と防御力 (Defense Mitigation)
確定したターゲットに対し、防御力 (DEF) によるダメージ軽減を行う。
1. Check Effect Type:
    ◦ damage (物理): 軽減対象。
    ◦ magic / penetrate: 防御無視（True Damage）。
    ◦ drain_vit: 防御無視かつ Vitality 直接攻撃。
2. Calculation:
    ◦ FinalDamage = Max(1, SkillValue - Target.DEF)
    ◦ ※どんなに防御が高くても、最低1ダメージは受ける。
4.3 ダメージ適用 (Apply)
• Target is NPC: NPC.durability -= FinalDamage
    ◦ If durability <= 0: 状態を DEAD に更新。バトルから除外。
• Target is Player:
    ◦ If drain_vit: Player.vitality -= SkillValue (防御不能な寿命ダメージ)
    ◦ Else: Player.hp -= FinalDamage

--------------------------------------------------------------------------------
5. プレイヤーリソース: The Life Cycle
5.1 Vitality (寿命)
回復不能なリソース。以下の要因でのみ減少する。
1. Direct Damage: drain_vit 属性の攻撃（吸血、儀式など）。
2. Forbidden Arts: 禁術カードの使用コスト。
3. Aging: spec_v9 に基づく、40歳以降の自然減少。
5.2 敗走処理 (Consequence)
HPが0になっても即ゲームオーバーではない。
1. 強制撤退: クエストは失敗扱い (EXIT_FAIL)。
2. Vitality Loss: 最大Vitalityが減少する（老化/後遺症）。