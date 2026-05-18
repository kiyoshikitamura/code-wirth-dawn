# クエスト仕様書：6105 — 悪魔バフォメット

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6105 |
| **Slug** | `qst_legend_baphomet` |
| **クエスト種別** | 伝説級ボス（Legend） |
| **推奨レベル** | 25 |
| **難度** | 6 |
| **依頼主** | 冒険者ギルド |
| **出現条件** | EP15（`main_ep15`）クリア済み |
| **リピート** | 1世代1回（世代交代後に再プレイ可） |
| **難易度Tier** | Tier 5（伝説級） |
| **経過日数 (time_cost)** | 8（成功: 8日 / 失敗: 5日） |
| **ノード数** | 55ノード |
| **サムネイル画像** | `/images/quests/bg_ruin_crypt.png` |

---

## 1. クエスト概要

### 短文説明
```
[封印指定] 古代の封印が解け、大悪魔バフォメットが地上に現れた。討伐せよ。
```

### 長文説明
```
ローランド聖王国の地下に眠る古代遺跡から、禍々しい魔力の波動が感知された。
調査の結果、千年前の大戦で封じられた大悪魔バフォメットの封印が劣化し、
復活が始まっていることが判明した。
冒険者ギルドは最高ランクの討伐令を発布。封印が完全に解ける前に、
地下迷宮を踏破し、バフォメットを討伐せよ。
```

---

## 2. 報酬定義

**CSV記載形式（デフォルトルート）:**
```
Gold:5000|Exp:500|Rep:20|Order:10
```

**ルート別報酬差異:**
| ルート | Gold | Exp | Rep | アライメント | スキル報酬 |
|--------|------|-----|:---:|-------------|------------|
| 討伐（デフォルト） | 5000 | 500 | +20 | Order:10 | 獄炎の刻印 |
| 封印強化（選択肢） | 3000 | 500 | +10 | Justice:10 | 獄炎の刻印 |

**ユニーク報酬スキル（共通）:**
| card_id | slug | スキル名 | type | AP | 効果 | deck_cost |
|:-------:|------|---------|------|:--:|------|:---------:|
| 81 | `card_baphomet_flame` | 獄炎の刻印 | Magic | 4 | 全体70ダメ＋炎上3T | 4 |

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
 └─ start_02
     └─ start_03
         └─ start_04
             └─ prepare_01
                 └─ prepare_02
                     └─ prepare_03
                         └─ descend_01
                             └─ descend_02
                                 └─ descend_03
                                     └─ trap_spike (hp_damage 10%)
                                         └─ trap_spike_02
                                             └─ corridor_01
                                                 └─ corridor_02
                                                     └─ corridor_03
                                                         └─ battle_01
                                                              ├─ win → after_battle_01
                                                              │        └─ after_battle_02
                                                              │             └─ puzzle_01
                                                              │                  └─ puzzle_02
                                                              │                       └─ random_rune (random_branch 60%/40%)
                                                              │                            ├─ 成功 → rune_success
                                                              │                            │          └─ rune_success_02
                                                              │                            │               └─ sanctum_01
                                                              │                            └─ 失敗 → rune_fail
                                                              │                                       └─ rune_fail_trap (hp_damage 15%)
                                                              │                                            └─ rune_fail_02
                                                              │                                                 └─ sanctum_01
                                                              │                                                      └─ sanctum_02
                                                              │                                                           └─ sanctum_03
                                                              │                                                                └─ sanctum_04
                                                              │                                                                     └─ sanctum_05
                                                              │                                                                          └─ battle_02
                                                              │                                                                               ├─ win → altar_01
                                                              │                                                                               │        └─ altar_02
                                                              │                                                                               │             └─ altar_03
                                                              │                                                                               │                  └─ awaken_01
                                                              │                                                                               │                       └─ awaken_02
                                                              │                                                                               │                            └─ awaken_03
                                                              │                                                                               │                                 └─ awaken_04
                                                              │                                                                               │                                      └─ battle_boss
                                                              │                                                                               │                                           ├─ win → victory_01
                                                              │                                                                               │                                           │        └─ victory_02
                                                              │                                                                               │                                           │             └─ victory_03
                                                              │                                                                               │                                           │                  └─ choice_seal
                                                              │                                                                               │                                           │                       ├─ 討伐 → slay_01
                                                              │                                                                               │                                           │                       │          └─ slay_02
                                                              │                                                                               │                                           │                       │               └─ end_success
                                                              │                                                                               │                                           │                       └─ 封印 → seal_01
                                                              │                                                                               │                                           │                                  └─ seal_02
                                                              │                                                                               │                                           │                                       └─ seal_03
                                                              │                                                                               │                                           │                                            └─ end_success_seal
                                                              │                                                                               │                                           └─ lose → end_failure
                                                              │                                                                               └─ lose → end_failure
                                                              └─ lose → end_failure
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: ギルドマスター
```text
「最高危険度の封印指定だ。古代遺跡から大悪魔の魔力波が検知された」
```

