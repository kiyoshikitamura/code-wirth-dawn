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
| **出現条件** | メインep09クリア / 夜刀拠点滞在 / 正義(Justice)50%以上 |
| **リピート** | 現世代で1回（継承後は再出現） |
| **難易度Tier** | Hard（rec_level: 20） |
| **経過日数 (time_cost)** | 7（成功: 7日 / 失敗: 5日） |
| **ゲストNPC** | 撫子（護衛対象としてパーティ加入 / クエスト終了後に離脱） |
| **護衛失敗条件** | 撫子のHPがバトル中に0になった場合、クエスト失敗（`end_failure`）に遷移 |
| **サムネイル画像** | `/images/quests/bg_spot_yato_eclipse.png` |

> [!IMPORTANT]
> **護衛ミッション仕様**: `guest_join` ノードの `is_escort_target: true` により護衛モードが有効化される。
> バトル勝利後にゲストNPCのHP（durability）が0以下の場合、勝利判定を上書きし `end_failure` ノードへ遷移する。

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

**ルートB（撫子救出ルート）— endノードparamsで付与:**
```
Exp:500|Rep:-100|Item:616|Align:正義+100
```

### 報酬アイテム詳細

| ID | Slug | 名前 | Type | 効果 | 入手 |
|---|---|---|---|---|---|
| 611 | `spot_magatama_1` | 朱の勾玉 | passive | HP+3 | 道中(boss_01勝利後) |
| 612 | `spot_magatama_2` | 蒼の勾玉 | passive | DEF+2 | 道中(boss_02勝利後) |
| 613 | `spot_magatama_3` | 翠の勾玉 | passive | ATK+2 | 道中(boss_03勝利後) |
| 614 | `spot_magatama_4` | 黄の勾玉 | passive | HP+5 | 道中(boss_04勝利後) |
| 615 | `spot_yato_talisman` | 冥界の護符 | equipment/accessory | ATK+8, DEF+8, HP+8 | ルートA |
| 616 | `spot_luna_eclips` | 冥食の理 | skill(card) | dmg25+呪い(3T), deck_cost:4 | ルートB |

---

## 3. シナリオノード構成

### 全体フロー
```text
start
  └─[続ける]→ start_2
       └─[続ける]→ join_nadeshiko
            └─[続ける]→ join_nadeshiko_2
                 └─[続ける]→ battle_1
                      ├─[勝利]→ text_after_b1
                      │    └─[続ける]→ text_after_b1_2
                      │         └─[続ける]→ battle_2
                      │              ├─[勝利]→ boss_01_wani_pre
                      │              │    └─[続ける]→ boss_01_wani
                      │              │         ├─[勝利]→ reward_m1
                      │              │         │    └─[続ける]→ boss_02_tori_pre
                      │              │         │         └─[続ける]→ boss_02_tori
                      │              │         │              ├─[勝利]→ reward_m2
                      │              │         │              │    └─[続ける]→ reward_m2_2
                      │              │         │              │         └─[続ける]→ boss_03_kuruma_pre
                      │              │         │              │              └─[続ける]→ boss_03_kuruma
                      │              │         │              │                   ├─[勝利]→ reward_m3
                      │              │         │              │                   │    └─[続ける]→ boss_04_shuten_pre
                      │              │         │              │                   │         └─[続ける]→ boss_04_shuten_pre_2
                      │              │         │              │                   │              └─[続ける]→ boss_04_shuten
                      │              │         │              │                   │                   ├─[勝利]→ reward_m4
                      │              │         │              │                   │                   │    └─[続ける]→ final_choice
                      │              │         │              │                   │                   │         ├─[完遂する]→ end_sacrifice
                      │              │         │              │                   │                   │         │    └─[続ける]→ end_sacrifice_2
                      │              │         │              │                   │                   │         └─[拒絶する]→ end_save
                      │              │         │              │                   │                   │              └─[続ける]→ end_save_2
                      │              │         │              │                   │                   └─[敗北]→ end_failure
                      │              │         │              │                   └─[敗北]→ end_failure
                      │              │         │              └─[敗北]→ end_failure
                      │              │         └─[敗北]→ end_failure
                      │              └─[敗北]→ end_failure
                      └─[敗北]→ end_failure
```

