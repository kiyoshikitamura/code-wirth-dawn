# クエスト仕様書：6106 — 降臨せし天使

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6106 |
| **Slug** | `qst_legend_angel` |
| **クエスト種別** | 伝説級ボス（Legend） |
| **推奨レベル** | 25 |
| **難度** | 6 |
| **依頼主** | 冒険者ギルド |
| **出現条件** | EP15（`main_ep15`）クリア済み |
| **リピート** | 1世代1回（世代交代後に再プレイ可） |
| **難易度Tier** | Tier 5（伝説級） |
| **経過日数 (time_cost)** | 8（成功: 8日 / 失敗: 5日） |
| **ノード数** | 58ノード |
| **サムネイル画像** | `/images/quests/bg_holy_empire.png` |

---

## 1. クエスト概要

### 短文説明
```
[神罰] 天空から降臨した天使が聖都を焼き払おうとしている。止めるのは貴方だ。
```

### 長文説明
```
ローランド聖王国の聖都上空に、巨大な光の柱が降り注いだ。
人々が祝福と歓喜に沸く中、光の中から現れたのは天使——だが、
その目には慈悲も慈愛もなかった。
「人の世は堕落した。浄化する」と宣言した天使は、
聖都の一角を光の剣で焼き払った。
教会は混乱に陥り、冒険者ギルドに緊急討伐令が発布された。
```

---

## 2. 報酬定義

**CSV記載形式（デフォルトルート）:**
```
Gold:5000|Exp:500|Rep:20|Chaos:10
```

**ルート別報酬差異:**
| ルート | Gold | Exp | Rep | アライメント | スキル報酬 |
|--------|------|-----|:---:|-------------|------------|
| 討伐（デフォルト） | 5000 | 500 | +20 | Chaos:10 | 天使の恩寵 |
| 説得して帰還させる（選択肢） | 3500 | 500 | +15 | Justice:10 | 天使の恩寵 |

**ユニーク報酬スキル（共通）:**
| card_id | slug | スキル名 | type | AP | 効果 | deck_cost |
|:-------:|------|---------|------|:--:|------|:---------:|
| 82 | `card_angel_grace` | 天使の恩寵 | Heal | 4 | 全体120回復＋リジェネ3T | 4 |

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
             └─ start_05
                 └─ city_01
                     └─ city_02
                         └─ city_03
                             └─ city_04
                                 └─ city_05
                                     └─ battle_01
                                          ├─ win → ascend_01
                                          │        └─ ascend_02
                                          │             └─ ascend_03
                                          │                  └─ ascend_04
                                          │                       └─ trial_01
                                          │                            └─ trial_02
                                          │                                 └─ trial_03
                                          │                                      └─ random_trial (random_branch 50%/50%)
                                          │                                           ├─ 成功 → trial_pass
                                          │                                           │          └─ trial_pass_02
                                          │                                           │               └─ throne_01
                                          │                                           └─ 失敗 → trial_fail
                                          │                                                      └─ trial_fail_trap (hp_damage 20%)
                                          │                                                           └─ trial_fail_02
                                          │                                                                └─ throne_01
                                          │                                                                     └─ throne_02
                                          │                                                                          └─ throne_03
                                          │                                                                               └─ throne_04
                                          │                                                                                    └─ throne_05
                                          │                                                                                         └─ throne_06
                                          │                                                                                              └─ battle_02
                                          │                                                                                                   ├─ win → dialogue_01
                                          │                                                                                                   │        └─ dialogue_02
                                          │                                                                                                   │             └─ dialogue_03
                                          │                                                                                                   │                  └─ dialogue_04
                                          │                                                                                                   │                       └─ confront_01
                                          │                                                                                                   │                            └─ confront_02
                                          │                                                                                                   │                                 └─ confront_03
                                          │                                                                                                   │                                      └─ battle_boss
                                          │                                                                                                   │                                           ├─ win → aftermath_01
                                          │                                                                                                   │                                           │        └─ aftermath_02
                                          │                                                                                                   │                                           │             └─ aftermath_03
                                          │                                                                                                   │                                           │                  └─ choice_fate
                                          │                                                                                                   │                                           │                       ├─ 討伐 → execute_01
                                          │                                                                                                   │                                           │                       │          └─ execute_02
                                          │                                                                                                   │                                           │                       │               └─ end_success
                                          │                                                                                                   │                                           │                       └─ 説得 → persuade_01
                                          │                                                                                                   │                                           │                                  └─ persuade_02
                                          │                                                                                                   │                                           │                                       └─ persuade_03
                                          │                                                                                                   │                                           │                                            └─ persuade_04
                                          │                                                                                                   │                                           │                                                 └─ end_success_peace
                                          │                                                                                                   │                                           └─ lose → end_failure
                                          │                                                                                                   └─ lose → end_failure
                                          └─ lose → end_failure
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: ギルドマスター
```text
「信じられるか。天使が聖都を攻撃しているんだ」
```