#### `start_02`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: ギルドマスター
```text
「千年前の大戦で封じた悪魔——バフォメット。封印が劣化している」
```

#### `start_03`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: ギルドマスター
```text
「完全復活すれば国一つが灰になる。それだけの力を持つ存在だ」
```

#### `start_04`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm
```text
ギルドマスターの目は冗談を言う色ではなかった。これは国家規模の脅威だ。覚悟を決めて準備を始める。
```

#### `prepare_01`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm
```text
ギルドから支給された古文書を読む。バフォメットは闇と炎の二属性を操り、精神を蝕む咆哮を放つ。
```

#### `prepare_02`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm
```text
弱点は聖属性と光。だが古文書には「光すら喰らう闇の中では、勇気のみが武器となる」とある。
```

#### `prepare_03`（text）
**演出:** bg: bg_road_day, bgm: bgm_field
```text
装備を整え、ローランド聖王国の南端にある古代遺跡へと向かった。入口には既に聖騎士団が結界を張っている。
```

#### `descend_01`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_tense
```text
結界を抜け、地下へ降りる。石段は苔に覆われ、空気は澱んで重い。
```

#### `descend_02`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_tense
```text
松明の炎が不自然に揺れる。魔力の残滓が空気中に漂っているのだ。
```

#### `descend_03`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_tense
```text
第一層の通路に入ると、床に刻まれた古代文字が赤く脈動していた。罠か——
```

#### `trap_spike`（hp_damage）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_tense
**パラメータ:** percent: 10
```text
床の文字を踏んだ瞬間、壁から毒針が射出された！ 咄嗟に身を捻るが、腕を掠める。
```

#### `trap_spike_02`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_tense
```text
傷は浅いが、針には弱い呪毒が塗られていた。体の芯が少し重くなる。先を急ごう。
```

#### `corridor_01`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_mystery
```text
通路の壁に、千年前の戦いを描いた壁画がある。聖騎士たちがバフォメットと対峙している。
```

#### `corridor_02`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_mystery
```text
壁画の最後——聖騎士たちは勝利したのではなく、命と引き換えに封印したのだ。その数、百余名。
```

#### `corridor_03`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_mystery
```text
通路の先から、不気味な呻き声が聞こえる。封印の魔力に引き寄せられた亡者たちだ。
```

#### `battle_01`（battle）
**演出:** bg: bg_ruin_crypt, bgm: bgm_battle
**パラメータ:** enemy_group_id: 416
```text
封印の残滓に引き寄せられた怨霊たちが襲いかかる！
```

#### `after_battle_01`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_mystery
```text
怨霊を退け、第二層への扉に辿り着いた。扉には古代のルーン文字が刻まれている。
```

#### `after_battle_02`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_mystery
```text
ルーン文字を読み解かなければ扉は開かない。古文書の知識を頼りに解読を試みる。
```

#### `puzzle_01`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_mystery
```text
文字の配列は複雑だが、パターンが見える。「光」「闇」「均衡」——三つの概念の組み合わせか。
```

#### `puzzle_02`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_mystery
```text
正しい順番でルーンに触れる。指先に魔力が走り、扉が反応した——
```

#### `random_rune`（random_branch）
**パラメータ:** prob: 60, next: `rune_success`, fallback: `rune_fail`
（60%の確率で正しいルーンを選ぶ）

#### `rune_success`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_calm
```text
ルーンが青白く輝き、扉が静かに開いた。正解だ。安全に第二層へ進める。
```

#### `rune_success_02`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_calm
**次ノード:** sanctum_01
```text
扉の向こうから、より濃厚な魔力の気配が漂ってくる。覚悟を決めて足を踏み入れた。
```

