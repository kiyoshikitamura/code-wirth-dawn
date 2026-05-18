# クエスト仕様書：7044 — 沿岸を荒らす海賊の討伐

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7044 |
| **Slug** | `qst_har_pirate` |
| **クエスト種別** | 華龍クエスト（Karyu） |
| **推奨レベル** | 7（Normal） |
| **難度** | 2 |
| **依頼主** | 港町の長 |
| **出現条件** | 制限なし / 出現拠点: loc_haryu |
| **リピート** | リピート可能 |
| **難易度Tier** | Normal（rec_level: 7） |
| **経過日数 (time_cost)** | 5（成功: 5日 / 失敗: 3日） |
| **ノード数** | 35ノード（うち選択肢1件） |
| **サムネイル画像** | `/images/quests/bg_karyu_port.png` |

---

## 1. クエスト概要

### 短文説明
```
[討伐] 水賊の拠点へ奇襲をかけ、略奪品を奪い返す。
```

### 長文説明
```
華龍国の南沿岸を荒らす水賊を討伐する。
港町の長も水賊から上前を撥ねており、
本当の目的は勢力削減に過ぎないらしい。
```

---

## 2. 報酬定義

**CSV記載形式（デフォルトルート）:**
```
Gold:400|Exp:120|Chaos:5
```

**ルート別報酬差異:**
| ルート | Gold | Exp | アライメント |
|--------|------|-----|-------------|
| 頭目を倒す（デフォルト） | 400 | 120 | Chaos:5 |
| 頭目を見逃す（選択肢） | 250 | 120 | Evil:5 |

---

## 2.5 失敗ペナルティ

| 項目 | 値 |
|-----|-----|
| VIT変動 | VIT -1 |
| 経過日数（失敗） | 3日 |

---

## 3. シナリオノードフロー

