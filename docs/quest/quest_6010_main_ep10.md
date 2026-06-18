# クエスト仕様書：6010 — 第10話「世界の底が抜ける日」

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6010 |
| **Slug** | `main_ep10` |
| **クエスト種別** | メインエピソード（Main） |
| **推奨レベル** | 15（Hard） |
| **難度** | 2 |
| **依頼主** | なし |
| **出現条件** | 第9話「大名行列の護衛」（6009）クリア / 滞在拠点: 夜刀神国首都 神都「出雲」 |
| **リピート** | アカウント通じて1回のみ（継承後も非表示） |
| **経過日数 (time_cost)** | 2 |
| **ノード数** | 36ノード |
| **ゲストNPC** | なし |
| **難易度Tier** | Hard（rec_level: 15） |
| **サムネイル画像** | `/images/quests/bg_boss_altar.png` |
---

## 1. クエスト概要

### 短文説明
```
禁域の古代神殿。世界の底が抜ける日、神代の守護竜との対決。
```

### 長文説明
```
禁域の古代神殿の奥深く。怪しく光る祭壇の水晶は、神々が仕組んだ「大浄化」の計画を映し出す。
世界の存亡を賭け、神代より祭壇を守る守護竜に挑め。（第2部完結）
```

---

## 2. 報酬定義
```
Exp:300|Gold:500|Rep:15|Justice:10|Items:502,item_pass_karyu
```

---

## 3. シナリオノード構成（36ノード）

