# クエスト仕様書：6016 — 第16話「継承者の目覚め」

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6016 |
| **Slug** | `main_ep16` |
| **クエスト種別** | メインエピソード（Main） |
| **推奨レベル** | 16（Very Hard） |
| **難度** | 4 |
| **依頼主** | — |
| **出現条件** | 前提クエストクリア: main_ep15 / 滞在拠点: 辺境の街 国境の町 / 第二世代以降（gen:2+） |
| **リピート** | アカウント通じて1回のみ（継承後も非表示） |
| **難易度Tier** | Very Hard（rec_level: 16） |
| **経過日数 (time_cost)** | 5 |
| **ノード数** | 47ノード |
| **サムネイル画像** | `/images/quests/bg_heroic_stele.png` |

---

## 1. クエスト概要

### 短文説明
```
国境の町で見つけた英霊の石碑。先代の記憶が、新たな旅の始まりを告げる。
```

### 長文説明
```
大天使の侵攻を退けた後、平穏な日々が戻りつつあった。
だが国境の町を訪れた際、古びた石碑に導かれるように足を止めた。
石碑に触れた瞬間、英霊の記憶が流れ込んでくる。
自分がかつて世界を救った存在の継承者であることを知った時、
堕天使の群れが急襲してきた。
```

---

## 2. 報酬定義

**CSV記載形式:**
```
Gold:3000|Rep:20|Order:5
```

---

## 3. シナリオノード構成（47ノード）

