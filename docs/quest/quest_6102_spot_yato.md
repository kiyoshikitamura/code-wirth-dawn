# クエスト仕様書：6102 — 冥食の残滓 ―常闇に消ゆ、宿命の贄―

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6102 |
| **Slug** | `qst_spot_yato` |
| **クエスト種別** | スポットシナリオ / 護衛（Special） |
| **推奨レベル** | 20（Hard） |
| **難度** | 5 |
| **依頼主** | 隠れ里の長老 |
| **出現条件** | 夜刀拠点滞在 / 世界・正義(Justice)50%以上 |
| **リピート** | 現世代で1回（継承後は再出現） |
| **難易度Tier** | Hard（rec_level: 20） |
| **経過日数 (time_cost)** | 7 |
| **ノード数** | 49ノード |
| **ゲストNPC** | 撫子（guest_join → leave） |
| **サムネイル画像** | `/images/quests/bg_spot_yato_eclipse.png` |

---

## 1. クエスト概要

### 短文説明
```
100年に一度の『冥食』。宿命の子「撫子」を護衛し、冥の門の最深部を目指せ。
```

### 長文説明
```
昼夜が逆転し、空が赤黒く染まる「冥食」が始まった。
夜刀の国では、異界の口「冥の門」を封じるため、宿命の子を贄として捧げる儀式が行われる。
隠れ里で育てられた少女「撫子」と共に、彼女を守り抜きながら門の最深部へ向かえ。
四大妖怪の試練が待ち受けている。
```

---

## 2. 報酬定義

**ルートA（儀式完遂ルート）CSV記載形式:**
```
Exp:500|Gold:10000|Rep:200|Item:615
```

**ルートB（撫子救出ルート）CSV記載形式:**
```
Exp:500|Rep:-100|Item:616
```

---

## 3. シナリオノード構成

