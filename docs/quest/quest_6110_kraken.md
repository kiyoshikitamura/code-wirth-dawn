# クエスト仕様書：6110 — 大海の悪夢 クラーケン

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6110 |
| **Slug** | `qst_legend_kraken` |
| **クエスト種別** | 伝説級ボス（Legend） |
| **推奨レベル** | 28 |
| **難度** | 6 |
| **依頼主** | 冒険者ギルド |
| **出現条件** | EP15（`main_ep15`）クリア済み |
| **リピート** | 1世代1回 |
| **経過日数 (time_cost)** | 12（成功: 12日 / 失敗: 7日） |
| **ノード数** | 58ノード |

---

## 1. クエスト概要

### 短文説明
```
[封印指定] 交易海域に巨大な海魔クラーケンが出現し、船舶を沈めている。海上決戦に挑め。
```

### 長文説明
```
マルカンド沿岸の交易海域で、巨大な触腕が海面から現れ商船を次々と沈めている。
クラーケン——千年に一度現れるという海の災厄。
港湾都市は海上封鎖を余儀なくされ、経済は麻痺状態。
海軍の軍船を借り受け、クラーケンの棲む海溝に乗り込む決死の討伐作戦が発動された。
```

---

## 2. 報酬定義

**CSV記載形式:** `Gold:10000|Exp:700|Rep:30|Chaos:10`

| ルート | Gold | Exp | Rep | アライメント | スキル報酬 |
|--------|------|-----|:---:|-------------|------------|
| 討伐（デフォルト） | 10000 | 700 | +30 | Chaos:10 | 海神の怒涛 |
| 海溝に追い返す（選択肢） | 6000 | 700 | +20 | Justice:10 | 海神の怒涛 |

**ユニーク報酬スキル（共通）:**
| card_id | slug | スキル名 | type | AP | 効果 | deck_cost |
|:-------:|------|---------|------|:--:|------|:---------:|
| 86 | `card_kraken_tide` | 海神の怒涛 | Magic | 5 | 全体90ダメ＋拘束1T | 5 |

---

## 3. シナリオノードフロー

### 構成概要
- **導入**（start〜start_04）: 海軍と合流
- **出航**（sail_01〜sail_04）: 軍船で出航
- **嵐トラップ**（storm_trap: hp_damage 10%——クラーケンが起こした嵐）
- **触腕戦**（battle_01: grp 104 先遣隊——触腕に集まった海棲魔物）
- **random_branch**（fog_nav: 50%——濃霧の中での航行）→ 失敗時hp_damage 15%
- **海溝探索**（deep_01〜deep_06）: 海溝に潜る
- **ボス戦**（battle_boss: grp 9026 クラーケン）
- **選択分岐**: 討伐→Chaos:10 / 追放→Justice:10

### ノード詳細

#### `start`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: ギルドマスター
```text
「海が死んだ。交易船がまた三隻沈められた。クラーケンの仕業だ」
```

#### `start_02`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: ギルドマスター
```text
「海軍が軍船を一隻貸してくれた。だが船員は志願者だけだ。皆、死を覚悟している」
```

#### `start_03`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: ギルドマスター
```text
「報酬は破格だ。だが正直に言う——海の化け物を陸の戦士が倒せるかは分からん」
```

#### `start_04`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm
```text
海の上での戦い。不慣れな領域だが、交易路を守るためには誰かが行かなければならない。
```

#### `sail_01`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_field
```text
港で軍船に乗り込んだ。甲板は緊張した船員たちでいっぱいだ。
```

#### `sail_02`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_field
```text
出航。港の灯りが遠ざかり、海だけが広がる。風は穏やかだが、誰も笑わない。
```

#### `sail_03`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_quest_tense
```text
二日目の夜。海面が不気味に凪いだ。水面下に巨大な影が揺らめいている。
```

#### `sail_04`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_quest_tense
```text
突如、空が暗転した。雲が渦を巻き、海が荒れ始める。クラーケンが嵐を呼んでいる——！
```

#### `storm_trap`（hp_damage）
**演出:** bg: bg_marcund_desert, bgm: bgm_quest_tense
**パラメータ:** percent: 10
```text
暴風雨が船を襲う。巨大な波に叩きつけられ、甲板に激突した。
```

#### `storm_02`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_quest_tense
```text
嵐の中、海面から触腕が伸びてきた！ 船体を掴もうとしている。
```

#### `storm_03`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_quest_tense
```text
触腕に引き寄せられた海棲の魔物たちが、甲板に飛び上がってきた——！
```

#### `battle_01`（battle）
**演出:** bg: bg_marcund_desert, bgm: bgm_battle
**パラメータ:** enemy_group_id: 104
```text
海棲魔物たちが甲板に襲来！
```

#### `navigate_01`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_quest_mystery
```text
魔物を退けたが、嵐で方角を見失った。クラーケンの棲む海溝はどこだ。
```

#### `navigate_02`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_quest_mystery
```text
濃い霧が立ち込める。船員たちが「海魔の霧だ」と震えている。
```

#### `fog_nav`（random_branch）
**パラメータ:** prob: 50, next: `nav_success`, fallback: `nav_fail`

#### `nav_success`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_quest_calm
**次ノード:** deep_01
```text
星の位置を頼りに航路を修正した。霧の向こうに、海溝の入口が見えてきた。
```

#### `nav_fail`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_quest_tense
```text
霧に惑わされ、座礁しかけた！ 船底が岩に擦れ、浸水が始まる。
```

