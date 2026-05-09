# クエスト仕様書：6103 — 天を衝く塔 ―華龍の秘宝と、神の遊戯―

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6103 |
| **Slug** | `qst_spot_karyu` |
| **クエスト種別** | スポットシナリオ（Special） |
| **推奨レベル** | 20（Hard） |
| **難度** | 5 |
| **依頼主** | 天命の使者 |
| **出現条件** | メインep12クリア / 華龍拠点滞在 / 悪(Evil)50%以上 |
| **リピート** | 現世代で1回（継承後は再出現） |
| **難易度Tier** | Hard（rec_level: 20） |
| **経過日数 (time_cost)** | 7（成功: 7日 / 失敗: 5日） |
| **サムネイル画像** | `/images/quests/bg_spot_karyu_tower.png` |

※BGM、SE、進行中の背景画像などはノードごとに指定します。

---

## 1. クエスト概要

### 短文説明
```
世界の中心「虚無の塔」。華龍の四方に座す四神を討ち、神の残酷な遊戯を終わらせよ。
```

### 長文説明
```
塔の頂上には願いを叶える楽園があるとされる。
しかし、神の結界により近づく事はできない。解くためには四神討伐が必要だ。
すべては、高みで退屈を貪る「神」が仕掛けた遊戯であった。
```

---

## 2. 報酬定義

**ルートA（神の座を継ぐルート）CSV記載形式:**
```
Exp:500|Gold:10000|Rep:200|Item:625
```

**ルートB（塔を破壊するルート）— endノードparamsで付与:**
```
Exp:500|Rep:-100|Item:626|Align:悪+100
```

### 報酬アイテム詳細

| ID | Slug | 名前 | Type | 効果 | 入手 |
|---|---|---|---|---|---|
| 621 | `spot_orb_seiryu` | 青龍の宝珠 | passive | ATK+3 | 道中(青龍撃破後) |
| 622 | `spot_orb_byakko` | 白虎の宝珠 | passive | DEF+3 | 道中(白虎撃破後) |
| 623 | `spot_orb_suzaku` | 朱雀の宝珠 | passive | HP+5 | 道中(朱雀撃破後) |
| 624 | `spot_orb_genbu` | 玄武の宝珠 | passive | DEF+2, HP+3 | 道中(玄武撃破後) |
| 625 | `spot_divine_glaive` | 天道の薙刀 | equipment/weapon | ATK+15, DEF+10 | ルートA |
| 626 | `spot_deus_machina` | 神殺しの光芒 | skill(card) | dmg50+自傷10%, deck_cost:5 | ルートB |

---

## 3. シナリオノード構成

### 全体フロー
```text
start
  └─[続ける]→ start_2
       └─[続ける]→ choose_path
            ├─[東の青龍]→ check_done_seiryu
            │    ├─[宝珠所持(撃破済)]→ already_done_seiryu → choose_path
            │    └─[未所持(未撃破)]→ trap_seiryu → boss_seiryu_pre1... → boss_seiryu → reward_orb_1 → choose_path
            ├─[西の白虎]→ check_done_byakko
            │    ├─[宝珠所持(撃破済)]→ already_done_byakko → choose_path
            │    └─[未所持(未撃破)]→ trap_byakko → boss_byakko_pre1... → boss_byakko → reward_orb_2 → choose_path
            ├─[南の朱雀]→ check_done_suzaku
            │    ├─[宝珠所持(撃破済)]→ already_done_suzaku → choose_path
            │    └─[未所持(未撃破)]→ trap_suzaku → boss_suzaku_pre1... → boss_suzaku → reward_orb_3 → choose_path
            ├─[北の玄武]→ check_done_genbu
            │    ├─[宝珠所持(撃破済)]→ already_done_genbu → choose_path
            │    └─[未所持(未撃破)]→ trap_genbu → boss_genbu_pre1... → boss_genbu → reward_orb_4 → choose_path
            └─[中央の塔へ]→ check_orb_seiryu
                 ├─[所持]→ check_orb_byakko
                 │    ├─[所持]→ check_orb_suzaku
                 │    │    ├─[所持]→ check_orb_genbu
                 │    │    │    ├─[所持]→ final_boss_kami_pre1
                 │    │    │    └─[未所持]→ missing_orbs → choose_path
                 │    │    └─[未所持]→ missing_orbs
                 │    └─[未所持]→ missing_orbs
                 └─[未所持]→ missing_orbs
                 
final_boss_kami_pre1... → final_boss_kami
  ├─[勝利]→ final_choice_1
  │    ├─[神の座を継ぐ]→ end_rule_1 → end_rule_2 → end_rule
  │    └─[塔を破壊する]→ end_destroy_1 → end_destroy_2 → end_destroy_3 → end_destroy
  └─[敗北]→ end_failure_pre1 → end_failure_pre2 → end_failure
```

