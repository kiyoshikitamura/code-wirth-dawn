# クエスト仕様書：7042 — 辺境農民の反乱鎮圧

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7042 |
| **Slug** | `qst_har_rebel` |
| **クエスト種別** | 華龍クエスト（Karyu） |
| **推奨レベル** | 7（Normal） |
| **難度** | 2 |
| **依頼主** | 地方太守 |
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
Gold:450
```

---

## 3. シナリオノードフロー

```
start → approach_rebels → face_mob
  ├─ [選択: 強行鎮圧] → battle_farmers_01 → battle_farmers_02（首謀者）→ end_success
  └─ [選択: 引き下がる] → end_failure
各バトル敗北 → end_failure
```

#### `start`（text）
```
地方太守の役所で内密に依頼を受けた。
役所の外で、何百人もの農民が叫んでいる声が聞こえる。
これが「依頼」の全貌だ。
```

#### `approach_rebels`（text）
```
役所の外に出ると、日焼けした顔の農民たちが竹槍を掲げて押し寄せていた。
先頭に立つ男が叫んでいる。「俺たちは飢えているんだ！　聞いてくれ！」
```

#### `face_mob`（choice）
- 選択: 「制圧する」→ `battle_farmers_01`
- 選択: 「これはやりたくない——引き下がる」→ `end_failure`

#### `battle_farmers_01`（battle）
**演出パラメータ:**
- **BGM**: `[要定義: 例 bgm_battle_normal]`

| 設定 | 値 |
|-----|-----|
| 敵グループ | `enemy_rebel_farmer` |
| 敵名 | 反乱農民（群） |
| 備考 | ATK非常に低め・HP低め・多数。撃破するほど気が重い |

```
params: type:battle, enemy_group_id:[要定義: enemy_rebel_farmer が含まれるグループ], next:battle_farmers_02, fail:end_failure
```

#### `battle_farmers_02`（battle）
```
params: type:battle, enemy_group_id:[要定義: enemy_rebel_farmer が含まれるグループ], next:end_success, fail:end_failure
```
> 首謀者の農民リーダーを想定。ATK/HP微増の強化版。

#### `end_success`（end, result: success）
```
鎮圧完了。農民たちは散り散りになった。
太守から厚い礼金を受け取った。
……これが正しかったかどうかは、問わないことにした。
```

#### `end_failure`（end, result: failure）
```
制圧できなかった——あるいはしなかった。太守からの報酬はない。
```

---

## 4. CSVエントリ

```csv
7042,qst_har_rebel,辺境農民の反乱鎮圧,2,2,1,loc_haryu,,,,-50,Gold:450|Evil:10,地方太守,[鎮圧] 重税に苦しみ竹槍を持った農民の反乱軍を、容赦なく根絶やしにする。
```

---

## 5. 実装チェックリスト

- [ ] 出現拠点 `loc_haryu` のみ
- [ ] 受注条件 `max_reputation: -50` が機能する
- [ ] `enemy_rebel_farmer` がDBに登録済み（非常に弱い設定）
- [ ] Evil +10 アライメント変動が適用される

---

## 6. 拡張メモ

- 「農民側に加担して太守を裏切る」隠し選択肢（Justice変動・別報酬ルート）
- 鎮圧後に疫病や飢饉が悪化するフレーバー展開
