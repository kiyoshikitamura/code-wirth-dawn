# クエスト仕様書：7033 — 食い詰めた浪人狩り

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7033 |
| **Slug** | `qst_yat_ronin` |
| **クエスト種別** | 一般クエスト（Normal） |
| **推奨レベル** | 6（Normal） |
| **難度** | 2 |
| **依頼主** | 代官所 |
| **出現条件** | 出現国: 夜刀神国 |
| **リピート** | リピート可能 |
| **経過日数 (time_cost)** | 2 |
| **ノード数** | 44ノード |
| **ゲストNPC** | なし |
| **難易度Tier** | Normal（rec_level: 6） |
| **サムネイル画像** | `/images/quests/bg_yato_den.png` |
---

## 1. クエスト概要

### 短文説明
```
[討伐] 賭場の手入れ。悪事に手を染めた浪人集団を一網打尽にする。
```

### 長文説明
```
夜刀神国の繁華街の裏通りには、昼間から博打と酒に溺れる浪人たちの巣窟がある。
彼らは食い詰めた挙句、町人からみかじめ料を脅し取るならず者へと成り下がっていた。
代官所からの依頼は、この賭場への「手入れ」だ。
悪事に手を染めた浪人集団を、暴力をもって一網打尽にせよ。
```

---

## 2. 報酬定義

**報酬 (CSV記載形式):**
```
Gold:350|Exp:100|Justice:10
```

---

## 3. シナリオノードフロー