### ノード詳細

#### `start`（type: text）
- **BGM**: `bgm_karyu` / **背景**: `bg_spot_karyu_tower`

**テキスト:**
```
華龍の都の外れ。
雲を突く巨塔が聳えている。
誰が建てたのか、誰も知らない。

道端に老人が座っていた。
目を閉じたまま、茶を啜っている。
「塔を目指すのか。何人目だろうな」
```
**params:** `{"type":"text", "bgm":"bgm_karyu", "bg":"bg_spot_karyu_tower"}`

#### `start_2`（type: text）
- **BGM**: `bgm_karyu` / **背景**: `bg_spot_karyu_tower`

**テキスト:**
```
「四方に四神がおる。青龍、白虎、朱雀、玄武。
　全て倒さねば、塔には入れん。
　……すべては、上にいる『あれ』の遊びだよ」

老人はそう言って、闇に消えた。
```
**params:** `{"type":"text", "bgm":"bgm_karyu", "bg":"bg_spot_karyu_tower"}`

---

#### `choose_path`（type: text）
- **BGM**: `bgm_quest_mystery` / **背景**: `bg_spot_karyu_tower`

**テキスト:**
```
塔の足元。四方に道が伸びている。
どの試練から挑むか。
```
**選択肢:**
| ラベル | 次ノード | 備考 |
|--------|---------|------|
| 東の青龍 | `check_done_seiryu` | 撃破済みチェックを挟む |
| 西の白虎 | `check_done_byakko` | 撃破済みチェックを挟む |
| 南の朱雀 | `check_done_suzaku` | 撃破済みチェックを挟む |
| 北の玄武 | `check_done_genbu` | 撃破済みチェックを挟む |
| 中央の塔へ進む | `check_orb_seiryu` | |

---

### 【撃破済みチェックノード】

各四神ルートの選択肢から直接トラップに入る前に、対応する宝珠を既に所持しているかチェックする。所持していれば「既に倒した」テキストを表示して `choose_path` に戻す。

#### `check_done_seiryu`（type: check_possession）
**params:** `{"type":"check_possession", "item_id":"621", "quantity":1}`
- 所持 → `already_done_seiryu` / 未所持 → `trap_seiryu`

#### `already_done_seiryu`（type: text）
- **背景**: `bg_spot_karyu_tower`

**テキスト:**
```
東の方角から、もう力の気配はしない。
青龍は既に討ち果たした。
```
※次ノード: `choose_path`

#### `check_done_byakko`（type: check_possession）
**params:** `{"type":"check_possession", "item_id":"622", "quantity":1}`
- 所持 → `already_done_byakko` / 未所持 → `trap_byakko`

#### `already_done_byakko`（type: text）
- **背景**: `bg_spot_karyu_tower`

**テキスト:**
```
西の方角から、もう力の気配はしない。
白虎は既に討ち果たした。
```
※次ノード: `choose_path`

#### `check_done_suzaku`（type: check_possession）
**params:** `{"type":"check_possession", "item_id":"623", "quantity":1}`
- 所持 → `already_done_suzaku` / 未所持 → `trap_suzaku`

#### `already_done_suzaku`（type: text）
- **背景**: `bg_spot_karyu_tower`

**テキスト:**
```
南の方角から、もう力の気配はしない。
朱雀は既に討ち果たした。
```
※次ノード: `choose_path`

#### `check_done_genbu`（type: check_possession）
**params:** `{"type":"check_possession", "item_id":"624", "quantity":1}`
- 所持 → `already_done_genbu` / 未所持 → `trap_genbu`

#### `already_done_genbu`（type: text）
- **背景**: `bg_spot_karyu_tower`

