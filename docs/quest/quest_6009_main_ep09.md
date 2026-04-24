# クエスト仕様書：6009 — 第9話「大名行列の護衛」

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6009 |
| **Slug** | `main_ep09` |
| **クエスト種別** | メインエピソード（Main） |
| **推奨レベル** | 9（Hard） |
| **難度** | 2 |
| **依頼主** | 代官所 |
| **出現条件** | 前提クエストクリア: main_ep08 / 滞在拠点: 夜刀神国拠点 |
| **リピート** | アカウント通じて1回のみ（継承後も非表示） |
| **難易度Tier** | Hard（rec_level: 9） |
| **経過日数 (time_cost)** | 3（成功: 3日 / 失敗: 2日） |
| **ゲストNPC** | なし |
| **サムネイル画像** | `/images/quests/bg_mountain.png` |

※BGM、SE、進行中の背景画像などはノードごとに指定します。

---

## 1. クエスト概要

### 短文説明
```
メインシナリオ第9話
```

### 長文説明
```
谷間の集落を通る大名行列の護衛任務。だが行列を襲う者たちの背後には、国を揺るがす大きな陰謀が見え隠れする。
```

---

## 2. 報酬定義

**CSV記載形式:**
```
Gold:1000|Rep:10|Evil:5
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
      ├─[刃で応える]→ N/A
  └─ text_post_battle
  └─ text_post_battle2
  └─ end_node
```

### ノード詳細

#### `start`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_mountain`

**テキスト:**
```
暗殺者による襲撃を凌ぎ、腕の立つ傭兵としての名が少しずつ夜刀の裏社会で囁かれ始めた頃。君の元に、有力な大名からの直接指名で護衛依頼が舞い込んだ。
```
**次ノード:** `{type:text, bg:bg_mountain}` (auto-advance)
**params:**
```json
text1
```

---

#### `text1`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_mountain`

**テキスト:**
```
依頼内容は、領地内を横断する大名行列の護衛。表向きは「近隣の古社へ向けた祭礼行事の移動」だと説明されているが、その物々しい装備の量には明らかに違和感があった。
```
**次ノード:** `{type:text, bg:bg_mountain}` (auto-advance)
**params:**
```json
text2
```

---

#### `text2`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_mountain`

**テキスト:**
```
「皆の者、決して油断するな。いつ何時、野盗や『逆賊』が襲い掛かるとも知れんぞ！」護衛団長が神経質そうに声を荒げる。
```
**次ノード:** `{type:text, bg:bg_mountain}` (auto-advance)
**params:**
```json
text2_1
```

---

#### `text2_1`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_mountain`

**テキスト:**
```
行軍が険しい山道に差し掛かった時だった。両側の崖上から大量の岩が落とされ、行列の足が強制的に止められる。
```
**次ノード:** `{type:text, bg:bg_mountain}` (auto-advance)
**params:**
```json
text3
```

---

#### `text3`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_mountain`

**テキスト:**
```
土埃の向こうから、ボロボロの着物を纏い、農具や竹槍で武装した集団が雪崩のように押し寄せてきた。彼らの顔にあるのは野盗の卑しさではなく、餓えた獣のような必死さだ。
```
**次ノード:** `{type:text, bg:bg_mountain}` (auto-advance)
**params:**
```json
text3_1
```

---

#### `text3_1`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_mountain`

**テキスト:**
```
「米を返せ！！その荷台に乗せられているのは、我らの村から不当に収奪した年貢の米だ！家族が餓死しそうなのに、何が祭礼だ！」襲撃者の一人が血を吐くように叫ぶ。
```
**次ノード:** `{type:text, bg:bg_mountain}` (auto-advance)
**params:**
```json
text4
```

---

#### `text4`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_mountain`

**テキスト:**
```
「黙れ逆賊ども！その汚い手で殿の荷に触れるな！者ども、討ち捨てい！」護衛団長は顔を真っ赤にして苛烈な命令を下す。
```
**次ノード:** `{type:text, bg:bg_mountain}` (auto-advance)
**params:**
```json
battle
```

---

#### `battle`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_mountain`

**テキスト:**
```
彼らは逆賊か、それとも強欲な権力者の被害者か。だが、君は金を受け取って『現在』の雇用主を守る傭兵だ。君の剣は、誰の正義のためにあるのか？
```
**次ノード:** `{type:battle, enemy_group_id:208}` (auto-advance)
**params:**
```json
choice1
```

---

#### `text_post_battle`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_mountain`

**テキスト:**
```
君の剣が閃くたびに、悲痛な叫び声を上げて農民たちが倒れていく。訓練された兵士たちによって、一揆は瞬く間に鎮圧された。
```
**次ノード:** `{type:text, bg:bg_mountain}` (auto-advance)
**params:**
```json
text_post_battle2
```

---

#### `text_post_battle2`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_mountain`

**テキスト:**
```
「ふん、虫ケラどもが。……おい傭兵、よくやった。後で特別手当を払ってやろう」団長は満足げに笑った。
```
**次ノード:** `{type:text, bg:bg_mountain}` (auto-advance)
**params:**
```json
end_node
```

---

#### `end_node`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_mountain`

**テキスト:**
```
倒れた襲撃者たちの手には、折れたクワや鎌がこびりついていた。血に染まった彼らの貧相な装備を見つめながら、君はただ静かに、冷たくなった剣を鞘に納めた。
```
**次ノード:** `{type:end_success}` (auto-advance)
**params:**
```json

```

---


