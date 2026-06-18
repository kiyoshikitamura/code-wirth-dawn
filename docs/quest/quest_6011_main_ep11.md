# クエスト仕様書：6011 — 第11話「天使降臨」

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6011 |
| **Slug** | `main_ep11` |
| **クエスト種別** | メインエピソード（Main） |
| **推奨レベル** | 16（Hard） |
| **難度** | 3 |
| **依頼主** | なし |
| **出現条件** | 第10話「世界の底が抜ける日」（6010）クリア / 滞在拠点: 華龍神朝首都 天極城「龍京」 |
| **リピート** | アカウント通じて1回のみ（継承後も非表示） |
| **経過日数 (time_cost)** | 2 |
| **ノード数** | 44ノード |
| **ゲストNPC** | なし |
| **難易度Tier** | Hard（rec_level: 16） |
| **サムネイル画像** | `/images/quests/bg_ruins_field.png` |
---

## 1. クエスト概要

### 短文説明
```
華龍神朝を襲う天の軍勢。不死の傭兵王ヴォルグとの出会い。
```

### 長文説明
```
華龍神朝の街道で、天空が三つの太陽によって黄金に染まる怪現象が発生する。
地上を滅ぼさんとする使徒の軍勢と対峙し、不死の傭兵王ヴォルグからその覚悟を試される。
```

---

## 2. 報酬定義
```
Exp:300|Gold:1200|Rep:15|Order:5
```

---

## 3. シナリオノード構成（44ノード）

