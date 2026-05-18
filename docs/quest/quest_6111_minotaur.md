# クエスト仕様書：6111 — 迷宮の覇者 牛頭王

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6111 |
| **Slug** | `qst_legend_minotaur` |
| **クエスト種別** | 伝説級ボス（Legend） |
| **推奨レベル** | 26 |
| **難度** | 6 |
| **依頼主** | 冒険者ギルド |
| **出現条件** | EP15（`main_ep15`）クリア済み |
| **リピート** | 1世代1回 |
| **経過日数 (time_cost)** | 9（成功: 9日 / 失敗: 5日） |
| **ノード数** | 56ノード |

---

## 1. クエスト概要

### 短文説明
```
[封印指定] 夜刀神国の地下に古代の迷宮が出現し、牛頭の化け物が支配している。
```

### 長文説明
```
夜刀神国の山中に、突如として地割れが発生し、古代の地下迷宮が姿を現した。
迷宮の主は牛頭王——人の体に牛の頭を持つ異形の覇者。
迷宮に迷い込んだ者は二度と戻らない。周辺の村落は恐怖に包まれている。
迷宮の最深部に潜む牛頭王を討ち、この脅威を排除せよ。
```

---

## 2. 報酬定義

**CSV記載形式:** `Gold:6000|Exp:550|Rep:20|Order:10`

| ルート | Gold | Exp | Rep | アライメント | スキル報酬 |
|--------|------|-----|:---:|-------------|------------|
| 討伐（デフォルト） | 6000 | 550 | +20 | Order:10 | 覇王の大斧 |
| 迷宮ごと封印（選択肢） | 4000 | 550 | +15 | Justice:10 | 覇王の大斧 |

**ユニーク報酬スキル（共通）:**
| card_id | slug | スキル名 | type | AP | 効果 | deck_cost |
|:-------:|------|---------|------|:--:|------|:---------:|
| 87 | `card_mino_axe` | 覇王の大斧 | Skill | 5 | 単体130ダメ＋スタン1T | 5 |

---

## 3. シナリオノードフロー

### 構成概要
- **導入**（start〜start_04）: 迷宮出現の報告
- **迷宮入口**（entrance_01〜entrance_03）: 地割れの底に潜る
- **第一層**（maze_01〜maze_04）: 迷路探索
- **hp_damageトラップ**（pit_trap: 10%——落とし穴）
- **random_branch**（maze_fork: 50%——正しい道を選ぶ）→ 失敗時hp_damage 15%
- **前哨戦**（battle_01: grp 106 妖怪群）
- **第二層**（deep_01〜deep_06）: 迷宮の核心へ
- **前哨戦2**（battle_02: grp 107 天狗群）
- **牛頭王の間**（throne_01〜throne_04）: 牛頭王との対峙
- **ボス戦**（battle_boss: grp 9027 牛頭王）
- **選択分岐**: 討伐→Order:10 / 封印→Justice:10

### ノード詳細

#### `start`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: ギルドマスター
```text
「夜刀神国の山中に地割れが起きた。中から古代の迷宮が現れたそうだ」
```

#### `start_02`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: ギルドマスター
```text
「迷宮の主は『牛頭王』と呼ばれる化け物だ。入った者は誰一人戻っていない」
```

#### `start_03`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: ギルドマスター
```text
「周辺の村落から避難民が押し寄せている。迷宮から魔物が溢れ出るのも時間の問題だ」
```

#### `start_04`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm
```text
迷宮攻略。最も危険で、最も栄誉ある冒険だ。装備を整え、夜刀神国へ向かう。
```

#### `entrance_01`（text）
**演出:** bg: bg_yato_den, bgm: bgm_quest_tense
```text
山中の地割れに到着した。裂け目の底に、人工的な石造りの入口が見える。
```

#### `entrance_02`（text）
**演出:** bg: bg_yato_den, bgm: bgm_quest_tense
```text
入口の両脇に、牛の頭蓋骨が飾られている。警告か、それとも自慢か。
```

