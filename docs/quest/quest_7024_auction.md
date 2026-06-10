# クエスト仕様書：7024 — 闇市オークションの用心棒

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7024 |
| **Slug** | `qst_mar_auction` |
| **クエスト種別** | 一般クエスト（Normal） |
| **推奨レベル** | 5（Normal） |
| **難度** | 3 |
| **依頼主** | 闇市の元締め |
| **出現条件** | 出現国: マルカンド / 名声 -50 以下 |
| **リピート** | リピート可能 |
| **経過日数 (time_cost)** | 1 |
| **ノード数** | 30ノード |
| **ゲストNPC** | なし |
| **難易度Tier** | Normal（rec_level: 5） |
| **サムネイル画像** | `/images/quests/bg_slums.png` |
## 1. クエスト概要

### 短文説明
```
[防衛] 違法国宝が取引される闇の競売場で、乱入者を排除する。
```

### 長文説明
```
マルカンドの地下で開かれる闇のオークション。
出品されるのは盗品の国宝、禁制品の薬物、そして名もなき奴隷たち。
元締めはこの一夜の売り上げを守るため、腕の立つ用心棒を雇う。
会場に乱入する者があれば、音を立てずに排除しろ——それが仕事だ。良心の呵責は金で埋めろ。
```

## 2. 報酬定義

```
Gold:500|Chaos:10|Evil:5|Exp:120|Rep:-5
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
start → start_desc → intro_1 → intro_2 → intro_2_warn → auction_declare → wait_outside → wait_outside_think
  → auction_start → auction_item_1 → first_alarm → intruder_1 → intruder_1_talk
    → battle_wave1
       ├─ win → after_wave1 → after_wave1_report → auction_item_2 → second_alarm
       │    → intruder_2_desc → intruder_2_talk → battle_wave2
       │       ├─ win → after_wave2 → after_wave2_think → auction_end → auction_end_desc → payment → payment_02 → exit_slums → end_success
       │       └─ lose → end_failure
       └─ lose → end_failure
```

### ノード詳細（30ノード）

#### `start`（text）
**演出:** bg: bg_slums, bgm: bgm_quest_tense
```text
マルカンドの地下水路の入口。案内の男によって、有無を言わさず目隠しをされた。
```

#### `start_desc`（text）
**演出:** bg: bg_slums
```text
男の手を借りて長い螺旋階段を下りていく。下から、微かに香油の匂いが漂う。
```

#### `intro_1`（text）
**演出:** bg: bg_mar_auction
```text
目隠しを外すと、地下広間に豪華な絨毯が敷かれた即席の競売場が広がっていた。
```

#### `intro_2`（text）
**演出:** bg: bg_mar_auction, speaker: 闇市の元締め
```text
「今夜の客は身分が高いが、厄介なハイエナも引き寄せる。警備を怠るな」
```

#### `intro_2_warn`（text）
**演出:** bg: bg_mar_auction, speaker: 闇市の元締め
```text
「騒ぎを起こす余所者が現れたら、音を立てずに素早く始末するのだ」
```

#### `auction_declare`（text）
**演出:** bg: bg_mar_auction
```text
燭台に火が灯り、開会を告げる真鍮のベルの音が、地下室の冷たい天井に響いた。
```

#### `wait_outside`（text）
**演出:** bg: bg_mar_auction
```text
会場の鉄格子の陰で待機する。壁の向こうから、競りの声と金貨の音が響く。
```

#### `wait_outside_think`（text）
**演出:** bg: bg_mar_auction
```text
法も光も届かない地下。欲望と虚栄が渦巻く、この街らしい退廃の縮図だ。
```

#### `auction_start`（text）
**演出:** bg: bg_mar_auction, bgm: bgm_quest_calm
```text
競売が始まった。最初の出品は、ある名家の墓から暴かれた黄金の王冠だ。
```

#### `auction_item_1`（text）
**演出:** bg: bg_mar_auction
```text
「金貨３００！ ５００！ ８００！」入札の声が、異常な熱気を帯びて響く。
```

#### `first_alarm`（text）
**演出:** bg: bg_mar_auction, bgm: bgm_quest_tense
```text
見張りの一人が青い顔で駆け寄ってきた。水路の奥に侵入者があったという。
```

