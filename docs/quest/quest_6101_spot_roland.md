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
| **ノード数** | 78ノード |
| **サムネイル画像** | `/images/quests/bg_spot_roland_tomb.png` |

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
Exp:500|Rep:-100|Item:603|Align:秩序+100
```

### 報酬アイテム詳細

| ID | Slug | 名前 | Type | 効果 | 入手 |
|---|---|---|---|---|---|
| 601 | `spot_eclipse_bind` | 五英霊の誓約 | consumable | アルヴィンに2000固定ダメージ | 道中(get_promise) |
| 602 | `spot_god_robe` | 神の法衣 | equipment/armor | DEF+8, HP+50 | ルートA |
| 603 | `spot_regalia_brave` | 五星の加護 | skill(card) | dmg35+ATK UP(5T), deck_cost:4 | ルートB |

---

## 2.5 失敗ペナルティ

| 項目 | 値 |
|-----|-----|
| VIT変動 | VIT -1 |
| 経過日数（失敗） | 5日 |

---

## 3. シナリオノードフロー

```text
start
 └─ start_02 → start_03 → start_04 → start_05
     └─ start_06 → start_07 → start_08
         └─ ug_01 → ug_02 → ug_03 → ug_04 → ug_05
             └─ battle_protos
                  ├─ win → get_promise → promise_02~06
                  │        └─ eluka_01~04 → boss_eluka
                  │             ├─ win → after_eluka → after_eluka_02
                  │             │        └─ baram_01~05 → boss_baram
                  │             │             ├─ win → after_baram → after_baram_02
                  │             │             │        └─ shirasu_01~04 → boss_shirasu
                  │             │             │             ├─ win → after_shirasu~02
                  │             │             │             │        └─ lyra_01~04 → boss_lyra
                  │             │             │             │             ├─ win → after_lyra~03
                  │             │             │             │             │        └─ alvin_01~05 → boss_alvin
                  │             │             │             │             │             ├─ win → choice_01~07 → choice_final
                  │             │             │             │             │             │    ├─ 討伐 → end_kill_01~end_kill
                  │             │             │             │             │             │    └─ 封印 → end_seal_01~end_seal
                  │             │             │             │             │             └─ lose → end_failure~fin
                  │             │             │             │             └─ lose → end_failure
                  │             │             │             └─ lose → end_failure
                  │             │             └─ lose → end_failure
                  │             └─ lose → end_failure
                  └─ lose → end_failure
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_spot_roland_fire, bgm: bgm_quest_crisis
```text
王都レガリア中央広場。
噴水の水が赤黒く染まっていた。
```

#### `start_02`（text）
**演出:** bg: bg_spot_roland_fire, bgm: bgm_quest_crisis
```text
聖騎士が血だらけで走ってきた。
甲冑の胸当てが拳で潰されている。
```

#### `start_03`（text）
**演出:** bg: bg_spot_roland_fire, bgm: bgm_quest_crisis, speaker: 聖騎士
```text
「逃げろ！
　やつらは……人じゃない！」
```

#### `start_04`（text）
**演出:** bg: bg_spot_roland_fire, bgm: bgm_quest_crisis, speaker: 聖騎士
```text
「英霊が……蘇った英霊が
　街を壊してる！」
```

#### `start_05`～`start_08`（text）
**演出:** bg: bg_spot_roland_fire, bgm: bgm_quest_crisis
大聖堂の爆発、聖女・不滅の王の威力描写、地下墓所への撤退。

#### `ug_01`～`ug_05`（text）
**演出:** bg: bg_spot_roland_tomb, bgm: bgm_quest_mystery
地下墓所の最奥で隠し部屋を発見。祭壇の守護者が出現。

#### `battle_protos`（battle）
**演出:** bg: bg_spot_roland_tomb, bgm: bgm_battle_strong
**パラメータ:** enemy_group_id: 300, next: get_promise, fail: end_failure

#### `get_promise`（reward）
**演出:** bg: bg_spot_roland_tomb, bgm: bgm_quest_mystery
**アイテム:** 601（五英霊の誓約）

