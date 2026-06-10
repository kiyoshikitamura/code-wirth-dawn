# クエスト仕様書：7021 — 幻覚サソリの毒針調達

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7021 |
| **Slug** | `qst_mar_scorpion` |
| **クエスト種別** | 一般クエスト（Normal） |
| **推奨レベル** | 5（Normal） |
| **難度** | 2 |
| **依頼主** | 闇商人 |
| **出現条件** | 出現国: マルカンド |
| **リピート** | リピート可能 |
| **経過日数 (time_cost)** | 2 |
| **ノード数** | 31ノード |
| **ゲストNPC** | なし |
| **難易度Tier** | Normal（rec_level: 5） |
| **サムネイル画像** | `/images/quests/bg_desert.png` |
## 1. クエスト概要

### 短文説明
```
[納品] 砂漠の奥地に棲む幻覚サソリを狩り、闇商人に毒針を納品する。
```

### 長文説明
```
マルカンドの裏路地で、闇商人から密かに依頼を受けた。「幻覚サソリの毒針」——暗殺用の薬や違法な麻薬の原料となる希少な素材だ。
砂漠の岩場に棲むこの危険な生き物の毒は、微量で人を幻覚に陥れ、過剰摂取で確実に殺す。
正規の市場には出回らない品であり、手を出すこと自体が後ろ暗い。だが、闇商人の金払いは良い。
毒針は3本必要だが、1回のバトルで確実に取れるとは限らない。
```

## 2. 報酬定義

```
Gold:300|Evil:5|Chaos:5|Exp:100
```

## 2.5. 失敗ペナルティ（共通仕様）

| 条件 | ペナルティ |
|------|-----------|
| クエスト失敗（敗北/撤退/ギブアップ） | 名声 -3〜-10（ランダム、現在拠点） |
| バトル敗北（全般） | VIT -1（クエスト/ランダムエンカウント/賞金稼ぎ共通） |
| 経過日数 | クエスト定義の days_failure 値を適用 |

## 3. シナリオノード構成

### 全体フロー

```text
start → start_desc → intro_1 → intro_1_detail → intro_2 → intro_2_warn → travel_desert → travel_scenery
  → reach_rocks → reach_rocks_desc → search_1 → search_wait → find_nest → nest_desc → nest_rush
    → battle_scorpion
       ├─ win → harvest_result（分岐）
       │    ├─ success → harvest_success → check_needles（分岐）
       │    │    ├─ success → travel_back → travel_back_scenery → back_alley → back_alley_desc → deliver_1 → dealer_reply → dealer_reply_02 → end_success
       │    │    └─ failure → hunt_continue → battle_scorpion（ループ）
       │    └─ failure → harvest_fail → harvest_fail_avoid → check_needles
       └─ lose → end_failure
```

### ノード詳細（31ノード）

#### `start`（text）
**演出:** bg: bg_slums, bgm: bgm_quest_tense
```text
マルカンドの裏路地。強い香辛料と不衛生なドブの臭いが混じり合う、狭い闇市の一角。
```

#### `start_desc`（text）
**演出:** bg: bg_slums
```text
フードを目深に被った男が、外套の下から細く汚れた指を伸ばして手招きする。
```

#### `intro_1`（text）
**演出:** bg: bg_slums, speaker: 闇商人
```text
「幻覚サソリの毒針が欲しい。鮮度の良いものを３本だ」
```

#### `intro_1_detail`（text）
**演出:** bg: bg_slums, speaker: 闇商人
```text
「何に使うかは詮索するな。それがここのルールだ」
```

#### `intro_2`（text）
**演出:** bg: bg_slums, speaker: 闇商人
```text
「巣は砂漠の東にある岩場だ。尾の先が紫色に光っている」
```

#### `intro_2_warn`（text）
**演出:** bg: bg_slums, speaker: 闇商人
```text
「ほんの掠り傷でも、脳が狂って死ぬことになるぞ」
```

#### `travel_desert`（text）
**演出:** bg: bg_desert, bgm: bgm_field
```text
東の熱砂へ向かう。巻き上がる砂塵が視界を遮り、喉を執拗に痛めつける。
```

#### `travel_scenery`（text）
**演出:** bg: bg_desert
```text
乾いた風が吹き抜け、不気味な白骨化した獣の死骸があちこちに転がっていた。
```

#### `reach_rocks`（text）
**演出:** bg: bg_desert
```text
半日歩き、赤茶けた岩場に到着した。岩壁の隙間から、紫色の怪しい光が漏れる。
```

#### `reach_rocks_desc`（text）
**演出:** bg: bg_desert
```text
岩場の周囲の草木は毒気で枯れ果て、触れるだけで崩れ去るほど脆くなっていた。
```

