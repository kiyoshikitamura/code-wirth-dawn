# クエスト仕様書：7025 — 敵対軍閥への賄賂裏工作

## 0. メタデータ

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7025 |
| **Slug** | `qst_mar_bribe` |
| **種別** | 裏工作（Delivery / Stealth） |
| **依頼主** | 軍閥の密使 |
| **推奨Lv / 難度** | 5（Normal） / 2 |
| **所要日数** | 成功:1 / 失敗:1 |
| **出現拠点** | `loc_marcund` |
| **出現条件** | 出現国: マルカンド |
| **リピート** | リピート可能 |
| **難易度Tier** | Normal（rec_level: 5） |
| **サムネイル画像** | `/images/quests/bg_bandit_camp.png` |

※BGM、SE、進行中の背景画像などはノードごとに指定します。
| **受注条件** | なし |
| **敵スラッグ** | `enemy_militia`（見張り兵） ※発覚時 |
| **道徳的傾向** | 混沌（Chaos +5） |

---

## 1. クエスト説明

### 短文（ボード表示・40字以内）
```
敵対軍閥の将校に、工作資金を密かに手渡してこい。
```

### 長文（詳細モーダル）
```
軍閥の密使から内密の依頼が来た。
交渉を優位に進めるため、敵対軍閥の将校に賄賂を渡したいという。
持参するのは金貨の入った革袋と、証明書類の入った封筒だ。
表向きは「行商人」として軍閥の陣営に近づき、
将校だけに渡せれば任務完了——部下や見張りには知られないことが条件だ。
発覚した場合は「自衛手段で乗り切れ」とだけ指示されている。
```

---

## 2. 報酬

| 種別 | 値 |
|-----|-----|
| Gold | 350G |
| アライメント | Chaos +5 |

```
Gold:350|Chaos:5
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
