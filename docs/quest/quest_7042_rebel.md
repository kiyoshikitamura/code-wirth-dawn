# クエスト仕様書：7042 — 辺境農民の反乱鎮圧

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7042 |
| **Slug** | `qst_har_rebel` |
| **クエスト種別** | 華龍クエスト（Karyu） |
| **推奨レベル** | 7（Normal） |
| **難度** | 2 |
| **依頼主** | 地方太守 |
| **出現条件** | max_reputation: -50 / 出現拠点: loc_haryu |
| **リピート** | リピート可能 |
| **難易度Tier** | Normal（rec_level: 7） |
| **経過日数 (time_cost)** | 4（成功: 4日 / 失敗: 2日） |
| **ノード数** | 35ノード（うち選択肢1件） |
| **サムネイル画像** | `/images/quests/bg_karyu_village.png` |

---

## 1. クエスト概要

### 短文説明
```
[鎮圧] 重税に苦しむ農民の反乱軍を容赦なく根絶やしにする。
```

### 長文説明
```
華龍国の辺境で農民が竹槍を手に蜂起した。
太守は冒険者を雇い制圧を命じる。
刃を向ける相手が飢えた農民であることを忘れてはならない。
```

---

## 2. 報酬定義

**CSV記載形式（デフォルトルート）:**
```
Gold:450|Exp:100|Evil:10
```

**ルート別報酬差異:**
| ルート | Gold | Exp | アライメント |
|--------|------|-----|-------------|
| 鎮圧する（デフォルト） | 450 | 100 | Evil:10 |
| 引き下がる | 0 | 50 | Justice:5 |

---

## 2.5 失敗ペナルティ

| 項目 | 値 |
|-----|-----|
| VIT変動 | VIT -1 |
| 経過日数（失敗） | 2日 |

---

## 3. シナリオノードフロー