#### `search_1`（text）
**演出:** bg: bg_desert
```text
岩の奥へ石を投げ込む。暗闇からカサカサと、硬い殻が擦れ合う音が響いた。
```

#### `search_wait`（text）
**演出:** bg: bg_desert
```text
様子を見る。しかし、用心深い魔獣はなかなか暗い裂け目から姿を現そうとしない。
```

#### `find_nest`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_tense
```text
岩の裏には無数の巣穴。周囲の砂が紫色に染まっているのは、蓄積した毒のせいか。
```

#### `nest_desc`（text）
**演出:** bg: bg_desert
```text
穴から巨大なサソリが現れた。大人の腕ほどもあり、鋭い鋏を威嚇するように鳴らす。
```

#### `nest_rush`（text）
**演出:** bg: bg_desert
```text
一匹だけではない。地中から次々と、紫色の毒針を掲げた影が這い回り始める。
```

#### `battle_scorpion`（battle）
**演出:** bg: bg_desert, bgm: bgm_battle
| 設定 | 値 |
|-----|-----|
| 敵グループID | `422` |
| 敵表示名 | 幻覚サソリの群れ |

```text
尾の毒針を妖しく光らせた幻覚サソリの群れが、一斉に襲いかかってきた！
```

#### `harvest_result`（random_branch）
**パラメータ:** next: `harvest_success`, fallback: `harvest_fail`, prob: 50

#### `harvest_success`（reward）
**パラメータ:** item_id: `item_scorpion_needle`, next: `check_needles`
**演出:** bg: bg_desert
```text
慎重に切り離した。紫色の鮮やかな針を、丁寧にガラス瓶の中へ封印する。
```

#### `harvest_fail`（text）
**演出:** bg: bg_desert
```text
切り離す際に力が入り、針が砕けてしまった。有毒な紫の霧が微かに舞い散る。
```

#### `harvest_fail_avoid`（text）
**演出:** bg: bg_desert
```text
慌てて息を止めて飛び退く。砕けた針は、もはや何の価値もなくなってしまった。
```
**次ノード:** `check_needles`

#### `check_needles`（check_delivery）
**パラメータ:** item_id: `item_scorpion_needle`, quantity: 3, next: `travel_back`, fallback: `hunt_continue`

#### `hunt_continue`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_tense
```text
まだ３本に達していない。巣穴を刺激し、次の獲物を地表へと引きずり出す。
```
**次ノード:** `battle_scorpion`

#### `travel_back`（text）
**演出:** bg: bg_desert, bgm: bgm_field
```text
毒針が３本揃った。砂漠の熱で変質する前に、急いでマルカンドへ戻らねば。
```

#### `travel_back_scenery`（text）
**演出:** bg: bg_desert
```text
夕陽が砂漠を血のように赤く染めていく。背中の猛毒の危険を感じつつ歩みを急ぐ。
```

#### `back_alley`（text）
**演出:** bg: bg_slums, bgm: bgm_quest_tense
```text
日没後、異様な香とドブの臭いが満ちる裏路地へ戻る。闇商人は同じ場所にいた。
```

#### `back_alley_desc`（text）
**演出:** bg: bg_slums
```text
怪しげな薬売りや密売人たちの視線を避けながら、待ち合わせの路地裏の奥へと進む。
```

#### `deliver_1`（text）
**演出:** bg: bg_slums
```text
毒針の入った瓶を手渡す。男は小窓のランプの光に透かし、一本ずつ吟味した。
```

#### `dealer_reply`（text）
**演出:** bg: bg_slums, speaker: 闇商人
```text
「どれも極上だ。これだけ新鮮なら、最高の幻覚剤が作れる」
```

#### `dealer_reply_02`（text）
**演出:** bg: bg_slums, speaker: 闇商人
```text
「これは報酬だ。また汚い仕事が欲しくなったらここへ来い」
```

#### `end_success`（end_success）
**演出:** bg: bg_slums
```text
金貨を受け取る。この毒が誰かを狂わせるのだろうが、私には関係のないことだ。
```
**rewards:** Gold:300, Evil:5, Chaos:5, Exp:100

#### `end_failure`（end_failure）
**演出:** bg: bg_desert
```text
防ぎきれず、毒針が肉を引き裂いた。紫色の幻想の中、意識は永遠に失われた。
```

---

## 4. 敵定義参照

| enemy_group_id | グループ名 |
|----------------|-----------|
| 422 | 幻覚サソリの群れ |

## 4.5. 新規アイテム定義

| ID | Slug | Name | Type | Value | Description |
|-----|-----|-----|-----|-----|-----|
| 3005 | `item_scorpion_needle` | サソリの毒針 | material | 0 | 幻覚サソリから採取した新鮮な毒針。暗殺薬の原料として闇市場で高値で取引される。 |
