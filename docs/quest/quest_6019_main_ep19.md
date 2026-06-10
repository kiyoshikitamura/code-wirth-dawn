# クエスト仕様書：6019 — 第19話「月光の狩人」

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6019 |
| **Slug** | `main_ep19` |
| **クエスト種別** | メインエピソード（Main） |
| **推奨レベル** | 18（Very Hard） |
| **難度** | 4 |
| **依頼主** | — |
| **出現条件** | 前提クエストクリア: main_ep16 / 滞在拠点: 夜刀神国首都 出雲 |
| **リピート** | アカウント通じて1回のみ（継承後も非表示） |
| **難易度Tier** | Very Hard（rec_level: 18） |
| **経過日数 (time_cost)** | 5 |
| **ノード数** | 45ノード |
| **報酬アイテム** | 507（女神の鎧） |
| **サムネイル画像** | `/images/quests/bg_mountain_shrine.png` |

---

## 1. クエスト概要

### 短文説明
```
出雲の山奥に眠る石碑。英霊の記憶の中で、女神アルテミスが待ち受ける。
```

### 長文説明
```
英霊の導きに従い、出雲の山奥にある秘境へ向かった。
霧に包まれた山道を登り、人跡未踏の谷の奥に四つ目の石碑がある。
石碑に触れると、英霊が山道で繰り広げた死闘の記憶が流れ込む。
記憶の中で待ち受けるのは――女神アルテミス。
```

---

## 2. 報酬定義

**CSV記載形式:**
```
Gold:3500|Rep:25|Item:507|Order:5
```

---

## 3. シナリオノード構成（45ノード）

