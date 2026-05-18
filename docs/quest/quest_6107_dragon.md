# クエスト仕様書：6107 — デザートドラゴン

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6107 |
| **Slug** | `qst_legend_dragon` |
| **クエスト種別** | 伝説級ボス（Legend） |
| **推奨レベル** | 27 |
| **難度** | 6 |
| **依頼主** | 冒険者ギルド |
| **出現条件** | EP15（`main_ep15`）クリア済み |
| **リピート** | 1世代1回 |
| **経過日数 (time_cost)** | 10（成功: 10日 / 失敗: 6日） |
| **ノード数** | 60ノード |

---

## 1. クエスト概要

### 短文説明
```
[竜殺し] マルカンドの大砂漠に古代の砂竜が覚醒した。命知らずの勇者を求む。
```

### 長文説明
```
マルカンドの砂漠交易路が壊滅した。砂の下に千年眠っていた古代竜が目覚めたのだ。
その咆哮は砂丘を崩し、吐息は砂を硝子に変える灼熱の業火。
交易商会は莫大な報酬を約束し、竜殺しの英雄を募っている。
```

---

## 2. 報酬定義

**CSV記載形式:** `Gold:8000|Exp:600|Rep:25|Chaos:10`

| ルート | Gold | Exp | Rep | アライメント | スキル報酬 |
|--------|------|-----|:---:|-------------|------------|
| 討伐（デフォルト） | 8000 | 600 | +25 | Chaos:10 | 竜炎のブレス |
| 巣を移動させ共存（選択肢） | 5000 | 600 | +15 | Justice:10 | 竜炎のブレス |

**ユニーク報酬スキル（共通）:**
| card_id | slug | スキル名 | type | AP | 効果 | deck_cost |
|:-------:|------|---------|------|:--:|------|:---------:|
| 83 | `card_dragon_inferno` | 竜炎のブレス | Skill | 5 | 全体100ダメ＋DEF DOWN 2T | 5 |

---

## 3. シナリオノードフロー

### 構成概要
- **導入**（start〜start_04）: ギルドで竜の情報を受ける
- **砂漠行軍**（caravan_01〜desert_03）: マルカンド砂漠を踏破
- **砂嵐トラップ**（sandstorm_trap: hp_damage 10%）
- **蜃気楼分岐**（random_mirage: random_branch 50%）→ 失敗時hp_damage 15%
- **巣の前哨戦**（battle_01: grp 421 砂漠魔獣）
- **竜の巣探索**（nest_01〜nest_08）: 巨大な洞窟と財宝の山
- **ボス戦**（battle_boss: grp 9023 デザートドラゴン）
- **選択分岐**: 討伐→Order:10 / 共存→Justice:10

### ノード詳細

#### `start`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: ギルドマスター
```text
「マルカンドの交易路が完全に止まった。砂の下から竜が出たそうだ」
```

#### `start_02`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: ギルドマスター
```text
「デザートドラゴン。千年以上前の古文書にしか記録がない伝説の存在だ」
```

#### `start_03`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: ギルドマスター
```text
「交易商会が報酬を積み上げている。だが、正直に言おう——生きて帰れる保証はない」
```

#### `start_04`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm
```text
竜殺し。物語の中でしか聞かない言葉だ。だが今、それが自分に求められている。
```

#### `caravan_01`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_field
```text
マルカンドの港町から砂漠へ出発した。護衛を申し出た交易商が同行してくれる。
```

#### `caravan_02`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_field
```text
「竜が出たのはこの先の大砂丘地帯だ。最後に目撃したキャラバンは全滅した」
```

#### `caravan_03`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_field
```text
商人を安全な場所で待たせ、単身で砂丘の奥へ向かった。
```

#### `desert_01`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_quest_tense
```text
大砂丘地帯。見渡す限りの砂の海。太陽が容赦なく照りつける。
```

#### `desert_02`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_quest_tense
```text
砂の上に、巨大な爪跡が刻まれていた。幅は自分の両腕を広げた以上。これが竜の痕跡か。
```

#### `desert_03`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_quest_tense
```text
突然、風が止んだ。空気が灼けるように熱い。次の瞬間——砂嵐が襲ってきた！
```

#### `sandstorm_trap`（hp_damage）
**演出:** bg: bg_marcund_desert, bgm: bgm_quest_tense
**パラメータ:** percent: 10
```text
竜のブレスの残熱が砂嵐を引き起こしたのか。灼けた砂粒が肌を削る。
```