**テキスト:**
```
北の方角から、もう力の気配はしない。
玄武は既に討ち果たした。
```
※次ノード: `choose_path`

---

### 【東の青龍ルート】

#### `trap_seiryu`（type: modify_state）
- **背景**: `bg_spot_karyu_thunder`

**テキスト:**
```
東の道を進むと、空が暗転した。
足元に落雷。衝撃が体を打つ。

「——来たか。遊び相手が」
```
**params:** `{"type":"modify_state", "bg":"bg_spot_karyu_thunder", "hp_percent":-20}`

#### `boss_seiryu_pre1`（type: text）
- **BGM**: `bgm_battle_strong` / **背景**: `bg_spot_karyu_thunder`

**テキスト:**
```
雷雲の中から、蒼い鱗の巨龍が姿を現した。

「我は青龍。東方の守護者なり。
　千年、この地で番をしておる」
```

#### `boss_seiryu_pre2`（type: text）
- **背景**: `bg_spot_karyu_thunder`

**テキスト:**
```
黄金の瞳がこちらを見下ろす。

「あの方の命でここを守っているが、
　正直に言えば、退屈なのだ。
　お前たちで、少しは暇が潰せるか？」
```

#### `boss_seiryu_pre3`（type: text）
- **背景**: `bg_spot_karyu_thunder`

**テキスト:**
```
空を裂くような稲妻が走った。

「手は抜かぬ。それが務めというものだ。
　——さあ、来い。我を楽しませてみせよ！」
```

#### `boss_seiryu`（type: battle）
- **BGM**: `bgm_battle_strong` / **背景**: `bg_spot_karyu_thunder`

**テキスト:**
```
青龍が咆哮を上げ、雷電と共に襲いかかってきた！
```
**params:** `{"type":"battle", "bgm":"bgm_battle_strong", "bg":"bg_spot_karyu_thunder", "enemy_group_id":"spot_karyu_seiryu", "battle_success_next":"reward_orb_1"}`

#### `reward_orb_1`（type: reward）
- **背景**: `bg_spot_karyu_thunder`

**テキスト:**
```
「……見事。千年ぶりに、膝をついたぞ。
　あの方に伝えてくれ。
　もう退屈は嫌だ、と」

青龍の宝珠を手に入れた！
```
**params:** `{"type":"reward", "bg":"bg_spot_karyu_thunder", "items":["621"]}`
※次ノード: `choose_path`

---

### 【西の白虎ルート】

#### `trap_byakko`（type: modify_state）
- **背景**: `bg_spot_karyu_snow`

**テキスト:**
```
西の道に踏み出した途端、猛吹雪が吹き荒れる。
体温が奪われ、手足の感覚が鈍くなっていく。

風の中に、獣の唸り声が混じっている。
```
**params:** `{"type":"modify_state", "bg":"bg_spot_karyu_snow", "hp_percent":-20}`

#### `boss_byakko_pre1`（type: text）
- **BGM**: `bgm_battle_strong` / **背景**: `bg_spot_karyu_snow`

**テキスト:**
```
吹雪の隙間に、白銀の獣が見えた。
肩の高さだけで馬ほどある巨大な白虎だ。

「……言葉は要らぬ」
```

#### `boss_byakko_pre2`（type: text）
- **背景**: `bg_spot_karyu_snow`

**テキスト:**
```
「我ら四神は、ただ神の理に従うのみ。
　お前たちのような愚か者を葬るのが
　我に与えられた唯一の役割だ」
```

#### `boss_byakko_pre3`（type: text）
- **背景**: `bg_spot_karyu_snow`

**テキスト:**
```
虎が地面を蹴った。雪煙が爆発的に舞い上がる。

「牙で語る。それが、我の流儀だ！」
```

#### `boss_byakko`（type: battle）
- **BGM**: `bgm_battle_strong` / **背景**: `bg_spot_karyu_snow`

**テキスト:**
```
白虎が鋭い爪を振り下ろしてきた！
```
**params:** `{"type":"battle", "bgm":"bgm_battle_strong", "bg":"bg_spot_karyu_snow", "enemy_group_id":"spot_karyu_byakko", "battle_success_next":"reward_orb_2"}`

#### `reward_orb_2`（type: reward）
- **背景**: `bg_spot_karyu_snow`

