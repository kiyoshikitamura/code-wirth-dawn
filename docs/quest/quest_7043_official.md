# クエスト仕様書：7043 — 巡検使の護衛と汚職隠蔽

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7043 |
| **Slug** | `qst_har_official` |
| **クエスト種別** | 華龍クエスト（Karyu） |
| **推奨レベル** | 7（Normal） |
| **難度** | 2 |
| **依頼主** | 悪徳官僚 |
| **出現条件** | 制限なし / 出現拠点: loc_haryu |
| **リピート** | リピート可能 |
| **難易度Tier** | Normal（rec_level: 7） |
| **経過日数 (time_cost)** | 6（成功: 6日 / 失敗: 4日） |
| **ノード数** | 35ノード |
| **サムネイル画像** | `/images/quests/bg_karyu_palace.png` |

---

## 1. クエスト概要

### 短文説明
```
[護衛] 悪徳官僚を暗殺者の刃から守り抜く。
```

### 長文説明
```
悪徳官僚・薛を三日三晩守り抜く護衛任務。
巡検使の視察中に暗殺者が襲来する。
汚職の片棒を担ぐことになるが報酬は破格。
```

---

## 2. 報酬定義

**CSV記載形式:**
```
Gold:500|Exp:120|Chaos:10|Evil:5
```

---

## 2.5 失敗ペナルティ

| 項目 | 値 |
|-----|-----|
| VIT変動 | VIT -1 |
| 経過日数（失敗） | 4日 |
| 特殊ペナルティ | 薛HP=0で即end_failure |

---

## 3. シナリオノードフロー