### 全体フロー
```text
start → start_02 → start_03 → interior_01 → interior_02
  → vision_01 → vision_02 → vision_03 → vision_04 → vision_05
  → voice_01 → voice_02 → voice_03 → real_01 → real_02 → real_03 → real_04
  → rage_01 → rage_02 → rage_03 → dragon_01 → dragon_02 → dragon_03 → dragon_04 → dragon_05
  → battle(209) → choice1 → after_01 → after_02 → after_03 → after_04
  → end_01 → end_02 → end_03 → end_node
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_boss_altar, bgm: bgm_quest_crisis
```text
立ち入りを禁じられた古代神殿の奥。そこは静まり返っている。
```

#### `start_02`（text）
**演出:** bg: bg_boss_altar
```text
足音が不気味に響き、周囲の古い石柱を震わせた。
```

#### `start_03`（text）
**演出:** bg: bg_boss_altar
```text
神殿の最奥には、怪しく光る巨大な水晶の祭壇が鎮座する。
```

#### `interior_01`（text）
**演出:** bg: bg_boss_altar
```text
あなたが近づくと、水晶の輝きが激しさを増していった。
```

#### `interior_02`（text）
**演出:** bg: bg_boss_altar
```text
光の中に、信じがたい光景が次々と浮かび上がる。
```

#### `vision_01`（text）
**演出:** bg: bg_boss_altar
```text
炎に包まれて崩れ去るマルカンドのオアシスの街。
```

#### `vision_02`（text）
**演出:** bg: bg_boss_altar
```text
血に染まった剣を握りしめ、冷たく伏せる兵士たちの群れ。
```

#### `vision_03`（text）
**演出:** bg: bg_boss_altar
```text
痩せ細った腕を伸ばし、泥水を求めて這い回る人々。
```

#### `vision_04`（text）
**演出:** bg: bg_boss_altar
```text
それらはすべて、あなたが旅の途中で目にした光景だった。
```

#### `vision_05`（text）
**演出:** bg: bg_boss_altar
```text
まるで世界の破滅が、あらかじめ決められていたかのように。
```

#### `voice_01`（text）
**演出:** bg: bg_boss_altar, speaker: 祭壇の声
```text
「穢れの蓄積値が規定量を超過。第3浄化段階へ移行します」
```

#### `voice_02`（text）
**演出:** bg: bg_boss_altar, speaker: 祭壇の声
```text
「これより地上の一切の生命を消去し、世界を初期化します」
```

#### `voice_03`（text）
**演出:** bg: bg_boss_altar, speaker: 祭壇の声
```text
「すべては天上の神々の意志。反論は受け付けられません」
```

#### `real_01`（text）
**演出:** bg: bg_boss_altar
```text
無機質な声が神殿内に響き渡る。あなたは驚愕に息を呑む。
```

#### `real_02`（text）
**演出:** bg: bg_boss_altar
```text
人々が戦い、血を流し、苦しんできたすべての歴史。
```

#### `real_03`（text）
**演出:** bg: bg_boss_altar
```text
それは神々が描いた、単なる『間引き』の脚本に過ぎない。
```

#### `real_04`（text）
**演出:** bg: bg_boss_altar
```text
人間はただの操り人形だったのか。胸の奥から怒りが湧く。
```

#### `rage_01`（text）
**演出:** bg: bg_boss_altar
```text
あなたは静かに剣を引き抜いた。刃が水晶の光を反射する。
```

#### `rage_02`（text）
**演出:** bg: bg_boss_altar
```text
誰が定めた運命だ。自分たちの命を勝手に消させてたまるか。
```

#### `rage_03`（text）
**演出:** bg: bg_boss_altar
```text
刃の先を真っ直ぐに祭壇へ向け、強く足を踏み出した。
```

#### `dragon_01`（text）
**演出:** bg: bg_boss_altar
```text
その瞬間、水晶が激しく脈動し、神殿の空間自体が歪む。
```

#### `dragon_02`（text）
**演出:** bg: bg_boss_altar
```text
裂け目から、純白の鱗を持つ巨大な生物が姿を現した。
```

#### `dragon_03`（text）
**演出:** bg: bg_boss_altar
```text
神代より祭壇を守護してきた、伝説の白竜である。
```

#### `dragon_04`（text）
**演出:** bg: bg_boss_altar
```text
白竜の黄金の瞳が、反逆者たるあなたを静かに見下ろす。
```

#### `dragon_05`（text）
**演出:** bg: bg_boss_altar, speaker: 神代の守護竜
```text
「神の法に背く愚かなる人よ。その身をもって罪を贖え」
```

#### `battle`（battle）
**演出:** bg: bg_boss_altar, bgm: bgm_battle_boss
**パラメータ:** enemy_group_id: 209, next: choice1, fail: end_failure

#### `choice1`（choice）
**演出:** bg: bg_boss_altar, bgm: bgm_battle_boss
| 選択肢 | next_node |
|---|---|
| 「守護竜を打ち破る」 | `after_01` |

#### `after_01`（text）
**演出:** bg: bg_boss_altar
```text
激闘の末、大剣が竜の急所を貫き、守護竜は崩れ落ちた。
```

#### `after_02`（text）
**演出:** bg: bg_boss_altar
```text
竜の消滅とともに、祭壇の水晶は砕け散り、光を失う。
```

#### `after_03`（text）
**演出:** bg: bg_boss_altar
```text
静寂が戻った神殿の床に、一本の白い牙が落ちていた。
```

#### `after_04`（text）
**演出:** bg: bg_boss_altar
```text
それは守護竜の力が宿る牙だ。あなたはそれを拾い上げた。
```

#### `end_01`（text）
**演出:** bg: bg_boss_altar, bgm: bgm_quest_calm
```text
大浄化は一時的に防がれた。だが、本質は何も変わらない。
```

#### `end_02`（text）
**演出:** bg: bg_boss_altar
```text
神々の真意を確かめねばならない。あなたは西を目指す。
```

#### `end_03`（text）
**演出:** bg: bg_boss_altar
```text
華龍神朝へ。新たな答えを求めて、あなたは旅立つ。
```

#### `end_node`（end_success）
**演出:** bg: bg_boss_altar
```text
暗闇の神殿を背に、あなたは新たな一歩を踏み出した。
```
**rewards:** Exp:300, Gold:500, Rep:15, Justice:10, Items:502, item_pass_karyu

#### `end_failure`（end_failure）
**演出:** bg: bg_boss_altar
```text
守護竜の圧倒的な爪牙の前に、あなたの意識は消え去った。
```
**rewards:** Gold:0
