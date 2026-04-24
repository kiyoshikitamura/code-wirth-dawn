# クエスト仕様書：7021 — 幻覚サソリの毒針調達

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7021 |
| **Slug** | `qst_mar_scorpion` |
| **クエスト種別** | マルカンドクエスト（Markand） |
| **推奨レベル** | 5（Normal） |
| **難度** | 2 |
| **依頼主** | 闇商人 |
| **出現条件** | 制限なし / 出現拠点: loc_marcund |
| **リピート** | リピート可能 |
| **難易度Tier** | Normal（rec_level: 5） |
| **経過日数 (time_cost)** | 1（成功: 1日 / 失敗: 1日） |
| **ノード数** | 4ノード（うち選択肢2件） |
| **サムネイル画像** | `/images/quests/bg_guild.png` |

※BGM、SE、進行中の背景画像などはノードごとに指定します。

---

## 1. クエスト概要

### 短文説明
```
[要定義: 短文説明]
```

### 長文説明
```
[要定義: フレーバーテキスト]
```

---

## 2. 報酬定義

**CSV記載形式:**
```
Gold:300|Item:3005
```

---

## 3. シナリオノードフロー

```
start → locate_scorpion → battle_scorpion_01 → collect_stinger_01
  └─ battle_scorpion_02（任意追加戦）→ collect_stinger_02 → deliver → end_success
各バトル敗北 → end_failure
```

#### `start`（text）
```
闇商人のテントで依頼を受けた。
幻覚サソリ——砂漠の奥地に棲む危険な生き物だ。
砂漠ガイドが示した地図を手に、岩場へ向かう。
```

#### `locate_scorpion`（text）
```
岩の隙間に、鈍い光を放つ生き物がいた。
幻覚サソリだ。大人の腕ほどの大きさで、尾の先が紫色に輝いている。
```

#### `battle_scorpion_01`（battle）
**演出パラメータ:**
- **BGM**: `[要定義: 例 bgm_battle_normal]`

| 設定 | 値 |
|-----|-----|
| 敵グループ | `enemy_scorpion` |
| 敵名 | 幻覚サソリ |
| 備考 | 毒状態異常付与の特殊行動を持つ（将来実装想定） |

```
params: type:battle, enemy_group_id:[要定義: enemy_scorpion が含まれるグループ], next:collect_stinger_01, fail:end_failure
```

#### `collect_stinger_01`（reward）
```
仕留めた。丁寧に毒針を抜き取る——これが報酬になる。
params: type:reward, item_id:3005, quantity:1, next:deliver
```

#### `deliver`（check_delivery）
```
闇商人の元へ戻って毒針を納品する。
params: type:check_delivery, item_id:3005, quantity:1, next:end_success
```

---

## 4. CSVエントリ

```csv
7021,qst_mar_scorpion,幻覚サソリの毒針調達,2,2,1,loc_marcund,,,,,Gold:300|Item:3005,闇商人,[納品] 暗殺の薬や違法薬物の原料となる、希少なサソリの毒針を納品。
```

---

## 5. 実装チェックリスト

- [ ] 出現拠点 `loc_marcund` のみ
- [ ] `enemy_scorpion` がDBに登録済み（毒付与特殊行動は将来実装）
- [ ] `items` テーブル ID=3005 が「幻覚サソリの毒針」として登録済み
- [ ] reward ノードで正しくアイテムが付与される

---

## 6. 拡張メモ

- 複数仕留めによるボーナス報酬システム（アイテム数量に応じたGold追加）
- 「毒針を実は自分で持ち続ける」裏ルート（高価な取引品として別売り）
