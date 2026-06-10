# クエスト仕様書：6108 — 神域の幻獣 麒麟

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6108 |
| **Slug** | `qst_legend_kirin` |
| **クエスト種別** | 特殊クエスト（Special） |
| **推奨レベル** | 27（Hard） |
| **難度** | 6 |
| **依頼主** | 冒険者ギルド |
| **出現条件** | 第15話「天軍の長」（6015）クリア |
| **リピート** | 現世代で1回（継承後は再出現） |
| **経過日数 (time_cost)** | 10 |
| **ノード数** | 55ノード |
| **ゲストNPC** | なし |
| **難易度Tier** | Hard（rec_level: 27） |
| **サムネイル画像** | /images/quests/bg_ruins_field.png |
---

## 1. クエスト概要

### 短文説明
```
[封印指定] 華龍国の霊峰に神獣・麒麟が降臨し、結界を張って人の立入を拒んでいる。
```

### 長文説明
```
華龍国の霊峰・崑崙山に、神獣麒麟が現れた。麒麟は結界を張り、
山中の薬草園と鉱脈を封鎖。生活の糧を失った山麓の民は困窮している。
古来、麒麟は聖獣として崇められたが、今回は人間を拒絶している。
その真意を問い、結界を解くか——力で排除するか。
```

---

## 2. 報酬定義

**CSV記載形式:** `Gold:6000|Exp:600|Rep:20|Justice:10`

| ルート | Gold | Exp | Rep | アライメント | スキル報酬 |
|--------|------|-----|:---:|-------------|------------|
| 討伐（デフォルト） | 6000 | 600 | +20 | Chaos:10 | 麒麟の結界 |
| 対話して和解（選択肢） | 4000 | 600 | +25 | Justice:10 | 麒麟の結界 |

**ユニーク報酬スキル（共通）:**
| card_id | slug | スキル名 | type | AP | 効果 | deck_cost |
|:-------:|------|---------|------|:--:|------|:---------:|
| 84 | `card_kirin_barrier` | 麒麟の結界 | Defense | 4 | 全体DEF+50の鉄壁防徣3T | 4 |

---

## 3. シナリオノードフロー

### 構成概要
- **導入**（start〜start_04）: 麒麟出現の報を受ける
- **登山**（climb_01〜climb_04）: 崑崙山を登る
- **結界トラップ**（barrier_trap: hp_damage 15%）
- **山中探索**（forest_01〜forest_04）: 封鎖された薬草園の惨状
- **前哨戦**（battle_01: grp 108 華龍の精霊）
- **麒麟の裁き**（random_judge: random_branch 50%）→ 失敗時hp_damage 20%
- **麒麟との対峙**（confront_01〜confront_06）: 麒麟の真意を聞く
- **ボス戦**（battle_boss: grp 9024 麒麟）
- **選択分岐**: 討伐→Chaos:10 / 和解→Justice:10

### ノード詳細

#### `start`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: ギルドマスター
```text
「華龍国から緊急の依頼だ。霊峰に神獣が現れ、山を封鎖している」
```

#### `start_02`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: ギルドマスター
```text
「麒麟——古来、仁徳の象徴とされる幻の聖獣だ。だが今は人間を拒絶している」
```

#### `start_03`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: ギルドマスター
```text
「山麓の民は薬草園と鉱脈を失い、飢え始めている。一刻の猶予もない」
```

#### `start_04`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm
```text
神獣を討つのか、それとも対話するのか。まずは霊峰に向かい、真意を確かめなければ。
```

#### `climb_01`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_field
```text
崑崙山の麓に到着した。山道の入口に結界の光が薄く漂っている。
```

#### `climb_02`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
```text
結界に触れると、穏やかだが確かな拒絶の力を感じる。通り抜けるには覚悟がいる。
```

#### `climb_03`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
```text
意を決して結界に踏み込んだ。体が軋むような圧力——だが、前に進む。
```

#### `climb_04`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
```text
結界を突破した。だがその代償は体に刻まれている。
```

#### `barrier_trap`（hp_damage）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
**パラメータ:** percent: 15
```text
結界の浄化の力が体を蝕む。人間の穢れを灼いているのか——全身に鈍い痛みが走った。
```

#### `barrier_02`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
```text
結界の内側は、外界とは空気が異なっていた。澄み切った霊気が肌を撫でる。
```

#### `forest_01`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_mystery
```text
山道を登ると、かつての薬草園が見えた。人の手入れが途絶え、野生に還りつつある。
```

#### `forest_02`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_mystery
```text
だが植生は異常に豊かだ。麒麟の霊気が山全体を活性化させているのか。
```

#### `forest_03`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_mystery
```text
鳥の声、獣の気配。結界の中は楽園のようだ。麒麟は山を守っている——ように見える。
```

#### `forest_04`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
```text
だが楽園の番人は来訪者を歓迎しない。森の奥から、精霊たちが警戒の眼差しを向けている。
```

#### `battle_01`（battle）
**演出:** bg: bg_karyu_mountain, bgm: bgm_battle
**パラメータ:** enemy_group_id: 108
```text
結界の守護精霊たちが侵入者を排除しようと襲いかかる！
```

#### `summit_01`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_mystery
```text
精霊を退け、山頂への最後の登りに差しかかった。空気が薄いが、霊気は濃密だ。
```

#### `summit_02`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_mystery
```text
山頂の台地に出た。一面の雲海。その中央に、白銀の光を纏う存在が佇んでいる。
```

#### `summit_03`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_mystery
```text
鹿の体に龍の頭、全身を覆う光の鱗。一本角が虹色に輝く。麒麟だ。
```

#### `random_judge`（random_branch）
**パラメータ:** prob: 50, next: `judge_pass`, fallback: `judge_fail`
（50%の確率で麒麟の審判を通過）

