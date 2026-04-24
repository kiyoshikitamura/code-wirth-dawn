# クエスト仕様書：6006 — 第6話「逃亡者の道」

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6006 |
| **Slug** | `main_ep06` |
| **クエスト種別** | メインエピソード（Main） |
| **推奨レベル** | 6（Normal） |
| **難度** | 2 |
| **依頼主** | 忍び衆 |
| **出現条件** | 前提クエストクリア: main_ep05 / 滞在拠点: 夜刀神国拠点 |
| **リピート** | アカウント通じて1回のみ（継承後も非表示） |
| **難易度Tier** | Normal（rec_level: 6） |
| **経過日数 (time_cost)** | 5（成功: 5日 / 失敗: 3日） |
| **ゲストNPC** | なし |
| **選択肢分岐** | あり（逃走ルートの選択。けもの道→バトルなし、川沿い→バトル発生） |
| **ノード数** | 12ノード（うち選択肢3件） |
| **サムネイル画像** | `/images/quests/bg_forest_day.png` |

※BGM、SE、進行中の背景画像などはノードごとに指定します。

---

## 1. クエスト概要

### 短文説明
```
メインシナリオ第6話
```

### 長文説明
```
戦場を離れ、最果ての村へと逃れた君を追う者たちの影。異国の地で新たな縁と危機が交錯する、東方への旅路の始まり。
```

---

## 2. 報酬定義

**CSV記載形式:**
```
Exp:250|Gold:700|Rep:10|Chaos:5
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
  └─ text2_1
      ├─[「険しい『けもの道』を進む」]→ N/A
      ├─[「見つかりやすいが『川沿い』を急ぐ」]→ N/A
  └─ text_safepath
  └─ text_safepath_2
  └─ text_danger
  └─ text_danger_2
  └─ battle
      ├─[血路を切り開く]→ N/A
  └─ text_danger_3
  └─ end_node
```

### ノード詳細

#### `start`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_forest_day`

**テキスト:**
```
泥と血に塗れた敗残兵の群れに紛れ、マルカンドの前線拠点から逃げ延びた君は、東の果て——夜刀神国の国境域である密林地帯へと足を踏み入れていた。
```
**次ノード:** `{type:text, bg:bg_forest_day}` (auto-advance)
**params:**
```json
text1
```

---

#### `text1`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_forest_day`

**テキスト:**
```
肩の傷が熱を持つ。目を閉じれば、今でも無数の槍に貫かれて笑った老騎士、ガウェインの最期の顔がフラッシュバックする。
```
**次ノード:** `{type:text, bg:bg_forest_day}` (auto-advance)
**params:**
```json
text1_1
```

---

#### `text1_1`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_forest_day`

**テキスト:**
```
「生き延びて、この目で世界の果てを見届けろ……」その呪いのような、祈りのような言葉だけが、今の君を突き動かしていた。
```
**次ノード:** `{type:text, bg:bg_forest_day}` (auto-advance)
**params:**
```json
text2
```

---

#### `text2`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_forest_day`

**テキスト:**
```
しかし現実は過酷だ。王国の執拗な残党狩りの捜索網が敷き詰められ、水筒はとうに空。食料も底を突いている。
```
**次ノード:** `{type:text, bg:bg_forest_day}` (auto-advance)
**params:**
```json
text2_1
```

---

#### `text2_1`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_forest_day`

**テキスト:**
```
遠くから、軍用犬の吠え声と軍靴の足音が聞こえてくる。休息を取る時間は残されていない。だが、どちらへ逃げるべきか。
```
**次ノード:** `{type:text, bg:bg_forest_day}` (auto-advance)
**params:**
```json
choice1
```

---

#### `text_safepath`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_forest_day`

**テキスト:**
```
足場は最悪で、蔦や棘が容赦なく体力を奪っていく。（Vitality-5）
```
**次ノード:** `{type:text, bg:bg_forest_day, vitality_dmg: 5}` (auto-advance)
**params:**
```json
text_safepath_2
```

---

#### `text_safepath_2`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_forest_day`

**テキスト:**
```
だがその甲斐あって、追手の目を完全に欺くことに成功した。疲労困憊になりながらも密林を抜ける。
```
**次ノード:** `{type:text, bg:bg_forest_day}` (auto-advance)
**params:**
```json
end_node
```

---

#### `text_danger`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_river`

**テキスト:**
```
川のせせらぎが喉の渇きを癒してくれる。だが、開けた場所に出た代償はすぐに支払わされることとなった。
```
**次ノード:** `{type:text, bg:bg_river}` (auto-advance)
**params:**
```json
text_danger_2
```

---

#### `text_danger_2`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_river`

**テキスト:**
```
茂みが揺れ、王国軍の追討部隊が姿を現す。「見つけたぞ！マルカンドの残党だ。一人残らず首を刎ねろ！」
```
**次ノード:** `{type:text, bg:bg_river}` (auto-advance)
**params:**
```json
battle
```

---

#### `battle`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_river`

**テキスト:**
```
生き延びると決めたんだ。こんなところで犬死にするわけにはいかない！
```
**次ノード:** `{type:battle, enemy_group_id:204}` (auto-advance)
**params:**
```json
choice2
```

---

#### `text_danger_3`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_river`

**テキスト:**
```
追討部隊を返り討ちにすると、君は血のついた剣を洗いもせずに走り出した。
```
**次ノード:** `{type:text, bg:bg_river}` (auto-advance)
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
幾多の苦難を越え、密林が途切れる。その先には、重厚な木造建築が並ぶ夜刀神国の『関所』が、巨大な影を落として君を待っていた。
```
**次ノード:** `{type:end_success}` (auto-advance)
**params:**
```json

```

---


