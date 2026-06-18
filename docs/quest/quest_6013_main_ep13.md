# クエスト仕様書：6013 — 第13話「癒しの暴君」

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6013 |
| **Slug** | `main_ep13` |
| **クエスト種別** | メインエピソード（Main） |
| **推奨レベル** | 18（Hard） |
| **難度** | 3 |
| **依頼主** | なし |
| **出現条件** | 第12話「炎の審判者」（6012）クリア / 滞在拠点: 華龍神朝首都 天極城「龍京」 |
| **リピート** | アカウント通じて1回のみ（継承後も非表示） |
| **経過日数 (time_cost)** | 2 |
| **ノード数** | 42ノード |
| **ゲストNPC** | ヴォルグ（guest_join → leave） |
| **難易度Tier** | Hard（rec_level: 18） |
| **サムネイル画像** | `/images/quests/bg_ryukyo_ruined.png` |
---

## 1. クエスト概要

### 短文説明
```
眠れる都・龍京。大天使ラファエルがもたらす「偽りの安らぎ」。
```

### 長文説明
```
華龍神朝の都・龍京は、使徒の撒く緑の粒子によって、住民全員が眠る都市と化していた。
激しい睡魔が襲う中、自らの身を切る痛みで意識を保つヴォルグと共に、大天使ラファエルへ挑む。
```

---

## 2. 報酬定義
```
Exp:350|Gold:1800|Rep:20|Order:5
```

---

## 3. シナリオノード構成（42ノード）