```text
start
 └─ start_02
     └─ start_03
         └─ intel_01
             └─ intel_02
                 └─ intel_03
                     └─ intel_04
                         └─ night_01
                             └─ night_02
                                 └─ night_03
                                     └─ cove_01
                                         └─ cove_02
                                             └─ climb_01
                                                 └─ climb_02
                                                     └─ surprise_01
                                                         └─ surprise_02
                                                             └─ surprise_03
                                                                 └─ battle_deck
                                                                      ├─ win → clear_01
                                                                      │        └─ clear_02
                                                                      │             └─ ship_01
                                                                      │                  └─ ship_02
                                                                      │                       └─ ship_03
                                                                      │                            └─ battle_captain
                                                                      │                                 ├─ win → captain_01
                                                                      │                                 │        └─ captain_02
                                                                      │                                 │             └─ captain_03
                                                                      │                                 │                  └─ choice_captain
                                                                      │                                 │                       ├─ 止め → cargo_01
                                                                      │                                 │                       │          └─ cargo_02
                                                                      │                                 │                       │               └─ end_success
                                                                      │                                 │                       └─ 見逃す → deal_01
                                                                      │                                 │                                    └─ deal_02
                                                                      │                                 │                                         └─ end_success_deal
                                                                      │                                 └─ lose → end_failure
                                                                      └─ lose → end_failure
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_karyu_port, bgm: bgm_quest_calm, speaker: 港町の長
```text
華龍国の南沿岸にある港町。
その顔役である長から、手書きの海図と討伐の依頼書を受け取った。
```

#### `start_02`（text）
**演出:** bg: bg_karyu_port, bgm: bgm_quest_calm, speaker: 港町の長
```text
「沿岸を荒らしている忌々しい水賊どもめ。奴らの本拠地がようやく割れた」
```

#### `start_03`（text）
**演出:** bg: bg_karyu_port, bgm: bgm_quest_calm, speaker: 港町の長
```text
「水賊の船は岬の裏側の入り江に停泊している。奪われた荷物は一つ残らず港に返してくれ」
そう言う長の目は、正義感からではなく、計算高く欲深い光を帯びていた。
```

#### `intel_01`（text）
**演出:** bg: bg_karyu_port, bgm: bgm_field
```text
奇襲をかける前に、港の薄汚れた酒場で水賊たちの情報を集めることにした。
```

#### `intel_02`（text）
**演出:** bg: bg_karyu_port, bgm: bgm_field
```text
酔客の話によると、水賊は中型のガレオン船を三隻所有する大規模な集団らしい。
```

#### `intel_03`（text）
**演出:** bg: bg_karyu_port, bgm: bgm_field
```text
頭目は「黒鰐（くろわに）」と呼ばれる大男で、元帝国海軍の将校だったという噂だ。
```

#### `intel_04`（text）
**演出:** bg: bg_karyu_port, bgm: bgm_field
```text
「単なるならず者じゃない。戦い方は一流の軍人のそれだ」
酒場の主人が青ざめた顔でそう忠告してくれた。
```

#### `night_01`（text）
**演出:** bg: bg_karyu_coast, bgm: bgm_field_night
```text
夜半過ぎ。月が雲に隠れたのを見計らい、用意した小舟を静かに漕ぎ出す。
```

#### `night_02`（text）
**演出:** bg: bg_karyu_coast, bgm: bgm_field_night
```text
岬を大回りして迂回する。海は墨を流したように暗く、潮の匂いが鼻をつく。
```

#### `night_03`（text）
**演出:** bg: bg_karyu_coast, bgm: bgm_field_night
```text
波の音だけが響く中、遠くの暗闇にポツンと浮かぶ入り江の松明が見えてきた。
```

#### `cove_01`（text）
**演出:** bg: bg_karyu_coast, bgm: bgm_quest_tense
```text
入り江の奥に接近する。情報通り、三隻の船が寄り添うように停泊していた。
```

#### `cove_02`（text）
**演出:** bg: bg_karyu_coast, bgm: bgm_quest_tense
```text
一番巨大な旗艦の舷側から、太い錨の鎖が海面に向かってぶら下がっている。あそこから登れそうだ。
```

#### `climb_01`（text）
**演出:** bg: bg_karyu_coast, bgm: bgm_quest_tense
```text
小舟を密かに接舷させ、濡れて滑る重い鎖を力一杯握りしめる。
```

#### `climb_02`（text）
**演出:** bg: bg_karyu_coast, bgm: bgm_quest_tense
```text
海に落ちないよう慎重に這い上がり、甲板の縁に指をかけた。見張りの足音が遠ざかる……今だ。
```

#### `surprise_01`（text）
**演出:** bg: bg_karyu_coast, bgm: bgm_quest_tense
```text
音もなく甲板に翻り、背を向けていた見張りの口を塞いで一瞬で組み伏せた。
```

#### `surprise_02`（text）
**演出:** bg: bg_karyu_coast, bgm: bgm_quest_tense
```text
しかし、マストの上にいたもう一人の見張りがこちらの存在に気づいた。
```

#### `surprise_03`（text）
**演出:** bg: bg_karyu_coast, bgm: bgm_quest_tense, speaker: 水賊
```text
「敵だ！ 甲板に侵入者だ！ 野郎ども起きろォッ！！」
銅鑼の音がけたたましく鳴り響き、船全体が揺れるような怒号が巻き起こった。
```

#### `battle_deck`（battle）
**演出:** bg: bg_karyu_coast, bgm: bgm_battle
```text
寝込みを襲われた水賊たちが、武器を手に群がってきた！
```
**パラメータ:** type: battle, enemy_group_id: 447, next: clear_01, fail: end_failure

#### `clear_01`（text）
**演出:** bg: bg_karyu_coast, bgm: bgm_quest_tense
```text
血塗られた甲板。雑兵どもを海へと蹴り落とし、船の上層部の制圧を完了した。
```

#### `clear_02`（text）
**演出:** bg: bg_karyu_coast, bgm: bgm_quest_tense
```text
静まり返った甲板に、真下の船倉から地鳴りのような重い足音と怒号が響いてきた。
```

#### `ship_01`（text）
**演出:** bg: bg_karyu_coast, bgm: bgm_quest_tense
```text
階段を下り、船長室の分厚いオーク材の扉を蹴り開ける。
```

#### `ship_02`（text）
**演出:** bg: bg_karyu_coast, bgm: bgm_quest_tense
```text
室内には、全身に無数の刀傷を刻んだ筋骨隆々の大男が、巨大な戦斧を手にして仁王立ちしていた。
```

#### `ship_03`（text）
**演出:** bg: bg_karyu_coast, bgm: bgm_quest_tense, speaker: 水賊の頭目「黒鰐」
```text
「たかが冒険者一人で俺の船に乗り込むとは、いい度胸だ。海の藻屑にしてやる！！」
```

#### `battle_captain`（battle）
**演出:** bg: bg_karyu_coast, bgm: bgm_battle_boss
```text
水賊の頭目「黒鰐」との決戦！
```
**パラメータ:** type: battle, enemy_group_id: 448, next: captain_01, fail: end_failure

#### `captain_01`（text）
**演出:** bg: bg_karyu_coast, bgm: bgm_quest_calm
```text
激しい戦斧の猛攻を紙一重で躱し、大男の急所に刃を突き立てた。
```

#### `captain_02`（text）
**演出:** bg: bg_karyu_coast, bgm: bgm_quest_calm, speaker: 水賊の頭目「黒鰐」
```text
「ガハッ……見事だ……」
黒鰐が重い音を立てて膝をついた。血にまみれながらも、軍人としての誇り高い目は死んでいない。
```

#### `captain_03`（text）
**演出:** bg: bg_karyu_coast, bgm: bgm_quest_calm, speaker: 水賊の頭目「黒鰐」
```text
「港の長に言っておけ。俺が襲った商船の利益の二割は、あの男の懐に入っていたとな……」
どうやら、長の目的は「上前を撥ねていた自分たちの秘密を消すこと」だったらしい。
```

#### `choice_captain`（choice）
**演出:** bg: bg_karyu_coast, bgm: bgm_quest_calm
```text
膝をつき、死を覚悟した黒鰐に止めを刺すか？
```
- 選択肢: 「止めを刺す——悪党の事情は関係ない」→ `cargo_01`
- 選択肢: 「見逃す——長を強請るための手駒にする」→ `deal_01`

#### `cargo_01`（text）
**演出:** bg: bg_karyu_coast, bgm: bgm_quest_calm
```text
誰が裏で糸を引いていようと、自分の仕事は依頼の完遂だ。
無言で刃を振り下ろし、黒鰐の首を刎ねた。
```

#### `cargo_02`（text）
**演出:** bg: bg_karyu_coast, bgm: bgm_quest_calm
```text
船倉には絹布、陶磁器、茶箱といった略奪品が山のように積まれていた。
生き残った水賊に船を操縦させ、港へと帰還する。
```

#### `end_success`（end_success）
**演出:** bg: bg_guild
```text
水賊討伐完了。港町の長から、安堵の表情と共に報酬を受け取った。
「これで港も静かになる。本当にありがたい」——白々しい嘘に付き合う義理はない。
```
**rewards:** Gold:400, Exp:120, Chaos:5

#### `deal_01`（text）
**演出:** bg: bg_karyu_coast, bgm: bgm_quest_calm
```text
刃を下ろし、黒鰐を見逃す代わりに「長との裏取引の証拠」を渡すよう持ちかけた。
```

#### `deal_02`（text）
**演出:** bg: bg_karyu_coast, bgm: bgm_quest_calm, speaker: 水賊の頭目「黒鰐」
```text
「ククッ……欲の皮が突っ張った面白い冒険者だな。いいだろう」
黒鰐は血まみれの顔で笑い、隠し金庫から分厚い帳簿を取り出して渡した。
```

#### `end_success_deal`（end_success）
**演出:** bg: bg_guild
```text
長には「頭目は逃げた。だが荷は取り返した」とだけ報告し、一部の報酬を受け取る。
悪人と悪人の間を泳ぎ回り、利益を掠め取る……。この国で生き残るには、これが一番賢いやり方だ。
```
**rewards:** Gold:250, Exp:120, Evil:5

#### `end_failure`（end_failure）
**演出:** bg: bg_karyu_coast
```text
黒鰐の振るう戦斧の一撃をまともに受け、身体が宙に浮いた。
冷たい海へと叩き落とされ、塩水に肺を焼かれながら、意識は深い海の底へと沈んでいった……。
```

---

## 4. 新規エネミー・アイテム定義参照

**新規追加エネミー（`enemies.csv`）:**
| ID | Slug | name | level | hp | atk | def | exp | gold |
|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| 1257 | `enemy_karyu_pirate` | 水賊 | 10 | 90 | 38 | 5 | 35 | 60 |
| 1258 | `enemy_karyu_pirate_captain` | 水賊の頭目 | 15 | 200 | 55 | 8 | 100 | 200 |

**新規追加グループ（`enemy_groups.csv`）:**
| ID | Slug | 構成エネミー |
|-----|-----|-----|
| 447 | `grp_karyu_pirate_crew` | `enemy_karyu_pirate`\|`enemy_karyu_pirate`\|`enemy_karyu_pirate` |
| 448 | `grp_karyu_pirate_boss` | `enemy_karyu_pirate_captain`\|`enemy_karyu_pirate` |

---

## 5. CSVエントリ

`quests_normal.csv`
```csv
7044,qst_har_pirate,沿岸を荒らす海賊の討伐,7,2,5,loc_haryu,,,,,Gold:400|Exp:120|Chaos:5,港町の長,[討伐] 水賊の拠点へ奇襲をかけ、略奪品を奪い返す。
```

---

## 6. 実装チェックリスト

- [x] 新規エネミー ID:1257, 1258 がDBに登録済み
- [x] エネミーグループ 447, 448 がDBに登録済み
- [x] 2連戦（通常→ボス）フローが正しく動作する
- [x] 選択肢「止めを刺す」→ Chaos:5 / 「見逃す」→ Evil:5 が正しく分岐
- [x] time_cost: 5（成功5日 / 失敗3日）