#### `start_02`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: ギルドマスター
```text
「教会は大混乱だ。信仰の対象に剣を向けろと言うのだからな」
```

#### `start_03`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: ギルドマスター
```text
「だが放置すれば聖都が灰になる。信仰も糞もない。止めなければ人が死ぬ」
```

#### `start_04`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm
```text
天使を討つ——それがどれほど途方もないことか。だが、目の前で人が死ぬのを黙って見ていることはできない。
```

#### `start_05`（text）
**演出:** bg: bg_holy_empire, bgm: bgm_quest_tense
```text
聖都に近づくと、空が白く輝いていた。太陽ではない。天使の放つ光だ。
```

#### `city_01`（text）
**演出:** bg: bg_holy_empire, bgm: bgm_quest_tense
```text
市街地は阿鼻叫喚だった。建物は半壊し、逃げ惑う市民の悲鳴が響く。
```

#### `city_02`（text）
**演出:** bg: bg_holy_empire, bgm: bgm_quest_tense
```text
聖堂の尖塔が光の剣で真っ二つに切り裂かれている。天使の力は想像以上だ。
```

#### `city_03`（text）
**演出:** bg: bg_holy_empire, bgm: bgm_quest_tense
```text
瓦礫の下から助けを求める声。だが今は立ち止まれない。天使を止めなければ被害は広がる一方だ。
```

#### `city_04`（text）
**演出:** bg: bg_holy_empire, bgm: bgm_quest_tense
```text
市街地を進むと、天使に仕える下位の光の戦士たちが降下してきた。人間を「浄化」しようとしている。
```

#### `city_05`（text）
**演出:** bg: bg_holy_empire, bgm: bgm_quest_tense
```text
市民を守るため、立ちはだかる。光の戦士たちがこちらに槍を向けた——！
```

#### `battle_01`（battle）
**演出:** bg: bg_holy_empire, bgm: bgm_battle
**パラメータ:** enemy_group_id: 218
```text
天使の先兵——光の戦士たちが襲いかかる！
```

#### `ascend_01`（text）
**演出:** bg: bg_holy_empire, bgm: bgm_quest_mystery
```text
光の戦士を退けた。市民たちが感謝の声を上げるが、振り返る余裕はない。
```

#### `ascend_02`（text）
**演出:** bg: bg_holy_empire, bgm: bgm_quest_mystery
```text
天使は聖都の大聖堂の尖塔の上に浮かんでいる。あそこまで辿り着かなければ。
```

#### `ascend_03`（text）
**演出:** bg: bg_holy_empire, bgm: bgm_quest_mystery
```text
大聖堂の中に入ると、床に光の魔法陣が浮かび上がっていた。これは——天に昇るための道か。
```

#### `ascend_04`（text）
**演出:** bg: bg_holy_empire, bgm: bgm_quest_mystery
```text
魔法陣を踏むと、体が浮き上がった。光の渦に包まれ、大聖堂の天蓋を突き抜けていく——
```

