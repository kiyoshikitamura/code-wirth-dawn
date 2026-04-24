# クエスト仕様書：6001 — 第1話「始まりの轍」

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6001 |
| **Slug** | `main_ep01` |
| **クエスト種別** | メインエピソード（Main） |
| **推奨レベル** | 1（Easy） |
| **難度** | 1 |
| **依頼主** | 王国軍 |
| **出現条件** | プレイヤーLv 1 以上 / 滞在拠点: ローランド聖王国拠点 |
| **リピート** | アカウント通じて1回のみ（継承後も非表示） |
| **難易度Tier** | Easy（rec_level: 1） |
| **経過日数 (time_cost)** | 2（成功: 2日 / 失敗: 1日） |
| **ゲストNPC** | ガウェイン（パーティ加入あり / クエスト終了後に離脱） |
| **サムネイル画像** | `/images/quests/bg_road_day.png` |

※BGM、SE、進行中の背景画像などはノードごとに指定します。

---

## 1. クエスト概要

### 短文説明
```
メインシナリオ第1話
```

### 長文説明
```
王国辺境の国境の町。荒涼たる大地を渡る風に身を晒しながら、一介の傭兵として生き抜く日々が始まる。王国軍の輸送部隊護衛という最初の仕事が、君を戦乱の渦中へと引きずり込むことになるとは、まだ知る由もなかった。
```

---

## 2. 報酬定義

**CSV記載形式:**
```
Exp:80|Gold:150|Rep:5|Order:5
```

---

## 3. シナリオノード構成

### 簡易フロー
```text
start
  └─ start
  └─ text1
  └─ text1_1
  └─ text1_2
  └─ text2
      ├─[「急いで積み込みます」]→ N/A
      ├─[「あんたはここで指図するだけか？」]→ N/A
  └─ text3
  └─ text3_1
  └─ text4
  └─ text4_1
  └─ text4_2
  └─ battle
      ├─[迎撃する]→ N/A
  └─ text_post_battle
  └─ end_node
```

### ノード詳細

#### `start`
**演出パラメータ:**
- **BGM**: `bgm_quest_calm`
- **SE**: `—`
- **背景画像**: `bg_road_day`

**テキスト:**
```
肌を焦がすような乾いた風が、荒涼たる砂丘を撫でる音がする。ここは軍事国家たる聖王国ローランドの辺境、名もなき村の外れだ。
```
**次ノード:** `{type:text, bg:bg_road_day}` (auto-advance)
**params:**
```json
text1
```

---

#### `text1`
**演出パラメータ:**
- **BGM**: `bgm_quest_calm`
- **SE**: `—`
- **背景画像**: `bg_wasteland`

**テキスト:**
```
かつて栄華を極めた王国の威光もここまで届くことはなく、村の壁は崩れかけ、人々は日々の糧を得るのにも苦労している。
```
**次ノード:** `{type:text, bg:bg_wasteland}` (auto-advance)
**params:**
```json
text1_1
```

---

#### `text1_1`
**演出パラメータ:**
- **BGM**: `bgm_quest_calm`
- **SE**: `—`
- **背景画像**: `bg_wasteland`

**テキスト:**
```
そんな場所から、君の物語は始まる。名もなき一介の傭兵として身を立てるため、君は王国軍の輸送部隊を手伝う運搬依頼を引き受けた。
```
**次ノード:** `{type:text, bg:bg_wasteland}` (auto-advance)
**params:**
```json
text1_2
```

---

#### `text1_2`
**演出パラメータ:**
- **BGM**: `bgm_quest_calm`
- **SE**: `—`
- **背景画像**: `bg_wasteland`

**テキスト:**
```
荷馬車に積まれた大量の木箱を数え終えるかどうかの時、背後からしゃがれた太い声が飛んできた。
```
**次ノード:** `{type:text, bg:bg_wasteland}` (auto-advance)
**params:**
```json
text2
```

