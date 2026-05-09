# クエスト仕様書：7011 — 最前線への聖水輸送

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7011 |
| **Slug** | `qst_rol_holywater` |
| **クエスト種別** | 聖王国クエスト（Roland） |
| **推奨レベル** | 4（Normal） |
| **難度** | 2 |
| **依頼主** | 教会 |
| **出現条件** | 制限なし / 出現拠点: loc_holy_empire |
| **リピート** | リピート可能 |
| **難易度Tier** | Normal（rec_level: 4） |
| **経過日数 (time_cost)** | 4（成功: 4日 / 失敗: 2日） |
| **ノード数** | 21ノード |
| **サムネイル画像** | `/images/quests/bg_road_day.png` |

## 1. クエスト概要

### 短文説明
```
[輸送] アンデッド対策として、前線の砦に祝福された聖水を運ぶ。
```

### 長文説明
```
教会からの正式な依頼。最前線の砦では腐臭が充満し、戦死者がアンデッドとして歩き出すという異常事態が発生している。彼らを土へ還し、兵士たちの士気を保つためには教会の「祝福された聖水」が不可欠だ。重い木箱を荷車に積み、魔物や亡者が彷徨う危険な街道を越えて、前線基地へと物資を輸送せよ。
```

## 2. 報酬定義

