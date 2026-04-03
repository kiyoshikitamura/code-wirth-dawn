# クエスト仕様書：7021 — 幻覚サソリの毒針調達

## 0. メタデータ

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7021 |
| **Slug** | `qst_mar_scorpion` |
| **種別** | 採集＋討伐（Gathering + Battle） |
| **依頼主** | 闇商人 |
| **推奨Lv / 難度** | 2 / 2 |
| **所要日数** | 成功:1 / 失敗:1 |
| **出現拠点** | `loc_marcund` |
| **受注条件** | なし |
| **敵スラッグ** | `enemy_scorpion`（幻覚サソリ） |
| **報酬アイテム** | Item:3005 |

---

## 1. クエスト説明

### 短文（ボード表示・40字以内）
```
希少な幻覚サソリの毒針を採取して、闇商人に納品せよ。
```

### 長文（詳細モーダル）
```
マルカンドで活動する闇商人からの依頼だ。
砂漠の奥地にのみ生息する「幻覚サソリ」——その毒針は、
暗殺の薬や一部の違法薬物の精製原料として非常に高値がつく。
砂漠ガイドが居場所は掴んでいるが、近づくには戦って仕留める必要がある。
毒針は一匹から一本しか取れない。複数仕留めれば追加報酬が出る（上限ありの追加報酬）。
後ろめたければ受けなければいい——でも報酬は選ぶ価値がある。
```

---

## 2. 報酬

| 種別 | 値 |
|-----|-----|
| Gold | 300G |
| アイテム | Item:3005（幻覚サソリの毒針） |

```
Gold:300|Item:3005
```

> **Item:3005補足:** `items` テーブル ID=3005 が「幻覚サソリの毒針」であることを確認。希少な取引品（trade_good）として定義。

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
| 設定 | 値 |
|-----|-----|
| 敵スラッグ | `enemy_scorpion` |
| 敵名 | 幻覚サソリ |
| 備考 | 毒状態異常付与の特殊行動を持つ（将来実装想定） |

```
params: type:battle, enemy:enemy_scorpion, next:collect_stinger_01, fail:end_failure
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
- BGM: `bgm_quest_tense`（危険な採集）
