# クエスト仕様書：7031 — 隠密の密書傍受

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7031 |
| **Slug** | `qst_yat_ninja` |
| **クエスト種別** | 矢渡クエスト（Yato） |
| **推奨レベル** | 6（Normal） |
| **難度** | 2 |
| **依頼主** | 忍び衆 |
| **出現条件** | 制限なし / 出現拠点: loc_yatoshin |
| **リピート** | リピート可能 |
| **難易度Tier** | Normal（rec_level: 6） |
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
Gold:550
```

---

## 3. シナリオノードフロー

```
start → locate_spy → ambush → battle_spy
  ├─ 勝利 → take_document → deliver_document → end_success
  └─ 敗北 → end_failure（間者逃亡）
```

#### `start`（text）
```
忍び衆の使者から情報を受け取った。
間者は今夜、旅人のふりをして北の関所へ向かっているはずだ。
先回りする。
```

#### `locate_spy`（text）
```
関所手前の林道で、旅姿の男とその護衛らしき二名を見つけた。
確かに動きが旅人のものではない——間者で間違いない。
```

#### `ambush`（text）
```
暗がりから飛び出した。間者が叫ぶ前に護衛と刃を交える。
「誰だ！」
```

#### `battle_spy`（battle）
**演出パラメータ:**
- **BGM**: `[要定義: 例 bgm_battle_normal]`

| 設定 | 値 |
|-----|-----|
| 敵グループ | `enemy_spy` |
| 敵名 | 他国の間者と護衛 |
| 備考 | 素早い・状態異常使用型（毒・混乱）の想定 |

```
params: type:battle, enemy_group_id:[要定義: enemy_spy が含まれるグループ], next:take_document, fail:end_failure
```

#### `take_document`（text）
```
間者を制圧した。懐から黒い巻物が出てきた——密書だ。
内容は見ない。それがこの仕事のルールだ。
```

#### `deliver_document`（check_delivery）
```
指定された場所で忍び衆の連絡員に密書を手渡した。
params: type:check_delivery, item_id:[密書ID], quantity:1, next:end_success
```

> **実装メモ:** 密書は一時的なキーアイテムとして付与・消費する。`reward` ノードで付与後、`check_delivery` で消費する。

#### `end_success` / `end_failure`
（標準定義）

---

## 4. CSVエントリ

```csv
7031,qst_yat_ninja,隠密の密書傍受,2,2,1,loc_yatoshin,,,,,Gold:550,忍び衆,[襲撃] 他国の間者を辻斬りのごとく排除し、密書を奪取して届けよ。
```

---

## 5. 実装チェックリスト

- [ ] 出現拠点 `loc_yatoshin` のみ
- [ ] `enemy_spy` がDBに登録済み（素早い・状態異常型）
- [ ] 密書のキーアイテムIDが確定・DBに登録済み
- [ ] reward → check_delivery フローが正しく動作する

---

## 6. 拡張メモ

- 「密書の内容を読む」選択肢（内容フレーバー + Chaos変動）
- 間者を「捕縛」vs「殺害」で結末フレーバーが変わる分岐
