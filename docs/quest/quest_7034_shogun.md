# クエスト仕様書：7034 — 御前試合の果たし状配達

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7034 |
| **Slug** | `qst_yat_shogun` |
| **クエスト種別** | 夜刀クエスト（Yato） |
| **推奨レベル** | 6（Normal） |
| **難度** | 2 |
| **依頼主** | 剣客道場 |
| **出現条件** | 制限なし / 出現拠点: loc_yatoshin |
| **リピート** | リピート可能 |
| **難易度Tier** | Normal（rec_level: 6） |
| **経過日数 (time_cost)** | 1（成功: 1日 / 失敗: 1日） |
| **ノード数** | 35ノード（うち選択肢2件） |
| **サムネイル画像** | `/images/quests/bg_yato_shrine.png` |

---

## 1. クエスト概要

### 短文説明
```
[配達] 不吉な血判状を、隣地の剣客道場まで無傷で送り届ける。
```

### 長文説明
```
ある剣客道場の師範から、隣地のライバル道場へ宛てた「御前試合の果たし状」を託された。
だが、この血判状を届けようとした使者は、既に二人が途中の峠で引き返してきているという。
「峠には何かが出る」——そんな噂がまことしやかに囁かれている。
武士の面子がかかった血生臭い手紙を、無事に届けることができるだろうか。
```

---

## 2. 報酬定義

**報酬 (CSV記載形式):**
```
Gold:400|Exp:120
```

**ルート別報酬差異:**
| ルート | Gold | Exp | アライメント | 備考 |
|--------|------|-----|-------------|------|
| 「落ち着いて話しかける」 | 400 | 120 | Justice:10 | 対話による平和的解決 |
| 「構わず強行突破する」 | 400 | 120 | なし | 戦闘による強制突破 |
| 非遭遇（fallback） | 400 | 120 | なし | 峠の霊に会わず配達完了 |

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
                                 └─ travel_pass (random_branch: prob 60)
                                      ├─ next (遭遇) → confronted_01
                                      │   └─ confronted_02
                                      │       └─ confronted_03
                                      │           └─ choice_action
                                      │                ├─ 話し合う → resolve_01
                                      │                │             └─ resolve_02
                                      │                │                  └─ resolve_03
                                      │                │                      └─ deliver_peace_01
                                      │                │                          └─ deliver_peace_02
                                      │                │                              └─ deliver_peace_03
                                      │                │                                  └─ end_success_peace
                                      │                └─ 強行突破 → battle_01
                                      │                               └─ battle_02
                                      │                                   └─ battle_spirit
                                      │                                        ├─ win → after_fight_01
                                      │                                        │        └─ after_fight_02
                                      │                                        │             └─ after_fight_03
                                      │                                        │                  └─ deliver_normal_01
                                      │                                        │                      └─ deliver_normal_02
                                      │                                        │                          └─ deliver_normal_03
                                      │                                        │                              └─ end_success
                                      │                                        └─ lose → end_failure
                                      └─ fallback (非遭遇) → safe_01
                                                              └─ safe_02
                                                                  └─ deliver_normal_01 ━━━ (合流)
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_yato_city, bgm: bgm_quest_calm, speaker: 剣客道場の師範
```text
「腕の立つ冒険者に頼みがある。これを隣の宿場町にある道場へ届けてくれ」
```

#### `start_02`（text）
**演出:** bg: bg_yato_city, bgm: bgm_quest_calm
```text
道場の師範から、重厚な巻紙を手渡された。朱墨で禍々しい血判が押されている。
```

#### `start_03`（text）
**演出:** bg: bg_yato_city, bgm: bgm_quest_calm, speaker: 剣客道場の師範
```text
「これは御前試合の果たし状だ。武士の面子がかかった、決して遅れの手を取れない代物だ」
```

#### `start_04`（text）
**演出:** bg: bg_yato_city, bgm: bgm_quest_calm, speaker: 剣客道場の師範
```text
「だが、情けないことに我が門下生は、途中の峠道で『何か』に怯え、引き返してきてしまった」
```

#### `start_05`（text）
**演出:** bg: bg_yato_city, bgm: bgm_quest_calm, speaker: 剣客道場の師範
```text
「峠には何かが出るという噂だが……お前なら問題なかろう。無事に届けてくれ」
```

