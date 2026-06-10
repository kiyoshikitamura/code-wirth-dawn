# クエスト仕様書：6002 — 第2話「砂塵の陰謀」

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6002 |
| **Slug** | `main_ep02` |
| **クエスト種別** | メインエピソード（Main） |
| **推奨レベル** | 2（Easy） |
| **難度** | 1 |
| **依頼主** | 王国軍 |
| **出現条件** | 第1話「始まりの轍」（6001）クリア / 滞在拠点: 国境の町 |
| **リピート** | アカウント通じて1回のみ（継承後も非表示） |
| **経過日数 (time_cost)** | 2 |
| **ノード数** | 37ノード |
| **ゲストNPC** | ガウェイン（guest_join → leave） |
| **難易度Tier** | Easy（rec_level: 2） |
| **サムネイル画像** | `/images/quests/bg_road_day.png` |
---

## 1. クエスト概要

### 短文説明
```
国境警備任務。正体不明の武装集団との遭遇。
```

### 長文説明
```
ローランドとマルカンドの国境地帯。
赤茶けた荒野が地平線まで続く過酷な地で、ガウェインと共に不穏な影を追う。
```

---

## 2. 報酬定義

```
Exp:100|Gold:200|Rep:5|Order:5
```

---

## 3. シナリオノードフロー

