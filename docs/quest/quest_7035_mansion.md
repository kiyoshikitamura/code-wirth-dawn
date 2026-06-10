# クエスト仕様書：7035 — 呪われた武家屋敷の調査

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7035 |
| **Slug** | `qst_yat_mansion` |
| **クエスト種別** | 一般クエスト（Normal） |
| **推奨レベル** | 8（Hard） |
| **難度** | 3 |
| **依頼主** | 代官所 |
| **出現条件** | 出現国: 夜刀神国 |
| **リピート** | リピート可能 |
| **経過日数 (time_cost)** | 5 |
| **ノード数** | 46ノード |
| **ゲストNPC** | なし |
| **難易度Tier** | Hard（rec_level: 8） |
| **サムネイル画像** | `/images/quests/bg_yato_den.png` |
---

## 1. クエスト概要

### 短文説明
```
[調査] 怪光が灯る旧領主の武家屋敷を調査する。怨霊の正体を暴け。
```

### 長文説明
```
夜刀神国の山裾に、かつての領主が非業の死を遂げた武家屋敷がある。
近頃、夜な夜な怨嗟の声と青白い怪光が目撃されるようになった。
代官所は「怨霊の鎮魂か、あるいは調査不能の報告でも構わぬ」と言う。
だが地元の古老は「あの屋敷には、まだ終わっていない恨みがある」と
顔を曇らせた。
```

---

## 2. 報酬定義

**CSV記載形式（デフォルトルート）:**
```
Gold:400|Exp:120|Rep:5|Justice:5
```

**ルート別報酬差異:**
| ルート | Gold | Exp | Rep | アライメント |
|--------|------|-----|:---:|-------------|
| 怨霊を浄化（デフォルト） | 400 | 120 | +5 | Justice:5 |
| 遺恨を晴らして成仏させる（選択肢） | 300 | 200 | -5 | Chaos:5 |

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
             └─ start_04_02
                 └─ start_04_03
                     └─ arrive_01
                         └─ arrive_02
                             └─ arrive_03
                                 └─ explore_01
                                     └─ explore_01_02
                                         └─ explore_01_03
                                             └─ explore_02
                                                 └─ explore_03
                                                     └─ trap_01 (hp_damage 15%)
                                                         └─ trap_02
                                                             └─ explore_04
                                                                 └─ explore_05
                                                                     └─ battle_01
                                                                          ├─ win → inner_01
                                                                          │        └─ inner_02
                                                                          │             └─ inner_03
                                                                          │                  └─ inner_03_02
                                                                          │                       └─ inner_03_03
                                                                          │                            └─ inner_04
                                                                          │                                 └─ clue_01
                                                                          │                                      └─ clue_02
                                                                          │                                           └─ clue_03
                                                                          │                                                └─ battle_02
                                                                          │                                                     ├─ win → reveal_01
                                                                          │                                                     │        └─ reveal_02_01
                                                                          │                                                     │             └─ reveal_02
                                                                          │                                                     │                  └─ choice_resolve
                                                                          │                                                     │                       ├─ 浄化 → purify_01
                                                                          │                                                     │                       │          └─ purify_01_02
                                                                          │                                                     │                       │               └─ purify_01_03
                                                                          │                                                     │                       │                    └─ purify_02
                                                                          │                                                     │                       │                         └─ end_success_01
                                                                          │                                                     │                       │                              └─ end_success
                                                                          │                                                     │                       └─ 成仏 → resolve_01
                                                                          │                                                     │                                  └─ resolve_02
                                                                          │                                                     │                                       └─ resolve_02_02
                                                                          │                                                     │                                            └─ end_success_chaos_01
                                                                          │                                                     │                                                 └─ end_success_chaos
                                                                          │                                                     └─ lose → end_failure_01
                                                                          └─ lose → end_failure_01
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_yato_city, bgm: bgm_quest_calm, speaker: 代官
```text
「あの屋敷には近づくなと何度言っても、子供らが肝試しに行きおる」
```

#### `start_02`（text）
**演出:** bg: bg_yato_city, bgm: bgm_quest_calm, speaker: 代官
```text
「先月から怪光が酷くなってな。冒険者の手を借りたい」
```