#### `trial_01`（text）
**演出:** bg: bg_holy_empire, bgm: bgm_quest_mystery
```text
雲の上に出た。そこには黄金の回廊が続いている。天使の領域だ。
```

#### `trial_02`（text）
**演出:** bg: bg_holy_empire, bgm: bgm_quest_mystery
```text
回廊の先に門がある。門は光の文字で封じられている。「罪なき者のみ通れ」——試練か。
```

#### `trial_03`（text）
**演出:** bg: bg_holy_empire, bgm: bgm_quest_mystery
```text
光の文字に手を触れる。心の奥底を探られるような感覚が走った——
```

#### `random_trial`（random_branch）
**パラメータ:** prob: 50, next: `trial_pass`, fallback: `trial_fail`
（50%の確率で試練を突破）

#### `trial_pass`（text）
**演出:** bg: bg_holy_empire, bgm: bgm_quest_calm
```text
光の文字が消え、門が開いた。自分の中にある覚悟が、試練を超えたのだ。
```

#### `trial_pass_02`（text）
**演出:** bg: bg_holy_empire, bgm: bgm_quest_calm
**次ノード:** throne_01
```text
門の向こうに、より強い光が見える。天使の玉座は近い。
```

#### `trial_fail`（text）
**演出:** bg: bg_holy_empire, bgm: bgm_quest_tense
```text
光が体を灼いた。「罪あり」——門が裁きの光を放つ！
```

#### `trial_fail_trap`（hp_damage）
**演出:** bg: bg_holy_empire, bgm: bgm_quest_tense
**パラメータ:** percent: 20
```text
裁きの光が全身を貫いた。倒れかけるが、歯を食いしばって前に進む。門は——強引に砕いた。
```

#### `trial_fail_02`（text）
**演出:** bg: bg_holy_empire, bgm: bgm_quest_tense
```text
試練は失敗したが、意志の力で門を突破した。体は痛むが、立ち止まるわけにはいかない。
```

#### `throne_01`（text）
**演出:** bg: bg_holy_empire, bgm: bgm_quest_tense
```text
門の先は、雲で作られた玉座の間だった。黄金の光に満ちている。
```

#### `throne_02`（text）
**演出:** bg: bg_holy_empire, bgm: bgm_quest_tense
```text
玉座の間の中央に、天使の護衛が控えている。大天使の名を持つ強大な存在だ。
```

#### `throne_03`（text）
**演出:** bg: bg_holy_empire, bgm: bgm_quest_tense
```text
護衛の天使が光の槍を構える。「ここから先は通さぬ。引き返せ、人の子よ」
```

#### `throne_04`（text）
**演出:** bg: bg_holy_empire, bgm: bgm_quest_tense
```text
引き返すつもりはない。武器を構え、真正面から対峙する。
```

#### `throne_05`（text）
**演出:** bg: bg_holy_empire, bgm: bgm_quest_tense
```text
護衛の天使が翼を広げた。光の粒子が舞い散り、目を開けていられないほどの輝き。
```

#### `throne_06`（text）
**演出:** bg: bg_holy_empire, bgm: bgm_quest_tense
```text
「人の子の覚悟、試してやろう。神の御名において——」
```

#### `battle_02`（battle）
**演出:** bg: bg_holy_empire, bgm: bgm_battle_boss
**パラメータ:** enemy_group_id: 219
```text
大天使とその従者が立ちはだかる！
```

#### `dialogue_01`（text）
**演出:** bg: bg_holy_empire, bgm: bgm_quest_mystery
```text
護衛の天使を退けた。その先に——光の玉座に座る存在が見えた。
```

#### `dialogue_02`（text）
**演出:** bg: bg_holy_empire, bgm: bgm_quest_mystery
```text
六枚の翼。人の姿をしているが、纏う光はこの世のものではない。降臨せし天使——その本体だ。
```

