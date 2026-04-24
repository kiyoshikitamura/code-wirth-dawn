# クエスト仕様書：7008 — 野営地への薬草納品

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7008 |
| **Slug** | `qst_gen_mercy` |
| **クエスト種別** | 救援（Mercy） |
| **推奨レベル** | 2（Easy） |
| **難度** | 2 |
| **依頼主** | 救護団 |
| **出現条件** | 制限なし / 出現拠点: 全拠点 |
| **リピート** | リピート可能 |
| **難易度Tier** | Easy（rec_level: 2） |
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
Gold:100
```

---

## 3. シナリオノードフロー

```
start → gather_herbs（check_possession or 収集イベント） → deliver_herbs → end_success
  収集失敗 → end_failure
```

> **注意:** このクエストは戦闘がない「純粋な納品」クエスト。  
> 薬草アイテムを事前にインベントリに持っている場合は `check_possession` でショートカット可能。  
> 持っていない場合は採取イベントを経由する。

#### `start`（text）
```
救護団の野営地の位置を確認した。
まずは癒やし草を集めに向かう。森の外れに群生地があるはずだ。
```

#### `gather_herbs`（check_possession または text + reward）
```
癒やし草の採取。規定数に達するまで続ける。
params: type:check_possession, item_id:[癒やし草ID], quantity:3,
        next:deliver_herbs, fallback:gather_field
```

#### `gather_field`（text）
```
草むらをかき分けて癒やし草を探す。
しばらくして、規定の数を集めることができた。
→ 次ノード: deliver_herbs（auto-advance）
```

#### `deliver_herbs`（check_delivery）
```
野営地に到着。修道女に薬草を手渡す。
params: type:check_delivery, item_id:[癒やし草ID], quantity:3, next:end_success
```

#### `end_success`（end, result: success）
```
薬草の納品完了。修道女が深々と頭を下げた。
「これで、何人かは助けられます。ありがとうございます」
```

#### `end_failure`（end, result: failure）
```
薬草が集められなかった。野営地の人々には申し訳ない。
```

---

## 4. アイテム定義

| 項目 | 値 |
|-----|-----|
| 名称 | 癒やし草 |
| スラッグ | `item_healing_herb`（要確認） |
| 数量 | 3個（納品条件） |
| 入手方法 | フィールド採取 / ショップ購入 |

> **実装メモ:** 癒やし草がアイテムマスタに未登録の場合は追加が必要。ID確認後、このファイルに記載すること。

---

## 5. CSVエントリ

```csv
7008,qst_gen_mercy,野営地への薬草納品,2,2,1,all,,,,,Gold:100|Justice:5,救護団,[納品] 傷ついた難民のため、癒やし草を規定数集める。
```

---

## 6. 実装チェックリスト

- [ ] 癒やし草アイテムIDが確定しDBに登録済み
- [ ] `check_possession` で事前所持チェックが機能する
- [ ] `check_delivery` で消費＆完了処理が正しく動作する
- [ ] Justice +5 アライメント変動が適用される

---

## 7. 拡張メモ

- 薬草採取中にモンスターが出現するランダムイベント（`random_branch`）
- 修道女が「実はもっと大変な状況」を明かすフレーバー会話ノード
