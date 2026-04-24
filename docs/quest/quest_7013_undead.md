# クエスト仕様書：7013 — 遺体安置所の亡者討伐

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7013 |
| **Slug** | `qst_rol_undead` |
| **クエスト種別** | 聖王国クエスト（Roland） |
| **推奨レベル** | 4（Normal） |
| **難度** | 2 |
| **依頼主** | 聖騎士団 |
| **出現条件** | 制限なし / 出現拠点: loc_holy_empire |
| **リピート** | リピート可能 |
| **難易度Tier** | Normal（rec_level: 4） |
| **経過日数 (time_cost)** | 1（成功: 1日 / 失敗: 1日） |
| **ノード数** | 4ノード（うち選択肢2件） |
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
Gold:300
```

---

## 3. シナリオノードフロー

```
start → enter_mortuary → battle_undead_01 → deeper
  └─ battle_undead_02 → find_source → purge → end_success
各バトル敗北 → end_failure
```

#### `start`（text）
```
聖騎士団の急ぎ依頼。
遺体安置所の地下で死者が歩き回っているという。
松明を手に入口の石段を降りると、腐敗臭と冷気が押し寄せてきた。
```

#### `enter_mortuary`（text）
```
薄暗い回廊の奥で、うめき声が聞こえる。
棚に並んでいた遺体の一つが、こちらに向き直った。
```

#### `battle_undead_01`（battle）
**演出パラメータ:**
- **BGM**: `[要定義: 例 bgm_battle_normal]`

| 設定 | 値 |
|-----|-----|
| 敵グループ | `enemy_undead` |
| 敵名 | 歩死者 |
| 備考 | 第1波：2〜3体想定 |

```
params: type:battle, enemy_group_id:[要定義: enemy_undead が含まれるグループ], next:deeper, fail:end_failure
```

#### `deeper`（text）
```
最初の群れを仕留めた。
更に奥へ進むと、瘴気の濃さが増している。床が冷たく湿っている。
```

#### `battle_undead_02`（battle）
```
params: type:battle, enemy_group_id:[要定義: enemy_undead が含まれるグループ], next:find_source, fail:end_failure
```
> 第2波：個体強化版（`enemy_undead_elder`など）を想定。

#### `find_source`（text）
```
最奥の祭壇の下に、黒い石が埋め込まれていた。
これが瘴気の源だ。強い不浄の気が石から滲み出している。
```
- 選択肢: 「石を叩き割る」→ `purge`

#### `purge`（text）
```
石を破壊すると、室内を満たしていた瘴気が一気に散った。
亡者たちが糸の切れた人形のように倒れていく。
```

#### `end_success`（end, result: success）
```
亡者の討伐と瘴気源の除去、完了。聖騎士団からの報酬を受け取った。
```

#### `end_failure`（end, result: failure）
```
亡者の群れに押し返された。遺体安置所は今も閉鎖されたままだ。
```

---

## 4. CSVエントリ

```csv
7013,qst_rol_undead,遺体安置所の亡者討伐,2,2,1,loc_holy_empire,,,,,Gold:300,聖騎士団,[討伐] 瘴気によって動き出した腐乱死体たちを土へと還す。
```

---

## 5. 実装チェックリスト

- [ ] 出現拠点が `loc_holy_empire` のみ
- [ ] `enemy_undead` がDBに登録済み
- [ ] 2連戦フローが正しく遷移する
- [ ] 第2波強化敵（亜種）の定義

---

## 6. 拡張メモ

- 瘴気石が「誰かが意図的に設置した」ことが判明するフレーバー（謀略要素）
