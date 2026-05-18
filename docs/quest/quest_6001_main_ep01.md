# クエスト仕様書：6001 — 第1話「始まりの轍」

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6001 |
| **Slug** | `main_ep01` |
| **クエスト種別** | メインエピソード（Main） |
| **推奨レベル** | 1（Easy） |
| **難度** | 1 |
| **依頼主** | 王国軍 |
| **出現条件** | プレイヤーLv 1 以上 / 滞在拠点: ローランド聖王国拠点 |
| **リピート** | アカウント通じて1回のみ |
| **経過日数 (time_cost)** | 2 |
| **ゲストNPC** | ガウェイン（guest_join → leave） |
| **サムネイル画像** | `/images/quests/bg_road_day.png` |

---

## 1. クエスト概要

### 短文説明
```
辺境の輸送隊護衛。老騎士ガウェインの下で、最初の血を流せ。
```

### 長文説明
```
王国辺境の名もなき村。荒涼たる大地を渡る風に身を晒しながら、
一介の傭兵として生き抜く日々が始まる。
```

---

## 2. 報酬定義

```
Exp:80|Gold:150|Rep:5|Order:5
```

---

## 3. シナリオノード構成（40ノード）

### 全体フロー
```text
start → start_02 → village_01 → village_02 → board_01 → board_02 → board_03
  → cargo_01 → cargo_02 → gawain_01 → gawain_02 → gawain_03 → gawain_04
  → choice1
    ├─「急いで積み込みます」→ react_01
    └─「あんたはここで指図するだけか？」→ react_01
  → react_01 → react_02 → name_01 → name_02
  → gawain_join → alarm_01 → alarm_02 → scout_01 → order_01 → taunt_01
  → battle → choice2「迎撃する」→ post_01
  → dying_01 → dying_02 → dying_03 → look_01
  → praise_01 → praise_02 → depart_01 → farewell
  → gawain_leave → end_01 → end_node
```

### ノード詳細

#### `start`（type: text）
- **BGM**: `bgm_quest_calm` / **背景**: `bg_road_day`
- 「肌を焦がすような乾いた風が、荒涼たる砂丘を撫でる。」

#### `start_02`（type: text）
- **背景**: `bg_road_day`
- 「ここはローランド聖王国の辺境。王国の威光も、この村までは届かない。」

#### `village_01`（type: text）
- **背景**: `bg_road_day`
- 「崩れかけた土壁。痩せた家畜。井戸の底に溜まった泥水。」

#### `village_02`（type: text）
- **背景**: `bg_road_day`
- 「そんな場所から——君の物語は始まる。」

#### `board_01`（type: text）
- **背景**: `bg_road_day`
- 「村の入口の掲示板に釘で留められた黄ばんだ紙。」

#### `board_02`（type: text）
- **背景**: `bg_road_day`
- 「『傭兵募集——王国軍輸送部隊の護衛。報酬は銀貨十五枚。死亡時の補償はなし』」

#### `board_03`（type: text）
- **背景**: `bg_road_day`
- 「銀貨十五枚。この村で一ヶ月は食える。迷う理由はなかった。」

#### `cargo_01`（type: text）
- **背景**: `bg_road_day`
- 「荷馬車が三台。積まれた木箱には『軍需物資』とだけ書かれている。」

#### `cargo_02`（type: text）
- **背景**: `bg_road_day`
- 「兵士が六人。全員、目が死んでいた。」

#### `gawain_01`（type: text）
- **背景**: `bg_road_day`
- 「木箱を数えようとした時——背後からしゃがれた太い声が飛んできた。」

#### `gawain_02`（type: text）
- **背景**: `bg_road_day` / **speaker**: `ガウェイン`
- 「『おい、そこの新入り！ぼんやりするな。野盗が湧くぞ！』」

#### `gawain_03`（type: text）
- **背景**: `bg_road_day`
- 「振り返ると、甲冑に砂埃を被った大柄な男が立っていた。額の傷跡が古い。」

#### `gawain_04`（type: text）
- **背景**: `bg_road_day` / **speaker**: `ガウェイン`
- 「『で、お前が今日の新しい肉壁か。剣の腕はどうだ？』」

#### `choice1`（選択肢）

| ラベル | 次ノード |
|--------|----------|
| 「急いで積み込みます」 | `react_01` |
| 「あんたはここで指図するだけか？」 | `react_01` |

