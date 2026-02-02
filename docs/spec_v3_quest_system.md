これまでの議論と、直前のクエスト仕様の検討内容を統合し、Antigravity（AIエンジニア）に実装を指示するためのMarkdownファイルを作成しました。

ファイル名は、以前のバージョン（`spec_v2_parameters.md`）に続く形で **`spec_v3_quest_system.md`** としています。

このままコピーしてAIエージェントに渡してください。

***

# Code: Wirth-Dawn Specification v3.0: Quest & Scenario System

## 1. 概要 (Overview)
本ドキュメントは、`Code: Wirth-Dawn` におけるクエスト（シナリオ）システムの実装仕様書である。
**『CardWirth』の「手札による解決」**と、**『Lunatic Dawn』の「世界への物理的干渉・背徳の自由」**を融合し、プレイヤーの行動が翌日の「世界変遷（World State）」へ直接フィードバックされる構造を定義する。

---

## 2. クエスト出現ロジック (Emergence Logic)
クエストは常設リストではなく、**「世界の状態」と「個人の資格」が合致した瞬間**にのみ出現する動的なオブジェクトである。

### 2.1 World State Filters (環境要因)
`scenarios` テーブルへのクエリ時、以下の条件でフィルタリングを行う。

| Parameter | Description | Logic Example |
| :--- | :--- | :--- |
| `ruling_nation_id` | **支配国家** | 聖帝国支配下の街では「異端審問」が発生する。<br>`WHERE ruling_nation = 'loc_holy_empire'` |
| `prosperity_level` | **繁栄度** | 繁栄(`Zenith`)時は「祝祭」、崩壊(`Ruined`)時は「暴動鎮圧」や「復興支援」が発生。<br>`WHERE min_prosperity <= current_level` |
| `alignment_friction` | **属性摩擦** | 土地と支配国の属性が乖離している場合、「レジスタンス支援」が発生。 |

### 2.2 User Qualification Filters (個人資格)
プレイヤーのパラメータ（`user_profiles`）と照合する。

| Parameter | Description | Logic Example |
| :--- | :--- | :--- |
| `recommended_level` | **推奨レベル** | 推奨Lv未満でも受注可能だが、**Risk Warning**を表示し、敵ステータスに補正(Buff)をかける。 |
| `reputation` | **地域名声** | 名声が高いと「王家の依頼」、低いと「裏社会の依頼」が出現。<br>`WHERE required_reputation <= user_reputation[loc_id]` |
| `inventory_tags` | **所持品/スキル** | **[CW Element]** 特定のスキルタグ（例: `tag:ancient_read`）やキーアイテム所持者のみに開示される依頼。 |
| `gender/origin` | **身体的条件** | `Gender: Female` 限定の潜入任務など。 |

---

## 3. シナリオ構造とBYORK (Scenario Structure)

シナリオデータは論理構造設計ツール「BYORK」互換のJSONで管理され、以下の分岐機能を持つ。

### 3.1 Scenario Data Schema (JSON)
```typescript
interface Scenario {
  id: string;
  title: string;
  type: 'Subjugation' | 'Delivery' | 'Politics' | 'Dungeon';
  time_cost: number; // 経過日数 (Age加算)
  
  // 受注条件 (Visibility)
  conditions: {
    locations: string[]; // 発生拠点ID
    min_level: number;
    required_tags: string[]; // e.g., ['skill_unlock', 'item_royal_pass']
    alignment_filter: { justice: number }; // e.g., Justice > 20 only
  };

  // 分岐フロー (Flow)
  flow_nodes: [
    {
      id: "node_1",
      text: "重い扉が閉ざされている。",
      choices: [
        { 
          label: "鍵開けスキルを使う", 
          req_tag: "skill_picklock", // 手札/デッキに対象カードがあれば成功
          next_node: "node_success" 
        },
        { 
          label: "強行突破 (Vitality消費)", 
          cost_vitality: 5, 
          next_node: "node_forced" 
        }
      ]
    }
  ];
}
```

### 3.2 自由と背徳 (Freedom & Betrayal)
**[LD Element]** 「運搬」や「護衛」クエストにおいて、システム的な「裏切り」を選択肢として実装する。

*   **配達クエスト:** 「荷物を届ける」だけでなく「荷物を盗んで売り払う」選択肢を用意。
    *   **Result:** 報酬(Gold)は増えるが、`Alignment: Evil` が大幅上昇し、依頼元の街での `Reputation` が地に落ちる。

---

## 4. 報酬と代償 (Rewards & Consequences)
報酬はゴールドだけでなく、プレイヤーのパラメータと世界の状態（World State）を書き換える。

### 4.1 報酬 (Rewards)
| Type | Description |
| :--- | :--- |
| `gold` / `items` | 通常報酬。崩壊した街では現物支給（食料等）になる場合がある。 |
| `alignment_shift` | `{order: +5, chaos: -2}` 等。解決手段（正攻法か、暗殺か）によって変動する。 |
| `reputation_diff` | **重要:** 依頼達成地の名声は上がるが、敵対勢力の街での名声は下がる（相対評価）。 |
| `world_impact` | **[Core Feature]** `{ target_loc: "loc_A", attribute: "order", value: 10 }`<br>クリア回数がサーバーに集計され、翌日の領土拡大判定に寄与する。 |

### 4.2 代償 (Costs & Risks)
*   **Time (Age):** 依頼には `time_cost` が設定されており、受注と移動で確実に加齢が進む。
*   **Vitality (Life):**
    *   戦闘での禁術使用時。
    *   シナリオ内の罠（Trap）失敗時。
    *   **これらはHPダメージではなく、回復不能な寿命の減少として処理される。**

---

## 5. UI/UX Requirements
*   **宿屋 (Quest Board):**
    *   依頼リストには、金銭的報酬だけでなく「どの国の勢力が拡大するか（World Impact）」をアイコンで明示すること。
*   **スキル判定演出:**
    *   シナリオ中の選択肢でスキル（例: `skill_picklock`）を使用する際、デッキからカードが「切られる」アニメーションを入れること。

---

## 6. Implementation Steps for Antigravity

1.  **DB Update:** `scenarios` テーブルを作成し、`conditions` (JSONB) と `rewards` (JSONB) カラムを定義。
2.  **Logic:** `QuestFinder` サービスを実装。ユーザーの `inventory` (tags) と `world_states` を照合してクエリをフィルタリングする機能。
3.  **Client:** 選択肢分岐において `InventoryCheck` を行い、特定のカード所持時のみボタンをActiveにするロジックの実装。