---

#### `text2`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_wasteland`

**テキスト:**
```
「おい、そこの新入り！ぼんやりするな。太陽が高くなれば、野盗の連中がいつ湧いてきてもおかしくないぞ！」
```
**次ノード:** `{type:text, bg:bg_wasteland, speaker_image_url:/images/npcs/npc_guest_gawain.png}` (auto-advance)
**params:**
```json
choice1
```

---

#### `text3`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_wasteland`

**テキスト:**
```
男は鼻で笑うと、鈍く光る長剣の柄に手を当てた。「威勢はいいが、口ほどにもない奴はすぐ死ぬのが戦場だ」
```
**次ノード:** `{type:text, bg:bg_wasteland, speaker_image_url:/images/npcs/npc_guest_gawain.png}` (auto-advance)
**params:**
```json
text3_1
```

---

#### `text3_1`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_wasteland`

**テキスト:**
```
「俺はガウェイン。この部隊の小隊長にして、お前たち新米を死なせないための監視役といったところだ。……お前、その剣の腕には自信があるんだろうな？」
```
**次ノード:** `{type:text, bg:bg_wasteland, speaker_image_url:/images/npcs/npc_guest_gawain.png}` (auto-advance)
**params:**
```json
text4
```

---

#### `text4`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_wasteland`

**テキスト:**
```
君が応えようとしたその瞬間、砂埃の向こうからけたたましい怒声と馬の嘶きが迫ってきた。
```
**次ノード:** `{type:text, bg:bg_wasteland}` (auto-advance)
**params:**
```json
text4_1
```

---

#### `text4_1`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_wasteland`

**テキスト:**
```
「小隊長！前方の丘より正体不明の集団が接近！十、いや二十……武器を持っています。野盗です！」見張りの兵士の声が裏返る。
```
**次ノード:** `{type:text, bg:bg_wasteland}` (auto-advance)
**params:**
```json
text4_2
```

---

#### `text4_2`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_wasteland`

**テキスト:**
```
ガウェインが素早く抜刀し、鋭い眼光を砂塵に向ける。「チッ……言葉の先からこれだ。おい新入り、あの木箱は死守しろ。荷を奪われりゃ俺たちの首が飛ぶぞ」
```
**次ノード:** `{type:text, bg:bg_wasteland, speaker_image_url:/images/npcs/npc_guest_gawain.png}` (auto-advance)
**params:**
```json
battle
```

---

#### `battle`
**演出パラメータ:**
- **BGM**: `bgm_battle`
- **SE**: `se_battle_start`
- **背景画像**: `bg_wasteland`

**テキスト:**
```
己の力と生き残る意志を示す、最初の手柄を立てる時が来た。震える手で武器を握り直せ！
```
**次ノード:** `{type:battle, bg:bg_wasteland, enemy_group_id:200}` (auto-advance)
**params:**
```json
choice2
```

---

#### `text_post_battle`
**演出パラメータ:**
- **BGM**: `bgm_quest_calm`
- **SE**: `—`
- **背景画像**: `bg_wasteland`

**テキスト:**
```
剣を振り抜き、最後の一人を砂に沈める。荒い息を吐く君の前で、ガウェインが剣の血振るいをした。
```
**次ノード:** `{type:text, bg:bg_wasteland}` (auto-advance)
**params:**
```json
end_node
```

---

#### `end_node`
**演出パラメータ:**
- **BGM**: `bgm_quest_calm`
- **SE**: `se_quest_complete`
- **背景画像**: `bg_wasteland`

**テキスト:**
```
「悪くない太刀筋だ。これなら戦場でも生き残れるかもしれんな。……さあ、荷馬車を出すぞ！」
```
**次ノード:** `{type:end_success, bg:bg_wasteland, speaker_image_url:/images/npcs/npc_guest_gawain.png}` (auto-advance)
**params:**
```json

```

---


