# クエスト仕様書：6014 — 第14話「啓示の使者」

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6014 |
| **Slug** | `main_ep14` |
| **クエスト種別** | メインエピソード（Main） |
| **推奨レベル** | 14（Hard） |
| **難度** | 3 |
| **依頼主** | なし |
| **出現条件** | 第13話「癒しの暴君」（6013）クリア / 滞在拠点: 夜刀神国首都 神都「出雲」 |
| **リピート** | アカウント通じて1回のみ（継承後も非表示） |
| **経過日数 (time_cost)** | 2 |
| **ノード数** | 42ノード |
| **ゲストNPC** | ヴォルグ（guest_join → leave） |
| **難易度Tier** | Hard（rec_level: 14） |
| **サムネイル画像** | `/images/quests/bg_izumo_ruined.png` |
---

## 1. クエスト概要

### 短文説明
```
疑心暗鬼の出雲。大天使ガブリエルが囁く「裏切りの言葉」。
```

### 長文説明
```
夜刀神国の神社町・出雲。そこでは大天使ガブリエルの邪悪な囁きにより、
住民同士が互いを裏切り者と疑い、殺し合っていた。
あなたとヴォルグの間にも囁きが響く中、固い絆で大天使を打ち破れ。
```

---

## 2. 報酬定義
```
Exp:400|Gold:2000|Rep:20|Order:5|Items:item_pass_roland
```

---

## 3. シナリオノード構成（42ノード）

