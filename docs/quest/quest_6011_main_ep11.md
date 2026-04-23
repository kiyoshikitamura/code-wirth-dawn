# クエスト仕様書：6011 — 第11話「天の壁」

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6011 |
| **Slug** | `main_ep11` |
| **クエスト種別** | メインエピソード（Main） |
| **推奨レベル** | 11（Hard） |
| **難度** | 2 |
| **依頼主** | 地方太守 |
| **出現条件** | 前提クエストクリア: main_ep10 / 滞在拠点: 華龍国拠点 |
| **リピート** | アカウント通じて1回のみ（継承後も非表示） |
| **難易度Tier** | Hard（rec_level: 11） |
| **サムネイル画像** | `/images/quests/bg_road_day.png` |

※BGM、SE、進行中の背景画像などはノードごとに指定します。

---

## 1. クエスト概要

### 短文説明
```
公式メインシナリオ
```

### 長文説明
```
北の防衛砦、火龍帝国が誇る万里の長城。異民族の侵攻を食い止めるこの巨大な壁が、新たな戦いの舞台となる。
```

---

## 2. 報酬定義

**CSV記載形式:**
```
Gold:2000|Rep:15
```

---

## 3. シナリオノード構成

### 簡易フロー
```text
start
  └─ start
  └─ text1
  └─ text2
  └─ text2_1
  └─ text3
  └─ text3_1
  └─ text4
  └─ battle
      ├─[戦列に加わる]→ N/A
  └─ text5
  └─ text5_1
  └─ text6
  └─ end_node
```

### ノード詳細

#### `start`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_road_day`

**テキスト:**
```
夜刀の古代神殿で知った世界の真実――天上の神々による理不尽な生態系間引き（大粛清）を阻止するべく、君は東方の超大国「華龍神朝」へと足を踏み入れた。
```
**次ノード:** `{type:text, bg:bg_road_day}` (auto-advance)
**params:**
```json
text1
```

---

#### `text1`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_road_day`

**テキスト:**
```
華龍の広大な大地は、豊かな穀倉地帯と雄大な黄河が流れ、独自の活気に満ちている。だが、辺境の村に身を休めていたある日、突如として空が異様な黄金色に染まり始めた。
```
**次ノード:** `{type:text, bg:bg_road_day}` (auto-advance)
**params:**
```json
text2
```

---

#### `text2`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_road_day`

**テキスト:**
```
「なんだあの空は……？太陽が……三つあるのか！？」村人たちが空を指差し、怯えた声を上げる。
```
**次ノード:** `{type:text, bg:bg_road_day}` (auto-advance)
**params:**
```json
text2_1
```

---

#### `text2_1`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_road_day`

**テキスト:**
```
空を覆う黄金の雲の中から、天を貫くような無機質で圧倒的な声が響き渡った。
```
**次ノード:** `{type:text, bg:bg_road_day}` (auto-advance)
**params:**
```json
text3
```

---

#### `text3`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_ruins_field`

**テキスト:**
```
『地上の穢れを焼却せよ。これより、神罰の執行を開始する』
```
**次ノード:** `{type:text, bg:bg_ruins_field}` (auto-advance)
**params:**
```json
text3_1
```

---

#### `text3_1`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_ruins_field`

**テキスト:**
```
声と共に、雲を割って無数の光の輪が降り注ぐ。その輪の中から現れたのは、白磁の装甲と純白の翼を持つ異形の戦士——「上位使徒（天使）」の群れだった。
```
**次ノード:** `{type:text, bg:bg_ruins_field}` (auto-advance)
**params:**
```json
text4
```

---

#### `text4`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_ruins_field`

**テキスト:**
```
彼らは言葉を発することなく、手にした光の槍で容赦なく逃げ惑う村人たちを貫いていく。人間と神兵とでは、文字通り次元が違った。
```
**次ノード:** `{type:text, bg:bg_ruins_field}` (auto-advance)
**params:**
```json
battle
```

---

#### `battle`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_ruins_field`

**テキスト:**
```
「ふざけるな……こんな一方的な虐殺が許されてたまるか！」君は震える足を叩き、絶望的な戦力差の天敵へと刃を向けた。
```
**次ノード:** `{type:battle, enemy_group_id:210}` (auto-advance)
**params:**
```json
choice1
```

---

#### `text5`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_ruins_field`

**テキスト:**
```
神使の一体を退けたものの、君の剣は酷く刃こぼれを起こしていた。そして空を見上げれば、倒した数の十倍以上の使徒が新たに降下してきている。
```
**次ノード:** `{type:text, bg:bg_ruins_field}` (auto-advance)
**params:**
```json
text5_1
```

---

#### `text5_1`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_ruins_field`

**テキスト:**
```
（勝てない……俺一人の力では、どう足掻いても届かない！）
```
**次ノード:** `{type:text, bg:bg_ruins_field}` (auto-advance)
**params:**
```json
text6
```

---

#### `text6`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_ruins_field`

**テキスト:**
```
一介の傭兵である君の前に、文字通り「神の壁」という絶対的な絶望が立ち塞がろうとしていた。
```
**次ノード:** `{type:text, bg:bg_ruins_field}` (auto-advance)
**params:**
```json
end_node
```

---

#### `end_node`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_ruins_field`

**テキスト:**
```
一時撤退を余儀なくされ、君は燃え盛る村を背に華龍の中心部へと走った。このままでは世界中が、神の光という名の炎に飲み込まれることになる。
```
**次ノード:** `{type:end_success}` (auto-advance)
**params:**
```json

```

---


