# クエスト仕様書：5201 — 聖騎士団の叛逆者

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 5201 |
| **Slug** | `qst_rep_crusader` |
| **クエスト種別** | 特殊クエスト（Special） |
| **推奨レベル** | 15（Hard） |
| **難度** | 4 |
| **依頼主** | 王国軍 |
| **出現条件** | 第5話「大義という名の虚妄」（6005）クリア / 滞在拠点: ローランド聖王国拠点 / 名声 50 以上 |
| **リピート** | 現世代で1回（継承後は再出現） |
| **経過日数 (time_cost)** | 6 |
| **ノード数** | 52ノード |
| **ゲストNPC** | なし |
| **難易度Tier** | Hard（rec_level: 15） |
| **サムネイル画像** | `/images/quests/bg_ruins_field.png` |
---

## 1. クエスト概要

### 短文説明
```
[討伐令] 聖騎士団を脱走した元団長が辺境で反乱。鎮圧せよ。
```

### 長文説明
```
ローランド聖王国の聖騎士団において、かつて「白銀の剣」と呼ばれた元団長ガレスが
信仰の腐敗に絶望し、精鋭を率いて脱走した。辺境の廃城を拠点に武装勢力を結成し、
教会の輸送隊を襲撃している。王国軍は名声ある冒険者にガレスの鎮圧を依頼する。
```

---

## 2. 報酬定義

**CSV記載形式（デフォルトルート）:**
```
Gold:3000|Exp:350|Rep:15|Order:5
```

**ルート別報酬差異:**
| ルート | Gold | Exp | Rep | アライメント |
|--------|------|-----|:---:|-------------|
| 武力制圧（デフォルト） | 3000 | 350 | +15 | Order:5 |
| 説得して投降させる（選択肢） | 2000 | 300 | +20 | Justice:5 |

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
     └─ start_02_02
         └─ start_03
             └─ start_03_02
                 └─ start_04
                     └─ prepare_01
                         └─ prepare_01_02
                             └─ prepare_02
                                 └─ travel_01
                                     └─ travel_01_02
                                         └─ travel_02
                                             └─ approach_01
                                                 └─ approach_01_02
                                                     └─ approach_02
                                                         └─ choice_route
                                                              ├─ 正面突入 → front_01
                                                              │              └─ front_02
                                                              │                   └─ front_02_02
                                                              │                        └─ front_03
                                                              │                             └─ battle_gate
                                                              │                                  ├─ win → merge_01
                                                              │                                  └─ lose → end_failure_01
                                                              └─ 裏口潜入 → sneak_01
                                                                             └─ sneak_02
                                                                                  └─ sneak_02_02
                                                                                       └─ sneak_trap (hp_damage 10%)
                                                                                            └─ sneak_03
                                                                                                 └─ merge_01
                                                                                                      └─ merge_01_02
                                                                                                           └─ merge_02
                                                                                                                └─ inner_01
                                                                                                                     └─ inner_01_02
                                                                                                                          └─ inner_02
                                                                                                                               └─ battle_guard
                                                                                                                                    ├─ win → confront_01
                                                                                                                                    │        └─ confront_01_02
                                                                                                                                    │             └─ confront_02
                                                                                                                                    │                  └─ confront_03
                                                                                                                                    │                       └─ battle_boss
                                                                                                                                    │                            ├─ win → victory_01
                                                                                                                                    │                            │        └─ victory_01_02
                                                                                                                                    │                            │             └─ victory_02
                                                                                                                                    │                            │                  └─ choice_fate
                                                                                                                                    │                            │                       ├─ 武力制圧 → suppress_01
                                                                                                                                    │                            │                       │              └─ suppress_01_02
                                                                                                                                    │                            │                       │                   └─ suppress_02
                                                                                                                                    │                            │                       │                        └─ end_success
                                                                                                                                    │                            │                       └─ 説得投降 → persuade_01
                                                                                                                                    │                            │                                      └─ persuade_01_02
                                                                                                                                    │                            │                                           └─ persuade_02
                                                                                                                                    │                            │                                                └─ persuade_03
                                                                                                                                    │                            │                                                     └─ end_success_peace
                                                                                                                                    │                            └─ lose → end_failure_01
                                                                                                                                    └─ lose → end_failure_01
                                                                                                                                                 └─ end_failure
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_office, bgm: bgm_quest_calm, speaker: 王国軍将校
```text
「名声ある冒険者殿、急ぎの案件だ。聖騎士団から脱走者が出た」
```

