# クエスト仕様書：7030 — 古道にはびこる妖討伐

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7030 |
| **Slug** | `qst_yat_yokai` |
| **クエスト種別** | 一般クエスト（Normal） |
| **推奨レベル** | 6（Normal） |
| **難度** | 2 |
| **依頼主** | 自警団 |
| **出現条件** | 出現国: 夜刀神国 |
| **リピート** | リピート可能 |
| **経過日数 (time_cost)** | 3 |
| **ノード数** | 38ノード |
| **ゲストNPC** | なし |
| **難易度Tier** | Normal（rec_level: 6） |
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

```
Gold:300|Exp:100|Justice:5
```

---

## 3. シナリオノードフロー

```text
start → start_desc → start_02 → start_03 → start_04 → start_05
  → prep_01 → prep_02 → patrol_01 → patrol_02 → patrol_03 → patrol_04
    → enc_01 → enc_02 → enc_03 → battle_01
         ├─ win → after_01 → after_02 → after_03 → after_04 → after_05
         │    → deeper_01 → deeper_02 → deeper_03 → deeper_04 → deeper_05 → deeper_06 → deeper_wind → battle_02
         │       ├─ win → clear_01 → clear_02 → clear_03 → clear_04 → clear_05 → report_01 → report_02 → end_success
         │       └─ lose → end_failure
         └─ lose → end_failure
```

### ノード詳細（38ノード）

#### `start`（text）
**演出:** bg: bg_yato_city, bgm: bgm_quest_tense
```text
自警団の詰め所。薄暗い部屋で、ひげ面の団長が苦渋に満ちた表情で語り出す。
```

#### `start_desc`（text）
**演出:** bg: bg_yato_city, speaker: 自警団の男
```text
「ここ数日、夜の古道を越えようとした旅人が、立て続けに神隠しに遭っている」
```

#### `start_02`（text）
**演出:** bg: bg_yato_city, speaker: 自警団の男
```text
「荷車ごと消えた者もいる。獣ではない、得体の知れない『妖』の仕業だ」
```

#### `start_03`（text）
**演出:** bg: bg_yato_city
```text
男は怯えた顔で、和紙に包まれた護符の束を差し出した。指先が微かに震えている。
```

#### `start_04`（text）
**演出:** bg: bg_yato_city
```text
朱墨で呪文が書かれた護符だ。触れるだけで、指先にツンとした冷たい痺れが走る。
```

#### `start_05`（text）
**演出:** bg: bg_yato_city, speaker: 自警団の男
```text
「月の出ぬ夜、この護符を持って古道を歩き、奴らを誘い出す囮になってくれ」
```

#### `prep_01`（text）
**演出:** bg: bg_yato_road, bgm: bgm_field
```text
護符を懐に隠し、夕暮れ前に町を出た。古道へと続く山坂は異様なほど静まり返る。
```

#### `prep_02`（text）
**演出:** bg: bg_yato_road, bgm: bgm_field
```text
陽が落ちると共に木々の影が長く伸び、うごめく蛇のように地面を這い始めた。
```

#### `patrol_01`（text）
**演出:** bg: bg_yato_road, bgm: bgm_quest_mystery
```text
薄暗い夜刀神国の外れ。古道は、一瞬にして墨を流したような深い闇に閉ざされた。
```

#### `patrol_02`（text）
**演出:** bg: bg_yato_road, bgm: bgm_quest_mystery
```text
手提げ提灯の炎が頼りなく揺れる。先ほどまで響いていた虫の音は消え去っていた。
```

#### `patrol_03`（text）
**演出:** bg: bg_yato_road, bgm: bgm_quest_mystery
```text
ピタリと風が止んだ。次の瞬間、背筋を凍らせるような湿った冷気が吹き抜ける。
```

#### `patrol_04`（text）
**演出:** bg: bg_yato_road, bgm: bgm_quest_mystery
```text
足元に白い霧が湧き、提灯の火が青白く変色した。懐の護符がジリジリと熱を帯びる。
```

#### `enc_01`（text）
**演出:** bg: bg_yato_road, bgm: bgm_quest_tense
```text
ガサリ、と行く手の竹藪が大きく揺れ動く。獣にしては位置が高すぎる気配だ。
```

#### `enc_02`（text）
**演出:** bg: bg_yato_road, bgm: bgm_quest_tense
```text
現れたのは、古びた和傘の中央に巨大な一つ目がギョロリと瞬く、異形の妖怪だった。
```

#### `enc_03`（text）
**演出:** bg: bg_yato_road, bgm: bgm_quest_tense
```text
ケケケッ、と人間を嘲笑う下卑た笑い声が静寂を裂く。怪異がこちらへ飛びかかった！
```

#### `battle_01`（battle）
**演出:** bg: bg_yato_road, bgm: bgm_battle
**パラメータ:** enemy_group_id: 430, next: `after_01`, fail: `end_failure`
```text
からかさ小僧と鬼火の群れが襲いかかってきた！
```

#### `after_01`（text）
**演出:** bg: bg_yato_road, bgm: bgm_quest_mystery
```text
唐傘の怪異を両断した。足元に転がった残骸は、黒い泥のように融けて消えていく。
```