#### `start_03`（text）
**演出:** bg: bg_yato_city, bgm: bgm_quest_calm
```text
代官の話では、旧領主・影守は三年前の政変で切腹を命じられたという。
```

#### `start_04`（text）
**演出:** bg: bg_yato_city, bgm: bgm_quest_calm
```text
以来、屋敷は封印され、影守の一族の行方も知れぬままだ。依頼を引き受け、山裾へ向かう。
```

#### `start_04_02`（text）
**演出:** bg: bg_yato_city, bgm: bgm_quest_calm
```text
かつての繁栄も今は昔。山裾に向かう道は荒れ果て、冷たい風が竹林を揺らしている。
```

#### `start_04_03`（text）
**演出:** bg: bg_yato_city, bgm: bgm_quest_calm
```text
近隣の住人は屋敷の方向を指差し、怯えた顔で「あそこには死神が住む」と囁いていた。
```

#### `arrive_01`（text）
**演出:** bg: bg_yat_haunted, bgm: bgm_quest_tense
```text
鬱蒼とした木々の先に、朽ちかけた門が見えた。門扉は半開きで、夕暮れの風に軋んでいた。
```

#### `arrive_02`（text）
**演出:** bg: bg_yat_haunted, bgm: bgm_quest_tense
```text
庭は雑草に覆われ、かつての枯山水の面影は消え失せていた。屋敷の窓からは、微かな青い光が漏れていた。
```

#### `arrive_03`（text）
**演出:** bg: bg_yat_haunted, bgm: bgm_quest_tense
```text
背筋に冷たいものが走った。だが引き返すわけにはいかない。覚悟を決めて、玄関を押し開けた。
```

#### `explore_01`（text）
**演出:** bg: bg_yat_haunted, bgm: bgm_quest_mystery
```text
床板が軋む音だけが響く。埃の積もった廊下に、不自然な足跡が続いている。
```

#### `explore_01_02`（text）
**演出:** bg: bg_yat_haunted, bgm: bgm_quest_mystery
```text
湿った空気とカビの臭いが鼻を突く。暗闇の中、どこかで水滴が滴る音が響いている。
```

#### `explore_01_03`（text）
**演出:** bg: bg_yat_haunted, bgm: bgm_quest_mystery
```text
天井の梁からは蜘蛛の巣が垂れ下がり、まるで侵入者を拒む網のように行く手を阻む。
```

#### `explore_02`（text）
**演出:** bg: bg_yat_haunted, bgm: bgm_quest_mystery
```text
足跡は素足だ。しかも、指は五本あるが爪痕が異様に深い。人間のものではない。
```

#### `explore_03`（text）
**演出:** bg: bg_yat_haunted, bgm: bgm_quest_mystery
```text
足跡を辿ると、奥座敷へと続く渡り廊下に出た。だが渡り廊下の中央で床が崩落している。
```

#### `trap_01`（hp_damage）
**演出:** bg: bg_yat_haunted, bgm: bgm_quest_tense
**パラメータ:** percent: 15
```text
腐った床板を踏み抜いた！ 足を切りながらも、なんとか反対側に飛び移る。
```

#### `trap_02`（text）
**演出:** bg: bg_yat_haunted, bgm: bgm_quest_tense
```text
足から血が滲む。だが傷は浅い。先に進めそうだ。
```

#### `explore_04`（text）
**演出:** bg: bg_yat_haunted, bgm: bgm_quest_mystery
```text
奥座敷に辿り着く。襖は全て破れ、畳が捲れ上がっている。壁の掛け軸だけが無傷で残っていた。
```

#### `explore_05`（text）
**演出:** bg: bg_yat_haunted, bgm: bgm_quest_mystery
```text
掛け軸の裏に何かがある——と思った瞬間、背後から低い唸り声が聞こえた。振り返ると、怨霊が！
```

#### `battle_01`（battle）
**演出:** bg: bg_yat_haunted, bgm: bgm_battle
**パラメータ:** enemy_group_id: 450, next: inner_01, fail: end_failure_01

