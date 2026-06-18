# クエスト仕様書：6008 — 第8話「夜霧の凶刃」

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6008 |
| **Slug** | `main_ep08` |
| **クエスト種別** | メインエピソード（Main） |
| **推奨レベル** | 11（Hard） |
| **難度** | 2 |
| **依頼主** | なし |
| **出現条件** | 第7話「刃の掟」（6007）クリア / 滞在拠点: 夜刀神国首都 神都「出雲」 |
| **リピート** | アカウント通じて1回のみ（継承後も非表示） |
| **経過日数 (time_cost)** | 1 |
| **ノード数** | 38ノード |
| **ゲストNPC** | なし |
| **難易度Tier** | Hard（rec_level: 11） |
| **サムネイル画像** | `/images/quests/bg_yato_tavern_night.png` |
---

## 1. クエスト概要

### 短文説明
```
真夜中の宿、襲撃する暗殺者。夜刀神国の闇があなたに牙を剥く。
```

### 長文説明
```
夜刀神国の辺境に佇む宿屋。深い夜霧が立ち込める中、
忍び寄る暗殺者の影。彼らの狙いは、大浄化の秘密を知るあなた自身だった。
```

---

## 2. 報酬定義
```
Exp:200|Gold:350|Rep:10|Order:5
```

---

## 3. シナリオノード構成（38ノード）