#### `after_02`（text）
**演出:** bg: bg_yato_road, bgm: bgm_quest_mystery
```text
懐の護符が、一枚黒焦げになって崩れ落ちた。奴らの邪気を吸い取ってくれたのだ。
```

#### `after_03`（text）
**演出:** bg: bg_yato_road, bgm: bgm_quest_mystery
```text
残る護符はまだ微光を放つ。だが、空気にまとわりつく嫌な瘴気は晴れていない。
```

#### `after_04`（text）
**演出:** bg: bg_yato_road, bgm: bgm_quest_mystery
```text
それどころか、先ほどの戦いを合図に、周囲の闇が一層濃くなったように感じられた。
```

#### `after_05`（text）
**演出:** bg: bg_yato_road, bgm: bgm_quest_mystery
```text
引き返すなら今だ。だが、元凶を絶たねば、また悲劇が繰り返されるだけだろう。
```

#### `deeper_01`（text）
**演出:** bg: bg_yato_road, bgm: bgm_quest_tense
```text
覚悟を決めて霧の奥へと進む。すると、ズシンと重い地響きのような音が響いた。
```

#### `deeper_02`（text）
**演出:** bg: bg_yato_road, bgm: bgm_quest_tense
```text
足音はゆっくりとこちらに近づく。提灯を掲げ、暗闇の先を照らし出した。
```

#### `deeper_03`（text）
**演出:** bg: bg_yato_road, bgm: bgm_quest_tense
```text
光の中に浮かび上がったのは、そびえ立つ巨大な赤い肉の壁。鬼の巨躯だった。
```

#### `deeper_04`（text）
**演出:** bg: bg_yato_road, bgm: bgm_quest_tense
```text
頭に捻じれた二本の角。丸太のような腕には、血塗られた鉄の金棒が握られている。
```

#### `deeper_05`（text）
**演出:** bg: bg_yato_road, bgm: bgm_quest_tense, speaker: 赤鬼
```text
「ガハハハハ！ 小さな人間め！ 怯えた瞳がたまらんなァ！」
```

#### `deeper_06`（text）
**演出:** bg: bg_yato_road, bgm: bgm_quest_tense, speaker: 赤鬼
```text
「骨の髄まで啜ってやる！ 美味そうじゃねぇか！」
```

#### `deeper_wind`（text）
**演出:** bg: bg_yato_road
```text
赤鬼の叫びと共に、血生臭い暴風が顔を打ちつけた。嵐のような威圧感が襲う。
```

#### `battle_02`（battle）
**演出:** bg: bg_yato_road, bgm: bgm_battle_boss
**パラメータ:** enemy_group_id: 431, next: `clear_01`, fail: `end_failure`
```text
古道の主である巨躯の赤鬼が立ち塞がる！
```

#### `clear_01`（text）
**演出:** bg: bg_yato_road, bgm: bgm_quest_calm
```text
重い地響きと共に赤鬼が沈み、手放された金棒が乾いた音を立てて地面に転がった。
```

#### `clear_02`（text）
**演出:** bg: bg_yato_road, bgm: bgm_quest_calm
```text
主を失ったことで、古道を塞いでいた分厚い瘴気が、見る間に消え去っていく。
```

#### `clear_03`（text）
**演出:** bg: bg_yato_road, bgm: bgm_quest_calm
```text
鬼の骸は朝露を浴びた霧のように消え、やがてただの黒い土となって風に散った。
```

#### `clear_04`（text）
**演出:** bg: bg_yato_road, bgm: bgm_quest_calm
```text
澄んだ夜風が吹き抜け、途絶えていた虫の音が、再び山間に美しく響き始めた。
```

#### `clear_05`（text）
**演出:** bg: bg_yato_road, bgm: bgm_quest_calm
```text
懐の護符はすべて灰になっていた。役目を全うしてくれたことに静かに感謝する。
```

#### `report_01`（text）
**演出:** bg: bg_yato_city, bgm: bgm_quest_calm
```text
夜明けに町へ戻り、自警団の詰所へ。男はこちらの姿を見て、驚愕に目を見張った。
```

#### `report_02`（text）
**演出:** bg: bg_yato_city, bgm: bgm_quest_calm, speaker: 自警団の男
```text
「本当に赤鬼を討ち取ったのか！ これで誰もが安心してこの道を通れる」
```

#### `end_success`（end_success）
**演出:** bg: bg_yato_city
```text
約束の報酬を受け取る。古道に、再び人々の往来と提灯の灯が戻る日も近いだろう。
```
**rewards:** Gold:300, Exp:100, Justice:5

#### `end_failure`（end_failure）
**演出:** bg: bg_yato_road
```text
怪異どもの圧倒的な力の前に力尽きる。嗤うような不気味な声が闇に響いていた。
```

---

## 4. 新規エネミー・アイテム定義参照

**新規追加グループ（`enemy_groups.csv`）:**

| ID | Slug | 構成エネミー |
|-----|-----|-----|
| 430 | `grp_yato_yokai_01` | `enemy_yato_onibi`\|`enemy_yato_onibi`\|`enemy_yato_karakasa` |
| 431 | `grp_yato_yokai_02` | `enemy_yato_akaoni` |
