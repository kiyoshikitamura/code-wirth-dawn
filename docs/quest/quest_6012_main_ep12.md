# クエスト仕様書：6012 — 第12話「炎の審判者」

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6012 |
| **Slug** | `main_ep12` |
| **クエスト種別** | メインエピソード（Main） |
| **推奨レベル** | 12（Hard） |
| **難度** | 3 |
| **依頼主** | なし |
| **出現条件** | 第11話「天使降臨」（6011）クリア / 滞在拠点: 砂塵の王国マルカンド首都 黄金都市イスハーク |
| **リピート** | アカウント通じて1回のみ（継承後も非表示） |
| **経過日数 (time_cost)** | 2 |
| **ノード数** | 40ノード |
| **ゲストNPC** | ヴォルグ（guest_join → leave） |
| **難易度Tier** | Hard（rec_level: 12） |
| **サムネイル画像** | `/images/quests/bg_ishaq_ruined.png` |
---

## 1. クエスト概要

### 短文説明
```
黄金都市イスハークの劫火。大天使ウリエルによる「炎の審判」。
```

### 長文説明
```
砂塵の王国マルカンドの都・イスハークは、空から降り注ぐ炎の雨によって壊滅状態にあった。
不死の傭兵ヴォルグと共に、都を焼き尽くさんとする大天使ウリエルを阻止せよ。
```

---

## 2. 報酬定義
```
Exp:350|Gold:1500|Rep:15|Order:5
```

---

## 3. シナリオノード構成（40ノード）

