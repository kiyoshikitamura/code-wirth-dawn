# クエスト仕様書：6016 — 第16話「受け継がれし剣」

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6016 |
| **Slug** | `main_ep16` |
| **クエスト種別** | メインエピソード（Main） |
| **推奨レベル** | 40 |
| **難度** | 4 |
| **依頼主** | 帝国軍 |
| **出現条件** | 前提クエストクリア: main_ep15 / 必須滞在拠点: loc_regalia / 引退世代数 2以上 |
| **サムネイル画像** | `/images/quests/bg_tavern_night.png` |

※BGM、SE、進行中の背景画像などはノードごとに指定します。

---

## 1. クエスト概要

### 短文説明
```
公式メインシナリオ
```

### 長文説明
```
王都レガリアへの帰還。かつて戦場を共にした仲間たちとの再会。ガウェインの遺志を胸に、新たな決意を固める。
```

---

## 2. 報酬定義

**CSV記載形式:**
```
Gold:6000|Rep:20
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
      ├─[「力を貸してくれ。終わらせに行く」]→ N/A
  └─ text4
  └─ battle
      ├─[討破する]→ N/A
  └─ text_post_battle
  └─ end_node
```

### ノード詳細

#### `start`
**演出パラメータ:**
- **BGM**: `bgm_quest_calm`
- **SE**: `—`
- **背景画像**: `bg_tavern_night`

**テキスト:**
```
先代が神界の門を打ち破ってから、数十年の歳月が流れた。「生ける伝説」として名を残した初代は既にこの世になく、君はその遠い子孫、あるいは意志を継ぐ第二世代の傭兵だ。
```
**次ノード:** `{type:text, bg:bg_tavern_night}` (auto-advance)
**params:**
```json
text1
```

---

#### `text1`
**演出パラメータ:**
- **BGM**: `bgm_quest_calm`
- **SE**: `—`
- **背景画像**: `bg_tavern_night`

**テキスト:**
```
君は先代が遺した手記と、血塗られた古びた短剣を握りしめ、かつて彼らが集ったという伝説の酒場の扉を叩いた。
```
**次ノード:** `{type:text, bg:bg_tavern_night}` (auto-advance)
**params:**
```json
text2
```

---

#### `text2`
**演出パラメータ:**
- **BGM**: `bgm_quest_calm`
- **SE**: `—`
- **背景画像**: `bg_tavern_night`

**テキスト:**
```
「よう、見ない顔だな。……いや、違うな。その眼の奥の狂気は、見覚えがある。手記を見るに、あいつの『跡継ぎ』ってわけか」
```
**次ノード:** `{type:text, bg:bg_tavern_night}` (auto-advance)
**params:**
```json
text2_1
```

---

#### `text2_1`
**演出パラメータ:**
- **BGM**: `bgm_quest_calm`
- **SE**: `—`
- **背景画像**: `bg_tavern_night`

**テキスト:**
```
薄暗い酒場の奥には、生気を失ってはいるが確かな存在感を放つ者たちが座っていた。彼らはかつて世界を救いかけた「英霊（シャドウ）」たちだ。
```
**次ノード:** `{type:text, bg:bg_tavern_night}` (auto-advance)
**params:**
```json
text3
```

---

#### `text3`
**演出パラメータ:**
- **BGM**: `bgm_quest_calm`
- **SE**: `—`
- **背景画像**: `bg_tavern_night`

**テキスト:**
```
彼らは初代が命と引き換えに刻んだ歴史の残滓であり、意志の強さを物語っている。君は手記をテーブルに叩きつけ、彼らをねめつけた。
```
**次ノード:** `{type:text, bg:bg_tavern_night}` (auto-advance)
**params:**
```json
choice1
```

---

#### `text4`
**演出パラメータ:**
- **BGM**: `bgm_quest_calm`
- **SE**: `—`
- **背景画像**: `bg_tavern_night`

**テキスト:**
```
英霊の長がニヤリと笑う。「いいぜ。あいつが命と引き換えに繋いだこの道、無駄にはさせねぇ！行こうぜ、クソッタレな神々を殺しによ！」
```
**次ノード:** `{type:text, bg:bg_tavern_night}` (auto-advance)
**params:**
```json
battle
```

---

#### `battle`
**演出パラメータ:**
- **BGM**: `bgm_quest_calm`
- **SE**: `—`
- **背景画像**: `bg_road_night`

**テキスト:**
```
だが平穏は長く続かない。酒場を出た直後、街の自警団に化けていた異形の刺客（堕天使）が襲い掛かる。継承の証を持つ者を消すためだ！
```
**次ノード:** `{type:battle, enemy_group_id:216}` (auto-advance)
**params:**
```json
choice2
```

---

#### `text_post_battle`
**演出パラメータ:**
- **BGM**: `bgm_quest_calm`
- **SE**: `—`
- **背景画像**: `bg_road_night`

**テキスト:**
```
英霊たちの支援を受け、君はいとも簡単に刺客を退けた。先代の無念を晴らし、本当の世界の夜明けを取り戻すための、最後の旅がいま始まる。
```
**次ノード:** `{type:text, bg:bg_road_night}` (auto-advance)
**params:**
```json
end_node
```

---

#### `end_node`
**演出パラメータ:**
- **BGM**: `bgm_quest_calm`
- **SE**: `—`
- **背景画像**: `bg_road_night`

**テキスト:**
```
「さて、まずは天に至るための『鍵』集めといこうか」英霊の声と共に、遠い空の向こうで雷鳴が轟いた。
```
**次ノード:** `{type:end_success}` (auto-advance)
**params:**
```json

```

---


