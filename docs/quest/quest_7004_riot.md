# クエスト仕様書：7004 — 食料暴動の事前鎮圧

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7004 |
| **Slug** | `qst_gen_riot` |
| **クエスト種別** | 一般クエスト（Normal） |
| **推奨レベル** | 2（Easy） |
| **難度** | 2 |
| **依頼主** | 自治会 |
| **出現条件** | 全拠点で出現 |
| **リピート** | リピート可能 |
| **経過日数 (time_cost)** | 1 |
| **ノード数** | 18ノード |
| **ゲストNPC** | なし |
| **難易度Tier** | Easy（rec_level: 2） |
| **サムネイル画像** | /images/quests/bg_ruins_field.png |
---

## 1. クエスト概要
 
### 短文説明
```
[鎮圧] 暴動を企てる飢えた市民を力でねじ伏せる。
```

### 長文説明
```
自治会から、凶作により食い詰めた東区画の農民たちの暴動を事前に鎮圧するよう依頼された。
彼らは飢えに苦しみ、備蓄倉庫を襲撃する計画を立てているという。
自治会事務官は「なるべく殺さずに秩序を保て」と冷淡に指示する。
生活のために立ち上がった飢えた市民たちを、力でねじ伏せる非情な任務だ。
```

---

## 2. 報酬定義

```
Gold:200|Rep:5|Order:5|Justice:5
```

---

## 3. シナリオノードフロー

```text
start → text_01 → text_02 → text_03 → text_04
  → square_01 → square_02 → square_03
    → confront_01 → confront_02 → confront_03
      → battle
        ├─ win → after_01 → after_02 → after_03 → after_04 → end_success
        └─ lose → end_failure
```

```text
start_prep → start → text_01 → text_02 → text_03 → text_04 → text_04_think
  → square_road → square_01 → square_scenery → square_02 → square_03
    → square_mood → square_04_think → confront_01 → confront_look
      → confront_02 → confront_03 → confront_shout → battle
        ├─ win → after_01 → after_bloodshed → after_02 → after_03 → after_04
        │    → after_silent → return_office → return_scenery → end_success
        └─ lose → end_failure
```

### ノード詳細（30ノード）

#### `start_prep`（text）
**演出:** bg: bg_office
```text
石造りの重苦しい自治会事務所。暖炉の煤が天井を黒く汚している。
```

#### `start`（text）
**演出:** bg: bg_office
```text
自治会の事務所に呼ばれた。閉め切った窓の外から怒声が響く。
```

#### `text_01`（text）
**演出:** bg: bg_office, speaker: 自治会事務官
```text
「東区画の広場に、腹を空かせた市民どもが集結し始めている」
```

#### `text_02`（text）
**演出:** bg: bg_office, speaker: 自治会事務官
```text
「放っておけば確実に大規模な暴動へと発展する。ただちに鎮圧してもらいたい」
```

#### `text_03`（text）
**演出:** bg: bg_office, speaker: 自治会事務官
```text
「首謀者は先月の凶作で食い詰めた農民どもだ。備蓄倉庫を襲撃する計画を立てているらしい」
```

#### `text_04`（text）
**演出:** bg: bg_office, speaker: 自治会事務官
```text
「暴動を許せば街の秩序が崩壊する。ただし、余計な反発を避けるためにも、なるべく殺さずにね」
```

#### `text_04_think`（text）
**演出:** bg: bg_office
```text
「なるべく殺さずに」。冷たい官僚の言い回しに胸が痛む。
```

#### `square_road`（text）
**演出:** bg: bg_slum
```text
裏通りをすり抜けて進む。物乞いさえ消えたスラムは、不気味なほどに静まり返っていた。
```

#### `square_01`（text）
**演出:** bg: bg_slum
```text
だが、角を曲がって東区画の広場に入った途端、ぼろ切れを纏った市民たちの怒号が耳を刺す。
```

#### `square_scenery`（text）
**演出:** bg: bg_slum
```text
空気は澱み、熱気の中に酸っぱいゴミの臭いが混じっていた。
```

#### `square_02`（text）
**演出:** bg: bg_slum
```text
子供を抱えた女、杖にすがる老人。錆びた鎌を握る若い男。
```

#### `square_03`（text）
**演出:** bg: bg_slum, speaker: 暴徒のリーダー
```text
「俺たちは飢えてるんだ！ 倉庫を開けろ！」
```

#### `square_mood`（text）
**演出:** bg: bg_slum
```text
男の叫びに応え、人々が手に持った棒切れを突き上げる。
```

#### `square_04_think`（text）
**演出:** bg: bg_slum
```text
彼らを力で抑えることが、本当にこの街の「秩序」なのか。
```

#### `confront_01`（text）
**演出:** bg: bg_slum
```text
群衆の前にゆっくりと立ちはだかった。一瞬、静寂が訪れる。
```

#### `confront_look`（text）
**演出:** bg: bg_slum
```text
武器を抜く私を睨みつけ、人々の目に恐怖と剥き出しの憎悪が浮かんだ。
```

#### `confront_02`（text）
**演出:** bg: bg_slum, speaker: 暴徒のリーダー
```text
「自治会の犬か……飢えた子供を守ってるだけだ」
```

#### `confront_03`（text）
**演出:** bg: bg_slum
```text
群衆が殺気立つ。錆びた農具を握る手が小刻みに震えていた。
```

#### `confront_shout`（text）
**演出:** bg: bg_slum, speaker: 暴徒のリーダー
```text
「邪魔するなら容赦はしねえ！ 叩き出せ！」
```

#### `battle`（battle）
**演出:** bg: bg_slum, bgm: bgm_battle
| 設定 | 値 |
|-----|-----|
| 敵グループID | `404` |
| 敵表示名 | 飢えた市民たち |

```text
暴動が始まった！
```

#### `after_01`（text）
**演出:** bg: bg_slum
```text
暴徒を鎮圧した。地面に倒れ、うずくまる市民たちの呻き声。
```

#### `after_bloodshed`（text）
**演出:** bg: bg_slum
```text
折れた木棒と農具が散らばる。流れた血は赤黒く土に染みる。
```

#### `after_02`（text）
**演出:** bg: bg_slum
```text
リーダーの男が額から血を流しながら、こちらを見上げた。
```

#### `after_03`（text）
**演出:** bg: bg_slum, speaker: 暴徒のリーダー
```text
「…俺たちが悪いんじゃねえ…飢えさせた奴らが悪いんだっ！」
```

#### `after_04`（text）
**演出:** bg: bg_slum
```text
重装備の衛兵たちが到着し、泣き叫ぶ群衆を強引に解散させた。
```

#### `after_silent`（text）
**演出:** bg: bg_slum
```text
誰もいなくなった広場に、千切れた子供の靴だけが残る。
```

#### `return_office`（text）
**演出:** bg: bg_office
```text
冷たい静寂が降り積もる東区画を後にし、私たちは自治会事務所へと足を向けた。
```

#### `return_scenery`（text）
**演出:** bg: bg_office
```text
見上げる空は灰色に曇り、乾いた風が吹き抜けては路地の土埃を激しく巻き上げる。
```

#### `end_success`（end_success）
**演出:** bg: bg_office
```text
任務完了。血の付いた報酬の金貨は、ひどく冷たかった。
```
**rewards:** Gold:200, Rep:5, Order:5, Justice:5

#### `end_failure`（end_failure）
**演出:** bg: bg_slum
```text
暴徒の熱量に押し返された。地面に這いつくばり敗北を知る。
```

---

## 4. 敵定義参照

| enemy_group_id | グループ名 |
|----------------|-----------|
| 404 | 飢えた市民 x5 |
