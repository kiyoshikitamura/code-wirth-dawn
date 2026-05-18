# クエスト仕様書：6109 — オメガ・ゴーレム

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6109 |
| **Slug** | `qst_legend_golem` |
| **クエスト種別** | 伝説級ボス（Legend） |
| **推奨レベル** | 25 |
| **難度** | 6 |
| **依頼主** | 冒険者ギルド |
| **出現条件** | EP15（`main_ep15`）クリア済み |
| **リピート** | 1世代1回 |
| **経過日数 (time_cost)** | 8（成功: 8日 / 失敗: 5日） |
| **ノード数** | 52ノード |

---

## 1. クエスト概要

### 短文説明
```
[封印指定] 古代文明の遺跡から起動した巨大ゴーレムが都市に向かっている。迎撃せよ。
```

### 長文説明
```
ローランド聖王国の辺境で、古代文明の遺産——オメガ・ゴーレムが起動した。
高さ十数メートルの鋼鉄の巨人。かつて戦争の最終兵器として作られたそれは、
創造者の命令を未だに実行し続けている：「全ての敵を殲滅せよ」。
ゴーレムは最寄りの都市に向かって進行中。到達すれば都市は壊滅する。
```

---

## 2. 報酬定義

**CSV記載形式:** `Gold:5000|Exp:500|Rep:20|Order:10`

| ルート | Gold | Exp | Rep | アライメント | スキル報酬 |
|--------|------|-----|:---:|-------------|------------|
| 完全破壊（デフォルト） | 5000 | 500 | +20 | Order:10 | ゴーレムコア |
| コアを停止し保存（選択肢） | 3500 | 500 | +15 | Justice:10 | ゴーレムコア |

**ユニーク報酬スキル（共通）:**
| card_id | slug | スキル名 | type | AP | 効果 | deck_cost |
|:-------:|------|---------|------|:--:|------|:---------:|
| 85 | `card_golem_core` | ゴーレムコア | Support | 3 | ATK×1.5＋DEF+20を5T | 4 |

---

## 3. シナリオノードフロー

### 構成概要
- **導入**（start〜start_04）: ゴーレム起動の緊急報
- **進軍路追跡**（march_01〜march_04）: ゴーレムの破壊痕を追う
- **check_flag**: 遺跡の古文書からゴーレムの弱点を学ぶ（modify_flag: learned_weakness）
- **前哨戦**（battle_01: grp 101 アンデッド——遺跡で目覚めた亡者）
- **迎撃ポイント設営**（intercept_01〜intercept_04）
- **hp_damageトラップ**（shockwave_trap: 10%——ゴーレムの衝撃波）
- **ボス戦**（battle_boss: grp 9025 オメガ・ゴーレム）
- **選択分岐**: 完全破壊→Order:10 / コア保存→Justice:10

### ノード詳細

#### `start`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: ギルドマスター
```text
「緊急事態だ。辺境の遺跡から古代兵器が起動した」
```

#### `start_02`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: ギルドマスター
```text
「オメガ・ゴーレム。高さ十メートル超の鋼鉄の巨人だ。都市に向かって進行している」
```

#### `start_03`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: ギルドマスター
```text
「到達予測は三日後。聖騎士団は結界を張って遅延させているが、抜かれるのは時間の問題だ」
```

#### `start_04`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm
```text
古代文明の最終兵器。対処法すら分からない。だが止めなければ、都市が消える。
```

#### `march_01`（text）
**演出:** bg: bg_road_day, bgm: bgm_quest_tense
```text
辺境へ急行した。街道にゴーレムの進路の痕跡が残っている——巨大な足跡が大地を抉っていた。
```

#### `march_02`（text）
**演出:** bg: bg_road_day, bgm: bgm_quest_tense
```text
足跡の周囲の樹木は根こそぎ倒れ、岩は粉砕されている。圧倒的な質量の暴力。
```

#### `march_03`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_mystery
```text
進路を逆に辿ると、ゴーレムが起動した遺跡に到達した。崩壊した入口の先に研究室がある。
```

#### `march_04`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_mystery
```text
研究室の古文書を漁る。ゴーレムの動力源は「コア」と呼ばれる魔力結晶。それを破壊すれば停止する。
```

#### `learn_weakness`（modify_flag）
**パラメータ:** next: `ruin_battle_01`
（フラグ `learned_weakness` をセット）

#### `ruin_battle_01`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_tense
```text
古文書を持って遺跡を出ようとした時、崩壊した遺跡から目覚めた亡者たちが襲いかかってきた！
```

#### `battle_01`（battle）
**演出:** bg: bg_ruin_crypt, bgm: bgm_battle
**パラメータ:** enemy_group_id: 101
```text
遺跡のアンデッドたちが襲いかかる！
```

#### `intercept_01`（text）
**演出:** bg: bg_road_day, bgm: bgm_quest_tense
```text
亡者を退け、ゴーレムの進路に先回りした。都市まであと半日の場所で迎撃する。
```

#### `intercept_02`（text）
**演出:** bg: bg_road_day, bgm: bgm_quest_tense
```text
地平線の先に砂塵が見えた。ゴーレムが来る。地面が規則的に揺れ始めた。
```

#### `intercept_03`（text）
**演出:** bg: bg_road_day, bgm: bgm_quest_tense
```text
鋼鉄の巨体が姿を現した。錆びた装甲。赤く光るコアの眼。千年経っても止まらぬ殺戮装置。
```

