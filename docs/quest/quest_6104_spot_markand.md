# クエスト仕様書：6104 — 黄金の沈黙 ―マルカンド、禁忌の王墓―

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6104 |
| **Slug** | `qst_spot_markand` |
| **クエスト種別** | スポットシナリオ / ダンジョン探索（Special） |
| **推奨レベル** | 20（Hard） |
| **難度** | 5 |
| **依頼主** | 砂漠の語り部 |
| **出現条件** | メインep10クリア / マルカンド拠点滞在 / 混沌(Chaos)50%以上 |
| **リピート** | 現世代で1回（継承後は再出現） |
| **難易度Tier** | Hard（rec_level: 20） |
| **経過日数 (time_cost)** | 7 |
| **ノード数** | 40ノード |
| **サムネイル画像** | `/images/quests/bg_spot_markand_king.png` |

---

## 1. クエスト概要

### 短文説明
```
都を蝕む砂の病。不可視の呪いに守られた「禁忌の王墓」で、死の知略に挑め。
```

### 長文説明
```
マルカンドの地下深く、数千年間呪いに守られてきた「無名王の王墓」。
一歩進むたびに命を削る「呪い」と「言葉の罠」が待ち受ける。
謎を解き明かし、最深部に眠る王の呪いを止めろ。
```

---

## 2. 報酬定義

**ルートA（心臓破壊ルート）CSV記載形式:**
```
Exp:500|Gold:10000|Rep:200|Item:632
```

**ルートB（心臓を宿すルート）CSV記載形式:**
```
Exp:500|Rep:-100|Item:631
```

---

## 3. シナリオノード構成

