# クエスト仕様書：6017 — 第17話「冥府の門」

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6017 |
| **Slug** | `main_ep17` |
| **クエスト種別** | メインエピソード（Main） |
| **推奨レベル** | 22（Very Hard） |
| **難度** | 4 |
| **依頼主** | — |
| **出現条件** | 前提クエストクリア: main_ep16 / 滞在拠点: 黄金都市イスハーク |
| **リピート** | アカウント通じて1回のみ（継承後も非表示） |
| **難易度Tier** | Very Hard（rec_level: 22） |
| **経過日数 (time_cost)** | 5 |
| **ノード数** | 46ノード |
| **報酬アイテム** | 505（冥王の護符） |
| **サムネイル画像** | `/images/quests/bg_pyramid_chamber.png` |

---

## 1. クエスト概要

### 短文説明
```
イスハークのピラミッドに眠る石碑。英霊の記憶の中で、冥王ハデスが待ち受ける。
```

### 長文説明
```
英霊の導きに従い、イスハークのピラミッドへ向かった。
砂に埋もれた隠し部屋の奥に、二つ目の石碑がある。
石碑に触れると英霊の記憶が流れ込み、
かつてオアシスで繰り広げられた死闘の記憶を追体験する。
記憶の中で待ち受けるのは――冥王ハデス。
```

---

## 2. 報酬定義

**CSV記載形式:**
```
Gold:3500|Rep:25|Item:505|Order:5
```

---

## 3. シナリオノード構成（46ノード）