#### `sandstorm_02`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_quest_tense
```text
砂嵐が収まると、地形が変わっていた。砂がガラス状の平原に溶けている。竜の吐息の跡だ。
```

#### `oasis_01`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_quest_mystery
```text
ガラスの平原の先に、不自然な緑が見えた。砂漠のオアシスか——蜃気楼か？
```

#### `oasis_02`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_quest_mystery
```text
近づくと水音がする。本物のオアシスだ。だが水面が異様に輝いている。
```

#### `oasis_03`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_quest_mystery
```text
オアシスを迂回するか、突っ切るか。方角を見失わないよう慎重に進む——
```

#### `random_mirage`（random_branch）
**パラメータ:** prob: 50, next: `mirage_clear`, fallback: `mirage_lost`

#### `mirage_clear`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_quest_calm
**次ノード:** approach_01
```text
蜃気楼のパターンを読み、正しい道を選んだ。竜の巣の方角が見えてきた。
```

#### `mirage_lost`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_quest_tense
```text
蜃気楼に惑わされた！ 同じ場所を何度も回り、体力が削られていく。
```

#### `mirage_trap`（hp_damage）
**演出:** bg: bg_marcund_desert, bgm: bgm_quest_tense
**パラメータ:** percent: 15
```text
灼熱と脱水で意識が朦朧とする。必死に星の位置を読み、ようやく方角を取り戻した。
```

#### `mirage_lost_02`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_quest_tense
```text
大きく消耗したが、竜の巣の方角は掴めた。水を一口だけ含み、前に進む。
```

#### `approach_01`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_quest_tense
```text
砂丘を越えると、巨大なクレーターが現れた。直径は城壁の一辺ほど。竜の巣だ。
```

#### `approach_02`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_quest_tense
```text
クレーターの底に、溶けた砂がガラスの洞窟を形成している。熱気が陽炎のように揺らめく。
```

#### `approach_03`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_quest_tense
```text
洞窟の入口付近に砂漠の魔獣たちが巣を張っている。竜の余熱に寄り付いた下等な魔物だ。
```

#### `approach_04`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_quest_tense
```text
背後を突かれないよう、まずは排除する。武器を抜いた——
```

#### `nest_01`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_quest_tense
```text
魔獣たちがこちらに気づき、一斉に唸り声を上げた。
```

#### `nest_02`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_quest_tense
```text
砂蟲とサソリの群れが迫る——！
```

#### `battle_01`（battle）
**演出:** bg: bg_marcund_desert, bgm: bgm_battle
**パラメータ:** enemy_group_id: 421
```text
砂漠の魔獣たちが襲いかかる！
```

#### `nest_03`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_quest_mystery
```text
ガラスの洞窟に足を踏み入れた。壁面が虹色に輝いている。
```

#### `nest_04`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_quest_mystery
```text
洞窟の奥は天然のドーム状空洞。天井に竜の鱗が突き刺さっている。
```

#### `nest_05`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_quest_mystery
```text
大空洞の中央に、砂金と宝石が山のように積まれていた。竜の財宝か。
```

#### `nest_06`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_quest_mystery
```text
財宝の山の向こうに、巨大な影が横たわっている。規則的な呼吸が洞窟全体を揺らす。
```

#### `nest_07`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_quest_tense
```text
デザートドラゴン。全長は城の塔ほど。黄金色の鱗、燃え上がるような紅い瞳。
```

#### `nest_08`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_quest_tense
```text
竜がこちらに気づいた。巨大な首がゆっくりと持ち上がる。
```

#### `roar_01`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_battle_boss, speaker: デザートドラゴン
```text
「——人間か。千年ぶりに目覚めてみれば、蟻の如き者がやってきたか」
```

#### `roar_02`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_battle_boss, speaker: デザートドラゴン
```text
「自分の宝を守っているだけだ。なぜ人間は討ちに来る。身の程を知れ」
```

#### `roar_03`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_battle_boss
```text
「交易路を塞いでいるのはお前の巣だ。人が暮らせなくなっている」——言葉を返す。
```

#### `roar_04`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_battle_boss, speaker: デザートドラゴン
```text
「知ったことか。ならば力で示せ。竜に挑む愚かさの代償を——その身で味わえ」
竜が翼を広げた。洞窟が地鳴りのように震える。
```

