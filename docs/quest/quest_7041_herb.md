# クエスト仕様書：7041 — 仙丹の材料となる霊草採集

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7041 |
| **Slug** | `qst_har_herb` |
| **クエスト種別** | 華龍クエスト（Karyu） |
| **推奨レベル** | 7（Normal） |
| **難度** | 2 |
| **依頼主** | 宦官 |
| **出現条件** | 制限なし / 出現拠点: loc_haryu |
| **リピート** | リピート可能 |
| **難易度Tier** | Normal（rec_level: 7） |
| **経過日数 (time_cost)** | 6（成功: 6日 / 失敗: 3日） |
| **ノード数** | 35ノード |
| **サムネイル画像** | `/images/quests/bg_karyu_mountain.png` |

---

## 1. クエスト概要

### 短文説明
```
[納品] 仙丹の材料となる稀少な霊草を宦官へ納品。
```

### 長文説明
```
宦官から秘密裏に依頼された霊草採集。断崖の岩棚まで往復数日。
仙丹の真の用途が暗殺である可能性を宦官は否定しなかった。
```

---

## 2. 報酬定義

**CSV記載形式:**
```
Gold:300|Exp:100|Evil:5
```

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
         └─ start_04
             └─ leave_01
                 └─ leave_02
                     └─ leave_03
                         └─ approach_01
                             └─ approach_02
                                 └─ approach_03
                                     └─ climb_01
                                         └─ climb_02
                                             └─ climb_03
                                                 └─ climb_04
                                                     └─ cliff_danger (hp_damage)
                                                         └─ cliff_danger_02
                                                             └─ cliff_danger_03
                                                                 └─ find_herb (random_branch: prob 40)
                                                                      ├─ next → guard_01
                                                                      │          └─ guard_02
                                                                      │               └─ guard_03
                                                                      │                    └─ guard_04
                                                                      │                         └─ battle_guardian
                                                                      │                              ├─ win → collect_01
                                                                      │                              └─ lose → end_failure
                                                                      └─ fallback → collect_01 ━━━ (合流)
collect_01
 └─ collect_02
     └─ collect_03
         └─ collect (reward)
             └─ descent_01
                 └─ descent_02
                     └─ descent_03
                         └─ deliver (check_delivery)
                              ├─ next → deliver_02
                              │          └─ end_success
                              └─ fallback → end_failure_lost
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_karyu_palace, bgm: bgm_quest_calm, speaker: 宦官
```text
「よく来てくれました。他ならぬ、腕利きのあなたに頼みたい儀があるのです」
宮殿の奥深くに通され、宦官から古い図絵と山脈の地図を受け取った。
```

#### `start_02`（text）
**演出:** bg: bg_karyu_palace, bgm: bgm_quest_calm, speaker: 宦官
```text
「皇帝陛下に献上する『仙丹』……その秘薬の要となる『霊草』を摘んできてほしいのです」
```

#### `start_03`（text）
**演出:** bg: bg_karyu_palace, bgm: bgm_quest_calm, speaker: 宦官
```text
「霊草は茎が折れるとたちまち薬効を失います。根からそっと引き抜き、慎重に扱ってください」
```

#### `start_04`（text）
**演出:** bg: bg_karyu_palace, bgm: bgm_quest_calm, speaker: 宦官
```text
「それから……この件はくれぐれも内密に。仙丹の『真の使い道』は聞かないほうがよろしいかと」
冷たく細められた宦官の目に、底知れぬ悪意の気配を感じた。
```

#### `leave_01`（text）
**演出:** bg: bg_karyu_palace, bgm: bgm_field
```text
図絵を懐に忍ばせ、宮殿の裏門から人目を避けるようにして都を出る。
```

#### `leave_02`（text）
**演出:** bg: bg_karyu_palace, bgm: bgm_field
```text
地図によれば、霊草の自生地である西方霊山までは、急ぎ足でも片道三日はかかる。
```