```text
start
 └─ start_02
     └─ start_03
         └─ start_04
             └─ start_05
                 └─ alley_01
                     └─ alley_01_02
                         └─ alley_01_03
                             └─ alley_02
                                 └─ alley_03
                                     └─ alley_04
                                         └─ enter_gambling_den
                                             └─ enter_gambling_den_02
                                                 └─ enter_gambling_den_03
                                                     └─ confront_01
                                                         └─ confront_02
                                                             └─ confront_leader_01
                                                                 └─ confront_leader
                                                                     └─ confront_leader_2
                                                                         └─ confront_leader_3
                                                                             └─ battle_ronin_wave_01
                                                                                  ├─ win → leader_fight_01
                                                                                  └─ lose → end_failure_01
leader_fight_01
 └─ leader_fight_01_02
     └─ leader_fight_01_03
         └─ leader_fight_02
             └─ leader_fight_03
                 └─ leader_fight_04
                     └─ leader_fight
                         └─ leader_fight_2
                             └─ leader_fight_2_02
                                 └─ leader_fight_2_03
                                     └─ battle_ronin_leader
                                          ├─ win → scatter_01
                                          └─ lose → end_failure_01
scatter_01
 └─ scatter_02
     └─ scatter_03
         └─ scatter_04
             └─ scatter
                 └─ report_01
                     └─ report_02
                         └─ report_02_02
                             └─ report_03
                                 └─ end_success
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_yato_city, bgm: bgm_quest_tense
```text
代官所から、封が切られたままの依頼書を受け取った。非公式の裏仕事だ。
```

#### `start_02`（text）
**演出:** bg: bg_yato_city, bgm: bgm_quest_tense
```text
依頼の内容は、繁華街の裏にある賭場に巣食う浪人集団の「掃除」だった。
```

#### `start_03`（text）
**演出:** bg: bg_yato_city, bgm: bgm_quest_tense
```text
彼らは主君を失って食い詰め、今では善良な町人からみかじめ料を脅し取っているらしい。
```

#### `start_04`（text）
**演出:** bg: bg_yato_city, bgm: bgm_quest_tense
```text
代官所の役人が表立って動けば、彼らはクモの子を散らすように逃げてしまう。
```

#### `start_05`（text）
**演出:** bg: bg_yato_city, bgm: bgm_quest_tense
```text
ゆえに、しがらみのない冒険者が単身で乗り込み、一網打尽にする必要があるというわけだ。
```

#### `alley_01`（text）
**演出:** bg: bg_yato_city, bgm: bgm_field_night
```text
夜の繁華街は、提灯の明かりと人々の喧騒で溢れかえっている。
```

#### `alley_01_02`（text）
**演出:** bg: bg_yato_city, bgm: bgm_field_night
```text
夜刀神国の繁栄の裏で、行き場を失った浪人が増え続けている。これも時代の歪みだ。
```

#### `alley_01_03`（text）
**演出:** bg: bg_yato_city, bgm: bgm_field_night
```text
懐に入れた代官所の書状が微かに重い。汚い仕事だが、背に腹は代えられない。
```

#### `alley_02`（text）
**演出:** bg: bg_yato_city, bgm: bgm_field_night
```text
しかし、大通りから一本外れた路地裏に入ると、途端にむせ返るような生ごみの臭いが漂ってきた。
```

#### `alley_03`（text）
**演出:** bg: bg_yato_city, bgm: bgm_field_night
```text
泥酔して道端に転がる男たちを跨ぎながら、目的の長屋へと向かう。
```

#### `alley_04`（text）
**演出:** bg: bg_yato_den, bgm: bgm_quest_tense
```text
障子越しに、サイコロの転がる音と、下品な罵声が聞こえてくる。ここが目的の賭場だ。
```

#### `enter_gambling_den`（text）
**演出:** bg: bg_yato_den, bgm: bgm_quest_tense
```text
遠慮はいらない。勢いよく蹴破るようにして、賭場の引き戸を開け放った。
```

#### `enter_gambling_den_02`（text）
**演出:** bg: bg_yato_den, bgm: bgm_quest_tense
```text
充満する安酒と煙草の煙。卓を囲む者たちの血走った目が、一斉にこちらを向く。
```

#### `enter_gambling_den_03`（text）
**演出:** bg: bg_yato_den, bgm: bgm_quest_tense
```text
誰もが懐の刀に手をかけている。一瞬の静寂の後、誰かが唾を吐く音が響いた。
```

#### `confront_01`（text）
**演出:** bg: bg_yato_den, bgm: bgm_quest_tense
```text
ピタリ、と場内の動きが止まる。酒と汗の臭いが充満する部屋に、数十人の浪人がひしめいていた。
```

#### `confront_02`（text）
**演出:** bg: bg_yato_den, bgm: bgm_quest_tense, speaker: 浪人
```text
「……なんだテメェ。ここは堅気が来る場所じゃねぇ。命が惜しくば失せな」
```

#### `confront_leader_01`（text）
**演出:** bg: bg_yato_den, bgm: bgm_quest_tense
```text
奥の座敷で杯を傾けていた大柄な浪人が、忌々しげにゆっくりと立ち上がった。
```

#### `confront_leader`（text）
**演出:** bg: bg_yato_den, bgm: bgm_quest_tense, speaker: 浪人の頭目
```text
「代官所の犬か。血の匂いがプンプンしやがる」
```

#### `confront_leader_2`（text）
**演出:** bg: bg_yato_den, bgm: bgm_quest_tense, speaker: 浪人の頭目
```text
「野郎ども、やっちまえ！ こいつの首を手土産に逃げるぞ！」
```

#### `confront_leader_3`（text）
**演出:** bg: bg_yato_den, bgm: bgm_quest_tense
```text
頭目の合図と共に、殺気立った浪人たちが一斉に抜刀し、こちらへ襲いかかる！
```

#### `battle_ronin_wave_01`（battle）
**演出:** bg: bg_yato_den, bgm: bgm_battle
```text
食い詰め浪人たちが群がってきた！
```
**パラメータ:** type: battle, enemy_group_id: 433, next: leader_fight_01, fail: end_failure_01

#### `leader_fight_01`（text）
**演出:** bg: bg_yato_den, bgm: bgm_quest_tense
```text
血飛沫が舞い、障子が破れる。数人の浪人を切り伏せると、残りの者は恐れをなして後退した。
```

#### `leader_fight_01_02`（text）
**演出:** bg: bg_yato_den, bgm: bgm_quest_tense
```text
息を荒くしながらも、刀の刃こぼれがないかを確認する。敵の数はこちらが圧倒的に不利だ。
```

#### `leader_fight_01_03`（text）
**演出:** bg: bg_yato_den, bgm: bgm_quest_tense
```text
だが、烏合の衆。統率の取れていない動きは隙だらけで、斬るのに苦労はしない。
```

#### `leader_fight_02`（text）
**演出:** bg: bg_yato_den, bgm: bgm_quest_tense
```text
床には折れた刀と、呻き声を上げる浪人たちが転がっている。
```

#### `leader_fight_03`（text）
**演出:** bg: bg_yato_den, bgm: bgm_quest_tense, speaker: 浪人の頭目
```text
「チッ、使えねぇ雑兵どもめ。……だが、俺を只のならず者と思うなよ」
```

#### `leader_fight_04`（text）
**演出:** bg: bg_yato_den, bgm: bgm_quest_tense
```text
頭目が懐から取り出したのは、夜刀神国の正規軍が使う名刀だった。奪ったものだろう。
```

#### `leader_fight`（text）
**演出:** bg: bg_yato_den, bgm: bgm_quest_tense, speaker: 浪人の頭目
```text
「少しは骨があるようだが、所詮は素人よ。この俺の太刀筋、とくと味わえ！」
```

#### `leader_fight_2`（text）
**演出:** bg: bg_yato_den, bgm: bgm_quest_tense
```text
歴戦の殺気を放ちながら、頭目が自ら太刀を青眼に構えた。空気がビリビリと震える。
```

#### `leader_fight_2_02`（text）
**演出:** bg: bg_yato_den, bgm: bgm_quest_tense
```text
頭目の構えに隙はない。かつては名の知れた剣術の道場に身を置いていたのだろう。
```

#### `leader_fight_2_03`（text）
**演出:** bg: bg_yato_den, bgm: bgm_quest_tense
```text
無駄な動きを削ぎ落とした静かな佇まい。これまでの有象無象とは明らかに違う。
```

#### `battle_ronin_leader`（battle）
**演出:** bg: bg_yato_den, bgm: bgm_battle_boss
```text
浪人の頭目との戦い！
```
**パラメータ:** type: battle, enemy_group_id: 434, next: scatter_01, fail: end_failure_01

#### `scatter_01`（text）
**演出:** bg: bg_yato_den, bgm: bgm_quest_calm
```text
激しい鍔迫り合いの末、頭目の刀が宙を舞い、その巨体がどうと床に倒れ伏した。
```

#### `scatter_02`（text）
**演出:** bg: bg_yato_den, bgm: bgm_quest_calm
```text
頭目が血を吐いて動かなくなると、残っていた浪人たちの顔に絶望の色が浮かんだ。
```

#### `scatter_03`（text）
**演出:** bg: bg_yato_den, bgm: bgm_quest_calm, speaker: 浪人
```text
「ひ、ひぃぃっ！ 命だけは！ 命だけはお助けを！」
```

#### `scatter_04`（text）
**演出:** bg: bg_yato_den, bgm: bgm_quest_calm
```text
武器を放り出し、彼らは我先にと裏口から逃げ出していく。完全に戦意を喪失している。
```

#### `scatter`（text）
**演出:** bg: bg_yato_den, bgm: bgm_quest_calm
```text
深追いはしない。これでこの賭場は終わりだ。血振りをして、静かに刀を鞘に収めた。
```

#### `report_01`（text）
**演出:** bg: bg_yato_city, bgm: bgm_quest_calm
```text
翌朝、代官所の裏門から入り、役人に事の顛末を報告する。
```

#### `report_02`（text）
**演出:** bg: bg_yato_city, bgm: bgm_quest_calm
```text
役人は満足げに頷き、重みのある金袋を机の上に滑らせた。
```

#### `report_02_02`（text）
**演出:** bg: bg_yato_city, bgm: bgm_quest_calm, speaker: 代官所の役人
```text
「中身は確かだ。余計な口さえ叩かなければ、お前には今後も仕事を回してやろう」
```

#### `report_03`（text）
**演出:** bg: bg_yato_city, bgm: bgm_quest_calm, speaker: 代官所の役人
```text
「よくやってくれた。これで少しは町も静かになるだろう。また頼むかもしれんぞ」
```

#### `end_success`（end_success）
**演出:** bg: bg_yato_city
```text
金袋を受け取り、代官所を後にする。
裏社会の掃除は気が滅入るが、日銭を稼ぐには悪くない仕事だった。
```
**rewards:** Gold:350, Exp:100, Justice:10

#### `end_failure_01`（text）
**演出:** bg: bg_yato_den
```text
多勢に無勢。浪人たちの容赦ない凶刃が、次々とあなたの身体を深く切り裂く。
```

#### `end_failure`（end_failure）
**演出:** bg: bg_yato_den
```text
血の海に倒れ伏す中、頭目の見下すような冷たい視線が、意識の暗闇へと消えていった。
```

---

## 4. 新規エネミー・アイテム定義参照

**新規追加エネミー（`enemies.csv`）:**
| ID | Slug | name | level | hp | atk | def | exp | gold |
|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| 1243 | `enemy_yato_ronin` | 浪人 | 10 | 80 | 38 | 5 | 30 | 50 |
| 1244 | `enemy_yato_ronin_leader` | 浪人の頭目 | 15 | 250 | 55 | 10 | 120 | 200 |

**新規追加グループ（`enemy_groups.csv`）:**
| ID | Slug | 構成エネミー |
|-----|-----|-----|
| 433 | `grp_yato_ronin_wave` | `enemy_yato_ronin`\|`enemy_yato_ronin`\|`enemy_yato_ronin` |
| 434 | `grp_yato_ronin_boss` | `enemy_yato_ronin_leader` |

---

## 5. CSVエントリ

`quests_normal.csv`
```csv
7033,qst_yat_ronin,食い詰めた浪人狩り,6,2,2,loc_yatoshin,,,,,Gold:350|Exp:100|Justice:10,代官所,[討伐] 賭場の手入れ。悪事に手を染めた浪人集団を一網打尽にする。
```

---

## 6. 実装チェックリスト

- [x] 新規エネミーおよびグループ 433, 434 がDBに登録済みであること
- [x] 2連戦フローが正しく機能すること
- [x] 報酬として Justice:10 がアライメントに正しく加算されること
