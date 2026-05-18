# クエスト仕様書：7030 — 古道にはびこる妖討伐

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7030 |
| **Slug** | `qst_yat_yokai` |
| **クエスト種別** | 夜刀クエスト（Yato） |
| **推奨レベル** | 6（Normal） |
| **難度** | 2 |
| **依頼主** | 自警団 |
| **出現条件** | 制限なし / 出現拠点: loc_yatoshin |
| **リピート** | リピート可能 |
| **難易度Tier** | Normal（rec_level: 6） |
| **経過日数 (time_cost)** | 3（成功: 3日 / 失敗: 1日） |
| **ノード数** | 35ノード |
| **サムネイル画像** | `/images/quests/bg_yato_road.png` |

---

## 1. クエスト概要

### 短文説明
```
[討伐] 夜の街道筋に現れる怪異（からかさ小僧や赤鬼）を退治する。
```

### 長文説明
```
夜刀神国の外れを通る古道は、日が落ちると魑魅魍魎が跋扈する魔の道となる。
最近、街道を急ぐ旅人や商人が行方不明になる事件が相次いでいた。
自警団からの依頼は、怪異をおびき出すための「囮」となること。
護符を懐に忍ばせ、提灯一つの明かりを頼りに、夜の古道へ足を踏み入れろ。
```

---

## 2. 報酬定義

**報酬 (CSV記載形式):**
```
Gold:300|Exp:100|Justice:5
```

---

## 3. シナリオノードフロー

