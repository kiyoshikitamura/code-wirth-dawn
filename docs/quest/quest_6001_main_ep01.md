# クエスト仕様書：6001 — 第1話「始まりの轍」

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6001 |
| **Slug** | `main_ep01` |
| **クエスト種別** | メインエピソード（Main） |
| **推奨レベル** | 1（Easy） |
| **難度** | 1 |
| **依頼主** | 王国軍 |
| **出現条件** | プレイヤーLv 1 以上 / 滞在拠点: 国境の町 |
| **リピート** | アカウント通じて1回のみ（継承後も非表示） |
| **経過日数 (time_cost)** | 2 |
| **ノード数** | 41ノード |
| **ゲストNPC** | ガウェイン（guest_join → leave） |
| **難易度Tier** | Easy（rec_level: 1） |
| **サムネイル画像** | `/images/quests/bg_road_day.png` |
---

## 1. クエスト概要

### 短文説明
```
辺境の輸送隊護衛。老騎士ガウェインの下で、最初の血を流せ。
```

### 長文説明
```
王国辺境の名もなき村。荒涼たる大地を渡る風に身を晒しながら、
一介の傭兵として生き抜く日々が始まる。
```

---

## 2. 報酬定義

```
Exp:80|Gold:150|Rep:5|Order:5
```

---

## 3. シナリオノードフロー

