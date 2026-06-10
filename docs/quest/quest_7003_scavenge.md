# クエスト仕様書：7003 — 廃墟の金庫回収

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7003 |
| **Slug** | `qst_gen_scavenge` |
| **クエスト種別** | 一般クエスト（Normal） |
| **推奨レベル** | 2（Easy） |
| **難度** | 2 |
| **依頼主** | 冒険者ギルド |
| **出現条件** | 全拠点で出現 |
| **リピート** | リピート可能 |
| **経過日数 (time_cost)** | 3 |
| **ノード数** | 26ノード（うち選択肢1件: ギルド/闇市） |
| **ゲストNPC** | なし |
| **難易度Tier** | Easy（rec_level: 2） |
| **サムネイル画像** | /images/quests/bg_ruins_field.png |
---

## 1. クエスト概要
 
### 短文説明
```
[探索] 廃墟の金庫から物資を回収する。届けるか売りさばくか。
```

### 長文説明
```
冒険者ギルドから、崩壊街区の廃墟に残された金庫の回収を依頼された。
先日の地震で通路が崩れ、さらにゴブリンが住み着いている危険なエリアだ。
回収対象の金庫にはギルドの封印が施されており、中身の開封は禁じられている。
そのままギルドへ届けるか、あるいは闇市で高く売りさばくか、選択を迫られる。
```

---

## 2. 報酬定義

| ルート | Gold | Exp | Rep |
|--------|------|-----|-----|
| ギルドに届ける | 250 | 35 | 2 |
| 闇市に売る | 500 | 35 | -5 |

---

## 3. シナリオノードフロー

```text
start → text_01 → text_02 → text_03 → text_04
  → enter_01 → enter_02 → enter_03 → goblin_01 → goblin_02
    → battle_01
      ├─ win → after_01 → after_02 → hob_01 → hob_02
      │    → battle_02
      │      ├─ win → recover → moral_01 → moral_02 [選択肢]
      │      │    ├─ ギルドに届ける → guild_01 → guild_02 → end_success
      │      │    └─ 闇市に売る → dark_01 → dark_02 → end_dark
      │      └─ lose → end_failure
      └─ lose → end_failure
```

```text
start_prep → start → text_01 → text_02 → text_03 → text_04
  → enter_01 → enter_scenery → enter_02 → enter_03 → enter_darkness
    → goblin_01 → goblin_02 → battle_01
      ├─ win → after_01 → after_lock → after_02 → hob_01 → hob_02 → battle_02
      │    ├─ win → recover → recover_weight → moral_01 → moral_02
      │    │    ├─ ギルドに届ける → guild_01 → guild_02 → end_success
      │    │    └─ 闇市に売る → dark_01 → dark_02 → dark_think → end_dark
      │    └─ lose → end_failure
      └─ lose → end_failure
```

### ノード詳細（32ノード）

#### `start_prep`（text）
**演出:** bg: bg_guild
```text
朝のギルドは騒がしい。押し寄せる冒険者たちを押しのけ、依頼板を見る。
```

#### `start`（text）
**演出:** bg: bg_guild
```text
冒険者ギルドの掲示板に、急ぎの依頼が貼られていた。
```

#### `text_01`（text）
**演出:** bg: bg_guild
```text
「崩壊街区の廃墟金庫から物資を回収。中身は開封不可」
```

#### `text_02`（text）
**演出:** bg: bg_guild, speaker: ギルド担当
```text
「場所は崩壊街区の北だ。先週の地震で通路の一部が崩れているから注意しろ」
```

#### `text_03`（text）
**演出:** bg: bg_guild, speaker: ギルド担当
```text
「最近はあの辺りをゴブリンどもがねぐらにしているという報告もある」
```

#### `text_04`（text）
**演出:** bg: bg_guild
```text
依頼書にサインを入れ、廃墟の地図を受け取った。
```

#### `enter_01`（text）
**演出:** bg: bg_ruins_field
```text
廃墟の入り口に足を踏み入れる。天井の半ばが崩れ落ち、瓦礫が散乱していた。
```

#### `enter_scenery`（text）
**演出:** bg: bg_ruins_field
```text
周囲を見渡すと、湿った土と腐った木材の臭いが漂い、かつての繁栄の面影など微塵もなかった。
```

#### `enter_02`（text）
**演出:** bg: bg_ruins_field
```text
壁にはかすれた古い紋章。かつて商家の倉庫だったようだ。
```

#### `enter_03`（text）
**演出:** bg: bg_ruins_field
```text
奥に進むと薄暗い通路の先に、頑強だが錆びた鉄扉が見えた。
```