**テキスト:**
```
白虎が倒れた。

「……強い、な。認めよう。
　戦うことしか知らなかったが……悪くない最期だ」

白虎の宝珠を手に入れた！
```
**params:** `{"type":"reward", "bg":"bg_spot_karyu_snow", "items":["622"]}`
※次ノード: `choose_path`

---

### 【南の朱雀ルート】

#### `trap_suzaku`（type: modify_state）
- **背景**: `bg_spot_karyu_fire`

**テキスト:**
```
南の道は灼熱だった。
突然、足元から業火が噴き上がった。

体が焼かれる。確実にHPが削られた。
上空で、赤い羽根が舞っている。
```
**params:** `{"type":"modify_state", "bg":"bg_spot_karyu_fire", "hp_percent":-20}`

#### `boss_suzaku_pre1`（type: text）
- **BGM**: `bgm_battle_strong` / **背景**: `bg_spot_karyu_fire`

**テキスト:**
```
空から、巨大な火の鳥が舞い降りてきた。
翼が一振りするたびに、周囲の岩が赤熱して溶ける。

「我は朱雀。南方の守護者」
```

#### `boss_suzaku_pre2`（type: text）
- **背景**: `bg_spot_karyu_fire`

**テキスト:**
```
「千年も火を灯し続けた。
　消えることが許されぬ炎というのは……辛いものよ。
　この苦しみを、お前たちにわかるか？」
```

#### `boss_suzaku_pre3`（type: text）
- **背景**: `bg_spot_karyu_fire`

**テキスト:**
```
翼が羽ばたいた。熱風が肌を焼く。

「お主が我を消してくれるなら、それもまた良い。
　全力で来い。中途半端な炎は、却って苦しいだけだ」
```

#### `boss_suzaku`（type: battle）
- **BGM**: `bgm_battle_strong` / **背景**: `bg_spot_karyu_fire`

**テキスト:**
```
朱雀が燃え盛る翼で包み込んできた！
```
**params:** `{"type":"battle", "bgm":"bgm_battle_strong", "bg":"bg_spot_karyu_fire", "enemy_group_id":"spot_karyu_suzaku", "battle_success_next":"reward_orb_3"}`

#### `reward_orb_3`（type: reward）
- **背景**: `bg_spot_karyu_fire`

**テキスト:**
```
朱雀が散った。

「……ありがとう。やっと……消えられる」

最後の火が消え、朱雀の宝珠を手に入れた！
```
**params:** `{"type":"reward", "bg":"bg_spot_karyu_fire", "items":["623"]}`
※次ノード: `choose_path`

---

### 【北の玄武ルート】

#### `trap_genbu`（type: modify_state）
- **背景**: `bg_spot_karyu_earth`

**テキスト:**
```
北の道は足場が悪い。
突然、大地が裂けた。岩片が体を打ち据える。

地鳴りが低く響いている。何かが蠢いている。
```
**params:** `{"type":"modify_state", "bg":"bg_spot_karyu_earth", "hp_percent":-20}`

#### `boss_genbu_pre1`（type: text）
- **BGM**: `bgm_battle_strong` / **背景**: `bg_spot_karyu_earth`

**テキスト:**
```
大地が盛り上がり、黒曜石の甲羅が姿を現した。
尾が蛇になっている、二つの頭を持つ巨大な亀だ。

「……急ぐな。千年待った。もう少し待てる」
```

#### `boss_genbu_pre2`（type: text）
- **背景**: `bg_spot_karyu_earth`

**テキスト:**
```
蛇の尾が鎌首をもたげた。黒い霧を吐く。

「我は玄武。亀と蛇、二つの命を縫い合わされた。
　あの方の、残酷な実験作のひとつよ」
```

#### `boss_genbu_pre3`（type: text）
- **背景**: `bg_spot_karyu_earth`

**テキスト:**
```
「だから恨みはあるが……神の命令には逆らえぬ。
　お前たちを地の底へ引きずり込む。参る」
```

#### `boss_genbu`（type: battle）
- **BGM**: `bgm_battle_strong` / **背景**: `bg_spot_karyu_earth`