#### `rune_fail`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_tense
```text
ルーンが赤く輝いた——間違えた！ 扉から魔力の衝撃波が放たれる！
```

#### `rune_fail_trap`（hp_damage）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_tense
**パラメータ:** percent: 15
```text
衝撃波を全身に受けた。骨が軋む。だが扉は開いた——強引に突破する。
```

#### `rune_fail_02`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_tense
```text
体を引きずりながら第二層に入る。ダメージは痛いが、立ち止まるわけにはいかない。
```

#### `sanctum_01`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_tense
```text
第二層は広大な聖堂のような空間だった。だが祭壇は逆十字に変えられ、壁には魔法陣が刻まれている。
```

#### `sanctum_02`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_tense
```text
天井から黒い霧が垂れ下がり、床の亀裂からは赤い光が漏れている。封印の最終層だ。
```

#### `sanctum_03`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_tense
```text
聖堂の中央に巨大な石棺がある。石棺の蓋に刻まれた封印紋が、脈動するように明滅している。
```

#### `sanctum_04`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_tense
```text
石棺の周囲に、バフォメットの眷属と思しき魔物が蠢いている。まずはこいつらを片付けなければ。
```

#### `sanctum_05`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_tense
```text
魔物たちがこちらに気づいた。一斉に牙を剥く——！
```

#### `battle_02`（battle）
**演出:** bg: bg_ruin_crypt, bgm: bgm_battle
**パラメータ:** enemy_group_id: 413
```text
バフォメットの眷属たちが牙を剥く！
```

#### `altar_01`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_mystery
```text
眷属を倒すと、石棺の封印紋が一際強く輝いた。そして——亀裂が入った。
```

#### `altar_02`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_mystery
```text
石棺の蓋が弾け飛んだ。中から噴き出す漆黒の魔力が聖堂を満たしていく。
```

#### `altar_03`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_mystery
```text
闇の中に、二本の巨大な角が浮かび上がった。山羊の頭。燃える双眸。人の体に獣の四肢。
```

#### `awaken_01`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_battle_boss, speaker: バフォメット
```text
「……千年か。随分と眠ったものだ」
```

#### `awaken_02`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_battle_boss, speaker: バフォメット
```text
「封じた聖騎士どもの骨はとうに朽ちたか。だがまだ生贄を送ってくるとは、人の子も愚かだ」
```

#### `awaken_03`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_battle_boss, speaker: バフォメット
```text
「さあ、見せてみろ。千年の間に人間がどれほど進歩したか——あるいは退化したか」
```

#### `awaken_04`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_battle_boss
```text
バフォメットが立ち上がった。その体躯は石棺の二倍以上。聖堂の天井に角が届く。全身から地獄の業火が噴き出す——！
```

#### `battle_boss`（battle）
**演出:** bg: bg_ruin_crypt, bgm: bgm_battle_boss
**パラメータ:** enemy_group_id: 9021
```text
大悪魔バフォメットとの最終決戦——！
```

#### `victory_01`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_calm
```text
渾身の一撃がバフォメットの胸を貫いた。大悪魔が初めて膝をつく。
```

#### `victory_02`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_calm, speaker: バフォメット
```text
「……ほう。まさか倒されるとはな。千年前の聖騎士どもより、貴様の方が強いとでも言うのか」
```

#### `victory_03`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_calm, speaker: バフォメット
```text
「だが知っておけ。自分を殺せば、この遺跡に封じられた魔力が暴走する。殺すか——再び封じるか。選べ」
バフォメットは不敵に笑った。
```

#### `choice_seal`（choice）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_calm
| 選択肢 | next_node |
|---------|-----------|
| 「止めを刺す。お前の脅しには屈しない」 | slay_01 |
| 「封印を強化する。二度と目覚めぬように」 | seal_01 |

#### `slay_01`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_tense
```text
剣を振り下ろした。バフォメットの体が黒い灰となって崩れ、聖堂が激しく振動する。
```

#### `slay_02`（text）
**演出:** bg: bg_road_day, bgm: bgm_quest_calm
```text
遺跡から脱出した。背後で遺跡が崩落する轟音が響いた。大悪魔は滅び、遺跡と共に地に還った。
```

