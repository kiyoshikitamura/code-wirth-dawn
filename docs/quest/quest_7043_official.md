# クエスト仕様書：7043 — 巡検使の護衛と汚職隠蔽

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7043 |
| **Slug** | `qst_har_official` |
| **クエスト種別** | 華龍クエスト（Karyu） |
| **推奨レベル** | 7（Normal） |
| **難度** | 2 |
| **依頼主** | 悪徳官僚 |
| **出現条件** | 制限なし / 出現拠点: loc_haryu |
| **リピート** | リピート可能 |
| **難易度Tier** | Normal（rec_level: 7） |
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
Gold:500
```

---

## 3. シナリオノードフロー

```
start → join_official → patrol_night
  └─ battle_assassin_wave_01 → investigation_day
       └─ battle_assassin_wave_02（宮殿内）→ inspection_over → leave_official → end_success
各バトル敗北 → end_failure
```

#### `start`（text）
```
悪徳官僚・薛の屋敷に呼ばれた。
賄賂で肥え太った男だということは、その内装を見て一目で分かった。
「命さえ守れば、他は問わない」と薛は言った。
```

#### `join_official`（join）
```
params: type:join, npc_slug:npc_corrupt_official, is_escort_target:true, next:patrol_night
```

#### `patrol_night`（text）
```
夜の屋敷の見回りを開始した。
庭の暗がりに、影が動いた。
```

#### `battle_assassin_wave_01`（battle）
**演出パラメータ:**
- **BGM**: `[要定義: 例 bgm_battle_normal]`

| 設定 | 値 |
|-----|-----|
| 敵グループ | `enemy_assassin` |
| 敵名 | 刺客（第1波） |
| 備考 | 素早い・先制攻撃あり（将来実装） |

```
params: type:battle, enemy_group_id:[要定義: enemy_assassin が含まれるグループ], next:investigation_day, fail:end_failure
```

#### `investigation_day`（text）
```
翌朝、巡検使が屋敷に到着した。
薛はにこにこと応対しているが、巡検使の目は鋭い。
——そして夕方、もう一波が来た。
```

#### `battle_assassin_wave_02`（battle）
```
params: type:battle, enemy_group_id:[要定義: enemy_assassin が含まれるグループ], next:inspection_over, fail:end_failure
```

#### `inspection_over`（text）
```
巡検使が去っていった。薛は「問題なかった」と安堵した顔を見せた。
何が「問題ない」のかは分かり切っている。
```

#### `leave_official`（leave）
```
params: type:leave, npc_slug:npc_corrupt_official, next:end_success
```

#### `end_success` / `end_failure`
（標準定義）

---

## 4. NPC定義：薛官僚

| 項目 | 値 |
|-----|-----|
| Slug | `npc_corrupt_official` |
| 名前 | 薛（せつ） |
| 役割 | 護衛対象（is_escort_target: true） |
| HP | 40（非常に低い） |
| 戦闘参加 | なし（潔癖に逃げ回る） |

---

## 5. CSVエントリ

```csv
7043,qst_har_official,巡検使の護衛と汚職隠蔽,2,2,1,loc_haryu,,,,,Gold:500|Chaos:10,悪徳官僚,[護衛] 賄賂で肥え太った悪徳官僚を守り抜き、暗殺者の刃から匿う。
```

---

## 6. 実装チェックリスト

- [ ] 出現拠点 `loc_haryu` のみ
- [ ] `npc_corrupt_official` がDBに登録済み
- [ ] `enemy_assassin` がDBに登録済み（素早い・先制型）
- [ ] is_escort_target で薛のHP=0が即 end_failure になる
- [ ] Chaos +10 アライメント変動が適用される

---

## 7. 拡張メモ

- 「暗殺者に加担して薛を見殺しにする」隠し選択肢（Justice変動・依頼失敗・フレーバーのみ）
- 暗殺の依頼主が誰かを調査する後続クエスト
