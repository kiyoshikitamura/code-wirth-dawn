# クエスト仕様書：7006 — 禁制品の闇ルート輸送

## 0. メタデータ

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7006 |
| **Slug** | `qst_gen_smuggle` |
| **種別** | 密輸（Transport + Battle） |
| **依頼主** | 闇商人 |
| **推奨Lv / 難度** | 2（Easy） / 2 |
| **所要日数** | 成功:1 / 失敗:1 |
| **出現拠点** | 全拠点（`all`） |
| **出現条件** | 全拠点で出現 / 名声 -50 以下 |
| **リピート** | リピート可能 |
| **難易度Tier** | Easy（rec_level: 2） |
| **サムネイル画像** | `/images/quests/bg_forest_night.png` |

※BGM、SE、進行中の背景画像などはノードごとに指定します。
| **受注条件** | max_reputation: -50（悪名-50以下） |
| **敵スラッグ** | `enemy_bandit_thug`（追手の賞金稼ぎ） |
| **道徳的傾向** | 混沌（Chaos +5） |

---

## 1. クエスト説明

### 短文（ボード表示・40字以内）
```
禁制品を検問をかわして届けろ。追われる覚悟で。
```

### 長文（詳細モーダル）
```
闇商人からの内密の依頼だ。
官憲の目が届かないルートで、ある禁制品を輸送してほしいという。
中身については「聞かない方が身のためだ」と言われた。
搬送中は敵対勢力の追手が来る可能性がある。
検問は別のルートでかわすが、賞金稼ぎが嗅ぎつけてきたら剣で黙らせるしかない。
高リスクの分、報酬は群を抜いている。
悪名を気にしない者向けの仕事だ。
```

---

## 2. 報酬

| 種別 | 値 |
|-----|-----|
| Gold | 800G |
| アライメント | Chaos +5 |

```
Gold:800|Chaos:5
```

---

## 3. シナリオノードフロー

```
start → receive_cargo → travel_smuggle
  ├─ [random_branch 70%] → ambush → battle_hunter
  │    ├─ 勝利 → delivery_success → end_success
  │    └─ 敗北 → end_failure
  └─ [30%] → delivery_success → end_success
```

#### `start`（text）
```
闇商人の倉庫で、重い木箱を受け取った。
中身を聞くと「知らなくていい」と短く返ってきた。
報酬を思えば、それで十分だ。
```

#### `receive_cargo`（text）
```
禁制品を積んで出発した。
できる限り人目を避けながら、目的地へ向かう。
```

#### `travel_smuggle`（random_branch）
```
街道の途中、背後に馬蹄の音が聞こえた。
params: type:random_branch, prob:70, next:ambush, fallback:delivery_success
```

#### `ambush`（text）
```
「そこで止まれ！ 禁制品の運び屋に違いない！」
賞金稼ぎの追手だ。こうなれば力で排除するしかない。
```

#### `battle_hunter`（battle）
**演出パラメータ:**
- **BGM**: `[要定義: 例 bgm_battle_normal]`

| 設定 | 値 |
|-----|-----|
| 敵グループ | `enemy_bandit_thug` |
| 敵名 | 賞金稼ぎ |
| 備考 | 中程度の強さ。AIが「追手」として攻撃的に動く想定 |

```
params: type:battle, enemy_group_id:[要定義: enemy_bandit_thug が含まれるグループ], next:delivery_success, fail:end_failure
```

#### `delivery_success`（text）
```
目的地に到着した。
闇商人の手下が静かに荷を受け取り、「ご苦労」とだけ言った。
```

#### `end_success`（end, result: success）
```
輸送完了。重い報酬を懐に収めた。何を運んだかは、聞かないままだ。
```

#### `end_failure`（end, result: failure）
```
追手に押し切られた。荷は奪われ、依頼は失敗した。無報酬。
```

---

## 4. CSVエントリ

```csv
7006,qst_gen_smuggle,禁制品の闇ルート輸送,2,2,1,all,,,,-50,Gold:800|Chaos:5,闇商人,[密輸] 危険な禁制品を運搬する。検問や敵の襲撃に備えよ。
```

---

## 5. 実装チェックリスト

- [ ] 受注条件 `max_reputation: -50` が正しく機能する（悪名-50以下のプレイヤーのみ表示）
- [ ] `enemy_bandit_thug` がDBに登録済み
- [ ] Chaos +5 アライメント変動が正しく適用される
- [ ] `random_branch` 70%で追手発生が機能する

---

## 6. 拡張メモ

- 禁制品の中身が発覚するイベント（フレーバー分岐）
- 検問での`check_possession`（通行許可証を持っていれば別ルートも可能）