### 全体フロー
```text
start → karyu_01 → karyu_02 → sky_01 → sky_02 → sky_03
  → villagers_01 → villagers_02 → voice_01 → voice_02
  → angels_01 → angels_02 → angels_03 → slaughter_01 → stand_01 → stand_02
  → battle1(210) → choice1 → post_battle → post_02 → wave_01 → wave_02
  → battle2(210) → choice2 → retreat_01 → retreat_02
  → volg_01 → volg_02 → volg_03 → volg_04 → volg_05 → volg_06 → volg_07
  → battle3(213) → choice3 → close_01 → approve_01 → approve_02
  → decision_01 → decision_02 → depart_01 → depart_02 → end_01 → end_node
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_road_day, bgm: bgm_quest_calm
```text
華龍神朝の広大な穀倉地帯を行く街道。のどかな風景。
```

#### `karyu_01`（text）
**演出:** bg: bg_road_day
```text
しかし、吹き抜ける風にはどこか不穏な冷たさがあった。
```

#### `karyu_02`（text）
**演出:** bg: bg_road_day
```text
街道を進むあなたの足元で、突然大地が小さく震える。
```

#### `sky_01`（text）
**演出:** bg: bg_ruins_field, bgm: bgm_quest_crisis
```text
見上げた空に異変が起きた。雲が黄金色に輝き始める。
```

#### `sky_02`（text）
**演出:** bg: bg_ruins_field
```text
天空に二つ目の太陽、そして三つ目の太陽が出現する。
```

#### `sky_03`（text）
**演出:** bg: bg_ruins_field
```text
異様な光に照らされ、街道の木々が一瞬で立ち枯れた。
```

#### `villagers_01`（text）
**演出:** bg: bg_ruins_field, speaker: 怯える農民
```text
「天罰だ……！神々が我らを滅ぼしに来たのだ！」
```

#### `villagers_02`（text）
**演出:** bg: bg_ruins_field, speaker: 怯える農民
```text
「おしまいだ、どこにも逃げ場所なんてない……！」
```

#### `voice_01`（text）
**演出:** bg: bg_ruins_field
```text
天空から、鼓膜を裂くような無機質な声が鳴り響いた。
```

#### `voice_02`（text）
**演出:** bg: bg_ruins_field, speaker: 天の啓示
```text
「地上ノ穢レタ種ヨ。大イナル浄化ノ光ヲ受ケ入れヨ」
```

#### `angels_01`（text）
**演出:** bg: bg_ruins_field
```text
光の輪を頭上に戴く、無数の人型の怪物――使徒が降下する。
```

#### `angels_02`（text）
**演出:** bg: bg_ruins_field
```text
奴らの手から放たれる熱線が、村の家々を次々と焼き払う。
```

#### `angels_03`（text）
**演出:** bg: bg_ruins_field
```text
悲鳴を上げて逃げ惑う人々。阿鼻叫喚の地獄絵図が広がる。
```

#### `slaughter_01`（text）
**演出:** bg: bg_ruins_field
```text
逃げ遅れた子供に、使徒が冷酷にその手を伸ばした。
```

#### `stand_01`（text）
**演出:** bg: bg_ruins_field
```text
あなたは迷わず駆け出し、使徒の前に立ちはだかった。
```

#### `stand_02`（text）
**演出:** bg: bg_ruins_field
```text
迫り来る天の軍勢を睨みつけ、大剣を鋭く構える。
```

#### `battle1`（battle）
**演出:** bg: bg_ruins_field, bgm: bgm_battle
**パラメータ:** enemy_group_id: 210, next: choice1, fail: end_failure

#### `choice1`（choice）
**演出:** bg: bg_ruins_field, bgm: bgm_battle
| 選択肢 | next_node |
|---|---|
| 「使徒を撃退する」 | `post_battle` |

#### `post_battle`（text）
**演出:** bg: bg_ruins_field
```text
なんとか一体を撃破した。しかし、周囲の使徒が集まる。
```

#### `post_02`（text）
**演出:** bg: bg_ruins_field
```text
さらに上空から、十数体の使徒が新たに舞い降りてきた。
```

#### `wave_01`（text）
**演出:** bg: bg_ruins_field
```text
息を荒くしながら、あなたは再び武器を握り直した。
```

#### `wave_02`（text）
**演出:** bg: bg_ruins_field
```text
退路を確保するため、押し寄せる光の軍勢に挑みかかる。
```

#### `battle2`（battle）
**演出:** bg: bg_ruins_field, bgm: bgm_battle
**パラメータ:** enemy_group_id: 210, next: choice2, fail: end_failure

#### `choice2`（choice）
**演出:** bg: bg_ruins_field, bgm: bgm_battle
| 選択肢 | next_node |
|---|---|
| 「包囲を突破する」 | `retreat_01` |

#### `retreat_01`（text）
**演出:** bg: bg_ruins_field
```text
敵の包囲網を強引にこじ開け、森の奥へと走り込んだ。
```

#### `retreat_02`（text）
**演出:** bg: bg_ruins_field
```text
満身創痍になりながらも、あなたは追跡を振り切った。
```

#### `volg_01`（text）
**演出:** bg: bg_bandit_camp, bgm: bgm_quest_calm
```text
たどり着いたのは、険しい岩肌が露出した山の中だった。
```

#### `volg_02`（text）
**演出:** bg: bg_bandit_camp
```text
周囲には、頭の輪が砕かれた使徒の骸が何体も転がっている。
```

#### `volg_03`（text）
**演出:** bg: bg_bandit_camp
```text
骸を椅子代わりに腰掛ける、身の丈を超える大柄な男。
```

#### `volg_04`（text）
**演出:** bg: bg_bandit_camp
```text
大剣を肩に担ぎ、獰猛な肉食獣のような瞳でこちらを見る。
```

#### `volg_05`（text）
**演出:** bg: bg_bandit_camp, speaker: 不死の傭兵ヴォルグ
```text
「あの使徒どもを相手に生き延びたか。見所はあるな」
```

#### `volg_06`（text）
**演出:** bg: bg_bandit_camp, speaker: 不死の傭兵ヴォルグ
```text
「だが、俺の足手まといになるような雑魚は必要ねえ」
```

#### `volg_07`（text）
**演出:** bg: bg_bandit_camp, speaker: 不死の傭兵ヴォルグ
```text
「お前が天の奴らと戦う覚悟があるか、試させてもらう」
```

#### `battle3`（battle）
**演出:** bg: bg_bandit_camp, bgm: bgm_battle_strong
**パラメータ:** enemy_group_id: 213, next: choice3, fail: end_failure

#### `choice3`（choice）
**演出:** bg: bg_bandit_camp, bgm: bgm_battle_strong
| 選択肢 | next_node |
|---|---|
| 「ヴォルグに実力を示す」 | `close_01` |

#### `close_01`（text）
**演出:** bg: bg_bandit_camp
```text
激しい金属音が山に響く。あなたは男の一撃を受け止めた。
```

#### `approve_01`（text）
**演出:** bg: bg_bandit_camp
```text
男は大剣を引き、面白そうに喉を鳴らして笑った。
```

#### `approve_02`（text）
**演出:** bg: bg_bandit_camp, speaker: 不死の傭兵ヴォルグ
```text
「合格だ。これなら背中を預けても退屈しなさそうだな」
```

#### `decision_01`（text）
**演出:** bg: bg_bandit_camp, speaker: 不死の傭兵ヴォルグ
```text
「俺の名はヴォルグ。天の野郎どもの大掃除を邪魔してやる」
```

#### `decision_02`（text）
**演出:** bg: bg_bandit_camp, speaker: 不死の傭兵ヴォルグ
```text
「次は砂漠の国、マルカンドが狙われているらしい」
```

#### `depart_01`（text）
**演出:** bg: bg_bandit_camp
```text
ヴォルグは立ち上がり、使徒の死体を蹴り飛ばした。
```

#### `depart_02`（text）
**演出:** bg: bg_bandit_camp
```text
黄金都市イスハークを守るため、あなたは決意を固める。
```

#### `end_01`（text）
**演出:** bg: bg_bandit_camp
```text
不死の傭兵と共に、あなたは砂漠の国への路を急いだ。
```

#### `end_node`（end_success）
**演出:** bg: bg_bandit_camp
```text
神々への反逆の旅が、ここに本格的に開始された。
```
**rewards:** Exp:300, Gold:1200, Rep:15, Order:5

#### `end_failure`（end_failure）
**演出:** bg: bg_ruins_field
```text
天の光に貫かれ、あなたは灰となって風に散った。
```
**rewards:** Gold:0
