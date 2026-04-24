# クエスト仕様書：6003 — 第3話「オアシスの陰謀」

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6003 |
| **Slug** | `main_ep03` |
| **クエスト種別** | メインエピソード（Main） |
| **推奨レベル** | 3（Easy） |
| **難度** | 1 |
| **依頼主** | 交易商会 |
| **出現条件** | 前提クエストクリア: main_ep02 / 滞在拠点: マルカンド拠点 |
| **リピート** | アカウント通じて1回のみ（継承後も非表示） |
| **難易度Tier** | Easy（rec_level: 3） |
| **経過日数 (time_cost)** | 3（成功: 3日 / 失敗: 2日） |
| **ゲストNPC** | ガウェイン（パーティ加入あり / クエスト終了後に離脱） |
| **選択肢分岐** | あり（探索方法の選択） |
| **サムネイル画像** | `/images/quests/bg_desert.png` |

※BGM、SE、進行中の背景画像などはノードごとに指定します。

---

## 1. クエスト概要

### 短文説明
```
メインシナリオ第3話
```

### 長文説明
```
砂塵王国マルカンドのオアシスの村。平和に見えるこの地に潜む間諜の影。君は戦場で培った直感を頼りに、水面下で蠢く陰謀の正体を暴こうとする。
```

---

## 2. 報酬定義

**CSV記載形式:**
```
Exp:120|Gold:300|Rep:10|Justice:5
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
  └─ text2_2
      ├─[「すぐに周囲を探索する」]→ N/A
      ├─[「ガウェインに指示を仰ぐ」]→ N/A
  └─ gawain_talk
  └─ search_area
  └─ text3
  └─ text3_1
  └─ text4
  └─ battle
      ├─[「なぜこんな非道を！」]→ N/A
  └─ text_post_battle
  └─ text_post_battle2
  └─ end_node
```

### ノード詳細

#### `start`
**演出パラメータ:**
- **BGM**: `bgm_quest_mystery`
- **SE**: `—`
- **背景画像**: `bg_desert`

**テキスト:**
```
国境地帯での任務を終え、君とガウェインの属する小隊はマルカンド領内にある小さなオアシス都市に駐屯していた。
```
**次ノード:** `{type:text, bg:bg_desert}` (auto-advance)
**params:**
```json
text1
```

---

#### `text1`
**演出パラメータ:**
- **BGM**: `bgm_quest_mystery`
- **SE**: `—`
- **背景画像**: `bg_desert`

**テキスト:**
```
ここは本来、両国を繋ぐ貴重な水源地であり、交易の要所として中立的な立場を保っているはずの街だ。
```
**次ノード:** `{type:text, bg:bg_desert}` (auto-advance)
**params:**
```json
text1_1
```

---

#### `text1_1`
**演出パラメータ:**
- **BGM**: `bgm_quest_mystery`
- **SE**: `—`
- **背景画像**: `bg_desert`

**テキスト:**
```
しかし街を歩く人々の瞳には、王国出身である君たち傭兵や兵士に対する明確な警戒態勢——あるいは憎悪——の色が浮かんでいる。
```
**次ノード:** `{type:text, bg:bg_desert}` (auto-advance)
**params:**
```json
text2
```

---

#### `text2`
**演出パラメータ:**
- **BGM**: `bgm_quest_mystery`
- **SE**: `—`
- **背景画像**: `bg_desert`

**テキスト:**
```
ある朝、静寂を切り裂くような悲鳴が広場から上がった。「大変だ！井戸があくせく泡を立てている。何者かが毒を撒いたに違いない！」
```
**次ノード:** `{type:text, bg:bg_desert}` (auto-advance)
**params:**
```json
text2_1
```

---

#### `text2_1`
**演出パラメータ:**
- **BGM**: `bgm_quest_mystery`
- **SE**: `—`
- **背景画像**: `bg_desert`

**テキスト:**
```
街はあっという間に騒然となる。砂漠における水源の喪失は、すなわち街全体の死を意味する。数日でこの街は干上がるだろう。
```
**次ノード:** `{type:text, bg:bg_desert}` (auto-advance)
**params:**
```json
text2_2
```

---

#### `text2_2`
**演出パラメータ:**
- **BGM**: `bgm_quest_mystery`
- **SE**: `—`
- **背景画像**: `bg_desert`

