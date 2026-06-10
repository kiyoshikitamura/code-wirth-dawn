# クエスト仕様書：7008 — 難民野営地への薬草救援

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7008 |
| **Slug** | `qst_gen_mercy` |
| **クエスト種別** | 一般クエスト（Normal） |
| **推奨レベル** | 2（Easy） |
| **難度** | 2 |
| **依頼主** | 救護団 |
| **出現条件** | 全拠点で出現 |
| **リピート** | リピート可能 |
| **経過日数 (time_cost)** | 4 |
| **ノード数** | 36ノード |
| **ゲストNPC** | なし |
| **難易度Tier** | Easy（rec_level: 2） |
| **サムネイル画像** | /images/quests/bg_ruins_field.png |
---

## 1. クエスト概要
 
### 短文説明
```
[救援] 癒やし草を採取して傷ついた難民の野営地へ届ける。
```

### 長文説明
```
救護団から、戦火を逃れて街外れに設営された難民野営地への支援を懇願された。
物資も薬草も尽きかけ、怪我人や病人が過酷な環境で喘いでいる。
若き修道女エレナと共に森の沢沿いへ向かい、治療に必要な「癒やし草」を五束採取して届けよ。
金目当ての報酬はないが、多くの命があなたの手にかかっている。
```

---

## 2. 報酬定義

```
Gold:10|Rep:10|Justice:10|Order:10
```

---

## 3. シナリオノードフロー

```text
start_prep → start → text_01 → text_02 → meet_01 → meet_02 → meet_03 → meet_04
  → camp_01 → camp_scenery → camp_02 → camp_03 → info_01 → info_02
    → forest_enter → gather_01 → gather_02 → gather_03 → gather_04
      → branch
        ├─ success → gather_ok → deliver
        └─ failure → gather_fail_01 → gather_fail_02 → check
              ├─ success → gather_backup → deliver
              └─ failure → not_enough → not_enough_02 → not_enough_03 → end_failure
      deliver → deliver_02 → deliver_03 → deliver_04 → deliver_pay → deliver_apply → end_success
```

### ノード詳細（36ノード）

#### `start_prep`（text）
**演出:** bg: bg_guild
```text
冒険者ギルドは喧騒に満ちていた。高額な討伐任務の張り紙の陰で、一枚の薄汚れた紙を見つける。
```

#### `start`（text）
**演出:** bg: bg_guild
```text
それは難民野営地からの救援依頼だった。震える手で書かれたような文字が、薬草の調達を必死に懇願していた。
```

#### `text_01`（text）
**演出:** bg: bg_guild
```text
「癒やし草を五束、どうか届けてください」——そう綴られた依頼は、誰にも見向きもされていなかった。
```

#### `text_02`（text）
**演出:** bg: bg_guild
```text
金にならない慈善事業だが、このまま見捨てるのも寝覚めが悪い。依頼書を乱暴に剥ぎ取り、懐へと押し込んだ。
```

#### `meet_01`（text）
**演出:** bg: bg_tavern_day
```text
指定された酒場へ向かう。昼間の店内は荒れており、隅の席で若い修道女が小さく身を縮めていた。
```

#### `meet_02`（text）
**演出:** bg: bg_tavern_day
```text
彼女の白い法衣は泥に汚れ、目の下には濃い隈が刻まれている。限界はもう目前に違いない。
```

#### `meet_03`（text）
**演出:** bg: bg_tavern_day, speaker: シスター・エレナ
```text
「引き受けてくださり感謝します。私はシスター・エレナ。難民の治療を行っています」
```

#### `meet_04`（text）
**演出:** bg: bg_tavern_day, speaker: シスター・エレナ
```text
「怪我人が増え、手持ちの薬草が尽きてしまいました。どうか力を貸してください」
```

#### `camp_01`（text）
**演出:** bg: bg_road_day
```text
彼女に同行し、街外れの難民野営地を訪れた。粗末な布テントが泥濘にいくつも並んでいる。
```

#### `camp_scenery`（text）
**演出:** bg: bg_road_day
```text
そこら中から咳き込む声や呻き声が聞こえる。衛生的とは言えない過酷な環境だった。
```

#### `camp_02`（text）
**演出:** bg: bg_road_day
```text
テントの奥では老人が熱にうなされ、化膿した傷口からは酷い悪臭が立ち上る。
```

#### `camp_03`（text）
**演出:** bg: bg_road_day, speaker: シスター・エレナ
```text
「皆、矢傷や病で苦しんでいます。傷を癒やすための薬草が、どうしても必要なのです」
```

#### `info_01`（text）
**演出:** bg: bg_road_day, speaker: シスター・エレナ
```text
「森の奥、沢沿いの苔むした岩場に白い花を咲かせる薬草です。どうか探してください」
```

#### `info_02`（text）
**演出:** bg: bg_road_day, speaker: シスター・エレナ
```text
「怪我人たちの命を救うため、最低でも五束は持ち帰っていただく必要があります」
```