#### `react_01`（type: text）
- **背景**: `bg_road_day`
- 「男は鼻で笑った。だが、目は笑っていなかった。」

#### `react_02`（type: text）
- **背景**: `bg_road_day` / **speaker**: `ガウェイン`
- 「『威勢はいいが、口だけの奴はすぐ死ぬのが戦場だ』」

#### `name_01`（type: text）
- **背景**: `bg_road_day` / **speaker**: `ガウェイン`
- 「『俺はガウェイン。この部隊の小隊長だ』」

#### `name_02`（type: text）
- **背景**: `bg_road_day`
- 「ガウェインは地平線を見た。疲労と、それでも消えない何かが目に残っていた。」

#### `gawain_join`（type: guest_join）
- **背景**: `bg_road_day`
- **params**: `{"type":"guest_join", "guest_id":"npc_guest_gawain"}`
- 「ガウェインがパーティに加わった。」

#### `alarm_01`（type: text）
- **BGM**: `bgm_quest_tense` / **背景**: `bg_road_day`
- 「ガウェインが何かを言いかけた、その瞬間——」

#### `alarm_02`（type: text）
- **背景**: `bg_road_day`
- 「砂埃の向こうから怒声と馬の嘶きが迫ってきた。」

#### `scout_01`（type: text）
- **背景**: `bg_road_day`
- 「斥候が丘の上から転がり落ちてきた。『武装集団が二十ほど接近！野盗です！』」

#### `order_01`（type: text）
- **背景**: `bg_road_day` / **speaker**: `ガウェイン`
- 「ガウェインが素早く抜刀した。『木箱は死守しろ。荷を奪われりゃ首が飛ぶ』」

#### `taunt_01`（type: text）
- **背景**: `bg_road_day`
- 「野盗の頭目が丘の上から叫んだ。『おう、王国の犬ども！荷を置いて消えな！』」

#### `battle`（type: battle）
- **BGM**: `bgm_battle` / **背景**: `bg_road_day`
- **敵グループ**: `200`（野盗の一隊）
- 「己の力と生き残る意志を示す時が来た。武器を握り直せ！」

#### `post_01`（type: text）
- **BGM**: `bgm_quest_calm` / **背景**: `bg_road_day`
- 「剣を振り抜き、最後の一人を砂に沈めた。手が震えている。」

#### `dying_01`（type: text）
- **背景**: `bg_road_day`
- 「足元の野盗が、薄れゆく目でこちらを見上げた。」

#### `dying_02`（type: text）
- **背景**: `bg_road_day`
- 「『やるじゃねえか。だがな——俺たちを雇ったのはお前らの国の連中だぜ』」

#### `dying_03`（type: text）
- **背景**: `bg_road_day`
- 「男の目から光が消えた。」

#### `look_01`（type: text）
- **背景**: `bg_road_day`
- 「ガウェインが死体を一瞥した。その顔は険しかった。」

#### `praise_01`（type: text）
- **背景**: `bg_road_day` / **speaker**: `ガウェイン`
- 「『悪くない太刀筋だ。初陣にしては、な』」

#### `praise_02`（type: text）
- **背景**: `bg_road_day`
- 「ガウェインは一度だけ肩を叩いた。岩のように硬い手だった。」

#### `depart_01`（type: text）
- **背景**: `bg_road_day` / **speaker**: `ガウェイン`
- 「『荷馬車を出すぞ。日暮れ前に宿場へ着かなければ』」

#### `farewell`（type: text）
- **背景**: `bg_road_day` / **speaker**: `ガウェイン`
- 「『また会うこともあるだろう。……死ぬなよ、新入り』」

#### `gawain_leave`（type: leave）
- **背景**: `bg_road_day`
- **params**: `{"type":"leave", "guest_id":"npc_guest_gawain"}`
- 「宿場に着き任務完了。大きな背中が砂埃の向こうに消えていく。」

#### `end_01`（type: text）
- **背景**: `bg_road_day`
- 「初めての実戦を終え、傭兵としての旅路が幕を開けた。」

#### `end_node`（type: end_success）
- **背景**: `bg_road_day`
- 「野盗の遺言が耳に残る。『お前らの国の連中だ』——考えるのは後にしよう。」
