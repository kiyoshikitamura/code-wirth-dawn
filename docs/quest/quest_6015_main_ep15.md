# クエスト仕様書：6015 — 第15話「未来への楔」

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6015 |
| **Slug** | `main_ep15` |
| **クエスト種別** | メインエピソード（Main） |
| **推奨レベル** | 35 |
| **難度** | 4 |
| **依頼主** | 冒険者ギルド |
| **出現条件** | 前提クエストクリア: main_ep14 / 必須滞在拠点: loc_haryu |
| **サムネイル画像** | `/images/quests/bg_spot_karyu_thunder.png` |

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
Gold:3500|Rep:10
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
  └─ battle
      ├─[未来を繋ぐために、全てを捧げる]→ N/A
  └─ text_post_battle
  └─ text_post_battle2
  └─ end_node
```

### ノード詳細

#### `start`
**演出パラメータ:**
- **BGM**: `[要定義]`
- **SE**: `[要定義]`
- **背景画像**: `bg_ruins_field`

**テキスト:**
```
完全に崩壊し、焦土と化した都市の先に、空間の歪み――次元の裂け目のような異界への扉が口を開けていた。
```
**次ノード:** `{type:text, bg:bg_ruins_field}` (auto-advance)
**params:**
```json
text1
```

---

#### `text1`
**演出パラメータ:**
- **BGM**: `[要定義]`
- **SE**: `[要定義]`
- **背景画像**: `bg_ruins_field`

**テキスト:**
```
それは「天界への門」と呼ばれる、神々の領域へと続く結界だった。門の奥からは、地上の穢れを全て焼き尽くそうとする強烈な魔力が漏れ出ている。
```
**次ノード:** `{type:text, bg:bg_ruins_field}` (auto-advance)
**params:**
```json
text1_1
```

---

#### `text1_1`
**演出パラメータ:**
- **BGM**: `[要定義]`
- **SE**: `[要定義]`
- **背景画像**: `bg_ruins_field`

**テキスト:**
```
君は体を引き摺りながら、たった一人でその門の前に立った。君の背中には、これまで関わってきた数え切れないほどの命と、散っていった者たちの想いが乗っている。
```
**次ノード:** `{type:text, bg:bg_ruins_field}` (auto-advance)
**params:**
```json
text2
```

---

#### `text2`
**演出パラメータ:**
- **BGM**: `[要定義]`
- **SE**: `[要定義]`
- **背景画像**: `bg_spot_karyu_thunder`

**テキスト:**
```
『最終防衛ライン突破ヲ確認。これヨリ本機ハ最上位形態へと移行シ、地上ノ完全大粛清ヲ執行スル』
```
**次ノード:** `{type:text, bg:bg_spot_karyu_thunder}` (auto-advance)
**params:**
```json
text2_1
```

---

#### `text2_1`
**演出パラメータ:**
- **BGM**: `[要定義]`
- **SE**: `[要定義]`
- **背景画像**: `bg_spot_karyu_thunder`

**テキスト:**
```
裂け目から姿を現したのは、神の意志を直接代行する最強の使徒（ボス）だった。これまでの魔族や使徒たちとは次元の違うプレッシャーが、空間全体を押し潰さんばかりに膨れ上がる。
```
**次ノード:** `{type:text, bg:bg_spot_karyu_thunder}` (auto-advance)
**params:**
```json
text3
```

---

#### `text3`
**演出パラメータ:**
- **BGM**: `[要定義]`
- **SE**: `[要定義]`
- **背景画像**: `bg_spot_karyu_thunder`

**テキスト:**
```
（――ここまでか）君は一瞬だけ、己の限界を悟った。どんなに抗っても、人間一人の生涯では、天上の神々という絶対的な理には届かないのかもしれない。
```
**次ノード:** `{type:text, bg:bg_spot_karyu_thunder}` (auto-advance)
**params:**
```json
text3_1
```

---

#### `text3_1`
**演出パラメータ:**
- **BGM**: `[要定義]`
- **SE**: `[要定義]`
- **背景画像**: `bg_spot_karyu_thunder`

**テキスト:**
```
だが、退くわけにはいかない。君がここで戦う姿は、必ず誰かの……『次なる時代』の誰かの道標となるはずだ！
```
**次ノード:** `{type:text, bg:bg_spot_karyu_thunder}` (auto-advance)
**params:**
```json
battle
```

---

#### `battle`
**演出パラメータ:**
- **BGM**: `[要定義]`
- **SE**: `[要定義]`
- **背景画像**: `bg_spot_karyu_thunder`

**テキスト:**
```
「来い、神の遣い！俺の命と引き換えに、てめえのその冷たい羽を毟り取ってやる！！」君はありったけの闘気を振り絞り、特攻した。
```
**次ノード:** `{type:battle, enemy_group_id:6}` (auto-advance)
**params:**
```json
choice1
```

---

#### `text_post_battle`
**演出パラメータ:**
- **BGM**: `[要定義]`
- **SE**: `[要定義]`
- **背景画像**: `bg_spot_karyu_thunder`

**テキスト:**
```
幾千もの閃光が交差したのち、大音響と共に最強の使徒が爆散した。だが君も限界だった。膝から崩れ落ち、霞む視界の中で天界の門が一時的に閉ざされていくのを見る。
```
**次ノード:** `{type:text, bg:bg_spot_karyu_thunder}` (auto-advance)
**params:**
```json
text_post_battle2
```

---

#### `text_post_battle2`
**演出パラメータ:**
- **BGM**: `[要定義]`
- **SE**: `[要定義]`
- **背景画像**: `bg_spot_karyu_thunder`

**テキスト:**
```
「……どうやら、俺の旅はここまでのようだ。だが……扉の在り処は、確かに示したぞ……」
```
**次ノード:** `{type:text, bg:bg_spot_karyu_thunder}` (auto-advance)
**params:**
```json
end_node
```

---

#### `end_node`
**演出パラメータ:**
- **BGM**: `[要定義]`
- **SE**: `[要定義]`
- **背景画像**: `bg_spot_karyu_thunder`

**テキスト:**
```
激戦の末、天界への門は吹き飛び、世界は一時的な静寂を取り戻した。君は「生ける伝説（英霊）」として歴史に名を残したが、神々への叛逆はまだ終わっていない。次なる世代へ、この剣と意志を継げ。（第3部完）
```
**次ノード:** `{type:end_success}` (auto-advance)
**params:**
```json

```

---


