# クエスト仕様書：7007 — 地下水路の害獣駆除

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7007 |
| **Slug** | `qst_gen_rat` |
| **クエスト種別** | 一般クエスト（Normal） |
| **推奨レベル** | 2（Easy） |
| **難度** | 2 |
| **依頼主** | 自治会 |
| **出現条件** | 全拠点で出現 |
| **リピート** | リピート可能 |
| **経過日数 (time_cost)** | 2 |
| **ノード数** | 30ノード（2連戦） |
| **ゲストNPC** | なし |
| **難易度Tier** | Easy（rec_level: 2） |
| **サムネイル画像** | /images/quests/bg_ruins_field.png |
---

## 1. クエスト概要
 
### 短文説明
```
[駆除] 地下水路の巨大ネズミの群れを駆除し、ネズミの女王を討て。
```

### 長文説明
```
自治会から、地下水路で大量発生した巨大ネズミの駆除を依頼された。
奴らは犬ほどの大きさがあり、噛まれた作業員が感染症で倒れるなど被害が出ている。
さらに地下の奥深くからは、普通の害獣とは思えない不気味な鳴き声が聞こえるという。
水路の地図を頼りに暗闇の深部へ潜入し、群れを統べる女王を根絶せよ。
```

---

## 2. 報酬定義

```
Gold:400|Rep:2
```

---

## 3. シナリオノードフロー

```text
start_prep → start → text_01 → text_02 → text_03 → text_04 → text_accept
  → depart → sewer_01 → sewer_scenery → sewer_02 → sewer_03
    → rat_01 → rat_01_warn → rat_02 → battle_01
      ├─ win → after_01 → after_scenery → nest_01 → nest_scenery → nest_02 → nest_03 → battle_02
      │    ├─ win → after_queen_01 → after_queen_02 → sewer_exit → arrive_office → office_01 → end_success
      │    └─ lose → end_failure
      └─ lose → end_failure
```

### ノード詳細（30ノード）

#### `start_prep`（text）
**演出:** bg: bg_office
```text
自治会事務所の扉を開ける。中に漂うカビとインクの臭いが、私たちの鼻腔を強く刺激した。
```

#### `start`（text）
**演出:** bg: bg_office
```text
奥の机では、衛生担当の役人が顔を青くしながら、薬草を浸した布で必死に鼻を覆っている。
```

#### `text_01`（text）
**演出:** bg: bg_office, speaker: 衛生担当の役人
```text
「うう……よく来てくれた。実は地下水路で巨大な害獣が大量発生して、本当に困り果てているのだ」
```

#### `text_02`（text）
**演出:** bg: bg_office, speaker: 衛生担当の役人
```text
「修繕に向かった作業員が噛まれて高熱で倒れた。奴らは恐ろしく凶暴で、犬ほどの大きさもあるという」
```

#### `text_03`（text）
**演出:** bg: bg_office, speaker: 衛生担当の役人
```text
「さらに水路の奥からは、普通のネズミとは思えない不気味な鳴き声が聞こえるとのことだ」
```

#### `text_04`（text）
**演出:** bg: bg_office, speaker: 衛生担当の役人
```text
「これが水路の地図だ。なんとか発生源である『巣』を探し出し、奴らを根絶してほしい」
```

#### `text_accept`（text）
**演出:** bg: bg_office
```text
地図を受け取り、懐にしまう。暗く湿った地下での戦いに備え、装備を点検した。
```

#### `depart`（text）
**演出:** bg: bg_catacombs
```text
街の片隅にある錆びついた鉄格子を開け、冷気が這い出る暗闇の奥へと足を踏み入れる。
```

#### `sewer_01`（text）
**演出:** bg: bg_catacombs
```text
錆びた梯子を慎重に降りると、そこは下水路だった。足元を濁った汚水がゴーゴーと音を立てて流れていく。
```

#### `sewer_scenery`（text）
**演出:** bg: bg_catacombs
```text
壁は黒く濡れ、天井からは絶え間なく冷たい水滴が落ちてきて首筋を濡らした。
```

#### `sewer_02`（text）
**演出:** bg: bg_catacombs
```text
壁の苔が怪しく光る中、松明の灯りをかざすと、暗がりの奥で無数の赤い目が爛々と明滅する。
```