### 全体フロー
```text
start → start_02 → volg_join → arrival_01 → arrival_02
  → silence_01 → silence_02 → sleeping_01 → sleeping_02 → volg_01 → volg_02
  → soldier_01 → soldier_02 → presence_01 → presence_02 → presence_03 → guard_01
  → battle1(503) → choice1 → throne_01 → throne_02
  → raphael_01 → raphael_02 → raphael_03 → raphael_04
  → volg_rage_01 → volg_rage_02 → volg_rage_03 → volg_rage_04 → volg_rage_05
  → battle2(9041) → choice2 → retreat_01 → retreat_02 → retreat_03
  → awaken_01 → awaken_02 → volg_leave → next_01 → next_02 → end_node
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_road_day, bgm: bgm_quest_calm
```text
華龍神朝の首都、龍京へと続く街道を進む。
```

#### `start_02`（text）
**演出:** bg: bg_road_day
```text
約束の場所で、ヴォルグが待っていた。
```

#### `volg_join`（guest_join）
**パラメータ:** guest_id: `npc_guest_volg`

#### `arrival_01`（text）
**演出:** bg: bg_ryukyo_ruined, bgm: bgm_quest_tense
```text
龍京の城門に到着するが、門兵の姿が見当たらない。
```

#### `arrival_02`（text）
**演出:** bg: bg_ryukyo_ruined
```text
都の中に一歩踏み入ると、異様な静寂が支配していた。
```

#### `silence_01`（text）
**演出:** bg: bg_ryukyo_ruined
```text
見ると、路傍に多くの人々が横たわっている。
```

#### `silence_02`（text）
**演出:** bg: bg_ryukyo_ruined
```text
皆、穏やかな表情で深い眠りに落ちていた。
```

#### `sleeping_01`（text）
**演出:** bg: bg_ryukyo_ruined
```text
声をかけても、体を揺すっても、起きる気配はない。
```

#### `sleeping_02`（text）
**演出:** bg: bg_ryukyo_ruined
```text
都全体が、呪われた眠りに包まれているかのようだ。
```

#### `volg_01`（text）
**演出:** bg: bg_ryukyo_ruined, speaker: ヴォルグ
```text
「死体じゃねえな。だが、眠ったまま起きやしねえ」
```

#### `volg_02`（text）
**演出:** bg: bg_ryukyo_ruined
```text
上空から、光る緑の微粒子が静かに舞い降りてくる。
```

#### `soldier_01`（text）
**演出:** bg: bg_ryukyo_ruined
```text
粒子を浴びた瞬間、激しい睡魔があなたを襲った。
```

#### `soldier_02`（text）
**演出:** bg: bg_ryukyo_ruined
```text
意識が遠のき、立っていることさえ困難になる。
```

#### `presence_01`（text）
**演出:** bg: bg_ryukyo_ruined
```text
広場の中心に、眠りの粒子を撒く奇妙な使徒が現れる。
```

#### `presence_02`（text）
**演出:** bg: bg_ryukyo_ruined
```text
睡魔を払うため、あなたは強く奥歯を噛み締めた。
```

#### `presence_03`（text）
**演出:** bg: bg_ryukyo_ruined
```text
使徒を排除しなければ、この眠りからは逃れられない。
```

#### `guard_01`（text）
**演出:** bg: bg_ryukyo_ruined
```text
あなたは武器を構え、使徒に向かって踏み出す。
```

#### `battle1`（battle）
**演出:** bg: bg_ryukyo_ruined, bgm: bgm_battle
**パラメータ:** enemy_group_id: 503, next: choice1, fail: end_failure

#### `choice1`（choice）
**演出:** bg: bg_ryukyo_ruined, bgm: bgm_battle
| 選択肢 | next_node |
|---|---|
| 「眠りの使徒を排除する」 | `throne_01` |

#### `throne_01`（text）
**演出:** bg: bg_ryukyo_ruined
```text
使徒を撃破したが、睡魔の源はまだ消えていない。
```

#### `throne_02`（text）
**演出:** bg: bg_ryukyo_ruined
```text
宮殿の奥から、さらに濃厚な眠りの霧が溢れ出す。
```

#### `raphael_01`（text）
**演出:** bg: bg_ryukyo_ruined
```text
光の粒子が寄り集まり、大天使ラファエルが降臨した。
```

#### `raphael_02`（text）
**演出:** bg: bg_ryukyo_ruined
```text
慈愛に満ちた瞳で、大天使はあなたたちを見つめる。
```

#### `raphael_03`（text）
**演出:** bg: bg_ryukyo_ruined, speaker: 大天使ラファエル
```text
「苦シミハモウ終ワリニシヨウ。全テ眠リノ中デ癒サレル」
```

#### `raphael_04`（text）
**演出:** bg: bg_ryukyo_ruined
```text
甘い声が脳裏に響き、体に吸い込まれるように眠気が増す。
```

#### `volg_rage_01`（text）
**演出:** bg: bg_ryukyo_ruined
```text
ヴォルグもまた、睡魔に膝を突きそうになっていた。
```

#### `volg_rage_02`（text）
**演出:** bg: bg_ryukyo_ruined
```text
その時、ヴォルグは大剣で自らの腕を切り裂いた！
```

#### `volg_rage_03`（text）
**演出:** bg: bg_ryukyo_ruined, speaker: ヴォルグ
```text
「ぐっ……！ 痛みで目が覚めたぜ。安らぎなんざ不要だ！」
```

#### `volg_rage_04`（text）
**演出:** bg: bg_ryukyo_ruined
```text
あなたも己の頬を強く叩き、無理やり意識を繋ぎ止める。
```

#### `volg_rage_05`（text）
**演出:** bg: bg_ryukyo_ruined
```text
大天使がもたらす『偽りの救い』を拒み、剣を構えた。
```

#### `battle2`（battle）
**演出:** bg: bg_ryukyo_ruined, bgm: bgm_battle_strong
**パラメータ:** enemy_group_id: 9041, next: choice2, fail: end_failure

#### `choice2`（choice）
**演出:** bg: bg_ryukyo_ruined, bgm: bgm_battle_strong
| 選択肢 | next_node |
|---|---|
| 「ラファエルを打ち破る」 | `retreat_01` |

#### `retreat_01`（text）
**演出:** bg: bg_ryukyo_ruined
```text
激闘の末、大天使の防御を突き崩し、その身に傷を負わせる。
```

#### `retreat_02`（text）
**演出:** bg: bg_ryukyo_ruined
```text
ラファエルは光の粒子となって、天空へと退却した。
```

#### `retreat_03`（text）
**演出:** bg: bg_ryukyo_ruined, speaker: 大天使ラファエル
```text
「偽リノ覚醒ハ苦痛ノミナリ……。次ハ夜刀ノ出雲ヘ……」
```

#### `awaken_01`（text）
**演出:** bg: bg_ryukyo_ruined, bgm: bgm_quest_calm
```text
大天使の撤退と共に、都を覆っていた眠りの霧が晴れる。
```

#### `awaken_02`（text）
**演出:** bg: bg_ryukyo_ruined
```text
眠っていた人々が、一人、また一人と目を覚まし始めた。
```

#### `volg_leave`（leave）
**パラメータ:** guest_id: `npc_guest_volg`

#### `next_01`（text）
**演出:** bg: bg_ryukyo_ruined, speaker: ヴォルグ
```text
「次は出雲だな。天の奴ら、次々と面倒を起こしやがる」
```

#### `next_02`（text）
**演出:** bg: bg_ryukyo_ruined
```text
ヴォルグは腕の傷を包帯で縛り、早くも次の地へ歩み出す。
```

#### `end_node`（end_success）
**演出:** bg: bg_ryukyo_ruined
```text
都の覚醒を見届け、あなたは出雲への路を急いだ。
```
**rewards:** Exp:350, Gold:1800, Rep:20, Order:5

#### `end_failure`（end_failure）
**演出:** bg: bg_ryukyo_ruined
```text
心地よい睡魔に身を委ね、あなたは二度と目覚めなかった。
```
**rewards:** Gold:0
