# クエスト仕様書：6104 — 黄金の沈黙 ―マルカンド、禁忌の王墓―

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6104 |
| **Slug** | `qst_spot_markand` |
| **クエスト種別** | スポットシナリオ / ダンジョン探索（Special） |
| **推奨レベル** | 20（Hard） |
| **難度** | 5 |
| **依頼主** | 砂漠の語り部 |
| **出現条件** | メインep10クリア / マルカンド拠点滞在 / 混沌(Chaos)50%以上 |
| **リピート** | 現世代で1回（継承後は再出現） |
| **難易度Tier** | Hard（rec_level: 20） |
| **経過日数 (time_cost)** | 7（成功: 7日 / 失敗: 5日） |
| **ノード数** | [CSV作成後に追記] |
| **サムネイル画像** | `/images/quests/bg_spot_markand_king.png` |

※BGM、SE、進行中の背景画像などはノードごとに指定します。

---

## 1. クエスト概要

### 短文説明
```
都を蝕む砂の病。不可視の呪いに守られた「禁忌の王墓」で、死の知略に挑め。
```

### 長文説明
```
マルカンドの地下深く、数千年間呪いに守られてきた「無名王の王墓」。
一歩進むたびに命を削る「呪い」と「言葉の罠」が待ち受ける。
謎を解き明かし、最深部に眠る王の呪いを止めろ。
```

---

## 2. 報酬定義

**ルートA（心臓破壊ルート）CSV記載形式:**
```
Exp:500|Gold:10000|Rep:200|Item:632
```

**ルートB（心臓を宿すルート）— endノードparamsで付与:**
```
Exp:500|Rep:-100|Item:631
```

### 報酬アイテム詳細

| ID | Slug | 名前 | Type | 効果 | 入手 |
|---|---|---|---|---|---|
| 631 | `spot_desert_curse` | 砂塵の支配 | skill(card) | dmg20(全体)+DEF DOWN(3T), deck_cost:12 | ルートB |
| 632 | `spot_sand_cleaver` | 砂王の断罪刃 | equipment/weapon | ATK+40, DEF-15 | ルートA |

---

## 3. シナリオノード構成

### 全体フロー
```text
start
  └─[続ける]→ trap_01 (鏡の間)
       ├─[正解の像]→ trap_02
       └─[不正解の像]→ battle_trap_01
            └─[勝利]→ trap_02
                 ├─[正解]→ trap_03
                 └─[不正解]→ battle_trap_02
                      └─[勝利]→ trap_03
                           ├─[正解]→ boss_king
                           └─[不正解]→ battle_trap_03
                                └─[勝利]→ boss_king
       boss_king
            ├─[勝利]→ final_choice
            │    ├─[心臓を破壊]→ end_break
            │    └─[心臓を宿す]→ end_curse
            └─[敗北]→ end_failure
```

### ノード詳細

#### `start`（type: text）
- **BGM**: `bgm_markand` / **背景**: `bg_spot_markand_ruins`

**テキスト:**
```
王墓の入り口だ。
石板には「王は右手に真実を、左手に沈黙を、足元に謙譲を求めた」とある。
（※これ以降、ノードを進むたびに「呪い蓄積」によるHPダメージのギミックが発生する）
```
**params:** `{"type":"text", "bgm":"bgm_markand", "bg":"bg_spot_markand_ruins"}`

---

#### `trap_01`（type: text）
- **BGM**: `bgm_quest_mystery` / **背景**: `bg_spot_markand_mirror`

**テキスト:**
```
第1の審判：鏡の間
「太陽の光をどの偶像に捧げるか？」
```
**選択肢:**
| ラベル | 次ノード |
|--------|---------|
| 正解の像を選ぶ | `trap_02` |
| 不正解の像を選ぶ | `battle_trap_01` |

---

#### `battle_trap_01`（type: battle）
- **BGM**: `bgm_battle_strong` / **背景**: `bg_spot_markand_mirror`

