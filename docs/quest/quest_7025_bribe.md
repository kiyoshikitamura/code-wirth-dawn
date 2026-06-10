# クエスト仕様書：7025 — 敵対軍閥への賄賂裏工作

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7025 |
| **Slug** | `qst_mar_bribe` |
| **クエスト種別** | 一般クエスト（Normal） |
| **推奨レベル** | 5（Normal） |
| **難度** | 2 |
| **依頼主** | 軍閥の密使 |
| **出現条件** | 出現国: マルカンド |
| **リピート** | リピート可能 |
| **経過日数 (time_cost)** | 6 |
| **ノード数** | 30ノード |
| **ゲストNPC** | なし |
| **難易度Tier** | Normal（rec_level: 5） |
| **サムネイル画像** | `/images/quests/bg_desert.png` |
## 1. クエスト概要

### 短文説明
```
[裏工作] 工作資金と宝石を、密かに敵対軍閥の将校へ手渡してこい。
```

### 長文説明
```
マルカンドの軍閥の密使から極秘の依頼を受けた。
敵対する軍閥の将校ハルムに、行商人を装って賄賂の革袋を届ける仕事だ。合言葉は「流砂の果て」。
道中は敵の見張りが巡回しており、怪しまれれば即座に斬りかかられる。
正面から堂々と近づくか、迂回路で潜入するか——選択を誤れば、命はない。
```

## 2. 報酬定義

```
Gold:350|Chaos:10|Exp:100|Rep:-5
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
start → start_desc → intro_1 → intro_1_detail → intro_2 → intro_2_warn → accept_think → disguise
  → travel_desert → travel_scenery → approach_camp → camp_desc → choice_approach
     ├─ 正面から堂々と近づく → front_approach → front_check → front_check_think → battle_militia
     │    ├─ win → forced_entry → forced_entry_desc → find_officer_front → deliver_front → officer_reply
     │    └─ lose → end_failure
     └─ 迂回路で潜入する → sneak_route → sneak_desc → sneak_close → find_officer_sneak → deliver_sneak → officer_reply
  officer_reply → report → end_success
```

### ノード詳細（30ノード）

#### `start`（text）
**演出:** bg: bg_slums, bgm: bgm_quest_tense
```text
マルカンドの荒廃した裏通り。強い砂風の中、周囲を警戒しながら待ち合わせの陰に立つ。
```

#### `start_desc`（text）
**演出:** bg: bg_slums
```text
顔を隠した男が影から現れ、ずっしりと重い皮袋と封印された革の封筒を差し出した。
```

#### `intro_1`（text）
**演出:** bg: bg_slums, speaker: 軍閥の密使
```text
「この革袋を、北のオアシスに駐屯する『隻眼のハルム』将校に届けろ」
```

#### `intro_1_detail`（text）
**演出:** bg: bg_slums, speaker: 軍閥の密使
```text
「合言葉は『流砂の果て』。必ず彼本人にのみ手渡すのだ」
```

#### `intro_2`（text）
**演出:** bg: bg_slums, speaker: 軍閥の密使
```text
「怪しまれれば即座に殺される。荷の底に隠し、行商人に変装して行け」
```

#### `intro_2_warn`（text）
**演出:** bg: bg_slums, speaker: 軍閥の密使
```text
「警告しておくが、中身は決して見るな。死にたくなければな」
```

#### `accept_think`（text）
**演出:** bg: bg_slums
```text
関われば命はない裏工作だ。だが、引き受けた以上、もう後戻りはできない。
```

#### `disguise`（text）
**演出:** bg: bg_slums
```text
用意された薄汚れた行商人の衣装に着替える。荷の底に小袋を隠し、香辛料をまぶした。
```

#### `travel_desert`（text）
**演出:** bg: bg_desert, bgm: bgm_field
```text
北のオアシスへ向けて砂漠を進む。炎天下の強烈な熱風が、肌をジリジリと焦がした。
```

#### `travel_scenery`（text）
**演出:** bg: bg_desert
```text
道中、軍閥の旗印を掲げた騎馬兵とすれ違う。何食わぬ顔で会釈し、嵐が過ぎるのを待つ。
```

#### `approach_camp`（text）
**演出:** bg: bg_mar_warlord, bgm: bgm_quest_tense
```text
三日後、オアシスの手前に敵対軍閥の野営地が見えた。厳しい見張りが巡回している。
```

