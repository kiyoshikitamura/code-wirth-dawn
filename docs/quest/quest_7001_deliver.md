# クエスト仕様書：7001 — 隣街への封書配達

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7001 |
| **Slug** | `qst_gen_deliver` |
| **クエスト種別** | 一般クエスト（Normal） |
| **推奨レベル** | 2（Easy） |
| **難度** | 2 |
| **依頼主** | 配達組合 |
| **出現条件** | 全拠点で出現 |
| **リピート** | リピート可能 |
| **経過日数 (time_cost)** | 8 |
| **ノード数** | 48ノード |
| **ゲストNPC** | なし |
| **難易度Tier** | Easy（rec_level: 2） |
| **サムネイル画像** | `/images/quests/bg_road_day.png` |
---

## 1. クエスト概要

### 短文説明
```
[配達] 隣街の旅籠へ封書を届けて戻る。道中の追い剥ぎに注意。
```

### 長文説明
```
配達組合から、隣街の旅籠の主人へ向けた重要封書の配達を依頼された。
街道は比較的整備されているが、最近は治安が悪化し、追い剥ぎの報告もある。
封書を濡らしたり紛失したりすることなく、無事に届けて戻るのが任務だ。
```

---

## 2. 報酬定義

**CSV記載形式（デフォルトルート）:**
```
Gold:250|Rep:2
```

---

## 2.5 失敗ペナルティ

| 項目 | 値 |
|-----|-----|
| VIT変動 | VIT -1 |
| 経過日数（失敗） | 4日 |

---

## 3. シナリオノードフロー

```text
【導入】
start_prep -> start_street -> start -> text_01 -> text_01_warn -> text_02 -> text_02_look -> text_03 -> text_03_weight -> text_04 -> text_05 -> receive

【道中】
receive -> depart -> depart_scenery -> road_01 -> road_scenery -> road_scenery_2 -> road_scenery_3 -> encounter_alert -> encounter_01 -> encounter_02 -> encounter_look -> encounter_03 -> encounter_04 -> encounter_prep -> battle

【戦闘分岐】
battle 
  ├─ win  -> after_01 -> after_01_scenery -> after_02 -> after_02_check -> arrive_01 -> arrive_inn_scenery -> arrive_inn_look -> arrive_02 -> arrive_02_look -> deliver
  └─ lose -> end_failure_01 -> end_failure

【受渡と帰路】
deliver (選択肢: 封書を渡す)
  └─ delivery_01 -> delivery_01_look -> delivery_02 -> delivery_03 -> return_road -> return_look -> return_near -> return_near_02 -> end_success_01 -> end_success
```

---

## 3.5 ノード詳細

#### `start_prep`（text）
**演出:** bg: bg_guild
```text
今日も重い足取りでギルドの依頼板を眺める。まともな日銭になりそうなのは、やはり配達の依頼くらいのものだ。
```

#### `start_street`（text）
**演出:** bg: bg_guild
```text
木賃宿から大通りへ出ると、朝の冷気と土埃の匂いが混じった風が、容赦なく頬を叩いて通り過ぎていく。
```

#### `start`（text）
**演出:** bg: bg_guild
```text
配達組合の窓口に足を運ぶと、小太りの受付がうんざりした顔でこちらを睨み、帳面から目を離して話し出した。
```

#### `text_01`（text）
**演出:** bg: bg_guild, speaker: 配達組合の受付
```text
「ああ、またお前か。ちょうどいい、この封書を一通、隣街の旅籠の主人へ届けてきてくれ」
```

#### `text_01_warn`（text）
**演出:** bg: bg_guild, speaker: 配達組合の受付
```text
「絶対に濡らすんじゃないぞ！ 中身のインクが滲んだら、あそこの主人は受け取ってくれないからな」
```

#### `text_02`（text）
**演出:** bg: bg_guild, speaker: 配達組合の受付
```text
「内容が何かは俺も知らんし、詮索するなよ。組合は中身に関知しない決まりになっている...わかるな？」
```

#### `text_02_look`（text）
**演出:** bg: bg_guild
```text
（知らぬ方が身のため、ということか……。不穏な気配が漂っている）
```

#### `text_03`（text）
**演出:** bg: bg_guild
```text
受け取りの署名を帳面に走らせると、受付は引き出しの奥から厳重に蝋封された一通の手紙を取り出した。
```

#### `text_03_weight`（text）
**演出:** bg: bg_guild
```text
手にした手紙はずしりと重い。まるで誰かの重苦しい人生が封印されているかのようだった。
```

