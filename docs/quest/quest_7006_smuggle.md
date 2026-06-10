# クエスト仕様書：7006 — 禁制品の闇ルート輸送

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7006 |
| **Slug** | `qst_gen_smuggle` |
| **クエスト種別** | 一般クエスト（Normal） |
| **推奨レベル** | 2（Easy） |
| **難度** | 2 |
| **依頼主** | 闇商人 |
| **出現条件** | 全拠点で出現 / 名声 -50 以下 |
| **リピート** | リピート可能 |
| **経過日数 (time_cost)** | 8 |
| **ノード数** | 18ノード |
| **ゲストNPC** | なし |
| **難易度Tier** | Easy（rec_level: 2） |
| **サムネイル画像** | /images/quests/bg_ruins_field.png |
---

## 1. クエスト概要
 
### 短文説明
```
[密輸] 中身不明の禁制品を隣街まで運ぶ。追手に注意。
```

### 長文説明
```
闇商人から、検問の厳しい本道を避け、危険な旧道を通って禁制品を隣街の「赤猫亭」まで運ぶよう依頼された。
中身は知らされず、失敗すれば命の保証はないという危険な取引だ。
闇に紛れて進む道中、荷を狙う手慣れた追手たちの追撃が予想される。
良心の呵責と危険に耐え、闇の依頼を完遂せよ。
```

---

## 2. 報酬定義

```
Gold:800|Rep:-5|Evil:5|Chaos:5
```

---

## 3. シナリオノードフロー

```text
start → text_01 → text_02 → text_03 → text_04
  → depart → night_01 → night_02 → night_03
    → encounter_01 → encounter_02
      → battle
        ├─ win → after_01 → after_02 → arrive → arrive_02 → end_success
        └─ lose → end_failure
```

```text
start_prep → start → text_01 → text_02 → text_03 → text_03_warning → text_04 → text_04_think
  → depart → depart_scenery → night_01 → night_01_sound → night_02 → night_03 → night_03_rush
    → encounter_01 → encounter_02 → battle
      ├─ win → after_01 → after_bloodshed → after_02 → after_02_rush
      │    → arrive → arrive_inn_scenery → arrive_02 → arrive_02_accept → return_road
      │      → return_scenery → end_success
      └─ lose → end_failure
```

### ノード詳細（30ノード）

#### `start_prep`（text）
**演出:** bg: bg_slum
```text
スラムの腐ったゴミとドブの臭いが漂う、暗い路地裏。
```

#### `start`（text）
**演出:** bg: bg_slum
```text
黒い外套をまとった闇商人が立っていた。鋭い目が光る。
```

#### `text_01`（text）
**演出:** bg: bg_slum, speaker: 闇商人
```text
「中身を詮索するなよ。この箱を無事に隣街の赤猫亭まで届けてもらいたい」
```

#### `text_02`（text）
**演出:** bg: bg_slum, speaker: 闇商人
```text
「衛兵の検問を避けるため、街道ではなく旧道の山道を通るんだ」
```

#### `text_03`（text）
**演出:** bg: bg_slum, speaker: 闇商人
```text
「厄介な追手がつくかもしれないが、そこはあんたの腕で片付けろ」
```

#### `text_03_warning`（text）
**演出:** bg: bg_slum, speaker: 闇商人
```text
「言っておくが、へまをすればお前も私も消される。……わかるな？」
```

#### `text_04`（text）
**演出:** bg: bg_slum
```text
商人は黒い木箱を押しつけ、影のように闇へ消え去った。
```

#### `text_04_think`（text）
**演出:** bg: bg_slum
```text
ずっしりと重い。隙間から、何かの薬品の臭いが漂う。
```

#### `depart`（text）
**演出:** bg: bg_road_night
```text
人目を避けるように街の裏門を抜け、荒れた旧道へと入る。舗装などされていない獣道を静かに歩んだ。
```

#### `depart_scenery`（text）
**演出:** bg: bg_road_night
```text
月明かりだけが頼りだ。夜の静寂が五感を研ぎ澄ます。
```

#### `night_01`（text）
**演出:** bg: bg_road_night
```text
箱を背負い、足音を殺して進む。草むらの虫の声だけ。
```

#### `night_01_sound`（text）
**演出:** bg: bg_road_night
```text
風が木々を揺らし、木化けのような影が道を覆う。
```

#### `night_02`（text）
**演出:** bg: bg_road_night
```text
道の途中で背後に気配を感じた。闇の中に二つの人影。
```

#### `night_03`（text）
**演出:** bg: bg_road_night
```text
こちらの速度に合わせて追ってくる。手慣れた追跡者だ。
```

#### `night_03_rush`（text）
**演出:** bg: bg_road_night
```text
走って逃げ切ることは難しい。敵を迎撃する覚悟を決める。
```

#### `encounter_01`（text）
**演出:** bg: bg_road_night, speaker: 追手
```text
「止まれ！ その大事そうに抱えている荷物を置いていけ！」
```

#### `encounter_02`（text）
**演出:** bg: bg_road_night
```text
闇の中から、抜き放たれた刃を構えた追手たちが静かに進み出る。もはや逃げ場はない！
```

#### `battle`（battle）
**演出:** bg: bg_road_night, bgm: bgm_battle
| 設定 | 値 |
|-----|-----|
| 敵グループID | `406` |
| 敵表示名 | 追手部隊 |

```text
追手が襲いかかってきた！
```

#### `after_01`（text）
**演出:** bg: bg_road_night
```text
追手を退けた。倒れた敵の息の根を止め、息を整える。
```

#### `after_bloodshed`（text）
**演出:** bg: bg_road_night
```text
荷を確認する。封印は無事だ。中身は漏れ出していない。
```

#### `after_02`（text）
**演出:** bg: bg_road_night
```text
これ以上、この場に留まるのは自殺行為だ。先へ進もう。
```

#### `after_02_rush`（text）
**演出:** bg: bg_road_night
```text
夜霧が立ち込める中、残りの夜道を急ぎ足で駆け抜けた。
```

#### `arrive`（text）
**演出:** bg: bg_tavern_night
```text
夜明け前の冷気が包む頃、ようやく目的の隣街に到着した。裏路地へ回り、赤猫亭の戸を固く叩く。
```

#### `arrive_inn_scenery`（text）
**演出:** bg: bg_tavern_night
```text
きしむ扉の隙間から、鋭い目つきの男が顔を覗かせた。
```

#### `arrive_02`（text）
**演出:** bg: bg_tavern_night
```text
無言の男が木箱を受け取り、代わりに重い革袋を渡す。
```

#### `arrive_02_accept`（text）
**演出:** bg: bg_tavern_night
```text
袋の中で、ぎっしりと詰まった金貨が鈍い音を立てた。
```

#### `return_road`（text）
**演出:** bg: bg_road_night
```text
街の朝靄の中、引き返す。背負い袋の軽さがひどく虚しい。
```

#### `return_scenery`（text）
**演出:** bg: bg_road_night
```text
汚れた手を見て、自分がまた一歩踏み外したことを知る。
```

#### `end_success`（end_success）
**演出:** bg: bg_tavern_night
```text
密輸完了。報酬は多いが、良心の痛みは消えそうにない。
```
**rewards:** Gold:800, Rep:-5, Evil:5, Chaos:5

#### `end_failure`（end_failure）
**演出:** bg: bg_road_night
```text
追手に捕まり、荷物を没収された。このまま生きて帰れるかは自分の運次第だと腹をくくった。
```

---

## 4. 敵定義参照

| enemy_group_id | グループ名 |
|----------------|-----------|
| 406 | 追手部隊 |
