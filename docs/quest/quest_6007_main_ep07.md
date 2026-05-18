# クエスト仕様書：6007 — 第7話「異国の門」

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6007 |
| **Slug** | `main_ep07` |
| **クエスト種別** | メインエピソード（Main） |
| **推奨レベル** | 7 |
| **特記** | 分岐あり（機密書 / 傭兵）。機密書ルートは modify_reputation -30 |

---

## 2. 報酬定義
```
Exp:180|Gold:300|Rep:10|Order:5
```

---

## 3. シナリオノード構成（34ノード）

### 全体フロー
```text
start → start_02 → gate_01 → gate_02
  → doc_01 → doc_02 → guard_01 → guard_02 → choice1
    ├─「機密書を渡す」→ betray_01〜betray_04 → betray_rep(-30) → end_betray
    └─「傭兵として雇ってくれ」→ normal_01 → normal_02 → tengu_01〜tengu_04
      → battle(205) → choice2 → dead_01〜dead_04 → end_node
```

### ノード詳細

#### `start`〜`guard_02`— BGM: `bgm_quest_mystery` / 背景: `bg_bandit_camp`
夜刀神国の関所。通行証なし。兵士の遺した機密書を所持。

#### `choice1`（分岐）
| ラベル | 次ノード |
|--------|----------|
| 「機密書を渡すので通してくれ」 | `betray_01` |
| 「傭兵として雇ってくれ」 | `normal_01` |

#### 機密書ルート
- `betray_01`〜`betray_04`: 死者の想いを安全と引き換えにした罪悪感。
- `betray_rep`（type: modify_reputation, amount: -30）
- `end_betray`（type: end_success）

#### 傭兵ルート
- `normal_01`〜`tengu_04`: 裏山の天狗退治の依頼。
- `battle`（type: battle）— enemy_group_id: `205`
- `dead_01`〜`dead_04`: 天狗の羽を持ち帰り腕を認められ通過。
- `end_node`（type: end_success）