### ノード詳細

#### `start`（type: text）
**テキスト:**
```
空が赤黒く染まった。太陽が消え、代わりに血のような月が昇る。
百年に一度の「冥食」だ。

隠れ里の長老が杖を突きながら近づいてきた。
白髪が風になびく。目は濁っているが、声は澄んでいた。
```
**params:** `{"type":"text", "speaker":"長老", "bgm":"bgm_yato", "bg":"bg_spot_yato_eclipse"}`

---

#### `start_2`（type: text）
**テキスト:**
```
「異界の門が開き始めておる。このまま放置すれば、冥の者どもがこの地を呑み込む。
　……儀式を行うしかない。
　門を封じるには、宿命の子を贄として捧げねばならん」

長老は深く頭を下げた。
```
**params:** `{"type":"text", "speaker":"長老", "bgm":"bgm_yato", "bg":"bg_spot_yato_eclipse"}`

---

#### `join_nadeshiko`（type: text）
**テキスト:**
```
「撫子を——あの子を、門の最深部まで連れていってくれ」

遠くから、祭太鼓の音が低く響いている。
里の裏手。白い装束に身を包んだ少女が、静かに待っていた。
```
**params:** `{"type":"text", "speaker":"長老", "bgm":"bgm_yato", "bg":"bg_spot_yato_eclipse"}`

---

#### `join_nadeshiko_2`（type: guest_join）
**テキスト:**
```
黒い髪に白い花飾り。年は十五、六だろうか。
少女はこちらに気づくと、小さく頭を下げた。だが、その唇は微かに震えていた。

「……撫子と申します。門まで、お供させてください。
　私のことは気にしないでください。覚悟は……とうにできています」
```
**params:** `{"type":"guest_join", "speaker":"撫子", "bg":"bg_spot_yato_eclipse", "guest_id":"npc_nadeshiko", "is_escort_target":true}`

---

#### `battle_1`（type: battle）
**テキスト:**
```
冥の門の入口。鳥居の朱塗りが黒ずんで剥がれ落ちている。
門をくぐった瞬間、青白い炎が宙を舞い、一本足の唐傘が不気味に跳ねながら迫ってきた。

「……来ます。冥府から漏れ出た者たちです」
```
**params:** `{"type":"battle", "speaker":"撫子", "bgm":"bgm_battle_strong", "bg":"bg_spot_yato_entrance", "enemy_group_id":"310"}`

---

#### `text_after_b1`（type: text）
**テキスト:**
```
妖怪たちを退け、奥へ進む。
撫子が袖で埃を払いながら、ぽつりと呟いた。

「……この門の中には、百年分の怨念が溜まっているそうです。
　先ほどの妖怪たちは、その怨念を食べて育ったのだと、長老が」
```
**params:** `{"type":"text", "speaker":"撫子", "bg":"bg_spot_yato_entrance"}`

---

#### `text_after_b1_2`（type: text）
**テキスト:**
```
その声には、隠しきれない恐れが滲んでいた。

「大丈夫です……進みましょう」
```
**params:** `{"type":"text", "speaker":"撫子", "bg":"bg_spot_yato_entrance"}`

---

#### `battle_2`（type: battle）
**テキスト:**
```
さらに奥へ進むと、突如として突風が吹き荒れた。
風の中から、カラスの羽を持った天狗が姿を現す。背後には無数の鬼火が付き従っている。

撫子が杖代わりの錫杖を強く握りしめた。
「これを越えれば……四大妖怪がいます」
```
**params:** `{"type":"battle", "speaker":"撫子", "bgm":"bgm_battle_strong", "bg":"bg_spot_yato_entrance", "enemy_group_id":"313"}`

---

#### `boss_01_wani_pre`（type: text）
**テキスト:**
```
妖怪の群れを抜けると、地下に広大な水場が広がっていた。
腐った水の匂い。水面が揺れている。何かが潜んでいる。

水面が割れた。甲羅を纏った巨大な鰐が、顎を開いて浮上する。
```
**params:** `{"type":"text", "bgm":"bgm_battle_strong", "bg":"bg_spot_yato_entrance"}`

