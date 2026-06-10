# クエスト仕様書：7002 — 放浪商人の護衛

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7002 |
| **Slug** | `qst_gen_escort` |
| **クエスト種別** | 一般クエスト（Normal） |
| **推奨レベル** | 2（Easy） |
| **難度** | 2 |
| **依頼主** | 旅商人組合 |
| **出現条件** | 全拠点で出現 |
| **リピート** | リピート可能 |
| **経過日数 (time_cost)** | 8 |
| **ノード数** | 25ノード |
| **ゲストNPC** | なし |
| **難易度Tier** | Easy（rec_level: 2） |
| **サムネイル画像** | `/images/quests/bg_road_day.png` |
---

## 1. クエスト概要
 
### 短文説明
```
[護衛] 旅の商人を隣街まで護衛する。商人が倒れれば失敗。
```

### 長文説明
```
旅商人組合から、隣街へ向かう行商人マルコの護衛を依頼された。
積み荷は高価な薬品や雑貨であり、街道に出没する追い剥ぎの格好の標的となっている。
前月には別の護衛が殺害されており、マルコ自身も酷く怯えている。
隣街までの往復八日、彼の命と荷車を守り抜くことが任務だ。
```

---

## 2. 報酬定義

```
Gold:350|Rep:3
```

---

## 2.5. 失敗ペナルティ

| 条件 | ペナルティ |
|------|-----------|
| クエスト失敗 | 名声 -3〜-10 |
| バトル敗北 | VIT -1 |
| 経過日数 | days_failure: 8 |

---

## 3. シナリオノードフロー

```text
start_prep → start → text_01 → text_02 → text_03 → text_03_warning
  → meet_01 → meet_look → meet_02 → meet_03 → meet_chk
    → join(guest_join: npc_gen_merchant)
      → travel_01 → travel_01_road → travel_02 → travel_03 → travel_04
        → travel_05 → travel_05_think → midway → encounter_alert
          → encounter_01 → encounter_02 → battle
            ├─ win → after_01 → after_01_look → after_02 → after_02_rest
            │    → arrive_01 → arrive_inn_look → arrive_02 → arrive_03
            │      → leave → return_scenery → return_scenery_2 → end_success
            └─ lose → end_failure
```

### ノード詳細（37ノード）

#### `start_prep`（text）
**演出:** bg: bg_guild
```text
旅商人組合の窓口。香辛料と生革の匂いが狭い部屋に満ちている。
```

#### `start`（text）
**演出:** bg: bg_guild
```text
埃っぽい木製のカウンター越しに、羊皮紙の依頼書を受け取った。
```

#### `text_01`（text）
**演出:** bg: bg_guild, speaker: 旅商人組合の受付
```text
「護衛対象は行商人のマルコ。隣街まで往復八日の旅だ」
```

#### `text_02`（text）
**演出:** bg: bg_guild, speaker: 旅商人組合の受付
```text
「積み荷は雑貨と薬品。狙われやすい品ばかりだな」
```

#### `text_03`（text）
**演出:** bg: bg_guild, speaker: 旅商人組合の受付
```text
「先月、同じ路線で護衛二名が殺された。気を抜くなよ」
```

#### `text_03_warning`（text）
**演出:** bg: bg_guild, speaker: 旅商人組合の受付
```text
「依頼料が他より跳ね上がっているのはそういうわけだ。せいぜい生きて戻ることだけを考えろよ」
```

#### `meet_01`（text）
**演出:** bg: bg_tavern_day
```text
酒場の片隅。山積みの麻袋と木箱の影に、小柄な中年男がいた。
```

#### `meet_look`（text）
**演出:** bg: bg_tavern_day
```text
男は擦り切れた外套を羽織り、絶えず周囲を気にしている。
```

#### `meet_02`（text）
**演出:** bg: bg_tavern_day, speaker: マルコ
```text
「あんたが今回の護衛かい？ ありがてえ、よろしく頼むよ……マルコだ」
```

#### `meet_03`（text）
**演出:** bg: bg_tavern_day
```text
握った手は冷たく汗ばんでいた。どこか落ち着きがない。
```

#### `meet_chk`（text）
**演出:** bg: bg_tavern_day
```text
挨拶もそこそこに、荷車の車輪を点検する。油は差されているが、軋む重い音が響いた。
```

#### `join`（guest_join）
**演出:** bg: bg_tavern_day
| guest_id | is_escort_target |
|---|---|
| `npc_gen_merchant` | false |

```text
マルコがパーティに加わった。
```

#### `travel_01`（text）
**演出:** bg: bg_road_day
```text
重い石門をくぐり、荒涼とした街道へ足を踏み入れる。だが、マルコの足取りは酷く遅い。
```

#### `travel_01_road`（text）
**演出:** bg: bg_road_day
```text
周囲を見渡すと遮るもののない平原が広がり、乾燥した風が錆びた車輪を鳴らしていた。
```

