# クエスト仕様書：6004 — 第4話「砂塵の激突」

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6004 |
| **Slug** | `main_ep04` |
| **クエスト種別** | メインエピソード（Main） |
| **推奨レベル** | 4 |
| **難度** | 1 |
| **依頼主** | 交易商会 |
| **出現条件** | 前提クエストクリア: main_ep03 / 必須滞在拠点: loc_marcund |
| **サムネイル画像** | `/images/quests/bg_desert.png` |

※BGM、SE、進行中の背景画像などはノードごとに指定します。

---

## 1. クエスト概要

### 短文説明
```
公式メインシナリオ
```

### 長文説明
```
[要定義: フレーバーテキスト]
```

---

## 2. 報酬定義

**CSV記載形式:**
```
Gold:400|Rep:10
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
  └─ text3
  └─ text3_1
  └─ text4
  └─ text4_1
  └─ battle
      ├─[「商隊を護る！」]→ N/A
  └─ text_post_battle
  └─ text_post_battle2
  └─ end_node
```

### ノード詳細

#### `start`
**演出パラメータ:**
- **BGM**: `[要定義]`
- **SE**: `[要定義]`
- **背景画像**: `bg_desert`

**テキスト:**
```
オアシス都市での一件から数日後。君とガウェインは、マルカンド領内を移動する大規模な中立商隊の護衛任務に就いていた。
```
**次ノード:** `{type:text, bg:bg_desert}` (auto-advance)
**params:**
```json
text1
```

---

#### `text1`
**演出パラメータ:**
- **BGM**: `[要定義]`
- **SE**: `[要定義]`
- **背景画像**: `bg_desert`

**テキスト:**
```
毒物事件の噂は瞬く間に広がり、マルカンド側の帝国に対するヘイトは限界に達している。すれ違う商人たちの目つきも鋭い。
```
**次ノード:** `{type:text, bg:bg_desert}` (auto-advance)
**params:**
```json
text1_1
```

---

#### `text1_1`
**演出パラメータ:**
- **BGM**: `[要定義]`
- **SE**: `[要定義]`
- **背景画像**: `bg_desert`

**テキスト:**
```
「いつ火を吹いてもおかしくない。……むしろ、上層部は火が吹くのを待っているようにも見えるな」
```
**次ノード:** `{type:text, bg:bg_desert, speaker_image_url:https://picsum.photos/seed/gawain/120}` (auto-advance)
**params:**
```json
text2
```

---

#### `text2`
**演出パラメータ:**
- **BGM**: `[要定義]`
- **SE**: `[要定義]`
- **背景画像**: `bg_desert`

**テキスト:**
```
ガウェインが馬上でそう呟き、深く溜息をついた直後だった。
```
**次ノード:** `{type:text, bg:bg_desert}` (auto-advance)
**params:**
```json
text2_1
```

---

#### `text2_1`
**演出パラメータ:**
- **BGM**: `[要定義]`
- **SE**: `[要定義]`
- **背景画像**: `bg_desert`

**テキスト:**
```
凄まじい轟音と共に、隊商の先頭付近で巨大な爆発・砂塵が上がり、護衛の兵士や商人たちが吹き飛ばされた！
```
**次ノード:** `{type:text, bg:bg_desert}` (auto-advance)
**params:**
```json
text3
```

---

#### `text3`
**演出パラメータ:**
- **BGM**: `[要定義]`
- **SE**: `[要定義]`
- **背景画像**: `bg_desert`

**テキスト:**
```
「敵襲！！……馬鹿な、あれを見ろ！信じられん、ローランの紋章だと！？」
```
**次ノード:** `{type:text, bg:bg_desert, speaker_image_url:https://picsum.photos/seed/gawain/120}` (auto-advance)
**params:**
```json
text3_1
```

---

#### `text3_1`
**演出パラメータ:**
- **BGM**: `[要定義]`
- **SE**: `[要定義]`
- **背景画像**: `bg_desert`

**テキスト:**
```
砂煙の中から姿を現したのは、他ならぬ君たちの祖国――聖帝国ローランの正規軍、その先遣隊だった。
```
**次ノード:** `{type:text, bg:bg_desert}` (auto-advance)
**params:**
```json
text4
```

---

#### `text4`
**演出パラメータ:**
- **BGM**: `[要定義]`
- **SE**: `[要定義]`
- **背景画像**: `bg_desert`

**テキスト:**
```
宣戦布告などない。彼らは『大義』や『制裁』といった空虚な言葉を並べ立てながら、丸腰同然のマルカンド商隊に容赦なく牙を剥いた。
```
**次ノード:** `{type:text, bg:bg_desert}` (auto-advance)
**params:**
```json
text4_1
```

---

#### `text4_1`
**演出パラメータ:**
- **BGM**: `[要定義]`
- **SE**: `[要定義]`
- **背景画像**: `bg_desert`

**テキスト:**
```
「これが……大義を掲げた国のやることか！俺たちは何のために剣を振るっているんだ！」君は思わず叫んだ。
```
**次ノード:** `{type:text, bg:bg_desert}` (auto-advance)
**params:**
```json
battle
```

---

#### `battle`
**演出パラメータ:**
- **BGM**: `[要定義]`
- **SE**: `[要定義]`
- **背景画像**: `bg_desert`

**テキスト:**
```
迷っている暇はない。今は目の前で殺されようとしている人々を救うため、同国人に向かって剣を抜くしかなかった。
```
**次ノード:** `{type:battle, enemy_group_id:2}` (auto-advance)
**params:**
```json
choice_battle
```

---

#### `text_post_battle`
**演出パラメータ:**
- **BGM**: `[要定義]`
- **SE**: `[要定義]`
- **背景画像**: `bg_desert`

**テキスト:**
```
帝国兵を退け、先遣隊を一時的に後退させることには成功した。しかし、辺り一面には無残な商隊の残骸と遺体が散乱している。
```
**次ノード:** `{type:text, bg:bg_desert}` (auto-advance)
**params:**
```json
text_post_battle2
```

---

#### `text_post_battle2`
**演出パラメータ:**
- **BGM**: `[要定義]`
- **SE**: `[要定義]`
- **背景画像**: `bg_desert`

**テキスト:**
```
「……ついに、開戦の口火が切られてしまったか。引き返せない泥沼の始まりだ」
```
**次ノード:** `{type:text, bg:bg_desert, speaker_image_url:https://picsum.photos/seed/gawain/120}` (auto-advance)
**params:**
```json
end_node
```

---

#### `end_node`
**演出パラメータ:**
- **BGM**: `[要定義]`
- **SE**: `[要定義]`
- **背景画像**: `bg_desert`

**テキスト:**
```
ガウェインの顔に深く刻まれた疲労と絶望は、これから始まる地獄の戦場を予見していた。君の手は、同朋を斬った感触に小刻みに震えている。
```
**次ノード:** `{type:end_success, speaker_image_url:https://picsum.photos/seed/gawain/120}` (auto-advance)
**params:**
```json

```

---


