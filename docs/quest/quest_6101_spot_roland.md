# クエスト仕様書：6101 — 忘却の五英霊 ―レガリア崩落の真実―

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | `[要定義: 6101 等]` |
| **Slug** | `scenario_01_roland` |
| **クエスト種別** | スポットシナリオ（Special） |
| **推奨レベル** | 5 |
| **難度** | 5 |
| **無効化条件** | なし |
| **依頼主** | - |
| **出現拠点** | 王都レガリア（`loc_holy_empire`等） |
| **出現条件** | スポット専用: 発生条件未定義（[要定義]） |
| **サムネイル画像** | `/images/quests/bg_spot_roland_tomb.png` |

※BGM、SE、進行中の背景画像などはノードごとに指定します。

---

## 1. クエスト概要

### 短文説明（クエストボード表示・40文字以内）
```
王都レガリアに突如現れた「五英霊」。暴走する彼らを止め、真実を暴け。
```

### 長文説明（詳細モーダル・フレーバーテキスト）
```
王都レガリアで、禁忌の術「英霊再臨」が失敗した。
かつての守護者である『五英霊』が、王家への復讐者として蘇り、街を破壊している。
避難民と共に地下墓所へ逃れ、英霊たちの暴走を止める手段を探せ。
光り輝くレガリアの歴史の裏に隠された「犠牲と裏切り」の真実とは。
```

---

## 2. 報酬定義

| 種別 | 内容 |
|-----|-----|
| アイテム | （道中入手）パッシブスキル『五英霊の誓約（エクリプス・バインド）』 |
| 最終報酬ルートA | 名声、神の法衣（高額換金アイテム）等の`[要定義]` |
| 最終報酬ルートB | 固有スキル『五星の加護（レガリア・ブレイブ）』等の`[要定義]` |

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
- **BGM**: `[要定義: 例 bgm_quest_tense]`
- **背景画像**: `bg_spot_roland_tomb`
- **SE**: `[要定義]`

**テキスト:**
```
「慈愛の聖女」が祈るだけで噴水が血に染まり、「不滅の王」が睨むだけで城門が崩れる。
王家の禁術により蘇った『五英霊』が、王都を破壊し始めた。
人々を守りながら、安全な王宮の地下墓所へと逃げ込むしかない。
```
**params:**
```
type:text, bgm_key:[要定義], bg_image:bg_spot_roland_tomb, next:escape_underground
```

---

#### `escape_underground`（type: text）
**演出パラメータ:**
- **背景画像**: `bg_spot_roland_tomb`

**テキスト:**
```
地下墓所の奥深くで、歴史から抹消された真の英雄墓所を発見した。
だが、そこには自動兵器が立ち塞がっていた！
```
**params:**
```
type:text, bg_image:bg_spot_roland_tomb, next:battle_protos
```

---

#### `battle_protos`（type: battle）
**演出パラメータ:**
- **BGM**: `[要定義: 例 bgm_battle_midboss]`

| 設定 | 値 |
|-----|-----|
| 敵グループ | `[要定義: 墓所の守護者プロトス (例: enemy_group_id: boss_protos)]` |

**params:**
```
type:battle, bgm_key:[要定義], enemy_group_id:[要定義], next:get_promise, fail:end_failure
```

---

#### `get_promise`（type: reward）
**演出パラメータ:**
- **SE**: `[要定義: アイテム入手SE]`
- **BGM**: `[要定義: 例 bgm_quest_calm]`

**テキスト:**
```
守護者を倒し、奥の祭壇から輝く石を手に入れた。
パッシブスキル『五英霊の誓約』を入手した。これがあれば、彼らの暴走する絶技を防げるかもしれない。
```
**params:**
```
type:reward, items:[要定義: 五英霊の誓約のアイテムID、またはSlug], next:boss_01_eluka
```

---

#### `boss_01_eluka`（type: battle）
**演出パラメータ:**
- **BGM**: `[要定義: 例 bgm_battle_boss]`
- **背景画像**: `bg_spot_roland_tomb`

**テキスト:**
```
地下まで追ってきた英霊の一人、「慈愛の聖女エルーカ」が立ちはだかる。
彼女は病の身代わりとして地下に幽閉され、見捨てられた過去を持っていた。
```
| 設定 | 値 |
|-----|-----|
| 敵グループ | `[要定義: 聖女エルーカ (例: enemy_group_id: boss_eluka)]` |

**params:**
```
type:battle, bgm_key:[要定義], enemy_group_id:[要定義], next:boss_02_baram, fail:end_failure
```
*(※中略: 02_baram, 03_shirasu, 04_lyra も同様のフォーマットとして実装)*

---

#### `boss_05_alvin`（type: battle）
**演出パラメータ:**
- **BGM**: `[要定義: 例 bgm_battle_boss_final]`
- **背景画像**: `bg_spot_roland_tomb`

**テキスト:**
```
最後に立ちはだかったのは「不滅の王アルヴィン」。
建国の父たる彼は、仲間の犠牲の上に国を築いた自責と憎悪で狂っていた。
```
| 設定 | 値 |
|-----|-----|
| 敵グループ | `[要定義: 王アルヴィン (例: enemy_group_id: boss_alvin)]` |

**params:**
```
type:battle, bgm_key:[要定義], enemy_group_id:[要定義], next:final_choice, fail:end_failure
```

---

#### `final_choice`（type: text）
**演出パラメータ:**
- **BGM**: `[要定義: 決断のBGM]`

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
```
type:end, result:success, reputation_change:[要定義: 名声値増加], item:[要定義: 神の法衣]
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
```
type:end, result:success, item:[要定義: 五星の加護スキルのアイテムID]
```