### 全体フロー
```text
start → start_02 → start_03 → start_04 → start_monologue → trap_01 → trap_01_02 → choice_trap_01
  ├─[目を伏せた像（謙譲）]→ trap_02
  └─[両手を広げた像（傲慢）]→ battle_trap_01_intro → battle_trap_01 → trap_02
  (trap_02以降)
  trap_02 → trap_02_02 → choice_trap_02
  ├─[空の箱を選ぶ（沈黙）]→ trap_03
  └─[宝石の箱を選ぶ（欲望）]→ battle_trap_02_intro → battle_trap_02 → trap_03
  (trap_03以降)
  trap_03 → trap_03_02 → choice_trap_03
  ├─[「忘却」を選ぶ（真実）]→ boss_king_intro
  └─[「称賛」を選ぶ（偽り）]→ battle_trap_03_intro → battle_trap_03 → boss_king_intro
  (boss_king_intro以降)
  boss_king_intro → boss_king_intro_02 → boss_king_intro_03 → boss_king_intro_04 → battle_king
  → final_choice → final_choice_02 → choice_node
  ├─[心臓を破壊し呪いを断つ]→ end_break → end_break_02 → end_break_03
  └─[心臓を宿し呪いを制御する]→ end_curse → end_curse_02 → end_curse_03
  (各バトル敗北時) → end_failure
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_spot_markand_ruins, bgm: bgm_markand
```text
マルカンドの活気ある市場。そこで突如、人々の肌が砂のように崩れ落ちる奇病「砂の病」が発生し、恐怖が広がっていた。
```

#### `start_02`（text）
**演出:** bg: bg_spot_markand_ruins
```text
喧騒の冷めやらぬ酒場の片隅。砂漠の歴史を知る語り部の老人が、砂嵐の彼方に眠る廃墟を指差した。
```

#### `start_03`（text）
**演出:** bg: bg_spot_markand_ruins, speaker: 砂漠の語り部
```text
「この病の源は、三千年前に封印された無名王の王墓にある。不可視の呪いを解かねば、誰も生きて戻れんぞ」
```

#### `start_04`（text）
**演出:** bg: bg_spot_markand_ruins
```text
人々の命を救い、奇病の元凶を断つため、あなたは手がかりを胸に禁忌の墓所へと足を踏み入れた。
```

#### `start_monologue`（text）
**演出:** bg: bg_spot_markand_ruins
```text
（砂の病か……。三千年前の呪いが今になって活性化したのには何か理由があるはず。罠に気をつけながら進むとしよう）
```

#### `trap_01`（text）
**演出:** bg: bg_spot_markand_mirror, bgm: bgm_quest_mystery
```text
第一の試練。「鏡の間」。薄暗い石室の中央に、それぞれ異なる姿勢をとった三体の不気味な石像が並び立っている。
```

#### `trap_01_02`（text）
**演出:** bg: bg_spot_markand_mirror
```text
石壁には「太陽はどの姿を照らすか。姿を誤れば、鏡の牙が汝を切り裂く」と太古の文字が刻まれていた。
```

#### `choice_trap_01`（choice）
**演出:** bg: bg_spot_markand_mirror, bgm: bgm_quest_mystery
```text
どの石像を選ぶべきか。足元には、過去に罠にかかったと思われる多くの白骨が散らばっている。
```
| 選択肢 | next_node |
|---|---|
| 目を伏せた像（謙譲） | `trap_02` |
| 両手を広げた像（傲慢） | `battle_trap_01_intro` |

#### `battle_trap_01_intro`（text）
**演出:** bg: bg_spot_markand_mirror, bgm: bgm_battle_strong
```text
傲慢の像に触れた瞬間、壁の巨大な鏡が怪しく歪み、中からあなたと全く同じ姿と能力を持った光の幻影が現れて襲いかかってきた。
```

#### `battle_trap_01`（battle）
**演出:** bg: bg_spot_markand_mirror, bgm: bgm_battle_strong
**パラメータ:** enemy_group_id: 330, next: trap_02, fail: end_failure

#### `trap_02`（text）
**演出:** bg: bg_spot_markand_mirror, bgm: bgm_quest_mystery
```text
第二の試練。「秤の間」。奥へと続く扉の前に、天をも支えるような意匠の施された、巨大な黄金の天秤が設置されている。
```

#### `trap_02_02`（text）
**演出:** bg: bg_spot_markand_mirror
```text
壁の銘板には「汝が手に持つ、最も重き物を天秤に乗せよ」とあり、傍らにはいくつかの箱が置かれていた。
```

#### `choice_trap_02`（choice）
**演出:** bg: bg_spot_markand_mirror, bgm: bgm_quest_mystery
```text
どの箱を天秤に乗せるべきか。最も多くの死者の骨が転がっているのは、煌びやかな宝石の箱の前である。
```
| 選択肢 | next_node |
|---|---|
| 空の箱を選ぶ（沈黙） | `trap_03` |
| 宝石の箱を選ぶ（欲望） | `battle_trap_02_intro` |

#### `battle_trap_02_intro`（text）
**演出:** bg: bg_spot_markand_mirror, bgm: bgm_battle_strong
```text
宝石の箱を天秤に乗せた瞬間、激しい不協和音と共に箱から呪われた砂が噴き出し、強大な砂のゴーレムとなって襲いかかった。
```

#### `battle_trap_02`（battle）
**演出:** bg: bg_spot_markand_mirror, bgm: bgm_battle_strong
**パラメータ:** enemy_group_id: 331, next: trap_03, fail: end_failure

#### `trap_03`（text）
**演出:** bg: bg_spot_markand_mirror, bgm: bgm_quest_mystery
```text
第三の試練。「棺の間」。部屋の中央に置かれた空の王棺の蓋に、文字が刻まれている。
```

#### `trap_03_02`（text）
**演出:** bg: bg_spot_markand_mirror
```text
「永久に消え去る王に、汝が捧げるべき真の言葉は何か」とあり、壁には二つの石造りのボタンが用意されていた。
```

#### `choice_trap_03`（choice）
**演出:** bg: bg_spot_markand_mirror, bgm: bgm_quest_mystery
```text
壁の選択肢を見つめる。無名王は自身の存在が風化し、世界から「忘れ去られること」を恐れて呪いをかけたと言われている。
```
| 選択肢 | next_node |
|---|---|
| 「忘却」を選ぶ（真実） | `boss_king_intro` |
| 「称賛」を選ぶ（偽り） | `battle_trap_03_intro` |

#### `battle_trap_03_intro`（text）
**演出:** bg: bg_spot_markand_mirror, bgm: bgm_battle_strong
```text
「称賛」のボタンを押した瞬間、棺の蓋が跳ね飛び、朽ち果てた大剣と盾を手にした二体の凶悪な骸骨衛兵が這い出してきた。
```

#### `battle_trap_03`（battle）
**演出:** bg: bg_spot_markand_mirror, bgm: bgm_battle_strong
**パラメータ:** enemy_group_id: 332, next: boss_king_intro, fail: end_failure

#### `boss_king_intro`（text）
**演出:** bg: bg_spot_markand_king, bgm: bgm_spot_final_boss
```text
すべての罠を潜り抜けた最深部。眩いばかりの黄金に彩られた広間の玉座で、三千年間沈黙していたミイラ化した王がゆっくりと動き出した。
```

#### `boss_king_intro_02`（text）
**演出:** bg: bg_spot_markand_king, speaker: 砂王
```text
「……三千年だ。この暗闇の玉座で、俺の名を呼び、俺を記憶する者が現れるのを、ずっと待っていた」
```

#### `boss_king_intro_03`（text）
**演出:** bg: bg_spot_markand_king, speaker: 砂王
```text
「俺の帝国も名も歴史から完全に忘れ去られた。だから俺は、俺を忘れた世界を、民を、この砂の病で呪ったのだ！」
```

#### `boss_king_intro_04`（text）
**演出:** bg: bg_spot_markand_king
```text
ミイラの全身に黄金の砂の鎧が激しい音を立てて形成され、巨大な黄金の広間全体がその怒りによって震え出す。
```

#### `battle_king`（battle）
**演出:** bg: bg_spot_markand_king, bgm: bgm_spot_final_boss
**パラメータ:** enemy_group_id: 333, next: final_choice, fail: end_failure

#### `final_choice`（text）
**演出:** bg: bg_spot_markand_king, bgm: bgm_spot_final_choice
```text
激闘の末、砂王の巨躯は崩れ去り、静かに砂へと還った。しかし、玉座の跡地には、呪いの核である眩く輝く「王の心臓」たる宝石が不気味に明滅している。
```

#### `final_choice_02`（text）
**演出:** bg: bg_spot_markand_king, speaker: 砂王の残響
```text
「その宝石を破壊すれば呪いは消える。だが、それを飲み干せば、我が三千年の知恵と砂の魔力が、お前の肉体に宿るだろう……」
```

#### `choice_node`（choice）
**演出:** bg: bg_spot_markand_king, bgm: bgm_spot_final_choice
```text
不気味に脈打つ王の心臓を前に、あなたはこの呪いをどう処理するべきか、選択を迫られる。
```
| 選択肢 | next_node |
|---|---|
| 心臓を破壊し呪いを断つ | `end_break` |
| 心臓を宿し呪いを制御する | `end_curse` |

#### `end_break`（text）
**演出:** bg: bg_spot_markand_king, bgm: bgm_quest_calm
```text
あなたは躊躇なく黒い宝石を踏み砕いた。甲高い破砕音と共に心臓は粉々になり、王墓を満たしていた不可視の呪いと淀んだ魔力は完全に消え去った。
```

#### `end_break_02`（text）
**演出:** bg: bg_spot_markand_ruins
```text
地上へと帰還すると、市場の病人たちは砂の病から完全に回復しており、語り部の老人が安堵の笑みを浮かべてあなたを出迎えた。
```

#### `end_break_03`（end_success）
**演出:** bg: bg_spot_markand_ruins
```text
無名王の名は完全に歴史から消え去ったが、あなたの偉業を称え、ギルドから『砂王の断罪刃』を授けられた。
```
**rewards:** Exp:500, Gold:10000, Rep:200, Item:632

#### `end_curse`（text）
**演出:** bg: bg_spot_markand_king, bgm: bgm_quest_calm
```text
あなたは宝石を口に含み、一気に飲み干した。その瞬間、三千年の年月がもたらした膨大な知恵と、狂気のような渇きの呪いが、体中を駆け巡って定着していく。
```

#### `end_curse_02`（text:**演出:** bg: bg_spot_markand_ruins）
```text
王墓を後にしたあなたの腕には、砂王の紋章が怪しく浮かび上がっていた。人々はその異様な雰囲気を察し、あなたを恐れ避けるようになった。
```

#### `end_curse_03`（end_success）
**演出:** bg: bg_spot_markand_ruins
```text
砂の病の力を自身の意志で完全に制御下に置き、あなたは固有スキル『砂塵の支配』を手に入れた。
```
**rewards:** Exp:500, Rep:-100, Item:631

#### `end_failure`（end_failure）
**演出:** bg: bg_spot_markand_king
```text
激しい砂の嵐に呑み込まれ、息が詰まる。薄れゆく意識の奥で、無名王の寂しげな呟きが冷たく木霊した。
「やはり、お前も他の有象無象と同様に……俺を忘れ去るのだな……」
```
**rewards:** Gold:0
