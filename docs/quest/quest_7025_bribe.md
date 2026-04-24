# クエスト仕様書：7025 — 敵対軍閥への賄賂裏工作

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7025 |
| **Slug** | `qst_mar_bribe` |
| **クエスト種別** | マルカンドクエスト（Markand） |
| **推奨レベル** | 5（Normal） |
| **難度** | 2 |
| **依頼主** | 軍閥の密使 |
| **出現条件** | 制限なし / 出現拠点: loc_marcund |
| **リピート** | リピート可能 |
| **難易度Tier** | Normal（rec_level: 5） |
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
Gold:350
```

---

## 3. シナリオノードフロー

```
start → receive_bribe_package → approach_camp
  ├─ [check_status / 選択: 堂々と近づく] → random_branch
  │    ├─ [60%発覚] → exposed → battle_militia → forced_deliver → end_success
  │    └─ [40%通過] → find_officer → deliver → end_success
  └─ [選択: 迂回路を探す] → find_officer → deliver → end_success
各バトル敗北 → end_failure
```

#### `start`（text）
```
軍閥の密使から革袋と封筒を受け取った。
「将校の名前はハルムだ。彼だけに渡せ」
行商人に変装して、軍閥の野営地へ向かう。
```

#### `approach_camp`（choice）
- 選択: 「堂々と正面から近づく」→ `random_branch`
- 選択: 「迂回路を探してこっそり潜入する」→ `find_officer`

#### `random_branch`（random_branch）
```
params: type:random_branch, prob:60, next:exposed, fallback:find_officer
```

#### `exposed`（text）
```
「おい、行商人なんぞに用はない。荷物を見せろ」
見張り兵が荷を調べようとしている——誤魔化すより戦う方が早い。
```

#### `battle_militia`（battle）
**演出パラメータ:**
- **BGM**: `[要定義: 例 bgm_battle_normal]`

| 設定 | 値 |
|-----|-----|
| 敵グループ | `enemy_militia` |
| 敵名 | 軍閥の見張り兵 |

```
params: type:battle, enemy_group_id:[要定義: enemy_militia が含まれるグループ], next:forced_deliver, fail:end_failure
```

#### `forced_deliver`（text）
```
混乱に乗じてハルム将校を見つけ、素早く荷を押し付けた。
将校は事情を察し、静かにうなずいた。
```

#### `find_officer`（text）
```
天幕の奥でハルム将校を見つけた。
彼はこちらをちらりと見て、「予定通りか」と呟いた。
```

#### `deliver`（check_delivery or text）
```
革袋と封筒を手渡した。将校は素早く懐に収め、去っていった。
```

#### `end_success` / `end_failure`
（標準定義）

---

## 4. CSVエントリ

```csv
7025,qst_mar_bribe,敵対軍閥への賄賂裏工作,2,2,1,loc_marcund,,,,,Gold:350|Chaos:5,軍閥の密使,[裏工作] 工作資金と宝石を、密かに敵対軍閥の将校へ手渡してこい。
```

---

## 5. 実装チェックリスト

- [ ] 出現拠点 `loc_marcund` のみ
- [ ] `enemy_militia` がDBに登録済み
- [ ] `random_branch` 60%発覚が機能する
- [ ] Chaos +5 アライメント変動が適用される

---

## 6. 拡張メモ

- `check_status` による「隠密スキル保有者は発覚率低下」システム（将来実装）
- 将校ハルムが後続ストーリーで同盟者として登場する伏線