#### `start_02`（text）
**演出:** bg: bg_office, bgm: bgm_quest_calm, speaker: 王国軍将校
```text
「元団長ガレス。聖騎士団最強と謳われた男だ」
```

#### `start_02_02`（text）
**演出:** bg: bg_office, bgm: bgm_quest_calm
```text
（ガレス元団長か。その名は王都だけでなく、隣国にまで轟いている）
```

#### `start_03`（text）
**演出:** bg: bg_office, bgm: bgm_quest_calm, speaker: 王国軍将校
```text
「奴は教会の腐敗を糾弾し、精鋭を率いて辺境へ逃亡したのだ」
```

#### `start_03_02`（text）
**演出:** bg: bg_office, bgm: bgm_quest_calm
```text
将校の怒りに満ちた声が、重厚な執務室の木壁に反射する。
```

#### `start_04`（text）
**演出:** bg: bg_office, bgm: bgm_quest_calm
```text
将校の表情は険しい。元団長の脱走は王国の威信に関わる問題だ。
```

#### `prepare_01`（text）
**演出:** bg: bg_office, bgm: bgm_quest_calm
```text
ガレスの情報を集める。彼は辺境のルヴァン廃城を拠点に、教会の輸送隊を襲撃しているらしい。
```

#### `prepare_01_02`（text）
**演出:** bg: bg_office, bgm: bgm_quest_calm
```text
（輸送隊を襲撃しているが、商人の護衛を殺害したという報告はないな）
```

#### `prepare_02`（text）
**演出:** bg: bg_office, bgm: bgm_quest_calm
```text
聖騎士の装備は一級品。正面から挑めば苦戦は必至だ。慎重に作戦を練る必要がある。
```

#### `travel_01`（text）
**演出:** bg: bg_road_day, bgm: bgm_field
```text
ルヴァン廃城へ向かう。街道の途中、襲撃された輸送隊の残骸を見つけた。
```

#### `travel_01_02`（text）
**演出:** bg: bg_road_day, bgm: bgm_field
```text
（散乱した木箱や荷車……襲撃の跡は生々しいが、やはり血痕が見当たらん）
```

#### `travel_02`（text）
**演出:** bg: bg_road_day, bgm: bgm_field
```text
荷が散乱しているが、人の遺体はない。ガレスは略奪はしても殺しはしていないようだ。
```

#### `approach_01`（text）
**演出:** bg: bg_ruins_field, bgm: bgm_quest_tense
```text
廃城が見えてきた。崩れかけた城壁の上に、見張りの聖騎士が立っている。
```

#### `approach_01_02`（text）
**演出:** bg: bg_ruins_field, bgm: bgm_quest_tense
```text
（流石は元精鋭たちだ。無駄のない立ち振る舞いで周囲を警戒している）
```

#### `approach_02`（text）
**演出:** bg: bg_ruins_field, bgm: bgm_quest_tense
```text
正門は堅固に守られている。だが、城壁の東側に崩れた箇所がある。どちらから入るか——
```

#### `choice_route`（choice）
**演出:** bg: bg_ruins_field, bgm: bgm_quest_tense
| 選択肢 | next_node |
|---------|-----------|
| 「正面から堂々と突入する」 | `front_01` |
| 「崩れた城壁から裏口潜入する」 | `sneak_01` |

#### `front_01`（text）
**演出:** bg: bg_ruins_field, bgm: bgm_quest_tense
```text
正門に向かって歩を進める。見張りが気づき、角笛を吹いた。敵が集まってくる。
```

#### `front_02`（text）
**演出:** bg: bg_ruins_field, bgm: bgm_quest_tense
```text
「侵入者だ！ 団長に報告しろ！」聖騎士たちが武器を構えて立ちはだかる。
```

