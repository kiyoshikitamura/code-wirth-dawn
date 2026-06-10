# クエスト仕様書：7022 — 逃亡奴隷の連れ戻し

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7022 |
| **Slug** | `qst_mar_debt` |
| **クエスト種別** | 一般クエスト（Normal） |
| **推奨レベル** | 5（Normal） |
| **難度** | 3 |
| **依頼主** | 奴隷商 |
| **出現条件** | 出現国: マルカンド / 名声 -50 以下 |
| **リピート** | リピート可能 |
| **経過日数 (time_cost)** | 3 |
| **ノード数** | 30ノード |
| **ゲストNPC** | なし |
| **難易度Tier** | Normal（rec_level: 5） |
| **サムネイル画像** | `/images/quests/bg_slums.png` |
## 1. クエスト概要

### 短文説明
```
[捕縛] 借金を踏み倒して逃げた元奴隷を、生死問わず連れ戻す。
```

### 長文説明
```
マルカンドの奴隷商から裏の依頼。借金で身を売り、その後逃亡した男を連れ戻す仕事だ。
逃亡先は砂漠の端にある無法者集落。男は元戦士で腕が立つらしく、集落の用心棒たちに匿われている。
「足の二三本へし折っても構わん」と奴隷商は言った。
だが、逃亡者の目を見たとき——お前はどう判断する？
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
start → start_desc → intro_1 → intro_1_detail → intro_2 → intro_2_warn → travel_desert
  → reach_colony → colony_desc → watchman → watchman_threat → sneak_in → find_fugitive
    → fugitive_story → fugitive_story_detail → choice_fate
       ├─ 連れ戻す（依頼通りに） → refuse_mercy → battle_wave1
       │    ├─ win → after_wave1 → battle_wave2
       │    │    ├─ win → capture → drag_back → deliver_slave → deliver_slave_02 → end_success
       │    │    └─ lose → end_failure
       │    └─ lose → end_failure
       └─ 見逃す（逃がしてやる） → let_go → fugitive_thanks → leave_colony → end_mercy
```

### ノード詳細（30ノード）

#### `start`（text）
**演出:** bg: bg_mar_mansion, bgm: bgm_quest_tense
```text
奴隷商の邸宅。香油の甘い香りの陰で、微かに錆びた鉄鎖の擦れ合う音が響いていた。
```

#### `start_desc`（text）
**演出:** bg: bg_mar_mansion
```text
肥え太った男が金歯を剥き出しにして下卑た笑みを浮かべ、一枚の羊皮紙を差し出す。
```

#### `intro_1`（text）
**演出:** bg: bg_slums, speaker: 奴隷商
```text
「あいつは私の財産だ。大金を踏み倒して逃げやがった」
```

#### `intro_1_detail`（text）
**演出:** bg: bg_slums, speaker: 奴隷商
```text
「足の二三本へし折っても構わん。私の元へ連れ戻せ」
```

#### `intro_2`（text）
**演出:** bg: bg_slums, speaker: 奴隷商
```text
「居場所は砂漠の端の無法者集落だ。用心棒どもがいる」
```

#### `intro_2_warn`（text）
**演出:** bg: bg_slums, speaker: 奴隷商
```text
「抵抗するなら容赦は要らん。お前なら楽な仕事だろう」
```

#### `travel_desert`（text）
**演出:** bg: bg_desert, bgm: bgm_field
```text
砂漠の東端へと向かう。半日歩くと、崩れかけた岩山の影に錆びた集落が見えた。
```

#### `reach_colony`（text）
**演出:** bg: bg_mar_outlaw
```text
無法者集落。犯罪者や逃亡者が寄り添って暮らす、砂漠の最果ての吹き溜まりだ。
```

#### `colony_desc`（text）
**演出:** bg: bg_mar_outlaw
```text
薄汚れたバラック小屋の陰から、住人たちの殺気立った視線がこちらを突き刺す。
```

#### `watchman`（text）
**演出:** bg: bg_mar_outlaw, bgm: bgm_quest_tense
```text
集落の入り口。黒いターバンを巻いた大柄な男が、槍を構えて行く手を阻んだ。
```

#### `watchman_threat`（text）
**演出:** bg: bg_slums, speaker: 集落の見張り
```text
「奴隷商の飼い犬め。ここへは何の用だ。引き返せ」
```