#### `intercept_04`（text）
**演出:** bg: bg_road_day, bgm: bgm_quest_tense
```text
ゴーレムがこちらを認識した。腕を振り上げ——地面を叩きつけた！
```

#### `shockwave_trap`（hp_damage）
**演出:** bg: bg_road_day, bgm: bgm_quest_tense
**パラメータ:** percent: 10
```text
衝撃波が大地を走り、全身に叩きつけられる。骨が軋む。だがまだ立てる。
```

#### `shockwave_02`（text）
**演出:** bg: bg_road_day, bgm: bgm_battle_boss
```text
態勢を立て直す。コアは胸部の装甲の奥にある。あそこを狙うしかない。
```

#### `shockwave_03`（text）
**演出:** bg: bg_road_day, bgm: bgm_battle_boss
```text
ゴーレムが再び腕を振り上げた。今度は——正面から受けて立つ！
```

#### `battle_boss`（battle）
**演出:** bg: bg_road_day, bgm: bgm_battle_boss
**パラメータ:** enemy_group_id: 9025
```text
古代最終兵器オメガ・ゴーレムとの激突——！
```

#### `victory_01`（text）
**演出:** bg: bg_road_day, bgm: bgm_quest_calm
```text
胸部装甲を打ち砕いた。コアが剥き出しになり、ゴーレムの動きが鈍る。
```

#### `victory_02`（text）
**演出:** bg: bg_road_day, bgm: bgm_quest_calm
```text
コアは脈打つように光っている。これは単なる動力源ではない——古代文明の叡智の結晶だ。
```

#### `victory_03`（text）
**演出:** bg: bg_road_day, bgm: bgm_quest_calm
```text
完全に破壊すれば脅威は消える。だがこのコアを保存すれば、古代の技術を解明できるかもしれない。
```

#### `choice_golem`（choice）
**演出:** bg: bg_road_day, bgm: bgm_quest_calm
| 選択肢 | next_node |
|---------|-----------|
| 「コアを破壊する。二度と起動させてはならない」 | destroy_01 |
| 「コアだけ回収する。この技術は人の役に立つ」 | preserve_01 |

#### `destroy_01`（text）
**演出:** bg: bg_road_day, bgm: bgm_quest_tense
```text
渾身の一撃をコアに叩き込んだ。結晶が砕け、ゴーレムが崩壊する。大地を揺らす轟音。
```

#### `destroy_02`（text）
**演出:** bg: bg_road_day, bgm: bgm_quest_calm
```text
鋼鉄の残骸が散らばる中、空は晴れていた。千年の殺戮装置は、ようやく眠りについた。
```

#### `end_success`（end_success）
**演出:** bg: bg_guild
```text
「オメガ・ゴーレム、完全破壊を確認。都市は救われた。見事だ」
古代兵器の脅威は消えた。だがあの技術が永遠に失われたことを惜しむ声もある。
```
**rewards:** Gold:5000, Exp:500, Rep:20, Order:10

#### `preserve_01`（text）
**演出:** bg: bg_road_day, bgm: bgm_quest_calm
```text
慎重にコアを取り外した。ゴーレムの巨体が力を失い、ゆっくりと膝をつく。
```

#### `preserve_02`（text）
**演出:** bg: bg_road_day, bgm: bgm_quest_calm
```text
コアは手の中で穏やかに脈動している。千年前の技術者たちの知恵が、ここに詰まっている。
```

#### `preserve_03`（text）
**演出:** bg: bg_road_day, bgm: bgm_quest_calm
```text
ゴーレムの残骸は動かない。コアを外せば、ただの鉄くずだ。もう脅威ではない。
```

#### `end_success_preserve`（end_success）
**演出:** bg: bg_guild
```text
「コアの回収を確認。学術院に引き渡す。古代技術の解析が始まるだろう」
兵器としてではなく、知識として——古代の遺産は新たな価値を得た。
```
**rewards:** Gold:3500, Exp:500, Rep:15, Justice:10

#### `end_failure`（end_failure）
**演出:** bg: bg_road_day
```text
ゴーレムの鉄拳に弾き飛ばされた。意識が遠のく中、鋼鉄の巨人は都市に向かって歩き続けている。
止められなかった——。
```

---

## 4. エネミー定義参照

| ID | Slug | name | level | hp | atk | def |
|-----|-----|-----|-----|-----|-----|-----|
| 6025 | `boss_omega_golem` | オメガ・ゴーレム | 35 | 2000 | 110 | 40 |

**ボスユニークスキル:**
| id | slug | スキル名 | effect_type | value | 説明 |
|----|------|---------|:-----------:|:-----:|------|
| 4013 | `skill_golem_crush` | 鋼鉄の拳 | damage | 4 | 防御無視の一撃 |
| 4014 | `skill_golem_quake` | 大地震動 | damage_stun | 2.5 | 全体ダメ+スタン(1T) |
| 4015 | `skill_golem_armor` | 装甲硬化 | buff_self_def | 150 | HP150回復+DEF UP(3T) |

| グループID | Slug | 用途 |
|-----|-----|-----|
| 101 | `roland_undead_group` | 遺跡: アンデッド |
| 9025 | `enemy_grp_boss_golem` | ボス戦 |

---

## 5. CSVエントリ

`quests_special.csv`
```csv
6109,qst_legend_golem,オメガ・ゴーレム,25,6,8,"{""completed_quest"":""main_ep15""}",false,,,冒険者ギルド,[封印指定] 古代文明の遺跡から起動した巨大ゴーレムが都市に向かっている。迎撃せよ。
```
