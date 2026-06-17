# クエスト仕様書：6007 — 第7話「異国の門」

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6007 |
| **Slug** | `main_ep07` |
| **クエスト種別** | メインエピソード（Main） |
| **推奨レベル** | 7（Normal） |
| **難度** | 1 |
| **依頼主** | ギルドマスター |
| **出現条件** | 第6話「逃亡者の道」（6006）クリア / 滞在拠点: 門前町 |
| **リピート** | アカウント通じて1回のみ（継承後も非表示） |
| **経過日数 (time_cost)** | 2 |
| **ノード数** | 43ノード |
| **ゲストNPC** | なし |
| **特記** | 分岐あり（機密書 / 傭兵）。機密書ルートは modify_reputation -30 |
| **難易度Tier** | Normal（rec_level: 7） |
| **サムネイル画像** | `/images/quests/bg_road_night.png` |
---

## 1. クエスト概要

### 短文説明
```
夜刀神国の黒金門。通行証なき身を隠し、異国の地へ入る道を探れ。
```

### 長文説明
```
聖王国の追っ手を振り切り、ついに夜刀神国の国境・黒金門へ到達した。
通行証を持たぬプレイヤーに、門番は冷たい刃を向ける。
```

---

## 2. 報酬定義

```
Exp:180|Gold:700|Rep:10|Justice:5|Items:item_pass_yato
```

---

## 3. シナリオノードフロー

