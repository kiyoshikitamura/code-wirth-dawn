# クエスト仕様書：7010 — 異端者の粛清

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7010 |
| **Slug** | `qst_rol_heretic` |
| **クエスト種別** | 聖王国クエスト（Roland） |
| **推奨レベル** | 4（Normal） |
| **難度** | 3 |
| **依頼主** | 聖騎士団 |
| **出現条件** | min_reputation: 80 / 出現拠点: loc_holy_empire |
| **リピート** | リピート可能 |
| **難易度Tier** | Normal（rec_level: 4） |
| **経過日数 (time_cost)** | 2（成功: 2日 / 失敗: 1日） |
| **ノード数** | 18ノード |
| **サムネイル画像** | `/images/quests/bg_church.png` |

## 1. クエスト概要

### 短文説明
```
[討伐] 教会に背く異端の信徒たちを、騎士団に代わって旧市街の廃教会で処理する。
```

### 長文説明
```
聖騎士団からの非公式な依頼。王都の旧市街、光の届かない廃教会で「星の導き」を騙る異端者たちが集会を開いているという。彼らの教義は聖王国の秩序を乱す危険思想と認定された。騎士団が直接手を下せば民衆の反感を買うため、影の処理役が必要とされている。彼らを「浄化」し、街の秩序を保て。
```

## 2. 報酬定義

**CSV記載形式:**
```
Gold:600|Order:20|Exp:100|Rep:5
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
start → intro_1 → intro_2 → arrive_slum → slum_desc
  → church_out → church_in → ritual_scene → ritual_dialogue
    → confront → cultist_shout → battle_cultists
       ├─ [勝利] → after_battle_1 → after_battle_2
       │    → report_knights → knight_reply → end_success
       └─ [敗北] → end_failure
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm
```text
聖騎士団の詰め所に呼ばれた。
薄暗い執務室で、副隊長が分厚い羊皮紙を机に放り投げる。
```

#### `intro_1`（text）
**演出:** bg: bg_guild, speaker: 副隊長
```text
「旧市街の廃教会で、異端者どもが夜な夜な集会を開いている。
　『偽りの神を捨て、真の星の導きに従え』などと妄言を吐く連中だ」
```

#### `intro_2`（text）
**演出:** bg: bg_guild, speaker: 副隊長
```text
「我々が直接動けば、無用な騒ぎになる。
　冒険者よ、お前に『浄化』を頼みたい。手荒な真似になっても構わん」
```

#### `arrive_slum`（text）
**演出:** bg: bg_slums, bgm: bgm_quest_tense
```text
王都の華やかな表通りから外れ、旧市街へと足を踏み入れる。
日差しが遮られ、じめじめとした空気が肌を撫でた。
```

#### `slum_desc`（text）
**演出:** bg: bg_slums
```text
やせ細った野良犬が路地裏へ逃げ込む。
この辺りの住民たちは、異端の教えに救いを求めるほど追い詰められているのだろうか。
```

#### `church_out`（text）
**演出:** bg: bg_ruined_church
```text
目的の廃教会に到着した。
ステンドグラスは割れ、女神の彫像は顔が削り取られている。
```

#### `church_in`（text）
**演出:** bg: bg_ruined_church
```text
きしむ木の扉を押し開け、地下への階段を下りる。
カビの匂いに混じって、甘ったるい香の匂いが漂ってきた。
```

#### `ritual_scene`（text）
**演出:** bg: bg_ruined_church
```text
地下の礼拝堂。
黒いローブを着た十数人の男女が、奇妙な文様を描いた祭壇を囲んでいる。
```

#### `ritual_dialogue`（text）
**演出:** bg: bg_ruined_church, speaker: 異端の司祭
```text
「光は我らを救わない！ 真の救済は、星の海から訪れる！
　今こそ偽りの偶像を打ち砕き——」
```

#### `confront`（text）
**演出:** bg: bg_ruined_church
```text
松明の光がこちらを照らし出した。
信徒たちが一斉にこちらを振り返る。その目には異常な熱が宿っていた。
```

#### `cultist_shout`（text）
**演出:** bg: bg_ruined_church, speaker: 異端の司祭
```text
「騎士団の犬め！
　星の導きを邪魔する者は、我らが手で排除する！」
```

#### `battle_cultists`（battle）
**演出:** bg: bg_ruined_church, bgm: bgm_battle

| 設定 | 値 |
|-----|-----|
| 敵グループID | `410`（新規作成） |
| 敵グループSlug | `grp_cult_heretic` |
| 構成 | 狂信者(1111) x3 / 邪教の司祭(1112) x2 |
| 敵表示名 | 異端の信徒たち |

```text
異端者たちが隠し持っていた短剣を抜き、襲いかかってきた！
```

#### `after_battle_1`（text）
**演出:** bg: bg_ruined_church, bgm: bgm_quest_calm
```text
狂信者たちは床に伏し、動かなくなった。
祭壇の火が消え、地下室に再び冷たい静寂が戻る。
```

#### `after_battle_2`（text）
**演出:** bg: bg_ruined_church
```text
彼らが本当に国を脅かす存在だったのかは分からない。
だが、これが依頼だ。証拠となる異端の教典を回収し、教会を後にした。
```

#### `report_knights`（text）
**演出:** bg: bg_guild
```text
騎士団の詰め所に戻り、教典を机の上に置く。
```

#### `knight_reply`（text）
**演出:** bg: bg_guild, speaker: 副隊長
```text
「見事な働きだ。これで王都の秩序は守られた。
　お前のことは、口の堅い使える者として記憶しておこう」
```

#### `end_success`（end_success）
**演出:** bg: bg_guild
```text
報酬を受け取った。
手の中の金貨の重さが、命の重さのように感じられた。
```
**rewards:** Gold:600, Order:20, Exp:100, Rep:5

#### `end_failure`（end_failure）
**演出:** bg: bg_ruined_church
```text
狂信者たちの数の暴力に押し潰された。
意識が遠のく中、彼らの祈りの声が不気味に響いていた。
```

---

## 4. 敵定義参照（新規エネミーグループ）

### エネミーグループ: `grp_cult_heretic` (ID: 410)

| Slug | 名前 | Lv | HP | ATK | DEF |
|------|------|----|----|-----|-----|
| enemy_cultist | 狂信者 | 5 | 60 | 30 | 2 |
| enemy_cultist | 狂信者 | 5 | 60 | 30 | 2 |
| enemy_cultist | 狂信者 | 5 | 60 | 30 | 2 |
| enemy_cult_priest | 邪教の司祭 | 9 | 100 | 48 | 3 |
| enemy_cult_priest | 邪教の司祭 | 9 | 100 | 48 | 3 |

---

## 5. CSVエントリ（quests_normal.csv）

```csv
7010,qst_rol_heretic,異端者の粛清,4,3,2,loc_holy_empire,,,80,,Gold:600|Order:20|Exp:100|Rep:5,聖騎士団,[討伐] 教会に背く異端の信徒たちを、騎士団に代わって旧市街の廃教会で処理する。
```

---

## 6. 実装チェックリスト

- [ ] 出現拠点が `loc_holy_empire` のみに制限されている
- [ ] 受注条件 `min_reputation: 80` が正しく機能する
- [ ] エネミーグループ `grp_cult_heretic`（410）がenemy_groups.csvに登録済み
- [ ] Order +20 アライメント変動が適用される
- [ ] time_cost: 2（成功）/ 1（失敗）が正しく経過する