#### `travel_02`（text）
**演出:** bg: bg_road_day
```text
やがて陽が傾き、空が鈍い血の色に染まる頃、彼が囁いた。
```

#### `travel_03`（text）
**演出:** bg: bg_road_day, speaker: マルコ
```text
「実はな……荷の中に、少しだけ"特別な品"が混ざっているんだ」
```

#### `travel_04`（text）
**演出:** bg: bg_road_day, speaker: マルコ
```text
「もし追い剥ぎに目をつけられたら、面倒なことになるかもしれねえ」
```

#### `travel_05`（text）
**演出:** bg: bg_road_day
```text
男の怯えた目が、固く縛られた木箱の隙間に向けられている。
```

#### `travel_05_think`（text）
**演出:** bg: bg_road_day
```text
中身は詮索しない。それが冒険者としての護身の知恵だ。
```

#### `midway`（text）
**演出:** bg: bg_road_day
```text
街道が崖の影に折れ曲がる場所で、林の向こうから黒い煙が立ち上るのが見えた。
```

#### `encounter_alert`（text）
**演出:** bg: bg_road_day
```text
鳥の羽ばたきが唐突に途絶える。マルコは短く息を呑み、荷車の影へと身を隠した。
```

#### `encounter_01`（text）
**演出:** bg: bg_road_day
```text
『動くな！ 荷を置いていけ！』茂みの奥から、ギラついた目の男たちが立ち塞がる！
```

#### `encounter_02`（text）
**演出:** bg: bg_road_day, speaker: マルコ
```text
「ひっ、旦那ッ！ 荷物だけは、荷物だけは何としても守ってくれ！」
```

#### `battle`（battle）
**演出:** bg: bg_road_day, bgm: bgm_battle
| 設定 | 値 |
|-----|-----|
| 敵グループID | `400` |
| 敵表示名 | 追い剥ぎ一味 |

```text
夜盗が襲いかかってきた！
```

#### `after_01`（text）
**演出:** bg: bg_road_day
```text
激しい剣戟の末、夜盗どもを蹴散らした。地面には赤黒い血だまりが広がっていく。
```

#### `after_01_look`（text）
**演出:** bg: bg_road_day
```text
マルコは荷車の陰から怯えながら這い出し、荷を結ぶロープの無事を確認した。
```

#### `after_02`（text）
**演出:** bg: bg_road_day, speaker: マルコ
```text
「……全部無事だ。あんた、本当に腕の立つ冒険者なんだな…」
```

#### `after_02_rest`（text）
**演出:** bg: bg_road_day
```text
息を整える。血の匂いに誘われて魔物が来る前に、先を急ごう。
```

#### `arrive_01`（text）
**演出:** bg: bg_tavern_day
```text
隣街の煤けた酒場に到着。マルコは手早く荷物を降ろし始めた。
```

#### `arrive_inn_look`（text）
**演出:** bg: bg_tavern_day
```text
奥の部屋から現れたガタイのいい男たちに、木箱が手渡される。
```

#### `arrive_02`（text）
**演出:** bg: bg_tavern_day
```text
引き渡しを終えたマルコが、安堵の表情で銀貨の袋を差し出す。
```

#### `arrive_03`（text）
**演出:** bg: bg_tavern_day, speaker: マルコ
```text
「約束通り、あの"特別な品"については他所で口外しないでくれよ？」
```

#### `leave`（leave）
**演出:** bg: bg_tavern_day
| guest_id |
|---|
| `npc_gen_merchant` |

```text
マルコがパーティから離れた。
```

#### `return_scenery`（text）
**演出:** bg: bg_road_day
```text
帰路は一人。重荷を降ろした街道は、往路より広く感じられた。
```

#### `return_scenery_2`（text）
**演出:** bg: bg_road_day
```text
夕闇が荒野を飲み込んでいく。急ぎ足で自分の街へと向かった。
```

#### `end_success`（end_success）
**演出:** bg: bg_guild
```text
護衛任務完了。"特別な品"とマルコの安堵の表情を思い出したが、詳しく考えないようにした。
```
**rewards:** Gold:350, Rep:3

#### `end_failure`（end_failure）
**演出:** bg: bg_guild
```text
マルコが倒れた。荷物は夜盗に奪われ、全てを失った。
```

---

## 4. 敵定義参照

| 項目 | 値 |
|-----|-----|
| enemy_group_id | 400 |
| グループ名 | 追い剥ぎ一味 |

---

## 5. ゲストNPC参照

| 項目 | 値 |
|-----|-----|
| guest_id | npc_gen_merchant |
| 名前 | 旅の商人（マルコ） |
| HP | 30 |
| ATK | 1 |
| 備考 | 戦闘外。護衛対象ではない（is_escort_target: false） |
