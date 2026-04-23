# クエスト仕様書：7043 — 巡検使の護衛と汚職隠蔽

## 0. メタデータ

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7043 |
| **Slug** | `qst_har_official` |
| **種別** | 護衛（Escort + Battle） |
| **依頼主** | 悪徳官僚 |
| **推奨Lv / 難度** | 7（Normal） / 2 |
| **所要日数** | 成功:1 / 失敗:1 |
| **出現拠点** | `loc_haryu` |
| **出現条件** | 出現国: 華龍国 |
| **リピート** | リピート可能 |
| **難易度Tier** | Normal（rec_level: 7） |
| **サムネイル画像** | `/images/quests/bg_office.png` |

※BGM、SE、進行中の背景画像などはノードごとに指定します。
| **受注条件** | なし |
| **敵スラッグ** | `enemy_assassin`（暗殺者） |
| **道徳的傾向** | 混沌（Chaos +10） |

---

## 1. クエスト説明

### 短文（ボード表示・40字以内）
```
悪徳官僚を暗殺者から守り抜き、巡検使を丸め込め。
```

### 長文（詳細モーダル）
```
华龍神朝の悪徳官僚・薛（せつ）から依頼が届いた。
中央政府から「巡検使」が派遣されており、自分の汚職が発覚しそうだという。
しかし同時に、義憤を覚えた何者かが自分を殺そうとしているらしい。
依頼内容は二つ——「暗殺者を排除すること」「巡検使が調査する間、自分を守ること」。
暗殺者の依頼主が誰かは分かっていない。
このクソのような官僚を守り抜くことで、お前に何が残るか——よく考えてから受けてくれ。
```

---

## 2. 報酬

| 種別 | 値 |
|-----|-----|
| Gold | 500G |
| アライメント | Chaos +10 |

```
Gold:500|Chaos:10
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