#### `sneak_in`（text）
**演出:** bg: bg_slums
```text
隙を見て路地へ忍び込む。住民の喧騒を避け、目的の男が潜む小屋を探した。
```

#### `find_fugitive`（text）
**演出:** bg: bg_slums
```text
傾いた木箱の陰。怯えながらも、目に鋭い覚悟を宿した若い男と対峙する。
```

#### `fugitive_story`（text）
**演出:** bg: bg_slums, speaker: 逃亡した男
```text
「……奴は、返済が終わっても新たな嘘で拘束し続ける悪魔だ」
```

#### `fugitive_story_detail`（text）
**演出:** bg: bg_slums, speaker: 逃亡した男
```text
「連れ戻されれば、俺は一生あの檻から出られない」
```

#### `choice_fate`（choice）
**演出:** bg: bg_slums
```text
男の目は真実を訴えている。だが、これは依頼だ。どうする？
```
| 選択肢 | 次ノード |
|--------|---------|
| 連れ戻す（依頼通りに） | `refuse_mercy` |
| 見逃す（逃がしてやる） | `let_go` |

#### `refuse_mercy`（text）
**演出:** bg: bg_slums
```text
「悪いが、これは仕事だ」男の顔が絶望に染まり、外から怒号が響いた。
```

#### `battle_wave1`（battle）
**演出:** bg: bg_slums, bgm: bgm_battle
| 設定 | 値 |
|-----|-----|
| 敵グループID | `423` |
| 敵表示名 | 集落の用心棒 |

```text
逃亡者を守るため、集落の用心棒たちが刃を構えて一斉に襲いかかってきた！
```

#### `after_wave1`（text）
**演出:** bg: bg_slums, bgm: bgm_quest_tense
```text
用心棒を倒した。だが、騒ぎを聞きつけた見張りの暗殺者が行く手を塞ぐ。
```

#### `battle_wave2`（battle）
**演出:** bg: bg_slums, bgm: bgm_battle
| 設定 | 値 |
|-----|-----|
| 敵グループID | `424` |
| 敵表示名 | 集落の精鋭 |

```text
逃げ場のない狭い路地裏。凄腕の刺客たちとの、息詰まる死闘が始まる！
```

#### `capture`（text）
**演出:** bg: bg_slums, bgm: bgm_quest_calm
```text
刺客たちを切り伏せる。逃亡者の男は力なく膝をつき、両手を差し出した。
```

#### `drag_back`（text）
**演出:** bg: bg_desert, bgm: bgm_field
```text
男を縛り、照りつける砂漠を引きずり歩く。背後には住民の呪詛が響いていた。
```

#### `deliver_slave`（text）
**演出:** bg: bg_slums, speaker: 奴隷商
```text
「よくやった！ さあ、この足枷をはめて檻へ叩き込め！」
```

#### `deliver_slave_02`（text）
**演出:** bg: bg_slums, speaker: 奴隷商
```text
「これがお前の報酬だ。またいい仕事があれば頼むぞ」
```

#### `end_success`（end_success）
**演出:** bg: bg_slums
```text
金袋を受け取る。檻の奥から響く絶望の叫び声が、いつまでも耳を離れない。
```
**rewards:** Gold:450, Evil:10, Chaos:5, Exp:100, Rep:-5

#### `let_go`（text）
**演出:** bg: bg_slums, bgm: bgm_quest_calm
```text
「行け。二度と捕まるな」縄を切ると、男は驚愕の表情を浮かべた。
```

#### `fugitive_thanks`（text）
**演出:** bg: bg_slums, speaker: 逃亡した男
```text
「……感謝する。この恩は、死ぬまで決して忘れない」
```

#### `leave_colony`（text）
**演出:** bg: bg_desert, bgm: bgm_field
```text
集落を離れ、帰路につく。奴隷商には『既に他国へ逃亡していた』と報告しよう。
```

#### `end_mercy`（end_success）
**演出:** bg: bg_desert
```text
報酬は得られなかった。だが、砂漠を吹き抜ける風が、少しだけ心地よい。
```
**rewards:** Gold:0, Justice:15, Rep:10

#### `end_failure`（end_failure）
**演出:** bg: bg_slums
```text
無法者の連携に圧倒され、砂泥の中に倒れ伏す。意識は暗闇へと沈んだ。
```

---

## 4. 敵定義参照

| enemy_group_id | グループ名 |
|----------------|-----------|
| 423 | 集落の用心棒 |
| 424 | 集落の精鋭 |
