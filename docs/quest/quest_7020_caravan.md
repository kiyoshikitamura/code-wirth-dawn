# クエスト仕様書：7020 — 大砂漠の長距離交易護衛

## 0. メタデータ

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7020 |
| **Slug** | `qst_mar_caravan` |
| **種別** | 護衛（Escort + Battle） |
| **依頼主** | 交易商会 |
| **推奨Lv / 難度** | 5（Normal） / 2 |
| **所要日数** | 成功:1 / 失敗:1 |
| **出現拠点** | `loc_marcund`（マルカンド） |
| **出現条件** | 出現国: マルカンド |
| **リピート** | リピート可能 |
| **難易度Tier** | Normal（rec_level: 5） |
| **サムネイル画像** | `/images/quests/bg_desert.png` |

※BGM、SE、進行中の背景画像などはノードごとに指定します。
| **受注条件** | なし |
| **敵スラッグ** | `enemy_desert_bandit`（砂漠の盗賊）、`enemy_sand_beast`（砂漠の魔獣） |

---

## 1. クエスト説明

### 短文（ボード表示・40字以内）
```
砂漠の商隊護衛。盗賊と魔獣の連戦を耐え抜け。
```

### 長文（詳細モーダル）
```
マルカンドの交易商会からの長期護衛依頼だ。
広大な砂漠を横断する商隊の用心棒。
道中には砂漠の盗賊が出没し、さらに砂嵐の中からは魔獣が現れることもある。
商隊のキャラバンには絹や香辛料が積まれており、奪われれば商会に大打撃となる。
「一度受けたら途中放棄はない。最後まで商隊と共に歩め」——依頼主はそう念を押した。
報酬は高いが、それ相応の覚悟が要る仕事だ。
```

---

## 2. 報酬

| 種別 | 値 |
|-----|-----|
| Gold | 800G |

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
