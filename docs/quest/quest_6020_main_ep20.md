# クエスト仕様書：6020 — 第20話「蒼き暁」

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6020 |
| **Slug** | `main_ep20` |
| **クエスト種別** | メインエピソード（Main） |
| **推奨レベル** | 25（Hard） |
| **難度** | 6 |
| **依頼主** | 冒険者ギルド |
| **出現条件** | 前提クエストクリア: main_ep19 / 滞在拠点: ローランド聖王国拠点 |
| **リピート** | アカウント通じて1回のみ（継承後も非表示） |
| **難易度Tier** | Hard（rec_level: 25） |
| **経過日数 (time_cost)** | 8（成功: 8日 / 失敗: 5日） |
| **ゲストNPC** | なし |
| **ノード数** | 13ノード（うち選択肢2件） |
| **サムネイル画像** | `/images/quests/bg_boss_altar.png` |

※BGM、SE、進行中の背景画像などはノードごとに指定します。

---

## 1. クエスト概要

### 短文説明
```
メインシナリオ第20話
```

### 長文説明
```
次元の最果て、天界の玉座。人間の運命を弄んできた主神との最終決戦。一介の傭兵から始まった長い旅路の果てに、蒼き暁が昇る。
```

---

## 2. 報酬定義

**CSV記載形式:**
```
Exp:5000|Gold:15000|Rep:50|Item:504|Justice:30
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
  └─ battle1
      ├─[主神へ決戦を挑む]→ N/A
  └─ text4
  └─ text4_1
  └─ battle2
      ├─[未来を穿つ一撃を放つ]→ N/A
  └─ text_post_battle
  └─ text_post_battle2
  └─ end_node
```

### ノード詳細

#### `start`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_boss_altar`

**テキスト:**
```
次元の最果て、「天界の玉座」。目も眩むような光の中に浮かび上がるのは、人間の運命を盤上で弄んできた『主神』の姿だった。
```
**次ノード:** `{type:text, bg:bg_boss_altar}` (auto-advance)
**params:**
```json
text1
```

---

#### `text1`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_boss_altar`

**テキスト:**
```
神には実体がなく、ただ純粋な光と魔力の濁流としてそこに座している。
```
**次ノード:** `{type:text, bg:bg_boss_altar}` (auto-advance)
**params:**
```json
text1_1
```

---

#### `text1_1`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_boss_altar`

**テキスト:**
```
『理解不能。何故生キル。何故足掻ク。定メラレタ運命ノ中デ消エ行クコソガ、弱キ者ニ許サレタ唯一ノ救済ナリ。我ラガ定メタ均衡コソガ完璧ナリ』
```
**次ノード:** `{type:text, bg:bg_boss_altar}` (auto-advance)
**params:**
```json
text2
```

---

#### `text2`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_boss_altar`

**テキスト:**
```
「黙れ……！俺たちが流した血は、お前たちの遊戯のためじゃない。俺たちが生きた意味は、俺たち自身で決める！」
```
**次ノード:** `{type:text, bg:bg_boss_altar}` (auto-advance)
**params:**
```json
text2_1
```

---

#### `text2_1`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_boss_altar`

**テキスト:**
```
君は天に向かって力強く吠えた。その声に応えるかのように、先代たちから受け継いだ意志――「英霊」たちの残留魔力が、君の剣に黄金の光を帯びさせる。
```
**次ノード:** `{type:text, bg:bg_boss_altar}` (auto-advance)
**params:**
```json
text3
```

---

#### `text3`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_boss_altar`

**テキスト:**
```
『愚カ者メ。神ノ威光ヲ前ニ、塵ト化セ』
```
**次ノード:** `{type:text, bg:bg_boss_altar}` (auto-advance)
**params:**
```json
battle1
```

---

#### `battle1`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_boss_altar`

**テキスト:**
```
主神の怒りが具現化し、空間全体を覆い尽くすほどの巨大な『神竜』の姿を現した。泣いても笑っても、これが世界を賭けた最後の戦いだ！
```
**次ノード:** `{type:battle, enemy_group_id:221}` (auto-advance)
**params:**
```json
choice1
```

---

#### `text4`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_boss_altar`

**テキスト:**
```
神竜の放つ業火を掻き消し、君の光の剣が神の鱗を打ち砕く！
```
**次ノード:** `{type:text, bg:bg_boss_altar}` (auto-advance)
**params:**
```json
text4_1
```

---

#### `text4_1`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_boss_altar`

**テキスト:**
```
『オォォォォォォォォォ！』絶叫と共に神竜が崩壊を始めるが、主神の核（コア）が暴走し、玉座もろとも君を道連れにしようと膨張し始めた。
```
**次ノード:** `{type:text, bg:bg_boss_altar}` (auto-advance)
**params:**
```json
battle2
```

---

#### `battle2`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_boss_altar`

**テキスト:**
```
もはや小細工は通用しない。この一撃で暴走する核を貫けなければ、全てが終わる。全身の霊力を切っ先に集めろ！
```
**次ノード:** `{type:battle, enemy_group_id:222}` (auto-advance)
**params:**
```json
choice2
```

---

#### `text_post_battle`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_boss_altar`

**テキスト:**
```
「うおおおおおおお！！」君の咆哮と共に放たれた一撃が、主神の核を正確に貫いた。数多の命を喰らい続けてきた神の力が、内部から連鎖的に崩壊していく。
```
**次ノード:** `{type:text, bg:bg_boss_altar}` (auto-advance)
**params:**
```json
text_post_battle2
```

---

#### `text_post_battle2`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_boss_altar`

**テキスト:**
```
君は吹き飛ばされ、意識が白く染まる直前……確かに、分厚い雲が晴れていくのを見た。
```
**次ノード:** `{type:text, bg:bg_boss_altar}` (auto-advance)
**params:**
```json
end_node
```

---

#### `end_node`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_road_day`

**テキスト:**
```
気がつけば君は、激戦を共に戦い抜いた仲間たちと地上に立っていた。遠い地平線に、見たこともないほど眩しい朝日――『蒼き暁』が昇り始めている。一人の傭兵から始まった長い長い旅路は、こうして誰も知らない本当の平和を掴み取ったのだ。
```
**次ノード:** `{type:end_success}` (auto-advance)
**params:**
```json

```

---