#### `inner_01`（text）
**演出:** bg: bg_yat_haunted, bgm: bgm_quest_mystery
```text
怨霊を退けた。掛け軸の裏を確認すると、隠し扉があった。その先に地下への階段が続いている。
```

#### `inner_02`（text）
**演出:** bg: bg_yato_shrine, bgm: bgm_quest_mystery
```text
地下は予想外に広かった。壁に松明の跡が残っているが、今は闇に沈んでいる。
```

#### `inner_03`（text）
**演出:** bg: bg_yato_shrine, bgm: bgm_quest_mystery
```text
松明に火を灯すと、壁一面に無数の名前が刻まれていた。影守の一族の名だ。
```

#### `inner_03_02`（text）
**演出:** bg: bg_yato_shrine, bgm: bgm_quest_mystery
```text
影守一族……。かつてこの地を治め、人望も厚かったと聞く。彼らの命は儚く散った。
```

#### `inner_03_03`（text）
**演出:** bg: bg_yato_shrine, bgm: bgm_quest_mystery
```text
壁の文字は、ただの落書きではない。爪で、あるいは血で執念深く刻まれたものだ。
```

#### `inner_04`（text）
**演出:** bg: bg_yato_shrine, bgm: bgm_quest_mystery
```text
名前の下には「無念」「恨」「偽」と血で書かれた文字。彼らは冤罪だったのか……？
```

#### `clue_01`（text）
**演出:** bg: bg_yato_shrine, bgm: bgm_quest_tense
```text
地下室の最奥に祭壇がある。祭壇の上に古びた巻物と、一振りの短刀が置かれていた。
```

#### `clue_02`（text）
**演出:** bg: bg_yato_shrine, bgm: bgm_quest_tense
```text
巻物には、影守一族の冤罪を証明する証拠が記されている。政変の黒幕は現在の重臣の一人だ。
```

#### `clue_03`（text）
**演出:** bg: bg_yato_shrine, bgm: bgm_quest_tense
```text
巻物を手に取ろうとした瞬間、祭壇の炎が噴き上がり、影守の怨霊が姿を現した！
```

#### `battle_02`（battle）
**演出:** bg: bg_yato_shrine, bgm: bgm_battle_boss
**パラメータ:** enemy_group_id: 451, next: reveal_01, fail: end_failure_01

#### `reveal_01`（text）
**演出:** bg: bg_yato_shrine, bgm: bgm_quest_calm
```text
影守の怨霊が膝をつく。怒りが消え、悲しみだけが残った顔で自分を見上げている。
```

#### `reveal_02_01`（text）
**演出:** bg: bg_yato_shrine, bgm: bgm_quest_calm
```text
影守の怨霊の瞳から憎悪の赤い光が消え、深い哀愁を帯びた声が響く。
```

#### `reveal_02`（text）
**演出:** bg: bg_yato_shrine, bgm: bgm_quest_calm, speaker: 影守の怨霊
```text
「我が一族の無念、晴らしてくれるか。それとも浄化して終わらせるか」
```

#### `choice_resolve`（choice）
**演出:** bg: bg_yato_shrine, bgm: bgm_quest_calm
```text
霊の問いかけに対し、どう答える？
```
- 選択肢: 「護符で浄化する。安らかに眠れ」→ `purify_01`
- 選択肢: 「巻物を持ち帰り、真相を世に問う」→ `resolve_01`

#### `purify_01`（text）
**演出:** bg: bg_yato_shrine, bgm: bgm_quest_calm
```text
護符を額に貼ると、影守は穏やかな顔で光に包まれ、消えていった。巻物は灰になった。
```

#### `purify_01_02`（text）
**演出:** bg: bg_yato_shrine, bgm: bgm_quest_calm
```text
影守の怨念が消え去ると、屋敷を支配していた極寒の冷気が和らいでいくのを感じた。
```

#### `purify_01_03`（text）
**演出:** bg: bg_yato_shrine, bgm: bgm_quest_calm
```text
かつての怨念は消え、ただ静かな廃墟としての時間が、再びこの場所に流れ始めた。
```

