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
| **経過日数 (time_cost)** | 1（成功: 1日 / 失敗: 1日） |
| **ノード数** | 5ノード（うち選択肢2件） |
| **サムネイル画像** | `/images/quests/bg_guild.png` |

※BGM、SE、進行中の背景画像などはノードごとに指定します。

---

## 1. クエスト概要

### 短文説明
```
[要定義: 短文説明]
```

### 長文説明
```
[要定義: フレーバーテキスト]
```

---

## 2. 報酬定義

**CSV記載形式:**
```
Gold:350
```

---

## 3. シナリオノードフロー

```
start → receive_holywater → travel（途中でrandom_branch）
  ├─ [50%] → undead_encounter → battle_undead
  │    ├─ 勝利 → arrive_fort → end_success
  │    └─ 敗北 → end_failure
  └─ [50%] → arrive_fort → end_success
```

#### `start`（text）
```
教会の地下室で、祝福された聖水の木箱を受け取った。
思ったより重い。最前線の砦まで無事に届けよう。
```

#### `receive_holywater`（text）
```
木箱を荷車に積んで出発した。前線までの道は整備されているが、
最近は辺りの死臭が濃くなっているという話だ。
```

#### `travel`（random_branch）
```
params: type:random_branch, prob:50, next:undead_encounter, fallback:arrive_fort
```

#### `undead_encounter`（text）
```
街道に差し掛かったとき、足を引きずる影が複数現れた。
アンデッドだ——聖水の匂いを察知したのか、こちらへ向かってくる。
```

#### `battle_undead`（battle）
**演出パラメータ:**
- **BGM**: `[要定義: 例 bgm_battle_normal]`

| 設定 | 値 |
|-----|-----|
| 敵グループ | `enemy_undead` |
| 敵名 | 歩死者（アンデッド） |
| 備考 | 回復魔法・聖属性に弱い設定（将来実装想定） |

```
params: type:battle, enemy_group_id:[要定義: enemy_undead が含まれるグループ], next:arrive_fort, fail:end_failure
```

#### `arrive_fort`（text）
```
最前線の砦に到着した。守備兵が安堵した表情で木箱を受け取る。
「本当に助かりました。これで今夜は守れる」
```

#### `end_success`（end, result: success）
```
輸送完了。教会から報酬を受け取った。
```

#### `end_failure`（end, result: failure）
```
アンデッドの群れに阻まれ、輸送を断念した。
```

---

## 4. CSVエントリ

```csv
7011,qst_rol_holywater,最前線への聖水輸送,2,2,1,loc_holy_empire,,,,,Gold:350,教会,[輸送] アンデッド対策として、前線の拠点に祝福された聖水を運ぶ。
```

---

## 5. 実装チェックリスト

- [ ] 出現拠点が `loc_holy_empire` のみ
- [ ] `enemy_undead` がDBに登録済み
- [ ] `random_branch` 50%でアンデッド遭遇が機能する

---

## 6. 拡張メモ

- 聖水を届けた後に「使い方を教わる」フレーバー（アンデッド戦闘時の効果説明）