```text
start
 └─ start_02
     └─ gate_01
         └─ gate_02
             └─ doc_01
                 └─ doc_02
                     └─ guard_01
                         └─ guard_02
                             └─ choice1
                                  ├─ 「機密書を渡して通る」 → betray_01
                                  │                              └─ betray_02
                                  │                                  └─ betray_03
                                  │                                      └─ betray_04
                                  │                                          └─ betray_05
                                  │                                              └─ betray_06
                                  │                                                  └─ betray_rep (modify_reputation)
                                  │                                                      └─ end_betray
                                  └─ 「傭兵として雇ってもらう」 → normal_01
                                                                  └─ normal_02
                                                                      └─ normal_03
                                                                          └─ normal_04
                                                                              └─ normal_05
                                                                                  └─ normal_06
                                                                                      └─ tengu_01
                                                                                          └─ tengu_02
                                                                                              └─ tengu_03
                                                                                                  └─ tengu_04
                                                                                                      └─ tengu_05
                                                                                                          └─ battle
                                                                                                               ├─ win → choice2
                                                                                                               │          └─ 「天狗の羽を回収する」 → dead_01
                                                                                                               │                                          └─ dead_01
                                                                                                               │                                              └─ dead_02
                                                                                                               │                                                  └─ dead_03
                                                                                                               │                                                      └─ dead_04
                                                                                                               │                                                          └─ dead_05
                                                                                                               │                                                              └─ dead_06
                                                                                                               │                                                                  └─ dead_07
                                                                                                               │                                                                      └─ end_node
                                                                                                               └─ lose → end_failure_01
                                                                                                                            └─ end_failure
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_road_night, bgm: bgm_quest_mystery
```text
夜の闇が、険しい国境の山嶺を深く包み込んでいる。
```

#### `start_02`（text）
**演出:** bg: bg_road_night
```text
黒金門。夜刀神国の威容を示す、巨大な鉄製の門が立ち塞がる。
```

#### `gate_01`（text）
**演出:** bg: bg_road_night
```text
松明の炎が風に揺れ、警備に立つ東洋の甲冑を着た衛兵たちを照らす。
```

#### `gate_02`（text）
**演出:** bg: bg_road_night
```text
門をくぐれば夜刀神国だが、手元に通行証はない。
```

#### `doc_01`（text）
**演出:** bg: bg_road_night
```text
懐を探ると、途中で息絶えた夜刀の斥候から託された書状に指が触れた。
```

#### `doc_02`（text）
**演出:** bg: bg_road_night
```text
厳重に封印された書状。そこには極めて秘匿性の高い軍事機密が記されている。
```

#### `guard_01`（text）
**演出:** bg: bg_road_night, speaker: 黒金門の警備兵
```text
「待て。これより先は夜刀神国領だ。通行証の提示を求める」
```

#### `guard_02`（text）
**演出:** bg: bg_road_night, speaker: 黒金門の警備兵
```text
「持たぬ者は引き返せ。無理に通るならば、即刻切り捨てだ」
```

#### `choice1`（choice）
**演出:** bg: bg_road_night
| 選択肢 | next_node |
|---------|-----------|
| 「機密書を渡して通る」 | `betray_01` |
| 「傭兵として雇ってもらう」 | `normal_01` |

#### `betray_01`（text）
**演出:** bg: bg_road_night
```text
「……通行証はないが、これを見れば態度が変わるはずだ」
```

#### `betray_02`（text）
**演出:** bg: bg_road_night
```text
懐から血痕のついた軍事機密書を取り出し、衛兵に手渡す。
```

#### `betray_03`（text）
**演出:** bg: bg_road_night, speaker: 黒金門の警備兵
```text
「これは……我が国の印章。まさか、行方不明になっていた斥候の物か！」
```

#### `betray_04`（text）
**演出:** bg: bg_road_night, speaker: 黒金門の警備兵
```text
「内容を確認する……よし、間違いない。我らにとって極めて重要な書状だ」
```

#### `betray_05`（text）
**演出:** bg: bg_road_night, speaker: 黒金門の警備兵
```text
「書状をもたらした功績に免じ、特別に通してやろう。だが口は慎めよ」
```

#### `betray_06`（text）
**演出:** bg: bg_road_night
```text
死者の託した想いを、己の安全のために売り渡した。胸に暗い泥が沈む。
```

#### `betray_rep`（modify_reputation）
**パラメータ:** amount: -30

#### `end_betray`（end_success）
**演出:** bg: bg_road_night
```text
重い門扉が軋みながら開く。良心の呵責を抱え、あなたは門をくぐった。
```
**rewards:** Exp:180, Gold:300, Rep:10, Order:5

#### `normal_01`（text）
**演出:** bg: bg_road_night
```text
「通行証はないが、旅の傭兵だ。門の内側で何か手伝える仕事はないか？」
```

#### `normal_02`（text）
**演出:** bg: bg_road_night, speaker: 黒金門の警備兵
```text
「ただの素浪人か。ふん、腕に自信があると言うのだな？」
```

#### `normal_03`（text）
**演出:** bg: bg_road_night
```text
衛兵は腕を組み、ニヤリと不敵な笑みを浮かべた。
```

#### `normal_04`（text）
**演出:** bg: bg_road_night, speaker: 黒金門の警備兵
```text
「ならばちょうどいい。黒金門の裏山に、人喰いの天狗が巣食っておる」
```

#### `normal_05`（text）
**演出:** bg: bg_road_night, speaker: 黒金門の警備兵
```text
「そ奴を退治し、証拠に天狗の羽を持ち帰れ。さすれば通行を許そう」
```

#### `normal_06`（text）
**演出:** bg: bg_road_night
```text
天狗退治。命がけの試練だが、正当に門を通るには受ける他ない。
```

#### `tengu_01`（text）
**演出:** bg: bg_road_night, bgm: bgm_quest_tense
```text
風が吠える裏山へと分け入る。木々が怪異の形をして揺れていた。
```

#### `tengu_02`（text）
**演出:** bg: bg_road_night, bgm: bgm_quest_tense
```text
上空から、バサバサと巨大な翼の羽音が降りてくる。
```

#### `tengu_03`（text）
**演出:** bg: bg_road_night, bgm: bgm_quest_tense, speaker: 天狗
```text
「侵入者め……我が巣を荒らすか！」
```

#### `tengu_04`（text）
**演出:** bg: bg_road_night, bgm: bgm_quest_tense
```text
月光の逆光を浴びて、恐るべき天狗の影が崖の上に降り立った。
```

#### `tengu_05`（text）
**演出:** bg: bg_road_night, bgm: bgm_quest_tense
```text
鋭い鉤爪がこちらを狙う。逃げ場はない。武器を構えて迎え撃つ！
```

#### `battle`（battle）
**演出:** bg: bg_road_night, bgm: bgm_battle
**パラメータ:** enemy_group_id: 205, next: `choice2`, fail: `end_failure_01`

#### `choice2`（choice）
**演出:** bg: bg_road_night, bgm: bgm_battle
| 選択肢 | next_node |
|---------|-----------|
| 「天狗の羽を回収する」 | `dead_01` |

#### `dead_01`（text）
**演出:** bg: bg_road_night, bgm: bgm_quest_calm
```text
息絶えた天狗の骸から、黒く輝く大羽を一本引き抜いた。
```

#### `dead_02`（text）
**演出:** bg: bg_road_night
```text
確かな戦果を手に、冷え切った夜の山道を黒金門へと引き返す。
```

#### `dead_03`（text）
**演出:** bg: bg_road_night, speaker: 黒金門の警備兵
```text
「おお、戻ったか！……まさか、本当に天狗の羽を持ち帰るとはな」
```

#### `dead_04`（text）
**演出:** bg: bg_road_night
```text
衛兵は羽を受け取り、驚愕と感嘆の眼差しをこちらに向けた。
```

#### `dead_05`（text）
**演出:** bg: bg_road_night, speaker: 黒金門の警備兵
```text
「見事な腕前だ。約束通り、お前の実力を認め、通行を許可する」
```

#### `dead_06`（text）
**演出:** bg: bg_road_night, speaker: 黒金門の警備兵
```text
「ようこそ夜刀神国へ。腕の立つ傭兵なら、都でいくらでも仕事があるぞ」
```

#### `dead_07`（text）
**演出:** bg: bg_road_night
```text
鉄の門が重々しく開かれ、その先に新たな異国への道が広がっていた。
```

#### `end_node`（end_success）
**演出:** bg: bg_road_night
```text
試練を乗り越え、あなたは堂々と夜刀神国の地へと足を踏み入れた。
```
**rewards:** Exp:180, Gold:700, Rep:10, Justice:5, Items:item_pass_yato

#### `end_failure_01`（text）
**演出:** bg: bg_road_night, bgm: bgm_quest_tense
**次ノード:** `end_failure`
```text
天狗の鋭い突風と爪の前に、地面に叩きつけられ動けなくなった。
```

#### `end_failure`（end_failure）
**演出:** bg: bg_road_night
```text
薄れゆく意識の中、黒金門の関所を目の前にして力尽きた。
```
**rewards:** Gold:0