```text
start
 └─ start_02
     └─ village_01
         └─ village_02
             └─ board_01
                 └─ board_02
                     └─ board_03
                         └─ cargo_01
                             └─ cargo_02
                                 └─ gawain_01
                                     └─ gawain_02
                                         └─ gawain_03
                                             └─ gawain_04
                                                 └─ choice1
                                                      ├─ 「急いで積み込みます」 → react_01
                                                      └─ 「あんたはここで指図するだけか？」 → react_01
                                                           └─ react_01
                                                               └─ react_02
                                                                   └─ name_01
                                                                       └─ name_02
                                                                           └─ gawain_join (guest_join)
                                                                               └─ alarm_01
                                                                                   └─ alarm_02
                                                                                       └─ scout_01
                                                                                           └─ order_01
                                                                                               └─ taunt_01
                                                                                                   └─ battle
                                                                                                        ├─ win → choice2
                                                                                                        │          └─ 「迎撃する」 → post_01
                                                                                                        │                              └─ post_01
                                                                                                        │                                  └─ dying_01
                                                                                                        │                                      └─ dying_02
                                                                                                        │                                          └─ dying_03
                                                                                                        │                                              └─ look_01
                                                                                                        │                                                  └─ praise_01
                                                                                                        │                                                      └─ praise_02
                                                                                                        │                                                          └─ depart_01
                                                                                                        │                                                              └─ farewell
                                                                                                        │                                                                  └─ gawain_leave (leave)
                                                                                                        │                                                                      └─ end_01
                                                                                                        │                                                                          └─ end_node
                                                                                                        └─ lose → end_failure_01
                                                                                                                     └─ end_failure
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_road_day, bgm: bgm_quest_calm
```text
肌を焦がすような乾いた風が、荒涼たる砂丘を撫でるように吹き抜ける。
```

#### `start_02`（text）
**演出:** bg: bg_road_day
```text
ここはローランド聖王国の最辺境。王国の威光も届かぬ寂れた地だ。
```

#### `village_01`（text）
**演出:** bg: bg_road_day
```text
崩れかけた土壁、痩せ細った家畜、そして泥水がわずかに底に溜まる井戸。
```

#### `village_02`（text）
**演出:** bg: bg_road_day
```text
そんな行き止まりのような境界の村から——君の物語は静かに始まる。
```

#### `board_01`（text）
**演出:** bg: bg_road_day
```text
村の入口に立つ古びた掲示板。風雨に晒され、黄ばんだ羊皮紙が留められている。
```

#### `board_02`（text）
**演出:** bg: bg_road_day
```text
『傭兵募集——王国軍輸送部隊の護衛。報酬は銀貨十五枚。死亡保障なし』
```

#### `board_03`（text）
**演出:** bg: bg_road_day
```text
銀貨十五枚。これだけあれば一ヶ月は食いつなげる。迷う理由はなかった。
```

#### `cargo_01`（text）
**演出:** bg: bg_road_day
```text
手配された荷馬車は三台。積まれた木箱には『軍需物資』とだけ書かれていた。
```

#### `cargo_02`（text）
**演出:** bg: bg_road_day
```text
護衛にあたる兵士は六人。全員が疲弊し、その目はどんよりと濁っている。
```

#### `gawain_01`（text）
**演出:** bg: bg_road_day
```text
荷の数を確認しようとした時、背後からしゃがれた太い声が降ってきた。
```

#### `gawain_02`（text）
**演出:** bg: bg_road_day, speaker: ガウェイン
```text
「おい、そこの新入り！ぼんやりするな。野盗の餌食になりたいのか？」
```

#### `gawain_03`（text）
**演出:** bg: bg_road_day
```text
振り返ると、砂埃にまみれた甲冑をまとう巨漢が立っていた。額に古い傷がある。
```

#### `gawain_04`（text）
**演出:** bg: bg_road_day, speaker: ガウェイン
```text
「ほう、お前が今日の新しい肉壁か。剣の腕は少しは期待できるんだろうな」
```

#### `choice1`（choice）
**演出:** bg: bg_road_day
| 選択肢 | next_node |
|---------|-----------|
| 「急いで積み込みます」 | `react_01` |
| 「あんたはここで指図するだけか？」 | `react_01` |

#### `react_01`（text）
**演出:** bg: bg_road_day
```text
男は鼻で笑った。だが、兜の奥の鋭い眼光は一切笑っていなかった。
```

#### `react_02`（text）
**演出:** bg: bg_road_day, speaker: ガウェイン
```text
「威勢はいいが、口だけの奴から戦場で冷たくなっていく。忘れるなよ」
```

#### `name_01`（text）
**演出:** bg: bg_road_day, speaker: ガウェイン
```text
「俺はガウェイン。この小隊の長だ。死にたくなければ俺の背から離れるな」
```

#### `name_02`（text）
**演出:** bg: bg_road_day
```text
ガウェインは砂漠の地平線を見つめた。その瞳に深い哀愁が滲んでいた。
```

#### `gawain_join`（guest_join）
**演出:** bg: bg_road_day
**パラメータ:** guest_id: `npc_guest_gawain`

#### `alarm_01`（text）
**演出:** bg: bg_road_day, bgm: bgm_quest_tense
```text
ガウェインが何かを言いかけた、まさにその瞬間——
```

#### `alarm_02`（text）
**演出:** bg: bg_road_day, bgm: bgm_quest_tense
```text
風の唸りを超えて、複数の怒声と馬の嘶きがこちらへ迫ってきた！
```

#### `scout_01`（text）
**演出:** bg: bg_road_day, bgm: bgm_quest_tense, speaker: 斥候兵
```text
「武装集団が接近！野盗です！」
```

#### `order_01`（text）
**演出:** bg: bg_road_day, bgm: bgm_quest_tense, speaker: ガウェイン
```text
ガウェインが素早く大剣を引き抜く。「各自武器を取れ！荷を死守するぞ！」
```

#### `taunt_01`（text）
**演出:** bg: bg_road_day, bgm: bgm_quest_tense, speaker: 野盗の頭目
```text
「おい王国の犬ども、荷を置いて失せな！」
```

#### `battle`（battle）
**演出:** bg: bg_road_day, bgm: bgm_battle
**パラメータ:** enemy_group_id: 200, next: `choice2`, fail: `end_failure_01`

#### `choice2`（choice）
**演出:** bg: bg_road_day, bgm: bgm_battle
| 選択肢 | next_node |
|---------|-----------|
| 「迎撃する」 | `post_01` |

#### `post_01`（text）
**演出:** bg: bg_road_day, bgm: bgm_quest_calm
```text
大剣を振り抜き、最後の野盗を沈めた。息が荒く、手が小刻みに震えている。
```

#### `dying_01`（text）
**演出:** bg: bg_road_day
```text
足元に倒れ伏した野盗が、息絶え絶えの状態でこちらを見上げてきた。
```

#### `dying_02`（text）
**演出:** bg: bg_road_day, speaker: 瀕死の野盗
```text
「やるな……だが、俺たちにこの荷を襲うよう依頼したのは……王国の官僚だ」
```

#### `dying_03`（text）
**演出:** bg: bg_road_day
```text
男は血を吐き、そのまま静かに事切れた。その言葉だけが重く残る。
```

#### `look_01`（text）
**演出:** bg: bg_road_day
```text
ガウェインは死体を見下ろした。その表情は、鬼のように険しかった。
```

#### `praise_01`（text）
**演出:** bg: bg_road_day, speaker: ガウェイン
```text
「……悪くない太刀筋だ。新兵の初陣としてはな。生き残ったことを誇れ」
```

#### `praise_02`（text）
**演出:** bg: bg_road_day
```text
老騎士は一度だけ肩を叩いた。まるで大岩のような、温かく重い手だった。
```

#### `depart_01`（text）
**演出:** bg: bg_road_day, speaker: ガウェイン
```text
「荷馬車を出すぞ。日が暮れる前に、次の宿場町へ滑り込まねばならん」
```

#### `farewell`（text）
**演出:** bg: bg_road_day, speaker: ガウェイン
```text
「また戦場で会おう。生き延びろよ、新入り。お前にはまだ先がある」
```

#### `gawain_leave`（leave）
**演出:** bg: bg_road_day
**パラメータ:** guest_id: `npc_guest_gawain`

#### `end_01`（text）
**演出:** bg: bg_road_day
```text
宿場に着き任務は完了した。老騎士の背中が、砂埃の向こうへ消えていく。
```

#### `end_node`（end_success）
**演出:** bg: bg_road_day
```text
「王国の連中が依頼した」——野盗の遺言が、いつまでも耳から離れない。
```
**rewards:** Exp:80, Gold:150, Rep:5, Order:5

#### `end_failure_01`（text）
**演出:** bg: bg_road_day, bgm: bgm_quest_tense
**次ノード:** `end_failure`
```text
野盗の包囲を崩せず、無数に浴びた刃の傷に崩れ落ちる。意識が混濁していく……
```

#### `end_failure`（end_failure）
**演出:** bg: bg_road_day
```text
初陣の地が墓標となった。守るべき物資も、野盗の手に落ちてしまった。
```
**rewards:** Gold:0
