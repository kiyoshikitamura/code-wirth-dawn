# クエスト仕様書：6008 — 第8話「夜霧の凶刃」

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6008 |
| **Slug** | `main_ep08` |
| **クエスト種別** | メインエピソード（Main） |
| **推奨レベル** | 8（Hard） |
| **難度** | 2 |
| **依頼主** | 忍び衆 |
| **出現条件** | 前提クエストクリア: main_ep07 / 滞在拠点: 夜刀神国拠点 |
| **リピート** | アカウント通じて1回のみ（継承後も非表示） |
| **難易度Tier** | Hard（rec_level: 8） |
| **経過日数 (time_cost)** | 1（成功: 1日 / 失敗: 1日） |
| **ゲストNPC** | なし |
| **サムネイル画像** | `/images/quests/bg_tavern_night.png` |

※BGM、SE、進行中の背景画像などはノードごとに指定します。

---

## 1. クエスト概要

### 短文説明
```
メインシナリオ第8話
```

### 長文説明
```
神都・出雲の夜に忍び寄る凶刃。暗部の刺客が君を狙う理由とは。霧に煙る路地裏で、暗殺者との死闘が幕を開ける。
```

---

## 2. 報酬定義

**CSV記載形式:**
```
Exp:350|Gold:900|Rep:10
```

---

## 3. シナリオノード構成

### 簡易フロー
```text
start
  └─ start
  └─ text1
  └─ text2
  └─ text3
  └─ text3_1
  └─ text4
  └─ battle
      ├─[暗闇の中で迎撃する]→ N/A
  └─ text5
  └─ text5_1
  └─ battle2
      ├─[生き残るために命を削る]→ N/A
  └─ end_node
```

### ノード詳細

#### `start`
**演出パラメータ:**
- **BGM**: `bgm_quest_mystery`
- **SE**: `—`
- **背景画像**: `bg_tavern_night`

**テキスト:**
```
夜刀神国に入境して数日が経った。君は都からは遠く離れた、辺境に近い寂れた宿屋で久しぶりの休息を取っていた。
```
**次ノード:** `{type:text, bg:bg_tavern_night}` (auto-advance)
**params:**
```json
text1
```

---

#### `text1`
**演出パラメータ:**
- **BGM**: `bgm_quest_mystery`
- **SE**: `—`
- **背景画像**: `bg_tavern_night`

**テキスト:**
```
粗末なベッドに横たわり、これまでの激戦で負った傷を癒す。だが、傭兵として染み付いた勘が、無意識に危険を察知して君の眠りを浅くしていた。
```
**次ノード:** `{type:text, bg:bg_tavern_night}` (auto-advance)
**params:**
```json
text2
```

---

#### `text2`
**演出パラメータ:**
- **BGM**: `bgm_quest_mystery`
- **SE**: `—`
- **背景画像**: `bg_tavern_night`

**テキスト:**
```
真夜中。窓の外で、草木が擦れるのとは明らかに違う、衣擦れの音が微かに響いた。さらには窓ガラスが立てる、細かく不自然な振動。
```
**次ノード:** `{type:text, bg:bg_tavern_night}` (auto-advance)
**params:**
```json
text3
```

---

#### `text3`
**演出パラメータ:**
- **BGM**: `bgm_quest_mystery`
- **SE**: `—`
- **背景画像**: `bg_tavern_night`

**テキスト:**
```
「……囲まれているな。しかもプロだ」君はゆっくりと身を起こし、枕元に置いていた剣の柄を握る。
```
**次ノード:** `{type:text, bg:bg_tavern_night}` (auto-advance)
**params:**
```json
text3_1
```

---

#### `text3_1`
**演出パラメータ:**
- **BGM**: `bgm_quest_mystery`
- **SE**: `—`
- **背景画像**: `bg_tavern_night`

**テキスト:**
```
この国は平穏に見えて、裏では各勢力が血みどろの暗闘を繰り広げている。君が関所に現れた情報、あるいは王国の生き残りであるという事実が、誰かの気に障ったのだろうか。
```
**次ノード:** `{type:text, bg:bg_tavern_night}` (auto-advance)
**params:**
```json
text4
```

---

#### `text4`
**演出パラメータ:**
- **BGM**: `bgm_quest_mystery`
- **SE**: `—`
- **背景画像**: `bg_tavern_night`

**テキスト:**
```
次の瞬間、扉が音もなく吹き飛び、煙幕と共に黒装束の集団が部屋になだれ込んできた！
```
**次ノード:** `{type:text, bg:bg_tavern_night}` (auto-advance)
**params:**
```json
battle
```

---

#### `battle`
**演出パラメータ:**
- **BGM**: `bgm_quest_mystery`
- **SE**: `—`
- **背景画像**: `bg_tavern_night`

**テキスト:**
```
「標的を確認。……これより排除する」感情の一切こもっていない声と共に、鋭い刃が暗闇から迫る。
```
**次ノード:** `{type:battle, enemy_group_id:206}` (auto-advance)
**params:**
```json
choice1
```

---

#### `text5`
**演出パラメータ:**
- **BGM**: `bgm_quest_mystery`
- **SE**: `—`
- **背景画像**: `bg_tavern_night`

**テキスト:**
```
数合の打ち合いの末、第一波を切り伏せた。だが、死体は音もなく崩れ落ち、悲鳴一つ上げない。
```
**次ノード:** `{type:text, bg:bg_tavern_night}` (auto-advance)
**params:**
```json
text5_1
```

---

#### `text5_1`
**演出パラメータ:**
- **BGM**: `bgm_quest_mystery`
- **SE**: `—`
- **背景画像**: `bg_tavern_night`

**テキスト:**
```
「ただのゴロツキじゃない……夜刀の暗部（プロ）か！」息をつく暇もなく、窓からさらなる刺客が音もなく滑り込んでくる。
```
**次ノード:** `{type:text, bg:bg_tavern_night}` (auto-advance)
**params:**
```json
battle2
```

---

#### `battle2`
**演出パラメータ:**
- **BGM**: `bgm_quest_mystery`
- **SE**: `—`
- **背景画像**: `bg_tavern_night`

**テキスト:**
```
「抵抗は無意味だ。貴様はここで夜霧に消える運命にある」月明かりに照らされた刃が乱舞する！
```
**次ノード:** `{type:battle, enemy_group_id:207}` (auto-advance)
**params:**
```json
choice2
```

---

#### `end_node`
**演出パラメータ:**
- **BGM**: `bgm_quest_mystery`
- **SE**: `—`
- **背景画像**: `bg_tavern_night`

**テキスト:**
```
最後の刺客を窓の外へ蹴り落とすと、夜は再び不気味なほどの静寂を取り戻した。誰が、何の目的で刺客を差し向けたのか……夜刀の闇は深く、底知れないほど冷たい。
```
**次ノード:** `{type:end_success}` (auto-advance)
**params:**
```json

```

---


