# クエスト仕様書：6015 — 第15話「天軍の長」

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6015 |
| **Slug** | `main_ep15` |
| **クエスト種別** | メインエピソード（Main） |
| **推奨レベル** | 20（Hard） |
| **難度** | 4 |
| **依頼主** | なし |
| **出現条件** | 第14話「啓示の使者」（6014）クリア / 滞在拠点: 王都レガリア |
| **リピート** | アカウント通じて1回のみ（継承後も非表示） |
| **経過日数 (time_cost)** | 2 |
| **ノード数** | 53ノード |
| **ゲストNPC** | ヴォルグ（guest_join → leave） |
| **サムネイル画像** | `/images/quests/bg_regalia_ruined.png` |

---

## 1. クエスト概要

### 短文説明
```
王都レガリアを襲う天軍の長、大天使ミカエル。ヴォルグと共に最後の死闘に挑め。
```

### 長文説明
```
三体の大天使を退けたが、残る最強の長・ミカエルがローランド首都レガリアへ降臨する。
壊滅的な被害を受ける王都にて、不死の傭兵ヴォルグと再び背中を合わせ、人類の存亡をかけた決戦へ赴く。
```

---

## 2. 報酬定義

**CSV記載形式:**
```
Gold:2500|Rep:30|Item:503|Order:5
```

---

## 3. シナリオノード構成（53ノード）