#### `travel_01`（text）
**演出:** bg: bg_yato_mountain, bgm: bgm_field
```text
果たし状を懐の奥にしっかりと収め、隣町へと続く寂れた峠道へと向かった。
```

#### `travel_02`（text）
**演出:** bg: bg_yato_mountain, bgm: bgm_field
```text
空はどんよりと曇り、山間には薄い靄がかかっている。前の使者が二人も逃げ帰ってきた道だ。
```

#### `travel_03`（text）
**演出:** bg: bg_yato_mountain, bgm: bgm_field
```text
気を引き締めて、落ち葉で滑りやすい薄暗い山道へと足を踏み入れた。
```

#### `travel_04`（text）
**演出:** bg: bg_yato_mountain, bgm: bgm_field
```text
木々の擦れる音しか聞こえない。時折、視界の端を妙な影が横切るような気がする。
```

#### `travel_pass`（random_branch）
**演出:** bg: bg_yato_mountain, bgm: bgm_field
```text
峠の頂上、最も見晴らしの悪い中間地点に差し掛かった。風がピタリと止む。
```
**パラメータ:** type: random_branch, prob: 60, next: confronted_01, fallback: safe_01

#### `safe_01`（text）
**演出:** bg: bg_yato_mountain, bgm: bgm_field
```text
背筋が寒くなるような気配を感じたが、やがてその気配はスッと消え去った。
```

#### `safe_02`（text）
**演出:** bg: bg_yato_mountain, bgm: bgm_field
```text
噂はただの噂だったのだろうか。それとも、単に運が良かっただけか。足早に峠を下る。
（※以降、deliver_normal_01へ合流）
```

#### `confronted_01`（text）
**演出:** bg: bg_yato_mountain, bgm: bgm_quest_tense
```text
風の音に混じって、どこからか「……かえれ……」という低いうめき声が聞こえた。
```

#### `confronted_02`（text）
**演出:** bg: bg_yato_mountain, bgm: bgm_quest_tense
```text
立ち止まって前方を睨むと、狭い山道を塞ぐように、ひとつの人影が立っていた。
```

#### `confronted_03`（text）
**演出:** bg: bg_yato_mountain, bgm: bgm_quest_tense
```text
ボロボロの着流しを着た浪人……ではない。その足元は透けており、地面から浮いている。怨霊だ。
```

#### `choice_action`（choice）
**演出:** bg: bg_yato_mountain, bgm: bgm_quest_tense
```text
霊は血走った目でこちらを睨みつけ、刀の柄に手をかけている。どうする？
```
- 選択肢: 「落ち着いて話しかける」→ `resolve_01`
- 選択肢: 「構わず強行突破する」→ `battle_01`

#### `resolve_01`（text）
**演出:** bg: bg_yato_mountain, bgm: bgm_quest_calm
```text
ゆっくりと両手を上げ、敵意がないことを示す。そして静かに、手紙を届けるだけだと告げた。
```

#### `resolve_02`（text）
**演出:** bg: bg_yato_mountain, bgm: bgm_quest_calm, speaker: 峠の怨霊
```text
霊はピタリと動きを止め、濁った目でこちらの懐を見つめた。「……お前は、逃げないのだな」
```

#### `resolve_03`（text）
**演出:** bg: bg_yato_mountain, bgm: bgm_quest_calm, speaker: 峠の怨霊
```text
「……あの果たし状……武士の意地か……ならば、行け」
霊はどこか寂しげな表情を浮かべると、霧のように消え去った。
```

#### `deliver_peace_01`（text）
**演出:** bg: bg_yato_city, bgm: bgm_quest_calm
```text
怨霊の無念を背に受けながら、無事に峠を越え、隣町の道場へと到着した。
```

#### `deliver_peace_02`（text）
**演出:** bg: bg_yato_city, bgm: bgm_quest_calm, speaker: 宛先の師範
```text
呼び出しに応じた師範に、果たし状を手渡す。師範は血判を確認し、深く頷いた。
```

#### `deliver_peace_03`（text）
**演出:** bg: bg_yato_city, bgm: bgm_quest_calm, speaker: 宛先の師範
```text
「無事に届いたか。……あの峠で何があった？ いや、聞かないでおこう。見事な胆力だ」
```

#### `end_success_peace`（end_success）
**演出:** bg: bg_guild
```text
配達完了。道場から多額の謝礼を受け取った。
あの霊は、かつて果たし合いに向かう途中で命を落とした剣客だったのかもしれない。
```
**rewards:** Gold:400, Exp:120, Justice:10