### 全体フロー
```text
start → start_02 → start_03 → start_04 → text_ishaq → text_ishaq_02 → text_ishaq_03
  → text_pyramid → text_pyramid_02 → text_pyramid_03 → text_hidden_passage
  → text_hidden_passage_02 → text_hidden_passage_03 → text_chamber → text_chamber_02
  → text_chamber_03 → text_stele_found → text_stele_found_02 → text_touch
  → text_touch_02 → text_touch_03 → text_memory_start → text_memory_start_02
  → text_memory_oasis → text_memory_oasis_02 → text_hades_appear → text_hades_appear_02
  → text_hades_appear_03 → text_hades_voice → text_hades_voice_02 → text_hades_challenge
  → text_hades_challenge_02 → battle → choice1 → text_hades_defeat
  → text_hades_defeat_02 → text_talisman → text_talisman_02 → text_return
  → text_return_02 → end_node → end_failure
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_road_day, bgm: bgm_quest_tense
```text
二つ目の石碑の導きに従い、あなたはレガリアから旅立つ。
```

#### `start_02`（text）
**演出:** bg: bg_road_day
```text
マルカンドの砂漠を越え、黄金都市イスハークへと向かった。
```

#### `start_03`（text）
**演出:** bg: bg_road_day
```text
イスハークには活気が戻っているが、石碑は街の中にはない。
```

#### `start_04`（text）
**演出:** bg: bg_road_day
```text
砂塵の中にそびえ立つ、巨大なピラミッドを目指す。
```

#### `text_ishaq`（text）
**演出:** bg: bg_desert
```text
砂に半ば埋もれた古代の巨大ピラミッドに到着した。
```

#### `text_ishaq_02`（text）
**演出:** bg: bg_desert
```text
冷気と静寂に包まれたピラミッドの内部へ潜る。
```

#### `text_ishaq_03`（text）
**演出:** bg: bg_desert
```text
松明の炎が、風化した古い石壁に重苦しい影を投げかける。
```

#### `text_pyramid`（text）
**演出:** bg: bg_catacombs
```text
ピラミッドの狭い通路を進むと、壁画が描かれていた。
```

#### `text_pyramid_02`（text）
**演出:** bg: bg_catacombs
```text
それは人間が、翼を持つ神々と戦う太古の図であった。
```

#### `text_pyramid_03`（text）
**演出:** bg: bg_catacombs
```text
崩れかけた石壁の奥から、冷たい風が吹き抜けてくる。
```

#### `text_hidden_passage`（text）
**演出:** bg: bg_catacombs
```text
行き止まりの壁の一部に、石碑と同じ紋様を見つける。
```

#### `text_hidden_passage_02`（text）
**演出:** bg: bg_catacombs
```text
紋様に手を当てると、石壁が音を立ててスライドし始めた。
```

#### `text_hidden_passage_03`（text）
**演出:** bg: bg_catacombs
```text
奥へと続く暗い隠し通路から、淡い光が漏れていた。
```

#### `text_chamber`（text）
**演出:** bg: bg_pyramid_chamber, bgm: bgm_quest_calm
```text
通路の先には、広大な地下室が広がっていた。
```

#### `text_chamber_02`（text）
**演出:** bg: bg_pyramid_chamber
```text
天井が高く、壁面全体に光る紋様が刻まれている。
```

#### `text_chamber_03`（text）
**演出:** bg: bg_pyramid_chamber
```text
その部屋の中央に、二つ目の英霊の石碑が佇んでいた。
```

#### `text_stele_found`（text）
**演出:** bg: bg_pyramid_chamber
```text
石碑の前に立つと、読めない古代文字が理解できた。
```

#### `text_stele_found_02`（text）
**演出:** bg: bg_pyramid_chamber
```text
「試練を受けよ」とある。冷たい表面に手を触れた。
```

#### `text_touch`（text）
**演出:** bg: bg_pyramid_chamber
```text
触れた瞬間、脳裏に強烈な光が走り、意識が切り離される。
```

#### `text_touch_02`（text）
**演出:** bg: bg_pyramid_chamber
```text
目を開けると、砂漠の中の美しいオアシスにいた。
```

#### `text_touch_03`（text）
**演出:** bg: bg_pyramid_chamber
```text
（これが先代の英霊の記憶……。だが、なんだこの凍りつくような冷気は。魂が直感的に、死を拒絶している……）
```

#### `text_memory_start`（text）
**演出:** bg: bg_memory_oasis
```text
泉の底から突如として闇が噴き出し、地面に亀裂が走る。
```

#### `text_memory_start_02`（text）
**演出:** bg: bg_memory_oasis
```text
泉の水が黒く染まり、紫の霧が吹き荒れ門が開いた。
```

#### `text_memory_oasis`（text）
**演出:** bg: bg_memory_oasis
```text
闇の門の奥から、ゆっくりと一つの影が歩み出てくる。
```

#### `text_memory_oasis_02`（text）
**演出:** bg: bg_memory_oasis
```text
黒い霧が結実し、蒼白い肌を持つ荘厳な男の姿となった。
```

#### `text_hades_appear`（text）
**演出:** bg: bg_memory_oasis, bgm: bgm_battle_strong
```text
闇の衣を纏い、手には骸骨が彫られた黒い錫杖を持つ。
```

#### `text_hades_appear_02`（text）
**演出:** bg: bg_memory_oasis
```text
冥王ハデス。生と死の境界を守る冷酷なる神。
```

#### `text_hades_appear_03`（text）
**演出:** bg: bg_memory_oasis
```text
ハデスが錫杖を構え、あなたを冷たく見下ろした。
```

#### `text_hades_voice`（text）
**演出:** bg: bg_memory_oasis, speaker: 冥王ハデス
```text
「また来たか。先代も死を恐れぬ目をしていたな」
```

#### `text_hades_voice_02`（text）
**演出:** bg: bg_memory_oasis, speaker: 冥王ハデス
```text
「だが、死を恐れぬことと、死を超えることは別物だ」
```

#### `text_hades_challenge`（text）
**演出:** bg: bg_memory_oasis, speaker: 冥王ハデス
```text
「我が門を守る者。汝の魂の軽さ、ここで測ってくれよう」
```

#### `text_hades_challenge_02`（text）
**演出:** bg: bg_memory_oasis, speaker: 冥王ハデス
```text
「我が冥府の暗闇に耐えられるか、証明してみせよ」
```

#### `battle`（battle）
**演出:** bg: bg_memory_oasis, bgm: bgm_battle
**パラメータ:** enemy_group_id: 9050, next: choice1, fail: end_failure

#### `choice1`（choice）
**演出:** bg: bg_memory_oasis, bgm: bgm_battle
| 選択肢 | next_node |
|---|---|
| 「冥王ハデスを退ける」 | `text_hades_defeat` |

#### `text_hades_defeat`（text）
**演出:** bg: bg_memory_oasis
```text
死の霧を切り裂き、あなたの刃がハデスの喉元で止まった。
```

#### `text_hades_defeat_02`（text）
**演出:** bg: bg_memory_oasis, speaker: 冥王ハデス
```text
「見事。死の恐怖を越えたか。我が力を授けよう」
```

#### `text_talisman`（text）
**演出:** bg: bg_pyramid_chamber
```text
ハデスが去ると共に意識が現実に戻り、あなたは地下室にいた。
```

#### `text_talisman_02`（text）
**演出:** bg: bg_pyramid_chamber
```text
石碑の足元に、黒い「冥王の護符」が静かに落ちている。
```

#### `text_return`（text）
**演出:** bg: bg_pyramid_chamber
```text
（生き延びた……のか。一歩間違えれば、あの死の闇に呑まれて二度と戻れなかったはずだ……）
```

#### `text_return_02`（text）
**演出:** bg: bg_catacombs, bgm: bgm_quest_calm
```text
手にした「冥王の護符」をしまい、あなたは冷気が残る地下室を後にした。次の目的地であるマルカンドの「カロン」へ向かうために。
```

#### `end_node`（end_success）
**演出:** bg: bg_catacombs
```text
冥王ハデスの試練を乗り越え、力を手に入れた。
```
**rewards:** Gold:3500, Rep:25, Item:505, Order:5

#### `end_failure`（end_failure）
**演出:** bg: bg_pyramid_chamber
```text
死の力に抗えず、あなたの魂は冥府へと引きずり込まれた。
```
**rewards:** Gold:0