**テキスト:**
```
玄武が地鳴りと共に地割れを引き起こした！
```
**params:** `{"type":"battle", "bgm":"bgm_battle_strong", "bg":"bg_spot_karyu_earth", "enemy_group_id":"spot_karyu_genbu", "battle_success_next":"reward_orb_4"}`

#### `reward_orb_4`（type: reward）
- **背景**: `bg_spot_karyu_earth`

**テキスト:**
```
玄武が崩れた。甲羅が砕け、蛇の尾がほどけていく。

「……ようやく、ばらばらになれる。
　亀は亀に、蛇は蛇に……」

玄武の宝珠を手に入れた！
```
**params:** `{"type":"reward", "bg":"bg_spot_karyu_earth", "items":["624"]}`
※次ノード: `choose_path`

---

### 【ロック機構：四神の宝珠チェック】

#### `check_orb_seiryu`（type: check_possession）
**params:** `{"type":"check_possession", "item_id":"621", "quantity":1, "fallback":"missing_orbs"}`
※次ノード: `check_orb_byakko`

#### `check_orb_byakko`（type: check_possession）
**params:** `{"type":"check_possession", "item_id":"622", "quantity":1, "fallback":"missing_orbs"}`
※次ノード: `check_orb_suzaku`

#### `check_orb_suzaku`（type: check_possession）
**params:** `{"type":"check_possession", "item_id":"623", "quantity":1, "fallback":"missing_orbs"}`
※次ノード: `check_orb_genbu`

#### `check_orb_genbu`（type: check_possession）
**params:** `{"type":"check_possession", "item_id":"624", "quantity":1, "fallback":"missing_orbs"}`
※次ノード: `final_boss_kami_pre1`

#### `missing_orbs`（type: text）
- **背景**: `bg_spot_karyu_tower`

**テキスト:**
```
塔の扉は固く閉ざされている。
どうやら、四神の宝珠がすべて揃っていないようだ。
四方の守護者を討ち、鍵を集める必要がある。
```
※次ノード: `choose_path`

---

### 【最終ボス「神」ルート】

#### `final_boss_kami_pre1`（type: text）
- **BGM**: `bgm_battle_boss` / **背景**: `bg_spot_karyu_throne`

**テキスト:**
```
四つの宝珠が共鳴し、塔の扉が開いた。
螺旋階段を登りきると——
頂上は、拍子抜けするほど簡素だった。
```

#### `final_boss_kami_pre2`（type: text）
- **背景**: `bg_spot_karyu_throne`

**テキスト:**
```
石の床に、石の椅子が一つ。
そこに座っているのは——子供だった。

足元に碁盤が置いてある。
```

#### `final_boss_kami_pre3`（type: text）
- **背景**: `bg_spot_karyu_throne`
- **話者**: `少年`

**テキスト:**
```
「ようこそ。
　四つの駒を倒したのは、
　あなた達がはじめてですよ」
```

#### `final_boss_kami_pre4`（type: text）
- **背景**: `bg_spot_karyu_throne`
- **話者**: `少年`

**テキスト:**
```
少年がこちらを見た。
目の奥に、星が回っている。

「ねえ。この碁盤の向こう側に
　座ってみませんか？
　——世界を、一緒に支配しましょうよ」
```

#### `final_boss_kami_pre5`（type: text）
- **背景**: `bg_spot_karyu_throne`
- **話者**: `主人公`

**テキスト:**
```
「……断る。
　自分はお前の碁の相手じゃない」
```

#### `final_boss_kami_pre6`（type: text）
- **背景**: `bg_spot_karyu_throne`
- **話者**: `少年`

**テキスト:**
```
少年の目から光が消えた。
空気が凍りつく。石の床にひびが走った。

「そうですか。
　——人間というのは、
　いつも碁盤をひっくり返す」
```

#### `final_boss_kami_pre7`（type: text）
- **背景**: `bg_spot_karyu_throne`
- **話者**: `少年`

**テキスト:**
```
「いいでしょう。
　千年ぶりに、碁の代わりに
　力比べをしてあげますよ」

少年の体が膨れ上がり、光の柱が天を貫いた。
```

#### `final_boss_kami`（type: battle）
- **BGM**: `bgm_battle_boss` / **背景**: `bg_spot_karyu_throne`

