# クエスト仕様書：7013 — 遺体安置所の亡者討伐

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7013 |
| **Slug** | `qst_rol_undead` |
| **クエスト種別** | 一般クエスト（Normal） |
| **推奨レベル** | 4（Normal） |
| **難度** | 3 |
| **依頼主** | 聖騎士団 |
| **出現条件** | 出現国: ローランド聖王国 |
| **リピート** | リピート可能 |
| **経過日数 (time_cost)** | 2 |
| **ノード数** | 31ノード |
| **ゲストNPC** | なし |
| **難易度Tier** | Normal（rec_level: 4） |
| **サムネイル画像** | `/images/quests/bg_crypt.png` |
## 1. クエスト概要

### 短文説明
```
[討伐] 瘴気によって動き出した腐乱死体たちを土へと還す。
```

### 長文説明
```
聖騎士団からの緊急依頼。王都の地下にある教区の共同墓地（遺体安置所）で、
死体が瘴気に当てられてアンデッド化し、徘徊している。
このままでは地上に被害が出るため、安置所は現在封鎖されている。
内部へ潜入し、動く死体たちを物理的に「昇天」させ、元凶となっている瘴気の源を絶つ必要がある。
閉鎖空間での3連戦に備えよ。
```

## 2. 報酬定義

```
Gold:450|Order:10|Exp:100|Rep:15
```

## 2.5. 失敗ペナルティ（共通仕様）

| 条件 | ペナルティ |
|------|-----------|
| クエスト失敗（敗北/撤退/ギブアップ） | 名声 -3〜-10（ランダム、現在拠点） |
| バトル敗北（全般） | VIT -1（クエスト/ランダムエンカウント/賞金稼ぎ共通） |
| 経過日数 | クエスト定義の days_failure 値を適用 |

## 3. シナリオノード構成

### 全体フロー

```text
start → start_desc → intro_1 → intro_2 → enter_crypt → enter_crypt_desc → crypt_desc
  → encounter_wave1 → battle_wave1
     ├─ win → after_wave1 → after_wave1_think → deeper → deeper_scenery → encounter_wave2
     │    → battle_wave2
     │       ├─ win → after_wave2 → after_wave2_think → find_altar → boss_desc → encounter_wave3
     │       │    → battle_wave3
     │       │       ├─ win → after_wave3 → destroy_stone → destroy_stone_desc → purge_done → purge_think
     │       │       │    → report → knight_thanks → knight_thanks_02 → end_success
     │       │       └─ lose → end_failure
     │       └─ lose → end_failure
     └─ lose → end_failure
```

### ノード詳細（31ノード）

#### `start`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm
```text
聖騎士団の詰め所に呼ばれた。室内には戦況報告の羊皮紙が乱雑に散らばっている。
```

#### `start_desc`（text）
**演出:** bg: bg_guild
```text
担当の騎士が、血の跡が残る古い教区墓地の地図を机の上に広げた。
```

#### `intro_1`（text）
**演出:** bg: bg_guild, speaker: 担当の騎士
```text
「教区の共同墓地で異常事態だ。死体が突如として動き出し、警備の衛兵たちを襲った」
```

#### `intro_2`（text）
**演出:** bg: bg_guild, speaker: 担当の騎士
```text
「直ちに内部へ突入し、奴らを物理的に破壊して土へ還してくれ。発生源の瘴気を絶つんだ」
```

#### `enter_crypt`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
閉鎖された遺体安置所の重い鉄扉を開ける。錆びた蝶番が悲鳴を上げた。
```

#### `enter_crypt_desc`（text）
**演出:** bg: bg_crypt
```text
地下へ続く石段を一歩降りるたび、這い上がるような冷気と腐敗臭が強くなる。
```

#### `crypt_desc`（text）
**演出:** bg: bg_crypt
```text
壁の棺はことごとく破壊され、中身はもぬけの殻。暗闇の奥からは、濡れた足音が近づいてきた。
```

#### `encounter_wave1`（text）
**演出:** bg: bg_crypt
```text
松明を掲げると、通路を塞ぐ骸骨やゾンビ、幽鬼の姿が赤く浮かび上がった。
```

#### `battle_wave1`（battle）
**演出:** bg: bg_crypt, bgm: bgm_battle
| 設定 | 値 |
|-----|-----|
| 敵グループID | `413` |
| 敵表示名 | 混成亡者 |

```text
生者の熱を感知した亡者の群れが一斉に襲いかかってきた！ 武器を構えろ！
```

#### `after_wave1`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
最初の群れを切り伏せた。床には骸骨の破片と、焦げた腐肉が散乱している。
```

