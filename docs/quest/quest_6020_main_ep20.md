# クエスト仕様書：6020 — 第20話「蒼暁の剣」

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6020 |
| **Slug** | `main_ep20` |
| **クエスト種別** | メインエピソード（Main） |
| **推奨レベル** | 25（Very Hard） |
| **難度** | 5 |
| **依頼主** | — |
| **出現条件** | 前提クエストクリア: main_ep17、main_ep18、main_ep19 のいずれか1つクリア / 滞在拠点: ローランド聖帝国首都 王都レガリア |
| **リピート** | アカウント通じて1回のみ（継承後も非表示） |
| **難易度Tier** | Very Hard（rec_level: 25） |
| **経過日数 (time_cost)** | 5 |
| **ノード数** | 46ノード |
| **報酬アイテム** | 504（蒼暁の剣） |
| **サムネイル画像** | `/images/quests/bg_boss_altar.png` |

---

## 1. クエスト概要

### 短文説明
```
レガリアの遺跡に眠る最後の石碑。先代の記憶の中で、全能神ゼウスが待ち受ける。
```

### 長文説明
```
三つの遺産を手に、最後の石碑があるレガリア郊外の遺跡へ向かった。
石碑に触れると、英霊がガウェインと共に戦った最後の記憶が流れ込む。
記憶の中で待ち受けるのは――全能神ゼウス。
すべての遺産が揃っていれば力の加護を得られるが、
揃っていなければ、神はその全力を以て叩き潰しにくる。
```

---

## 2. 報酬定義

**CSV記載形式:**
```
Gold:15000|Rep:50|Item:504|Order:5
```

---

## 3. シナリオノード構成（46ノード）

