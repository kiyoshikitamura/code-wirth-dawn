# クエスト仕様書：7031 — 隠密の密書傍受

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7031 |
| **Slug** | `qst_yat_ninja` |
| **クエスト種別** | 一般クエスト（Normal） |
| **推奨レベル** | 6（Normal） |
| **難度** | 2 |
| **依頼主** | 忍び衆 |
| **出現条件** | 出現国: 夜刀神国 |
| **リピート** | リピート可能 |
| **経過日数 (time_cost)** | 4 |
| **ノード数** | 36ノード |
| **ゲストNPC** | なし |
| **難易度Tier** | Normal（rec_level: 6） |
| **サムネイル画像** | `/images/quests/bg_yato_forest.png` |
---

## 1. クエスト概要

### 短文説明
```
[襲撃] 他国の間者を辻斬りのごとく排除し、密書を奪取して届けよ。
```

### 長文説明
```
夜刀神国の影で暗躍する「忍び衆」からの非公式な依頼だ。
他国の間者が、国の軍事機密を記した密書を持って北の関所へ向かっているという。
任務は単純明快。間者を奇襲して殺害し、密書を奪取すること。
ただし、密書の内容を決して見てはならない。知れば、お前も消されるからだ。
```

---

## 2. 報酬定義

**成功報酬 (CSV記載形式):**
```
Gold:550|Exp:120|Justice:10
```

**失敗報酬 (密書紛失・敗北):**
```
Gold:0
```

---

## 3. シナリオノードフロー

```text
start → start_02 → start_03 → start_04 → start_05 → prep_01 → prep_02
  → locate_01 → locate_02 → locate_03 → locate_04 → ambush_01 → ambush_02 → ambush_03 → ambush_04
    → battle_spy
         ├─ win → after_01 → after_02 → after_03 → after_04 → after_05 → take_01 → take_02 → take_document
         │    └─ choice_destination (choice)
         │         ├─ 「約束通り、連絡員のいる裏路地の酒場へ向かう」 → return_01 → return_02 → return_03 → deliver_document
         │         │                                                                             ├─ success → deliver_check_ok → end_success
         │         │                                                                             └─ failure → deliver_check_fail → end_failure_lost_end
         │         └─ 「代官所に通報し、密書を役人に引き渡す」 → report_authorities_01 → report_authorities_02 → end_authorities
         └─ lose → end_failure
```

### ノード詳細（36ノード）

#### `start`（text）
**演出:** bg: bg_yato_city, bgm: bgm_quest_tense, speaker: 忍び衆の使者
```text
「夜分に失礼する。腕の立つ冒険者に、非公式な『掃除』を頼みたい」
```

#### `start_02`（text）
**演出:** bg: bg_yato_city, bgm: bgm_quest_tense, speaker: 忍び衆の使者
```text
「他国の間者が軍事機密を記した密書を携え、北の関所へ向かっている」
```

#### `start_03`（text）
**演出:** bg: bg_yato_city, bgm: bgm_quest_tense
```text
顔を黒布で覆った使者は、感情の読めない冷たい瞳でこちらを見据えている。
```

#### `start_04`（text）
**演出:** bg: bg_yato_city, bgm: bgm_quest_tense, speaker: 忍び衆の使者
```text
「間者は護衛を連れている。お前の任務は、奴らを討ち密書を奪うことだ」
```

#### `start_05`（text）
**演出:** bg: bg_yato_city, bgm: bgm_quest_tense, speaker: 忍び衆の使者
```text
「……ただし中身は決して見るな。封が切られていれば命はないと思え」
```

#### `prep_01`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_field_night
```text
使者は足音一つ立てずに闇へ消えた。警告は本気だろう。命がけの仕事だ。
```

#### `prep_02`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_field_night
```text
北の関所への道は一本。先回りして伏兵となるため、獣道を急ぎ北上する。
```

#### `locate_01`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_field_night
```text
両脇を深い林に囲まれた細い山道。太い枝の上に身を潜め、獲物を待つ。
```

#### `locate_02`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_field_night
```text
月が雲に隠れ、足元すら見えなくなった頃、落ち葉を踏む微かな音がした。
```

#### `locate_03`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_field_night
```text
笠を目深に被った男と、その前後を固める、歩みの異様に軽い二人の護衛。
```

#### `locate_04`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_field_night
```text
一般の行商人には見えない隙のない陣形。間違いなく、奴らが標的だ。
```

#### `ambush_01`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_quest_tense
```text
息を殺し、刀の柄に手をかける。間者がちょうど真下を通り過ぎる瞬間――
```

#### `ambush_02`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_quest_tense
```text
木の上から音もなく飛び降り、前衛の護衛の背後へと回り込んで刃を突き立てた。
```

#### `ambush_03`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_quest_tense, speaker: 間者の護衛
```text
「何者だ！？ ええい、伏兵だ、出会えェッ！」
```

#### `ambush_04`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_quest_tense
```text
奇襲は防がれた。護衛たちが素早く小太刀を抜き、鋭い殺気で襲いかかる。
```

#### `battle_spy`（battle）
**演出:** bg: bg_yato_forest, bgm: bgm_battle
**パラメータ:** enemy_group_id: 432, next: `after_01`, fail: `end_failure`
```text
他国の間者と抜け忍たちが立ちはだかる！
```

