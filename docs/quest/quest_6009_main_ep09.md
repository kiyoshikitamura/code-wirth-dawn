# クエスト仕様書：6009 — 第9話「大名行列の護衛」

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6009 |
| **Slug** | `main_ep09` |
| **クエスト種別** | メインエピソード（Main） |
| **推奨レベル** | 9（Hard） |
| **難度** | 2 |
| **依頼主** | 自警団役人 |
| **出現条件** | 第8話「夜霧の凶刃」（6008）クリア / 滞在拠点: 谷間の集落 |
| **リピート** | アカウント通じて1回のみ（継承後も非表示） |
| **経過日数 (time_cost)** | 2 |
| **ノード数** | 39ノード |
| **ゲストNPC** | なし |
| **難易度Tier** | Hard（rec_level: 9） |
| **サムネイル画像** | `/images/quests/bg_mountain.png` |
---

## 1. クエスト概要

### 短文説明
```
大名行列の護衛と、一揆農民の襲撃。正義のあり方を問う戦い。
```

### 長文説明
```
大名の輸送物資を山道で護衛する任務。
だが、待ち受けていたのは困窮した一揆農民たちの必死の抵抗だった。
大名が隠す「真の荷物」と、血に染まる農民たちの声があなたに迫る。
```

---

## 2. 報酬定義
```
Exp:250|Gold:500|Rep:15|Order:5
```

---

## 3. シナリオノード構成（39ノード）