#### `battle_boss`（battle）
**演出:** bg: bg_marcund_desert, bgm: bgm_battle_boss
**パラメータ:** enemy_group_id: 9023
```text
デザートドラゴンとの死闘——！
```

#### `victory_01`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_quest_calm
```text
竜の巨体が揺らぎ、崩れ落ちた。黄金の鱗が剥がれていく。
```

#### `victory_02`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_quest_calm, speaker: デザートドラゴン
```text
「……千年眠り、目覚めた途端に敗れるか。人間とは——面白い種族だ」
```

#### `victory_03`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_quest_calm, speaker: デザートドラゴン
```text
「殺すか、それとも封じるか。竜は、負けた者に従う」
竜は静かに首を下げた。
```

#### `choice_dragon`（choice）
**演出:** bg: bg_marcund_desert, bgm: bgm_quest_calm
| 選択肢 | next_node |
|---------|-----------|
| 「止めを刺す。竜の脅威を永久に除く」 | slay_01 |
| 「巣を砂漠の奥に移せ。人の道から離れろ」 | coexist_01 |

#### `slay_01`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_quest_tense
```text
渾身の一撃を竜の額に叩き込んだ。洞窟が崩落し始める。
```

#### `slay_02`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_quest_calm
```text
崩れゆく洞窟から脱出した。背後で竜の巣が砂に沈む。竜殺しの英雄——称号が現実になった。
```

#### `end_success`（end_success）
**演出:** bg: bg_guild
```text
「デザートドラゴン討伐を確認！ 交易路は復旧する。お前は英雄だ」
交易商会から莫大な報酬を受け取った。竜の鱗は勲章として飾られるだろう。
```
**rewards:** Gold:8000, Exp:600, Rep:25, Chaos:10

#### `coexist_01`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_quest_calm, speaker: デザートドラゴン
```text
「……殺さぬか。珍しい人間だ」
竜の紅い瞳にわずかな感情が灯った。
```

#### `coexist_02`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_quest_calm
```text
「ここから東に三日の場所に、人の通わぬ岩山がある。そこへ巣を移せ」
```

#### `coexist_03`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_quest_calm, speaker: デザートドラゴン
```text
「承知した。自分は恩を忘れぬ種族だ。次に会う時は、味方として来よう」
竜は翼を広げ、砂嵐と共に東の空へ消えた。
```

#### `end_success_peace`（end_success）
**演出:** bg: bg_guild
```text
「竜が去ったのか……交易路の安全は確認された」
報酬は控えめだが、砂漠の空に黄金の影が消えていく姿は——悪くなかった。
```
**rewards:** Gold:5000, Exp:600, Rep:15, Justice:10

#### `end_failure`（end_failure）
**演出:** bg: bg_marcund_desert
```text
竜のブレスが全身を包んだ。砂が硝子に変わる灼熱の中、意識が溶けていく。
「蟻は所詮——蟻か」
```

---

## 4. エネミー定義参照

| ID | Slug | name | level | hp | atk | def |
|-----|-----|-----|-----|-----|-----|-----|
| 6023 | `boss_desert_dragon` | デザートドラゴン | 40 | 2500 | 140 | 35 |

**ボスユニークスキル:**
| id | slug | スキル名 | effect_type | value | 説明 |
|----|------|---------|:-----------:|:-----:|------|
| 4007 | `skill_dragon_nova` | 砂漠灼熱砲 | damage | 5 | 超高威力ブレス |
| 4008 | `skill_dragon_wing` | 翼撃 | damage_stun | 2 | 翼で叩きつけスタン(1T) |
| 4009 | `skill_dragon_roar_e` | 威圧の咮哮 | debuff_def_down | 0 | DEF DOWN(3T) |

| グループID | Slug | 用途 |
|-----|-----|-----|
| 421 | `grp_desert_beast` | 前哨戦: 砂漠魔獣 |
| 9023 | `enemy_grp_boss_dragon` | ボス戦 |

---

## 5. CSVエントリ

`quests_special.csv`
```csv
6107,qst_legend_dragon,デザートドラゴン,27,6,10,"{""completed_quest"":""main_ep15""}",false,,,冒険者ギルド,[竜殺し] マルカンドの大砂漠に古代の砂竜が覚醒した。命知らずの勇者を求む。
```