---

#### `boss_01_wani`（type: battle）
**テキスト:**
```
「水底の覇者」大鰐。百年の間、冥の水を飲み続けて異形に育った古の妖怪だ。

「……あの大きさは、聞いていた話と違います。
　気をつけてください。水に引き込まれたら、終わりです」
```
**params:** `{"type":"battle", "speaker":"撫子", "bgm":"bgm_battle_strong", "bg":"bg_spot_yato_entrance", "enemy_group_id":"314"}`

---

#### `reward_m1`（type: reward）
**テキスト:**
```
大鰐が沈んだ。水面に赤い光が浮かび上がる。
撫子が水際に膝をつき、光を掬い上げた。朱色の勾玉だ。温かい。

「四大妖怪を討つたびに、門を開く鍵が現れるそうです。
　……あと三体」
```
**params:** `{"type":"reward", "speaker":"撫子", "bg":"bg_spot_yato_entrance", "items":["611"]}`

---

#### `boss_02_tori_pre`（type: text）
**テキスト:**
```
水場を越えると、吹き抜けの大空洞に出た。
空が翳った。巨大な翼が光を遮ったのだ。

漆黒の鳥が旋回している。「以津真天」。死の前兆を告げる凶鳥。
```
**params:** `{"type":"text", "bgm":"bgm_battle_strong", "bg":"bg_spot_yato_entrance"}`

---

#### `boss_02_tori`（type: battle）
**テキスト:**
```
鳥が急降下してきた。狙いは撫子だ。

「——伏せて！」
```
**params:** `{"type":"battle", "speaker":"撫子", "bgm":"bgm_battle_strong", "bg":"bg_spot_yato_entrance", "enemy_group_id":"315"}`

---

#### `reward_m2`（type: reward）
**テキスト:**
```
凶鳥が断末魔の鳴き声を上げて堕ちた。
蒼い光が残された。撫子が羽根を払いながら勾玉を拾い上げる。

「……ありがとうございます。助けていただいて。
　残り——あと二体です」
```
**params:** `{"type":"reward", "speaker":"撫子", "bg":"bg_spot_yato_entrance", "items":["612"]}`

---

#### `reward_m2_2`（type: text）
**テキスト:**
```
私を守ってくれる貴方の背中が、とても大きく見えます、と彼女は微かに微笑んだ。

蒼の勾玉を手に入れた！
```
**params:** `{"type":"text", "bg":"bg_spot_yato_entrance"}`

---

#### `boss_03_kuruma_pre`（type: text）
**テキスト:**
```
暗闇の中に、車輪の転がる音が響き始めた。
ゴロゴロ、ゴロゴロ。
音は壁を反響し、どこから来るのか分からない。

不意に、巨大な牛車が炎を纏って突っ込んできた。
```
**params:** `{"type":"text", "bgm":"bgm_battle_strong", "bg":"bg_spot_yato_entrance"}`

---

#### `boss_03_kuruma`（type: battle）
**テキスト:**
```
炎の車輪の中央には、怨嗟に歪む巨大な顔がある。「朧車」。

「熱い……！
　下がってください、火の粉が！」
```
**params:** `{"type":"battle", "speaker":"撫子", "bgm":"bgm_battle_strong", "bg":"bg_spot_yato_entrance", "enemy_group_id":"316"}`

---

#### `reward_m3`（type: reward）
**テキスト:**
```
炎が消え、車輪が崩れ落ちた。
灰の中から、翠の勾玉が現れる。

「……あと、一体。
　これを越えれば、儀式の間です」
```
**params:** `{"type":"reward", "speaker":"撫子", "bg":"bg_spot_yato_entrance", "items":["613"]}`

---

#### `boss_04_shuten_pre`（type: text）
**テキスト:**
```
門の最奥。朱塗りの巨大な扉の前に、男が一人、座っていた。
巨大な瓢箪を片手に、退屈そうに酒を煽っている。

「……遅かったな。待ちくたびれたぜ」
```
**params:** `{"type":"text", "speaker":"酒呑童子", "bgm":"bgm_spot_final_boss", "bg":"bg_spot_yato_gate"}`

