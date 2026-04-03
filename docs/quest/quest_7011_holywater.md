# クエスト仕様書：7011 — 最前線への聖水輸送

## 0. メタデータ

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7011 |
| **Slug** | `qst_rol_holywater` |
| **種別** | 輸送（Delivery） |
| **依頼主** | 教会 |
| **推奨Lv / 難度** | 2 / 2 |
| **所要日数** | 成功:1 / 失敗:1 |
| **出現拠点** | `loc_holy_empire` |
| **受注条件** | なし |
| **敵スラッグ** | `enemy_undead`（アンデッド） ※途中遭遇の可能性 |

---

## 1. クエスト説明

### 短文（ボード表示・40字以内）
```
アンデッド対策の聖水を、最前線の拠点へ届けてほしい。
```

### 長文（詳細モーダル）
```
教会の司祭から依頼が来た。
前線の拠点ではアンデッドの出没が増加しており、
祝福された聖水が切れ始めているという。
聖水入りの壺を入れた木箱を前線の砦まで運ぶだけの仕事だが、
道中にアンデッドが徘徊している可能性がある。
「壊すことなく届けてくれれば、それで十分です」——司祭はそう言った。
```

---

## 2. 報酬

| 種別 | 値 |
|-----|-----|
| Gold | 350G |

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
| 設定 | 値 |
|-----|-----|
| 敵スラッグ | `enemy_undead` |
| 敵名 | 歩死者（アンデッド） |
| 備考 | 回復魔法・聖属性に弱い設定（将来実装想定） |

```
params: type:battle, enemy:enemy_undead, next:arrive_fort, fail:end_failure
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
- BGM: `bgm_quest_calm` → 遭遇時 `bgm_battle`