**テキスト:** `罠だ！ 光の衛兵が襲いかかってきた！`
**params:** `{"type":"battle", "bgm":"bgm_battle_strong", "bg":"bg_spot_markand_mirror", "enemy_group_id":"spot_markand_guard_1"}`

---

#### `trap_02`（type: text）
- **BGM**: `bgm_quest_mystery` / **背景**: `bg_spot_markand_mirror`

**テキスト:**
```
第2の審判：秤の間
「あなたの手に最も重い物を乗せよ」
```
**選択肢:**
| ラベル | 次ノード |
|--------|---------|
| 正解を選ぶ | `trap_03` |
| 不正解を選ぶ | `battle_trap_02` |

---

#### `battle_trap_02`（type: battle）
- **BGM**: `bgm_battle_strong` / **背景**: `bg_spot_markand_mirror`

**テキスト:** `罠に引っかかった！ 砂のゴーレムが召喚された！`
**params:** `{"type":"battle", "bgm":"bgm_battle_strong", "bg":"bg_spot_markand_mirror", "enemy_group_id":"spot_markand_guard_2"}`

---

#### `trap_03`（type: text）
- **BGM**: `bgm_quest_mystery` / **背景**: `bg_spot_markand_mirror`

**テキスト:**
```
第3の審判：棺の間
「死者に捧げるべき言葉は何か」
```
**選択肢:**
| ラベル | 次ノード |
|--------|---------|
| 正解を選ぶ | `boss_king` |
| 不正解を選ぶ | `battle_trap_03` |

---

#### `battle_trap_03`（type: battle）
- **BGM**: `bgm_battle_strong` / **背景**: `bg_spot_markand_mirror`

**テキスト:** `最後の守護者が目覚めた！ 混成の守護者が襲いかかる！`
**params:** `{"type":"battle", "bgm":"bgm_battle_strong", "bg":"bg_spot_markand_mirror", "enemy_group_id":"spot_markand_guard_3"}`

---

#### `boss_king`（type: battle）
- **BGM**: `bgm_spot_final_boss` / **背景**: `bg_spot_markand_king`

**テキスト:**
```
実体のない「無名王の影」が現れた。王墓を荒らす不遜な者に牙を剥く！
```
**params:** `{"type":"battle", "bgm":"bgm_spot_final_boss", "bg":"bg_spot_markand_king", "enemy_group_id":"spot_markand_king"}`

---

#### `final_choice`（type: text）
- **BGM**: `bgm_spot_final_choice` / **背景**: `bg_spot_markand_king`

**テキスト:**
```
王を打倒し、「王の心臓」を前にした。
この呪いの源をどうするべきか。
```
**選択肢:**
| ラベル | 次ノード |
|--------|---------|
| 心臓を破壊し呪いを断つ | `end_break` |
| 心臓を宿し呪いを制御する | `end_curse` |

---

#### `end_break`（type: end）
**テキスト:**
```
心臓を破壊した。王墓は崩壊し、街は救われた。
多大な名声を得たが、古代の知恵は永遠に失われた。砂王の断罪刃を手に入れた。
```
**params:** `{"type":"end", "result":"success", "rewards":{"exp":500, "gold":10000, "reputation":200, "items":["632"]}}`

---

#### `end_curse`（type: end）
**テキスト:**
```
その身に心臓を宿した。
砂の紋章が体に刻まれ、恐るべき力を手に入れた。
人々からは畏れられるようになるだろう。固有スキル『砂塵の支配』を入手した！
```
**params:** `{"type":"end", "result":"success", "rewards":{"exp":500, "reputation":-100, "items":["631"]}}`

---

#### `end_failure`（type: end）
**テキスト:**
```
王墓の呪いに蝕まれ、意識が遠のいていく。砂が全てを覆い隠した。
```
**params:** `{"type":"end", "result":"failure"}`