#### `dialogue_03`（text）
**演出:** bg: bg_holy_empire, bgm: bgm_quest_mystery, speaker: 降臨せし天使
```text
「よくぞここまで来た。だが理解しているか？ 自分は世界を正しているだけだ」
```

#### `dialogue_04`（text）
**演出:** bg: bg_holy_empire, bgm: bgm_quest_mystery, speaker: 降臨せし天使
```text
「人は殺し合い、奪い合い、嘘をつく。千年見守ったが、改善の兆しはない。故に——浄化する」
```

#### `confront_01`（text）
**演出:** bg: bg_holy_empire, bgm: bgm_quest_tense
```text
天使の言葉に一理ある。人間は確かに愚かだ。だが——だからと言って、全てを焼き払っていいはずがない。
```

#### `confront_02`（text）
**演出:** bg: bg_holy_empire, bgm: bgm_quest_tense
```text
「不完全だからこそ、人は足掻く。変わろうとする。お前にはそれが分からないだけだ」
```

#### `confront_03`（text）
**演出:** bg: bg_holy_empire, bgm: bgm_battle_boss, speaker: 降臨せし天使
```text
「……言葉では納得できぬ。ならば力で示してみせよ。人の意志の強さを——」
天使が玉座から立ち上がり、六枚の翼を広げた。光の剣が顕現する。
```

#### `battle_boss`（battle）
**演出:** bg: bg_holy_empire, bgm: bgm_battle_boss
**パラメータ:** enemy_group_id: 9022
```text
降臨せし天使との決戦——！
```

#### `aftermath_01`（text）
**演出:** bg: bg_holy_empire, bgm: bgm_quest_calm
```text
天使の光の剣が砕けた。六枚の翼が力を失い、天使が膝をつく。
```

#### `aftermath_02`（text）
**演出:** bg: bg_holy_empire, bgm: bgm_quest_calm, speaker: 降臨せし天使
```text
「……認めよう。貴方には意志がある。自分が裁こうとした人間にも、確かに光はあった」
```

#### `aftermath_03`（text）
**演出:** bg: bg_holy_empire, bgm: bgm_quest_calm, speaker: 降臨せし天使
```text
「だが自分はもう天に帰れぬ。降臨の代償だ。ここで朽ちるか——あるいは」
天使は静かにこちらを見つめた。
```

#### `choice_fate`（choice）
**演出:** bg: bg_holy_empire, bgm: bgm_quest_calm
| 選択肢 | next_node |
|---------|-----------|
| 「止めを刺す。これ以上の脅威を残すわけにはいかない」 | execute_01 |
| 「帰りたいなら、帰す方法を探そう」 | persuade_01 |

#### `execute_01`（text）
**演出:** bg: bg_holy_empire, bgm: bgm_quest_tense
```text
剣を振り下ろした。天使の体が光の粒子となって散り、空に還っていく。
```

#### `execute_02`（text）
**演出:** bg: bg_holy_empire, bgm: bgm_quest_calm
```text
光が消えると、雲の玉座も崩れ始めた。大聖堂の床に降り立つ。聖都の空は、元の青さを取り戻していた。
```

#### `end_success`（end_success）
**演出:** bg: bg_guild
```text
「降臨せし天使の討伐を確認。聖都の被害は甚大だが、これ以上の犠牲は免れた」
ギルドマスターは複雑な表情だった。天使を殺した——その重みは、報酬では量れない。
```
**rewards:** Gold:5000, Exp:500, Rep:20, Chaos:10

#### `persuade_01`（text）
**演出:** bg: bg_holy_empire, bgm: bgm_quest_calm, speaker: 降臨せし天使
```text
「帰す——だと？ 人間が天使を救おうと言うのか」
天使は信じられないという顔をした。
```

#### `persuade_02`（text）
**演出:** bg: bg_holy_empire, bgm: bgm_quest_calm
```text
「お前が言っただろう。人は不完全だと。不完全だから、敵にも手を差し伸べる」
```