#### `nav_fail_trap`（hp_damage）
**演出:** bg: bg_marcund_desert, bgm: bgm_quest_tense
**パラメータ:** percent: 15
```text
浸水を止めるために海中に飛び込んだ。冷たい海水が体温を奪い、四肢が痺れる。
```

#### `nav_fail_02`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_quest_tense
```text
なんとか浸水を塞いだ。体は冷え切ったが、海溝は目の前にある。
```

#### `deep_01`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_quest_mystery
```text
海溝の上に停泊した。海面が泡立ち、深海から禍々しい気配が昇ってくる。
```

#### `deep_02`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_quest_mystery
```text
船の錨を下ろし、潜水の準備をする。船員が魔力の護符で水中呼吸の術を施してくれた。
```

#### `deep_03`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_quest_tense
```text
海中に飛び込んだ。暗い深海が広がる。光は届かず、唯一の灯りは護符の微かな光だけだ。
```

#### `deep_04`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_quest_tense
```text
海溝の壁面に沿って降りる。深くなるほど水圧が増し、体が軋む。
```

#### `deep_05`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_quest_tense
```text
海溝の底に辿り着いた。岩と珊瑚の間に、巨大な洞窟がぽっかりと口を開けている。
```

#### `deep_06`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_battle_boss
```text
洞窟の奥から、無数の触腕が蠢いている。中央に巨大な瞳が一つ——クラーケンの本体だ。
```

#### `kraken_01`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_battle_boss
```text
触腕が一斉に伸びてきた。海底が震え、水流が渦を巻く——！
```

#### `battle_boss`（battle）
**演出:** bg: bg_marcund_desert, bgm: bgm_battle_boss
**パラメータ:** enemy_group_id: 9026
```text
大海の悪夢——クラーケンとの海底決戦！
```

#### `victory_01`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_quest_calm
```text
クラーケンの巨大な瞳が閉じた。触腕が力を失い、海底に沈んでいく。
```

#### `victory_02`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_quest_calm
```text
だがクラーケンはまだ息がある。止めを刺すか、それとも——
```

#### `victory_03`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_quest_calm
```text
この海溝はクラーケンの棲家だ。ここから出さなければ、人間に害はない。追い返すことも可能だ。
```

#### `choice_kraken`（choice）
**演出:** bg: bg_marcund_desert, bgm: bgm_quest_calm
| 選択肢 | next_node |
|---------|-----------|
| 「止めを刺す。再び暴れ出す前に」 | slay_01 |
| 「海溝の奥に追い込む。ここから出るな」 | banish_01 |

#### `slay_01`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_quest_tense
```text
弱った心臓部に最後の一撃を叩き込んだ。クラーケンの体が痙攣し、動きを止めた。
```

#### `slay_02`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_quest_calm
```text
海面に浮上した。空は晴れ、海は凪いでいる。千年の海魔は、海底の墓場に還った。
```

#### `end_success`（end_success）
**演出:** bg: bg_guild
```text
「クラーケン討伐を確認！ 交易海域は再開される。お前の勇気が海を救った」
破格の報酬。だが海底で見たあの巨大な瞳は——忘れられそうにない。
```
**rewards:** Gold:10000, Exp:700, Rep:30, Chaos:10

#### `banish_01`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_quest_calm
```text
護符の光で壁を作り、クラーケンを海溝の最深部に追い込んだ。
```

#### `banish_02`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_quest_calm
```text
海溝の入口を古代の封印術で塞ぐ。クラーケンが暴れるが、封印は持ちこたえた。
```

#### `banish_03`（text）
**演出:** bg: bg_marcund_desert, bgm: bgm_quest_calm
```text
海面に浮上すると、嵐は収まっていた。クラーケンは深海に封じた——少なくとも、当面は。
```

#### `end_success_banish`（end_success）
**演出:** bg: bg_guild
```text
「海魔を封じたか。封印がいつまで持つかは分からんが——交易路は再開できる」
殺さずに済んだ。海の生態系を守った——と信じたい。
```
**rewards:** Gold:6000, Exp:700, Rep:20, Justice:10

#### `end_failure`（end_failure）
**演出:** bg: bg_marcund_desert
```text
触腕に絡めとられ、深海へ引きずり込まれていく。光が遠ざかり、冷たい闇だけが残った。
```

---

## 4. エネミー定義参照

| ID | Slug | name | level | hp | atk | def |
|-----|-----|-----|-----|-----|-----|-----|
| 6026 | `boss_kraken_prime` | クラーケン本体 | 40 | 2200 | 130 | 25 |

**ボスユニークスキル:**
| id | slug | スキル名 | effect_type | value | 説明 |
|----|------|---------|:-----------:|:-----:|------|
| 4016 | `skill_kraken_tentacle` | 触腕絞殺 | damage_bleed | 3 | 出血(3T)付与 |
| 4017 | `skill_kraken_ink` | 墨雲 | damage_blind | 1.5 | 目潰し(3T) |
| 4018 | `skill_kraken_vortex` | 大渦 | damage | 4.5 | 超高威力全体ダメージ |

| グループID | Slug | 用途 |
|-----|-----|-----|
| 104 | `markand_desert_group` | 甲板戦: 海棲魔物 |
| 9026 | `enemy_grp_boss_kraken` | ボス戦 |

---

## 5. CSVエントリ

`quests_special.csv`
```csv
6110,qst_legend_kraken,大海の悪夢 クラーケン,28,6,12,"{""completed_quest"":""main_ep15""}",false,,,冒険者ギルド,[封印指定] 交易海域に巨大な海魔クラーケンが出現し船舶を沈めている。海上決戦に挑め。
```