### 全体フロー
```text
start → start_02 → volg_join → arrival_01 → arrival_02
  → chaos_01 → chaos_02 → chaos_03 → chaos_04 → volg_01 → volg_02
  → shrine_01 → shrine_02 → whisper_01 → whisper_02 → whisper_03 → whisper_04 → whisper_05 → whisper_06
  → guard_01 → battle1(504) → choice1 → inner_01 → inner_02
  → gabriel_01 → gabriel_02 → gabriel_03 → gabriel_04
  → volg_defiance_01 → volg_defiance_02 → volg_defiance_03 → volg_defiance_04
  → battle2(9042) → choice2 → retreat_01 → retreat_02 → retreat_03
  → sanity_01 → sanity_02 → volg_leave → next_01 → next_02 → end_node
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_road_day, bgm: bgm_quest_calm
```text
夜刀神国の美しい神社が並ぶ出雲の街へと向かう。
```

#### `start_02`（text）
**演出:** bg: bg_road_day
```text
隣を歩くヴォルグは、無言で大剣を磨いている。
```

#### `volg_join`（guest_join）
**パラメータ:** guest_id: `npc_guest_volg`

#### `arrival_01`（text）
**演出:** bg: bg_izumo_ruined, bgm: bgm_quest_tense
```text
出雲に到着した。しかし、街は異様な熱気に包まれている。
```

#### `arrival_02`（text）
**演出:** bg: bg_izumo_ruined
```text
あちこちで怒号が響き渡り、煙が立ち上っていた。
```

#### `chaos_01`（text）
**演出:** bg: bg_izumo_ruined
```text
住民たちが武器を手にし、互いを罵り合っている。
```

#### `chaos_02`（text）
**演出:** bg: bg_izumo_ruined, speaker: 錯乱した住民
```text
「お前が天の敵だ！殺さなければ俺たちが滅ぼされる！」
```

#### `chaos_03`（text）
**演出:** bg: bg_izumo_ruined, speaker: 錯乱した住民
```text
「天の声が聞こえた！こいつを裏切り者として排除しろ！」
```

#### `chaos_04`（text）
**演出:** bg: bg_izumo_ruined
```text
狂気に囚われた人々は、かつての友人に刃を向けている。
```

#### `volg_01`（text）
**演出:** bg: bg_izumo_ruined, speaker: ヴォルグ
```text
「けっ、互いに殺し合いか。悪趣味極まりねえな」
```

#### `volg_02`（text）
**演出:** bg: bg_izumo_ruined
```text
その時、あなたの頭の中に不気味な囁き声が響いた。
```

#### `shrine_01`（text）
**演出:** bg: bg_izumo_ruined, speaker: 謎の声
```text
「「背後ノ男ハオ前ヲ裏切ロウトシテイル。先ニ殺セ」」
```

#### `shrine_02`（text）
**演出:** bg: bg_izumo_ruined
```text
見ると、ヴォルグもまたあなたの背後を疑わしげに見る。
```

#### `whisper_01`（text）
**演出:** bg: bg_izumo_ruined
```text
互いの手が、ゆっくりと武器の柄へと伸びかける。
```

#### `whisper_02`（text）
**演出:** bg: bg_izumo_ruined
```text
しかし、あなたは強く頭を振り、その囁きを否定した。
```

#### `whisper_03`（text）
**演出:** bg: bg_izumo_ruined
```text
ヴォルグもまた大剣から手を離し、不敵に鼻で笑う。
```

#### `whisper_04`（text）
**演出:** bg: bg_izumo_ruined, speaker: ヴォルグ
```text
「安っぽい細工だ。俺たちが仲間割れすると思ったかよ」
```

#### `whisper_05`（text）
**演出:** bg: bg_izumo_ruined
```text
二人は再び信頼を取り戻し、前方の敵を見据える。
```

#### `whisper_06`（text）
**演出:** bg: bg_izumo_ruined
```text
広場の奥から、囁きをまき散らす使徒が姿を現した。
```

#### `guard_01`（text）
**演出:** bg: bg_izumo_ruined
```text
幻聴の源を叩くため、あなたは武器を構えて突撃する。
```

#### `battle1`（battle）
**演出:** bg: bg_izumo_ruined, bgm: bgm_battle
**パラメータ:** enemy_group_id: 504, next: choice1, fail: end_failure

#### `choice1`（choice）
**演出:** bg: bg_izumo_ruined, bgm: bgm_battle
| 選択肢 | next_node |
|---|---|
| 「囁きの使徒を排除する」 | `inner_01` |

#### `inner_01`（text）
**演出:** bg: bg_izumo_ruined
```text
使徒を撃退した。だが、囁きは止むどころか強まる。
```

#### `inner_02`（text）
**演出:** bg: bg_izumo_ruined
```text
神殿の奥から、まばゆい鏡の光が溢れ出してきた。
```

#### `gabriel_01`（text）
**演出:** bg: bg_izumo_ruined
```text
鏡の翼を持ち、あらゆる言葉を反射する大天使が降臨する。
```

#### `gabriel_02`（text）
**演出:** bg: bg_izumo_ruined
```text
大天使ガブリエルは、冷ややかな瞳で人間を見下ろした。
```

#### `gabriel_03`（text）
**演出:** bg: bg_izumo_ruined, speaker: 大天使ガブリエル
```text
「人間ハ互イヲ信用シテナイ。少シ囁ケバ勝手ニ殺シ合ウ」
```

#### `gabriel_04`（text）
**演出:** bg: bg_izumo_ruined, speaker: 大天使ガブリエル
```text
「貴様らも、いつ背後から刺されるか恐ろしいのだろう？」
```

#### `volg_defiance_01`（text）
**演出:** bg: bg_izumo_ruined, speaker: ヴォルグ
```text
「ハッ！ 誰がいつ裏切ろうが知るかよ。今は戦うだけだ！」
```

#### `volg_defiance_02`（text）
**演出:** bg: bg_izumo_ruined, speaker: ヴォルグ
```text
「お前のお喋りは聞き飽きた。その鏡を叩き割ってやる！」
```

#### `volg_defiance_03`（text）
**演出:** bg: bg_izumo_ruined
```text
ヴォルグは咆哮と共に、大天使に向かって跳躍した。
```

#### `volg_defiance_04`（text）
**演出:** bg: bg_izumo_ruined
```text
あなたも剣を強く握り、大天使ガブリエルへ挑みかかる。
```

#### `battle2`（battle）
**演出:** bg: bg_izumo_ruined, bgm: bgm_battle_strong
**パラメータ:** enemy_group_id: 9042, next: choice2, fail: end_failure

#### `choice2`（choice）
**演出:** bg: bg_izumo_ruined, bgm: bgm_battle_strong
| 選択肢 | next_node |
|---|---|
| 「ガブリエルを撃退する」 | `retreat_01` |

#### `retreat_01`（text）
**演出:** bg: bg_izumo_ruined
```text
大天使の鏡の翼を切り裂き、その防御を打ち破る。
```

#### `retreat_02`（text）
**演出:** bg: bg_izumo_ruined
```text
ガブリエルは翼を抱えるようにして、天へと去っていく。
```

#### `retreat_03`（text:**）
**演出:** bg: bg_izumo_ruined, speaker: 大天使ガブリエル
```text
「残ル都ハ聖王都レガリアナリ……。そこデ終焉ヲ迎エヨ」
```

#### `sanity_01`（text）
**演出:** bg: bg_izumo_ruined, bgm: bgm_quest_calm
```text
大天使の去った後、人々の瞳から狂気の光が消えていった。
```

#### `sanity_02`（text）
**演出:** bg: bg_izumo_ruined
```text
静けさを取り戻した出雲で、ヴォルグが不敵に笑う。
```

#### `volg_leave`（leave）
**パラメータ:** guest_id: `npc_guest_volg`

#### `next_01`（text）
**演出:** bg: bg_izumo_ruined, speaker: ヴォルグ
```text
「最後の決戦は聖王都レガリアだな。先に行って待ってるぜ」
```

#### `next_02`（text）
**演出:** bg: bg_izumo_ruined
```text
ヴォルグを見送り、あなたも旅の終わりへ向け決意する。
```

#### `end_node`（end_success）
**演出:** bg: bg_izumo_ruined
```text
聖王都レガリアを目指し、あなたの最後の旅が始まった。
```
**rewards:** Exp:400, Gold:2000, Rep:20, Order:5, Items:item_pass_roland

#### `end_failure`（end_failure）
**演出:** bg: bg_izumo_ruined
```text
疑心暗鬼の闇に飲まれ、あなたは仲間と相討ちとなった。
```
**rewards:** Gold:0
