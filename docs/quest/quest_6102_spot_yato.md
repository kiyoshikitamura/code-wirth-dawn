# クエスト仕様書：6102 — 冥食の残滓 ―常闇に消ゆ、宿命の贄―

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | `[要定義: 6102 等]` |
| **Slug** | `scenario_02_yato` |
| **クエスト種別** | スポットシナリオ / 護衛 |
| **推奨レベル** | 5 |
| **難度** | 5 |
| **依頼主** | - |
| **出現拠点** | 夜刀（`loc_yatoshin`等） |
| **出現条件** | スポット専用: 発生条件未定義（[要定義]） |
| **サムネイル画像** | `/images/quests/bg_spot_yato_eclipse.png` |

※BGM、SE、進行中の背景画像などはノードごとに指定します。

---

## 1. クエスト概要

### 短文説明
```
100年に一度の『冥食』。宿命の子「撫子」を護衛し、冥の門の最深部を目指せ。
```

### 長文説明
```
昼夜が逆転し、空が赤黒く染まる「冥食」が始まった。
夜刀の国では、異界の口「冥の門」を封じるため、宿命の子を贄として捧げる儀式が行われる。
隠れ里で育てられた少女「撫子」と共に、彼女を守り抜きながら門の最深部へ向かえ。
四大妖怪の試練が待ち受けている。
```

---

## 2. 報酬定義

| 種別 | 内容 |
|-----|-----|
| 道中報酬 | 四神の勾玉（パッシブスキル4種）`[要定義]` |
| ルートA報酬 | 名声 および 高額換金アイテム `[要定義]` |
| ルートB報酬 | 固有スキル『冥食の理（ルナ・クリプス）』 `[要定義]` |

---

## 3. シナリオノード構成

### 全体フロー
```text
start
  └─[続ける]→ join_nadeshiko
       └─[続ける]→ battle_spider_1
            ├─[勝利]→ battle_spider_2
            │    ├─[勝利]→ battle_spider_3
            │    │    ├─[勝利]→ battle_spider_4
            │    │    │    ├─[勝利]→ boss_01_wani
            │    │    │    │    ├─[勝利]→ boss_02_tori
            │    │    │    │    │    ├─[勝利]→ boss_03_kuruma
            │    │    │    │    │    │    ├─[勝利]→ boss_04_shuten
            │    │    │    │    │    │    │    ├─[勝利]→ final_choice
            │    │    │    │    │    │    │    │    ├─[完遂する]→ end_sacrifice
            │    │    │    │    │    │    │    │    └─[拒絶する]→ end_save
            │    │    │    │    │    │    │    └─[敗北]→ end_failure
            │    │    │    │    │    │    └─[敗北]→ end_failure
            │    │    │    │    │    └─[敗北]→ end_failure
            │    │    │    │    └─[敗北]→ end_failure
            │    │    │    └─[敗北]→ end_failure
            │    │    └─[敗北]→ end_failure
            │    └─[敗北]→ end_failure
            └─[敗北]→ end_failure
```

### ノード詳細

#### `start`（type: text）
**演出パラメータ:**
- **BGM**: `[要定義: 例 bgm_quest_dark]`
- **背景画像**: `bg_spot_yato_eclipse`

**テキスト:**
```
「冥食」が始まり、空が赤黒く染まった。
隠れ里から、白装束の少女「撫子」が現れた。彼女は冥の門を封じるための「生贄」だ。
```
**params:**
```
type:text, bgm_key:[要定義], bg_image:bg_spot_yato_eclipse, next:join_nadeshiko
```

---

#### `join_nadeshiko`（type: join）
**演出パラメータ:**
- **SE**: `[要定義: 加入音]`

**テキスト:**
```
少女「撫子」が同行者になった。
戦闘に参加するが、彼女が倒れれば儀式は失敗となる。
```
**params:**
```
type:join, npc_slug:[要定義: npc_nadeshiko], is_escort_target:true, next:battle_spider_1
```

---

#### `battle_spider_1`（type: battle）
**演出パラメータ:**
- **BGM**: `[要定義: 例 bgm_battle_normal]`

| 設定 | 値 |
|-----|-----|
| 敵グループ | `[要定義: 門の守護者・鬼蜘蛛1 (例: enemy_spider)]` |

**テキスト:**
*(勝利時報酬として勾玉アイテムを付与する場合、別途rewardノードを挟むか、drop_itemに仕込む)*
**params:**
```
type:battle, enemy_group_id:[要定義], next:battle_spider_2, fail:end_failure
```
*(※中略: 蜘蛛2〜4 と 妖怪ボス 01〜04 も同様に実装)*

---

#### `boss_04_shuten`（type: battle）
**演出パラメータ:**
- **BGM**: `[要定義: 例 bgm_battle_boss_final]`
- **背景画像**: `bg_spot_yato_eclipse`

**テキスト:**
```
最後にして最強の妖怪「酒呑童子」。
歴代の儀式に失敗し、鬼へと堕ちた伝説の戦士が立ちはだかる。
```
| 設定 | 値 |
|-----|-----|
| 敵グループ | `[要定義: 酒呑童子 (例: enemy_group_id: boss_shuten)]` |

**params:**
```
type:battle, bgm_key:[要定義], enemy_group_id:[要定義], next:final_choice, fail:end_failure
```

---

#### `final_choice`（type: text）
**テキスト:**
```
四大妖怪を退け、冥の門が完全に開いた。
いよいよ撫子を門の奥へ送り出す時が来たが……。
```
**選択肢:**
| ラベル | 次ノード |
|--------|---------|
| 儀式を完遂させる（撫子を送り出す） | `end_sacrifice` |
| 因習を打ち砕く（撫子を救う） | `end_save` |

---

#### `end_sacrifice`（type: end）
**テキスト:**
```
撫子を門の奥へ送り出した。門は完全に閉じ、夜刀に平和が戻る。
彼女の名は歴史から消え、犠牲を知るのは自分だけだ。
```
**params:**
```
type:end, result:success, reputation_change:[要定義], item:[要定義]
```

---

#### `end_save`（type: end）
**テキスト:**
```
儀式を拒絶し、門から漏れ出す「冥府の王」の思念を力でねじ伏せた。
夜刀の国は困難な時代に突入するが、撫子の命は救われた。
固有スキル『冥食の理』を手に入れた！
```
**params:**
```
type:end, result:success, item:[要定義: ルナ・クリプス]
```