#### `text_04`（text）
**演出:** bg: bg_guild, speaker: 配達組合の受付
```text
「往復で八日は見ておけよ。最近は街道の治安が悪く、物騒な追い剥ぎがうろついているらしい」
```

#### `text_05`（text）
**演出:** bg: bg_guild, speaker: 配達組合の受付
```text
「まあ、そのぶん報酬は多めに上乗せしてある。途中で野垂れ死んでくれるなよ」
```

#### `receive`（text）
**演出:** bg: bg_guild
```text
二重に封印された手紙を背負い袋の奥へ慎重に収め、見覚えのない不気味な紋章の封蝋をそっとなぞった。
```

#### `depart`（text）
**演出:** bg: bg_road_day
```text
重い門をくぐり、隣街へ続く荒涼とした街道へと歩み出す。乾いた熱風が激しく吹き荒れ、砂礫を巻き上げていく。
```

#### `depart_scenery`（text）
**演出:** bg: bg_road_day
```text
周囲を見渡すと、街道の脇には枯れ草に覆われた古い名も無き旅人たちの墓標が、静かに佇んでいた。
```

#### `road_01`（text）
**演出:** bg: bg_road_day
```text
さらに進むと、深く刻まれた馬車の轍の跡が、何故か途中で不自然に引き返した形で途切れている。
```

#### `road_scenery`（text）
**演出:** bg: bg_road_day
```text
背負い袋の紐が徐々に肩へ食い込み、歩くたびに靴底が砂利と擦れて鈍い音を立てた。
```

#### `road_scenery_2`（text）
**演出:** bg: bg_road_day
```text
照りつける太陽が容赦なく体力を奪い、喉の渇きを潤す水筒の水も、すでに底をつきかけている。
```

#### `road_scenery_3`（text）
**演出:** bg: bg_road_day
```text
ふと視線を感じて顔を上げると、遠くの岩陰で不気味な人影のようなものが蠢いた気がする。
```

#### `encounter_alert`（text）
**演出:** bg: bg_road_day
```text
その直後、にわかに風が止み、周囲の藪から鳥たちが一斉に羽ばたいて逃げていく。嫌な予感が胸を刺した。
```

#### `encounter_01`（text）
**演出:** bg: bg_road_day
```text
街道の曲がり角を抜けた瞬間、抜刀した大柄な男が、威嚇するように道を塞いで立ち塞がった！
```

#### `encounter_02`（text）
**演出:** bg: bg_road_day
```text
さらに背後の藪からもう二人、痩せこけた男たちが音もなく現れ、こちらの退路を完全に遮断した。
```

#### `encounter_look`（text）
**演出:** bg: bg_road_day
```text
男たちの衣服はボロボロに擦り切れ、その目の奥には飢えた肉食獣のようなぎらついた光が宿っている。
```

#### `encounter_03`（text）
**演出:** bg: bg_road_day, speaker: 追い剥ぎの頭
```text
「おいおい、そこの配達屋。その背負い袋の中身、かなり金目のものが入ってそうだな？」
```

#### `encounter_04`（text）
**演出:** bg: bg_road_day, speaker: 追い剥ぎの頭
```text
「大人しく荷物を全部置いていきな。そうすれば、お前の命までは取らないでおいてやるよ」
```

#### `encounter_prep`（text）
**演出:** bg: bg_road_day
```text
（話が通じる相手ではないな……。観念して剣を抜き、身構える）
```

#### `battle`（battle）
**演出:** bg: bg_road_day, bgm: bgm_battle
**パラメータ:** enemy_group_id: 400, next: `after_01`, fail: `end_failure_01`
| 設定 | 値 |
|-----|-----|
| 敵グループID | `400` |
| 敵表示名 | 追い剥ぎ一味 |

#### `after_01`（text）
**演出:** bg: bg_road_day
```text
激しい剣戟の末、ついに追い剥ぎどもを退けた。倒れた頭目の懐からは、安っぽい銅貨数枚がこぼれ落ちて転がっている。
```

#### `after_01_scenery`（text）
**演出:** bg: bg_road_day
```text
男たちの苦悶の呻き声を聞き流しながら、自分の服にこびりついた血と土埃を静かに払い落とす。
```

#### `after_02`（text）
**演出:** bg: bg_road_day
```text
背嚢から封書を取り出して確認する。傷一つなく、蝋封も完璧なままだ。よし、先を急ぐとしよう。
```

