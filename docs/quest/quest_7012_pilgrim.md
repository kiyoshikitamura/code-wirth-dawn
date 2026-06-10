# クエスト仕様書：7012 — 聖地巡礼者の護衛

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7012 |
| **Slug** | `qst_rol_pilgrim` |
| **クエスト種別** | 一般クエスト（Normal） |
| **推奨レベル** | 4（Normal） |
| **難度** | 3 |
| **依頼主** | 教会 |
| **出現条件** | 出現国: ローランド聖王国 |
| **リピート** | リピート可能 |
| **経過日数 (time_cost)** | 10 |
| **ノード数** | 30ノード |
| **ゲストNPC** | なし |
| **難易度Tier** | Normal（rec_level: 4） |
| **サムネイル画像** | `/images/quests/bg_road_day.png` |
## 1. クエスト概要

### 短文説明
```
[護衛] 狂信的な巡礼者を護送する。彼が死ねば報酬はない。
```

### 長文説明
```
教会からの依頼。西の山脈にある古い聖地の祠まで、熱心な巡礼者「アルバート」を護衛する任務。
道中は山賊や魔物が出没する危険地帯だが、アルバートは「神の御加護」を盲信しており、
一切の危険を省みずに歩き続けるという厄介な人物だ。
彼を死なせずに聖地へ届け、無事に祈りを捧げさせることができれば高額な報酬が約束されている。
```

## 2. 報酬定義

```
Gold:700|Chaos:10|Exp:150|Rep:-10
```

## 2.5. 失敗ペナルティ（共通仕様）

| 条件 | ペナルティ |
|------|-----------|
| クエスト失敗（敗北/撤退/ギブアップ） | 名声 -3〜-10（ランダム、現在拠点） |
| バトル敗北（全般） | VIT -1（クエスト/ランダムエンカウント/賞金稼ぎ共通） |
| 経過日数 | クエスト定義の days_failure 値を適用 |

> **護衛失敗（アルバートHP=0）:** 即座にクエスト失敗（`end_failure`）へ遷移。

## 3. シナリオノード構成

### 全体フロー

```text
start → start_desc → intro_1 → intro_2 → join_albert
  → travel_scenery → travel_think → mountain_road → albert_walk → warning → ambush → ambush_desc
    → bandit_threat → albert_ignore → albert_ignore_2
      → battle_wave1
         ├─ win → after_battle_1 → deeper_mountain → deeper_mountain_think → encounter_wave2
         │    → battle_wave2
         │       ├─ win → after_battle_2 → albert_praise → sigh
         │       │    → arrive_shrine → albert_pray → albert_thanks
         │       │      → leave_albert → end_success
         │       └─ lose → end_failure
         └─ lose → end_failure
```

### ノード詳細（30ノード）

#### `start`（text）
**演出:** bg: bg_church, bgm: bgm_quest_calm
```text
大聖堂の門前。粗末な法衣を纏い、首から巨大な木製十字架を下げた男が立っていた。
```

#### `start_desc`（text）
**演出:** bg: bg_church
```text
彼の目は不自然にギラつき、行き交う人々は彼を狂人を見るかのように避けていく。
```

#### `intro_1`（text）
**演出:** bg: bg_church, speaker: 巡礼者アルバート
```text
「あなたが今回の護衛ですか。主神の啓示がありました。西の危険な谷の祠へ行かねばならんのです」
```

#### `intro_2`（text）
**演出:** bg: bg_church, speaker: 巡礼者アルバート
```text
「あなたが私の肉の盾となるのも、すべては神の尊き御意志。さあ、直ちに出発しましょう」
```

#### `join_albert`（guest_join）
**演出:** bg: bg_road_day
**パラメータ:** guest_id: `npc_pilgrim_albert`, is_escort_target: true
```text
こちらの返事も待たず、彼は歩き出す。彼が死ねば報酬はゼロ。厄介な旅の始まりだ。
```

#### `travel_scenery`（text）
**演出:** bg: bg_road_day, bgm: bgm_field
```text
それから数日間の道中、彼は食事や休息の勧めに一切耳を貸そうとせず、ただ前だけを見つめて歩き続けた。
```

#### `travel_think`（text）
**演出:** bg: bg_road_day
```text
ただでさえ危険な旅路だ。護衛というより、嵐の跡を追いかけているような気分になる。
```

#### `mountain_road`（text）
**演出:** bg: bg_mountain
```text
やがて、切り立った崖が続く峻険な山道に入った。道幅は人一人が通れる程度に狭い。
```

#### `albert_walk`（text）
**演出:** bg: bg_mountain, speaker: 巡礼者アルバート
```text
「おお……これぞ主が与えし苦難の道。私の足の痛みが、深き信仰の証となるのです」
```

#### `warning`（text）
**演出:** bg: bg_mountain
```text
彼は足元の千尋の谷も見ず、祈りを口ずさみ進む。だが、頭上の岩陰に人影が見えた。
```

