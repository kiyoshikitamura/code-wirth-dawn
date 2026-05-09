# クエスト仕様書：7022 — 逃亡奴隷の連れ戻し

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7022 |
| **Slug** | `qst_mar_debt` |
| **クエスト種別** | マルカンドクエスト（Markand） |
| **推奨レベル** | 5（Normal） |
| **難度** | 3 |
| **依頼主** | 奴隷商 |
| **出現条件** | max_reputation: -50 / 出現拠点: loc_marcund |
| **リピート** | リピート可能 |
| **難易度Tier** | Normal（rec_level: 5） |
| **経過日数 (time_cost)** | 3（成功: 3日 / 失敗: 2日） |
| **ノード数** | 24ノード |
| **サムネイル画像** | `/images/quests/bg_slums.png` |

## 1. クエスト概要

### 短文説明
```
[捕縛] 借金を踏み倒して逃げた元奴隷を、生死問わず連れ戻す。
```

### 長文説明
```
マルカンドの奴隷商から裏の依頼。借金で身を売り、その後逃亡した男を連れ戻す仕事だ。逃亡先は砂漠の端にある無法者集落。男は元戦士で腕が立つらしく、集落の用心棒たちに匿われている。「足の二三本へし折っても構わん」と奴隷商は言った。だが、逃亡者の目を見たとき——お前はどう判断する？
```

## 2. 報酬定義

**正規ルート（連れ戻す）:**
```
Gold:450|Evil:10|Chaos:5|Exp:100|Rep:-5
```