#### `intruder_1`（text）
**演出:** bg: bg_mar_auction
```text
地下水路の入口。噂を聞きつけた武装した野盗崩れが、扉をこじ開けていた。
```

#### `intruder_1_talk`（text）
**演出:** bg: bg_mar_auction
```text
汚い笑い声を上げながら、野盗たちが鉄の棒を振り回して会場を覗き込む。
```

#### `battle_wave1`（battle）
**演出:** bg: bg_mar_auction, bgm: bgm_battle
| 設定 | 値 |
|-----|-----|
| 敵グループID | `427` |
| 敵表示名 | 乱入者の先遣隊 |

```text
中の金品を狙う無頼漢どもを排除せよ！ 競売の邪魔をさせてはならない！
```

#### `after_wave1`（text）
**演出:** bg: bg_mar_auction, bgm: bgm_quest_calm
```text
野盗を撃退した。死体を暗い水路へ突き落とし、石畳の血痕を砂で素早く隠す。
```

#### `after_wave1_report`（text）
**演出:** bg: bg_mar_auction
```text
会場の扉から元締めが顔を出し、満足げに頷いてから再び奥へ戻っていった。
```

#### `auction_item_2`（text）
**演出:** bg: bg_mar_auction
```text
競売は進行中。次の商品は、王宮で禁止された美しくも恐ろしい秘薬のようだ。
```

#### `second_alarm`（text）
**演出:** bg: bg_mar_auction, bgm: bgm_quest_tense
```text
再び見張りが駆け寄る。今度は震え声だ。「ただの泥棒じゃねえ、手練れだ」
```

#### `intruder_2_desc`（text）
**演出:** bg: bg_mar_auction
```text
暗い水路の壁を這うように、黒装束の集団が音もなく急速に忍び寄ってきた。
```

#### `intruder_2_talk`（text）
**演出:** bg: bg_mar_auction, speaker: 黒装束の男
```text
「邪魔をするな。我々の狙いは元締めの首だけだ。退くなら命は助けてやる」
```

#### `battle_wave2`（battle）
**演出:** bg: bg_mar_auction, bgm: bgm_battle
| 設定 | 値 |
|-----|-----|
| 敵グループID | `428` |
| 敵表示名 | 暗殺者の精鋭 |

```text
元締めの命を狙うプロの暗殺者たちとの、一瞬の油断も許されない死闘だ！
```

#### `after_wave2`（text）
**演出:** bg: bg_mar_auction, bgm: bgm_quest_calm
```text
暗殺者を片付けた。元締めの私兵たちが、素早く死体の痕跡を消していく。
```

#### `after_wave2_think`（text）
**演出:** bg: bg_mar_auction
```text
死を日常の一部として処理する彼らの手際に、不気味な寒気を感じた。
```

#### `auction_end`（text）
**演出:** bg: bg_mar_auction
```text
深夜、競売が静かに幕を閉じる。買い手たちは再び目隠しをされ退出した。
```

#### `auction_end_desc`（text）
**演出:** bg: bg_mar_auction
```text
身分の高そうな客たちは、何事もなかったかのように夜の闇へと消えていく。
```

#### `payment`（text）
**演出:** bg: bg_mar_auction, speaker: 闇市の元締め
```text
「素晴らしい腕前だ。お前のおかげで、今夜の売り上げは最高を記録した」
```

#### `payment_02`（text）
**演出:** bg: bg_mar_auction, speaker: 闇市の元締め
```text
「これは約束の取り分だ。口の堅いお前には、また大仕事を回してやろう」
```

#### `exit_slums`（text）
**演出:** bg: bg_slums
```text
再び案内人に目隠しをされ、地上へ戻される。外された瞳が夜の星を仰いだ。
```

#### `end_success`（end_success）
**演出:** bg: bg_slums
```text
ずっしりと重い金袋を受け取る。この汚れた金が、また次の悲劇を生むのだ。
```
**rewards:** Gold:500, Chaos:10, Evil:5, Exp:120, Rep:-5

#### `end_failure`（end_failure）
**演出:** bg: bg_slums
```text
暗殺者の正確無比な刃の前に倒れる。会場が蹂躙されていくのを眺めながら。
```

---

## 4. 敵定義参照

| enemy_group_id | グループ名 |
|----------------|-----------|
| 427 | 乱入者の先遣隊 |
| 428 | 暗殺者の精鋭 |
