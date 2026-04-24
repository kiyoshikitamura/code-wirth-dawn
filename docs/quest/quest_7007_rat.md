# クエスト仕様書：7007 — 地下水路の害獣駆除

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7007 |
| **Slug** | `qst_gen_rat` |
| **クエスト種別** | 駆除（Exterminate） |
| **推奨レベル** | 2（Easy） |
| **難度** | 2 |
| **依頼主** | 自治会 |
| **出現条件** | 制限なし / 出現拠点: 全拠点 |
| **リピート** | リピート可能 |
| **難易度Tier** | Easy（rec_level: 2） |
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
Gold:150
```

---

## 3. シナリオノードフロー

```
start → enter_sewers → battle_rats_01 → deeper → battle_rats_02 → destroy_nest → end_success
  各バトル敗北 → end_failure
```

#### `start`（text）
```
自治会の依頼。地下水路の害獣駆除だ。
入口の格子を外して潜り込む。湿った空気と、腐敗臭。
```

#### `enter_sewers`（text）
```
暗い水路を歩く。足もとを流れる水が黒い。
水路の壁に無数の爪痕が刻まれている——相当な数がいる。
```

#### `battle_rats_01`（battle）
**演出パラメータ:**
- **BGM**: `[要定義: 例 bgm_battle_normal]`

| 設定 | 値 |
|-----|-----|
| 敵グループ | `enemy_giant_rat` |
| 敵名 | 巨大ネズミ（群） |
| 備考 | 複数体の雑魚戦想定。HP低め・数で圧す |

```
params: type:battle, enemy_group_id:[要定義: enemy_giant_rat が含まれるグループ], next:deeper, fail:end_failure
```

#### `deeper`（text）
```
最初の群れを蹴散らした。
水路の奥から甲高い鳴き声が聞こえる。巣があるのはもっと深い場所だ。
```

#### `battle_rats_02`（battle）
```
params: type:battle, enemy_group_id:[要定義: enemy_giant_rat が含まれるグループ], next:destroy_nest, fail:end_failure
```
> 第2戦は個体数を増やすか、`enemy_giant_rat_alpha`など亜種で強化する。

#### `destroy_nest`（text）
```
巣を発見した。藁と布切れで作られた大きな塊。
火をかけて焼き払うと、残りの個体が逃げ散っていった。
水路がゆっくりと流れを取り戻す。
```

#### `end_success`（end, result: success）
```
害獣駆除完了。自治会に報告し、報酬を受け取った。
```

#### `end_failure`（end, result: failure）
```
ネズミの群れに圧倒され、水路から退散した。
```

---

## 4. CSVエントリ

```csv
7007,qst_gen_rat,地下水路の害獣駆除,2,2,1,all,,,,,Gold:150,自治会,[討伐] はびこる巨大ネズミを退治し、衛生環境を取り戻せ。
```

---

## 5. 実装チェックリスト

- [ ] `enemy_giant_rat` がDBに登録済み
- [ ] 2連戦フローが正しく遷移する
- [ ] 第2戦強化版（亜種or増員）の定義

---

## 6. 拡張メモ

- ネズミの巣に隠されていたアイテム（偶発的な宝探し要素）