#### `after_01`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_quest_calm
```text
凄惨な殺し合いの末、護衛の一人が喉を押さえて倒れた。もう動かない。
```

#### `after_02`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_quest_calm
```text
残された間者も、絶望の表情を浮かべたまま血だまりの中に倒れ伏している。
```

#### `after_03`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_quest_calm
```text
林の中に再び静寂が戻る。血の匂いが獣を呼ぶ前に、任務を完遂せねば。
```

#### `after_04`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_quest_calm
```text
間者の死体を探る。帯の裏に、不自然な膨らみがあるのを見つけた。
```

#### `after_05`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_quest_calm
```text
布を切り裂くと、厳重に封印された黒い巻物が転がり出た。これが密書だ。
```

#### `take_01`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_quest_calm
```text
封印には見慣れぬ紋様。中を見れば命はないという警告が脳裏をよぎる。
```

#### `take_02`（text）
**演出:** bg: bg_yato_forest, bgm: bgm_quest_calm
```text
好奇心を押し殺し、密書を丁寧に布に包んで懐にしまった。急ぎ撤退する。
```

#### `take_document`（reward）
**パラメータ:** item_id: `item_secret_document`, next: `choice_destination`
**演出:** bg: bg_yato_forest, bgm: bgm_quest_calm
```text
「封をされた密書」を手に入れた！
```

#### `choice_destination`（choice）
**演出:** bg: bg_yato_forest, bgm: bgm_quest_calm
```text
手に入れた密書をどう扱うべきか？
```
| 選択肢 | next_node |
|---------|-----------|
| 「約束通り、連絡員のいる裏路地の酒場へ向かう」 | `return_01` |
| 「代官所に通報し、密書を役人に引き渡す」 | `report_authorities_01` |

#### `report_authorities_01`（text）
**演出:** bg: bg_yato_city, bgm: bgm_quest_tense
```text
忍び衆の不穏な動きを懸念し、都の代官所へ赴き、密書を差し出してすべてを告発した。
```

#### `report_authorities_02`（text）
**演出:** bg: bg_yato_city, bgm: bgm_quest_tense
```text
役人たちは驚愕し、密書を直ちに没収した。そして、この件は一切口外するなと厳命された。
```

#### `end_authorities`（end_failure）
**演出:** bg: bg_yato_city
```text
代官所を後にする。密書は失ったが、国に潜む影の存在を公にできた。しかし、背後から刺客の視線を感じる……。
```
**rewards:** Gold:0, Exp:120, Rep:10, Justice:15

#### `return_01`（text）
**演出:** bg: bg_yato_tavern_night, bgm: bgm_quest_calm
```text
夜が明ける前に町へ戻り、指定された裏路地の寂れた酒場へと足を運ぶ。
```

#### `return_02`（text）
**演出:** bg: bg_yato_tavern_night, bgm: bgm_quest_calm
```text
客のいない薄暗い店内。奥の席で笠を被った男が、静かにこちらを待っていた。
```

#### `return_03`（text）
**演出:** bg: bg_yato_tavern_night, bgm: bgm_quest_calm, speaker: 忍び衆の連絡員
```text
「……ご苦労だった。獲物は仕留めたな。密書を渡してもらおうか」
```

#### `deliver_document`（check_delivery）
**パラメータ:** item_id: `item_secret_document`, quantity: 1, next: `deliver_check_ok`, fallback: `deliver_check_fail`
**演出:** bg: bg_yato_tavern_night, bgm: bgm_quest_calm
```text
黙って懐から密書を取り出し、男の前に置く。彼は封印の無事を確認した。
```

#### `deliver_check_ok`（text）
**演出:** bg: bg_yato_tavern_night, speaker: 忍び衆の連絡員
```text
「封印は無事か……。よろしい。約束の報酬だ。我らは会わなかった、良いな？」
```

#### `end_success`（end_success）
**演出:** bg: bg_yato_tavern_night
```text
重い金袋を受け取る。彼らが何を企んでいるのか、自分には関係のないことだ。
```
**rewards:** Gold:550, Exp:120, Justice:10

#### `deliver_check_fail`（text）
**演出:** bg: bg_yato_tavern_night, speaker: 忍び衆の連絡員
```text
「……密書がないだと？ 封を切ったか？ 貴様、我らを愚弄するか！」
```

#### `end_failure_lost_end`（end_failure）
**演出:** bg: bg_yato_tavern_night
```text
男の目が細まり、複数の殺気が膨れ上がる。ここで生かしてはおかれない。
```
**rewards:** Gold:0

#### `end_failure`（end_failure）
**演出:** bg: bg_yato_forest
```text
抜け忍たちの暗器に翻弄され、冷たい刃を胸に受ける。意識は闇に沈んでいった。
```
**rewards:** Gold:0

---

## 4. 新規エネミー・アイテム定義参照

**新規追加グループ（`enemy_groups.csv`）:**

| ID | Slug | 構成エネミー |
|-----|-----|-----|
| 432 | `grp_yato_ninja` | `enemy_yato_ninja`\|`enemy_yato_ninja`\|`enemy_yato_spy` |

**新規追加アイテム（`items.csv`）:**

| ID | Slug | Name | Type | Value | Description |
|-----|-----|-----|-----|-----|-----|
| 3020 | `item_secret_document` | 封をされた密書 | material | 0 | 決して中を見てはならないと念を押された黒い巻物。 |
