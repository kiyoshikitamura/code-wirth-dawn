# クエスト仕様書：7040 — 死者の還る山の浄化

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7040 |
| **Slug** | `qst_har_jiangshi` |
| **クエスト種別** | 華龍クエスト（Karyu） |
| **推奨レベル** | 7（Normal） |
| **難度** | 2 |
| **依頼主** | 道士 |
| **出現条件** | 制限なし / 出現拠点: loc_haryu |
| **リピート** | リピート可能 |
| **難易度Tier** | Normal（rec_level: 7） |
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
Gold:350
```

---

## 3. シナリオノードフロー

```
start → receive_talisman → enter_mountain → jiangshi_group_01（battle）
  ├─ 勝利 → deeper_mountain → jiangshi_group_02（battle）
  │    ├─ 勝利 → report_done → end_success
  │    └─ 敗北 → end_failure
  └─ 敗北 → end_failure
```

#### `start`（text）
```
老域士から護符の束を受け取った。
「額に貼ればキョンシーは止まる。近づいて貼る度胸があれば、の話だが」
```

#### `receive_talisman`（text）
```
霊山の登り口に来た。松の木の間に、ぴょんぴょんと跳ねる影が見える。
あれがキョンシーか。
```

#### `jiangshi_group_01`（battle）
**演出パラメータ:**
- **BGM**: `[要定義: 例 bgm_battle_normal]`

| 設定 | 値 |
|-----|-----|
| 敵グループ | `enemy_jiangshi` |
| 敵名 | キョンシー |
| 備考 | 斬撃無効・物理耐性高め。護符（特定カード）で有効打判定（将来実装）想定 |

```
params: type:battle, enemy_group_id:[要定義: enemy_jiangshi が含まれるグループ], next:deeper_mountain, fail:end_failure
```

#### `deeper_mountain`（text）
```
奥へ進むと、より大きなキョンシーが3体いた。
古い官服を着ている——生前は役人だったのかもしれない。
```

#### `jiangshi_group_02`（battle）
```
params: type:battle, enemy_group_id:[要定義: enemy_jiangshi が含まれるグループ], next:report_done, fail:end_failure
```

#### `report_done`（text）
```
全てのキョンシーを護符で鎮めた。
道士が山を登ってきて、静かに合掌した。
「おかげで彼らも安らかに眠れます」
```

#### `end_success` / `end_failure`
（標準定義）

---

## 4. CSVエントリ

```csv
7040,qst_har_jiangshi,死者の還る山の浄化,2,2,1,loc_haryu,,,,,Gold:350,道士,[討伐] 霊山をうろつくキョンシー（跳屍）たちを、護符の力で鎮める。
```

---

## 5. 実装チェックリスト

- [ ] 出現拠点 `loc_haryu` のみ
- [ ] `enemy_jiangshi` がDBに登録済み（物理耐性・護符カード連動は将来実装）
- [ ] 2連戦フローが正しく動作する

---

## 6. 拡張メモ

- 護符カード（バトル中アイテムとして使用）による弱点攻撃システム
- 役人キョンシーの背景フレーバー（腐敗した政治の犠牲者）
