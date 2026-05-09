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
| **経過日数 (time_cost)** | 6（成功: 6日 / 失敗: 3日） |
| **ノード数** | 22ノード |
| **サムネイル画像** | `/images/quests/bg_desert.png` |

## 1. クエスト概要

### 短文説明
```
[裏工作] 工作資金と宝石を、密かに敵対軍閥の将校へ手渡してこい。
```

### 長文説明
```
マルカンドの軍閥の密使から極秘の依頼を受けた。敵対する軍閥の将校ハルムに、行商人を装って賄賂の革袋を届ける仕事だ。中身は金貨と宝石。合言葉は「流砂の果て」。道中は敵の見張りが巡回しており、怪しまれれば即座に斬りかかられる。正面から堂々と近づくか、迂回路で潜入するか——選択を誤れば、命はない。
```

## 2. 報酬定義

```
Gold:350|Chaos:10|Exp:100|Rep:-5
```

## 2.5. 失敗ペナルティ（共通仕様）

| 条件 | ペナルティ |
|------|-----------|
| クエスト失敗（敗北/撤退/ギブアップ） | 名声 -3〜-10（ランダム、現在拠点） |
| バトル敗北（全般） | VIT -1（クエスト/ランダムエンカウント/賞金稼ぎ共通） |
| 経過日数 | クエスト定義の days_failure 値を適用 |

## 3. シナリオノード構成

### 全体フロー