#### `ambush`（text）
**演出:** bg: bg_mountain, bgm: bgm_quest_tense
```text
「そこまでだ、巡礼者さんよ」
```

#### `ambush_desc`（text）
**演出:** bg: bg_mountain
```text
頭上の岩場から、弓を構えた汚い身なりの男たちが顔を出した。退路は塞がれている。
```

#### `bandit_threat`（text）
**演出:** bg: bg_mountain, speaker: 山賊の頭
```text
「命が惜しければ、教会から支給された旅費をすべて置いていってもらおうか」
```

#### `albert_ignore`（text）
**演出:** bg: bg_mountain, speaker: 巡礼者アルバート
```text
「……（虚ろな目で宙を見つめ、ひたすらぶつぶつと祈りの言葉を唱えている）」
```

#### `albert_ignore_2`（text）
**演出:** bg: bg_mountain
```text
アルバートは足を止めることなく、山賊の警告を完全に無視して歩みを進める。その態度に、山賊たちは激昂し、殺気立つ！
```

#### `battle_wave1`（battle）
**演出:** bg: bg_mountain, bgm: bgm_battle
| 設定 | 値 |
|-----|-----|
| 敵グループID | `414` |
| 敵表示名 | 山賊の先遣隊 |

```text
激怒した山賊の先遣隊が襲いかかってきた！ 頑固な巡礼者を死守しなければならない！
```

#### `after_battle_1`（text）
**演出:** bg: bg_mountain, bgm: bgm_quest_calm
```text
先遣隊を片付けた。しかし、谷の奥から更なる野盗の怒号と靴音が近づいてくる。
```

#### `deeper_mountain`（text）
**演出:** bg: bg_mountain, bgm: bgm_quest_tense
```text
アルバートは戦闘など最初から眼中にないかのように、無傷のままで山奥へとどんどん進んでいく。
```

#### `deeper_mountain_think`（text）
**演出:** bg: bg_mountain
```text
慌てて彼を追いかけたが、行く手の峠道に、重武装の用心棒たちが立ち塞がった。
```

#### `encounter_wave2`（text）
**演出:** bg: bg_mountain, speaker: 山賊の用心棒
```text
「先ほどの連中をやったな……！ ここを通る奴は、一人残らず命を置いていけ！」
```

#### `battle_wave2`（battle）
**演出:** bg: bg_mountain, bgm: bgm_battle
| 設定 | 値 |
|-----|-----|
| 敵グループID | `415` |
| 敵表示名 | 山賊の精鋭 |

```text
山賊の精鋭が襲いかかる！ 頑固な巡礼者が牙にかかる前に、敵を殲滅せよ！
```

#### `after_battle_2`（text）
**演出:** bg: bg_mountain, bgm: bgm_quest_calm
```text
残党を倒した。アルバートを確認する。彼は煤にまみれつつも、やはり無傷だった。
```

#### `albert_praise`（text）
**演出:** bg: bg_mountain, speaker: 巡礼者アルバート
```text
「神の御加護が、またしても悪しき者を滅ぼした。主よ、感謝いたします」
```

#### `sigh`（text）
**演出:** bg: bg_mountain
```text
戦いたのはこちらだが、狂人に理屈は通じない。深いため息をつき、彼の背を追った。
```

#### `arrive_shrine`（text）
**演出:** bg: bg_shrine
```text
険しい山道を乗り越え、ついに目的の祠へと辿り着いた。風雨に晒され苔むした、小さな古い石造りの祠だ。
```

#### `albert_pray`（text）
**演出:** bg: bg_shrine
```text
アルバートは祠の前に跪き、額を土につけて長い祈りを始めた。夜が近づいていく。
```

#### `albert_thanks`（text）
**演出:** bg: bg_shrine, speaker: 巡礼者アルバート
```text
「よくぞ私をここまで運んだ。神の意思を実現する手足として、見事な働きです」
```

#### `leave_albert`（leave）
**演出:** bg: bg_shrine
**パラメータ:** guest_id: `npc_pilgrim_albert`
```text
少しは感謝されたのだろうか。祈り続ける彼を祠に残し、私は帰路に就いた。
```

#### `end_success`（end_success）
**演出:** bg: bg_guild
```text
教会に戻り、報酬を受け取った。あの哀れな男は、今も山奥で祈り続けているのだろうか。
```
**rewards:** Gold:700, Chaos:10, Exp:150, Rep:-10

#### `end_failure`（end_failure）
**演出:** bg: bg_mountain
```text
守りきれず、山賊の刃がアルバートを貫いた。神の加護は、彼に届かなかったのだ。
```

---

## 4. NPC定義：アルバート

| ID | 4105 |
|-----|-----|
| Slug | `npc_pilgrim_albert` |
| 名前 | アルバート |

---

## 5. 敵定義参照

| enemy_group_id | グループ名 |
|----------------|-----------|
| 414 | 山賊の先遣隊 |
| 415 | 山賊の精鋭 |
