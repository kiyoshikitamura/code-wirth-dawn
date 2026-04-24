# クエスト仕様書：7041 — 仙丹の材料となる霊草採集

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7041 |
| **Slug** | `qst_har_herb` |
| **クエスト種別** | 華龍クエスト（Karyu） |
| **推奨レベル** | 7（Normal） |
| **難度** | 2 |
| **依頼主** | 宦官 |
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
Gold:300
```

---

## 3. シナリオノードフロー

```
start → receive_map → mountain_climb → find_herb（check_possession）
  ├─ 所持している → deliver_herb → end_success
  └─ 所持なし → gather_site → collect（reward）→ deliver_herb → end_success
gather途中で random_branch 40% → 守護獣登場 → battle → 続行
```

#### `start`（text）
```
宦官から霊草の図絵と地図を受け取った。
「慎重に扱ってください。折れると薬効が落ちます」
山の奥へ向かう。
```

#### `mountain_climb`（text）
```
断崖にそびえる岩場を登る。
霧が深く、足もとが滑る。慎重に進んだ。
```

#### `find_herb`（text + random_branch）
```
岩棚の端に、白い花をつけた植物が自生していた——霊草だ。
だが、近くに何かの気配がある。
params: type:random_branch, prob:40, next:guardian_beast, fallback:collect
```

#### `guardian_beast`（battle）
**演出パラメータ:**
- **BGM**: `[要定義: 例 bgm_battle_normal]`

| 設定 | 値 |
|-----|-----|
| 敵グループ | `enemy_mountain_beast` |
| 敵名 | 霊草の守護獣 |
| 備考 | HP中程度・守護兽のため自然属性（将来実装）|

```
params: type:battle, enemy_group_id:[要定義: enemy_mountain_beast が含まれるグループ], next:collect, fail:end_failure
```

#### `collect`（reward）
```
霊草を丁寧に採取した。清潔な布で包む。
params: type:reward, item_id:[霊草ID], quantity:3, next:deliver_herb
```

#### `deliver_herb`（check_delivery）
```
宦官の元へ戻り、霊草を手渡す。
params: type:check_delivery, item_id:[霊草ID], quantity:3, next:end_success
```

---

## 4. CSVエントリ

```csv
7041,qst_har_herb,仙丹の材料となる霊草採集,2,2,1,loc_haryu,,,,,Gold:300|Vitality:1,宦官,[納品] 寿命を幾ばくか延ばす仙丹の材料。稀少な霊草を宦官へ納品。
```

---

## 5. 実装チェックリスト

- [ ] 出現拠点 `loc_haryu` のみ
- [ ] 霊草のアイテムIDが確定・DBに登録済み
- [ ] `enemy_mountain_beast` がDBに登録済み
- [ ] Vitality +1 の効果が正しく適用される（仕様確認要）

---

## 6. 拡張メモ

- 宦官の依頼内容が「実は毒薬」だった場合の裏ルート（Will来実装）
- 霊草採取量に応じた追加報酬システム