#### `front_02_02`（text）
**演出:** bg: bg_ruins_field, bgm: bgm_quest_tense
```text
（数は三人……手強いが、ここを引き下がるわけにはいかない！）
```

#### `front_03`（text）
**演出:** bg: bg_ruins_field, bgm: bgm_quest_tense
```text
正面突破しかない。覚悟を決めて剣を抜く。
```

#### `battle_gate`（battle）
**演出:** bg: bg_ruins_field, bgm: bgm_battle
**パラメータ:** enemy_group_id: 416, next: `merge_01`, fail: `end_failure_01`

#### `sneak_01`（text）
**演出:** bg: bg_ruins_field, bgm: bgm_quest_mystery
```text
崩れた城壁の隙間を慎重に進む。瓦礫が不安定で、一歩間違えれば崩れ落ちる。
```

#### `sneak_02`（text）
**演出:** bg: bg_ruins_field, bgm: bgm_quest_mystery
```text
城壁の内側に出た。だが足元の石が崩れ、瓦礫の下敷きになりかける——！
```

#### `sneak_02_02`（text）
**演出:** bg: bg_ruins_field, bgm: bgm_quest_mystery
```text
（くっ、崩落するか！ 重心を受け流し、素早く横へ跳び退く！）
```

#### `sneak_trap`（hp_damage）
**演出:** bg: bg_ruins_field, bgm: bgm_quest_tense
**パラメータ:** percent: 10
```text
瓦礫が崩落し、足を挟まれた。なんとか引き抜いたが、傷を負った。
```

#### `sneak_03`（text）
**演出:** bg: bg_ruins_field, bgm: bgm_quest_mystery
**次ノード:** `merge_01`
```text
傷は浅い。城の内部へ忍び込むことに成功した。見張りには気づかれていない。
```

#### `merge_01`（text）
**演出:** bg: bg_ruins_field, bgm: bgm_quest_tense
```text
廃城の内部は意外と整えられていた。脱走兵たちが生活している痕跡がある。
```

#### `merge_01_02`（text）
**演出:** bg: bg_ruins_field, bgm: bgm_quest_tense
```text
（略奪物だけでなく、聖堂の古い書物などが綺麗に並べられているな）
```

#### `merge_02`（text）
**演出:** bg: bg_ruins_field, bgm: bgm_quest_tense
```text
壁には「真の信仰を取り戻せ」と書かれた檄文が貼られている。ガレスの信念が窺える。
```

#### `inner_01`（text）
**演出:** bg: bg_ruins_field, bgm: bgm_quest_tense
```text
城の奥へ進むと、武装した聖騎士が通路を塞いでいる。ガレスの親衛隊だ。
```

#### `inner_01_02`（text）
**演出:** bg: bg_ruins_field, bgm: bgm_quest_tense
```text
（大剣を構える姿勢に隙がない。これが白銀の剣の直属か）
```

#### `inner_02`（text）
**演出:** bg: bg_ruins_field, bgm: bgm_quest_tense
```text
「ここから先は通さん。団長の邪魔をする者は——たとえ何者であろうとな！」
```

#### `battle_guard`（battle）
**演出:** bg: bg_ruins_field, bgm: bgm_battle
**パラメータ:** enemy_group_id: 413, next: `confront_01`, fail: `end_failure_01`

#### `confront_01`（text）
**演出:** bg: bg_ruins_field, bgm: bgm_quest_mystery
```text
親衛隊を倒し、最奥の大広間に辿り着いた。玉座に腰掛ける男がいる。
```

#### `confront_01_02`（text）
**演出:** bg: bg_ruins_field, bgm: bgm_quest_mystery
```text
その男は重厚な甲冑をまとい、静かにこちらを待っていた。彼がガレスだ。
```

#### `confront_02`（text）
**演出:** bg: bg_ruins_field, bgm: bgm_battle_boss, speaker: ガレス
```text
「……来たか。噂は聞いている。名声高き冒険者よ」
```

