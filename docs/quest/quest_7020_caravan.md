# クエスト仕様書：7020 — 大砂漠の長距離交易護衛

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7020 |
| **Slug** | `qst_mar_caravan` |
| **クエスト種別** | マルカンドクエスト（Markand） |
| **推奨レベル** | 5（Normal） |
| **難度** | 2 |
| **依頼主** | 交易商会 |
| **出現条件** | 制限なし / 出現拠点: loc_marcund |
| **リピート** | リピート可能 |
| **難易度Tier** | Normal（rec_level: 5） |
| **経過日数 (time_cost)** | 1（成功: 1日 / 失敗: 1日） |
| **ノード数** | 7ノード（うち選択肢2件） |
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
Gold:800
```

---

## 3. シナリオノードフロー

```
start → join_caravan → travel_desert → battle_bandits
  ├─ 勝利 → midpoint_rest → sandstorm → battle_beast
  │    ├─ 勝利 → arrive_destination → leave_caravan → end_success
  │    └─ 敗北 → end_failure
  └─ 敗北 → end_failure
```

#### `start`（text）
```
交易商会の隊長から依頼を受けた。砂漠横断の護衛任務だ。
商隊はラクダ20頭の大規模編成。出発前から砂埃が舞っている。
```

#### `join_caravan`（join）
```
params: type:join, npc_slug:npc_caravan_leader, is_escort_target:false, next:travel_desert
```
> is_escort_target: false —— 隊長の死亡は即失敗ではなく、商品の消失が失敗条件。

#### `travel_desert`（text）
```
砂漠に入って半日。地平線まで砂砂砂だ。
そこに砂煙が上がった——砂漠の盗賊だ。商隊を狙っている。
```

#### `battle_bandits`（battle）
**演出パラメータ:**
- **BGM**: `[要定義: 例 bgm_battle_normal]`

| 設定 | 値 |
|-----|-----|
| 敵グループ | `enemy_desert_bandit` |
| 敵名 | 砂漠の盗賊 |

```
params: type:battle, enemy_group_id:[要定義: enemy_desert_bandit が含まれるグループ], next:midpoint_rest, fail:end_failure
```

#### `midpoint_rest`（text）
```
盗賊を撃退した。商隊はオアシスで小休止。
「よくやった。後半も頼む」と隊長が言った。
```

#### `sandstorm`（text）
```
砂嵐が起きた。視界が塞がれた瞬間、砂の中から巨大な影が現れた。
砂漠の魔獣だ——キャラバンを獲物と判断している。
```

#### `battle_beast`（battle）
**演出パラメータ:**
- **BGM**: `[要定義: 例 bgm_battle_normal]`

| 設定 | 値 |
|-----|-----|
| 敵グループ | `enemy_sand_beast` |
| 敵名 | 砂漠の魔獣 |
| 備考 | HP高め・ボス格。第2戦のため強め設定 |

```
params: type:battle, enemy_group_id:[要定義: enemy_sand_beast が含まれるグループ], next:arrive_destination, fail:end_failure
```

#### `arrive_destination`（text）
```
砂漠を抜け、目的地の交易都市に到着した。
商品は全て無事。商会の代理人が笑顔で出迎えてくれた。
```

#### `leave_caravan`（leave）
```
params: type:leave, npc_slug:npc_caravan_leader, next:end_success
```

#### `end_success` / `end_failure`
（標準定義）

---

## 4. CSVエントリ

```csv
7020,qst_mar_caravan,大砂漠の長距離交易護衛,2,2,1,loc_marcund,,,,,Gold:800,交易商会,[護衛] 広大な砂漠を越える商隊の用心棒。盗賊と魔獣の連戦を耐え抜け。
```

---

## 5. 実装チェックリスト

- [ ] 出現拠点 `loc_marcund` のみ
- [ ] `enemy_desert_bandit` がDBに登録済み
- [ ] `enemy_sand_beast` がDBに登録済み（HP高め・ボス設定）
- [ ] 2連戦フローが正しく動作する

---

## 6. 拡張メモ

- 砂漠オアシスでの`camp`ノード（HP回復・デッキ調整）
- 商品の種類によって報酬が変動するシステム（将来実装）