#### `purify_02`（text）
**演出:** bg: bg_yat_haunted, bgm: bgm_quest_calm
```text
屋敷から出ると、空は既に白み始めていた。もうここに怪光が灯ることはないだろう。
```

#### `end_success_01`（text）
**演出:** bg: bg_yato_city
```text
代官に報告した。「浄化したか。これで民も安心する。見事な働きであった」
```

#### `end_success`（end_success）
**演出:** bg: bg_yato_city
```text
屋敷の怨念は消え去った。だが、不都合な歴史の闇は誰にも知られぬまま……。
```
**rewards:** Gold:400, Exp:120, Rep:5, Justice:5

#### `resolve_01`（text）
**演出:** bg: bg_yato_shrine, bgm: bgm_quest_tense
```text
「……感謝する」
影守は深く頭を下げると、静かに消えていった。巻物を懐に収め、地上に戻る。
```

#### `resolve_02`（text）
**演出:** bg: bg_yato_city, bgm: bgm_quest_tense, speaker: 代官
```text
「これは……影守の冤罪の証拠か。馬鹿な、これが世に出れば大事になるぞ」
```

#### `resolve_02_02`（text）
**演出:** bg: bg_yato_city, bgm: bgm_quest_tense
```text
代官は顔を真っ青にしながら、証拠の巻物を震える手で机に置いた。
```

#### `end_success_chaos_01`（text）
**演出:** bg: bg_yato_city
```text
報酬は減額されたが、影守一族の名誉回復の種は、確かに蒔かれた。
```

#### `end_success_chaos`（end_success）
**演出:** bg: bg_yato_city
```text
真実を暴くことと、偽りの安寧を守ること。どちらが正義か、答えは出ない。
```
**rewards:** Gold:300, Exp:200, Rep:-5, Chaos:5

#### `end_failure_01`（text）
**演出:** bg: bg_yat_haunted
```text
怨霊の放つ絶対的な冷気に意識を奪われ、床に崩れ落ちるように倒れた。
```

#### `end_failure`（end_failure）
**演出:** bg: bg_yat_haunted
```text
朝、屋敷の外で目を覚ました。誰が運んだのか……怨霊の最後の温情だろうか。
```

---

## 4. 新規エネミー・アイテム定義参照

**新規追加エネミー（`enemies.csv`）:**
| ID | Slug | name | level | hp | atk | def | exp | gold |
|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| （既存） | `enemy_yato_onryo` | 怨霊 | 12 | 150 | 45 | 15 | 80 | 100 |
| 1261 | `enemy_yato_kagemon` | 影守の怨霊 | 14 | 220 | 52 | 18 | 120 | 150 |

**新規追加グループ（`enemy_groups.csv`）:**
| ID | Slug | 構成エネミー |
|-----|-----|-----|
| 450 | `grp_yato_onryo_01` | `enemy_yato_onryo`\|`enemy_yato_onryo` |
| 451 | `grp_yato_onryo_02` | `enemy_yato_onryo`\|`enemy_yato_kagemon` |

---

## 5. CSVエントリ

`quests_normal.csv`
```csv
7035,qst_yat_mansion,呪われた武家屋敷の調査,8,3,5,loc_yatoshin,,,,,Gold:400|Exp:120|Rep:5|Justice:5,代官所,[調査] 怪光が灯る旧領主の武家屋敷を調査する。怨霊の正体を暴け。
```

---

## 6. 実装チェックリスト

- [ ] 新規エネミー `enemy_yato_kagemon`（ID: 1261）がDBに登録済み
- [ ] エネミーグループ 450, 451 がDBに登録済み
- [ ] hp_damage トラップ（15%）が正常に動作
- [ ] 選択肢「浄化」→ Justice:5 / 「真相を問う」→ Chaos:5 が正しく分岐
- [ ] time_cost: 5（成功5日 / 失敗3日）
- [ ] 報酬が正しく付与される
- [ ] 背景画像 `bg_yato_den` が正しく表示

---

## 7. 拡張メモ

- 影守の巻物が後続の名声連動クエスト（5206: 反乱軍の若き指導者）への伏線となる可能性
- 地下祭壇が探索スポット化する将来的な拡張余地