### 全体フロー
```text
start → start_02 → start_03 → start_04 → join_nadeshiko → join_nadeshiko_02 → join_nadeshiko_03 → join_monologue
  → spider1_intro → battle_spider_1 → spider2_intro → battle_spider_2
  → spider3_intro → battle_spider_3 → spider4_intro → battle_spider_4 → spider_clear_monologue
  → wani_intro → wani_intro_02 → battle_wani → reward_magatama_1
  → tori_intro → tori_intro_02 → battle_tori → reward_magatama_2
  → kuruma_intro → kuruma_intro_02 → battle_kuruma → reward_magatama_3
  → shuten_intro → shuten_intro_02 → shuten_intro_03 → battle_shuten → reward_magatama_4
  → final_choice → final_choice_02 → final_choice_03 → final_choice_monologue → choice_node
  ├─[儀式を完遂させる（撫子を送り出す）]→ end_sacrifice_intro → leave_nadeshiko → end_sacrifice
  └─[因習を打ち砕く（撫子を救う）]→ end_save_intro → leave_nadeshiko → end_save
  (各バトル敗北時) → end_failure
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_spot_yato_eclipse, bgm: bgm_yato
```text
夜刀神国の天を覆う空が、赤黒く染まり始める。まるで血のように妖しく輝く月が昇る、百年に一度の災厄「冥食」が訪れたのだ。
```

#### `start_02`（text）
**演出:** bg: bg_spot_yato_eclipse
```text
ざわつく里の広場で、隠れ里の長老が長い白髪を夜風になびかせ、重苦しい表情であなたに近づいてきた。
```

#### `start_03`（text）
**演出:** bg: bg_spot_yato_eclipse, speaker: 隠れ里の長老
```text
「異界とこちらを繋ぐ『冥の門』が開こうとしておる。門を完全に封じ、この国に太陽を取り戻すには、尊き贄が必要じゃ」
```

#### `start_04`（text）
**演出:** bg: bg_spot_yato_eclipse, speaker: 隠れ里の長老
```text
「宿命の子として育てられた『撫子』を、門の最深部にある儀式の壇まで連れて行ってくれ。それが我ら里の、そしてお主の任務じゃ」
```

#### `join_nadeshiko`（guest_join）
**演出:** bg: bg_spot_yato_eclipse
```text
里の裏手の鬱蒼とした森。白い神聖な装束に身を包み、幼さの残る面持ちの少女が、静かにあなたの到着を待っていた。
```
**パラメータ:** guest_id: npc_nadeshiko, next: join_nadeshiko_02

#### `join_nadeshiko_02`（text）
**演出:** bg: bg_spot_yato_eclipse, speaker: 撫子
```text
「……撫子と申します。冥の門の最深部まで、お供をさせていただきます」
```

#### `join_nadeshiko_03`（text）
**演出:** bg: bg_spot_yato_eclipse, speaker: 撫子
```text
「大丈夫です。贄としての覚悟は……里の皆を守るための決意は、とうにできていますから。行きましょう」
```

#### `join_monologue`（text）
**演出:** bg: bg_spot_yato_eclipse
```text
（覚悟はできている、か。こんな幼い少女にそこまで背負わせる理不尽な因習が、本当に正しいというのだろうか……）
```

#### `spider1_intro`（text）
**演出:** bg: bg_spot_yato_entrance, bgm: bgm_battle_strong
```text
薄暗く不気味な妖気が渦巻く「冥の門」の入口。生暖かい風が吹き抜けた瞬間、天井から巨大な鬼蜘蛛が糸を垂らして降りてきた。
```

#### `battle_spider_1`（battle）
**演出:** bg: bg_spot_yato_entrance, bgm: bgm_battle_strong
**パラメータ:** enemy_group_id: 310, next: spider2_intro, fail: end_failure

#### `spider2_intro`（text）
**演出:** bg: bg_spot_yato_entrance
```text
一匹目の残骸を越えて暗い岩道を進むと、壁や天井の至る所がざわざわと波打つように蠢き出し、さらなる群れが現れた。
```

#### `battle_spider_2`（battle）
**演出:** bg: bg_spot_yato_entrance, bgm: bgm_battle_strong
**パラメータ:** enemy_group_id: 311, next: spider3_intro, fail: end_failure

#### `spider3_intro`（text）
**演出:** bg: bg_spot_yato_entrance
```text
倒しても倒しても、壁の無数の隙間から、赤い瞳を光らせた蜘蛛の群れが次々と這い出だして行く手を塞ぐ。
```

#### `battle_spider_3`（battle）
**演出:** bg: bg_spot_yato_entrance, bgm: bgm_battle_strong
**パラメータ:** enemy_group_id: 312, next: spider4_intro, fail: end_failure

#### `spider4_intro`（text）
**演出:** bg: bg_spot_yato_entrance
```text
ようやく群れを突破しかけたその時、ひときわ巨大で硬質な外殻を持った、蜘蛛たちの主のような個体が立ちはだかる。
```

#### `battle_spider_4`（battle）
**演出:** bg: bg_spot_yato_entrance, bgm: bgm_battle_strong
**パラメータ:** enemy_group_id: 313, next: wani_intro, fail: end_failure

#### `spider_clear_monologue`（text）
**演出:** bg: bg_spot_yato_entrance
```text
（ふう、さすがにこれだけ群れが続くと骨が折れる。だが、撫子は怯えながらも、じっと私の背中を信じてついてきてくれているな）
```

#### `wani_intro`（text）
**演出:** bg: bg_spot_yato_entrance
```text
粘着質な蜘蛛の巣を切り払い奥へ進むと、暗闇のなかに広大な地下の濁った水場が広がっているのが見えた。
```

#### `wani_intro_02`（text）
**演出:** bg: bg_spot_yato_entrance
```text
水面が突如激しく波立ち、硬質な甲羅と鋭い牙を剥き出しにした巨大な魔獣「大鰐」が唸りを上げて浮上する。
```

#### `battle_wani`（battle）
**演出:** bg: bg_spot_yato_entrance, bgm: bgm_battle_strong
**パラメータ:** enemy_group_id: 314, next: reward_magatama_1, fail: end_failure

#### `reward_magatama_1`（reward）
**演出:** bg: bg_spot_yato_entrance
```text
大鰐が水底深くへと沈んでいくと、その水面から赤い光が浮かび上がる。あなたは儀式に必要な朱色の勾玉を手に入れた。
```
**パラメータ:** item_id: 611, next: tori_intro

#### `tori_intro`（text）
**演出:** bg: bg_spot_yato_entrance, bgm: bgm_battle_strong
```text
湿った水場を越えると、天井からかすかに地上の赤月光が差し込む、広大な吹き抜けの大空洞に差し掛かった。
```

#### `tori_intro_02`（text）
**演出:** bg: bg_spot_yato_entrance
```text
空洞の天井近くから、鋭い鳴き声と共に、凶鳥「以津真天」が撫子の小さな体を狙って急降下してきた。
```

#### `battle_tori`（battle）
**演出:** bg: bg_spot_yato_entrance, bgm: bgm_battle_strong
**パラメータ:** enemy_group_id: 315, next: reward_magatama_2, fail: end_failure

#### `reward_magatama_2`（reward）
**演出:** bg: bg_spot_yato_entrance
```text
凶鳥が羽毛を散らして撃ち落とされると、その後に青く冷たい光が残された。あなたは蒼の勾玉を手に入れた。
```
**パラメータ:** item_id: 612, next: kuruma_intro

#### `kuruma_intro`（text）
**演出:** bg: bg_spot_yato_entrance, bgm: bgm_battle_strong
```text
狭い通路の先から、激しい轟音と共に地を穿ち、怨念の炎を身に纏った巨大な妖怪「朧車」が突進してくる。
```

#### `kuruma_intro_02`（text）
**演出:** bg: bg_spot_yato_entrance, speaker: 撫子
```text
「気をつけてください！ あれをまともに受ければひとたまりもありません！ 壊すしかありません！」
```

#### `battle_kuruma`（battle）
**演出:** bg: bg_spot_yato_entrance, bgm: bgm_battle_strong
**パラメータ:** enemy_group_id: 316, next: reward_magatama_3, fail: end_failure

#### `reward_magatama_3`（reward）
**演出:** bg: bg_spot_yato_entrance
```text
朧車が激しい破砕音と共に粉々に砕け散り、その破片から翠色の光がこぼれ出た。あなたは翠の勾玉を手に入れた。
```
**パラメータ:** item_id: 613, next: shuten_intro

#### `shuten_intro`（text）
**演出:** bg: bg_spot_yato_gate, bgm: bgm_spot_final_boss
```text
いよいよ冥の門の最奥。古びた朱塗りの扉の前に、巨大な大盃を傍らに置き、角を持つ一人の男が不敵に座していた。
```

#### `shuten_intro_02`（text）
**演出:** bg: bg_spot_yato_gate, speaker: 酒呑童子
```text
「ハハッ、やっと少しは骨のある奴が来たか。贄の娘を連れて、この俺を楽しませてみせろ！」
```

#### `shuten_intro_03`（text）
**演出:** bg: bg_spot_yato_gate
```text
伝説の鬼がゆっくりと立ち上がる。その全身から、息が詰まるほどの圧倒的な闘気が放たれた。
```

#### `battle_shuten`（battle）
**演出:** bg: bg_spot_yato_gate, bgm: bgm_spot_final_boss
**パラメータ:** enemy_group_id: 317, next: reward_magatama_4, fail: end_failure

#### `reward_magatama_4`（reward）
**演出:** bg: bg_spot_yato_gate
```text
酒呑童子が「満足したぞ……」と笑いながら闇に消え去ると、黄金色に輝く黄の勾玉が床に残された。
```
**パラメータ:** item_id: 614, next: final_choice

#### `final_choice`（text）
**演出:** bg: bg_spot_yato_gate, bgm: bgm_spot_final_choice
```text
四つの勾玉が共鳴して強烈な光を放つと、前方に立ち塞がっていた朱塗りの巨大な扉が、重苦しい音を立ててゆっくりと開き始める。
```

#### `final_choice_02`（text）
**演出:** bg: bg_spot_yato_gate, speaker: 撫子
```text
「……開きましたね。ここから先は、私一人で行きます。これが私の、宿命の子としてのお役目ですから」
```

#### `final_choice_03`（text）
**演出:** bg: bg_spot_yato_gate, speaker: 撫子
```text
「短い間でしたけれど、あなたに会えて本当によかった。私をここまで守ってくれて、ありがとうございました」
```

#### `final_choice_monologue`（text）
**演出:** bg: bg_spot_yato_gate
```text
（少女の背中が、重い扉の向こうの闇へと歩み出そうとしている。このまま静かに送り出して里を救うのが、本当に冒険者としての正義なのか……？）
```

#### `choice_node`（choice）
**演出:** bg: bg_spot_yato_gate, bgm: bgm_spot_final_choice
```text
門へと進む撫子を見送るか、それともその手を掴むか。あなたは決断を迫られる。
```
| 選択肢 | next_node |
|---|---|
| 儀式を完遂させる（撫子を送り出す） | `end_sacrifice_intro` |
| 因習を打ち砕く（撫子を救う） | `end_save_intro` |

#### `end_sacrifice_intro`（text）
**演出:** bg: bg_spot_yato_gate, bgm: bgm_quest_calm
```text
あなたは拳を握りしめ、静かに彼女の背中を見送った。撫子の白い装束は、門の向こうの底知れぬ闇の中へと吸い込まれるように消え去った。
```

#### `leave_nadeshiko`（leave）
**演出:** bg: bg_spot_yato_gate
```text
撫子がパーティから離脱した。
```
**パラメータ:** guest_id: npc_nadeshiko, next: end_sacrifice

#### `end_sacrifice`（end_success）
**演出:** bg: bg_spot_yato_gate
```text
重厚な朱塗りの扉が閉まり、空には赤月が消えて平穏な太陽の光が戻った。里は救われ、長老からは感謝と共に『冥界の護符』が贈られた。しかし、あなたの心には消えない翳りが残された。
```
**rewards:** Exp:500, Gold:10000, Rep:200, Item:615, Order:5

#### `end_save_intro`（text）
**演出:** bg: bg_spot_yato_gate, bgm: bgm_quest_calm
```text
あなたは門に足を踏み入れようとした撫子の手を強く掴み、引き戻した。そして、手にした武器を振るい、開いた門の結界を強引に破壊した。
```

#### `end_save`（end_success）
**演出:** bg: bg_spot_yato_gate
```text
「え……？ あ、ああっ……」と撫子は驚き、あなたの胸で声を上げて泣いた。門は閉ざされ、国は太陽を失う危機に直面するが、あなたは一人の少女の命を救い、固有スキル『冥食の理』を手に入れた！
```
**rewards:** Exp:500, Rep:-100, Item:616, Order:5

#### `end_failure`（end_failure）
**演出:** bg: bg_spot_yato_entrance
```text
奈落の闇の中に倒れ伏す。周囲を取り囲む妖怪たちの嘲笑が遠のいていく中、必死にあなたの名前を呼ぶ撫子の泣き声に応える力は、もう残されていなかった。
```
**rewards:** Gold:0