**テキスト:**
```
広場に面した宿屋から飛び出した君は、足元で倒れ伏す町民の姿を目にした。状況は一刻を争う。
```
**次ノード:** `{type:text, bg:bg_desert}` (auto-advance)
**params:**
```json
choice_search
```

---

#### `gawain_talk`
**演出パラメータ:**
- **BGM**: `bgm_quest_mystery`
- **SE**: `—`
- **背景画像**: `bg_desert`

**テキスト:**
```
「慌てるな。この短時間だ、実行犯はまだ遠くへは行けていないはずだ。慌てて走り回るより、地面の違和感を探せ」
```
**次ノード:** `{type:text, bg:bg_desert, speaker_image_url:/images/npcs/npc_guest_gawain.png}` (auto-advance)
**params:**
```json
search_area
```

---

#### `search_area`
**演出パラメータ:**
- **BGM**: `bgm_quest_mystery`
- **SE**: `—`
- **背景画像**: `bg_slum`

**テキスト:**
```
砂地と石畳の隙間に残された不自然な足跡。足の運びが深く急いでいるそれは、明らかに町民のものではない。
```
**次ノード:** `{type:text, bg:bg_slum}` (auto-advance)
**params:**
```json
text3
```

---

#### `text3`
**演出パラメータ:**
- **BGM**: `bgm_quest_mystery`
- **SE**: `—`
- **背景画像**: `bg_slum`

**テキスト:**
```
君はその痕跡を辿り、街の裏手にある岩場へと回った。そこには、毒瓶のようなものを片付けている怪しい影が三人。
```
**次ノード:** `{type:text, bg:bg_slum}` (auto-advance)
**params:**
```json
text3_1
```

---

#### `text3_1`
**演出パラメータ:**
- **BGM**: `bgm_quest_mystery`
- **SE**: `—`
- **背景画像**: `bg_slum`

**テキスト:**
```
「チッ……こんなに早く嗅ぎつけられたか。やはり王国の猟犬は鼻が利く」
```
**次ノード:** `{type:text, bg:bg_slum}` (auto-advance)
**params:**
```json
text4
```

---

#### `text4`
**演出パラメータ:**
- **BGM**: `bgm_quest_mystery`
- **SE**: `—`
- **背景画像**: `bg_slum`

**テキスト:**
```
男たちは悪びれる様子もなく、むしろ「王国への忠誠」を示すような過激な台詞を吐き捨てながら、刃を抜いた。
```
**次ノード:** `{type:text, bg:bg_slum}` (auto-advance)
**params:**
```json
battle
```

---

#### `battle`
**演出パラメータ:**
- **BGM**: `bgm_quest_mystery`
- **SE**: `—`
- **背景画像**: `bg_slum`

**テキスト:**
```
彼らは王国軍の強硬派を名乗る工作員たちだった。この街に戦争の火種を落とし、大義名分を作ろうとしているのだ！
```
**次ノード:** `{type:battle, enemy_group_id:201}` (auto-advance)
**params:**
```json
choice_battle
```

---

#### `text_post_battle`
**演出パラメータ:**
- **BGM**: `bgm_quest_mystery`
- **SE**: `—`
- **背景画像**: `bg_slum`

**テキスト:**
```
工作員たちを撃退し、懐から解毒薬らしき成分を確保することに成功した。死の間際、口から血を流す男が薄ら笑いを浮かべる。
```
**次ノード:** `{type:text, bg:bg_slum}` (auto-advance)
**params:**
```json
text_post_battle2
```

---

#### `text_post_battle2`
**演出パラメータ:**
- **BGM**: `bgm_quest_mystery`
- **SE**: `—`
- **背景画像**: `bg_slum`

**テキスト:**
```
「遅いさ……。火種はもはや止められん。俺たちの血が、聖戦の狼煙となるのだ……」
```
**次ノード:** `{type:text, bg:bg_slum}` (auto-advance)
**params:**
```json
end_node
```

---

#### `end_node`
**演出パラメータ:**
- **BGM**: `bgm_quest_mystery`
- **SE**: `—`
- **背景画像**: `bg_slum`

**テキスト:**
```
解毒薬により井戸の最悪の事態は免れたが、これが仕組まれた「開戦の口実」であることは明白だった。君の胸に、重い鉛のような感情が沈んでいく。
```
**次ノード:** `{type:end_success}` (auto-advance)
**params:**
```json

```

---


