# クエスト仕様書：7012 — 聖地巡礼者の護衛

## 0. メタデータ

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7012 |
| **Slug** | `qst_rol_pilgrim` |
| **種別** | 護衛（Escort） |
| **依頼主** | 教会 |
| **推奨Lv / 難度** | 2 / 2 |
| **所要日数** | 成功:1 / 失敗:1 |
| **出現拠点** | `loc_holy_empire` |
| **出現条件** | 特になし（常時） |
| **サムネイル画像** | `/images/quests/bg_mountain.png` |

※BGM、SE、進行中の背景画像などはノードごとに指定します。
| **受注条件** | なし |
| **敵スラッグ** | `enemy_bandit_thug`（山賊） |

---

## 1. クエスト説明

### 短文（ボード表示・40字以内）
```
狂信的な巡礼者を聖地まで護衛せよ。彼が死ねば報酬はない。
```

### 長文（詳細モーダル）
```
教会から護衛依頼が来た。
依頼人の「巡礼者アルバート」は信仰心が篤い……いや、少々常軌を逸している。
地図も持たず、護衛の言葉も聞かず、信仰の赴くままに聖地を目指して歩き始める男だ。
頼まれた護衛としては、彼が無事に聖地へ到着することだけを目的にすればいい。
山賊がよく出る峠道を通ることになるが、彼は頑として別の道を受け入れない。
「神が守ってくださる」と言い張る男の命を、お前が守るしかない。
```

---

## 2. 報酬

| 種別 | 値 |
|-----|-----|
| Gold | 500G |

```
Gold:500
```

---

## 3. シナリオノードフロー

```
start → join_pilgrim → travel →峠でrandom_branch
  ├─ [70%] → mountain_ambush → battle_bandit
  │    ├─ 勝利 → arrive_shrine → leave_pilgrim → end_success
  │    └─ 敗北 → end_failure（巡礼者死亡）
  └─ [30%] → arrive_shrine → leave_pilgrim → end_success
```

#### `start`（text）
```
教会の依頼。聖地への巡礼者アルバートの護衛だ。
会ってみると——思った以上に話が通じない人物だった。
「神の意志が道を開く。案ずるでない」
```

#### `join_pilgrim`（join）
```
params: type:join, npc_slug:npc_pilgrim_albert, is_escort_target:true, next:travel
```
> **is_escort_target: true** — アルバートのHP=0で即 `end_failure` 遷移。

#### `travel`（text）
```
峠道へ差し掛かった。険しい岩場が続く。
山賊が多く出ると聞く道だが、アルバートは歩みを止める気配がない。
```

#### `mountain_ambush`（random_branch）
```
params: type:random_branch, prob:70, next:battle_bandit, fallback:arrive_shrine
```

#### 遭遇テキスト（text）
```
「金目のものを出せ！」
岩陰から山賊たちが飛び出してきた。
アルバートは「祈りの最中だ、邪魔するでない」と全く動じない。
```

#### `battle_bandit`（battle）
**演出パラメータ:**
- **BGM**: `[要定義: 例 bgm_battle_normal]`

| 設定 | 値 |
|-----|-----|
| 敵グループ | `enemy_bandit_thug` |
| 敵名 | 山賊 |

```
params: type:battle, enemy_group_id:[要定義: enemy_bandit_thug が含まれるグループ], next:arrive_shrine, fail:end_failure
```

#### `arrive_shrine`（text）
```
聖地の祠に到着した。
アルバートは跪いて長い祈りを始めた。
「……お前がいてくれてよかったかもしれぬ」と、珍しく素直な言葉が出た。
```

#### `leave_pilgrim`（leave）
```
params: type:leave, npc_slug:npc_pilgrim_albert, next:end_success
```

#### `end_success`（end, result: success）
```
護衛完了。教会から報酬を受け取った。アルバートは今もそこで祈り続けているだろう。
```

#### `end_failure`（end, result: failure）
```
アルバートが倒れた。護衛失敗。教会からの報酬はない。
```

---

## 4. NPC定義：アルバート

| 項目 | 値 |
|-----|-----|
| Slug | `npc_pilgrim_albert` |
| 名前 | アルバート |
| 役割 | 護衛対象（is_escort_target: true） |
| HP | 20（非常に低い） |
| 戦闘参加 | なし |
| 死亡時 | 即 end_failure |

---

## 5. CSVエントリ

```csv
7012,qst_rol_pilgrim,聖地巡礼者の護衛,2,2,1,loc_holy_empire,,,,,Gold:500,教会,[護衛] 狂信的な巡礼者を護送する。彼が死ねば報酬はない。
```

---

## 6. 実装チェックリスト

- [ ] 出現拠点が `loc_holy_empire` のみ
- [ ] `npcs` テーブルに `npc_pilgrim_albert` が登録済み
- [ ] `enemy_bandit_thug` が登録済み
- [ ] is_escort_target が正しく機能する

---

## 7. 拡張メモ

- アルバートが戦闘中に祈りで「HP自動回復」するフレーバー（実装上は微量回復）