**テキスト:**
```
絶対的な力を持つ「神」との最後の戦いが始まった！
```
**params:** `{"type":"battle", "bgm":"bgm_battle_boss", "bg":"bg_spot_karyu_throne", "enemy_group_id":"spot_karyu_kami", "battle_success_next":"final_choice_1"}`

---

### 【エンディング】

#### `final_choice_1`（type: text）
- **BGM**: `bgm_spot_final_choice` / **背景**: `bg_spot_karyu_throne`

**テキスト:**
```
少年が膝をついた。子供の姿が崩れ、光の塊になっていく。

「……はは。負けたよ。初めて負けた。
　気分がいいな。負けるのも悪くない」
```

#### `final_choice_2`（type: text）
- **背景**: `bg_spot_karyu_throne`

**テキスト:**
```
光が薄れていく。声が小さくなる。

「勝者には選ぶ権利がある。
　俺の力を継いで、この塔の新しい主になるか。
　それとも——塔ごと壊して、全部なかったことにするか」
```

#### `final_choice_3`（type: text）
- **背景**: `bg_spot_karyu_throne`

**テキスト:**
```
光が消えかける。最後に一言。

「どっちでもいいぞ。
　俺はもう、退屈じゃなくなったからな」
```

**選択肢:**
| ラベル | 次ノード |
|--------|---------|
| 神の代理人として統べる | `end_rule_1` |
| 神の理を破壊し自由を掴む | `end_destroy_1` |

---

#### `end_rule_1`（type: text）
- **背景**: `bg_spot_karyu_throne`

**テキスト:**
```
光を受け入れた。体に力が流れ込む。
世界の全てが見える。全ての生命の鼓動が聞こえる。
石の椅子に座った。
```

#### `end_rule_2`（type: text）
- **背景**: `bg_spot_karyu_throne`

**テキスト:**
```
「……なるほど。これが、あいつの見ていた景色か」

退屈の意味が、少しわかった気がした。
天道の薙刀を手に入れた。
重い。神の業は——とても重い。
```
※次ノード: `end_rule`

#### `end_rule`（type: end）
- **背景**: `bg_spot_karyu_throne`

**テキスト:**
```
重い王冠を被る。神の業を背負う覚悟を決めた。
```
**params:** `{"type":"end_success", "bg":"bg_spot_karyu_throne", "rewards":{"exp":500, "gold":10000, "reputation":200, "items":["625"]}}`

---

#### `end_destroy_1`（type: text）
- **背景**: `bg_spot_karyu_throne`

**テキスト:**
```
碁盤を踏み砕いた。石の椅子を蹴り倒した。

塔が軋んだ。千年分の力が暴走し、塔が崩壊を始める。
```

#### `end_destroy_2`（type: text）
- **背景**: `bg_spot_karyu_throne`

**テキスト:**
```
地上に飛び出した瞬間——背後で塔が倒れた。
四神もいない。神もいない。

人々は自分の足で歩かなければならなくなった。
神の加護も、呪いもない時代が始まる。
```

#### `end_destroy_3`（type: text）
- **背景**: `bg_spot_karyu_throne`

**テキスト:**
```
残骸の中から、禍々しい光を放つカードが見つかった。

固有スキル『神殺しの光芒』を手に入れた！
```
※次ノード: `end_destroy`

#### `end_destroy`（type: end）
- **背景**: `bg_spot_karyu_throne`

**テキスト:**
```
塔の残骸を背に、自由の風が吹いた。
```
**params:** `{"type":"end_success", "bg":"bg_spot_karyu_throne", "rewards":{"exp":500, "reputation":-100, "items":["626"]}}`

---

#### `end_failure_pre1`（type: text）
- **背景**: `bg_spot_karyu_tower`

**テキスト:**
```
力が尽きた。石の床に倒れ込む。

どこかで、あの少年の声が聞こえた。
「つまらない。次の挑戦者を待つか」
```

#### `end_failure_pre2`（type: text）
- **背景**: `bg_spot_karyu_tower`

**テキスト:**
```
碁石が一つ、足元に転がってきた。
黒い石だった。
```
※次ノード: `end_failure`

#### `end_failure`（type: end）
- **背景**: `bg_spot_karyu_tower`

**テキスト:**
```
華龍の塔は、沈黙を取り戻した。
```
**params:** `{"type":"end_failure", "bg":"bg_spot_karyu_tower"}`