**闇ルート（見逃す）:**
```
Gold:0|Justice:15|Rep:10
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
start → intro_1 → intro_2 → travel_desert
  → reach_colony → colony_desc → watchman
    → watchman_threat → sneak_in → find_fugitive → fugitive_story
      → choice_fate（分岐）
         ├─ [連れ戻す] → refuse_mercy → battle_wave1 (見習い暗殺者 x2 / チンピラ x2)
         │    ├─ [勝利] → after_wave1 → battle_wave2 (見習い暗殺者 x3 / 凄腕の刺客 x1)
         │    │    ├─ [勝利] → capture → drag_back → deliver_slave → end_success
         │    │    └─ [敗北] → end_failure
         │    └─ [敗北] → end_failure
         └─ [見逃す] → let_go → fugitive_thanks → leave_colony → end_mercy
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_slums, bgm: bgm_quest_tense
```text
マルカンドの闇市場の裏手。
太った男が金歯を光らせながら近づいてきた。
```

#### `intro_1`（text）
**演出:** bg: bg_slums, speaker: 奴隷商
```text
「あいつは私の財産だ。借金を踏み倒して逃げやがった。
　足の二三本へし折っても構わん。私の金を引きずって連れてこい」
```

#### `intro_2`（text）
**演出:** bg: bg_slums, speaker: 奴隷商
```text
「居場所は掴んである。砂漠の端の無法者集落だ。
　用心棒どもに匿われているが、お前なら楽勝だろう？」
```

#### `travel_desert`（text）
**演出:** bg: bg_desert, bgm: bgm_field
```text
砂漠の東端へ向かう。半日ほど歩くと、
岩山の影にバラック小屋が寄り集まった集落が見えてきた。
```

#### `reach_colony`（text）
**演出:** bg: bg_slums
```text
無法者集落。逃亡者、犯罪者、捨てられた者たちの吹き溜まり。
ここには法もなければ、秩序もない。
```

#### `colony_desc`（text）
**演出:** bg: bg_slums
```text
路地に座り込む男たちの目が、こちらを値踏みしている。
よそ者が来れば、それだけで警戒される場所だ。
```

#### `watchman`（text）
**演出:** bg: bg_slums, bgm: bgm_quest_tense
```text
集落の入り口で、槍を持った大柄な男に呼び止められた。
```

#### `watchman_threat`（text）
**演出:** bg: bg_slums, speaker: 集落の見張り
```text
「お前、奴隷商の犬か？ アイツには渡さないぞ。
　ここの住民は、もう誰にも支配されない」
```

#### `sneak_in`（text）
**演出:** bg: bg_slums
```text
見張りの隙をついて集落の奥へ忍び込む。
バラック小屋の隙間を縫い、目的の男がいる家を探した。
```

#### `find_fugitive`（text）
**演出:** bg: bg_slums
```text
奥の小屋から、若い男が顔を出した。
痩せてはいるが、目に覚悟が宿っている。逃亡者だ。
```

#### `fugitive_story`（text）
**演出:** bg: bg_slums, speaker: 逃亡した男
```text
「……俺は知っている。奴隷商のやり方を。
　返済が終わっても、新しい借金を捏造して一生離さない。あいつはそういう男だ」
```

#### `choice_fate`（choice）
**演出:** bg: bg_slums
```text
男の言葉が嘘かどうかは分からない。
だが、奴隷商の金歯の笑みを思い出すと、真実味がある。どうする？
```
| 選択肢 | 次ノード |
|--------|---------|
| 連れ戻す（依頼通りに） | `refuse_mercy` |
| 見逃す（逃がしてやる） | `let_go` |

---

#### `refuse_mercy`（text）【正規ルート】
**演出:** bg: bg_slums
```text
「悪いが、これは仕事だ」
男の顔が絶望に歪んだ。
外から怒号が聞こえる。仲間たちが駆けつけてくる。
```

#### `battle_wave1`（battle）【第1戦】
**演出:** bg: bg_slums, bgm: bgm_battle

| 設定 | 値 |
|-----|-----|
| 敵グループID | `423`（新規作成） |
| 敵グループSlug | `grp_fugitive_guard` |
| 構成 | 見習い暗殺者(1121) x2 / チンピラ(1101) x2 |
| 敵表示名 | 集落の用心棒 |

```text
逃亡者の仲間たちが武器を手に立ちはだかった！
```

#### `after_wave1`（text）
**演出:** bg: bg_slums, bgm: bgm_quest_tense
```text
用心棒どもを蹴散らした。だが、騒ぎを聞きつけた精鋭が現れる。
先ほどの見張りの男もいる。刃物の構えが違う——こいつらは手練れだ。
```

#### `battle_wave2`（battle）【第2戦】
**演出:** bg: bg_slums, bgm: bgm_battle

| 設定 | 値 |
|-----|-----|
| 敵グループID | `424`（新規作成） |
| 敵グループSlug | `grp_fugitive_elite` |
| 構成 | 見習い暗殺者(1121) x3 / 凄腕の刺客(1122) x1 |
| 敵表示名 | 集落の精鋭 |

```text
集落の精鋭たちとの激戦！ここを越えなければ男を連れ出せない！
```

#### `capture`（text）
**演出:** bg: bg_slums, bgm: bgm_quest_calm
```text
精鋭を倒した。逃亡者は抵抗をやめ、うなだれた。
「……負けだ。好きにしろ」
```

#### `drag_back`（text）
**演出:** bg: bg_desert, bgm: bgm_field
```text
男の手を縛り、砂漠を歩かせてマルカンドへ戻る。
背中越しに、集落の住民たちの憎悪に満ちた視線を感じた。
```

#### `deliver_slave`（text）
**演出:** bg: bg_slums, speaker: 奴隷商
```text
「ああ、よくやった。この目、この覚悟——折り甲斐があるぞ。
　お前のような仕事人は好きだ。報酬は弾もう」
```

#### `end_success`（end_success）【正規ルート】
**演出:** bg: bg_slums
```text
金袋を受け取った。手の中の金が、やけに重く感じる。
男の最後の目が——いつまでも脳裏に焼きついて消えなかった。
```
**rewards:** Gold:450, Evil:10, Chaos:5, Exp:100, Rep:-5

---

#### `let_go`（text）【闇ルート：見逃す】
**演出:** bg: bg_slums
```text
「……行け。二度と捕まるな」
男は一瞬、信じられないという顔をした。
```

#### `fugitive_thanks`（text）
**演出:** bg: bg_slums, speaker: 逃亡した男
```text
「……ありがとう。俺はここで、やり直す。
　あんたのことは一生忘れない」
```

#### `leave_colony`（text）
**演出:** bg: bg_desert, bgm: bgm_field
```text
集落を後にした。奴隷商には「すでに別の国へ逃げていた」と報告しよう。
報酬はもらえないが、今夜は少しだけ眠れそうだ。
```

#### `end_mercy`（end_success）【闇ルート】
**演出:** bg: bg_desert
```text
報酬は0。だが、正しいことをした確信がある。
砂漠の風が、少しだけ涼しく感じた。
```
**rewards:** Gold:0, Justice:15, Rep:10

---

#### `end_failure`（end_failure）
**演出:** bg: bg_slums
```text
無法者集落の守りは想像以上に堅かった。
意識が薄れていく中、男たちの嘲笑が遠くに聞こえた。
```

---

## 4. 敵定義参照（新規エネミーグループ 2件）

### エネミーグループ: `grp_fugitive_guard` (ID: 423)

| Slug | 名前 | Lv | HP | ATK | DEF |
|------|------|----|----|-----|-----|
| enemy_assassin_trainee | 見習い暗殺者 | 8 | 70 | 42 | 2 |
| enemy_assassin_trainee | 見習い暗殺者 | 8 | 70 | 42 | 2 |
| enemy_bandit_thug | チンピラ | 2 | 40 | 20 | 2 |
| enemy_bandit_thug | チンピラ | 2 | 40 | 20 | 2 |

### エネミーグループ: `grp_fugitive_elite` (ID: 424)

| Slug | 名前 | Lv | HP | ATK | DEF |
|------|------|----|----|-----|-----|
| enemy_assassin_trainee | 見習い暗殺者 | 8 | 70 | 42 | 2 |
| enemy_assassin_trainee | 見習い暗殺者 | 8 | 70 | 42 | 2 |
| enemy_assassin_trainee | 見習い暗殺者 | 8 | 70 | 42 | 2 |
| enemy_assassin_master | 凄腕の刺客 | 15 | 150 | 75 | 5 |

---

## 5. CSVエントリ（quests_normal.csv）

```csv
7022,qst_mar_debt,逃亡奴隷の連れ戻し,5,3,3,loc_marcund,,,,-50,Gold:450|Evil:10|Chaos:5|Exp:100|Rep:-5,奴隷商,[捕縛] 借金を踏み倒して逃げた元奴隷を、生死問わず連れ戻す。
```

> **注意:** 闇ルート報酬(Gold:0 + Justice:15 + Rep:10)はシナリオエンジン側で分岐処理。CSV上は正規ルートの報酬を記載。

---

## 6. 実装チェックリスト

- [ ] 出現拠点 `loc_marcund` のみ
- [ ] 受注条件 `max_reputation: -50` が機能する
- [ ] エネミーグループ `grp_fugitive_guard`（423）がenemy_groups.csvに登録済み
- [ ] エネミーグループ `grp_fugitive_elite`（424）がenemy_groups.csvに登録済み
- [ ] 2連戦フローが正しく遷移する
- [ ] 正規ルート/闇ルートの分岐が機能する
- [ ] 正規ルート: Gold:450 + Evil:10 + Chaos:5 + Exp:100 + Rep:-5 が付与される
- [ ] 闇ルート: Gold:0 + Justice:15 + Rep:10 が付与される
- [ ] time_cost: 3（成功）/ 2（失敗）が正しく経過する
