# クエスト仕様書：6102 — 冥食の残滓 ―常闇に消ゆ、宿命の贄―

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6102 |
| **Slug** | `qst_spot_yato` |
| **クエスト種別** | スポットシナリオ / 護衛（Special） |
| **推奨レベル** | 20（Hard） |
| **難度** | 5 |
| **依頼主** | 隠れ里の長老 |
| **出現条件** | メインep09クリア / 夜刀拠点滞在 / 正義(Justice)50%以上 |
| **リピート** | 現世代で1回（継承後は再出現） |
| **難易度Tier** | Hard（rec_level: 20） |
| **経過日数 (time_cost)** | 7（成功: 7日 / 失敗: 5日） |
| **ゲストNPC** | 撫子（護衛対象としてパーティ加入 / クエスト終了後に離脱） |
| **ノード数** | [CSV作成後に追記] |
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

**ルートA（儀式完遂ルート）CSV記載形式:**
```
Exp:500|Gold:10000|Rep:200|Item:615
```

**ルートB（撫子救出ルート）— endノードparamsで付与:**
```
Exp:500|Rep:-100|Item:616
```

### 報酬アイテム詳細

| ID | Slug | 名前 | Type | 効果 | 入手 |
|---|---|---|---|---|---|
| 611 | `spot_magatama_1` | 朱の勾玉 | passive | HP+3 | 道中(boss_01勝利後) |
| 612 | `spot_magatama_2` | 蒼の勾玉 | passive | DEF+2 | 道中(boss_02勝利後) |
| 613 | `spot_magatama_3` | 翠の勾玉 | passive | ATK+2 | 道中(boss_03勝利後) |
| 614 | `spot_magatama_4` | 黄の勾玉 | passive | HP+5 | 道中(boss_04勝利後) |
| 615 | `spot_yato_talisman` | 冥界の護符 | equipment/accessory | ATK+8, DEF+8, HP+8 | ルートA |
| 616 | `spot_luna_eclips` | 冥食の理 | skill(card) | dmg25+呪い(3T), deck_cost:12 | ルートB |

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
            │    │    │    │    ├─[勝利]→ reward_magatama_1 → boss_02_tori
            │    │    │    │    │    ├─[勝利]→ reward_magatama_2 → boss_03_kuruma
            │    │    │    │    │    │    ├─[勝利]→ reward_magatama_3 → boss_04_shuten
            │    │    │    │    │    │    │    ├─[勝利]→ reward_magatama_4 → final_choice
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
- **BGM**: `bgm_yato` / **背景**: `bg_spot_yato_eclipse`

**テキスト:**
```
「冥食」が始まり、空が赤黒く染まった。
隠れ里から、白装束の少女「撫子」が現れた。彼女は冥の門を封じるための「生贄」だ。
```
**params:** `{"type":"text", "bgm":"bgm_yato", "bg":"bg_spot_yato_eclipse"}`

---

#### `join_nadeshiko`（type: guest_join）
- **背景**: `bg_spot_yato_eclipse`

**テキスト:**
```
少女「撫子」が同行者になった。
戦闘に参加するが、彼女が倒れれば儀式は失敗となる。
```
**params:** `{"type":"guest_join", "npc_slug":"npc_nadeshiko", "bg":"bg_spot_yato_eclipse"}`

---

#### `battle_spider_1`（type: battle）
- **BGM**: `bgm_battle_strong` / **背景**: `bg_spot_yato_entrance`

**テキスト:** `門の守護者、鬼蜘蛛の群れが襲いかかってきた！`
**params:** `{"type":"battle", "bgm":"bgm_battle_strong", "bg":"bg_spot_yato_entrance", "enemy_group_id":"spot_yato_spider_1"}`

---

#### `battle_spider_2`（type: battle）
- **BGM**: `bgm_battle_strong` / **背景**: `bg_spot_yato_entrance`

**テキスト:** `門の奥から、さらに大きな蜘蛛の群れが這い出てきた。撫子を守りながら戦え。`
**params:** `{"type":"battle", "bgm":"bgm_battle_strong", "bg":"bg_spot_yato_entrance", "enemy_group_id":"spot_yato_spider_2"}`

---

#### `battle_spider_3`（type: battle）
- **BGM**: `bgm_battle_strong` / **背景**: `bg_spot_yato_entrance`