#### `after_wave1_think`（text）
**演出:** bg: bg_crypt
```text
だが、まだ戦いは終わりではない。さらに濃い瘴気が、地下の暗闇の奥から絶え間なく流れ出ていた。
```

#### `deeper`（text）
**演出:** bg: bg_crypt
```text
私たちは武器の血糊を拭い、さらに深部へと歩みを進める。床は黒く濡れ、壁には不気味な菌糸が這っていた。
```

#### `deeper_scenery`（text）
**演出:** bg: bg_crypt
```text
まるで巨大な獣の胎内に入り込んでしまったかのような、異様な圧迫感だ。
```

#### `encounter_wave2`（text）
**演出:** bg: bg_crypt
```text
通路の角から青白い光が漏れる。次の瞬間、半透明のレイスが壁を抜けて突如として現れた！
```

#### `battle_wave2`（battle）
**演出:** bg: bg_crypt, bgm: bgm_battle
| 設定 | 値 |
|-----|-----|
| 敵グループID | `416` |
| 敵表示名 | レイスの群れ |

```text
氷のような冷気を纏うレイスの群れが、私たちの魂を刈り取りに迫る！
```

#### `after_wave2`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
レイスを消滅させたが、凍えるような寒気が体に残り、呼吸が白く染まる。
```

#### `after_wave2_think`（text）
**演出:** bg: bg_crypt
```text
体の芯から体力を激しく削られていく。それでも、瘴気の源はすでに目と鼻の先だった。
```

#### `find_altar`（text）
**演出:** bg: bg_crypt
```text
冷たい手触りの霧を掻き分け、ついに最奥の礼拝堂に辿り着いた。そこには黒く拍動する異様な石が、朽ち果てた祭壇の上に置かれていた。
```

#### `boss_desc`（text）
**演出:** bg: bg_crypt
```text
石が放つ瘴気のせいで、空間全体が歪んでいる。石の周囲には光が渦巻く。
```

#### `encounter_wave3`（text）
**演出:** bg: bg_crypt
```text
守護者たるレイスの大群が、私たちの存在を排除すべく一斉に牙を剥いた。
```

#### `battle_wave3`（battle）
**演出:** bg: bg_crypt, bgm: bgm_battle_boss
| 設定 | 値 |
|-----|-----|
| 敵グループID | `417` |
| 敵表示名 | 大量のレイス |

```text
瘴気の中心地での戦い。 渦巻く霊体たちをすべて切り払え！
```

#### `after_wave3`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_calm
```text
最後のレイスが叫びと共に霧散し、静寂が戻る。残るは祭壇の黒い石のみ。
```

#### `destroy_stone`（text）
**演出:** bg: bg_crypt
```text
全身の力を込めて武器を振り下ろし、拍動する黒い石を真っ二つに叩き割る。
```

#### `destroy_stone_desc`（text）
**演出:** bg: bg_crypt
```text
甲高い破砕音と共に、部屋を満たしていた紫の瘴気が一気に薄れて消えた。
```

#### `purge_done`（text）
**演出:** bg: bg_crypt
```text
空気が清浄に戻っていく。これで新たなアンデッドが生まれることはない。
```

#### `purge_think`（text）
**演出:** bg: bg_crypt
```text
だが、なぜ共同墓地にこのような呪具が？ 人為的な陰謀の影を感じる。
```

#### `report`（text）
**演出:** bg: bg_guild
```text
重苦しい泥と血の臭いを身に纏い、騎士団の詰め所へ帰還を報告した。
```

#### `knight_thanks`（text）
**演出:** bg: bg_guild, speaker: 担当の騎士
```text
「実に見事な仕事だ。この禍々しい石は、秩序を揺るがす異端の呪具に違いない」
```

#### `knight_thanks_02`（text）
**演出:** bg: bg_guild, speaker: 担当の騎士
```text
「背後関係は我らが調査しよう。約束の報酬だ。受け取ってくれ」
```

#### `end_success`（end_success）
**演出:** bg: bg_guild
```text
報酬の金貨を掴む。地下の嫌な冷気は、まだ指先に残ったままだった。
```
**rewards:** Gold:450, Order:10, Exp:100, Rep:15

#### `end_failure`（end_failure）
**演出:** bg: bg_crypt
```text
無数の亡者に引きずり下ろされ、意識が薄れる。私もこの闇の一部となる。
```

---

## 4. 敵定義参照

| enemy_group_id | グループ名 |
|----------------|-----------|
| 413 | 混成亡者 |
| 416 | レイスの群れ |
| 417 | 大量のレイス |
