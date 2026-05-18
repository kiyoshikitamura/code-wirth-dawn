# クエスト仕様書：5207 — 九尾の大狐

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 5207 |
| **Slug** | `qst_rep_nine_tails` |
| **クエスト種別** | 名声連動ボス（Reputation） |
| **推奨レベル** | 20 |
| **難度** | 5 |
| **依頼主** | 冒険者ギルド |
| **出現条件** | EP10（`main_ep10`）クリア済み, Rep≥100 |
| **出現拠点** | 夜刀神国 / 華龍国（両地方で出現） |
| **リピート** | 1世代1回 |
| **難易度Tier** | Tier 4（名声連動・最高難度） |
| **経過日数 (time_cost)** | 6（成功: 6日 / 失敗: 3日） |
| **ノード数** | 45ノード |
| **サムネイル画像** | `/images/quests/bg_mountain.png` |

---

## 1. クエスト概要

### 短文説明
```
[最高討伐令] 東方二国にまたがる霊山に千年の大妖狐が出現。地脈が乱れ災厄が広がる。
```

### 長文説明
```
夜刀神国と華龍国の国境にそびえる霊山に、千年を生きた九尾の大妖狐が現れた。
その強大な妖力は地脈を乱し、両国に地震や疫病をもたらしている。
両国のギルドが共同で、最も名声ある冒険者に討伐を依頼する。
```

---

## 2. 報酬定義

**CSV記載形式:** `Gold:6000|Exp:550|Rep:25|Justice:8`

**ルート別報酬差異:**
| ルート | Gold | Exp | Rep | アライメント |
|--------|------|-----|:---:|-------------|
| 討伐（デフォルト） | 6000 | 550 | +25 | Justice:8 |
| 契約して力を分けてもらう（選択肢） | 8000 | 400 | -20 | Chaos:12 |

---

## 2.5 失敗ペナルティ

| 項目 | 値 |
|-----|-----|
| VIT変動 | VIT -1 |
| 経過日数（失敗） | 3日 |

---

## 3. シナリオノードフロー

