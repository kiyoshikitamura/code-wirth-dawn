# クエスト仕様書：7010 — 異端者の粛清

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7010 |
| **Slug** | `qst_rol_heretic` |
| **クエスト種別** | 一般クエスト（Normal） |
| **推奨レベル** | 4（Normal） |
| **難度** | 3 |
| **依頼主** | 聖騎士団 |
| **出現条件** | 出現国: ローランド聖王国 / 名声 80 以上 |
| **リピート** | リピート可能 |
| **経過日数 (time_cost)** | 2 |
| **ノード数** | 30ノード |
| **ゲストNPC** | なし |
| **難易度Tier** | Normal（rec_level: 4） |
| **サムネイル画像** | `/images/quests/bg_church.png` |
## 1. クエスト概要

### 短文説明
```
[討伐] 教会に背く異端の信徒たちを、騎士団に代わって旧市街の廃教会で処理する。
```

### 長文説明
```
聖騎士団からの非公式な依頼。王都の旧市街、光の届かない廃教会で、
「星の導き」を騙る異端者たちが集会を開いているという。
彼らの教義は聖王国の秩序を乱す危険思想と認定された。
騎士団が直接手を下せば民衆の反感を買うため、影の処理役が必要とされている。
彼らを「浄化」し、街の秩序を保て。
```

## 2. 報酬定義

```
Gold:600|Order:20|Exp:100|Rep:5
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
start → start_desc → intro_1 → intro_1_detail → intro_2 → intro_2_warn → accept_think
  → arrive_slum → slums_desc → slums_think → church_out → church_outside → church_in → church_deep
    → ritual_scene → ritual_priest → ritual_priest_02 → confront → confront_cultists → cultist_shout
      → battle_cultists
         ├─ win → after_battle_1 → after_battle_desc → after_battle_2 → church_exit
         │    → report_knights → knight_reply → knight_reply_02 → end_success
         └─ lose → end_failure
```

### ノード詳細（30ノード）

#### `start`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm
```text
聖騎士団の詰め所に呼び出された。冷たい石造りの部屋に、重苦しい空気が漂っている。
```

#### `start_desc`（text）
**演出:** bg: bg_guild
```text
薄暗い執務室の奥。副隊長が、羊皮紙の依頼書を無造作に机の上に放り投げた。
```

#### `intro_1`（text）
**演出:** bg: bg_guild, speaker: 副隊長
```text
「旧市街の廃教会で、聖堂の秩序を乱す異端者どもが夜な夜な怪しげな集会を開いているそうだ」
```

#### `intro_1_detail`（text）
**演出:** bg: bg_guild, speaker: 副隊長
```text
「『偽りの神を捨て、真の星の導きに従え』などと妄言を吐く連中だ」
```

#### `intro_2`（text）
**演出:** bg: bg_guild, speaker: 副隊長
```text
「表沙汰になれば余計な騒ぎになる。そこで、お前に奴らの『排除』を委ねたい」
```

#### `intro_2_warn`（text）
**演出:** bg: bg_guild, speaker: 副隊長
```text
「教会の名誉を守るためだ。多少の手荒な真似は黙認する。奴らを生かして帰すなよ」
```

#### `accept_think`（text）
**演出:** bg: bg_guild
```text
暗黙の了解。血生臭い汚れ仕事だ。だが、断れば次の仕事はない。依頼書を懐に収めた。
```

#### `arrive_slum`（text）
**演出:** bg: bg_slums, bgm: bgm_quest_tense
```text
それから間もなく、私たちは王都のきらびやかな大通りを離れ、影に覆われた旧市街の路地裏へと足を踏み入れた。
```

#### `slums_desc`（text）
**演出:** bg: bg_slums
```text
じめじめとした悪臭が漂う。やせ細った野良犬が、こちらを警戒するように通り過ぎた。
```

#### `slums_think`（text）
**演出:** bg: bg_slums
```text
こんな日陰の街だからこそ、人々はすがるように異端の救いを求めるのだろうか。
```

#### `church_out`（text）
**演出:** bg: bg_ruined_church
```text
目的の廃教会に辿り着いた。ステンドグラスは砕け散り、不気味な静寂を湛えている。
```

#### `church_outside`（text）
**演出:** bg: bg_ruined_church
```text
教会の入り口に立つ女神の石像は、何者かの手によって顔が削り取られていた。
```