#### `entrance_03`（text）
**演出:** bg: bg_yato_den, bgm: bgm_quest_tense
```text
松明を灯し、迷宮の暗闇に足を踏み入れた。背後で入口の扉が重い音を立てて閉まった。
```

#### `maze_01`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_mystery
```text
第一層。石壁の通路が無数に分岐している。古代の設計者の悪意が透けて見える。
```

#### `maze_02`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_mystery
```text
壁には骨が埋め込まれている。過去に迷い込んだ者たちの成れの果てだ。
```

#### `maze_03`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_tense
```text
通路の床に罠の気配。慎重に足を運ぶが——
```

#### `pit_trap`（hp_damage）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_tense
**パラメータ:** percent: 10
```text
床板が抜け落ちた！ 咄嗟に壁を掴んだが、指が滑り数メートル落下した。
```

#### `maze_04`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_tense
```text
痛む足を引きずりながら、這い上がった。迷宮は容赦がない。
```

#### `maze_fork`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_mystery
```text
T字路。左右どちらにも同じような通路が続いている。壁の模様から方角を推測する——
```

#### `random_fork`（random_branch）
**パラメータ:** prob: 50, next: `fork_right`, fallback: `fork_wrong`

#### `fork_right`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_calm
**次ノード:** yokai_area
```text
壁の模様に従い右を選んだ。奥から微かな風が吹いてくる。正解だ。
```

#### `fork_wrong`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_tense
```text
左を選んだが、行き止まりだ。しかも壁から毒の霧が噴き出してきた！
```

#### `fork_trap`（hp_damage）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_tense
**パラメータ:** percent: 15
```text
毒霧を吸い込み、頭がクラクラする。口を覆いながら引き返し、右の道へ急いだ。
```

#### `fork_wrong_02`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_tense
```text
毒が体に回りつつある。早く先に進まなければ。
```

#### `yokai_area`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_tense
```text
広い部屋に出た。迷宮に棲みついた妖怪たちが、薄闇の中でこちらを睨んでいる。
```

#### `battle_01`（battle）
**演出:** bg: bg_ruin_crypt, bgm: bgm_battle
**パラメータ:** enemy_group_id: 106
```text
迷宮に棲む妖怪の群れが襲いかかる！
```

#### `deep_01`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_mystery
```text
妖怪を退け、第二層への階段を見つけた。空気がさらに淀んでいる。
```

#### `deep_02`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_mystery
```text
第二層は天井が高い。巨大な何かが通れるように設計されている——牛頭王の通路だ。
```

#### `deep_03`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_mystery
```text
床に巨大な蹄の跡が刻まれている。新しい。近い——主は。
```

#### `deep_04`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_tense
```text
通路の先から重い足音が聞こえてきた。一歩ごとに壁が震える。
```

#### `deep_05`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_tense
```text
角を曲がると、天狗の一団が陣を張っていた。迷宮に棲みついた強力な妖怪だ。
```

#### `deep_06`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_tense
```text
牛頭王の手前の最後の障壁。突破しなければならない——！
```

#### `battle_02`（battle）
**演出:** bg: bg_ruin_crypt, bgm: bgm_battle
**パラメータ:** enemy_group_id: 107
```text
天狗の精鋭が立ちはだかる！
```

#### `throne_01`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_mystery
```text
天狗を退け、迷宮の最深部に到達した。巨大な玉座の間。
```

#### `throne_02`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_mystery
```text
玉座の間には骨と武具が散乱している。挑戦者たちの末路がここに積み重なっている。
```

#### `throne_03`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_battle_boss, speaker: 牛頭王
```text
「——また来たか。人間どもは懲りぬ」
闇の奥から、巨大な影が立ち上がった。牛の頭に人の体。手には大斧。
```

#### `throne_04`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_battle_boss, speaker: 牛頭王
```text
「この迷宮は自分の世界だ。侵入者は例外なく——骨にしてやる」
大斧が振り上げられ、地面が割れた。
```

