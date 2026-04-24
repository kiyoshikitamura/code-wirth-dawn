# クエスト仕様書：6002 — 第2話「砂礫の国境線」

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6002 |
| **Slug** | `main_ep02` |
| **クエスト種別** | メインエピソード（Main） |
| **推奨レベル** | 2（Easy） |
| **難度** | 1 |
| **依頼主** | 王国軍 |
| **出現条件** | 前提クエストクリア: main_ep01 / 滞在拠点: ローランド聖王国拠点 |
| **リピート** | アカウント通じて1回のみ（継承後も非表示） |
| **難易度Tier** | Easy（rec_level: 2） |
| **経過日数 (time_cost)** | 3（成功: 3日 / 失敗: 2日） |
| **ゲストNPC** | ガウェイン（パーティ加入あり / クエスト終了後に離脱） |
| **クエスト完了後の拠点移動** | → マルカンド砂塵王国（オアシス都市） |
| **ノード数** | 14ノード（うち選択肢3件） |
| **サムネイル画像** | `/images/quests/bg_wasteland.png` |

※BGM、SE、進行中の背景画像などはノードごとに指定します。

---

## 1. クエスト概要

### 短文説明
```
メインシナリオ第2話
```

### 長文説明
```
国境警備任務に就いた君を待ち受けるのは、ただの野盗ではなかった。統率の取れた武装集団の背後に蠢く大国の影。ローランとマルカンドの国境地帯で、戦争の気配が静かに忍び寄る。
```

---

## 2. 報酬定義

**CSV記載形式:**
```
Exp:100|Gold:200|Rep:5|Order:5
```

---

## 3. シナリオノード構成

### 簡易フロー
```text
start
  └─ start
  └─ text0_1
  └─ text1
  └─ text1_1
      ├─[「隣国、マルカンドの兵士では？」]→ N/A
      ├─[「誰であろうと、斬るだけです」]→ N/A
  └─ text2
  └─ text2_1
  └─ text3
  └─ text3_1
  └─ battle
      ├─[武器を構える]→ N/A
  └─ text_post_battle
  └─ text_post_battle2
  └─ end_node
```

### ノード詳細

#### `start`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_wasteland`

**テキスト:**
```
名もなき村での野盗撃退の功績、あるいは小隊長ガウェインの引き立てにより、君はローランと砂塵王国マルカンドの国境地帯における警備任務に就くこととなった。
```
**次ノード:** `{type:text, bg:bg_wasteland}` (auto-advance)
**params:**
```json
text0_1
```

---

#### `text0_1`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_wasteland`

**テキスト:**
```
国境の荒野は見渡す限りの赤茶けた土と、吹き荒れる空風の音ばかりが続く。兵士たちの間には、得体の知れない緊張感が蔓延していた。
```
**次ノード:** `{type:text, bg:bg_wasteland}` (auto-advance)
**params:**
```json
text1
```

---

#### `text1`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_wasteland`

**テキスト:**
```
「最近、この辺りでは武装した集団が頻繁に出没している。ただのゴロツキや盗賊団にしては、妙に動きに統率が取れているのが気掛かりだ」
```
**次ノード:** `{type:text, bg:bg_wasteland, speaker_image_url:/images/npcs/npc_guest_gawain.png}` (auto-advance)
**params:**
```json
text1_1
```

---

#### `text1_1`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_wasteland`

**テキスト:**
```
ガウェインは厳しい顔で地平線を睨んでいる。「それに……あの野盗どもが使っていた武器の質。どう見てもどこかの正規のものだ」
```
**次ノード:** `{type:text, bg:bg_wasteland, speaker_image_url:/images/npcs/npc_guest_gawain.png}` (auto-advance)
**params:**
```json
choice1
```

---

#### `text2`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_wasteland`

**テキスト:**
```
「……かもしれん。マルカンド側も、我が王国の膨張を警戒して水面下で作戦を展開しているという噂はある。いずれにせよ、油断するなよ」
```
**次ノード:** `{type:text, bg:bg_wasteland, speaker_image_url:/images/npcs/npc_guest_gawain.png}` (auto-advance)
**params:**
```json
text2_1
```

---

#### `text2_1`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_wasteland`

**テキスト:**
```
もしも相手がマルカンドの息のかかった者たちであるならば、これは単なる盗賊討伐ではなく「国境紛争」の引き金になりかねない。君はゴクリと唾を呑み込んだ。
```
**次ノード:** `{type:text, bg:bg_wasteland}` (auto-advance)
**params:**
```json
text3
```

---

#### `text3`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_wasteland`

**テキスト:**
```
やがて、砂丘の向こうから黒い布で顔を覆った集団が、小隊を半包囲するような陣形で音もなく接近してくるのが見えた。
```
**次ノード:** `{type:text, bg:bg_wasteland}` (auto-advance)
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
その足運びは明らかに素人のそれではない。練度を積んだ軍人の歩法だ。
```
**次ノード:** `{type:text, bg:bg_wasteland}` (auto-advance)
**params:**
```json
battle
```

---

#### `battle`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_wasteland`

**テキスト:**
```
「舌の根も乾かぬうちに来たぞ！陣形を崩すな、背中を取られるなよ！」
```
**次ノード:** `{type:battle, enemy_group_id:200, speaker_image_url:/images/npcs/npc_guest_gawain.png}` (auto-advance)
**params:**
```json
choice2
```

---

#### `text_post_battle`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_wasteland`

**テキスト:**
```
統率の取れた激しい攻撃を辛くも凌ぎ切り、一帯の制圧に成功した。死体の顔を確認しようと布を剥ぐが、認識章のようなものは一切持っていない。
```
**次ノード:** `{type:text, bg:bg_wasteland}` (auto-advance)
**params:**
```json
text_post_battle2
```

---

#### `text_post_battle2`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_wasteland`

**テキスト:**
```
だが、彼らが落とした武器には、意図的に削り潰された「正規軍の紋章」らしき痕跡が残されていた。ガウェインは無言でそれを蹴り飛ばす。
```
**次ノード:** `{type:text, bg:bg_wasteland}` (auto-advance)
**params:**
```json
end_node
```

---

#### `end_node`
**演出パラメータ:**
- **BGM**: `bgm_quest_tense`
- **SE**: `—`
- **背景画像**: `bg_wasteland`

**テキスト:**
```
国境地帯に、泥沼の戦乱を予感させる重く不穏な空気が漂い始めている……。
```
**次ノード:** `{type:end_success}` (auto-advance)
**params:**
```json

```

---


