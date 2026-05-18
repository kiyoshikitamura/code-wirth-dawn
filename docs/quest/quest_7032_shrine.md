# クエスト仕様書：7032 — 結界石の修復と奉納

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7032 |
| **Slug** | `qst_yat_shrine` |
| **クエスト種別** | 夜刀クエスト（Yato） |
| **推奨レベル** | 6（Normal） |
| **難度** | 2 |
| **依頼主** | 神社 |
| **出現条件** | 制限なし / 出現拠点: loc_yatoshin |
| **リピート** | リピート可能 |
| **難易度Tier** | Normal（rec_level: 6） |
| **経過日数 (time_cost)** | 5（成功: 5日 / 失敗: 3日） |
| **ノード数** | 35ノード |
| **サムネイル画像** | `/images/quests/bg_yato_shrine.png` |

---

## 1. クエスト概要

### 短文説明
```
[修復] 神隠しを防ぐため、破られた結界石の破片を集めて祠に納める。
```

### 長文説明
```
夜刀神国の霊山には、古くから神隠しを防ぐための「結界石」が祀られている。
しかし何者かの手によって石が砕かれ、破片が山中に散らばってしまった。
神主からの依頼は、散逸した三つの破片を拾い集め、祠に奉納すること。
結界の解けた山には、既に悪しき気配が満ち始めている。急がねばならない。
```

---

## 2. 報酬定義

**報酬 (CSV記載形式):**
```
Gold:400|Exp:120|Justice:10
```

---

## 3. シナリオノードフロー