**テキスト:** `天井から糸が垂れてくる。上から奇襲だ！`
**params:** `{"type":"battle", "bgm":"bgm_battle_strong", "bg":"bg_spot_yato_entrance", "enemy_group_id":"spot_yato_spider_3"}`

---

#### `battle_spider_4`（type: battle）
- **BGM**: `bgm_battle_strong` / **背景**: `bg_spot_yato_entrance`

**テキスト:** `門の守護者、最後の一群。この先に四大妖怪が待つ。`
**params:** `{"type":"battle", "bgm":"bgm_battle_strong", "bg":"bg_spot_yato_entrance", "enemy_group_id":"spot_yato_spider_4"}`

---

#### `boss_01_wani`（type: battle）
- **BGM**: `bgm_battle_strong` / **背景**: `bg_spot_yato_entrance`

**テキスト:**
```
地を揺るがす咆哮と共に、甲羅を纏った巨大な大鰐が現れた。
「水底の覇者」と恐れられた古の妖怪。第一の試練だ。
```
**params:** `{"type":"battle", "bgm":"bgm_battle_strong", "bg":"bg_spot_yato_entrance", "enemy_group_id":"spot_yato_wani"}`

---

#### `reward_magatama_1`（type: reward）
**テキスト:** `大鰐を打倒した。朱の勾玉を手に入れた！`
**params:** `{"type":"reward", "items":["611"]}`

---

#### `boss_02_tori`（type: battle）
- **BGM**: `bgm_battle_strong` / **背景**: `bg_spot_yato_entrance`

**テキスト:**
```
空を覆い尽くす漆黒の翼。不吉な鳴き声が響く。
「以津真天」。死の前兆を告げる凶鳥が、撫子を狙って急降下してきた。
```
**params:** `{"type":"battle", "bgm":"bgm_battle_strong", "bg":"bg_spot_yato_entrance", "enemy_group_id":"spot_yato_tori"}`

---

#### `reward_magatama_2`（type: reward）
**テキスト:** `以津真天を退けた。蒼の勾玉を手に入れた！`
**params:** `{"type":"reward", "items":["612"]}`

---

#### `boss_03_kuruma`（type: battle）
- **BGM**: `bgm_battle_strong` / **背景**: `bg_spot_yato_entrance`

**テキスト:**
```
闇の奥から車輪の軋む音が聞こえる。炎を纏った巨大な牛車が突進してきた。
「朧車」。生者を轢き殺し冥界へ運ぶ、怨念の乗り物。
```
**params:** `{"type":"battle", "bgm":"bgm_battle_strong", "bg":"bg_spot_yato_entrance", "enemy_group_id":"spot_yato_kuruma"}`

---

#### `reward_magatama_3`（type: reward）
**テキスト:** `朧車を粉砕した。翠の勾玉を手に入れた！`
**params:** `{"type":"reward", "items":["613"]}`

---

#### `boss_04_shuten`（type: battle）
- **BGM**: `bgm_spot_final_boss` / **背景**: `bg_spot_yato_gate`

**テキスト:**
```
最後にして最強の妖怪「酒呑童子」。
歴代の儀式に失敗し、鬼へと堕ちた伝説の戦士が立ちはだかる。
```
**params:** `{"type":"battle", "bgm":"bgm_spot_final_boss", "bg":"bg_spot_yato_gate", "enemy_group_id":"spot_yato_shuten"}`

---

#### `reward_magatama_4`（type: reward）
**テキスト:** `酒呑童子を打倒した。黄の勾玉を手に入れた！`
**params:** `{"type":"reward", "items":["614"]}`

---

#### `final_choice`（type: text）
- **BGM**: `bgm_spot_final_choice` / **背景**: `bg_spot_yato_gate`

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
**params:** `{"type":"end", "result":"success", "rewards":{"exp":500, "gold":10000, "reputation":200, "items":["615"]}}`

---

#### `end_save`（type: end）
**テキスト:**
```
儀式を拒絶し、門から漏れ出す「冥府の王」の思念を力でねじ伏せた。
夜刀の国は困難な時代に突入するが、撫子の命は救われた。
固有スキル『冥食の理』を手に入れた！
```
**params:** `{"type":"end", "result":"success", "rewards":{"exp":500, "reputation":-100, "items":["616"]}}`

---

#### `end_failure`（type: end）
**テキスト:**
```
力及ばず、妖怪たちの前に倒れた。冥食の闇が全てを飲み込んでいく。
```
**params:** `{"type":"end", "result":"failure"}`
