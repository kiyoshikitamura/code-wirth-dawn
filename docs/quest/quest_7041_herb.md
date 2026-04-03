# クエスト仕様書：7041 — 仙丹の材料となる霊草採集

## 0. メタデータ

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7041 |
| **Slug** | `qst_har_herb` |
| **種別** | 採集＋納品（Gathering + Delivery） |
| **依頼主** | 宦官 |
| **推奨Lv / 難度** | 2 / 2 |
| **所要日数** | 成功:1 / 失敗:1 |
| **出現拠点** | `loc_haryu` |
| **受注条件** | なし |
| **道徳的傾向** | 活力（Vitality +1） |

---

## 1. クエスト説明

### 短文（ボード表示・40字以内）
```
仙丹の材料となる希少な霊草を採取し、宦官に納品せよ。
```

### 長文（詳細モーダル）
```
华龍神朝の後宮を仕切る宦官から依頼が来た。
皇帝への献上品として「長寿仙丹」を調合したいが、
材料となる「霊草（れいそう）」が不足しているという。
霊草は深山の断崖近くにのみ自生しており、通常の薬師では取りに行けない。
素養のある冒険者に採取を頼みたいとのことだ。
植物の知識がなくても、宦官が書いた図絵を参考にすれば判別できる。
危険な場所だが——「十分なる謝礼は必ず」と宦官は言った。
```

---

## 2. 報酬

| 種別 | 値 |
|-----|-----|
| Gold | 300G |
| アライメント | Vitality +1 |

```
Gold:300|Vitality:1
```

> **Vitality:** プレイヤーの最大HP上限に関わるステータス（現仕様確認要）。

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
| 設定 | 値 |
|-----|-----|
| 敵スラッグ | `enemy_mountain_beast` |
| 敵名 | 霊草の守護獣 |
| 備考 | HP中程度・守護兽のため自然属性（将来実装）|

```
params: type:battle, enemy:enemy_mountain_beast, next:collect, fail:end_failure
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
- BGM: `bgm_quest_calm`（山岳・静かな自然）