### 全体フロー
```text
start → start_02 → start_03 → text_regalia → text_regalia_02 → text_regalia_03
  → text_outskirts → text_outskirts_02 → text_outskirts_03 → text_ruins_entrance
  → text_ruins_entrance_02 → text_ruins_entrance_03 → text_descent → text_descent_02
  → text_descent_03 → text_final_chamber → text_final_chamber_02 → text_final_chamber_03
  → text_stele_found → text_stele_found_02 → text_touch → text_touch_02 → text_touch_03
  → text_memory_gawain → text_memory_gawain_02 → text_memory_comrade → text_memory_comrade_02
  → text_zeus_appear → text_zeus_appear_02 → text_zeus_voice → text_zeus_voice_02
  → text_zeus_challenge → check_items
  ├─[items_all_relics]→ text_relics_glow → text_relics_glow_02 → battle_weak → choice_weak
  │    ├─[ゼウスを撃破する]→ text_zeus_defeat → text_zeus_defeat_02 → text_dawn_sword → text_dawn_sword_02
  │    │    └─→ text_epilogue → text_epilogue_02 → end_node
  │    └─[敗北]→ end_failure
  └─[items_missing]→ text_relics_missing → text_relics_missing_02 → battle_strong → choice_strong
       ├─[ゼウスを死闘の末に討つ]→ text_zeus_defeat → text_zeus_defeat_02 → text_dawn_sword → text_dawn_sword_02
       │    └─→ text_epilogue → text_epilogue_02 → end_node
       └─[敗北]→ end_failure
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_road_day, bgm: bgm_quest_tense
```text
英霊の遺産を集める旅も、いよいよ最後の行程に達した。
```

#### `start_02`（text）
**演出:** bg: bg_road_day
```text
集めた遺産を手に、最後の石碑があるレガリア郊外の遺跡へ向かう。
```

#### `start_03`（text）
**演出:** bg: bg_road_day
```text
そこには英霊の最後の記憶と、全能神ゼウスが待ち受ける。
```

#### `text_regalia`（text）
**演出:** bg: bg_road_day
```text
王都レガリアの街を抜け、のどかな郊外の平原へと出る。
```

#### `text_regalia_02`（text）
**演出:** bg: bg_road_day
```text
大天使の傷跡から復興し、活気に満ちあふれた白亜の王都。
```

#### `text_regalia_03`（text）
**演出:** bg: bg_road_day
```text
平和を取り戻した都市を背に、遺跡のある荒野へと馬を進めた。
```

#### `text_outskirts`（text）
**演出:** bg: bg_ruins_field
```text
レガリアの郊外、荒涼とした丘陵地帯の先に遺跡が見えてきた。
```

#### `text_outskirts_02`（text）
**演出:** bg: bg_ruins_field
```text
ここは英霊が最期の魂の欠片と記憶を封じた絶対の場所。
```

#### `text_outskirts_03`（text）
**演出:** bg: bg_ruins_field
```text
遺跡の奥底から放たれる、雷鳴のような強い波動を感じ取る。
```

#### `text_ruins_entrance`（text）
**演出:** bg: bg_ruins_field, bgm: bgm_quest_crisis
```text
遺跡の入口に立つ。かつてないほどの重圧が漂っていた。
```

#### `text_ruins_entrance_02`（text）
**演出:** bg: bg_ruins_field
```text
空気がピリピリと震え、大気中に微かな静電気が生じている。
```

#### `text_ruins_entrance_03`（text）
**演出:** bg: bg_ruins_field
```text
長く息を吐いて精神を研ぎ澄まし、ゆっくり遺跡内へ入った。
```

#### `text_descent`（text）
**演出:** bg: bg_catacombs
```text
薄暗い石段を下りていく。松明の光が石壁の壁画を揺らした。
```

#### `text_descent_02`（text）
**演出:** bg: bg_catacombs
```text
そこには二人の人間が背中を合わせ、巨神と戦う姿がある。
```

#### `text_descent_03`（text）
**演出:** bg: bg_catacombs
```text
彼らの前に立ちはだかるのは、雷を手にする天空の王の姿。
```

#### `text_final_chamber`（text）
**演出:** bg: bg_boss_altar
```text
最奥に位置する、円形の広大な神殿跡にたどり着いた。
```

#### `text_final_chamber_02`（text）
**演出:** bg: bg_boss_altar
```text
天井が崩落しており、そこから降り注ぐ陽光が石碑を照らす。
```

#### `text_final_chamber_03`（text）
**演出:** bg: bg_boss_altar
```text
これまで手にした三つの遺産が、激しく共鳴を始めた。
```

#### `text_stele_found`（text）
**演出:** bg: bg_heroic_stele
```text
石碑に近づくと、赤く輝く文字が浮かび上がった。
```

#### `text_stele_found_02`（text）
**演出:** bg: bg_heroic_stele
```text
「すべてを終わらせる力を受け継げ」とあり、石碑に触れた。
```

#### `text_touch`（text）
**演出:** bg: bg_heroic_stele
```text
触れた瞬間、意識が強く閃光に飲み込まれ、現実が消失する。
```

#### `text_touch_02`（text）
**演出:** bg: bg_heroic_stele
```text
目を開けると、そこは荒涼とした雷鳴轟く記憶の原野だった。
```

#### `text_touch_03`（text）
**演出:** bg: bg_heroic_stele
```text
そして、記憶の中のあなたの隣には、大剣を担いだ戦士がいた。
```

#### `text_memory_gawain`（text）
**演出:** bg: bg_memory_gawain
```text
その姿は、見慣れた老騎士ガウェインの姿そのものだった。
```

#### `text_memory_gawain_02`（text）
**演出:** bg: bg_memory_gawain
```text
（ガウェイン……！ そうか、先代は彼の右腕として、かつてこの死闘を共に戦っていたのか……！）
```

#### `text_memory_comrade`（text）
**演出:** bg: bg_memory_gawain, speaker: ガウェイン
```text
「相棒。あの雷の野郎が最後だ。全部終わらせようぜ」
```

#### `text_memory_comrade_02`（text）
**演出:** bg: bg_memory_gawain
```text
（先代の魂が、私の中で脈打っている……。やるぞ、ガウェイン。最後の神を、今度こそ終わらせる！）
```

#### `text_zeus_appear`（text）
**演出:** bg: bg_memory_gawain, bgm: bgm_spot_final_boss
```text
天空から直撃した巨大な雷柱の中から、神々の王が現れた。
```

#### `text_zeus_appear_02`（text）
**演出:** bg: bg_memory_gawain
```text
雷霆を手に握り、純白の衣を纏った全能神ゼウスである。
```

#### `text_zeus_voice`（text）
**演出:** bg: bg_memory_gawain, speaker: 全能神ゼウス
```text
「我が前に立つ愚者どもよ。汝らが集めし欠片、見定める」
```

#### `text_zeus_voice_02`（text）
**演出:** bg: bg_memory_gawain, speaker: 全能神ゼウス
```text
「すべての遺産無き者に、我が雷を下す資格など無し」
```

#### `text_zeus_challenge`（text）
**演出:** bg: bg_memory_gawain, speaker: 全能神ゼウス
```text
「我が雷の前に、その器が本物であるかを示してみせよ！」
```

#### `check_items`（check_flags）
**演出:** bg: bg_memory_gawain
```text
（手にした三つの遺産……。我が運命を、この神に見せてやる！）
```
| 選択肢 | next_node |
|---|---|
| items_all_relics | `text_relics_glow` |
| items_missing | `text_relics_missing` |

#### `text_relics_glow`（text）
**演出:** bg: bg_memory_gawain
```text
護符、剣、鎧。三つの遺産が共鳴し、光の壁を作る。
```

#### `text_relics_glow_02`（text）
**演出:** bg: bg_memory_gawain
```text
（遺産が共鳴している……！ 身体に力がみなぎるぞ。これなら、神の雷霆とて恐るるに足りん！）
```

#### `battle_weak`（battle）
**演出:** bg: bg_memory_gawain, bgm: bgm_spot_final_boss
**パラメータ:** enemy_group_id: 9053, next: choice_weak, fail: end_failure

#### `choice_weak`（choice）
**演出:** bg: bg_memory_gawain, bgm: bgm_spot_final_boss
| 選択肢 | next_node |
|---|---|
| 「ゼウスを撃破する」 | `text_zeus_defeat` |

#### `text_relics_missing`（text）
**演出:** bg: bg_memory_gawain
```text
集めた遺産が足りず、共鳴の加護を得ることができない。
```

#### `text_relics_missing_02`（text）
**演出:** bg: bg_memory_gawain
```text
（遺産の加護がない……！ だが、ここで退く道など最初から存在しない。死力を尽くして戦うまでだ！）
```

#### `battle_strong`（battle）
**演出:** bg: bg_memory_gawain, bgm: bgm_spot_final_boss
**パラメータ:** enemy_group_id: 9054, next: choice_strong, fail: end_failure

#### `choice_strong`（choice）
**演出:** bg: bg_memory_gawain, bgm: bgm_spot_final_boss
| 選択肢 | next_node |
|---|---|
| 「ゼウスを死闘の末に討つ」 | `text_zeus_defeat` |

#### `text_zeus_defeat`（text）
**演出:** bg: bg_memory_gawain
```text
満身創痍になりながらも、ゼウスに最後の一撃を突き刺した。
```

#### `text_zeus_defeat_02`（text）
**演出:** bg: bg_memory_gawain, speaker: 全能神ゼウス
```text
「見事。人間が神を越えたか。我が剣、お前に託そう」
```

#### `text_dawn_sword`（text）
**演出:** bg: bg_boss_altar
```text
雷光となってゼウスが昇り、意識は現実の遺跡へと戻った。
```

#### `text_dawn_sword_02`（text）
**演出:** bg: bg_boss_altar
```text
石碑の足元にある、黎明の光を放つ「蒼暁の剣」を引き抜いた。
```

#### `text_epilogue`（text）
**演出:** bg: bg_boss_altar, bgm: bgm_quest_calm
```text
（蒼暁の剣……。ついに、すべての遺産と記憶を継承したのだな。この力があれば、神へも刃が届く……）
```

#### `text_epilogue_02`（text）
**演出:** bg: bg_road_day
```text
引き抜いた剣を掲げ、あなたは崩落した神殿を後にした。神々を打倒し、人類の真の夜明けを勝ち取るための、本当の戦いがここから始まる。
```

#### `end_node`（end_success）
**演出:** bg: bg_road_day
```text
すべての遺産と記憶を完全に受け継ぎ、ついに神をも超える絶対の力を得た。新たな夜明けへの歩みが始まる。
```
**rewards:** Gold:15000, Rep:50, Item:504, Order:5

#### `end_failure`（end_failure）
**演出:** bg: bg_boss_altar
```text
ゼウスの雷霆に焼き尽くされ、あなたの体は塵となって散った。
```
**rewards:** Gold:0