```text
start
 └─ start_02
     └─ start_03
         └─ start_04
             └─ start_05
                 └─ prep_01
                     └─ prep_02
                         └─ patrol_01
                             └─ patrol_02
                                 └─ patrol_03
                                     └─ patrol_04
                                         └─ enc_01
                                             └─ enc_02
                                                 └─ enc_03
                                                     └─ battle_01
                                                          ├─ win → after_01
                                                          └─ lose → end_failure
after_01
 └─ after_02
     └─ after_03
         └─ after_04
             └─ after_05
                 └─ deeper_01
                     └─ deeper_02
                         └─ deeper_03
                             └─ deeper_04
                                 └─ deeper_05
                                     └─ deeper_06
                                         └─ battle_02
                                              ├─ win → clear_01
                                              └─ lose → end_failure
clear_01
 └─ clear_02
     └─ clear_03
         └─ clear_04
             └─ clear_05
                 └─ report_01
                     └─ report_02
                         └─ end_success
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_yato_road, bgm: bgm_quest_tense, speaker: 自警団の男
```text
「ここ数日、夜の古道を越えようとした旅人が、立て続けに神隠しに遭っている」
```

#### `start_02`（text）
**演出:** bg: bg_yato_road, bgm: bgm_quest_tense, speaker: 自警団の男
```text
「荷車ごと消えた者もいる。獣の仕業ではない、得体の知れない『妖』が棲みついたのだ」
```

#### `start_03`（text）
**演出:** bg: bg_yato_road, bgm: bgm_quest_tense
```text
自警団の男は、怯えた顔で周囲を見回しながら、和紙に包まれた護符の束を差し出した。
```

#### `start_04`（text）
**演出:** bg: bg_yato_road, bgm: bgm_quest_tense
```text
禍々しい朱墨で呪文が書き込まれている。触れるだけで指先に冷たい痺れが走る代物だ。
```

#### `start_05`（text）
**演出:** bg: bg_yato_road, bgm: bgm_quest_tense, speaker: 自警団の男
```text
「月の出ない夜、この護符を持って古道を歩き、奴らをおびき出す『囮』になってくれ」
```

#### `prep_01`（text）
**演出:** bg: bg_yato_road, bgm: bgm_field
```text
護符を懐にしまい、まだ明るい内に町を出た。古道へと続く山道は不気味なほど静かだ。
```

#### `prep_02`（text）
**演出:** bg: bg_yato_road, bgm: bgm_field
```text
夕暮れが迫ると共に、木々の影が長く伸び、まるで生き物のように地面を這い回り始めた。
```

#### `patrol_01`（text）
**演出:** bg: bg_yato_road, bgm: bgm_field_night
```text
太陽が山の端に隠れると同時に、夜刀神国の外れを通る古道は深い闇に包まれた。
```

#### `patrol_02`（text）
**演出:** bg: bg_yato_road, bgm: bgm_field_night
```text
手元の提灯が頼りなく揺れる。先程まで聞こえていた虫の音は、いつの間にか絶えていた。
```

#### `patrol_03`（text）
**演出:** bg: bg_yato_road, bgm: bgm_field_night
```text
突然、ピタリと風が止んだ。直後、背筋を撫でるような冷たく湿った空気が流れ込んでくる。
```

#### `patrol_04`（text）
**演出:** bg: bg_yato_road, bgm: bgm_field_night
```text
足元に白い霧が立ち込め、提灯の炎が青白く変色した。懐の護符が微かに熱を帯びる。
```

#### `enc_01`（text）
**演出:** bg: bg_yato_road, bgm: bgm_quest_tense
```text
ガサリ、と前方の竹藪が大きく揺れた。獣にしては位置が高すぎる。
```

#### `enc_02`（text）
**演出:** bg: bg_yato_road, bgm: bgm_quest_tense
```text
飛び出してきたのは、古びた和傘に巨大な一つ目がギョロリと瞬く、異形の妖怪だった。
```

#### `enc_03`（text）
**演出:** bg: bg_yato_road, bgm: bgm_quest_tense
```text
ケケケッ、と人間を舐め切ったような下卑た笑い声が山霊に響き渡る。来るぞ！
```

#### `battle_01`（battle）
**演出:** bg: bg_yato_road, bgm: bgm_battle
```text
からかさ小僧と鬼火の群れが襲いかかってきた！
```
**パラメータ:** type: battle, enemy_group_id: 430, next: after_01, fail: end_failure

#### `after_01`（text）
**演出:** bg: bg_yato_road, bgm: bgm_field_night
```text
化け唐傘を両断し、荒い息を整える。足元に転がった残骸は、黒い泥のように溶けていく。
```

#### `after_02`（text）
**演出:** bg: bg_yato_road, bgm: bgm_field_night
```text
懐を探ると、護符が一枚、黒焦げの灰となって崩れ落ちた。奴らの邪気を防いでくれたのだ。
```

#### `after_03`（text）
**演出:** bg: bg_yato_road, bgm: bgm_field_night
```text
残りの護符はまだ微かな光を放っている。しかし、空気に纏わりつく嫌な気配は消えていない。
```

#### `after_04`（text）
**演出:** bg: bg_yato_road, bgm: bgm_field_night
```text
むしろ、先程の戦闘を合図にするかのように、周囲の瘴気が一段と濃くなった気がする。
```

#### `after_05`（text）
**演出:** bg: bg_yato_road, bgm: bgm_field_night
```text
引き返すなら今だ。だが、元凶を絶たねば、また次の旅人が神隠しに遭うだろう。
```

#### `deeper_01`（text）
**演出:** bg: bg_yato_road, bgm: bgm_quest_tense
```text
覚悟を決めて霧の奥へと足を踏み出す。すると、ズシン、ズシンと地鳴りのような足音がした。
```

#### `deeper_02`（text）
**演出:** bg: bg_yato_road, bgm: bgm_quest_tense
```text
足音はゆっくりと、だが確実にこちらへ向かってくる。提灯を掲げ、暗闇の先を照らした。
```

#### `deeper_03`（text）
**演出:** bg: bg_yato_road, bgm: bgm_quest_tense
```text
光の先に浮かび上がったのは、そびえ立つ巨大な赤い肉の壁。いや、鬼の巨躯だ。
```

#### `deeper_04`（text）
**演出:** bg: bg_yato_road, bgm: bgm_quest_tense
```text
頭には捻じれた二本の角。丸太ほどの太さがある腕には、血塗られた金棒が握られている。
```

#### `deeper_05`（text）
**演出:** bg: bg_yato_road, bgm: bgm_quest_tense, speaker: 赤鬼
```text
「ガハハハハ！ 小せぇ人間だ！ 怯えた瞳がたまんねぇなァ！」
```

#### `deeper_06`（text）
**演出:** bg: bg_yato_road, bgm: bgm_quest_tense, speaker: 赤鬼
```text
「骨の髄まで啜ってやる！ 美味そうじゃねぇか！」
血生臭い暴風が、鬼の咆哮と共に叩きつけられた。
```

#### `battle_02`（battle）
**演出:** bg: bg_yato_road, bgm: bgm_battle_boss
```text
古道の主、巨躯の赤鬼が立ち塞がる！
```
**パラメータ:** type: battle, enemy_group_id: 431, next: clear_01, fail: end_failure

#### `clear_01`（text）
**演出:** bg: bg_yato_road, bgm: bgm_quest_calm
```text
重い地響きと共に赤鬼が崩れ落ちた。手放された金棒が、乾いた音を立てて地面に転がる。
```

#### `clear_02`（text）
**演出:** bg: bg_yato_road, bgm: bgm_quest_calm
```text
主を失ったことで、古道を覆っていた分厚い瘴気が、嘘のようにみるみる晴れていく。
```

#### `clear_03`（text）
**演出:** bg: bg_yato_road, bgm: bgm_quest_calm
```text
赤鬼の亡骸は、朝露を浴びた霜のように溶け出し、やがてただの土塊と化して風に散った。
```

#### `clear_04`（text）
**演出:** bg: bg_yato_road, bgm: bgm_quest_calm
```text
冷たく澄んだ夜風が通り抜け、途絶えていた秋虫の音が、再び山間に響き渡り始める。
```

#### `clear_05`（text）
**演出:** bg: bg_yato_road, bgm: bgm_quest_calm
```text
懐の護符はすべて灰になっていた。どうやら、無事にその役目を全うしてくれたらしい。
```

#### `report_01`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm
```text
夜明けと共に町へ戻り、自警団の詰所で討伐の完了を報告する。男は信じられないものを見る目をした。
```

#### `report_02`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: 自警団の男
```text
「まさか、本当にあの赤鬼を討ち取るとは……見事な腕前だ。これで旅の者も安心して道を通れる」
```

#### `end_success`（end_success）
**演出:** bg: bg_guild
```text
約束の報酬を受け取った。呪われた古道に、再び人々の活気と行商の灯が戻る日も近いだろう。
```
**rewards:** Gold:300, Exp:100, Justice:5

#### `end_failure`（end_failure）
**演出:** bg: bg_yato_road
```text
化け物たちの圧倒的な力の前に、ついに膝をついた。
意識が薄れゆく中、獲物を貪ろうと嗤う不気味な声だけが耳にこびりついていた……。
```

---

## 4. 新規エネミー・アイテム定義参照

**新規追加エネミー（`enemies.csv` 登録済み）:**
※ 既存の `enemy_yato_onibi`, `enemy_yato_karakasa`, `enemy_yato_akaoni` を使用。

**新規追加グループ（`enemy_groups.csv`）:**
| ID | Slug | 構成エネミー |
|-----|-----|-----|
| 430 | `grp_yato_yokai_01` | `enemy_yato_onibi`\|`enemy_yato_onibi`\|`enemy_yato_karakasa` |
| 431 | `grp_yato_yokai_02` | `enemy_yato_akaoni` |

---

## 5. CSVエントリ

`quests_normal.csv`
```csv
7030,qst_yat_yokai,古道にはびこる妖討伐,6,2,3,loc_yatoshin,,,,,Gold:300|Exp:100|Justice:5,自警団,[討伐] 夜の街道筋に現れる怪異（からかさ小僧や赤鬼）を退治する。
```

---

## 6. 実装チェックリスト

- [x] 出現拠点 `loc_yatoshin` のみ
- [x] エネミーグループ 430, 431 がDBに登録済みであること
- [x] バトルの勝敗遷移が正しく機能すること
- [x] 報酬が正しく付与されること