#### `promise_02`～`promise_06`（text）
**演出:** bg: bg_spot_roland_tomb, bgm: bgm_quest_mystery, speaker: 英霊の声（03～05）
英霊の声が語りかけ、誓約の石の使い方を伝える。

#### `eluka_01`～`eluka_04`（text）→ `boss_eluka`（battle）
**演出:** bg: bg_spot_roland_tomb, speaker: 聖女エルーカ（02, 04）
**パラメータ:** enemy_group_id: 301, next: after_eluka, fail: end_failure

#### `after_eluka`～`after_eluka_02`（text）
**演出:** speaker: 聖女エルーカ（02）
エルーカの最後の言葉「……ありがとう。やっと、眠れる」

#### `baram_01`～`baram_05`（text）→ `boss_baram`（battle）
**演出:** bg: bg_spot_roland_tomb, speaker: 賢者バラム（03, 05）
**パラメータ:** enemy_group_id: 302, next: after_baram, fail: end_failure

#### `after_baram`～`after_baram_02`（text）
**演出:** speaker: 賢者バラム（02）
バラムの最後の言葉「研究者は常に仮説を修正するものだ」

#### `shirasu_01`～`shirasu_04`（text）→ `boss_shirasu`（battle）
**演出:** bg: bg_spot_roland_tomb, speaker: 盾のシラス（04）
**パラメータ:** enemy_group_id: 303, next: after_shirasu, fail: end_failure

#### `after_shirasu`～`after_shirasu_02`（text）
**演出:** speaker: 盾のシラス（02）

#### `lyra_01`～`lyra_04`（text）→ `boss_lyra`（battle）
**演出:** bg: bg_spot_roland_tomb, speaker: 射手リラ（04）
**パラメータ:** enemy_group_id: 304, next: after_lyra, fail: end_failure

#### `after_lyra`～`after_lyra_03`（text）
**演出:** speaker: 射手リラ（02, 03）

#### `alvin_01`～`alvin_05`（text）→ `boss_alvin`（battle）
**演出:** bg: bg_spot_roland_core, bgm: bgm_battle_boss, speaker: 不滅の王アルヴィン（04, 05）
**パラメータ:** enemy_group_id: 305, next: choice_01, fail: end_failure

#### `choice_01`～`choice_07`（text）→ `choice_final`（choice）
**演出:** bg: bg_spot_roland_core, bgm: bgm_spot_final_choice
- speaker: 不滅の王アルヴィン（02, 03, 07）, 現国王（05）
- 選択肢: 「王の命令に従い討伐する」→ `end_kill_01` / 「誓約の力で封印する」→ `end_seal_01`

#### `end_kill_01`～`end_kill`（end_success）
**演出:** bg: bg_spot_roland_core
**rewards:** Exp:500, Gold:10000, Rep:200, Item:602

#### `end_seal_01`～`end_seal`（end_success）
**演出:** bg: bg_spot_roland_core
**rewards:** Exp:500, Rep:-100, Item:603, Order:100

#### `end_failure`～`end_failure_fin`（end_failure）
**演出:** bg: bg_spot_roland_tomb

---

## 4. 新規エネミー・アイテム定義参照

既存エネミー・アイテムを使用。追加なし。

---

## 5. CSVエントリ

`quests_special.csv`
```csv
6101,qst_spot_roland,忘却の五英霊 ―レガリア崩落の真実―,20,5,7,loc_roland,,,,,Exp:500|Gold:10000|Rep:200|Item:602,聖騎士団,王都レガリアに突如現れた「五英霊」。暴走する彼らを止め真実を暴け。
```

---

## 6. 実装チェックリスト

- [x] テキスト分割（30-35文字/ノード）適用
- [x] speaker_name 全ノードに適用
- [x] ノード数: 78ノード
- [x] 全バトルにwin/loseの両方のCHOICE行あり
- [ ] enemy_group_id 300-305 がDBに登録済み
- [ ] 報酬アイテム 601-603 がDBに登録済み