### 全体フロー
```text
start → start_02 → start_03 → start_04 → text_izumo → text_izumo_02 → text_izumo_03
  → text_mountain_path → text_mountain_path_02 → text_mountain_path_03 → text_fog
  → text_fog_02 → text_fog_03 → text_shrine_gate → text_shrine_gate_02 → text_shrine_gate_03
  → text_valley → text_valley_02 → text_valley_03 → text_stele_found → text_stele_found_02
  → text_touch → text_touch_02 → text_touch_03 → text_memory_mountain → text_memory_mountain_02
  → text_memory_mountain_03 → text_artemis_appear → text_artemis_appear_02 → text_artemis_appear_03
  → text_artemis_voice → text_artemis_voice_02 → text_artemis_challenge → text_artemis_challenge_02
  → battle → choice1 → text_artemis_defeat → text_artemis_defeat_02 → text_armor
  → text_armor_02 → text_return → text_return_02 → end_node → end_failure
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_road_day, bgm: bgm_quest_calm
```text
四つ目の石碑の導きに従い、あなたは首都・出雲を出発した。
```

#### `start_02`（text）
**演出:** bg: bg_road_day
```text
古き神々への信仰が息づく山脈を目指し、旅路を急ぐ。
```

#### `start_03`（text）
**演出:** bg: bg_road_day
```text
求める秘境は、より深く険しい場所にある。
```

#### `start_04`（text）
**演出:** bg: bg_road_day
```text
古老から、誰も戻らない「神隠しの谷」の噂を聞き出した。
```

#### `text_izumo`（text）
**演出:** bg: bg_mountain
```text
出雲の北に幾重にも連なる深い山脈へ、足を踏み入れた。
```

#### `text_izumo_02`（text）
**演出:** bg: bg_mountain
```text
杉の大木が空を覆い尽くし、真昼であるにもかかわらず薄暗い。
```

#### `text_izumo_03`（text）
**演出:** bg: bg_mountain
```text
獣道すら途切れた山の中で、人の気配は完全に途絶えた。
```

#### `text_mountain_path`（text）
**演出:** bg: bg_mountain
```text
眼前に立ちはだかる険しい斜面と、崩れやすい岩場を登る。
```

#### `text_mountain_path_02`（text）
**演出:** bg: bg_mountain
```text
滑りやすい木の根に足を取られながら、慎重に進む。
```

#### `text_mountain_path_03`（text）
**演出:** bg: bg_mountain
```text
腕の紋様が脈打つように青く光り、正しい山道を示していた。
```

#### `text_fog`（text）
**演出:** bg: bg_mountain
```text
標高が上がるにつれ、突然、辺り一面に濃い霧が立ち込める。
```

#### `text_fog_02`（text）
**演出:** bg: bg_mountain
```text
これは石碑が無関係な者を拒むために張った結界だ。
```

#### `text_fog_03`（text）
**演出:** bg: bg_mountain
```text
結界の霧を恐れることなく、紋様の輝きを頼りに直進する。
```

#### `text_shrine_gate`（text）
**演出:** bg: bg_mountain_shrine, bgm: bgm_quest_tense
```text
深い霧の壁を抜けると、不意に視界が開け、谷間の底に出た。
```

#### `text_shrine_gate_02`（text）
**演出:** bg: bg_mountain_shrine
```text
入口には、朽ち果てて苔に覆われた古代の木製鳥居が立つ。
```

#### `text_shrine_gate_03`（text）
**演出:** bg: bg_mountain_shrine
```text
鳥居の奥からは、静かだが非常に清浄な銀の光が放たれていた。
```

#### `text_valley`（text）
**演出:** bg: bg_mountain_shrine
```text
朽ちた鳥居をくぐり、清流のせせらぎが響く谷の奥深くへ進む。
```

#### `text_valley_02`（text）
**演出:** bg: bg_mountain_shrine
```text
湿った石段を降りると、そこには石碑が静かに佇んでいた。
```

#### `text_valley_03`（text）
**演出:** bg: bg_mountain_shrine
```text
この谷の底だけは、月光のような美しい光が満ちている。
```

#### `text_stele_found`（text）
**演出:** bg: bg_heroic_stele
```text
石碑の表面に刻まれた紋様が、あなたを歓迎するように輝く。
```

#### `text_stele_found_02`（text）
**演出:** bg: bg_heroic_stele
```text
「月光の試練を越えよ」とあり、あなたは銀の表面に手を触れた。
```

#### `text_touch`（text）
**演出:** bg: bg_heroic_stele
```text
触れた瞬間、意識が急激に銀色の閃光に飲み込まれていく。
```

#### `text_touch_02`（text）
**演出:** bg: bg_heroic_stele
```text
気がつくと、あなたは冷たい夜風が吹く月明かりの山道にいた。
```

#### `text_touch_03`（text）
**演出:** bg: bg_heroic_stele
```text
（なんだ……この射すくめられるような寒気は。見えない場所から、常に急所を狙われているような……）
```

#### `text_memory_mountain`（text）
**演出:** bg: bg_memory_mountain
```text
記憶のビジョンが再生される。月夜の山道を駆ける英霊。
```

#### `text_memory_mountain_02`（text）
**演出:** bg: bg_memory_mountain
```text
木々の隙間から、音も気配もなく銀色の矢が次々と放たれた。
```

#### `text_memory_mountain_03`（text）
**演出:** bg: bg_memory_mountain
```text
（気配すらなく放たれる銀の矢……。わずかでも動きを止めれば、一瞬で魂ごと射抜かれる！）
```

#### `text_artemis_appear`（text）
**演出:** bg: bg_memory_mountain, bgm: bgm_battle_strong
```text
月光の柱が降り注ぎ、その光の中から一人の影が歩み出た。
```

#### `text_artemis_appear_02`（text）
**演出:** bg: bg_memory_mountain
```text
銀の長髪に、すべてを見透かすような冷酷なるサファイアの瞳。
```

#### `text_artemis_appear_03`（text）
**演出:** bg: bg_memory_mountain
```text
月と狩猟を司る女神アルテミス。絶対の射手である。
```

#### `text_artemis_voice`（text）
**演出:** bg: bg_memory_mountain, speaker: 女神アルテミス
```text
「我が月光の射程から、逃れられると思うな」
```

#### `text_artemis_voice_02`（text）
**演出:** bg: bg_memory_mountain, speaker: 女神アルテミス
```text
「先代の力を受け継ぐ者よ。その魂ごと射抜いてみせよう」
```

#### `text_artemis_challenge`（text）
**演出:** bg: bg_memory_mountain, speaker: 女神アルテミス
```text
「神の弓矢の前に、人間がどこまで抗えるかを示すが良い」
```

#### `text_artemis_challenge_02`（text）
**演出:** bg: bg_memory_mountain, speaker: 女神アルテミス
```text
「逃げるのをやめ、汝の武器を構えて立ち向かうがいい」
```

#### `battle`（battle）
**演出:** bg: bg_memory_mountain, bgm: bgm_spot_final_boss
**パラメータ:** enemy_group_id: 9052, next: choice1, fail: end_failure

#### `choice1`（choice）
**演出:** bg: bg_memory_mountain, bgm: bgm_spot_final_boss
| 選択肢 | next_node |
|---|---|
| 「女神アルテミスを撃退する」 | `text_artemis_defeat` |

#### `text_artemis_defeat`（text）
**演出:** bg: bg_memory_mountain
```text
光の矢の雨をすり抜け、あなたの刃が女神の弓を叩き落とした。
```

#### `text_artemis_defeat_02`（text）
**演出:** bg: bg_memory_mountain, speaker: 女神アルテミス
```text
「実に見事。我が敗北を認め、月光の衣を授けよう」
```

#### `text_armor`（text）
**演出:** bg: bg_heroic_stele
```text
まばゆい光が消え去り、意識は現実の静かな谷底へと戻った。
```

#### `text_armor_02`（text）
**演出:** bg: bg_heroic_stele
```text
石碑の足元には、銀色に優しく輝く「女神の鎧」がある。
```

#### `text_return`（text）
**演出:** bg: bg_heroic_stele
```text
（月光の衣……美しいが、息苦しいほどの神威を感じるな。これで遺産は三つ揃った……）
```

#### `text_return_02`（text）
**演出:** bg: bg_mountain, bgm: bgm_quest_calm
```text
手にした「女神の鎧」を抱え、あなたは静かな谷底を後にした。山脈を降り、最後の石碑が眠る王都レガリアを目指して。
```

#### `end_node`（end_success）
**演出:** bg: bg_mountain
```text
女神アルテミスの試練を乗り越え、「女神の鎧」を得た。
```
**rewards:** Gold:3500, Rep:25, Item:507, Order:5

#### `end_failure`（end_failure）
**演出:** bg: bg_heroic_stele
```text
アルテミスの銀の矢が胸を貫く。冷気の中、意識が消失した。
```
**rewards:** Gold:0