#### `after_02_check`（text）
**演出:** bg: bg_road_day
```text
（何とか生き延びたか……。それだけが、この荒野における唯一の揺るぎない真実だ）
```

#### `arrive_01`（text）
**演出:** bg: bg_tavern_day
```text
それから数日、警戒を怠らずに進み、ようやく目的地の寂れた旅籠「黄昏亭」に到着した。
```

#### `arrive_inn_scenery`（text）
**演出:** bg: bg_tavern_day
```text
木製の重い扉を開けると、安酒のツンとした臭いと、酸っぱいシチューの匂いが鼻をつく。
```

#### `arrive_inn_look`（text）
**演出:** bg: bg_tavern_day
```text
（およそ治安が良いとは言えない宿だな。だが、手紙を無事に渡せれば私にはどうでもいい）
```

#### `arrive_02`（text）
**演出:** bg: bg_tavern_day, speaker: 黄昏亭の主人
```text
「……配達か。組合から？」
```

#### `arrive_02_look`（text）
**演出:** bg: bg_tavern_day
```text
男の濁った目が、こちらの差し出した封書の蝋に刻まれた紋章に、一瞬だけ鋭く留まる。
```

#### `deliver`（choice）
**演出:** bg: bg_tavern_day
| 選択肢 | 次ノード |
|---|---|
| 封書を渡す | `delivery_01` |

#### `delivery_01`（text）
**演出:** bg: bg_tavern_day
```text
封書を手渡すと、主人はゆっくりと蝋封の凹凸を指でなぞり、そっと懐の奥へと収めた。
```

#### `delivery_01_look`（text）
**演出:** bg: bg_tavern_day
```text
主人は満足げに頷くと、周囲を気にしながら、手紙を引き出しの二重底の奥へと隠した。
```

#### `delivery_02`（text）
**演出:** bg: bg_tavern_day, speaker: 黄昏亭の主人
```text
「ご苦労だった。帰りも気をつけろ。物騒だからな」
```

#### `delivery_03`（text）
**演出:** bg: bg_tavern_day
```text
（この手紙が何をもたらすのか……。いや、詮索は無用。私の仕事はこれで終わりだ）
```

#### `return_road`（text）
**演出:** bg: bg_road_day
```text
復路の足取りは往路に比べてはるかに軽い。だが、背後の林から執拗な視線を感じる気がした。
```

#### `return_look`（text）
**演出:** bg: bg_road_day
```text
（ただの気のせいか？ いや、この荒野ではわずかな油断をした者から例外なく死んでいく）
```

#### `return_near`（text）
**演出:** bg: bg_road_day
```text
ひたすら走り続け、遠くに我が街の頑強な石壁が見えてきた。ようやくまともに息がつける。
```

#### `return_near_02`（text）
**演出:** bg: bg_road_day
```text
ギルドの温かな明かりが見えてくると、無事に旅を終えられた安堵感が全身に込み上げてきた。
```

#### `end_success_01`（text）
**演出:** bg: bg_guild
```text
組合の窓口に報告書を提出すると、受付は無愛想に報酬の入った革袋を机に放り投げた。
```

#### `end_success`（end_success）
**演出:** bg: bg_guild, speaker: 配達組合の受付
```text
「戻ったか。……ふん、生きて帰れただけマシだな。ほら、次の仕事もすぐに回してやる」
```
**rewards:** Gold:250, Rep:2

#### `end_failure_01`（text）
**演出:** bg: bg_guild
```text
追い剥ぎどもに無残に叩き伏せられ、気がついた時には……手紙も金も、すべて奪い去られていた。
```

#### `end_failure`（end_failure）
**演出:** bg: bg_guild, speaker: 配達組合の受付
```text
「手紙を奪われただと！？ 馬鹿野郎、お前の失態に組合からの補償は一銭も出せんぞ！」
```

---

## 4. 敵定義参照

| 項目 | 値 |
|-----|-----|
| enemy_group_id | 400 |
| グループ名 | 追い剥ぎ一味 |
| 構成 | enemy_bandit_thug + enemy_bandit_archer + enemy_bandit_guard |

---

## 5. CSVエントリ（quests_normal.csv）

```csv
7001,qst_gen_deliver,隣街への封書配達,2,2,8,all,,,,,Gold:250|Rep:2,配達組合,[配達] 隣街の旅籠へ封書を届けて戻る。道中の追い剥ぎに注意。
```