```text
start
 └─ start_02
     └─ start_03
         └─ start_04
             └─ start_05
                 └─ mountain_01
                     └─ mountain_02
                         └─ mountain_03
                             └─ mountain_04
                                 └─ collect_shard_01 (random_branch: prob 50)
                                      ├─ next (遭遇) → yokai_01
                                      │   └─ yokai_02
                                      │       └─ battle_yokai_01
                                      │            ├─ win → after_battle_01 ━━╮
                                      │            └─ lose → end_failure      │
                                      └─ fallback (非遭遇) → search_02 ━━━━━━━╯ (合流)
search_02 (after_battle_01 からも遷移)
 └─ search_03
     └─ search_04
         └─ collect_shard_02 (random_branch: prob 50)
              ├─ next (遭遇) → boss_01
              │   └─ boss_02
              │       └─ battle_yokai_02
              │            ├─ win → after_battle_02 ━━╮
              │            └─ lose → end_failure      │
              └─ fallback (非遭遇) → search_05 ━━━━━━━╯ (合流)
search_05 (after_battle_02 からも遷移)
 └─ search_06
     └─ search_07
         └─ collect_shard_03
             └─ shrine_01
                 └─ shrine_02
                     └─ shrine_03
                         └─ return_shrine
                             └─ enshrine_01
                                 └─ enshrine_02
                                     └─ end_success
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_yato_shrine, bgm: bgm_quest_calm, speaker: 神主
```text
「おお、冒険者殿。よくぞ来てくださった。事態は一刻を争うのです」
```

#### `start_02`（text）
**演出:** bg: bg_yato_shrine, bgm: bgm_quest_calm
```text
老いた神主は、顔を真っ青にしながら、背後にそびえる霊山の山頂を指さした。
```

#### `start_03`（text）
**演出:** bg: bg_yato_shrine, bgm: bgm_quest_calm, speaker: 神主
```text
「山頂の祠に祀られていた『結界石』が、何者かによって打ち砕かれてしまったのです」
```

#### `start_04`（text）
**演出:** bg: bg_yato_shrine, bgm: bgm_quest_calm, speaker: 神主
```text
「石の破片は山中に散らばっているはず。あれがないと、この町に妖が雪崩れ込んでくる……！」
```

#### `start_05`（text）
**演出:** bg: bg_yato_shrine, bgm: bgm_quest_calm, speaker: 神主
```text
「どうか、散逸した三つの破片を集め、再び祠に奉納してくだされ。頼みましたぞ」
```

#### `mountain_01`（text）
**演出:** bg: bg_yato_mountain, bgm: bgm_field
```text
依頼を受け、鬱蒼とした霊山へと足を踏み入れた。昼間だというのに、薄暗い霧が立ち込めている。
```

#### `mountain_02`（text）
**演出:** bg: bg_yato_mountain, bgm: bgm_field
```text
山全体が不気味な静寂に包まれていた。本来この山を守るはずの清浄な気は、完全に失われている。
```

#### `mountain_03`（text）
**演出:** bg: bg_yato_mountain, bgm: bgm_field
```text
獣道を掻き分けながら、斜面を登っていく。ふと、苔むした大岩の根本に、淡く光るものを見つけた。
```

#### `mountain_04`（text）
**演出:** bg: bg_yato_mountain, bgm: bgm_field
```text
近づいてみると、それは握り拳ほどの大きさの、半透明な石の欠片だった。
```

#### `collect_shard_01`（random_branch）
**演出:** bg: bg_yato_mountain, bgm: bgm_field
```text
一つ目の破片を拾い上げた。石は氷のように冷たいが、微かに神聖な脈動を感じる。
```
**パラメータ:** type: random_branch, prob: 50, next: yokai_01, fallback: search_02

#### `yokai_01`（text）
**演出:** bg: bg_yato_mountain, bgm: bgm_quest_tense
```text
その時、木々の隙間からヒュードロドロという気味の悪い音が鳴り響いた。
```

#### `yokai_02`（text）
**演出:** bg: bg_yato_mountain, bgm: bgm_quest_tense
```text
青白い鬼火が舞い、その奥から奇妙な妖怪たちが姿を現す。結界が破れた影響か！
```

#### `battle_yokai_01`（battle）
**演出:** bg: bg_yato_mountain, bgm: bgm_battle
```text
山に巣食う妖怪の群れが襲いかかってきた！
```
**パラメータ:** type: battle, enemy_group_id: 430, next: after_battle_01, fail: end_failure

#### `after_battle_01`（text）
**演出:** bg: bg_yato_mountain, bgm: bgm_quest_calm
```text
妖怪たちを斬り伏せると、奴らは霧となって四散した。油断はできない、先を急ごう。
```

#### `search_02`（text）
**演出:** bg: bg_yato_mountain, bgm: bgm_field
```text
さらに険しい山道を登っていく。霧が次第に濃くなり、視界が数歩先までしか効かなくなってきた。
```

#### `search_03`（text）
**演出:** bg: bg_yato_mountain, bgm: bgm_field
```text
ぬかるんだ枯れ沢の跡に出た。そこは山津波で崩れた形跡があり、歩を進めるのも困難だ。
```

#### `search_04`（text）
**演出:** bg: bg_yato_mountain, bgm: bgm_field
```text
泥の中に、二つ目の淡い光を見つけた。泥にまみれているが、間違いなく結界石の破片だ。
```

#### `collect_shard_02`（random_branch）
**演出:** bg: bg_yato_mountain, bgm: bgm_field
```text
布で汚れを拭い取ると、破片は再び清らかな光を取り戻した。これで二つ目だ。
```
**パラメータ:** type: random_branch, prob: 50, next: boss_01, fallback: search_05

#### `boss_01`（text）
**演出:** bg: bg_yato_mountain, bgm: bgm_quest_tense
```text
直後、ズンッと地面が揺れた。背後から生暖かい、ひどく血生臭い息が吹き付けられる。
```

#### `boss_02`（text）
**演出:** bg: bg_yato_mountain, bgm: bgm_quest_tense, speaker: 赤鬼
```text
「石を集めてどうする気だァ……？ まさか、この俺を封じようってんじゃねぇだろうなァ！」
```

#### `battle_yokai_02`（battle）
**演出:** bg: bg_yato_mountain, bgm: bgm_battle_boss
```text
霧の中から巨大な赤鬼が立ち塞がった！
```
**パラメータ:** type: battle, enemy_group_id: 431, next: after_battle_02, fail: end_failure

#### `after_battle_02`（text）
**演出:** bg: bg_yato_mountain, bgm: bgm_quest_calm
```text
赤鬼が轟音と共に倒れた。この巨怪ですら、結界がなければ山に居座ってしまうということか。
```

#### `search_05`（text）
**演出:** bg: bg_yato_mountain, bgm: bgm_field
```text
気を取り直し、山頂を目指す。木々がまばらになり、冷たい強風が吹きつけるようになってきた。
```

#### `search_06`（text）
**演出:** bg: bg_yato_mountain, bgm: bgm_field
```text
やがて、山頂の開けた場所に出た。そこには、無残に破壊された古い石の祠があった。
```

#### `search_07`（text）
**演出:** bg: bg_yato_mountain, bgm: bgm_field
```text
祠の台座の横に、最後の破片が転がっている。欠けた部分を合わせれば、元の形になりそうだ。
```

#### `collect_shard_03`（text）
**演出:** bg: bg_yato_mountain, bgm: bgm_field
```text
最後の破片を拾い上げる。三つの破片が揃うと、互いに共鳴するように暖かな光を放ち始めた。
```

#### `shrine_01`（text）
**演出:** bg: bg_yato_mountain, bgm: bgm_quest_calm
```text
破片を抱え、急いで山を駆け下りる。背後で、山そのものが安堵の吐息を漏らしたような気がした。
```

#### `shrine_02`（text）
**演出:** bg: bg_yato_shrine, bgm: bgm_quest_calm
```text
町に降りると、神社の鳥居の前に神主が立っていた。焦燥に駆られた様子でこちらを待っている。
```

#### `shrine_03`（text）
**演出:** bg: bg_yato_shrine, bgm: bgm_quest_calm, speaker: 神主
```text
「おお、戻られましたか！ その懐の光は、間違いなく結界石……！」
```

#### `return_shrine`（text）
**演出:** bg: bg_yato_shrine, bgm: bgm_quest_calm
```text
神主に三つの破片を手渡す。老人は震える手で石を受け取り、祭壇へと向かった。
```

#### `enshrine_01`（text）
**演出:** bg: bg_yato_shrine, bgm: bgm_quest_calm
```text
古き祝詞が朗々と響き渡る。すると、三つの破片はまばゆい光に包まれ、一つに融合し始めた。
```

#### `enshrine_02`（text）
**演出:** bg: bg_yato_shrine, bgm: bgm_quest_calm
```text
完全な球体に戻った結界石が台座に鎮座すると、町を覆っていた重い空気が、ふっと軽くなった。
```

#### `end_success`（end_success）
**演出:** bg: bg_guild
```text
「これで、しばらくは神隠しも収まるでしょう。本当に、ありがとうございました」
感謝の言葉と報酬を受け取り、神社を後にした。結界が破られた原因は、いずれ探る必要がある。
```
**rewards:** Gold:400, Exp:120, Justice:10

#### `end_failure`（end_failure）
**演出:** bg: bg_yato_mountain
```text
山の怪異たちの圧倒的な力の前に、ついに力尽きた。
冷たい土の上に倒れ伏す中、誰かが結界石の破片を拾い上げ、嘲笑う声が聞こえた気がした……。
```

---

## 4. 新規エネミー・アイテム定義参照

※ 7030で定義したエネミーグループ 430（からかさ小僧等）、431（赤鬼）をそのまま流用。

---

## 5. CSVエントリ

`quests_normal.csv`
```csv
7032,qst_yat_shrine,結界石の修復と奉納,6,2,5,loc_yatoshin,,,,,Gold:400|Exp:120|Justice:10,神社,[修復] 神隠しを防ぐため、破られた結界石の破片を集めて祠に納める。
```

---

## 6. 実装チェックリスト

- [x] `random_branch` ノードが `prob` に従って正しく `next` / `fallback` へ分岐すること
- [x] 妖怪とのバトル（勝敗）が正しく機能すること
- [x] 報酬が正しく付与されること