### 全体フロー
```text
start → start_02 → start_03 → start_04 → proc_01 → proc_02 → proc_03 → proc_04
  → captain_01 → captain_02 → captain_03
  → mountain_01 → mountain_02 → mob_01 → mob_02 → mob_03 → mob_04
  → leader_01 → leader_02 → leader_03 → rage_01 → rage_02
  → battle(404) → choice1 → after_01 → after_02 → after_03 → after_04 → after_05
  → reward_01 → reward_02 → reward_03 → tools_01 → tools_02 → tools_03
  → end_01 → end_02 → end_node
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_yato_tavern_night, bgm: bgm_quest_calm
```text
夜刀神国のとある宿。あなたは地元の役人から呼び出された。
```

#### `start_02`（text）
**演出:** bg: bg_yato_tavern_night
```text
内容は、領主である大名の輸送行列を護衛せよというものだ。
```

#### `start_03`（text）
**演出:** bg: bg_yato_tavern_night
```text
『近頃、領地で不穏な動きがある。腕利きの力が必要だ』と。
```

#### `start_04`（text）
**演出:** bg: bg_yato_tavern_night
```text
提示された報酬は破格だった。あなたは静かに依頼を引き受けた。
```

#### `proc_01`（text）
**演出:** bg: bg_mountain, bgm: bgm_quest_tense
```text
数日後、鬱蒼とした木々に囲まれた急峻な山道を行列が進む。
```

#### `proc_02`（text）
**演出:** bg: bg_mountain
```text
荷馬車の数は十数台。積まれているのは大量の米俵のはずだ。
```

#### `proc_03`（text）
**演出:** bg: bg_mountain
```text
だが、厳重すぎる警備と荷の重さに、あなたは違和感を抱く。
```

#### `proc_04`（text）
**演出:** bg: bg_mountain
```text
周囲の茂みから、鳥の羽ばたきとは異なる不自然な音が聞こえた。
```

#### `captain_01`（text）
**演出:** bg: bg_mountain, speaker: 護衛団長
```text
「おい、気を引き締めろ！このあたりは山賊が出没する！」
```

#### `captain_02`（text）
**演出:** bg: bg_mountain, speaker: 護衛団長
```text
「特に今回は領主様の命がかかっている。決して遅れを取るな」
```

#### `captain_03`（text）
**演出:** bg: bg_mountain, speaker: 護衛団長
```text
「もし荷に傷をつけてみろ、ただの処分では済まないからな」
```

#### `mountain_01`（text）
**演出:** bg: bg_mountain
```text
突如、前方からゴロゴロと巨大な岩が転がり落ちてきた！
```

#### `mountain_02`（text）
**演出:** bg: bg_mountain
```text
悲鳴を上げる馬たち。行列は狭い山道で立ち往生する。
```

#### `mob_01`（text）
**演出:** bg: bg_mountain
```text
茂みをかき分け、ボロをまとった集団が次々と姿を現した。
```

#### `mob_02`（text）
**演出:** bg: bg_mountain
```text
その手にあるのは剣や槍ではなく、錆びついた鍬や鎌だった。
```

#### `mob_03`（text）
**演出:** bg: bg_mountain
```text
集団の中には、痩せ細った老人や年若い子供の姿も混ざっている。
```

#### `mob_04`（text）
**演出:** bg: bg_mountain
```text
彼らの瞳にあるのは狂暴さではなく、追い詰められた絶望だ。
```

#### `leader_01`（text）
**演出:** bg: bg_mountain, speaker: 一揆の首謀者
```text
「米を返せ！それは我々が血と汗を流して育てた年貢米だ！」
```

#### `leader_02`（text）
**演出:** bg: bg_mountain, speaker: 一揆の首謀者
```text
「このままでは村全員が餓死する！頼む、見逃してくれ！」
```

#### `leader_03`（text）
**演出:** bg: bg_mountain, speaker: 一揆の首謀者
```text
「奪われたものを返すまで、我々はここを一歩も動かない！」
```

#### `rage_01`（text）
**演出:** bg: bg_mountain, speaker: 護衛団長
```text
「黙れ、薄汚い逆賊どもめ！領主様の荷に手を出すな！」
```

#### `rage_02`（text）
**演出:** bg: bg_mountain, speaker: 護衛団長
```text
「冒険者よ、こいつらを排除しろ！一人残らず斬り捨てろ！」
```

#### `battle`（battle）
**演出:** bg: bg_mountain, bgm: bgm_battle
**パラメータ:** enemy_group_id: 404, next: choice1, fail: end_failure

#### `choice1`（choice）
**演出:** bg: bg_mountain, bgm: bgm_battle
| 選択肢 | next_node |
|---|---|
| 「農民たちを退ける」 | `after_01` |

#### `after_01`（text）
**演出:** bg: bg_mountain
```text
圧倒的な武力の前に、農民たちは次々と地面へ伏せていく。
```

#### `after_02`（text）
**演出:** bg: bg_mountain
```text
地に流れる赤い血が、山道の泥を黒く染めていった。
```

#### `after_03`（text）
**演出:** bg: bg_mountain, speaker: 息絶え絶えの農民
```text
「ああ……これで村は終わりだ……子供たちに、飯を……」
```

#### `after_04`（text）
**演出:** bg: bg_mountain
```text
助けを求めるように伸ばされた手が、やがて力なく崩れ落ちる。
```

#### `after_05`（text）
**演出:** bg: bg_mountain
```text
静まり返った山道に、護衛団長の品のない高笑いが響き渡る。
```

#### `reward_01`（text）
**演出:** bg: bg_mountain, speaker: 護衛団長
```text
「よくやった！さすがは噂に聞く冒険者だな！」
```

#### `reward_02`（text）
**演出:** bg: bg_mountain, speaker: 護衛団長
```text
「これで荷の安全は保たれた。大名様もさぞお喜びになる」
```

#### `reward_03`（text）
**演出:** bg: bg_mountain
```text
団長は満足げにうなずき、倒れた農民の体を冷酷に踏みつけた。
```

#### `tools_01`（text）
**演出:** bg: bg_mountain
```text
ふと見ると、一揆の衝撃で壊れた荷箱から中身がこぼれている。
```

#### `tools_02`（text）
**演出:** bg: bg_mountain
```text
それは米ではなく、他国と密売するための高級な織物だった。
```

#### `tools_03`（text）
**演出:** bg: bg_mountain
```text
農民から奪った米を売り払い、私腹を肥やす大名の欺瞞。
```

#### `end_01`（text）
**演出:** bg: bg_mountain, bgm: bgm_quest_calm
```text
差し出された報酬の金貨袋が、異様に重く感じられた。
```

#### `end_02`（text）
**演出:** bg: bg_mountain
```text
自分が守ったものは何だったのか。答えは霧の中に消えた。
```

#### `end_node`（end_success）
**演出:** bg: bg_mountain
```text
あなたは無言で山道を下り、大名の街へと戻っていった。
```
**rewards:** Exp:250, Gold:500, Rep:15, Order:5

#### `end_failure`（end_failure）
**演出:** bg: bg_mountain
```text
乱戦の中、あなたは刃に倒れ、山道の肥やしとなった。
```
**rewards:** Gold:0