#### `enter_darkness`（text）
**演出:** bg: bg_ruins_field
```text
足元に転がる小石を慎重に避けながら、呼吸を整える。
```

#### `goblin_01`（text）
**演出:** bg: bg_ruins_field
```text
鉄扉の前にゴブリンが二匹。木箱を漁っている。
```

#### `goblin_02`（text）
**演出:** bg: bg_ruins_field
```text
こちらに気づくと、黄色い目をギラつかせ、耳障りな金切声を上げて威嚇してきた！
```

#### `battle_01`（battle）
**演出:** bg: bg_ruins_field, bgm: bgm_battle
| 設定 | 値 |
|-----|-----|
| 敵グループID | `402` |
| 敵表示名 | ゴブリンたち |

```text
ゴブリンが襲いかかってきた！
```

#### `after_01`（text）
**演出:** bg: bg_ruins_field
```text
ゴブリンを倒した。緑の血を吸った土を踏みしめ前へ進む。
```

#### `after_lock`（text）
**演出:** bg: bg_ruins_field
```text
鉄扉の前に立ち、錆びついた錠前へナイフの刃先を突き立てた。
```

#### `after_02`（text）
**演出:** bg: bg_ruins_field
```text
中には重厚な鉄の金庫が一つ。ギルドの封印が施されている。
```

#### `hob_01`（text）
**演出:** bg: bg_ruins_field
```text
金庫の横にもう一つの通路。奥から重く湿った足音。
```

#### `hob_02`（text）
**演出:** bg: bg_ruins_field
```text
暗闇から、倍以上の体躯を持つホブゴブリンが、取り巻きを引き連れて姿を現した！
```

#### `battle_02`（battle）
**演出:** bg: bg_ruins_field, bgm: bgm_battle
| 設定 | 値 |
|-----|-----|
| 敵グループID | `403` |
| 敵表示名 | ホブゴブリン一味 |

```text
ホブゴブリンの群れが襲いかかってきた！
```

#### `recover`（text）
**演出:** bg: bg_ruins_field
```text
なんとか敵を退けた。呼吸は荒く、全身が泥と血に汚れている。
```

#### `recover_weight`（text）
**演出:** bg: bg_ruins_field
```text
重い金庫を担ぎ上げる。中身がかすかに揺れる音がした。
```

#### `moral_01`（text）
**演出:** bg: bg_road_day
```text
重い金庫を背負って外へと出た。だが、これを闇市へ持っていけば、ギルドを介すより倍で売れるだろう。
```

#### `moral_02`（choice）
**演出:** bg: bg_road_day
| 選択肢 | 次ノード |
|---|---|
| ギルドに届ける | guild_01 |
| 闇市に売る | dark_01 |

#### `guild_01`（text）
**演出:** bg: bg_guild
```text
金庫をギルドに持ち帰った。担当が封印の無事を確認する。
```

#### `guild_02`（text）
**演出:** bg: bg_guild, speaker: ギルド担当
```text
「封印は無事だな。よし、よくやった。これが約束の報酬だ」
```

#### `end_success`（end_success）
**演出:** bg: bg_guild
```text
物資回収完了。正当な報酬を受け取った。
```
**rewards:** Gold:250, Exp:35, Rep:2

#### `dark_01`（text）
**演出:** bg: bg_slum
```text
スラムの裏路地、薄暗い倉庫に金庫を持ち込んだ。
```

#### `dark_02`（text）
**演出:** bg: bg_slum, speaker: 闇商人
```text
「フッ……いい品じゃないか。ギルドの倍額で買い取ろう。もちろん、お互いのために秘密裏にな」
```

#### `dark_think`（text）
**演出:** bg: bg_slum
```text
中身は誰に渡ったのか。考えるのはよそう。金がすべてだ。
```

#### `end_dark`（end_success）
**演出:** bg: bg_slum
```text
闇市で売りさばいた。懐は潤ったが、良心が痛む。
```
**rewards:** Gold:500, Exp:35, Rep:-5, Chaos:10

#### `end_failure`（end_failure）
**演出:** bg: bg_ruins_field
```text
力尽き、廃墟の床に倒れ伏す。金庫は泥の中に残された。
```

---

## 4. 敵定義参照

| enemy_group_id | グループ名 | 構成 |
|----------------|-----------|------|
| 402 | ゴブリン x2 | enemy_goblin x2 |
| 403 | ホブゴブリンの群れ | enemy_hobgoblin + enemy_goblin x2 |