#### `church_in`（text）
**演出:** bg: bg_ruined_church
```text
歪んだ木扉を押し開け、地下へと続く階段を降りる。埃の臭いの中に、香の甘い香りが混じる。
```

#### `church_deep`（text）
**演出:** bg: bg_ruined_church
```text
壁を伝う湿気と、わずかに聞こえる祈りの唱句。私たちは足音を殺し、さらに奥の礼拝堂へと歩みを進めた。
```

#### `ritual_scene`（text）
**演出:** bg: bg_ruined_church
```text
そこに広がっていたのは、広い地下礼拝堂。黒いローブの集団が、怪しげな文様を描いた祭壇を取り囲んでいた。
```

#### `ritual_priest`（text）
**演出:** bg: bg_ruined_church, speaker: 異端の司祭
```text
「光は我らを救わない！ 真の救済は、深き星の海から訪れるのだ！」
```

#### `ritual_priest_02`（text）
**演出:** bg: bg_ruined_church, speaker: 異端の司祭
```text
「今こそ聖王国の偽りの偶像を打ち砕き、我らが祈りを星へ……」
```

#### `confront`（text）
**演出:** bg: bg_ruined_church
```text
足元の瓦礫を踏みしめ、姿を現す。松明の赤暗い光が、侵入者である私たちを照らし出す。
```

#### `confront_cultists`（text）
**演出:** bg: bg_ruined_church
```text
祈りが突如として止まった。十数人の信徒たちが一斉にこちらを振り返る。その目の奥には、狂信の光が爛々と宿っていた！
```

#### `cultist_shout`（text）
**演出:** bg: bg_ruined_church, speaker: 異端の司祭
```text
「騎士団の飼い犬め！ 聖なる星の儀式を邪魔する者は、ここで生贄とする！」
```

#### `battle_cultists`（battle）
**演出:** bg: bg_ruined_church, bgm: bgm_battle
| 設定 | 値 |
|-----|-----|
| 敵グループID | `410` |
| 敵表示名 | 異端の信徒たち |

```text
狂信者たちが隠し持っていた短剣を抜き、狂気に満ちた叫び声を上げて襲いかかってきた！
```

#### `after_battle_1`（text）
**演出:** bg: bg_ruined_church, bgm: bgm_quest_calm
```text
狂信者たちは床に伏し、動かなくなった。祭壇の火が消え、地下室は再び闇に包まれる。
```

#### `after_battle_desc`（text）
**演出:** bg: bg_ruined_church
```text
辺りには鉄の匂いと、倒れた者たちの最期の吐息だけが残されていた。
```

#### `after_battle_2`（text）
**演出:** bg: bg_ruined_church
```text
彼らが本当に邪悪だったのかは分からない。だが、これが依頼だ。異端の教典を回収する。
```

#### `church_exit`（text）
**演出:** bg: bg_ruined_church
```text
本をしっかりと抱えて冷たい地下室を後にし、夜風が吹き抜ける地上へと戻る。見上げる街の灯りは、妙に遠く見えた。
```

#### `report_knights`（text）
**演出:** bg: bg_guild
```text
騎士団の詰め所に戻り、証拠となる黒い装丁の教典を副隊長の机の上に置いた。
```

#### `knight_reply`（text）
**演出:** bg: bg_guild, speaker: 副隊長
```text
「見事な仕事だ。これでこの街の秩序は、一時的にせよ守られたというわけだな」
```

#### `knight_reply_02`（text）
**演出:** bg: bg_guild, speaker: 副隊長
```text
「お前の腕と、何より口の堅さは高く評価しよう。また裏の仕事があれば声をかける」
```

#### `end_success`（end_success）
**演出:** bg: bg_guild
```text
冷淡な笑みと共に報酬を受け取る。金貨の重みだけが、この手の汚れを忘れさせてくれた。
```
**rewards:** Gold:600, Order:20, Exp:100, Rep:5

#### `end_failure`（end_failure）
**演出:** bg: bg_ruined_church
```text
狂信者たちの圧倒的な数の前に、力尽き倒れ伏す。冷たい石の床で、意識は闇に消えた。
```

---

## 4. 敵定義参照

| enemy_group_id | グループ名 |
|----------------|-----------|
| 410 | 異端の信徒たち |