#### `leave_03`（text）
**演出:** bg: bg_karyu_palace, bgm: bgm_field
```text
道中の食料と登山用の命綱をしっかりと確認し、長い旅路へと足を踏み出した。
```

#### `approach_01`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_field
```text
三日後。道なき道を進み、ようやく目的の山麓へと辿り着いた。
```

#### `approach_02`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_field
```text
雲の切れ間から、天を衝くような険しい断崖絶壁が覗いている。霊草はあの頂付近にあるという。
```

#### `approach_03`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_field
```text
風は冷たく、空気は薄い。高山病に気をつけながら、慎重に崖に取り付いた。
```

#### `climb_01`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_field
```text
岩肌に指をかけ、少しずつ上を目指す。見下ろせば、目が眩むような奈落が広がっている。
```

#### `climb_02`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_field
```text
山頂に近づくにつれ、湿った濃霧が立ち込め、岩肌が結露で滑りやすくなってきた。
```

#### `climb_03`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
```text
中腹のオーバーハングを越えようとしたその時、踏み込んだ岩の表面がボロッと崩れ落ちた！
```

#### `climb_04`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
```text
「くっ……！」
宙ぶらりんになりながらも、辛うじて別の突起に指を引っ掛け、全体重を支える。
```

#### `cliff_danger`（hp_damage）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
```text
無理な姿勢で身体を引き上げた代償として、鋭い岩角で手足を深く切り裂いてしまった。
```
**パラメータ:** type: hp_damage, hp_percent: 10, percent: 10, next: cliff_danger_02

#### `cliff_danger_02`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_field
```text
息を荒げながら、安全な岩棚へと這い上がる。傷口から滲む血を布で縛り、応急処置を施した。
```

#### `cliff_danger_03`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_field
```text
あのまま落ちていれば一貫の終わりだった。気を引き締め直し、さらに崖を登り続ける。
```

#### `find_herb`（random_branch）
**演出:** bg: bg_karyu_mountain, bgm: bgm_field
```text
ついに頂上付近の広い岩棚へと到達した。岩の隙間に、仄かに光る白い花をつけた植物が群生している。
間違いない、図絵に描かれていた「霊草」だ。
```
**パラメータ:** type: random_branch, prob: 40, next: guard_01, fallback: collect_01

#### `guard_01`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
```text
霊草に手を伸ばそうとしたその瞬間、岩陰から「グルル……」と地鳴りのような低い唸り声が響いた。
```

#### `guard_02`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
```text
姿を現したのは、額に一本の鋭い角を持ち、全身を硬い鱗で覆われた巨大な猛獣だ。
```

#### `guard_03`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
```text
霊草の放つ魔力を浴びて育った、山の「守護獣」。どうやら簡単には持ち帰らせてくれないらしい。
```

#### `guard_04`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
```text
獣が前足を高く掲げ、こちらを粉砕すべく怒り狂った咆哮を上げた！
```

#### `battle_guardian`（battle）
**演出:** bg: bg_karyu_mountain, bgm: bgm_battle
```text
霊草の守護獣が牙を剥いて襲いかかってきた！
```
**パラメータ:** type: battle, enemy_group_id: 442, next: collect_01, fail: end_failure

#### `collect_01`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_calm
```text
周囲の安全を確保し、ようやく霊草の前に膝をつく。これ以上傷つけないよう慎重に周囲の土を掘る。
```

#### `collect_02`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_calm
```text
宦官の言葉通り、茎を折らないように根元からそっと引き抜き、持参した柔らかい布で優しく包み込んだ。
```

#### `collect_03`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_calm
```text
採取は無事に完了した。しかし、まだ仕事は半分だ。これを萎れる前に都まで持ち帰らねばならない。
```

#### `collect`（reward）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_calm
```text
「霊草」を手に入れた！
```
**パラメータ:** type: reward, item_id: `item_spirit_herb`, quantity: 3, next: descent_01