**CSV記載形式:**
```
Gold:400|Order:10|Exp:120|Rep:5
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
start → intro_1 → intro_2 → travel_start → travel_mid
  → camp → night_watch → encounter_wave1
    → battle_wave1 (スケルトン x4)
       ├─ [勝利] → after_wave1 → deeper_night → encounter_wave2
       │    → battle_wave2 (ゾンビ x3)
       │       ├─ [勝利] → after_wave2 → dawn_road → encounter_wave3
       │       │    → battle_wave3 (スケルトン x1 / ゾンビ x1 / レイス x1)
       │       │       ├─ [勝利] → arrive_fort → meet_commander
       │       │       │    → deliver → end_success
       │       │       └─ [敗北] → end_failure
       │       └─ [敗北] → end_failure
       └─ [敗北] → end_failure
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm
```text
教会の地下室で、大司祭から木箱を引き渡された。
中には銀色の小瓶が何十本も隙間なく詰められている。
```

#### `intro_1`（text）
**演出:** bg: bg_guild, speaker: 大司祭
```text
「最前線の砦で、死者が歩き出しているという報告がありました。
　この聖水は、彼らに安らかな眠りを与えるためのものです」
```

#### `intro_2`（text）
**演出:** bg: bg_guild, speaker: 大司祭
```text
「道中は危険ですが、兵士たちの命がかかっています。
　どうか、無事に届けてください」
```

#### `travel_start`（text）
**演出:** bg: bg_road_day, bgm: bgm_field
```text
木箱を荷車に載せ、王都の門を出発した。
前線までは片道二日の道のりだ。
```

#### `travel_mid`（text）
**演出:** bg: bg_road_day
```text
街道は荒れ果て、すれ違う旅人もほとんどいない。
ただ、時折冷たい風に乗って、微かな腐臭が漂ってくる。
```

#### `camp`（text）
**演出:** bg: bg_camp, bgm: bgm_quest_calm
```text
夜が訪れ、街道沿いの廃墟で野営の準備をする。
焚き火の光だけが、周囲の闇を押し返していた。
```

#### `night_watch`（text）
**演出:** bg: bg_camp, bgm: bgm_quest_tense
```text
見張りに立っていると、暗闇の奥から引きずるような足音が聞こえた。
一つではない。複数だ。
```

#### `encounter_wave1`（text）
**演出:** bg: bg_camp
```text
焚き火の光の端に、甲冑を着た骸骨たちの姿が浮かび上がった。
荷車に積まれた聖水の気配に引かれて集まってきたらしい。
```

#### `battle_wave1`（battle）【第1戦】
**演出:** bg: bg_camp, bgm: bgm_battle

| 設定 | 値 |
|-----|-----|
| 敵グループID | `411`（新規作成） |
| 敵グループSlug | `grp_skeleton_quad` |
| 構成 | スケルトン(1031) x4 |
| 敵表示名 | 骸骨の群れ |

```text
亡者の群れが荷車に向かって群がってくる。聖水を守り抜け！
```

#### `after_wave1`（text）
**演出:** bg: bg_camp, bgm: bgm_quest_calm
```text
骸骨たちを打ち砕いた。骨の破片が地面に散らばる。
荷車を確認する。木箱は無事だ。だが、まだ腐臭が薄れない。
```

#### `deeper_night`（text）
**演出:** bg: bg_camp, bgm: bgm_quest_tense
```text
焚き火の薪を足した直後、今度は地面から這い出すような音がした。
腐敗した手が、土の中から突き出てくる。
```

#### `encounter_wave2`（text）
**演出:** bg: bg_camp
```text
ゾンビの群れだ。半ば腐り落ちた肉体を引きずりながら、
こちらへと迫ってくる。聖水の匂いに狂ったように目が光っている。
```

#### `battle_wave2`（battle）【第2戦】
**演出:** bg: bg_camp, bgm: bgm_battle

| 設定 | 値 |
|-----|-----|
| 敵グループID | `412`（新規作成） |
| 敵グループSlug | `grp_zombie_trio` |
| 構成 | ゾンビ(1032) x3 |
| 敵表示名 | ゾンビの群れ |

```text
腐乱死体たちが聖水を求めて襲いかかってくる！
```

#### `after_wave2`（text）
**演出:** bg: bg_camp, bgm: bgm_quest_calm
```text
二度目の襲撃も退けた。体力が削がれてきたが、聖水は無事だ。
夜明けまでもう少し。持ちこたえなければ。
```

#### `dawn_road`（text）
**演出:** bg: bg_road_day, bgm: bgm_field
```text
薄明が差し込み、ようやく出発の準備をする。
しかし、前方の街道に霧のような瘴気が立ち込めている。
```

#### `encounter_wave3`（text）
**演出:** bg: bg_road_day, bgm: bgm_quest_tense
```text
霧の中から、怨嗟の声が響く。
骸骨と腐敗した肉体、そして実体を持たない幽鬼——三種の亡者が行く手を阻んでいた。
```

#### `battle_wave3`（battle）【第3戦】
**演出:** bg: bg_road_day, bgm: bgm_battle

| 設定 | 値 |
|-----|-----|
| 敵グループID | `413`（新規作成） |
| 敵グループSlug | `grp_undead_mixed` |
| 構成 | スケルトン(1031) x1 / ゾンビ(1032) x1 / レイス(1033) x1 |
| 敵表示名 | 混成亡者 |

```text
最後の関門——三種の亡者が同時に襲いかかってきた！
```

#### `arrive_fort`（text）
**演出:** bg: bg_fort, bgm: bgm_quest_calm
```text
砦の門をくぐると、負傷兵のうめき声と血の匂いが充満していた。
誰もが疲弊しきった顔をしている。
```

#### `meet_commander`（text）
**演出:** bg: bg_fort, speaker: 砦の守備隊長
```text
「教会からの支援物資か！ 助かった……！
　これで今夜は、死んだ仲間と戦わずに済む」
```

#### `deliver`（text）
**演出:** bg: bg_fort
```text
守備隊長に木箱を引き渡す。
彼は丁寧に木箱を受け取り、深く頭を下げた。
```

#### `end_success`（end_success）
**演出:** bg: bg_guild
```text
王都に戻り、教会に完了を報告した。
報酬を受け取る。前線の兵士たちの安堵の顔が目に浮かんだ。
```
**rewards:** Gold:400, Order:10, Exp:120, Rep:5

#### `end_failure`（end_failure）
**演出:** bg: bg_camp
```text
亡者の群れに押し切られ、荷車を奪われた。
散乱した聖水が地面に吸い込まれていくのを、朦朧とする意識の中で見ていた。
```

---

## 4. 敵定義参照（新規エネミーグループ 3件）

### エネミーグループ: `grp_skeleton_quad` (ID: 411)

| Slug | 名前 | Lv | HP | ATK | DEF |
|------|------|----|----|-----|-----|
| enemy_skeleton | スケルトン | 4 | 45 | 22 | 3 |
| enemy_skeleton | スケルトン | 4 | 45 | 22 | 3 |
| enemy_skeleton | スケルトン | 4 | 45 | 22 | 3 |
| enemy_skeleton | スケルトン | 4 | 45 | 22 | 3 |

### エネミーグループ: `grp_zombie_trio` (ID: 412)

| Slug | 名前 | Lv | HP | ATK | DEF |
|------|------|----|----|-----|-----|
| enemy_zombie | ゾンビ | 6 | 80 | 30 | 2 |
| enemy_zombie | ゾンビ | 6 | 80 | 30 | 2 |
| enemy_zombie | ゾンビ | 6 | 80 | 30 | 2 |

### エネミーグループ: `grp_undead_mixed` (ID: 413)

| Slug | 名前 | Lv | HP | ATK | DEF |
|------|------|----|----|-----|-----|
| enemy_skeleton | スケルトン | 4 | 45 | 22 | 3 |
| enemy_zombie | ゾンビ | 6 | 80 | 30 | 2 |
| enemy_wraith | レイス | 10 | 100 | 42 | 15 |

---

## 5. CSVエントリ（quests_normal.csv）

```csv
7011,qst_rol_holywater,最前線への聖水輸送,4,2,4,loc_holy_empire,,,,,Gold:400|Order:10|Exp:120|Rep:5,教会,[輸送] アンデッド対策として、前線の砦に祝福された聖水を運ぶ。
```

---

## 6. 実装チェックリスト

- [ ] 出現拠点が `loc_holy_empire` のみ
- [ ] エネミーグループ `grp_skeleton_quad`（411）がenemy_groups.csvに登録済み
- [ ] エネミーグループ `grp_zombie_trio`（412）がenemy_groups.csvに登録済み
- [ ] エネミーグループ `grp_undead_mixed`（413）がenemy_groups.csvに登録済み
- [ ] 3連戦フローが正しく遷移する
- [ ] Order +10 アライメント変動が適用される
- [ ] time_cost: 4（成功）/ 2（失敗）が正しく経過する
