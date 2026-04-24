# クエスト仕様書：7015 — 盗まれた聖遺物の奪還

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7015 |
| **Slug** | `qst_rol_relic` |
| **クエスト種別** | 聖王国クエスト（Roland） |
| **推奨レベル** | 4（Normal） |
| **難度** | 2 |
| **依頼主** | 教会 |
| **出現条件** | 制限なし / 出現拠点: loc_holy_empire |
| **リピート** | リピート可能 |
| **難易度Tier** | Normal（rec_level: 4） |
| **経過日数 (time_cost)** | 1（成功: 1日 / 失敗: 1日） |
| **ノード数** | 5ノード（うち選択肢4件） |
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
start → locate_hideout → assault_entry → battle_bandits_01 → inside
  └─ battle_bandits_02 → find_relic → end_success
各バトル敗北 → end_failure
```

#### `start`（text）
```
教会から依頼。盗まれた聖杯の奪還だ。
情報提供者から廃屋の場所を聞き、そこへ向かう。
```

#### `locate_hideout`（text）
```
郊外の廃屋に近づくと、見張りの男が立っているのが見えた。
正面突破が手っ取り早い。
```
- 選択肢: 「急いで突入する」→ `assault_entry`

#### `assault_entry`（text）
```
見張りが声を上げる前に飛びかかった。アジト内が一気に騒がしくなる。
「盗人返しか！ 殺せ！」
```

#### `battle_bandits_01`（battle）
**演出パラメータ:**
- **BGM**: `[要定義: 例 bgm_battle_normal]`

| 設定 | 値 |
|-----|-----|
| 敵グループ | `enemy_bandit_thug` |
| 敵名 | 盗賊団の構成員 |

```
params: type:battle, enemy_group_id:[要定義: enemy_bandit_thug が含まれるグループ], next:inside, fail:end_failure
```

#### `inside`（text）
```
入口の盗賊を退けた。廃屋の奥から、ボスと思しき大柄な男が出てきた。
「その杯は俺たちのもんだ。売れば相当な値になる」
```

#### `battle_bandits_02`（battle）
```
params: type:battle, enemy_group_id:[要定義: enemy_bandit_thug が含まれるグループ], next:find_relic, fail:end_failure
```
> 第2戦はボス格。HP/ATKを増強した個体想定。

#### `find_relic`（text）
```
ボスを倒すと、机の上に金布で包まれた聖杯があった。
傷一つなかった。教会へ持ち帰る。
```

#### `end_success`（end, result: success）
```
聖遺物の奪還完了。大司祭から報酬と短い礼を受け取った。
```

#### `end_failure`（end, result: failure）
```
盗賊団の守りは予想以上に堅かった。撤退を余儀なくされた。
```

---

## 4. CSVエントリ

```csv
7015,qst_rol_relic,盗まれた聖遺物の奪還,2,2,1,loc_holy_empire,,,,,Gold:450,教会,[奪還] 盗賊団のアジトを襲撃し、教会から盗まれた聖杯を奪い返す。
```

---

## 5. 実装チェックリスト

- [ ] 出現拠点 `loc_holy_empire` のみ
- [ ] `enemy_bandit_thug` がDBに登録済み
- [ ] 2連戦（ボス戦含む）フローが正しく動作する
- [ ] 奪還完了ノードで物語的な締めが描写される

---

## 6. 拡張メモ

- 「聖杯を持ち逃げして別場所に売る」裏切り選択肢（Evil変動・高報酬別ルート）
- ボスが聖杯を盗んだ理由のフレーバー（病気の娘の薬代など）
