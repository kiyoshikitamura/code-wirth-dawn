# クエスト仕様書：7006 — 禁制品の闇ルート輸送

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7006 |
| **Slug** | `qst_gen_smuggle` |
| **クエスト種別** | 密輸（Smuggle） |
| **推奨レベル** | 2（Easy） |
| **難度** | 2 |
| **依頼主** | 闇商人 |
| **出現条件** | 制限なし / 出現拠点: 全拠点 |
| **リピート** | リピート可能 |
| **難易度Tier** | Easy（rec_level: 2） |
| **経過日数 (time_cost)** | 1（成功: 1日 / 失敗: 1日） |
| **ノード数** | 5ノード（うち選択肢2件） |
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
Gold:800
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