### 全体フロー
```text
start → start_02 → rest_01 → rest_02 → alert_01 → alert_02
  → sound_01 → sound_02 → analysis_01 → analysis_02
  → break_01 → break_02 → enemy_voice_01
  → battle1(206) → choice1 → wave_01 → wave_02 → wave_03 → wave_04 → wave_05
  → elite_01 → elite_02 → elite_03 → elite_04
  → battle2(207) → choice2 → silence_01 → silence_02 → silence_03 → silence_04 → silence_05
  → check_relic → check_relic_02 → end_01 → end_02 → end_03 → end_node
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_yato_tavern_night, bgm: bgm_quest_tense
```text
夜刀神国の辺境にある宿屋の一室。部屋の中は暗い。
```

#### `start_02`（text）
**演出:** bg: bg_yato_tavern_night
```text
窓の外には、すべてを覆い隠すような深い夜霧が立ち込めている。
```

#### `rest_01`（text）
**演出:** bg: bg_yato_tavern_night
```text
激しい戦いの連続で、あなたの体には疲労が濃く溜まっていた。
```

#### `rest_02`（text）
**演出:** bg: bg_yato_tavern_night
```text
しかし、どれほど休息を求めようとも、警戒は解けない。
```

#### `alert_01`（text）
**演出:** bg: bg_yato_tavern_night
```text
枕元に愛用の武器を引き寄せ、いつでも動けるよう横になる。
```

#### `alert_02`（text）
**演出:** bg: bg_yato_tavern_night
```text
闇の中に神経を研ぎ澄まし、わずかな音をも逃すまいと努める。
```

#### `sound_01`（text）
**演出:** bg: bg_yato_tavern_night
```text
深夜、静まり返った宿の屋根で、瓦がわずかに擦れる音がした。
```

#### `sound_02`（text）
**演出:** bg: bg_yato_tavern_night
```text
刺客の気配だ。一か所ではなく、部屋を包むように近づく。
```

#### `analysis_01`（text）
**演出:** bg: bg_yato_tavern_night
```text
気配は極めて薄い。忍びの術を心得た夜刀の暗部だろう。
```

#### `analysis_02`（text）
**演出:** bg: bg_yato_tavern_night
```text
寝台から音もなく滑り落ち、部屋の隅の暗闇に身を潜めた。
```

#### `break_01`（text）
**演出:** bg: bg_yato_tavern_night
```text
ガラスが粉々に砕け散り、部屋の中に黒い塊が投げ込まれる。
```

#### `break_02`（text）
**演出:** bg: bg_yato_tavern_night
```text
たちまち白煙が部屋に満ち、視界と呼吸が奪われていく。
```

#### `enemy_voice_01`（text）
**演出:** bg: bg_yato_tavern_night, speaker: 黒装束の刺客
```text
「寝台を囲め！逃がすな、ここで息の根を止めてやる！」
```

#### `battle1`（battle）
**演出:** bg: bg_yato_tavern_night, bgm: bgm_battle
**パラメータ:** enemy_group_id: 206, next: choice1, fail: end_failure

#### `choice1`（choice）
**演出:** bg: bg_yato_tavern_night, bgm: bgm_battle
| 選択肢 | next_node |
|---|---|
| 「迎え撃つ」 | `wave_01` |

#### `wave_01`（text）
**演出:** bg: bg_yato_tavern_night
```text
鋭い踏み込みで白煙を切り裂き、襲いかかる影を薙ぎ払う。
```

#### `wave_02`（text）
**演出:** bg: bg_yato_tavern_night
```text
床に倒れ伏した刺客たちの懐から、特有の紋章が覗いていた。
```

#### `wave_03`（text）
**演出:** bg: bg_yato_tavern_night
```text
それは夜刀神国の有力者が飼う、暗部組織の印に他ならない。
```

#### `wave_04`（text）
**演出:** bg: bg_yato_tavern_night
```text
しかし、安堵する時間はない。廊下の奥からさらに重い足音が響く。
```

#### `wave_05`（text）
**演出:** bg: bg_yato_tavern_night
```text
障子が乱暴に引き裂かれ、大柄な男が部屋へと踏み込んできた。
```

#### `elite_01`（text）
**演出:** bg: bg_yato_tavern_night
```text
男が手にする漆黒の野太刀から、禍々しい闘気が立ち上っている。
```

#### `elite_02`（text）
**演出:** bg: bg_yato_tavern_night
```text
前衛の刺客たちとは明らかに格が違う。この襲撃の指揮官か。
```

#### `elite_03`（text）
**演出:** bg: bg_yato_tavern_night, speaker: 暗殺者頭領
```text
「雑魚どもでは役不足だったか。この俺の刃で塵にしてくれよう」
```

#### `elite_04`（text）
**演出:** bg: bg_yato_tavern_night
```text
あなたは武器をしっかりと構え、真っ向から敵を見据えた。
```

#### `battle2`（battle）
**演出:** bg: bg_yato_tavern_night, bgm: bgm_battle
**パラメータ:** enemy_group_id: 207, next: choice2, fail: end_failure

#### `choice2`（choice）
**演出:** bg: bg_yato_tavern_night, bgm: bgm_battle
| 選択肢 | next_node |
|---|---|
| 「頭領を倒す」 | `silence_01` |

#### `silence_01`（text）
**演出:** bg: bg_yato_tavern_night
```text
激しい刃の応酬の末、あなたの渾身の一撃が頭領を捉えた。
```

#### `silence_02`（text）
**演出:** bg: bg_yato_tavern_night
```text
頭領は野太刀を杖代わりに突き、激しく血を吐きながら嗤う。
```

#### `silence_03`（text）
**演出:** bg: bg_yato_tavern_night, speaker: 暗殺者頭領
```text
「これで……終わりだと思うな……。夜刀の闇は深いぞ……」
```

#### `silence_04`（text）
**演出:** bg: bg_yato_tavern_night
```text
頭領はそのまま動かなくなった。部屋は再び静寂に包まれる。
```

#### `silence_05`（text）
**演出:** bg: bg_yato_tavern_night
```text
息を整えながら、崩れ落ちた頭領の懐を慎重に探る。
```

#### `check_relic`（text）
**演出:** bg: bg_yato_tavern_night
```text
血に染まった書簡が見つかった。そこには密命が記されている。
```

#### `check_relic_02`（text）
**演出:** bg: bg_yato_tavern_night
```text
『標的を排除し、計画の妨げとなる芽を摘め』と書かれていた。
```

#### `end_01`（text）
**演出:** bg: bg_yato_tavern_night, bgm: bgm_quest_calm
```text
宿の窓から、ようやく夜霧の薄れかけた朝の光が差し込む。
```

#### `end_02`（text）
**演出:** bg: bg_yato_tavern_night
```text
追っ手はこれからも現れるだろう。ここに留まるのは危険だ。
```

#### `end_03`（text）
**演出:** bg: bg_yato_tavern_night
```text
荷物をまとめ、あなたは静かに荒れ果てた宿を後にした。
```

#### `end_node`（end_success）
**演出:** bg: bg_yato_tavern_night
```text
朝霧の中、あなたは新たな戦いに向けて歩みを進めた。
```
**rewards:** Exp:200, Gold:350, Rep:10, Order:5

#### `end_failure`（end_failure）
**演出:** bg: bg_yato_tavern_night
```text
深い霧の中、あなたは静かに力尽き、闇へと沈んでいった。
```
**rewards:** Gold:0
