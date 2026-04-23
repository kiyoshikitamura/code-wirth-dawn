# クエスト仕様書：6007 — 第7話「刃の掟」

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6007 |
| **Slug** | `main_ep07` |
| **クエスト種別** | メインエピソード（Main） |
| **推奨レベル** | 7 |
| **難度** | 2 |
| **依頼主** | 代官所 |
| **出現条件** | 前提クエストクリア: main_ep06 / 必須滞在拠点: loc_temple_town |
| **サムネイル画像** | `/images/quests/bg_spot_yato_entrance.png` |

※BGM、SE、進行中の背景画像などはノードごとに指定します。

---

## 1. クエスト概要

### 短文説明
```
公式メインシナリオ
```

### 長文説明
```
門前町に伝わる「刃の掟」。異邦の剣士として、夜刀の地で認められるための試練が始まる。鍛え抜かれた天狗の武技が、君の覚悟を試す。
```

---

## 2. 報酬定義

**CSV記載形式:**
```
Gold:800|Rep:10
```

---

## 3. シナリオノード構成

### 簡易フロー
```text
start
  └─ start
  └─ text1
  └─ text1_1
  └─ text2
      ├─[「『機密書』を売るので通してくれ（裏切り）」]→ N/A
      ├─[「傭兵として雇ってくれ（正攻法）」]→ N/A
  └─ path_betray
  └─ text2_betray
  └─ path_normal
  └─ path_normal_2
  └─ battle
      ├─[剣を抜き、死闘に身を投じる]→ N/A
  └─ text2_normal
  └─ text2_normal_2
  └─ end_node
```

### ノード詳細

#### `start`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_spot_yato_entrance`

**テキスト:**
```
鬱蒼と生い茂る密林地帯を抜け、君は東の果てに位置する島国、夜刀神国の国境関所へと辿り着いた。
```
**次ノード:** `{type:text, bg:bg_spot_yato_entrance}` (auto-advance)
**params:**
```json
text1
```

---

#### `text1`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_spot_yato_entrance`

**テキスト:**
```
巨大な木組みの門が威圧的に聳え立ち、屈強な関守たちが物々しい警戒を敷いている。最近の近隣諸国の戦乱を受けて、入国審査は異常なほど厳格化されていた。
```
**次ノード:** `{type:text, bg:bg_spot_yato_entrance}` (auto-advance)
**params:**
```json
text1_1
```

---

#### `text1_1`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_spot_yato_entrance`

**テキスト:**
```
君の手の中には、マルカンドから逃れる道中で息絶えた名もなきローラン兵から託された「帝国の機密書」が握られている。これを然るべき者へ届けるのが、今の君の数少ない目的だった。
```
**次ノード:** `{type:text, bg:bg_spot_yato_entrance}` (auto-advance)
**params:**
```json
text2
```

---

#### `text2`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_spot_yato_entrance`

**テキスト:**
```
「止まれ。何者だ」刀に手をかけた関守の頭目が、冷酷な目で君を見下ろしている。「通行証を持たぬ流れ者は通せぬ。怪しい真似をするならここで斬る。さっさと立ち去れ」
```
**次ノード:** `{type:text, bg:bg_spot_yato_entrance}` (auto-advance)
**params:**
```json
choice1
```

---

#### `path_betray`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_spot_yato_entrance`

**テキスト:**
```
「……ほう？」関守の顔色が変わる。機密書を受け取った彼は、中身を軽く検めるとニヤリと笑った。「なるほど、裏切りの代償というわけか。……良かろう、通れ」
```
**次ノード:** `{type:text, bg:bg_spot_yato_entrance}` (auto-advance)
**params:**
```json
text2_betray
```

---

#### `text2_betray`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_spot_yato_entrance`

**テキスト:**
```
関所の門が開く。だが、本来届けるべき目的地を裏切り、死者の想いを金と安全に換えたその事実は、君の心に冷たい影を落とした。（※名声が低下した）
```
**次ノード:** `{type:text, bg:bg_spot_yato_entrance}` (auto-advance)
**params:**
```json
end_node
```

---

#### `path_normal`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_spot_yato_entrance`

**テキスト:**
```
君の提案に関守は鼻で笑った。「腕組みの傭兵だと？お前のようなボロボロの敗残兵にか？……ならば実力を示せ。ちょうど裏山に巣食う大蛇の駆除に手を焼いていたところだ」
```
**次ノード:** `{type:text, bg:bg_spot_yato_entrance}` (auto-advance)
**params:**
```json
path_normal_2
```

---

#### `path_normal_2`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_spot_yato_entrance`

**テキスト:**
```
「あれの首を刎ねてくれば、特例で通行を許可してやろう」関守の言葉は半分以上が冷やかしだったが、君に別の選択肢はなかった。
```
**次ノード:** `{type:text, bg:bg_spot_yato_entrance}` (auto-advance)
**params:**
```json
battle
```

---

#### `battle`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_forest_night`

**テキスト:**
```
薄暗い裏山の竹林。血と獣の臭いが立ち込める中、人間を丸呑みにするほどの巨大な蛇の群れが、君を獲物と見定めて這い寄ってきた！
```
**次ノード:** `{type:battle, enemy_group_id:205}` (auto-advance)
**params:**
```json
choice2
```

---

#### `text2_normal`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_spot_yato_entrance`

**テキスト:**
```
血まみれの大蛇の首を関所の中庭へ投げ捨てると、周囲の兵士たちがどよめき、関守の頭目は絶句した。
```
**次ノード:** `{type:text, bg:bg_spot_yato_entrance}` (auto-advance)
**params:**
```json
text2_normal_2
```

---

#### `text2_normal_2`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_spot_yato_entrance`

**テキスト:**
```
「……見事な腕だ。まさか本当に討ち取るとはな。……通れ、名もなき傭兵よ。夜刀神国はお前のような強者を歓迎する」
```
**次ノード:** `{type:text, bg:bg_spot_yato_entrance}` (auto-advance)
**params:**
```json
end_node
```

---

#### `end_node`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_spot_yato_entrance`

**テキスト:**
```
重い音を立てて関所の門が開く。異国の風が吹き抜ける中、夜刀特有の瓦屋根の風景が、君の目の前に広がった。
```
**次ノード:** `{type:end_success}` (auto-advance)
**params:**
```json

```

---