```text
start
 └─ start_02
     └─ start_03
         └─ start_04
             └─ start_05
                 └─ join_official (guest_join)
                     └─ tour_01
                         └─ tour_02
                             └─ tour_03
                                 └─ night_01
                                     └─ night_02
                                         └─ night_03
                                             └─ night_04
                                                 └─ ambush_01
                                                     └─ ambush_02
                                                         └─ battle_01
                                                              ├─ win → morning_01
                                                              │        └─ morning_02
                                                              │             └─ inspect_01
                                                              │                  └─ inspect_02
                                                              │                       └─ inspect_03
                                                              │                            └─ evening_01
                                                              │                                 └─ evening_02
                                                              │                                      └─ evening_03
                                                              │                                           └─ evening_04
                                                              │                                                └─ battle_02
                                                              │                                                     ├─ win → over_01
                                                              │                                                     │        └─ over_02
                                                              │                                                     │             └─ over_03
                                                              │                                                     │                  └─ over_04
                                                              │                                                     │                       └─ leave_official (leave)
                                                              │                                                     │                            └─ end_success
                                                              │                                                     └─ lose → end_failure
                                                              └─ lose → end_failure
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_karyu_palace, bgm: bgm_quest_tense, speaker: 薛
```text
都の一等地にそびえる豪邸の奥座敷。
脂肪で顔を膨らませた官僚、薛（せつ）が絹の長椅子に身を沈めていた。
```

#### `start_02`（text）
**演出:** bg: bg_karyu_palace, bgm: bgm_quest_tense, speaker: 薛
```text
「……明日から三日間、都より『巡検使』様が視察に見えられる。
　私のささやかな……帳簿の不備を、調べに来るらしい」
```

#### `start_03`（text）
**演出:** bg: bg_karyu_palace, bgm: bgm_quest_tense, speaker: 薛
```text
「だが、真の目的は帳簿ではない。政敵が私を消すため、暗殺者を紛れ込ませたというのだ」
```

#### `start_04`（text）
**演出:** bg: bg_karyu_palace, bgm: bgm_quest_tense, speaker: 薛
```text
「巡検使が去るまでの三日三晩、この屋敷にとどまり、私を刺客から守り抜いてほしい」
```

#### `start_05`（text）
**演出:** bg: bg_karyu_palace, bgm: bgm_quest_tense, speaker: 薛
```text
薛は、机の上に金の延べ棒がぎっしりと詰まった箱を滑らせた。
「報酬は弾もう。私の命は何より高いからな」
```

#### `join_official`（guest_join）
**演出:** bg: bg_karyu_palace, bgm: bgm_quest_calm
```text
「私は文官ですから。戦いはすべて任せますよ」
悪徳官僚・薛が護衛対象としてパーティに加わった。
```
**パラメータ:** type: guest_join, guest_id: npc_corrupt_official, is_escort_target: true, next: tour_01

#### `tour_01`（text）
**演出:** bg: bg_karyu_palace, bgm: bgm_quest_calm
```text
案内された屋敷の庭園は、華龍の一般市民が一生働いても作れないほど広大だった。
```

#### `tour_02`（text）
**演出:** bg: bg_karyu_palace, bgm: bgm_quest_calm
```text
金魚が優雅に泳ぐ池と、宝石を散りばめたような灯籠。まさに汚職の象徴である。
```

#### `tour_03`（text）
**演出:** bg: bg_karyu_palace, bgm: bgm_quest_calm, speaker: 使用人
```text
すれ違った使用人が小声で教えてくれた。既に前の護衛が二名、毒針で暗殺されたのだという。
```

#### `night_01`（text）
**演出:** bg: bg_karyu_palace, bgm: bgm_field_night
```text
初日の夜。豪華な寝所で震える薛の部屋の前に立ち、屋敷の巡回と警護を開始する。
```

#### `night_02`（text）
**演出:** bg: bg_karyu_palace, bgm: bgm_field_night
```text
月明かりが庭園の池を美しく照らしている。虫の音しか聞こえない、静寂に包まれた夜だ。
```

#### `night_03`（text）
**演出:** bg: bg_karyu_palace, bgm: bgm_field_night
```text
だが、自分の勘が危険を告げた。風もないのに、水面に映る月が不自然に波打っている。
```

#### `night_04`（text）
**演出:** bg: bg_karyu_palace, bgm: bgm_quest_tense
```text
池の底から、竹の筒を使って息を潜めていた影が、水飛沫と共に次々と跳び上がった！
```

#### `ambush_01`（text）
**演出:** bg: bg_karyu_palace, bgm: bgm_quest_tense
```text
黒装束に身を包んだ刺客たち。手には毒の塗られた短刀が鈍く光っている。
```

#### `ambush_02`（text）
**演出:** bg: bg_karyu_palace, bgm: bgm_quest_tense
```text
一人、二人、三人……。彼らの標的は明らかに、奥の部屋にいる薛だ。行かせるわけにはいかない。
```

#### `battle_01`（battle）
**演出:** bg: bg_karyu_palace, bgm: bgm_battle
```text
暗殺者の第1波が侵入してきた！
```
**パラメータ:** type: battle, enemy_group_id: 445, next: morning_01, fail: end_failure

#### `morning_01`（text）
**演出:** bg: bg_karyu_palace, bgm: bgm_quest_calm
```text
暗殺者たちを斬り捨て、死体を裏門から処分する。
夜が明けると、薛は何事もなかったようにのんびりと豪華な朝食を摂っていた。
```

#### `morning_02`（text）
**演出:** bg: bg_karyu_palace, bgm: bgm_quest_calm, speaker: 薛
```text
「おお、無事だったか。さすがだな。今夜も頼むぞ」
悪びれる様子もないその態度に、微かな嫌悪感を覚える。
```

#### `inspect_01`（text）
**演出:** bg: bg_karyu_palace, bgm: bgm_quest_calm
```text
二日目の昼。ついに都から巡検使の一団が屋敷に到着した。
先頭に立つのは、鋭い鷹のような目をした痩せぎすの男だ。
```

#### `inspect_02`（text）
**演出:** bg: bg_karyu_palace, bgm: bgm_quest_calm
```text
巡検使は挨拶もそこそこに、薛の帳簿を開き、一行ずつ厳しい目で確認を始めた。
```

#### `inspect_03`（text）
**演出:** bg: bg_karyu_palace, bgm: bgm_quest_calm
```text
部屋の隅で護衛として控える。薛の額には、隠しきれないほどの冷や汗が浮いていた。
```

#### `evening_01`（text）
**演出:** bg: bg_karyu_palace, bgm: bgm_quest_tense
```text
そして三日目の夕方。巡検使の厳しい追及をどうにか躱し、視察もいよいよ終わりに近づいていた。
```

#### `evening_02`（text）
**演出:** bg: bg_karyu_palace, bgm: bgm_quest_tense
```text
だが、急激に胸騒ぎがする。風の音が止み、鳥たちが一斉に屋敷の森から飛び去った。
```

#### `evening_03`（text）
**演出:** bg: bg_karyu_palace, bgm: bgm_quest_tense
```text
塀の外に、初日とは比べ物にならないほど多くの、そして研ぎ澄まされた殺気を感じる。
```

#### `evening_04`（text）
**演出:** bg: bg_karyu_palace, bgm: bgm_quest_tense
```text
「来たか……！」
障子を突き破り、上級の暗殺者たちが一斉になだれ込んできた！
```

#### `battle_02`（battle）
**演出:** bg: bg_karyu_palace, bgm: bgm_battle_boss
```text
政敵の放った精鋭の刺客部隊が襲来した！
```
**パラメータ:** type: battle, enemy_group_id: 446, next: over_01, fail: end_failure

#### `over_01`（text）
**演出:** bg: bg_karyu_palace, bgm: bgm_quest_calm
```text
激しい斬り合いの末、最後の刺客が崩れ落ちた。屋敷は血と破壊の痕にまみれている。
```

#### `over_02`（text）
**演出:** bg: bg_karyu_palace, bgm: bgm_quest_calm
```text
翌朝。帳簿の改ざんを最後まで見抜けなかった巡検使は、不満げに屋敷を去っていった。
```

#### `over_03`（text）
**演出:** bg: bg_karyu_palace, bgm: bgm_quest_calm, speaker: 薛
```text
「はぁ……はぁ……助かった……」
薛は膝から崩れ落ち、へたり込んで安堵の息を吐いた。
```

#### `over_04`（text）
**演出:** bg: bg_karyu_palace, bgm: bgm_quest_calm, speaker: 薛
```text
「約束の報酬だ。今後も私の身に何かあれば、必ずお前を頼ろう」
薛から、約束通り金の延べ棒が詰まった袋を渡された。
```

#### `leave_official`（leave）
**演出:** bg: bg_karyu_palace, bgm: bgm_quest_calm
```text
薛がパーティから離脱した。
三日三晩、暗殺者の凶刃からこの男の命を守り抜いた。
```
**パラメータ:** type: leave, guest_id: npc_corrupt_official, next: end_success

#### `end_success`（end_success）
**演出:** bg: bg_guild
```text
屋敷を後にする。重い金袋の感触だけが手元に残った。
守ったのは悪人であり、華龍国の腐敗は今後も続く。だが、自分にはそれだけの話だ。
```
**rewards:** Gold:500, Exp:120, Chaos:10, Evil:5

#### `end_failure`（end_failure）
**演出:** bg: bg_karyu_palace
```text
精鋭の刺客たちの変幻自在な動きに翻弄され、守備網を突破されてしまった。
背後で薛の断末魔の悲鳴が響き、やがて屋敷は深い静寂に包まれた……。
```

---

## 4. NPC定義：薛官僚

**新規追加NPC（`npcs.csv`）:**

| id | slug | epithet | name | job | level | max_hp | atk | def | cover_rate | hire_cost | inject_card_ids | flavor_text | _comment |
|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| 4060 | npc_corrupt_official | 悪徳官僚 | 薛 | Official | 1 | 40 | 0 | 1 | 10 | 0 | 8 | 「文官ですから。戦いは任せます」 | 護衛対象。HP40。 |

---

## 5. 新規エネミー・アイテム定義参照

**新規追加エネミー（`enemies.csv`）:**
| ID | Slug | name | level | hp | atk | def | exp | gold |
|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| 1255 | `enemy_karyu_assassin` | 刺客 | 10 | 80 | 40 | 3 | 35 | 60 |
| 1256 | `enemy_karyu_assassin_elite` | 精鋭刺客 | 14 | 130 | 55 | 5 | 60 | 100 |

**新規追加グループ（`enemy_groups.csv`）:**
| ID | Slug | 構成エネミー |
|-----|-----|-----|
| 445 | `grp_karyu_assassin_01` | `enemy_karyu_assassin`\|`enemy_karyu_assassin`\|`enemy_karyu_assassin_elite` |
| 446 | `grp_karyu_assassin_02` | `enemy_karyu_assassin_elite`\|`enemy_karyu_assassin_elite`\|`enemy_karyu_assassin` |

---

## 6. CSVエントリ

`quests_normal.csv`
```csv
7043,qst_har_official,巡検使の護衛と汚職隠蔽,7,2,6,loc_haryu,,,,,Gold:500|Exp:120|Chaos:10|Evil:5,悪徳官僚,[護衛] 悪徳官僚を暗殺者の刃から守り抜く。
```

---

## 7. 実装チェックリスト

- [x] NPC `npc_corrupt_official`（ID: 4060）がDBに登録済み
- [x] 新規エネミー ID:1255, 1256 がDBに登録済み
- [x] エネミーグループ 445, 446 がDBに登録済み
- [x] `guest_join` / `leave` で薛の合流・離脱が正しく動作
- [x] `is_escort_target` で薛HP=0が即 `end_failure`
- [x] time_cost: 6（成功6日 / 失敗4日）