```text
start
 └─ start_02
     └─ start_03
         └─ start_04
             └─ start_05
                 └─ travel_01
                     └─ travel_02
                         └─ travel_03
                             └─ travel_04
                                 └─ arrive_01
                                     └─ arrive_02
                                         └─ arrive_03
                                             └─ arrive_04
                                                 └─ arrive_05
                                                     └─ face_mob (choice)
                                                          ├─ 制圧 → charge_01
                                                          │          └─ charge_02
                                                          │               └─ charge_03
                                                          │                    └─ battle_01
                                                          │                         ├─ win → after_01
                                                          │                         │        └─ after_02
                                                          │                         │             └─ leader_01
                                                          │                         │                  └─ leader_02
                                                          │                         │                       └─ leader_03
                                                          │                         │                            └─ battle_02
                                                          │                         │                                 ├─ win → clear_01
                                                          │                         │                                 │        └─ clear_02
                                                          │                         │                                 │             └─ end_success
                                                          │                         │                                 └─ lose → end_failure
                                                          │                         └─ lose → end_failure
                                                          └─ 引き下がる → withdraw_01
                                                                            └─ withdraw_02
                                                                                 └─ withdraw_03
                                                                                      └─ withdraw_04
                                                                                           └─ end_success_withdraw
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_karyu_palace, bgm: bgm_quest_tense, speaker: 地方太守
```text
「よく来てくれた、裏稼業の者よ。内密に頼みたい汚れ仕事があるのだ」
きらびやかな装飾が施された太守の館で、肥え太った役人が冷酷な笑みを浮かべていた。
```

#### `start_02`（text）
**演出:** bg: bg_karyu_palace, bgm: bgm_quest_tense, speaker: 地方太守
```text
「辺境の農村で、税の取り立てに反発した農民どもが竹槍を持って暴れ回っておる」
```

#### `start_03`（text）
**演出:** bg: bg_karyu_palace, bgm: bgm_quest_tense, speaker: 地方太守
```text
「正規兵を動かせば上に知れる。お主らのような荒くれ者に、奴らを『物理的に』黙らせてほしいのだ」
```

#### `start_04`（text）
**演出:** bg: bg_karyu_palace, bgm: bgm_quest_tense, speaker: 地方太守
```text
「奴らは完全に徒党を組み、暴徒と化している。情けは無用だ、一人残らず根絶やしにせよ」
```

#### `start_05`（text）
**演出:** bg: bg_karyu_palace, bgm: bgm_field
```text
太守は面倒くさそうに手を振り、大量の金貨が入った袋を見せつけた。
辺境の村まで、ここから東に二日ほどの距離だ。
```

#### `travel_01`（text）
**演出:** bg: bg_karyu_village, bgm: bgm_field
```text
辺境へと続く街道は、見るも無惨に荒れ果てていた。道端には飢え死にした者たちの白骨が転がっている。
```

#### `travel_02`（text）
**演出:** bg: bg_karyu_village, bgm: bgm_field
```text
田畑の土は完全に乾ききり、作物を育てる用水路もとうの昔に枯れ果てている。これでは税など払えるはずもない。
```

#### `travel_03`（text）
**演出:** bg: bg_karyu_village, bgm: bgm_field
```text
すれ違ったぼろ布を纏う老婆が、こちらの武装を見てひどく怯えた目を向けた。
```

#### `travel_04`（text）
**演出:** bg: bg_karyu_village, bgm: bgm_field, speaker: 村の老婆
```text
「……アンタ、まさか……太守様が送ってきた手先かい？ ヒィィッ！」
老婆は地べたに這いつくばりながら、逃げるように去っていった。
```

#### `arrive_01`（text）
**演出:** bg: bg_karyu_village, bgm: bgm_quest_tense
```text
目的の村の入り口に到着した。広場には、農具や竹槍を手にした数十人の農民たちがバリケードを築いている。
```

#### `arrive_02`（text）
**演出:** bg: bg_karyu_village, bgm: bgm_quest_tense
```text
皆一様に頬がこけ、目は落ち窪んでいる。正規兵ではない、ただの飢えた人間の群れだ。
```

#### `arrive_03`（text）
**演出:** bg: bg_karyu_village, bgm: bgm_quest_tense
```text
こちらの接近に気づいた農民たちが、怯えと憎悪の入り混じった顔で一斉に竹槍を向けてきた。
```

#### `arrive_04`（text）
**演出:** bg: bg_karyu_village, bgm: bgm_quest_tense, speaker: 農民の首謀者
```text
先頭に立つ初老の男が、血を吐くような声で叫んだ。
「太守の犬め！ もう俺たちからは何も奪えないぞ！」
```

#### `arrive_05`（text）
**演出:** bg: bg_karyu_village, bgm: bgm_quest_tense, speaker: 農民の首謀者
```text
「頼む、見逃してくれ！ 俺たちはただ、家族にひもじい思いをさせたくないだけなんだ！」
```

#### `face_mob`（choice）
**演出:** bg: bg_karyu_village, bgm: bgm_quest_tense
```text
刃を向ける相手は、魔物ではなく飢えた弱者たちだ。冒険者として太守の命令を遂行するか？
```
- 選択肢: 「容赦なく制圧する——これが仕事だ」→ `charge_01`
- 選択肢: 「武器を収め、引き下がる」→ `withdraw_01`

#### `charge_01`（text）
**演出:** bg: bg_karyu_village, bgm: bgm_quest_tense
```text
感情を殺し、無言のまま武器を構える。それが裏社会を生きる者のルールだ。
```

#### `charge_02`（text）
**演出:** bg: bg_karyu_village, bgm: bgm_quest_tense, speaker: 農民の首謀者
```text
男たちの表情が絶望から殺意へと変わる。
「……話し合いは通じないってわけか！ やるしかねぇ！」
```

#### `charge_03`（text）
**演出:** bg: bg_karyu_village, bgm: bgm_quest_tense, speaker: 農民の首謀者
```text
「逃げるな！ 退いたら村中の女子供が殺されるぞ！ 全員でかかれェッ！！」
```

#### `battle_01`（battle）
**演出:** bg: bg_karyu_village, bgm: bgm_battle
```text
飢えた農民たちが捨て身の覚悟で突進してきた！
```
**パラメータ:** type: battle, enemy_group_id: 443, next: after_01, fail: end_failure

#### `after_01`（text）
**演出:** bg: bg_karyu_village, bgm: bgm_quest_tense
```text
怒号と悲鳴が入り混じる中、農民たちを次々と血祭りに上げる。血が乾いた土を赤く染めていく。
```

#### `after_02`（text）
**演出:** bg: bg_karyu_village, bgm: bgm_quest_tense
```text
数名の死体を作ると、暴徒たちは恐れをなして後ずさった。だが、首謀者の男だけは血まみれで立っている。
```

#### `leader_01`（text）
**演出:** bg: bg_karyu_village, bgm: bgm_quest_tense, speaker: 農民の首謀者
```text
「長男は重税のための強制労働で死んだ。次男は餓死した。娘は太守に売られた……！」
```

#### `leader_02`（text）
**演出:** bg: bg_karyu_village, bgm: bgm_quest_tense, speaker: 農民の首謀者
```text
「これ以上、何を奪うって言うんだ！ 殺すなら、俺を殺してからにしろォォッ！！」
```

#### `leader_03`（text）
**演出:** bg: bg_karyu_village, bgm: bgm_quest_tense
```text
男は折れた竹槍を強く握り直し、鬼気迫る形相でこちらへ突進してきた。彼の目にもう死への恐怖はない。
```

#### `battle_02`（battle）
**演出:** bg: bg_karyu_village, bgm: bgm_battle_boss
```text
首謀者が死に物狂いで襲いかかってきた！
```
**パラメータ:** type: battle, enemy_group_id: 444, next: clear_01, fail: end_failure

#### `clear_01`（text）
**演出:** bg: bg_karyu_village, bgm: bgm_quest_calm
```text
首謀者が力尽き、仰向けに倒れ伏す。それを見た残りの農民たちは、完全に戦意を喪失して散り散りに逃げ去った。
```

#### `clear_02`（text）
**演出:** bg: bg_karyu_village, bgm: bgm_quest_calm
```text
血と泥にまみれた広場には、死体にすがりついて泣き崩れる女や子供たちだけが残された。反乱は完全に鎮圧された。
```

#### `end_success`（end_success）
**演出:** bg: bg_guild
```text
血塗られた手で太守の館へと戻り、任務完了の報告と共に多額の報酬を受け取る。
背中の奥で、村人たちの呪詛の泣き声がいつまでも響いているような気がした……。
```
**rewards:** Gold:450, Exp:100, Evil:10

#### `withdraw_01`（text）
**演出:** bg: bg_karyu_village, bgm: bgm_quest_calm
```text
静かに武器を下ろし、背を向けた。いくら金のためとはいえ、飢えた者たちを狩る真似はできない。
```

#### `withdraw_02`（text）
**演出:** bg: bg_karyu_village, bgm: bgm_quest_calm
```text
踵を返して歩き出した背中に、首謀者の震える声が聞こえてきた。
「……ありがとう……ありがとう、見逃してくれて……」
```

#### `withdraw_03`（text）
**演出:** bg: bg_karyu_village, bgm: bgm_quest_calm
```text
来た道を引き返す。太守には「手強くて制圧に失敗した」とでも言えばいい。
```

#### `withdraw_04`（text）
**演出:** bg: bg_karyu_village, bgm: bgm_quest_calm
```text
村人がその後どうなるかは分からない。だが、少なくとも自分の手で彼らの命を奪わずに済んだ。
```

#### `end_success_withdraw`（end_success）
**演出:** bg: bg_guild
```text
「役立たずのクズめ！ とっとと失せろ！」
太守から激しく罵倒され、当然ながら報酬は一切支払われなかった。だが、胸の奥には確かな誇りが残っている。
```
**rewards:** Exp:0, Justice:5, Rep:-10

#### `end_failure`（end_failure）
**演出:** bg: bg_karyu_village
```text
武具の力は勝っていたが、彼らの「生きるための覚悟」がそれを上回った。
無数の竹槍に身体を貫かれ、冷たい泥の中に倒れ伏す。因果応報、仕方のない結末かもしれない……。
```

---

## 4. 新規エネミー・アイテム定義参照

**新規追加エネミー（`enemies.csv`）:**
| ID | Slug | name | level | hp | atk | def | exp | gold |
|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| 1253 | `enemy_karyu_rebel_farmer` | 反乱農民 | 5 | 40 | 12 | 2 | 8 | 10 |
| 1254 | `enemy_karyu_rebel_leader` | 農民の首謀者 | 10 | 120 | 35 | 5 | 40 | 50 |

**新規追加グループ（`enemy_groups.csv`）:**
| ID | Slug | 構成エネミー |
|-----|-----|-----|
| 443 | `grp_karyu_rebel_mob` | `enemy_karyu_rebel_farmer`\|`enemy_karyu_rebel_farmer`\|`enemy_karyu_rebel_farmer`\|`enemy_karyu_rebel_farmer` |
| 444 | `grp_karyu_rebel_leader` | `enemy_karyu_rebel_leader`\|`enemy_karyu_rebel_farmer`\|`enemy_karyu_rebel_farmer` |

---

## 5. CSVエントリ

`quests_normal.csv`
```csv
7042,qst_har_rebel,辺境農民の反乱鎮圧,7,2,4,loc_haryu,,,,-50,Gold:450|Exp:100|Evil:10,地方太守,[鎮圧] 重税に苦しむ農民の反乱軍を容赦なく根絶やしにする。
```

---

## 6. 実装チェックリスト

- [x] 受注条件 `max_reputation: -50` が機能する
- [x] 新規エネミー ID:1253, 1254 がDBに登録済み
- [x] エネミーグループ 443, 444 がDBに登録済み
- [x] 選択肢「引き下がる」→ Justice:5 / 「制圧する」→ Evil:10 が正しく分岐
- [x] time_cost: 4（成功4日 / 失敗2日）