#### `persuade_03`（text）
**演出:** bg: bg_holy_empire, bgm: bgm_quest_calm, speaker: 降臨せし天使
```text
「……奇妙な生き物だ。だが、嫌いではない」
天使は微かに笑い、残った光を集め始めた。
```

#### `persuade_04`（text）
**演出:** bg: bg_holy_empire, bgm: bgm_quest_calm
```text
光の柱が天を穿ち、天使の体がゆっくりと浮かび上がる。最後に一度だけ振り返り——光と共に消えた。
```

#### `end_success_peace`（end_success）
**演出:** bg: bg_guild
```text
「天使が去った……のか。信じられんが、聖都上空の異変は収まった」
討伐ではなく帰還。教会はこの事実をどう解釈するだろうか。だが、少なくとも今は——空は穏やかだ。
```
**rewards:** Gold:3500, Exp:500, Rep:15, Justice:10

#### `end_failure`（end_failure）
**演出:** bg: bg_holy_empire
```text
天使の光の剣が体を貫いた。視界が白く焼かれていく。
最後に聞こえたのは、天使の静かな声だった。「やはり人は——脆い」
```

---

## 4. 新規エネミー・アイテム定義参照

**使用エネミー（既存・流用）:**
| ID | Slug | name | level | hp | atk | def |
|-----|-----|-----|-----|-----|-----|-----|
| 6022 | `boss_fallen_angel` | 降臨せし天使 | 35 | 1400 | 105 | 28 |

**ボスユニークスキル:**
| id | slug | スキル名 | effect_type | value | 説明 |
|----|------|---------|:-----------:|:-----:|------|
| 4004 | `skill_angel_judge` | 裁きの光剣 | damage | 4 | 防御貫通の大ダメージ |
| 4005 | `skill_angel_purify` | 浄化の光 | damage_stun | 2.5 | 光で焼き払いスタン(1T) |
| 4006 | `skill_angel_aegis` | 天光の護り | buff_self_def | 200 | HP200回復＋DEF UP(3T) |

**使用エネミーグループ（既存）:****
| ID | Slug | 構成エネミー | 用途 |
|-----|-----|-----|-----|
| 218 | `main_angel_army_a` | `enemy_angel_soldier`×2 | 市街地: 光の戦士戦 |
| 219 | `main_angel_army_b` | `enemy_angel_soldier`+`enemy_boss_archangel` | 玉座の間: 護衛戦 |
| 9022 | `enemy_grp_boss_angel` | `boss_fallen_angel` | ボス: 降臨せし天使 |

---

## 5. CSVエントリ

`quests_special.csv`
```csv
6106,qst_legend_angel,降臨せし天使,25,6,8,"{""completed_quest"":""main_ep15""}",false,,,冒険者ギルド,[神罰] 天空から降臨した天使が聖都を焼き払おうとしている。止めるのは貴方だ。
```

---

## 6. 実装チェックリスト

- [ ] ボスパラメータ `boss_fallen_angel` の再バランス（Lv35, HP1400, ATK105, DEF28）
- [ ] エネミーグループ 218, 219, 9022 がDBに登録済み
- [ ] hp_damage トラップ（20%: 試練失敗）が正常に動作
- [ ] random_branch（試練: 50%/50%）が正常動作
- [ ] 選択肢「討伐」→ Chaos:10 / 「説得」→ Justice:10 が正しく分岐
- [ ] 3連戦（光の戦士→大天使護衛→降臨せし天使）のHP持ち越しを確認
- [ ] time_cost: 8（成功8日 / 失敗5日）
- [ ] 報酬が正しく付与される

---

## 7. 拡張メモ

- 説得ルートを選ぶと、後日「天使の祝福」イベントが発生する可能性（名声ボーナス等）
- 天使の素材ドロップ（光の羽根）による装備強化の将来的な拡張余地
- 教会NPCの反応変化（討伐ルート: 称賛と畏怖 / 説得ルート: 困惑と敬意）