```text
start → intro_1 → intro_2 → disguise
  → travel_desert → approach_camp → camp_desc → choice_approach（分岐）
     ├─ [正面から近づく] → front_approach → front_check → battle_militia
     │    (野盗の用心棒 x2 / 野盗の射手 x2)
     │    ├─ [勝利] → forced_entry → find_officer_front → deliver_front → officer_reply → end_success
     │    └─ [敗北] → end_failure
     └─ [迂回路で潜入する] → sneak_route → sneak_desc → sneak_close
          → find_officer_sneak → deliver_sneak → officer_reply → end_success
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_slums, bgm: bgm_quest_tense
```text
マルカンドの裏通りで、顔を隠した男と接触した。
彼は周囲を何度も確認してから、革袋と封筒を差し出した。
```

#### `intro_1`（text）
**演出:** bg: bg_slums, speaker: 軍閥の密使
```text
「この革袋を、北のオアシスに駐屯する『隻眼のハルム』に渡せ。
　合言葉は『流砂の果て』。彼だけに渡すこと」
```

#### `intro_2`（text）
**演出:** bg: bg_slums, speaker: 軍閥の密使
```text
「行商人に変装して近づけ。怪しまれたら斬り合いになる。
　くれぐれも中身は見るな。見れば——お前も消される側になる」
```

#### `disguise`（text）
**演出:** bg: bg_slums
```text
密使から受け取った行商人の衣装に着替える。
革袋を荷物の底に隠し、商品のスパイスで匂いを消した。
```

#### `travel_desert`（text）
**演出:** bg: bg_desert, bgm: bgm_field
```text
北のオアシスへ向けて砂漠を行く。三日の旅路。
途中、軍閥の旗印を掲げた騎馬兵とすれ違った。目を合わせないように歩く。
```

#### `approach_camp`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_tense
```text
オアシスの手前に、軍閥の野営地が見えてきた。
天幕が並び、兵士たちが巡回している。ここを越えなければならない。
```

#### `camp_desc`（text）
**演出:** bg: bg_desert
```text
正面の入り口には見張りが二人。後ろの岩場に迂回路らしき獣道がある。
どちらから行くか——判断を下す時だ。
```

#### `choice_approach`（choice）
**演出:** bg: bg_desert
```text
野営地への接近方法を選べ。
```
| 選択肢 | 次ノード |
|--------|---------|
| 正面から堂々と近づく | `front_approach` |
| 迂回路で潜入する | `sneak_route` |

---

#### `front_approach`（text）【正面ルート】
**演出:** bg: bg_desert
```text
行商人の笑顔を貼り付けて、正面から野営地に歩いていく。
「やあ、スパイスの行商だ。将校殿に良い品を——」
```

#### `front_check`（text）
**演出:** bg: bg_desert, speaker: 見張り兵
```text
「待て。行商人なんぞに用はない。荷物を見せろ」
見張り兵が荷を漁り始めた。革袋が見つかるのは時間の問題だ——！
```

#### `battle_militia`（battle）
**演出:** bg: bg_desert, bgm: bgm_battle

| 設定 | 値 |
|-----|-----|
| 敵グループID | `429`（新規作成） |
| 敵グループSlug | `grp_militia_patrol` |
| 構成 | 野盗の用心棒(1103) x2 / 野盗の射手(1102) x2 |
| 敵表示名 | 軍閥の見張り兵 |

```text
見張り兵に正体を見抜かれた！ 斬り合いだ！
```

#### `forced_entry`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_tense
```text
見張りを倒した。騒ぎで他の兵が来る前に、天幕の奥へ走る。
混乱に乗じてハルム将校を探さなければ。
```

#### `find_officer_front`（text）
**演出:** bg: bg_desert
```text
奥の天幕で、隻眼の男を見つけた。
彼はこちらの血まみれの姿を見て、事情を察したようだ。
```

#### `deliver_front`（text）
**演出:** bg: bg_desert
```text
「『流砂の果て』——」
合言葉を囁き、革袋と封筒を手渡した。
```

---

#### `sneak_route`（text）【潜入ルート】
**演出:** bg: bg_desert
```text
岩場の獣道を這うように進む。
砂利を踏まないよう、一歩一歩慎重に足を運んだ。
```

#### `sneak_desc`（text）
**演出:** bg: bg_desert
```text
天幕の裏手に出た。兵士たちは食事中で、こちらに気づいていない。
幸運だ。このまま将校の天幕を探す。
```

#### `sneak_close`（text）
**演出:** bg: bg_desert
```text
ひときわ大きな天幕を見つけた。入り口の旗印が将校のものだ。
裏の隙間から中を覗くと、隻眼の男が地図を眺めている。
```

#### `find_officer_sneak`（text）
**演出:** bg: bg_desert
```text
天幕の中に滑り込む。ハルム将校がこちらを見た。
「『流砂の果て』——」合言葉を囁く。
```

#### `deliver_sneak`（text）
**演出:** bg: bg_desert
```text
革袋と封筒を手渡した。
将校は素早く懐に収め、何事もなかったように地図に視線を戻した。
```

---

#### `officer_reply`（text）
**演出:** bg: bg_desert, speaker: ハルム将校
```text
「予定通りだ。確かに受け取った。
　帰りは東の谷を抜けろ。そちらの方が安全だ」
```

#### `end_success`（end_success）
**演出:** bg: bg_guild
```text
マルカンドに戻り、密使に完了を報告した。
報酬を受け取る。この金がどんな戦争を引き起こすのか——考えないことにした。
```
**rewards:** Gold:350, Chaos:10, Exp:100, Rep:-5

#### `end_failure`（end_failure）
**演出:** bg: bg_desert
```text
軍閥の兵に囲まれ、身動きが取れなくなった。
革袋は押収され、スパイとして拘束された。
```

---

## 4. 敵定義参照（新規エネミーグループ 1件）

### エネミーグループ: `grp_militia_patrol` (ID: 429)

| Slug | 名前 | Lv | HP | ATK | DEF |
|------|------|----|----|-----|-----|
| enemy_bandit_guard | 野盗の用心棒 | 6 | 80 | 36 | 5 |
| enemy_bandit_guard | 野盗の用心棒 | 6 | 80 | 36 | 5 |
| enemy_bandit_archer | 野盗の射手 | 4 | 35 | 24 | 1 |
| enemy_bandit_archer | 野盗の射手 | 4 | 35 | 24 | 1 |

---

## 5. CSVエントリ（quests_normal.csv）

```csv
7025,qst_mar_bribe,敵対軍閥への賄賂裏工作,5,2,6,loc_marcund,,,,,Gold:350|Chaos:10|Exp:100|Rep:-5,軍閥の密使,[裏工作] 工作資金と宝石を、密かに敵対軍閥の将校へ手渡してこい。
```

---

## 6. 実装チェックリスト

- [ ] 出現拠点 `loc_marcund` のみ
- [ ] エネミーグループ `grp_militia_patrol`（429）がenemy_groups.csvに登録済み
- [ ] 正面ルート/潜入ルートの分岐が機能する
- [ ] 正面ルートのみバトル発生。潜入ルートは戦闘なし
- [ ] Gold:350 + Chaos:10 + Exp:100 + Rep:-5 が付与される
- [ ] time_cost: 6（成功）/ 3（失敗）が正しく経過する