#### `forest_enter`（text）
**演出:** bg: bg_forest_day
```text
日暮れまでに戻らねば、野営地の者たちは手遅れになる。私たちは急ぎ、薄暗い森へ足を踏み入れた。
```

#### `gather_01`（text）
**演出:** bg: bg_forest_day
```text
木々の隙間を抜け、冷たい水の音が響く沢に辿り着いた。苔むした岩肌に咲く白い花を見つける。
```

#### `gather_02`（text）
**演出:** bg: bg_forest_day
```text
茎を傷つけないよう慎重にナイフで刈り取る。まずは一束目だ。だが、これだけでは足りない。
```

#### `gather_03`（text）
**演出:** bg: bg_forest_day
```text
湿った腐葉土を踏みしめ、周囲を探す。倒木の陰に小さな群生を見つけ、さらに二束を確保することに成功した。
```

#### `gather_04`（text）
**演出:** bg: bg_forest_day
```text
すでに陽が傾き始めている。森の影が徐々に伸びる中、私たちは沢の上流へと捜索範囲を広げていく。
```

#### `branch`（random_branch）
**パラメータ:** next: `gather_ok`, fallback: `gather_fail_01`, prob: 70

#### `gather_ok`（text）
**演出:** bg: bg_forest_day
```text
運良く上流の岩陰に群生が残っていた。四束目、五束目を刈り取り、用意した布で丁寧に包む。
```
**次ノード:** `deliver`

#### `gather_fail_01`（text）
**演出:** bg: bg_forest_day
```text
だが、沢の上流は日照りで乾ききっており、白い花はすべて枯れ果てていた。三束しかない。
```

#### `gather_fail_02`（text）
**演出:** bg: bg_forest_day
```text
手持ちの荷物の中に、以前採取した『癒やし草』が残っていれば補填できるかもしれないが……
```

#### `check`（check_delivery）
**パラメータ:** item_id: `702`, quantity: 5, next: `gather_backup`, fallback: `not_enough`

#### `gather_backup`（text）
**演出:** bg: bg_forest_day
```text
荷袋から古い薬草を取り出し、合わせる。これでなんとか五束分だ。急いで野営地へ戻ろう。
```
**次ノード:** `deliver`

#### `not_enough`（text）
**演出:** bg: bg_forest_day
```text
持ってきた三束だけでは、全員を救う薬としては少なすぎる。だが、持ち帰るしかない。
```

#### `not_enough_02`（text）
**演出:** bg: bg_road_day
```text
野営地に戻り、薬草を差し出す。エレナは受け取ったが、その表情は陰っていた。
```

#### `not_enough_03`（text）
**演出:** bg: bg_road_day, speaker: シスター・エレナ
```text
「ありがとうございます。ですが……これだけでは、救えない命が出てしまいます」
```

#### `end_failure`（end_failure）
**演出:** bg: bg_road_day
```text
薬草が足りず、手当ては不完全に終わった。自分の力不足を呪いながら、野営地を去った。
```

#### `deliver`（text）
**演出:** bg: bg_road_day
```text
夕闇が野営地を包む頃、私たちは戻った。入り口でシスター・エレナが焦燥した顔で待っていた。
```

#### `deliver_02`（text）
**演出:** bg: bg_road_day
```text
五束の薬草を手渡すと、彼女はそれを愛おしそうに胸に抱きしめ、張り詰めていた糸が切れたように息を吐く。
```

#### `deliver_03`（text）
**演出:** bg: bg_road_day, speaker: シスター・エレナ
```text
「よかった……これで薬を作れます。本当に、本当にありがとうございました」
```

#### `deliver_04`（text）
**演出:** bg: bg_road_day, speaker: シスター・エレナ
```text
「これしかお渡しできませんが、どうかお受け取りください」
```

#### `deliver_pay`（text）
**演出:** bg: bg_road_day
```text
彼女の細い手から、数枚の汚れた銅貨を受け取った。これが彼らの全財産なのだろう。
```

#### `deliver_apply`（text）
**演出:** bg: bg_road_day
```text
彼女は休む間もなく、すり鉢で薬草の調合を始めた。手際よく怪我人の手当てに当たっていく。
```

#### `end_success`（end_success）
**演出:** bg: bg_road_day
```text
報酬は銅貨10枚。だが、野営地の呻き声は小さくなった。少しは救いがあったのだろう。
```
**rewards:** Gold:10, Rep:10, Justice:10, Order:10

---

## 4. 特殊ノード仕様

### random_branch（node: branch）
- **成功確率**: 70%
- hit → gather_ok（五束集まる）
- miss → gather_fail_01（三束のみ）

### check_delivery（node: check）
- **対象アイテム**: item_id 702（癒やし草）
- **必要数**: 5
- 所持 → gather_backup → deliver（成功ルート合流）
- 未所持 → not_enough → end_failure