### 全体フロー
```text
start → start_02 → start_03 → volg_join → arrival_01 → arrival_02 → arrival_03
  → flames_01 → flames_02 → refugees_01 → refugees_02 → volg_fury_01 → volg_fury_02
  → plaza_01 → plaza_02 → battle1(502) → choice1 → clear_01 → clear_02
  → uriel_01 → uriel_02 → uriel_03 → uriel_04 → volg_charge_01 → volg_charge_02 → volg_charge_03
  → battle2(9040) → choice2 → retreat_01 → retreat_02 → retreat_03
  → aftermath_01 → aftermath_02 → volg_next_01 → volg_next_02 → volg_leave
  → next_01 → next_02 → end_node
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_tense
```text
砂塵の王国マルカンドの荒野。地平線の先から黒煙が昇る。
```

#### `start_02`（text）
**演出:** bg: bg_desert
```text
街道には、傷ついた体で逃げ延びてきた避難民の列が続く。
```

#### `start_03`（text）
**演出:** bg: bg_desert, speaker: ヴォルグ
```text
「どうやら間に合ったようだが、ひでえ有り様だな」
```

#### `volg_join`（guest_join）
**パラメータ:** guest_id: `npc_guest_volg`

#### `arrival_01`（text）
**演出:** bg: bg_ishaq_ruined, bgm: bgm_quest_crisis
```text
黄金の都市イスハークへ入る。かつての栄華は見る影もない。
```

#### `arrival_02`（text）
**演出:** bg: bg_ishaq_ruined
```text
空から絶え間なく炎の矢が降り注ぎ、街全体を焼き尽くす。
```

#### `arrival_03`（text）
**演出:** bg: bg_ishaq_ruined
```text
崩れ落ちる建物と、人々の悲鳴が渦巻く地獄と化していた。
```

#### `flames_01`（text）
**演出:** bg: bg_ishaq_ruined
```text
炎の壁に阻まれ、身動きが取れなくなった一団を見つける。
```

#### `flames_02`（text）
**演出:** bg: bg_ishaq_ruined
```text
その背後から、光り輝く使徒の群れが荒々しく迫っていた。
```

#### `refugees_01`（text）
**演出:** bg: bg_ishaq_ruined
```text
あなたはヴォルグと目配せし、一斉に敵の前に躍り出る。
```

#### `refugees_02`（text）
**演出:** bg: bg_ishaq_ruined, speaker: ヴォルグ
```text
「天の雑魚どもが、俺の獲物に手を出すんじゃねえ！」
```

#### `volg_fury_01`（text）
**演出:** bg: bg_ishaq_ruined
```text
ヴォルグの大剣が一閃し、先頭の使徒を一撃で叩き伏せた。
```

#### `volg_fury_02`（text）
**演出:** bg: bg_ishaq_ruined
```text
残された使徒たちが激昂し、あなたたちを取り囲む。
```

#### `plaza_01`（text）
**演出:** bg: bg_ishaq_ruined
```text
避難民を逃がすための時間を稼ぐため、剣を強く握る。
```

#### `plaza_02`（text）
**演出:** bg: bg_ishaq_ruined
```text
燃え盛る広場の中で、包囲する使徒たちと対峙した。
```

#### `battle1`（battle）
**演出:** bg: bg_ishaq_ruined, bgm: bgm_battle
**パラメータ:** enemy_group_id: 502, next: choice1, fail: end_failure

#### `choice1`（choice）
**演出:** bg: bg_ishaq_ruined, bgm: bgm_battle
| 選択肢 | next_node |
|---|---|
| 「使徒の群れを倒す」 | `clear_01` |

#### `clear_01`（text）
**演出:** bg: bg_ishaq_ruined
```text
息を合わせ、襲いかかる使徒の群れをすべて撃退した。
```

#### `clear_02`（text）
**演出:** bg: bg_ishaq_ruined
```text
だがその時、上空の炎の渦が凝縮し、強烈な光を放つ。
```

#### `uriel_01`（text）
**演出:** bg: bg_ishaq_ruined
```text
炎の翼を広げ、燃え盛る大剣を手にした大天使が舞い降りる。
```

#### `uriel_02`（text）
**演出:** bg: bg_ishaq_ruined
```text
その圧倒的な威圧感の前に、周囲の炎さえもひれ伏す。
```

#### `uriel_03`（text）
**演出:** bg: bg_ishaq_ruined, speaker: 大天使ウリエル
```text
「穢レタ砂ノ都ヨ。天ノ炎ニヨリ、スベテ清メラレヨ」
```

#### `uriel_04`（text）
**演出:** bg: bg_ishaq_ruined
```text
ウリエルの剣から、超高熱の劫火が放たれようとしていた。
```

#### `volg_charge_01`（text）
**演出:** bg: bg_ishaq_ruined, speaker: ヴォルグ
```text
「へっ、清めるだと？ そのふざけた翼をむしってやる！」
```

#### `volg_charge_02`（text）
**演出:** bg: bg_ishaq_ruined
```text
ヴォルグは咆哮と共に、真っ向から大天使へ突撃する。
```

#### `volg_charge_03`（text）
**演出:** bg: bg_ishaq_ruined
```text
あなたも後に続き、炎を切り裂いて大天使へ肉薄した。
```

#### `battle2`（battle）
**演出:** bg: bg_ishaq_ruined, bgm: bgm_battle_strong
**パラメータ:** enemy_group_id: 9040, next: choice2, fail: end_failure

#### `choice2`（choice）
**演出:** bg: bg_ishaq_ruined, bgm: bgm_battle_strong
| 選択肢 | next_node |
|---|---|
| 「ウリエルを撃退する」 | `retreat_01` |

#### `retreat_01`（text）
**演出:** bg: bg_ishaq_ruined
```text
大天使の盾を砕き、ウリエルを怯ませる。
```

#### `retreat_02`（text）
**演出:** bg: bg_ishaq_ruined
```text
ウリエルは傷ついた翼を広げ、ゆっくりと上空へ退いた。
```

#### `retreat_03`（text）
**演出:** bg: bg_ishaq_ruined, speaker: 大天使ウリエル
```text
「審判ハ下サレタ……。次ハ華龍ノ都、龍京ナリ……」
```

#### `aftermath_01`（text）
**演出:** bg: bg_ishaq_ruined, bgm: bgm_quest_calm
```text
ウリエルは雲の彼方へと消え、街の炎も次第に収まっていく。
```

#### `aftermath_02`（text）
**演出:** bg: bg_ishaq_ruined
```text
黄金都市は傷ついたが、多くの人々が命を永らえた。
```

#### `volg_next_01`（text）
**演出:** bg: bg_ishaq_ruined, speaker: ヴォルグ
```text
「チッ、逃げ足の速い野郎だ。次は龍京に向かったか」
```

#### `volg_next_02`（text）
**演出:** bg: bg_ishaq_ruined, speaker: ヴォルグ
```text
「俺は一足先に龍京へ行く。手遅れになる前に来いよ」
```

#### `volg_leave`（leave）
**パラメータ:** guest_id: `npc_guest_volg`

#### `next_01`（text）
**演出:** bg: bg_ishaq_ruined
```text
ヴォルグは風のように去っていった。あなたも後に続く。
```

#### `next_02`（text）
**演出:** bg: bg_ishaq_ruined
```text
次の標的である龍京を守るため、あなたは走り出した。
```

#### `end_node`（end_success）
**演出:** bg: bg_ishaq_ruined
```text
砂塵の都に復興の兆しを残し、あなたの旅は続く。
```
**rewards:** Exp:350, Gold:1500, Rep:15, Order:5

#### `end_failure`（end_failure）
**演出:** bg: bg_ishaq_ruined
```text
大天使の無慈悲な業火に包まれ、すべては灰に帰した。
```
**rewards:** Gold:0