#### `battle_boss`（battle）
**演出:** bg: bg_ruin_crypt, bgm: bgm_battle_boss
**パラメータ:** enemy_group_id: 9027
```text
迷宮の覇者——牛頭王との最終決戦！
```

#### `victory_01`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_calm
```text
大斧を弾き飛ばし、牛頭王を組み伏せた。地面に叩きつけられた巨体が痙攣する。
```

#### `victory_02`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_calm, speaker: 牛頭王
```text
「……千年、この迷宮を守ってきた。だが自分を超える者がようやく現れたか」
```

#### `victory_03`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_calm
```text
牛頭王を殺せば迷宮は無力化する。だが迷宮ごと封印すれば、内部の財宝と共に安全に埋められる。
```

#### `choice_mino`（choice）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_calm
| 選択肢 | next_node |
|---------|-----------|
| 「止めを刺す。お前のような化け物は二度と蘇らせない」 | slay_01 |
| 「迷宮ごと封印する。二度と地上に出るな」 | seal_01 |

#### `slay_01`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_tense
```text
剣を突き立てた。牛頭王の咆哮が迷宮全体を震わせ——やがて、静寂が訪れた。
```

#### `slay_02`（text）
**演出:** bg: bg_yato_den, bgm: bgm_quest_calm
```text
迷宮から脱出した。地割れが少しずつ閉じ始めている。主を失った迷宮は崩壊する。
```

#### `end_success`（end_success）
**演出:** bg: bg_guild
```text
「牛頭王の討伐を確認。迷宮は崩壊し、村落の安全は確保された」
骨と武具の山——あの中には、自分と同じ夢を持った冒険者たちもいたのだろう。
```
**rewards:** Gold:6000, Exp:550, Rep:20, Order:10

#### `seal_01`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_calm
```text
入口に戻り、封印の術を施した。地割れが閉じ、迷宮は再び地の底に沈む。
```

#### `seal_02`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_calm, speaker: 牛頭王
```text
「……封じるのか。殺さぬとは、奇妙な奴だ」
牛頭王の声が地中から微かに聞こえた。だがもう、地上に出ることはない。
```

#### `end_success_seal`（end_success）
**演出:** bg: bg_guild
```text
「迷宮の封印を確認。地割れは塞がり、村は平和を取り戻した」
殺すだけが答えではない。閉じ込めるのもまた——一つの決着だ。
```
**rewards:** Gold:4000, Exp:550, Rep:15, Justice:10

#### `end_failure`（end_failure）
**演出:** bg: bg_ruin_crypt
```text
牛頭王の大斧が体を叩き割った。骨の山に新たな一つが加わった。
迷宮は、次の挑戦者を待っている。
```

---

## 4. エネミー定義参照

| ID | Slug | name | level | hp | atk | def |
|-----|-----|-----|-----|-----|-----|-----|
| 6027 | `boss_mino_king` | 牛頭王 | 37 | 1900 | 115 | 28 |

**ボスユニークスキル:**
| id | slug | スキル名 | effect_type | value | 説明 |
|----|------|---------|:-----------:|:-----:|------|
| 4019 | `skill_mino_axe_e` | 覇王の大斧 | damage | 4.5 | 防御無視の大ダメージ |
| 4020 | `skill_mino_charge` | 突進 | damage_stun | 3 | 大ダメ+スタン(1T) |
| 4021 | `skill_mino_bellow` | 迷宮の呪い | debuff_atk_down | 0 | ATK DOWN(3T) |

| グループID | Slug | 用途 |
|-----|-----|-----|
| 106 | `yato_yokai_group` | 第一層: 妖怪群 |
| 107 | `yato_tengu_group` | 第二層: 天狗群 |
| 9027 | `enemy_grp_boss_mino` | ボス戦 |

---

## 5. CSVエントリ

`quests_special.csv`
```csv
6111,qst_legend_minotaur,迷宮の覇者 牛頭王,26,6,9,"{""completed_quest"":""main_ep15""}",false,,,冒険者ギルド,[封印指定] 夜刀神国の地下に古代の迷宮が出現し牛頭の化け物が支配している。
```