```text
start
 └─ start_02
     └─ gawain_join (guest_join)
         └─ patrol_01
             └─ patrol_02
                 └─ suspicion_01
                     └─ suspicion_02
                         └─ suspicion_03
                             └─ hunch_01
                                 └─ choice1
                                      ├─ 「隣国マルカンドの兵士では？」 → reply_01
                                      └─ 「誰であろうと、斬るだけです」 → reply_01
                                           └─ reply_01
                                               └─ reply_02
                                                   └─ reply_03
                                                       └─ approach_01
                                                           └─ approach_02
                                                               └─ formation_01
                                                                   └─ formation_02
                                                                       └─ enemy_01
                                                                           └─ enemy_02
                                                                               └─ battle
                                                                                    ├─ win → choice2
                                                                                    │          └─ 「迎撃する」 → post_01
                                                                                    │                              └─ post_01
                                                                                    │                                  └─ post_02
                                                                                    │                                      └─ dying_01
                                                                                    │                                          └─ dying_02
                                                                                    │                                              └─ corpse_01
                                                                                    │                                                  └─ corpse_02
                                                                                    │                                                      └─ silent_01
                                                                                    │                                                          └─ silent_02
                                                                                    │                                                              └─ report_01
                                                                                    │                                                                  └─ farewell_01
                                                                                    │                                                                      └─ gawain_leave (leave)
                                                                                    │                                                                          └─ end_01
                                                                                    │                                                                              └─ end_node
                                                                                    └─ lose → end_failure_01
                                                                                                 └─ end_failure
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_road_day, bgm: bgm_quest_calm
```text
野盗撃退の働きが認められ、ガウェインの推薦で国境警備任務に配属された。
```

#### `start_02`（text）
**演出:** bg: bg_road_day
```text
配属先はローランドとマルカンドの国境地帯。赤茶けた荒野が地平線まで続く。
```

#### `gawain_join`（guest_join）
**演出:** bg: bg_road_day
**パラメータ:** guest_id: `npc_guest_gawain`

#### `patrol_01`（text）
**演出:** bg: bg_road_day
```text
吹き荒れる砂風を避けながら、ガウェインと共に国境沿いの岩場を進む。
```

#### `patrol_02`（text）
**演出:** bg: bg_road_day
```text
周囲を歩く警備兵たちの間に、かつてないほど重苦しい緊張が漂っていた。
```

#### `suspicion_01`（text）
**演出:** bg: bg_road_day, speaker: ガウェイン
```text
「最近、国境を荒らす野盗どもはただのゴロツキにしちゃ統率が取れすぎている」
```

#### `suspicion_02`（text）
**演出:** bg: bg_road_day, speaker: ガウェイン
```text
「まるで訓練された軍人のような身のこなしだ。武器も妙に上等な物を使っている」
```

#### `suspicion_03`（text）
**演出:** bg: bg_road_day, speaker: ガウェイン
```text
「さらに、捕らえた奴らの懐から、どこかで見たような軍の携行食が出てきた」
```

#### `hunch_01`（text）
**演出:** bg: bg_road_day, speaker: ガウェイン
```text
「嫌な予感がするな。戦場で二十年生き延びてきた俺の直感が、そう言っている」
```

#### `choice1`（choice）
**演出:** bg: bg_road_day
| 選択肢 | next_node |
|---------|-----------|
| 「隣国マルカンドの兵士では？」 | `reply_01` |
| 「誰であろうと、斬るだけです」 | `reply_01` |

#### `reply_01`（text）
**演出:** bg: bg_road_day, speaker: ガウェイン
```text
「隣国マルカンドの正規兵か、あるいは……。どちらにせよ、キナ臭い話だ」
```

#### `reply_02`（text）
**演出:** bg: bg_road_day, speaker: ガウェイン
```text
「もしこれが国家間の密命だとしたら、俺たちは巨大な陰謀の渦中にいることになる」
```

#### `reply_03`（text）
**演出:** bg: bg_road_day, speaker: ガウェイン
```text
「まあいい、目の前の境界を守るのが俺たちの役目だ。警戒を怠るなよ」
```

#### `approach_01`（text）
**演出:** bg: bg_road_day, bgm: bgm_quest_tense
```text
その時、遠方の陽炎の向こうから、黒い布で顔を覆った集団が現れた。
```

#### `approach_02`（text）
**演出:** bg: bg_road_day, bgm: bgm_quest_tense
```text
彼らは馬を巧みに操り、我々を半包囲するような陣形で急速に接近してくる！
```

#### `formation_01`（text）
**演出:** bg: bg_road_day, bgm: bgm_quest_tense, speaker: ガウェイン
```text
「敵襲だ！ 陣形を崩すな！ 荷馬車を囲んで盾を作れ！」
```

#### `formation_02`（text）
**演出:** bg: bg_road_day, bgm: bgm_quest_tense, speaker: ガウェイン
```text
「新入り、俺の左翼を任せる。抜けさせるなよ！」
```

#### `enemy_01`（text）
**演出:** bg: bg_road_day, bgm: bgm_quest_tense
```text
黒布の男たちから鋭い口笛が響く。先頭の男が冷徹に手を下ろした。
```

#### `enemy_02`（text）
**演出:** bg: bg_road_day, bgm: bgm_quest_tense, speaker: 黒装束の指揮官
```text
「全員殺せ。証拠は一切残すな。ローランドの兵にこの地を渡すな！」
```

#### `battle`（battle）
**演出:** bg: bg_road_day, bgm: bgm_battle
**パラメータ:** enemy_group_id: 202, next: `choice2`, fail: `end_failure_01`

#### `choice2`（choice）
**演出:** bg: bg_road_day, bgm: bgm_battle
| 選択肢 | next_node |
|---------|-----------|
| 「迎撃する」 | `post_01` |

#### `post_01`（text）
**演出:** bg: bg_road_day, bgm: bgm_quest_calm
```text
辛くも敵を撃退した。だが、敵の遺体から見つかったのは野盗の所持品ではない。
```

#### `post_02`（text）
**演出:** bg: bg_road_day
```text
黒い布を引き剥がすと、現れたのはまだ若い兵士の顔だった。軍の制服だ。
```

#### `dying_01`（text）
**演出:** bg: bg_road_day, speaker: 瀕死の襲撃兵
```text
「無駄だ……もう止まらない……」
```

#### `dying_02`（text）
**演出:** bg: bg_road_day, speaker: 瀕死の襲撃兵
```text
「我々は……上からの命令に従っただけだ……逆らえば、家族が消される……」
```

#### `corpse_01`（text）
**演出:** bg: bg_road_day
```text
男は事切れた。ガウェインがその死体が持っていた剣を拾い上げ、凝視する。
```

#### `corpse_02`（text）
**演出:** bg: bg_road_day
```text
剣の根元。鋭利な刃で削り潰されているが、ローランド正規軍の紋章の跡が見える。
```

#### `silent_01`（text）
**演出:** bg: bg_road_day
```text
ガウェインは無言でその紋章をなぞった。彼の大きな手が震えている。
```

#### `silent_02`（text）
**演出:** bg: bg_road_day, speaker: ガウェイン
```text
「……削り跡の下は、我が国の聖印だ。こいつらは……いや、よそう」
```

#### `report_01`（text）
**演出:** bg: bg_road_day, speaker: ガウェイン
```text
「このままでは大変なことになる。俺は至急、本隊へ戻って報告を入れる」
```

#### `farewell_01`（text）
**演出:** bg: bg_road_day, speaker: ガウェイン
```text
「新入り、お前も巻き込まれるなよ。次の警備地でまた合流しよう」
```

#### `gawain_leave`（leave）
**演出:** bg: bg_road_day
**パラメータ:** guest_id: `npc_guest_gawain`

#### `end_01`（text）
**演出:** bg: bg_road_day
```text
宿場町への道を急ぐ。風に舞う砂塵が、行く先を煙らせていた。
```

#### `end_node`（end_success）
**演出:** bg: bg_road_day
```text
「家族が殺される」——死にゆく敵の言葉が、砂漠の風に溶けて消えた。
```
**rewards:** Exp:100, Gold:200, Rep:5, Order:5

#### `end_failure_01`（text）
**演出:** bg: bg_road_day, bgm: bgm_quest_tense
**次ノード:** `end_failure`
```text
統率された包囲網に切り刻まれ、膝をつく。意識が砂塵の底へ沈んでいく……
```

#### `end_failure`（end_failure）
**演出:** bg: bg_road_day
```text
国境の荒野に骸が晒された。陰謀の真実が暴かれることはなかった。
```
**rewards:** Gold:0