#### `end_success`（end_success）
**演出:** bg: bg_guild
```text
ギルドに凱旋した。「大悪魔バフォメットの討伐を確認。これは歴史に刻まれる偉業だ」
ギルドマスターが深く頭を下げた。千年の脅威に、終止符が打たれた。
```
**rewards:** Gold:5000, Exp:500, Rep:20, Order:10

#### `seal_01`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_calm
```text
古文書の封印術を唱える。バフォメットの体に新たな封印紋が刻まれていく。
```

#### `seal_02`（text）
**演出:** bg: bg_ruin_crypt, bgm: bgm_quest_calm, speaker: バフォメット
```text
「……賢い選択だ。だが覚えておけ。封印は永遠ではない。また千年後に——」
声は封印の光に呑まれ、消えた。
```

#### `seal_03`（text）
**演出:** bg: bg_road_day, bgm: bgm_quest_calm
```text
遺跡から戻ると、聖騎士団が新たな結界を張り直していた。今度の封印は、より強固だ。
```

#### `end_success_seal`（end_success）
**演出:** bg: bg_guild
```text
「封印強化の報告を受けた。討伐こそならなかったが、これで当面の脅威は去った」
報酬は控えめだったが、大地を守る選択に悔いはない。
```
**rewards:** Gold:3000, Exp:500, Rep:10, Justice:10

#### `end_failure`（end_failure）
**演出:** bg: bg_ruin_crypt
```text
バフォメットの漆黒の炎に焼かれ、意識が遠のいていく。
最後に見えたのは、大悪魔が嗤う姿だった。「次の千年も、人は変わらぬか」
```

---

## 4. 新規エネミー・アイテム定義参照

**使用エネミー（既存・流用）:**
| ID | Slug | name | level | hp | atk | def |
|-----|-----|-----|-----|-----|-----|-----|
| 6021 | `boss_demon_baphomet` | バフォメット | 35 | 1500 | 110 | 25 |

> ボスパラメータは実装計画§4に基づき、rec_lv 25に合わせて再バランス済み。

**ボスユニークスキル:**
| id | slug | スキル名 | effect_type | value | 説明 |
|----|------|---------|:-----------:|:-----:|------|
| 4001 | `skill_baph_hellfire` | 地獄の業火 | damage | 3.5 | 全体に灼熱の闇炎で高威力ダメージ |
| 4002 | `skill_baph_corrupt` | 精神汚染 | debuff_atk_down | 0 | パーティ全体ATK DOWN(3T) |
| 4003 | `skill_baph_regen` | 暗黒再生 | heal | 250 | 闇の力でHP250回復 |

**使用エネミーグループ（既存）:**
| ID | Slug | 構成エネミー | 用途 |
|-----|-----|-----|-----|
| 416 | `grp_wraith_trio` | `enemy_wraith`×3 | 第一層: 怨霊戦 |
| 413 | `grp_undead_mixed` | `enemy_skeleton`+`enemy_zombie`+`enemy_wraith` | 第二層: 眷属戦 |
| 9021 | `enemy_grp_boss_baphomet` | `boss_demon_baphomet` | ボス: バフォメット |

---

## 5. CSVエントリ

`quests_special.csv`
```csv
6105,qst_legend_baphomet,悪魔バフォメット,25,6,8,"{""completed_quest"":""main_ep15""}",false,,,冒険者ギルド,[封印指定] 古代の封印が解け、大悪魔バフォメットが地上に現れた。討伐せよ。
```

---

## 6. 実装チェックリスト

- [ ] ボスパラメータ `boss_demon_baphomet` の再バランス（Lv35, HP1500, ATK110, DEF25）
- [ ] エネミーグループ 9021 がDBに登録済み
- [ ] hp_damage トラップ（10%, 15%）が正常に動作
- [ ] random_branch（ルーン解読: 60%/40%）が正常動作
- [ ] 選択肢「討伐」→ Order:10 / 「封印」→ Justice:10 が正しく分岐
- [ ] 3連戦（怨霊→眷属→バフォメット）のHP持ち越しを確認
- [ ] time_cost: 8（成功8日 / 失敗5日）
- [ ] 報酬が正しく付与される

---

## 7. 拡張メモ

- バフォメット封印ルートを選んだ場合、将来的に「封印の劣化イベント」として再登場する可能性
- 遺跡崩壊ルートでは地形変化（入口封鎖）が発生し、以後のアクセス不可を演出
- 大悪魔の素材ドロップ（将来的な鍛冶システム用）