#### `battle_01`（text）
**演出:** bg: bg_yato_mountain, bgm: bgm_quest_tense
```text
言葉が通じる相手ではない。武器を構え、強行突破の姿勢を見せる。
```

#### `battle_02`（text）
**演出:** bg: bg_yato_mountain, bgm: bgm_quest_tense
```text
その瞬間、霊の顔が怒りに歪み、この世のものとは思えない悲痛な叫び声を上げた！
```

#### `battle_spirit`（battle）
**演出:** bg: bg_yato_mountain, bgm: bgm_battle
```text
無念の死を遂げた怨霊が襲いかかってきた！
```
**パラメータ:** type: battle, enemy_group_id: 435, next: after_fight_01, fail: end_failure

#### `after_fight_01`（text）
**演出:** bg: bg_yato_mountain, bgm: bgm_quest_calm
```text
霊の凶刃を躱し、その半透明な身体を断ち切る。霊は断末魔と共に空気へと溶けていった。
```

#### `after_fight_02`（text）
**演出:** bg: bg_yato_mountain, bgm: bgm_quest_calm
```text
嫌な冷気が晴れ、本来の山の空気が戻ってくる。厄介な障害だったが、これで進める。
```

#### `after_fight_03`（text）
**演出:** bg: bg_yato_mountain, bgm: bgm_quest_calm
```text
呼吸を整え、衣服の乱れを直すと、隣町を目指して峠を足早に駆け下りた。
```

#### `deliver_normal_01`（text）
**演出:** bg: bg_yato_city, bgm: bgm_quest_calm
```text
太陽が高く昇る頃、隣町の道場へ到着し、師範を呼び出して果たし状を手渡した。
```

#### `deliver_normal_02`（text）
**演出:** bg: bg_yato_city, bgm: bgm_quest_calm, speaker: 宛先の師範
```text
師範は果たし状の血判を厳しい表情で睨みつけ、ゆっくりと懐へ収めた。
```

#### `deliver_normal_03`（text）
**演出:** bg: bg_yato_city, bgm: bgm_quest_calm, speaker: 宛先の師範
```text
「無事に届いたか。前任者たちは逃げ帰ったというのに……お前、肝が据わっているな」
```

#### `end_success`（end_success）
**演出:** bg: bg_guild
```text
配達完了。道場から謝礼の金を受け取った。
あの峠にいた霊が何者だったのか——それは、聞かないままにしておくのが冒険者の知恵だろう。
```
**rewards:** Gold:400, Exp:120

#### `end_failure`（end_failure）
**演出:** bg: bg_yato_mountain
```text
怨霊の身を凍らせるような呪いと、圧倒的な執念の前に、なす術もなく意識を刈り取られた。
武士の面子を懸けた果たし状は、誰にも読まれることなく冷たい山道に転がったままだ……。
```

---

## 4. 新規エネミー・アイテム定義参照

**新規追加エネミー（`enemies.csv`）:**
| ID | Slug | name | level | hp | atk | def | exp | gold |
|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| 1245 | `enemy_yato_onryo` | 怨霊 | 12 | 150 | 45 | 15 | 80 | 100 |

**新規追加グループ（`enemy_groups.csv`）:**
| ID | Slug | 構成エネミー |
|-----|-----|-----|
| 435 | `grp_yato_spirit` | `enemy_yato_onryo` |

---

## 5. CSVエントリ

`quests_normal.csv`
```csv
7034,qst_yat_shogun,御前試合の果たし状配達,6,2,1,loc_yatoshin,,,,,Gold:400|Exp:120,剣客道場,[配達] 不吉な血判状を、隣地の剣客道場まで無傷で送り届ける。
```

---

## 6. 実装チェックリスト

- [x] 新規エネミーおよびグループ 435 がDBに登録済みであること
- [x] `random_branch` 60%での遭遇判定が正しく機能すること
- [x] 「話し合う」ルートで戦闘をスキップしてクリアできること
- [x] 「話し合う」ルートで `end_success_peace`（Justice:10付き）へ遷移すること
- [x] 「強行突破」ルートおよび非遭遇ルートで `end_success`（Justiceなし）へ遷移すること
- [x] 報酬が正しく付与されること
