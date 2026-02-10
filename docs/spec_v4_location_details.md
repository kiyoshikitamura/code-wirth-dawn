これまでの議論と資料に基づき、拠点の詳細仕様（繁栄度、ビジュアル変化、復興ロジック、号外トリガー）をまとめた **`spec_v4_location_details.md`** を作成しました。

このファイルは、既存の `v1`（世界情勢）、`v2`（バトル）、`v3`（クエスト）の隙間を埋め、**「プレイヤーの行動が具体的にどう世界の見え方を変えるか」**をエンジニア（Antigravity）に指示するためのものです。

以下のテキストをコピーして使用してください。

***

# Code: Wirth-Dawn Specification v4.0: Location & Prosperity Mechanics

## 1. 概要 (Overview)
本ドキュメントは、`Code: Wirth-Dawn` における各拠点（Location）の動的な状態変化の詳細定義である。
`spec_v1` で定義された世界構造に基づき、**「繁栄度（Prosperity）」** が経済、ビジュアル、バトル、そしてSNS連動に与える具体的な影響と計算ロジックを規定する。

**Dependencies:**
- `spec_v1_world_system.md` (Nation & Attribute definitions)
- `spec_v2_battle_parameters.md` (Deck Injection logic)
- `spec_v3_quest_system.md` (Quest filtering logic)

---

## 2. 繁栄度レベル定義 (Prosperity Levels)

各拠点は `prosperity_level` (Int: 1-5) を持ち、この値によってゲーム体験が劇的に変化する。

| Lv | Name | State Description | Economy Impact | Battle Impact (Deck Injection) |
| :--- | :--- | :--- | :--- | :--- |
| **5** | **絶頂 (Zenith)** | **完全なる調和**<br>祝祭状態。支配国と民意が一致。 | **Bonus:** レアアイテム出現。<br>限定スキル販売。 | **Support:**<br>市民の支援カード（回復・バフ）がデッキに混ざる。 |
| **4** | **繁栄 (Prosperous)** | **安定**<br>標準状態。 | **Normal:**<br>標準価格。 | **None:**<br>影響なし。 |
| **3** | **停滞 (Stagnant)** | **陰り**<br>活気の低下。 | **Warning:**<br>品揃えが少し減る。 | **None:**<br>影響なし。 |
| **2** | **衰退 (Declining)** | **荒廃の予兆**<br>治安悪化。スラム化。 | **Inflation:**<br>価格 **x1.5**。<br>宿屋回復量低下。 | **Risk:**<br>低確率でノイズカードが混ざる可能性がある。 |
| **1** | **崩壊 (Ruined)** | **機能不全**<br>火災・瓦礫・無人化。 | **Collapse:**<br>ショップ利用不可。<br>闇市（Black Market）のみ。 | **Hazard:**<br>**Noise Cards** (`Fear`, `Debris`) が強制的にデッキに混入する。 |

---

## 3. 統治摩擦と変動ロジック (Alignment Friction Logic)

繁栄度はランダムではなく、**「支配国の思想」と「土地の民意」のズレ**によって計算される。

### 3.1 計算式
```typescript
// 24時間ごとのバッチ処理で計算
const friction = Math.abs(Nation.attributeValue - Location.currentAttributeValue);

// Threshold definitions (Example)
// Friction 0-20:  Trend towards Zenith (Lv5)
// Friction 21-50: Trend towards Prosperous (Lv4)
// Friction 51-80: Trend towards Declining (Lv2)
// Friction 81+:   Trend towards Ruined (Lv1)
```

### 3.2 復興と崩壊 (Recovery & Collapse)
*   **崩壊条件:** `Friction` が閾値を超え、かつ `Level` が 2 の状態で日付変更を迎えると `Level 1 (Ruined)` へ転落。
*   **復興条件:** プレイヤーの行動（クエスト/祈り）により `Friction` が緩和された場合、翌日に `Level 2` へ復帰する。

---

## 4. ビジュアル表現 (Visual Logic)

拠点の背景画像（`background_url`）は、**「支配国家 × 繁栄度」** のマトリクスで決定される。

### 4.1 Asset Naming Convention
`bg_{nation_id}_{prosperity_level}.png`
*   Example: `bg_holy_empire_ruined.png` (聖帝国支配下の崩壊した王都)
*   Example: `bg_marcund_zenith.png` (マルカンド支配下の絶頂期の市場)

### 4.2 Visual Elements
*   **Ruined:** 黒煙、瓦礫、火災、破損した建造物。空は暗い赤や灰色。
*   **Declining:** 落書き、ゴミ、ひび割れ。照明が暗い。
*   **Zenith:** 国旗の掲揚、紙吹雪、花火、明るい照明、多くのNPC。

---

## 5. SNS連動：号外システム (Extra Edition / News)

世界に**劇的な変化**があった場合、SNS（X）用のOG画像生成と投稿をトリガーする。

### 5.1 Trigger Conditions
以下のイベント発生時に `NewsLog` を作成し、Botが投稿を行う。

1.  **Collapse (崩壊):** `Lv 2` -> `Lv 1`
    *   *Headline:* "王都レガリア、炎上。統治機能喪失。"
    *   *Visual:* 炎上エフェクト + 警告色UI。
2.  **Recovery (復興):** `Lv 1` -> `Lv 2`
    *   *Headline:* "黄金都市、奇跡の復興。市場が再開。"
    *   *Visual:* 光のエフェクト + 復興した街並み。
3.  **Annexation (陥落/併合):** `Ruling Nation` Change
    *   *Headline:* "神都出雲、陥落。聖帝国の支配下に。"
    *   *Visual:* 旧国旗が燃え、新国旗が掲げられる演出。

### 5.2 Witness System (目撃者)
変化が発生したタイミングで、その拠点に `location_id` が一致していたプレイヤーに対し、リザルト画面等で「号外画像」を配布する。
*   *Metadata:* 画像には「目撃者: {PlayerName}」のクレジットを含める（Vercel OGで動的生成）。

---

## 6. Implementation Notes for Antigravity

### Database Update (`locations` table)
既存の `locations` テーブルに以下のカラムが存在することを確認、または追加すること。

```sql
ALTER TABLE locations ADD COLUMN IF NOT EXISTS prosperity_level INT DEFAULT 4 CHECK (prosperity_level BETWEEN 1 AND 5);
ALTER TABLE locations ADD COLUMN IF NOT EXISTS last_friction_score INT DEFAULT 0;
```

### Logic Requirements
1.  **Shop API:** 商品リスト取得時、`prosperity_level` をチェックし、価格係数（Inflation Rate）を適用すること。
2.  **Deck Initialization:** バトル開始時、`prosperity_level` に応じて `inject_cards` (Support or Noise) を追加すること。
3.  **Visual Component:** フロントエンドの `<LocationBackground />` コンポーネントは、Nation ID と Prosperity Level を受け取り、適切な画像をレンダリングすること。

***