```text
start
 └─ start_02
     └─ start_03
         └─ start_04
             └─ travel_01
                 └─ travel_02
                     └─ border_01
                         └─ border_02
                             └─ choice_path (入山ルート選択)
                                  ├─ 夜刀側（北ルート） → north_01
                                  │                        └─ north_02
                                  │                             └─ north_03
                                  │                                  └─ north_battle (山の妖怪戦)
                                  │                                       ├─ win → merge_peak
                                  │                                       └─ lose → end_failure
                                  └─ 華龍側（南ルート） → south_01
                                                           └─ south_02
                                                                └─ south_trap (hp_damage 15%)
                                                                     └─ south_03
                                                                          └─ merge_peak
                                                                               └─ peak_01
                                                                                    └─ peak_02
                                                                                         └─ illusion_01
                                                                                              └─ illusion_02
                                                                                                   └─ random_illusion (random_branch 50%)
                                                                                                        ├─ 成功 → see_through
                                                                                                        │          └─ merge_shrine
                                                                                                        └─ 失敗 → tricked_01
                                                                                                                   └─ tricked_trap (hp_damage 10%)
                                                                                                                        └─ tricked_02
                                                                                                                             └─ merge_shrine
                                                                                                                                  └─ shrine_01
                                                                                                                                       └─ shrine_02
                                                                                                                                            └─ shrine_03
                                                                                                                                                 └─ confront_01
                                                                                                                                                      └─ confront_02
                                                                                                                                                           └─ confront_03
                                                                                                                                                                └─ battle_boss
                                                                                                                                                                     ├─ win → victory_01
                                                                                                                                                                     │        └─ victory_02
                                                                                                                                                                     │             └─ victory_03
                                                                                                                                                                     │                  └─ choice_fate
                                                                                                                                                                     │                       ├─ 討伐 → slay_01
                                                                                                                                                                     │                       │          └─ slay_02
                                                                                                                                                                     │                       │               └─ slay_03
                                                                                                                                                                     │                       │                    └─ end_success
                                                                                                                                                                     │                       └─ 契約 → pact_01
                                                                                                                                                                     │                                  └─ pact_02
                                                                                                                                                                     │                                       └─ pact_03
                                                                                                                                                                     │                                            └─ pact_04
                                                                                                                                                                     │                                                 └─ end_success_pact
                                                                                                                                                                     └─ lose → end_failure
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: ギルドマスター
```text
「両国のギルドから共同依頼だ。霊山に九尾の大妖狐が現れた」
```

#### `start_02`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: ギルドマスター
```text
「千年を生きた大妖。妖力で地脈を乱し、両国に災厄をばらまいている」
```

#### `start_03`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: ギルドマスター
```text
「名声100以上の冒険者にしか頼めない案件だ。頼んだぞ」
```

#### `start_04`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm
```text
千年の大妖か。これまでの相手とは格が違う。万全の準備で臨む。
```

#### `travel_01`（text）
**演出:** bg: bg_road_day, bgm: bgm_field
```text
夜刀と華龍の国境にある霊山へ向かう。国境では両国の兵士が共同で警戒にあたっていた。
```

#### `travel_02`（text）
**演出:** bg: bg_road_day, bgm: bgm_field
```text
山の麓に着くと、空気が異様に歪んでいるのがわかった。妖力の影響だ。
```

#### `border_01`（text）
**演出:** bg: bg_mountain, bgm: bgm_quest_tense
```text
霊山への入口は二つある。夜刀側の北ルートと、華龍側の南ルートだ。
```

#### `border_02`（text）
**演出:** bg: bg_mountain, bgm: bgm_quest_tense
```text
北ルートは妖怪が多いが道は明瞭。南ルートは険しいが妖怪は少ない——と聞いた。
```

#### `choice_path`（choice）
**演出:** bg: bg_mountain, bgm: bgm_quest_tense
| 選択肢 | next_node |
|---------|-----------|
| 「夜刀側（北ルート）から登る——妖怪を倒しながら進む」 | north_01 |
| 「華龍側（南ルート）から登る——険しい山道を行く」 | south_01 |

#### `north_01`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_tense
```text
北ルートを進む。竹林の中を歩くと、早速妖怪の気配が漂ってきた。
```

#### `north_02`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_tense
```text
九尾の妖力に引き寄せられた下級妖怪たちが群れをなしている。
```

#### `north_03`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_tense
```text
道を塞ぐ妖怪の群れ。突破するしかない——！
```

#### `north_battle`（battle）
**演出:** bg: bg_forest_night, bgm: bgm_battle
**パラメータ:** enemy_group_id: 130
```text
霊山の妖怪たちが襲いかかる！
```

#### `south_01`（text）
**演出:** bg: bg_mountain, bgm: bgm_quest_tense
```text
南ルートを登る。岩場が続き、足場が悪い。人の手が入っていない獣道だ。
```

#### `south_02`（text）
**演出:** bg: bg_mountain, bgm: bgm_quest_tense
```text
崖際の細い道を慎重に進む。一歩踏み外せば谷底だ。そのとき——足場が崩れた！
```

#### `south_trap`（hp_damage）
**演出:** bg: bg_mountain, bgm: bgm_quest_tense
**パラメータ:** percent: 15
```text
落石に巻き込まれ、全身を打った！ 致命傷は避けたが、体が痛む。
```

#### `south_03`（text）
**演出:** bg: bg_mountain, bgm: bgm_quest_tense
**次ノード:** merge_peak
```text
傷を押さえながら登り続ける。やがて山の中腹に出た。ここからは共通の道だ。
```

#### `merge_peak`（text）
**演出:** bg: bg_mountain, bgm: bgm_quest_mystery
```text
霊山の中腹。空気が澄んでいるのに、視界が歪む。妖力が空間そのものを歪めている。
```

#### `peak_01`（text）
**演出:** bg: bg_mountain, bgm: bgm_quest_mystery
```text
目の前に美しい花畑が広がった——だがこんな山頂に花畑があるはずがない。幻術だ。
```

#### `peak_02`（text）
**演出:** bg: bg_mountain, bgm: bgm_quest_mystery
```text
九尾の幻術に惑わされまいと精神を集中する。
```

#### `illusion_01`（text）
**演出:** bg: bg_mountain, bgm: bgm_quest_mystery
```text
花畑の中に、美しい女性が立っている。「お疲れでしょう。休んでいきませんか」
```

#### `illusion_02`（text）
**演出:** bg: bg_mountain, bgm: bgm_quest_mystery
```text
甘い声だ。意識がぼやける——。これは幻術。見破れるか——
```

#### `random_illusion`（random_branch）
**パラメータ:** prob: 50, next: `see_through`, fallback: `tricked_01`
（50%の確率で幻術を見破る）

#### `see_through`（text）
**演出:** bg: bg_mountain, bgm: bgm_quest_tense
**次ノード:** merge_shrine
```text
「——幻術か。見事だが、自分は騙されない」花畑が霧散し、荒涼とした岩山が現れた。
```

#### `tricked_01`（text）
**演出:** bg: bg_mountain, bgm: bgm_quest_tense
```text
気づいた時には、崖の縁に立っていた。幻術に誘導されたのだ——！
```

#### `tricked_trap`（hp_damage）
**演出:** bg: bg_mountain, bgm: bgm_quest_tense
**パラメータ:** percent: 10
```text
幻術が解け、足を踏み外した。岩場に叩きつけられる。
```

#### `tricked_02`（text）
**演出:** bg: bg_mountain, bgm: bgm_quest_tense
**次ノード:** merge_shrine
```text
体を起こす。幻術に翻弄された——油断していた。九尾の力は底知れない。
```

#### `merge_shrine`（text）
**演出:** bg: bg_mountain, bgm: bgm_quest_mystery
```text
山頂が見えてきた。そこに、古びた祠が佇んでいる。九尾の大妖狐の住処だ。
```

#### `shrine_01`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_tense
```text
祠の前に、九本の巨大な尾が揺らめいている。金色の毛並みが月光に輝く。
```

#### `shrine_02`（text）
**演出:** bg: bg_forest_night, bgm: bgm_battle_boss, speaker: 九尾の大妖狐
```text
「……千年ぶりの客だ。自分の幻術を抜けてここまで来るとは——見込みがある」
```

#### `shrine_03`（text）
**演出:** bg: bg_forest_night, bgm: bgm_battle_boss, speaker: 九尾の大妖狐
```text
「だが来た以上は試させてもらう。お前が自分を殺すに足る者か——あるいは、手を組むに足る者か」
```

#### `confront_01`（text）
**演出:** bg: bg_forest_night, bgm: bgm_battle_boss
```text
九尾の大妖狐が立ち上がった。体長は馬車ほどもある。九本の尾が天を覆い、妖力が大気を震わせる。
```

#### `confront_02`（text）
**演出:** bg: bg_forest_night, bgm: bgm_battle_boss
```text
周囲の木々が妖力で白くなっていく。地面に霜が降り、呼吸が白く染まった。
```

#### `confront_03`（text）
**演出:** bg: bg_forest_night, bgm: bgm_battle_boss
```text
九尾が跳躍した。月を背に、九つの炎が弧を描く——！
```

#### `battle_boss`（battle）
**演出:** bg: bg_forest_night, bgm: bgm_battle_boss
**パラメータ:** enemy_group_id: 9067
```text
千年の大妖——九尾の大妖狐との死闘——！
```

#### `victory_01`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_calm
```text
九尾が倒れた。だがその体は消えず、穏やかな目でこちらを見つめている。
```

#### `victory_02`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_calm, speaker: 九尾の大妖狐
```text
「……千年生きて、初めて負けた。お前は自分が認めた最後の人間だ」
```

#### `victory_03`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_calm, speaker: 九尾の大妖狐
```text
「さて——殺すか。それとも契約を結ぶか。自分の妖力の一部を分けてやってもいい」
```

#### `choice_fate`（choice）
**演出:** bg: bg_forest_night, bgm: bgm_quest_calm
| 選択肢 | next_node |
|---------|-----------|
| 「依頼通り討伐する。お前が生きている限り地脈は乱れ続ける」 | slay_01 |
| 「契約を結ぶ。お前の力を分けてもらう代わりに、地脈の乱れを止めろ」 | pact_01 |

#### `slay_01`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_tense
```text
九尾に止めを刺した。千年の命が消える瞬間、九つの炎が天に昇っていった。
```

#### `slay_02`（text）
**演出:** bg: bg_mountain, bgm: bgm_quest_calm
```text
山の空気が澄んでいく。地脈の乱れが収まり、大地が穏やかな表情を取り戻した。
```

#### `slay_03`（text）
**演出:** bg: bg_road_day, bgm: bgm_quest_calm
```text
両国のギルドに報告した。千年の脅威が去った安堵が、国境を越えて広がった。
```

#### `end_success`（end_success）
**演出:** bg: bg_guild
```text
「千年の大妖を討伐——これは歴史に残る偉業だ」
両国から手厚い報酬を受け取った。冒険者として最高峰の名声を得た。
```
**rewards:** Gold:6000, Exp:550, Rep:25, Justice:8

#### `pact_01`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_mystery, speaker: 九尾の大妖狐
```text
「契約か。面白い人間だ。いいだろう——自分の妖力の一部をお前に預ける」
```

#### `pact_02`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_mystery
```text
九尾の体から金色の炎が一つ、自分の体に宿った。全身に力が漲る——。
```

#### `pact_03`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_mystery, speaker: 九尾の大妖狐
```text
「地脈の乱れは抑えてやる。だが覚えておけ——妖の力には代償がある。いずれわかる」
```

#### `pact_04`（text）
**演出:** bg: bg_road_day, bgm: bgm_quest_calm
```text
両国のギルドには「大妖は倒したが遺体は消えた」と報告した。嘘ではない——半分は。
大量の報酬を手にしたが、冒険者としての信頼は失われた。
```

#### `end_success_pact`（end_success）
**演出:** bg: bg_guild
```text
莫大な報酬を手にした。だがギルドからは不信の目で見られている。
「本当に倒したのか？ 地脈の乱れは収まったが……」噂は尾を引くだろう。
```
**rewards:** Gold:8000, Exp:400, Rep:-20, Chaos:12

#### `end_failure`（end_failure）
**演出:** bg: bg_forest_night
```text
九尾の幻術と妖力に呑まれ、意識が深い闇に沈んだ。
最後に聞こえたのは、どこか寂しげな狐の鳴き声だった。
```

---

## 4. 新規エネミー・アイテム定義参照

**使用エネミー（新規）:**
| ID | Slug | name | level | hp | atk | def |
|-----|-----|-----|-----|-----|-----|-----|
| 6037 | `boss_nine_tails` | 九尾の大妖狐 | 30 | 1500 | 90 | 20 |

**使用エネミーグループ:**
| ID | Slug | 構成エネミー | 用途 |
|-----|-----|-----|-----|
| 130 | （既存） | 夜刀妖怪系 | 妖怪戦（北ルート） |
| 9067 | `enemy_grp_boss_nine_tails` | `boss_nine_tails` | ボス: 九尾の大妖狐 |

---

## 5. CSVエントリ

`quests_special.csv`（夜刀側）
```csv
5207,qst_rep_nine_tails,九尾の大狐,20,5,6,"{""completed_quest"":""main_ep10"",""min_reputation"":100,""nation_id"":""loc_yatoshin""}",false,,,冒険者ギルド,[最高討伐令] 東方二国にまたがる霊山に千年の大妖狐が出現。地脈が乱れ災厄が広がる。
```

`quests_special.csv`（華龍側 — 同一クエストの参照）
> **注記**: 5207は夜刀・華龍両方で出現させる。実装上は `nation_id` を配列にするか、2行エントリにするかは実装時に確認。

---

## 6. 実装チェックリスト

- [ ] ボスパラメータ `boss_nine_tails` をenemies.csvに登録
- [ ] エネミーグループ 9067 をenemy_groups.csvに登録
- [ ] choice_path（北/南ルート）が正常に動作
- [ ] hp_damage（南ルート 15%、幻術失敗 10%）が正常に動作
- [ ] random_illusion（幻術: 50%/50%）が正常動作
- [ ] 討伐ルート: Gold:6000, Exp:550, Rep:25, Justice:8
- [ ] 契約ルート: Gold:8000, Exp:400, Rep:-20, Chaos:12
- [ ] 両地方での出現確認
- [ ] time_cost: 6（成功6日 / 失敗3日）
