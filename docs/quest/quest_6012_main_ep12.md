# クエスト仕様書：6012 — 第12話「黄河の防衛戦」

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6012 |
| **Slug** | `main_ep12` |
| **クエスト種別** | メインエピソード（Main） |
| **推奨レベル** | 20 |
| **難度** | 2 |
| **依頼主** | 地方太守 |
| **出現条件** | 前提クエストクリア: main_ep11 / 必須滞在拠点: loc_monitor_post |
| **サムネイル画像** | `/images/quests/bg_river.png` |

※BGM、SE、進行中の背景画像などはノードごとに指定します。

---

## 1. クエスト概要

### 短文説明
```
公式メインシナリオ
```

### 長文説明
```
監視哨に迫る大軍勢。黄河を渡る敵の渡河作戦を阻止し、防衛ラインを死守せよ。三度の波状攻撃が、君と仲間たちを試す。
```

---

## 2. 報酬定義

**CSV記載形式:**
```
Gold:2500|Rep:15
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
  └─ battle1
      ├─[迎撃する]→ N/A
  └─ text3
  └─ battle2
      ├─[死線を越える]→ N/A
  └─ text4
  └─ text4_1
  └─ battle3
      ├─[すべてを賭して戦う]→ N/A
  └─ text_post_battle
  └─ end_node
```

### ノード詳細

#### `start`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_river`

**テキスト:**
```
華龍神朝の命綱であり、国を東西に分断する大河「黄河」。君は神朝の正規軍に合流し、そこで決死の防衛線を張っていた。
```
**次ノード:** `{type:text, bg:bg_river}` (auto-advance)
**params:**
```json
text1
```

---

#### `text1`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_river`

**テキスト:**
```
河川敷には数万規模の華龍軍が展開しているが、彼らの顔にあるのは武者震いではなく、天上の脅威に対する根源的な恐怖だった。
```
**次ノード:** `{type:text, bg:bg_river}` (auto-advance)
**params:**
```json
text1_1
```

---

#### `text1_1`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_river`

**テキスト:**
```
「来たぞ……川面を見ろ！」誰かが叫ぶ。川上から、まるで流氷のように白い大群が押し寄せてくる。白磁の鎧を纏った使徒の群れだ。
```
**次ノード:** `{type:text, bg:bg_river}` (auto-advance)
**params:**
```json
text2
```

---

#### `text2`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_river`

**テキスト:**
```
「防衛陣形を崩すな！弓兵、放て！」神朝の老将軍の号令と共に、果てしない神との連戦の幕が上がる。
```
**次ノード:** `{type:text, bg:bg_river}` (auto-advance)
**params:**
```json
battle1
```

---

#### `battle1`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_river`

**テキスト:**
```
第一波。空と川面の両方から、天界の尖兵たちが一斉に光の魔法を放ちながら迫る！
```
**次ノード:** `{type:battle, enemy_group_id:211}` (auto-advance)
**params:**
```json
choice1
```

---

#### `text3`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_river`

**テキスト:**
```
君を含めた前線部隊の必死の奮闘で第一波を押し返したが、使徒たちは死体を残さない。光となって消え、また新たな群れが補充されるだけだ。
```
**次ノード:** `{type:text, bg:bg_river}` (auto-advance)
**params:**
```json
battle2
```

---

#### `battle2`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_river`

**テキスト:**
```
間髪入れずに第二波が到達する。敵の放つ魔力の激しさが一段と増し、防衛線の一部が崩壊を始めた！
```
**次ノード:** `{type:battle, enemy_group_id:211}` (auto-advance)
**params:**
```json
choice2
```

---

#### `text4`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_river`

**テキスト:**
```
体力の限界に達し、腕が引き千切れそうなほどの疲労の中で、天が割れた。雲の間から、一際巨大な六枚の翼を持つ熾天使（上位使徒）が降臨する。
```
**次ノード:** `{type:text, bg:bg_river}` (auto-advance)
**params:**
```json
text4_1
```

---

#### `text4_1`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_river`

**テキスト:**
```
その圧倒的な威圧感に、華龍の兵士たちが次々と膝をつき、戦意を喪失していく。だが、君だけは剣を杖代わりに立ち上がった。
```
**次ノード:** `{type:text, bg:bg_river}` (auto-advance)
**params:**
```json
battle3
```

---

#### `battle3`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_river`

**テキスト:**
```
第三波・熾天使（上位使徒）。こいつさえ倒せば、この前線はいったん持ちこたえられるはずだ！
```
**次ノード:** `{type:battle, enemy_group_id:212}` (auto-advance)
**params:**
```json
choice3
```

---

#### `text_post_battle`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_river`

**テキスト:**
```
君の放った一撃が熾天使の胸を貫き、耳を聾するほどの轟音と共に光の粒となって消散した。それを合図にしたかのように、周囲の神兵たちも黄河を退き、天へ帰せられていった。
```
**次ノード:** `{type:text, bg:bg_river}` (auto-advance)
**params:**
```json
end_node
```

---

#### `end_node`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_river`

**テキスト:**
```
なんとか防衛線を死守したものの、被害は甚大だった。華龍軍の半数が壊滅し、川底には沈んだ人間の死体が無数に転がっている。「これが……神の力か」君はその場に崩れ落ちた。
```
**次ノード:** `{type:end_success}` (auto-advance)
**params:**
```json

```

---