### 全体フロー
```text
start → start_02 → start_03 → start_04 → text_peace → text_peace_02 → text_border_town
  → text_border_town_02 → text_border_town_03 → text_strange_pull → text_strange_pull_02
  → text_strange_pull_03 → text_stele_discovery → text_stele_discovery_02 → text_stele_discovery_03
  → text_touch → text_touch_02 → text_touch_03 → text_vision_start → text_vision_start_02
  → text_vision_hero → text_vision_hero_02 → text_vision_hero_03 → text_vision_end
  → text_vision_end_02 → text_awakening → text_awakening_02 → text_awakening_03
  → text_inheritance → text_inheritance_02 → text_ambush_warning → text_ambush_warning_02
  → text_fallen_descent → text_fallen_taunt → text_fallen_taunt_02 → battle → choice1
  → text_aftermath → text_aftermath_02 → text_guidance → text_guidance_02
  → end_node → end_failure
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_road_day, bgm: bgm_quest_calm
```text
大天使たちの激しい侵攻は、遠い過去の出来事となりつつあった。
```

#### `start_02`（text）
**演出:** bg: bg_road_day
```text
四つの首都は完全に復興し、かつての美しい姿を取り戻した。
```

#### `start_03`（text）
**演出:** bg: bg_road_day
```text
だが、あなたの胸の奥には、常に冷ややかな懸念があった。
```

#### `start_04`（text）
**演出:** bg: bg_road_day
```text
（平和など、神の気まぐれに過ぎない。奴らが本気になれば、この都など一瞬で塵に還る……）
```

#### `text_peace`（text）
**演出:** bg: bg_road_day
```text
神そのものには、人間はまだ誰も届いていないのだ。いつまた新たな「大浄化」の裁きが降るかわからない。
```

#### `text_peace_02`（text）
**演出:** bg: bg_road_day
```text
（私の中に眠る『先代』の記憶が、あの天の理不尽さを嫌というほど覚えているからだ……）
```

#### `text_border_town`（text）
**演出:** bg: bg_road_day
```text
ある日、あなたの足は自然と、国境の町へと向かっていた。
```

#### `text_border_town_02`（text）
**演出:** bg: bg_road_day
```text
そこはローランドとマルカンドの国境に位置する町。
```

#### `text_border_town_03`（text）
**演出:** bg: bg_road_day
```text
町外れの静かな丘へ、誘われるように登り始める。
```

#### `text_strange_pull`（text）
**演出:** bg: bg_road_day
```text
生い茂る草を掻き分けると、風化した古い石碑が佇んでいた。
```

#### `text_strange_pull_02`（text）
**演出:** bg: bg_road_day
```text
苔むした表面には、かすかに不思議な紋様が刻まれている。
```

#### `text_strange_pull_03`（text）
**演出:** bg: bg_road_day
```text
（なんだ、この胸を締め付ける感覚は……？ まるで、この石碑が私を呼んでいるのか……）
```

#### `text_stele_discovery`（text）
**演出:** bg: bg_heroic_stele, bgm: bgm_quest_tense
```text
石碑の前に立つと、紋様が強く淡い光を放ち始めた。
```

#### `text_stele_discovery_02`（text）
**演出:** bg: bg_heroic_stele
```text
そっと手を伸ばして表面に触れると、温もりを感じる。
```

#### `text_stele_discovery_03`（text）
**演出:** bg: bg_heroic_stele
```text
吸い寄せられるように、さらに強くその石碑へ触れた。
```

#### `text_touch`（text）
**演出:** bg: bg_heroic_stele
```text
触れた瞬間、意識が激しく彼方へ引き剥がされた。
```

#### `text_touch_02`（text）
**演出:** bg: bg_heroic_stele
```text
次に目を開けた時、見知らぬ荒涼とした大地に立っていた。
```

#### `text_touch_03`（text）
**演出:** bg: bg_heroic_stele
```text
（これが……先代の記憶？ 身体が引き裂かれそうなほどの闘気が、今もこの空間に満ちている……！）
```

#### `text_vision_start`（text）
**演出:** bg: bg_heroic_stele
```text
記憶の中で、一人の戦士が神の軍勢を相手に大剣を振るう。
```

#### `text_vision_start_02`（text）
**演出:** bg: bg_heroic_stele
```text
（この凄まじい決意の熱が、私の魂へと直接流れ込んでくる……。これが、継承の儀式か……！）
```

#### `text_vision_hero`（text）
**演出:** bg: bg_heroic_stele, speaker: 英霊の声
```text
「……やっと目覚めたか。我が力を継ぎし者よ」
```

#### `text_vision_hero_02`（text）
**演出:** bg: bg_heroic_stele, speaker: 英霊の声
```text
「お前の中に眠る俺の力の欠片は、まだ少なすぎる」
```

#### `text_vision_hero_03`（text）
**演出:** bg: bg_heroic_stele, speaker: 英霊の声
```text
「散らばる四つの石碑を巡り、遺産と記憶を回収せよ」
```

#### `text_vision_end`（text）
**演出:** bg: bg_heroic_stele, speaker: 英霊の声
```text
「イスハーク、龍京、出雲、レガリアの近くにある」
```

#### `text_vision_end_02`（text）
**演出:** bg: bg_heroic_stele, speaker: 英霊の声
```text
「天の奴らもお前の覚醒に気づき始めている。急ぐのだ」
```

#### `text_awakening`（text）
**演出:** bg: bg_heroic_stele, bgm: bgm_quest_calm
```text
はっと意識が戻ると、現実の石碑の前で膝をついていた。
```

#### `text_awakening_02`（text）
**演出:** bg: bg_heroic_stele
```text
（全身の奥底から、熱く微かな力が滾り出している……。この感覚、間違いなく『遺産』の力だ）
```

#### `text_awakening_03`（text）
**演出:** bg: bg_heroic_stele
```text
英霊の継承者であるという事実を、強く自覚する。
```

#### `text_inheritance`（text）
**演出:** bg: bg_heroic_stele
```text
その力を確かめるように、あなたはその場に立ち上がった。
```

#### `text_inheritance_02`（text）
**演出:** bg: bg_heroic_stele
```text
やるべきことは決まった。四都市の石碑を探し出そう。
```

#### `text_ambush_warning`（text）
**演出:** bg: bg_heroic_stele
```text
突然、丘の上の気温が急激に下がり、殺気が満ちてきた。
```

#### `text_ambush_warning_02`（text）
**演出:** bg: bg_heroic_stele
```text
茂みを引き裂き、黒い翼を持った堕天使たちが現れる。
```

#### `text_fallen_descent`（text）
**演出:** bg: bg_heroic_stele
```text
三体の堕天使が舞い降り、あなたを完全に包囲した。
```

#### `text_fallen_taunt`（text）
**演出:** bg: bg_heroic_stele, speaker: 堕天使
```text
「英霊の継承者め。覚醒する前に、ここで屠ってくれる」
```

#### `text_fallen_taunt_02`（text）
**演出:** bg: bg_heroic_stele, speaker: 堕天使
```text
「天の秩序に仇なす芽は、今のうちに摘み取るのみだ」
```

#### `battle`（battle）
**演出:** bg: bg_heroic_stele, bgm: bgm_battle
**パラメータ:** enemy_group_id: 211, next: choice1, fail: end_failure

#### `choice1`（choice）
**演出:** bg: bg_heroic_stele, bgm: bgm_battle
| 選択肢 | next_node |
|---|---|
| 「堕天使たちを撃退する」 | `text_aftermath` |

#### `text_aftermath`（text）
**演出:** bg: bg_heroic_stele
```text
激しい戦いの末、襲撃してきた堕天使たちを切り伏せた。
```

#### `text_aftermath_02`（text）
**演出:** bg: bg_heroic_stele
```text
堕天使の体は黒い霧となって消え、静寂が戻る。
```

#### `text_guidance`（text）
**演出:** bg: bg_heroic_stele
```text
残された石碑の紋様が、進むべき方向へ輝いている。
```

#### `text_guidance_02`（text）
**演出:** bg: bg_heroic_stele
```text
（奴らの追撃を逃れつつ、四都市の遺産を集める……。止まっている時間はないな）
```

#### `end_node`（end_success）
**演出:** bg: bg_heroic_stele
```text
宿命を胸に抱き、あなたは丘を降りて旅へ出発した。
```
**rewards:** Gold:3000, Rep:20, Order:5

#### `end_failure`（end_failure）
**演出:** bg: bg_heroic_stele
```text
堕天使の刃が貫き、冷たい地面で意識が闇に閉ざされた。
```
**rewards:** Gold:0