#### `camp_desc`（text）
**演出:** bg: bg_mar_warlord
```text
正面の柵には武装した兵士が二人。裏手には、険しい岩山へ続く細い獣道がある。
```

#### `choice_approach`（choice）
**演出:** bg: bg_mar_warlord
```text
目の前の野営地へ、どうやって接近する？ 選択が運命を左右する。
```
| 選択肢 | 次ノード |
|--------|---------|
| 正面から堂々と近づく | `front_approach` |
| 迂回路で潜入する | `sneak_route` |

#### `front_approach`（text）
**演出:** bg: bg_mar_warlord
```text
行商人の卑屈な笑みを浮かべ、正面から野営地へと歩み出た。背中に冷たい汗が流れる。
```

#### `front_check`（text）
**演出:** bg: bg_mar_warlord, speaker: 見張り兵
```text
「止まれ、行商人。不審な荷だ、改めさせてもらうぞ」
```

#### `front_check_think`（text）
**演出:** bg: bg_mar_warlord
```text
荷物を手荒にこじ開けられる。このままでは革袋が見つかる。戦うしかない！
```

#### `battle_militia`（battle）
**演出:** bg: bg_mar_warlord, bgm: bgm_battle
| 設定 | 値 |
|-----|-----|
| 敵グループID | `429` |
| 敵表示名 | 軍閥の見張り兵 |

```text
正体を見破った軍閥の見張り兵たちが、武器を抜いて襲いかかってきた！
```

#### `forced_entry`（text）
**演出:** bg: bg_mar_warlord, bgm: bgm_quest_tense
```text
見張りを倒した。騒ぎを聞きつけた他の兵が集まる前に、奥の天幕へ急ぐ。
```

#### `forced_entry_desc`（text）
**演出:** bg: bg_mar_warlord
```text
「曲者だ！ 捕らえろ！」野営地の中に怒号が飛び交い、兵士たちが走り出す。
```

#### `find_officer_front`（text）
**演出:** bg: bg_camp
```text
一番大きな天幕へ突入する。中には、隻眼の男が驚きの表情で立っていた。
```

#### `deliver_front`（text）
**演出:** bg: bg_camp
```text
「『流砂の果て』——」合言葉を囁き、血のついた革袋を男の手へ押しつける。
```
**次ノード:** `officer_reply`

#### `sneak_route`（text）
**演出:** bg: bg_mar_warlord
```text
岩肌に身を隠し、這うようにして裏の獣道を進む。小石一つ落とせない緊張感だ。
```

#### `sneak_desc`（text）
**演出:** bg: bg_mar_warlord
```text
見張りの視線の死角を突き、天幕の裏手へと潜り込む。兵士たちは食事中だった。
```

#### `sneak_close`（text）
**演出:** bg: bg_mar_warlord
```text
旗印が掲げられた将校の天幕を発見した。裏の隙間から中を慎重に覗き込む。
```

#### `find_officer_sneak`（text）
**演出:** bg: bg_camp
```text
音もなく天幕の中へ滑り込む。驚く隻眼の将校に、小声で合言葉を告げた。
```

#### `deliver_sneak`（text）
**演出:** bg: bg_camp
```text
「『流砂の果て』——」革袋を差し出すと、彼は素早くそれを懐に隠した。
```
**次ノード:** `officer_reply`

#### `officer_reply`（text）
**演出:** bg: bg_camp, speaker: ハルム将校
```text
「確かに受け取った。帰りは東の谷を抜けろ。そちらの方が安全だ」
```

#### `report`（text）
**演出:** bg: bg_guild
```text
無事にマルカンドへ戻り、裏通りに待つ密使に工作の成功を報告した。
```

#### `end_success`（end_success）
**演出:** bg: bg_guild
```text
密使から報酬を受け取る。この汚れた金が、新たな戦争を引き起こすのだろう。
```
**rewards:** Gold:350, Chaos:10, Exp:100, Rep:-5

#### `end_failure`（end_failure）
**演出:** bg: bg_desert
```text
周囲を兵士に完全に包囲され、捕縛された。スパイとして地下牢へ幽閉される。
```

---

## 4. 敵定義参照

| enemy_group_id | グループ名 |
|----------------|-----------|
| 429 | 軍閥の見張り兵 |