#### `sewer_03`（text）
**演出:** bg: bg_catacombs
```text
気配はすぐに消えた。だが、排水管の奥から爪で壁を引っかく音が不気味に響く。
```

#### `rat_01`（text）
**演出:** bg: bg_catacombs
```text
曲がり角を抜けると、汚水の泥だまりで巨大ネズミが３匹、何かの骨を貪っていた。
```

#### `rat_01_warn`（text）
**演出:** bg: bg_catacombs
```text
ネズミは骨を引きちぎり、ぬらぬらと濡れた毛皮を揺らしながら、こちらの出方をじっと窺っていた。
```

#### `rat_02`（text）
**演出:** bg: bg_catacombs
```text
こちらの存在を完全に捉えたそいつらは、黄色く濁った鋭い牙を剥き出しにして牙を鳴らす！
```

#### `battle_01`（battle）
**演出:** bg: bg_catacombs, bgm: bgm_battle
| 設定 | 値 |
|-----|-----|
| 敵グループID | `407` |
| 敵表示名 | 巨大ネズミ |

```text
巨大ネズミの群れが、汚水を跳ね上げながら一斉に襲いかかってきた！
```

#### `after_01`（text）
**演出:** bg: bg_catacombs
```text
手応えはあったが、泥とネズミの返り血で体が汚れる。息を整え、さらに奥を目指す。
```

#### `after_scenery`（text）
**演出:** bg: bg_catacombs
```text
進むにつれ、悪臭が鼻を刺すほど強くなる。水路の壁には粘液のようなものが付着していた。
```

#### `nest_01`（text）
**演出:** bg: bg_catacombs
```text
最深部の空間に辿り着いた。そこには骨やゴミ、ぼろ布で築かれた巨大な巣があった。
```

#### `nest_scenery`（text）
**演出:** bg: bg_catacombs
```text
巣の周囲には、無数の小さな骨が散乱している。ここが害獣どもの繁殖地なのだろう。
```

#### `nest_02`（text）
**演出:** bg: bg_catacombs
```text
巣の中央から、一際巨大な影が這い出てきた。その頭部には骨のような突起がある。
```

#### `nest_03`（text）
**演出:** bg: bg_catacombs
```text
暗闇で禍々しい紫色の瞳が爛々と輝く。知性すら感じさせる、この巣の女王が立ち塞がる！
```

#### `battle_02`（battle）
**演出:** bg: bg_catacombs, bgm: bgm_battle
| 設定 | 値 |
|-----|-----|
| 敵グループID | `408` |
| 敵表示名 | ネズミの女王と取り巻き |

```text
ネズミの女王と、周囲を守る群れが牙を剥いて襲いかかってきた！
```

#### `after_queen_01`（text）
**演出:** bg: bg_catacombs
```text
激闘の末、女王は泥の中に沈んだ。主を失った小さな子ネズミたちが四散していく。
```

#### `after_queen_02`（text）
**演出:** bg: bg_catacombs
```text
周囲を見渡すと、水路を満たしていた禍々しい気配は綺麗に消え去り、泥の滴る音だけが響く静寂が戻っていた。
```

#### `sewer_exit`（text）
**演出:** bg: bg_catacombs
```text
松明の火も残り僅かだ。私たちは悪臭と疲労に耐えながら、水路の出口へと引き返した。
```

#### `arrive_office`（text）
**演出:** bg: bg_office
```text
自治会事務所に戻り、役人に任務完了を報告した。泥まみれの私たちに、彼は目を丸くする。
```

#### `office_01`（text）
**演出:** bg: bg_office, speaker: 衛生担当の役人
```text
「おお……！ 見事に女王を仕留めてくれたか！ これでようやく、安心して水路の修繕を進められるよ」
```

#### `end_success`（end_success）
**演出:** bg: bg_office
```text
害獣駆除完了。しばらくはネズミの夢を見そうだが、懐の報酬がその労を労ってくれた。
```
**rewards:** Gold:400, Rep:2

#### `end_failure`（end_failure）
**演出:** bg: bg_catacombs
```text
ネズミの猛攻に圧倒され、命からがら退却した。地下にはまだ、無数の牙が潜んでいる。
```

---

## 4. 敵定義参照

| enemy_group_id | グループ名 |
|----------------|-----------|
| 407 | 巨大ネズミ |
| 408 | ネズミの女王と取り巻き |