#### `descent_01`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_field
```text
霊草を大切に懐へ収め、登りよりもさらに気を使いながら、危険な断崖を慎重に下っていく。
```

#### `descent_02`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_field
```text
崖を下りきった後は、休む間もなく都への帰路を急いだ。
```

#### `descent_03`（text）
**演出:** bg: bg_karyu_palace, bgm: bgm_quest_calm
```text
三日後。夜陰に乗じて宮殿の裏門へと戻り、待ち構えていた宦官の元へと赴く。
```

#### `deliver`（check_delivery）
**演出:** bg: bg_karyu_palace, bgm: bgm_quest_calm
```text
布に包まれた霊草を机の上に置く。宦官は震える手でそれを開き、恍惚とした表情を浮かべた。
```
**パラメータ:** type: check_delivery, item_id: `item_spirit_herb`, quantity: 3, next: deliver_02, fallback: end_failure_lost

#### `deliver_02`（text）
**演出:** bg: bg_karyu_palace, bgm: bgm_quest_calm, speaker: 宦官
```text
「おお……見事な出来だ。一片の傷もない。これで『皇帝陛下のため』の最高の上薬が練れましょう……」
```

#### `end_success`（end_success）
**演出:** bg: bg_guild
```text
薄ら笑いを浮かべる宦官から、ずっしりと重い金袋を受け取る。
その仙丹が本当に「不老長寿」をもたらすのか、それとも「静かなる死」をもたらすのか、知る由もない。
```
**rewards:** Gold:300, Exp:100, Evil:5

#### `end_failure_lost`（end_failure）
**演出:** bg: bg_karyu_palace, speaker: 宦官
```text
「霊草がない？ ……まさか、折ってしまったのではあるまいな？ 役立たずめ、報酬は払えぬ！」
宦官の冷たい言葉と共に、宮殿から追い出されてしまった。
```

#### `end_failure`（end_failure）
**演出:** bg: bg_karyu_mountain
```text
守護獣の圧倒的な怪力と牙の前に、無情にも膝を突いた。
薄れゆく意識の中、崖に咲く白い霊草が、風に揺れて遠くに霞んで見える……。
```

---

## 4. 新規エネミー・アイテム定義参照

**新規追加エネミー（`enemies.csv`）:**
| ID | Slug | name | level | hp | atk | def | exp | gold |
|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| 1252 | `enemy_karyu_guardian_beast` | 霊草の守護獣 | 11 | 140 | 40 | 10 | 60 | 80 |

**新規追加グループ（`enemy_groups.csv`）:**
| ID | Slug | 構成エネミー |
|-----|-----|-----|
| 442 | `grp_karyu_guardian` | `enemy_karyu_guardian_beast` |

**新規追加アイテム（`items.csv`）:**
| ID | Slug | Name | Type | Value | Description |
|-----|-----|-----|-----|-----|-----|
| 3030 | `item_spirit_herb` | 霊草 | material | 0 | 白い花をつける希少な薬草。仙丹の材料。 |

---

## 5. CSVエントリ

`quests_normal.csv`
```csv
7041,qst_har_herb,仙丹の材料となる霊草採集,7,2,6,loc_haryu,,,,,Gold:300|Exp:100|Evil:5,宦官,[納品] 仙丹の材料となる稀少な霊草を宦官へ納品。
```

---

## 6. 実装チェックリスト

- [x] 新規エネミー `enemy_karyu_guardian_beast`（ID: 1252）がDBに登録済み
- [x] エネミーグループ 442 がDBに登録済み
- [x] アイテム `item_spirit_herb`（ID: 3030）がDBに登録済み
- [x] `hp_damage`（10%）が正しく適用される
- [x] `random_branch` 40%判定が正しく動作する
- [x] `check_delivery` で `item_spirit_herb` を消費→ `end_success`
- [x] time_cost: 6（成功6日 / 失敗3日）