---

#### `boss_04_shuten_pre_2`（type: text）
**テキスト:**
```
男が立ち上がると、その背に生えた巨大な角が闇に浮かび上がった。
「酒呑童子」。四大妖怪の筆頭にして、この門の守護者。

「生贄のガキと、その護衛か。
　ご苦労なこって。だが、ここを通すわけにはいかねぇな」
```
**params:** `{"type":"text", "speaker":"酒呑童子", "bgm":"bgm_spot_final_boss", "bg":"bg_spot_yato_gate"}`

---

#### `boss_04_shuten`（type: battle）
**テキスト:**
```
強大な妖気が、肌を刺すようにビリビリと伝わってくる。

「……これが、最後の試練。
　お願いします、どうか私を……あの門まで！」
```
**params:** `{"type":"battle", "speaker":"撫子", "bgm":"bg_spot_final_boss", "bg":"bg_spot_yato_gate", "enemy_group_id":"317"}`

---

#### `reward_m4`（type: reward）
**テキスト:**
```
酒呑童子が膝をついた。
「……へっ、悪くねえ腕だ。
　いいだろう、通れ。どうせここから先は、俺たち妖怪の手に負える場所じゃねえ」
```
**params:** `{"type":"reward", "speaker":"酒呑童子", "bg":"bg_spot_yato_gate", "items":["614"]}`

---

#### `final_choice`（type: text）
**テキスト:**
```
男が姿を消すと同時に、朱塗りの扉が重い音を立てて重厚に開いた。
扉の奥には、漆黒の虚無が広がっている。全てを呑み込む「冥の底」だ。

撫子が、ゆっくりと扉へと歩み寄る。
「……ここで、お別れです」
```
**params:** `{"type":"text", "speaker":"撫子", "bg":"bg_spot_yato_gate"}`

---

**選択肢（`final_choice`）:**
1. **[完遂する]** 儀式を見届ける → `end_sacrifice`
2. **[拒絶する]** 彼女の手を掴む → `end_save`

---

#### `end_sacrifice`（type: text）
**テキスト:**
```
黙って頷いた。
撫子は微かに微笑むと、深々と一礼した。

「……私の短い命に、意味を与えてくれてありがとうございました」
```
**params:** `{"type":"text", "speaker":"撫子", "bg":"bg_spot_yato_gate"}`

---

#### `end_sacrifice_2`（type: end_success）
**テキスト:**
```
彼女は躊躇うことなく、虚無の闇へとその身を投じた。
瞬時に扉が閉まり、空を覆っていた赤黒い月が嘘のように晴れていく。

冥の門は封じられた。一人の少女の命と引き換えに。
```
**params:** `{"type":"end_success", "bg":"bg_spot_yato_gate", "rewards":{"exp":500, "gold":10000, "reputation":200, "items":["615"]}}`

---

#### `end_save`（type: text）
**テキスト:**
```
——ふざけるな。
反射的に手を伸ばし、彼女の細い腕を強く掴んで引き戻した。

「……！？ なにを……放してください！
　私が往かねば、国が——！」
```
**params:** `{"type":"text", "speaker":"撫子", "bg":"bg_spot_yato_gate"}`

---

#### `end_save_2`（type: end_success）
**テキスト:**
```
「誰かの犠牲で成り立つ世界など、知るものか」
無理矢理に扉を閉ざし、力尽ずくで封印の札を叩きつけた。

代償は計り知れないだろう。だが、少女は生きて隣にいる。
冥食の理は崩れた。新たなる道を探すしかない。
```
**params:** `{"type":"end_success", "bg":"bg_spot_yato_gate", "rewards":{"exp":500, "reputation":-100, "skills":["616"], "alignment_shift":{"justice":100}}}`

---

#### `end_failure`（type: end_failure）
**テキスト:**
```
闇の中に倒れた。妖怪の咆哮が遠くなっていく。

最後に聞こえたのは、撫子の声だった。
「——立ってください。お願い、立って……」

応えられなかった。
```
**params:** `{"type":"end_failure", "bg":"bg_spot_yato_gate", "result":"failure"}`