### 全体フロー
```text
start → start_02 → start_03 → start_04 → start_05 → volg_join → text_arrival → text_arrival_02
  → text_arrival_03 → text_arrival_04 → text_devastation → text_devastation_02 → text_devastation_03
  → text_soldiers_last → text_soldiers_02 → text_soldiers_03 → text_soldiers_04 → text_volg_resolve
  → text_volg_resolve_02 → text_volg_resolve_02b → text_volg_resolve_03 → text_cathedral → text_cathedral_02
  → text_cathedral_03 → text_cathedral_04 → text_michael_throne → text_michael_throne_02 → text_michael_throne_03
  → text_apostle_elite → text_apostle_elite_02 → battle1 → choice1 → text_michael_descend
  → text_michael_descend_02 → text_michael_voice → text_michael_declaration → text_volg_intervene
  → text_volg_final → text_volg_final_02 → battle2 → choice2 → text_michael_retreat → text_michael_retreat_02
  → text_city_saved → text_city_saved_02 → text_volg_approach_farewell → text_volg_farewell
  → text_volg_farewell_02 → volg_leave → text_epilogue → text_epilogue_02 → end_node → end_failure
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_road_day, bgm: bgm_quest_crisis
```text
三体の大天使を辛くも退けたが、地上の破滅を告げる神の足音は止まらない。
```

#### `start_02`（text）
**演出:** bg: bg_road_day
```text
イスハーク、龍京、出雲――傷だらけの都と人々は、絶望の淵で喘いでいる。
```

#### `start_03`（text）
**演出:** bg: bg_road_day
```text
残る最後の一体は、天軍を統べる最強の長である大天使ミカエル。
```

#### `start_04`（text）
**演出:** bg: bg_road_day
```text
（残るは天軍の長、ミカエル。奴の刃が狙うのが白亜の都であろうと……ただ座して滅びを待つ気はない）
```

#### `start_05`（text）
**演出:** bg: bg_road_day
```text
滅びの神威に包まれる王都を救うため、あなたは焦燥を抱き、馬を駆る。
```

#### `volg_join`（guest_join）
**演出:** bg: bg_road_day
```text
道中、大剣を担いだ不死のヴォルグが隣に並び、獰猛な笑みを浮かべた。
```
**パラメータ:** guest_id: npc_guest_volg, next: text_arrival

#### `text_arrival`（text）
**演出:** bg: bg_regalia_ruined
```text
辿り着いた王都レガリアは、かつての白亜の美しさを完全に失っていた。
```

#### `text_arrival_02`（text）
**演出:** bg: bg_regalia_ruined
```text
空を見上げると、巨大な十字架が、王都を冷酷に照らしている。
```

#### `text_arrival_03`（text）
**演出:** bg: bg_regalia_ruined
```text
（何という惨状だ……）
```

#### `text_arrival_04`（text）
**演出:** bg: bg_regalia_ruined
```text
あまりの惨状に、あなたは言葉を失った。
```

#### `text_devastation`（text）
**演出:** bg: bg_regalia_ruined
```text
ウリエルの業火とも、ラファエルの強いる眠りとも、ガブリエルがもたらした狂気とも異なる、ただ純粋な武力による破壊の痕跡。
```

#### `text_devastation_02`（text）
**演出:** bg: bg_regalia_ruined
```text
ミカエルは圧倒的な「神威の武力」のみで都を叩き潰したのだろう。
```

#### `text_devastation_03`（text）
**演出:** bg: bg_regalia_ruined
```text
巨大な光の刃で大路ごと薙ぎ払ったような、深々とした剣痕が大地を裂く。
```

#### `text_soldiers_last`（text）
**演出:** bg: bg_regalia_ruined
```text
その無残な裂け目の先、崩壊した大聖堂へ続く大通りの陰に、血に塗れた聖騎士たちが身を潜めていた。
```

#### `text_soldiers_02`（text）
**演出:** bg: bg_regalia_ruined
```text
誇り高き白銀の鎧はことごとく砕かれ、あたりには絶望的な死臭が漂っている。その死体の山から、一人の衛兵隊長が血を吐きながらこちらへ声を絞り出してきた。
```

#### `text_soldiers_03`（text）
**演出:** bg: bg_regalia_ruined, speaker: 負傷した衛兵隊長
```text
「……応援、か……？ だが、遅すぎた……。我らの刃では……奴の影すら、斬れんのだ……」
```

#### `text_soldiers_04`（text）
**演出:** bg: bg_regalia_ruined, speaker: 負傷した衛兵隊長
```text
「ゴハッ……！ ミカエルは……大聖堂にいる……。この地に残る、希望の種を……全て刈り取るためにな……」
```

#### `text_volg_resolve`（text）
**演出:** bg: bg_regalia_ruined
```text
衛兵隊長の話を聞き、ヴォルグが肩の大剣を握り直して不敵な笑みを浮かべた。
```

#### `text_volg_resolve_02`（text）
**演出:** bg: bg_regalia_ruined, speaker: ヴォルグ
```text
「最後の一体、天軍の長か。闘気の格が今までの奴らとは段違いだぜ」
```

#### `text_volg_resolve_02b`（text）
**演出:** bg: bg_regalia_ruined, speaker: ヴォルグ
```text
「だが関係ねえ。俺たちは行く先々で大天使どもを蹴散らしてきた」
```

#### `text_volg_resolve_03`（text）
**演出:** bg: bg_regalia_ruined, speaker: ヴォルグ
```text
「最強の天使だろうが、やることは同じだ。その傲慢な首を切り落とすっ！」
```

#### `text_cathedral`（text）
**演出:** bg: bg_regalia_ruined
```text
ヴォルグの不敵な言葉に背中を押され、あなたは彼と共に、犠牲者の血で染まった大聖堂の石段を駆け上がる。
```

#### `text_cathedral_02`（text）
**演出:** bg: bg_regalia_ruined
```text
かつて荘厳を誇った白亜の尖塔は半壊し、砕け散った硝子が月光に煌めく.
```

#### `text_cathedral_03`（text）
**演出:** bg: bg_regalia_ruined
```text
（聖者の彫像すら首から上を失っている……神々の無慈悲さは、ここまでか……）
```

#### `text_cathedral_04`（text）
**演出:** bg: bg_regalia_ruined
```text
聖堂の前に広がる礼拝広場には、天を貫くほどの巨大な神威の光柱が聳える。
```

#### `text_michael_throne`（text）
**演出:** bg: bg_regalia_ruined
```text
砕け散った聖者の石像を積み上げた、即席の玉座に傲然と腰掛ける巨軀。
```

#### `text_michael_throne_02`（text）
**演出:** bg: bg_regalia_ruined
```text
その背に翻るのは、眩く輝く白銀の六翼。その手には、大気を焦がす熱線の光刃が握られていた。
```

#### `text_michael_throne_03`（text）
**演出:** bg: bg_regalia_ruined
```text
（他の大天使とは、まとう覇気がまるで違う。だが、ここまで来て引くわけにはいかない……！）
```

#### `text_apostle_elite`（text）
**演出:** bg: bg_regalia_ruined
```text
ミカエルが放つ圧倒的な威圧に呼応し、光の盾を構えた精鋭使徒たちが現れる。
```

#### `text_apostle_elite_02`（text）
**演出:** bg: bg_regalia_ruined
```text
（奴の元へ行くには、この盾の列をこじ開けるしかない。……やるぞ！）
```

#### `battle1`（battle）
**演出:** bg: bg_regalia_ruined, bgm: bgm_battle
**パラメータ:** enemy_group_id: 211, next: choice1, fail: end_failure

#### `choice1`（choice）
**演出:** bg: bg_regalia_ruined, bgm: bgm_battle
| 選択肢 | next_node |
|---|---|
| 「親衛隊を撃退する」 | `text_michael_descend` |

#### `text_michael_descend`（text）
**演出:** bg: bg_regalia_ruined
```text
死闘の末に親衛隊を切り伏せたが、眼前にある神の威容は未だ揺らぎもしない。
```

#### `text_michael_descend_02`（text）
**演出:** bg: bg_regalia_ruined
```text
ゆっくりとミカエルが立ち上がる。その一動作だけで大地全体が激しく鳴動し、神威に満ちた声が頭上から降ってきた。
```

#### `text_michael_voice`（text）
**演出:** bg: bg_regalia_ruined, speaker: 大天使ミカエル
```text
「同胞タル三体ヲ屠リ、此処ニ至ッタ人間ヨ。認メヨウ、汝ラノ武ハ強イ」
```

#### `text_michael_declaration`（text）
**演出:** bg: bg_regalia_ruined, speaker: 大天使ミカエル
```text
「ダガ、汝ラノ足掻キハ秩序ニハ届カヌ。神威ノ光剣ニテ、大イナル裁キヲ与エン」
```

#### `text_volg_intervene`（text）
**演出:** bg: bg_regalia_ruined
```text
ミカエルの傲慢な宣告を遮るように、ヴォルグが前に出た。
```

#### `text_volg_final`（text）
**演出:** bg: bg_regalia_ruined, speaker: ヴォルグ
```text
「秩序だあ？ 人間を家畜のようにならし、跪かせるのがテメエらの秩序かよ」
```

#### `text_volg_final_02`（text）
**演出:** bg: bg_regalia_ruined, speaker: ヴォルグ
```text
「悪ぃが俺たちは飢えた野良犬だ。首輪をはめられる気はねえ。来い、天の長」
```

#### `battle2`（battle）
**演出:** bg: bg_regalia_ruined, bgm: bgm_spot_final_boss
**パラメータ:** enemy_group_id: 9043, next: choice2, fail: end_failure

#### `choice2`（choice）
**演出:** bg: bg_regalia_ruined, bgm: bgm_spot_final_boss
| 選択肢 | next_node |
|---|---|
| 「ミカエルを撃退する」 | `text_michael_retreat` |

#### `text_michael_retreat`（text）
**演出:** bg: bg_regalia_ruined
```text
あなたとヴォルグの捨て身の同時攻撃が、ミカエルの光の大剣を粉々に叩き砕いた。ミカエルの巨躯が初めて膝をつき、信じがたいものを見る目であなたたちを睨む。
```

#### `text_michael_retreat_02`（text）
**演出:** bg: bg_regalia_ruined, speaker: 大天使ミカエル
```text
「マサカ、矮小ナル人間ガ我ガ大剣ヲ……。ダガ、天ノ主ノ御心ハ既ニ……」
```

#### `text_city_saved`（text）
**演出:** bg: bg_regalia_ruined
```text
まばゆい光の粒子となってミカエルが消滅し、上空を覆う十字架が崩壊していく。
```

#### `text_city_saved_02`（text）
**演出:** bg: bg_regalia_ruined
```text
（終わった……のか？ 傷だらけだが、私たちは本当に、あの最強の大天使を退けたのだ……）
暗雲の隙間から、血の色の夕陽が差し込む。四つの都は傷つき、引き裂かれながらも、たしかに地の上に生き残った。
```

#### `text_volg_approach_farewell`（text）
**演出:** bg: bg_regalia_ruined
```text
大剣を地面に突き立て、ヴォルグが血と汗に塗れた体を支えるように深く息を吐く。そして、大剣の柄に寄りかかりながら、あなたを振り返ってにやりと笑った。
```

#### `text_volg_farewell`（text）
**演出:** bg: bg_regalia_ruined, speaker: ヴォルグ
```text
「……大掃除は終わったな。だが、あのデカブツが言った通り天の上には上がいる」
```

#### `text_volg_farewell_02`（text）
**演出:** bg: bg_regalia_ruined, speaker: ヴォルグ
```text
「神の救いや許しを請うより、俺たちは人間らしく泥を這って生き抜くべきだ。じゃあな」
```

#### `volg_leave`（leave）
**演出:** bg: bg_regalia_ruined
```text
彼は大剣を肩に担ぎ直すと、夕陽の差し込む瓦礫の中を歩き去っていった。その背中は、どこまでも自由で、不敵だった。
```
**パラメータ:** guest_id: npc_guest_volg, next: text_epilogue

#### `text_epilogue`（text）
**演出:** bg: bg_regalia_ruined
```text
神々の軍勢に、人類の強固な意志を示した。王都レガリア、そして四つの都は深く傷つき、引き裂かれながらも、たしかに地の上に生き残ったのだ。
```

#### `text_epilogue_02`（text）
**演出:** bg: bg_regalia_ruined
```text
空を覆っていた光の十字架は崩れ去り、瓦礫の街には人間のための、新しい夕陽が差し込んでいる。
```

#### `end_node`（end_success）
**演出:** bg: bg_regalia_ruined
```text
神々の秩序に縛られず、己の足で泥を這って生き抜く――人間たちの次なる時代への歩みが、今ここに静かに始まる。世界はまだ滅びてなどいない。それだけで、前に進むには十分だった。
```
**rewards:** Gold:2500, Rep:30, Item:503, Order:5

#### `end_failure`（end_failure）
**演出:** bg: bg_regalia_ruined
```text
（ミカエルが放つ無慈悲な光の刃に貫かれ、自分の意識は純白の光の中に消え去った）
```
**rewards:** Gold:0
