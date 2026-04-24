# クエスト仕様書：6101 — 忘却の五英霊 ―レガリア崩落の真実―

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6101 |
| **Slug** | `qst_spot_roland` |
| **クエスト種別** | スポットシナリオ（Special） |
| **推奨レベル** | 20（Hard） |
| **難度** | 5 |
| **依頼主** | 聖騎士団 |
| **出現条件** | メインep08クリア / 聖王国拠点滞在 / 秩序(Order)50%以上 |
| **リピート** | 現世代で1回（継承後は再出現） |
| **難易度Tier** | Hard（rec_level: 20） |
| **経過日数 (time_cost)** | 7（成功: 7日 / 失敗: 5日） |
| **ノード数** | [CSV作成後に追記] |
| **サムネイル画像** | `/images/quests/bg_spot_roland_tomb.png` |

※BGM、SE、進行中の背景画像などはノードごとに指定します。

---

## 1. クエスト概要

### 短文説明
```
王都レガリアに突如現れた「五英霊」。暴走する彼らを止め、真実を暴け。
```

### 長文説明
```
王都レガリアで、禁忌の術「英霊再臨」が失敗した。
かつての守護者である『五英霊』が、王家への復讐者として蘇り、街を破壊している。
避難民と共に地下墓所へ逃れ、英霊たちの暴走を止める手段を探せ。
光り輝くレガリアの歴史の裏に隠された「犠牲と裏切り」の真実とは。
```

---

## 2. 報酬定義

**ルートA（討伐ルート）CSV記載形式:**
```
Exp:500|Gold:10000|Rep:200|Item:602
```

**ルートB（封印ルート）— endノードparamsで付与:**
```
Exp:500|Rep:-100|Item:603
```

### 報酬アイテム詳細

| ID | Slug | 名前 | Type | 効果 | 入手 |
|---|---|---|---|---|---|
| 601 | `spot_eclipse_bind` | 五英霊の誓約 | passive | DEF+3, HP+5 | 道中(get_promise) |
| 602 | `spot_god_robe` | 神の法衣 | equipment/armor | DEF+8, HP+50 | ルートA |
| 603 | `spot_regalia_brave` | 五星の加護 | skill(card) | dmg35+ATK UP(5T), deck_cost:12 | ルートB |

---

## 3. シナリオノード構成

### 全体フロー
```text
start
  └─[続ける]→ escape_underground
       └─[続ける]→ battle_protos
            ├─[勝利]→ get_promise
            │    └─[続ける]→ boss_01_eluka
            │         ├─[勝利]→ boss_02_baram
            │         │    ├─[勝利]→ boss_03_shirasu
            │         │    │    ├─[勝利]→ boss_04_lyra
            │         │    │    │    ├─[勝利]→ boss_05_alvin
            │         │    │    │    │    ├─[勝利]→ final_choice
            │         │    │    │    │    │    ├─[討伐する]→ end_kill
            │         │    │    │    │    │    └─[封印する]→ end_seal
            │         │    │    │    │    └─[敗北]→ end_failure
            │         │    │    │    └─[敗北]→ end_failure
            │         │    │    └─[敗北]→ end_failure
            │         │    └─[敗北]→ end_failure
            │         └─[敗北]→ end_failure
            └─[敗北]→ end_failure
```

### ノード詳細

#### `start`（type: text）
**演出パラメータ:**
- **BGM**: `bgm_roland`
- **背景画像**: `bg_spot_roland_fire`

**テキスト:**
```
「慈愛の聖女」が祈るだけで噴水が血に染まり、「不滅の王」が睨むだけで城門が崩れる。
王家の禁術により蘇った『五英霊』が、王都を破壊し始めた。
人々を守りながら、安全な王宮の地下墓所へと逃げ込むしかない。
```
**params:**
```json
{"type":"text", "bgm":"bgm_roland", "bg":"bg_spot_roland_fire", "next":"escape_underground"}
```

---

#### `escape_underground`（type: text）
**演出パラメータ:**
- **BGM**: `bgm_quest_mystery`
- **背景画像**: `bg_spot_roland_tomb`

**テキスト:**
```
地下墓所の奥深くで、歴史から抹消された真の英雄墓所を発見した。
だが、そこには自動兵器が立ち塞がっていた！
```
**params:**
```json
{"type":"text", "bgm":"bgm_quest_mystery", "bg":"bg_spot_roland_tomb", "next":"battle_protos"}
```

---

#### `battle_protos`（type: battle）
**演出パラメータ:**
- **BGM**: `bgm_battle_strong`
- **背景画像**: `bg_spot_roland_tomb`

| 設定 | 値 |
|-----|-----|
| 敵グループ | `spot_roland_protos` (墓所の守護者プロトス) |

**params:**
```json
{"type":"battle", "bgm":"bgm_battle_strong", "bg":"bg_spot_roland_tomb", "enemy_group_id":"spot_roland_protos"}
```

---

#### `get_promise`（type: reward）
**演出パラメータ:**
- **BGM**: `bgm_quest_mystery`
- **背景画像**: `bg_spot_roland_tomb`

**テキスト:**
```
守護者を倒し、奥の祭壇から輝く石を手に入れた。
パッシブスキル『五英霊の誓約』を入手した。これがあれば、彼らの暴走する絶技を防げるかもしれない。
```
**params:**
```json
{"type":"reward", "bgm":"bgm_quest_mystery", "bg":"bg_spot_roland_tomb", "items":["601"]}
```