#### `judge_pass`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_calm
**次ノード:** confront_01
```text
麒麟の光がこちらを包んだ。体が温かい。害意はないと判断されたようだ。
```

#### `judge_fail`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
```text
麒麟の光が裁きに変わった。「穢れあり」——浄化の光が体を貫く！
```

#### `judge_trap`（hp_damage）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
**パラメータ:** percent: 20
```text
浄化の光が全身を灼いた。膝をつくが、歯を食いしばって立ち上がる。
```

#### `judge_fail_02`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
```text
裁きは受けた。だが退くつもりはない。顔を上げ、麒麟を真っ直ぐ見据えた。
```

#### `confront_01`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_calm, speaker: 麒麟
```text
「……人の子よ。なぜここに来た」
麒麟の声は風のように穏やかだが、底知れぬ威厳を帯びていた。
```

#### `confront_02`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_calm
```text
「山麓の民が困っている。結界を解いてほしい」——率直に伝えた。
```

#### `confront_03`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_calm, speaker: 麒麟
```text
「人間は山を削り、水を汚し、獣を追い立てた。自分はこの山を人間から守っているのだ」
```

#### `confront_04`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_calm, speaker: 麒麟
```text
「千年見守ったが、人間の業は深まる一方。故に結界を張った。これは罰ではない——保護だ」
```

#### `confront_05`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
```text
麒麟の言葉に嘘はない。だが山麓の民は飢えている。どちらの正義を選ぶべきか。
```

#### `confront_06`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_battle_boss, speaker: 麒麟
```text
「言葉で通じぬなら、力で示すがよい。自分を超えるなら——人の言葉に耳を傾けよう」
麒麟の一本角が白熱した。
```

#### `battle_boss`（battle）
**演出:** bg: bg_karyu_mountain, bgm: bgm_battle_boss
**パラメータ:** enemy_group_id: 9024
```text
霊獣・麒麟との決戦——！
```

#### `victory_01`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_calm
```text
麒麟の角が砕けた。霊獣が膝をつき、光が弱まっていく。
```

#### `victory_02`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_calm, speaker: 麒麟
```text
「……認めよう。貴方には力がある。だが力だけでは山は守れぬ」
```

#### `victory_03`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_calm, speaker: 麒麟
```text
「殺すか。それとも、人と山が共に生きる道を示すか。どちらを選ぶ」
```

#### `choice_kirin`（choice）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_calm
| 選択肢 | next_node |
|---------|-----------|
| 「脅威は排除する。結界を確実に解くために」 | slay_01 |
| 「人と山の共存を約束する。結界を部分的に解いてくれ」 | peace_01 |

#### `slay_01`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
```text
剣を振り下ろした。麒麟の体が光の粒子に還り、山頂に風が吹き抜けた。
```

#### `slay_02`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_calm
```text
結界が消え、山が元の姿を取り戻した。だが空気は少し、澱んだ気がする。
```

#### `end_success`（end_success）
**演出:** bg: bg_guild
```text
「麒麟の討伐を確認。結界は解除され、山麓の民は元の暮らしに戻れる」
報酬を受け取ったが、山頂の清浄な空気を思い出すと——少しだけ、胸が痛んだ。
```
**rewards:** Gold:6000, Exp:600, Rep:20, Chaos:10

#### `peace_01`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_calm, speaker: 麒麟
```text
「……共存か。千年待ったが、ようやくそう言う人間が現れたか」
麒麟の瞳に穏やかな光が戻った。
```

#### `peace_02`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_calm
```text
「薬草園と鉱脈の一部を開放する。だが奥の森と水源には人を入れるな。約束できるか」
```

#### `peace_03`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_calm, speaker: 麒麟
```text
「よかろう。約束は守れ——自分はこの山から離れぬ。見守っている」
結界が薄くなり、山道が開かれた。
```

#### `end_success_peace`（end_success）
**演出:** bg: bg_guild
```text
「結界が部分的に解除された。山麓の民は安堵している」
麒麟との約束——人と山の共存。それを守れるかどうかは、人間の覚悟次第だ。
```
**rewards:** Gold:4000, Exp:600, Rep:25, Justice:10

#### `end_failure`（end_failure）
**演出:** bg: bg_karyu_mountain
```text
麒麟の浄化の光が体を焼き尽くした。山は静けさを取り戻し——人の痕跡は消えた。
```

---

## 4. エネミー定義参照

| ID | Slug | name | level | hp | atk | def |
|-----|-----|-----|-----|-----|-----|-----|
| 6024 | `boss_holy_kirin` | 霊獣・麒麟 | 38 | 1800 | 120 | 30 |

**ボスユニークスキル:**
| id | slug | スキル名 | effect_type | value | 説明 |
|----|------|---------|:-----------:|:-----:|------|
| 4010 | `skill_kirin_horn` | 聖角一閃 | damage | 3.5 | 聖なる一撃 |
| 4011 | `skill_kirin_purge` | 浄化の波動 | damage_blind | 2 | 目潰し(2T) |
| 4012 | `skill_kirin_heal` | 霊気充填 | heal | 300 | HP300大回復 |

| グループID | Slug | 用途 |
|-----|-----|-----|
| 108 | `karyu_spirit_group` | 前哨: 精霊戦 |
| 9024 | `enemy_grp_boss_kirin` | ボス戦 |

---

## 5. CSVエントリ

`quests_special.csv`
```csv
6108,qst_legend_kirin,神域の幻獣,27,6,10,"{""completed_quest"":""main_ep15""}",false,,,冒険者ギルド,[封印指定] 華龍国の霊峰に神獣・麒麟が降臨し結界を張って人の立入を拒んでいる。
```