#### `confront_03`（text）
**演出:** bg: bg_ruins_field, bgm: bgm_battle_boss, speaker: ガレス
```text
「自分は教会の腐敗を正したいだけだ。だが、お前が王国の犬として来たのなら——剣で語ろう」
```

#### `battle_boss`（battle）
**演出:** bg: bg_ruins_field, bgm: bgm_battle_boss
**パラメータ:** enemy_group_id: 9061, next: `victory_01`, fail: `end_failure_01`

#### `victory_01`（text）
**演出:** bg: bg_ruins_field, bgm: bgm_quest_calm
```text
ガレスの剣が折れ、片膝をついた。だがその目に敗者の色はない。
```

#### `victory_01_02`（text）
**演出:** bg: bg_ruins_field, bgm: bgm_quest_calm
```text
（あれほどの使い手を圧倒したか……。だが、彼に未だ戦意は感じられない）
```

#### `victory_02`（text）
**演出:** bg: bg_ruins_field, bgm: bgm_quest_calm, speaker: ガレス
```text
「……見事だ。お前の強さは本物だ。……さて、自分をどうする？ 縛って王国に差し出すか？ それとも——」
```

#### `choice_fate`（choice）
**演出:** bg: bg_ruins_field, bgm: bgm_quest_calm
| 選択肢 | next_node |
|---------|-----------|
| 「王国の命令だ。抵抗するなら力ずくで連行する」 | `suppress_01` |
| 「お前の言い分もわかる。自首するなら口添えしてやる」 | `persuade_01` |

#### `suppress_01`（text）
**演出:** bg: bg_ruins_field, bgm: bgm_quest_tense
```text
ガレスを拘束した。部下たちは抵抗したが、団長の命令で武器を置いた。
```

#### `suppress_01_02`（text）
**演出:** bg: bg_ruins_field, bgm: bgm_quest_tense
```text
（ガレスは無言のまま、自分の両腕を縄に差し出してきた）
```

#### `suppress_02`（text）
**演出:** bg: bg_road_day, bgm: bgm_quest_calm
```text
王国軍にガレスを引き渡した。叛逆者として裁かれるだろう。秩序は保たれた。
```

#### `end_success`（end_success）
**演出:** bg: bg_church
```text
「叛逆者ガレスの拘束を確認。王国の秩序を守った功績、高く評価する」
報奨金と名声を受け取った。だがガレスの言葉が、胸に残った。
```
**rewards:** Gold:3000, Exp:350, Rep:15, Order:5

#### `persuade_01`（text）
**演出:** bg: bg_ruins_field, bgm: bgm_quest_calm, speaker: ガレス
```text
「……自首、か。教会の腐敗を公に訴えられるなら、それも悪くない」
```

#### `persuade_01_02`（text）
**演出:** bg: bg_ruins_field, bgm: bgm_quest_calm
```text
（彼の瞳にわずかな希望の光が灯る。無益な血は流れなかった）
```

#### `persuade_02`（text）
**演出:** bg: bg_ruins_field, bgm: bgm_quest_calm
```text
ガレスは部下たちに武器を置くよう命じた。「剣ではなく、言葉で戦おう」
```

#### `persuade_03`（text）
**演出:** bg: bg_road_day, bgm: bgm_quest_calm
```text
ガレスと共に王都へ向かった。道中、彼は教会の内部事情を語った。その告発は重い。
```

#### `end_success_peace`（end_success）
**演出:** bg: bg_church
```text
ガレスは自首し、教会の腐敗を公に告発した。報酬は減額されたが、正義の種は蒔かれた。
王国軍は面目を失ったが、民衆からの評価は高まった。
```
**rewards:** Gold:2000, Exp:300, Rep:20, Justice:5

#### `end_failure_01`（text）
**演出:** bg: bg_ruins_field, bgm: bgm_quest_tense
**次ノード:** `end_failure`
```text
ガレスの放った白銀の剣閃が視界を埋める。激痛とともに崩れ落ちた。
```

#### `end_failure`（end_failure）
**演出:** bg: bg_ruins_field
```text
ガレスの聖剣が閃き、意識が遠のいた。「お前では自分は止められぬ。出直してこい」
```
**rewards:** Gold:0