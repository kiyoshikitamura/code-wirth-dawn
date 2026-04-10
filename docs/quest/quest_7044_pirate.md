# クエスト仕様書：7044 — 沿岸を荒らす海賊の討伐

## 0. メタデータ

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7044 |
| **Slug** | `qst_har_pirate` |
| **種別** | 討伐（Battle） |
| **依頼主** | 港町の長 |
| **推奨Lv / 難度** | 2 / 2 |
| **所要日数** | 成功:1 / 失敗:1 |
| **出現拠点** | `loc_haryu` |
| **出現条件** | 特になし（常時） |
| **サムネイル画像** | `/images/quests/bg_river.png` |

※BGM、SE、進行中の背景画像などはノードごとに指定します。
| **受注条件** | なし |
| **敵スラッグ** | `enemy_pirate`（水賊） |

---

## 1. クエスト説明

### 短文（ボード表示・40字以内）
```
港を荒らす水賊の拠点に奇襲をかけ、利益を奪い返せ。
```

### 長文（詳細モーダル）
```
华龍神朝の港町から緊急の依頼が来た。
沿岸を拠点に活動する水賊（海賊）の集団が、
交易船を次々に襲っており、港に荷が届かなくなっている。
町の長は「待っていては商いが干上がる。向こうから潰せ」という結論に達した。
水賊の船が停泊している入り江は掴んでいる。
奇襲をかけて制圧し、奪われた荷物のいくらかを取り返してほしい——
それが「奪い返した利益」として報酬に加算される。
```

---

## 2. 報酬

| 種別 | 値 |
|-----|-----|
| Gold | 400G |

```
Gold:400
```

---

## 3. シナリオノードフロー

```
start → approach_cove → surprise_attack → battle_pirates_deck
  ├─ 勝利 → board_ship → battle_pirates_captain
  │    ├─ 勝利 → reclaim_cargo → end_success
  │    └─ 敗北 → end_failure
  └─ 敗北 → end_failure
```

#### `start`（text）
```
港町の長から地図と依頼書を受け取った。
水賊の船が停泊する入り江は、岬の裏側にある——夜明け前に近づけば奇襲が成功するはずだ。
```

#### `approach_cove`（text）
```
夜明けの暗い内に、入り江へ接近した。
船が3隻停泊している。上甲板に見張りの影が動いている。
```
- 選択肢: 「突入する」→ `surprise_attack`

#### `surprise_attack`（text）
```
「敵だ！ 陸から来た！！」
奇襲は気づかれたが、混乱は続いている。今が勝機だ。
```

#### `battle_pirates_deck`（battle）
**演出パラメータ:**
- **BGM**: `[要定義: 例 bgm_battle_normal]`

| 設定 | 値 |
|-----|-----|
| 敵グループ | `enemy_pirate` |
| 敵名 | 水賊（甲板員） |

```
params: type:battle, enemy_group_id:[要定義: enemy_pirate が含まれるグループ], next:board_ship, fail:end_failure
```

#### `board_ship`（text）
```
旗艦の甲板を制圧した。船倉から叫び声が聞こえる——水賊の頭が奥にいるのだろう。
```

#### `battle_pirates_captain`（battle）
```
params: type:battle, enemy_group_id:[要定義: enemy_pirate が含まれるグループ], next:reclaim_cargo, fail:end_failure
```
> 水賊の頭目：`enemy_pirate_captain`（強化版）として定義。

#### `reclaim_cargo`（text）
```
頭目を倒し、船倉を確認した。
絹布、陶磁器、茶箱——町から奪われた荷物が積み上がっていた。
これを港に返す。
```

#### `end_success`（end, result: success）
```
水賊討伐完了。港町の長から報酬を受け取った。
「港が静かになる——ありがたい」
```

#### `end_failure`（end, result: failure）
```
水賊の抵抗は予想以上に激しかった。撤退した。
```

---

## 4. CSVエントリ

```csv
7044,qst_har_pirate,沿岸を荒らす海賊の討伐,2,2,1,loc_haryu,,,,,Gold:400,港町の長,[討伐] 沿岸の交易船を襲う水賊の拠点へ奇襲をかけ、利益を奪い返す。
```

---

## 5. 実装チェックリスト

- [ ] 出現拠点 `loc_haryu` のみ
- [ ] `enemy_pirate` がDBに登録済み
- [ ] `enemy_pirate_captain`（頭目・強化版）がDBに登録済み
- [ ] 2連戦（ボス戦含む）フローが正しく動作する

---

## 6. 拡張メモ

- 奪還した荷物の量によるボーナス報酬（将来実装）
- 水賊の船を使った移動システム（将来のロケーション拡張と連携）