---

#### `boss_01_eluka`（type: battle）
**演出パラメータ:**
- **BGM**: `bgm_battle_strong`
- **背景画像**: `bg_spot_roland_tomb`

**テキスト:**
```
地下まで追ってきた英霊の一人、「慈愛の聖女エルーカ」が立ちはだかる。
彼女は病の身代わりとして地下に幽閉され、見捨てられた過去を持っていた。
```
| 設定 | 値 |
|-----|-----|
| 敵グループ | `spot_roland_eluka` (聖女エルーカ) |

**params:**
```json
{"type":"battle", "bgm":"bgm_battle_strong", "bg":"bg_spot_roland_tomb", "enemy_group_id":"spot_roland_eluka"}
```

---

#### `boss_02_baram`（type: battle）
**演出パラメータ:**
- **BGM**: `bgm_battle_strong`
- **背景画像**: `bg_spot_roland_tomb`

**テキスト:**
```
地下通路を塞ぐように、黒いローブの男が浮かんでいる。
「知恵の賢者バラム」。王に禁術の知識を独占され、幽閉の末に処刑された魔術師だ。
```
| 設定 | 値 |
|-----|-----|
| 敵グループ | `spot_roland_baram` (賢者バラム) |

**params:**
```json
{"type":"battle", "bgm":"bgm_battle_strong", "bg":"bg_spot_roland_tomb", "enemy_group_id":"spot_roland_baram"}
```

---

#### `boss_03_shirasu`（type: battle）
**演出パラメータ:**
- **BGM**: `bgm_battle_strong`
- **背景画像**: `bg_spot_roland_tomb`

**テキスト:**
```
巨大な盾を構えた亡霊が道を阻む。
「盾の守護者シラス」。王の身代わりとなって毒杯を仰いだ、忠義の騎士。
```
| 設定 | 値 |
|-----|-----|
| 敵グループ | `spot_roland_shirasu` (盾のシラス) |

**params:**
```json
{"type":"battle", "bgm":"bgm_battle_strong", "bg":"bg_spot_roland_tomb", "enemy_group_id":"spot_roland_shirasu"}
```

---

#### `boss_04_lyra`（type: battle）
**演出パラメータ:**
- **BGM**: `bgm_battle_strong`
- **背景画像**: `bg_spot_roland_tomb`

**テキスト:**
```
蒼い矢が闇を切り裂いた。壁に背を預ける女の姿が見える。
「千里の射手リラ」。戦勝の立役者でありながら、口封じのために暗殺された弓の名手。
```
| 設定 | 値 |
|-----|-----|
| 敵グループ | `spot_roland_lyra` (射手リラ) |

**params:**
```json
{"type":"battle", "bgm":"bgm_battle_strong", "bg":"bg_spot_roland_tomb", "enemy_group_id":"spot_roland_lyra"}
```

---

#### `boss_05_alvin`（type: battle）
**演出パラメータ:**
- **BGM**: `bgm_spot_final_boss`
- **背景画像**: `bg_spot_roland_core`

**テキスト:**
```
最後に立ちはだかったのは「不滅の王アルヴィン」。
建国の父たる彼は、仲間の犠牲の上に国を築いた自責と憎悪で狂っていた。
```
| 設定 | 値 |
|-----|-----|
| 敵グループ | `spot_roland_alvin` (不滅の王アルヴィン) |

**params:**
```json
{"type":"battle", "bgm":"bgm_spot_final_boss", "bg":"bg_spot_roland_core", "enemy_group_id":"spot_roland_alvin"}
```

---

#### `final_choice`（type: text）
**演出パラメータ:**
- **BGM**: `bgm_spot_final_choice`
- **背景画像**: `bg_spot_roland_core`

**テキスト:**
```
全ての英霊を無力化した。
駆けつけた現国王は「彼らを完全に消し去り、英雄の魔力的遺産を回収せよ」と身勝手な命令を下した。
どうする？
```
**選択肢:**
| ラベル | 次ノード |
|--------|---------|
| 王の命令に従い討伐する | `end_kill` |
| 誓約の力で彼らを安らかに封印する | `end_seal` |

---

#### `end_kill`（type: end）
**テキスト:**
```
王家の命令に従い、怨嗟の根源を断った。王家は不都合な真実を隠蔽した。
あなたは新時代の英雄として祭り上げられた。
```
**params:**
```json
{"type":"end", "result":"success", "rewards":{"exp":500, "gold":10000, "reputation":200, "items":["602"]}}
```

---

#### `end_seal`（type: end）
**テキスト:**
```
彼らの魂を誓約の力で浄化し、安らかな眠りにつかせた。
王家からは失策と見なされたが、英霊たちは感謝と共にその力を託してくれた。
固有スキル『五星の加護』を手に入れた！
```
**params:**
```json
{"type":"end", "result":"success", "rewards":{"exp":500, "reputation":-100, "items":["603"]}}
```

---

#### `end_failure`（type: end）
**テキスト:**
```
力及ばず、英霊たちの前に倒れた。意識が途絶える中、墓所の冷たい石床が最後に触れたものだった。
```
**params:**
```json
{"type":"end", "result":"failure"}
```
