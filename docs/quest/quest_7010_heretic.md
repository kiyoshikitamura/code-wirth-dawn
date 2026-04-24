# クエスト仕様書：7010 — 異端者の粛清

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7010 |
| **Slug** | `qst_rol_heretic` |
| **クエスト種別** | 聖王国クエスト（Roland） |
| **推奨レベル** | 4（Normal） |
| **難度** | 2 |
| **依頼主** | 聖騎士団 |
| **出現条件** | 制限なし / 出現拠点: loc_holy_empire |
| **リピート** | リピート可能 |
| **難易度Tier** | Normal（rec_level: 4） |
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
Gold:400
```

---

## 3. シナリオノードフロー

```
start → locate_heretics → infiltrate
  └─ battle_heretics
       ├─ 勝利 → capture_leader → end_success
       └─ 敗北 → end_failure
```

#### `start`（text）
```
聖騎士団の副隊長から極秘の依頼を受けた。
異端者の集会所は、旧市街の廃教会の地下にあるという。
```

#### `locate_heretics`（text）
```
廃教会の地下へ降りると、怪しげな祭壇の前に集団が集まっていた。
彼らは武装している。こちらに気づくと——武器を構えた。
```

#### `infiltrate`（text）
```
「騎士団の犬め！」
異端者たちが一斉に飛びかかってきた。
```
- 選択肢: 「応戦する」→ `battle_heretics`

#### `battle_heretics`（battle）
**演出パラメータ:**
- **BGM**: `[要定義: 例 bgm_battle_normal]`

| 設定 | 値 |
|-----|-----|
| 敵グループ | `enemy_heretic` |
| 敵名 | 異端信徒 |
| 備考 | 中程度。宗教的熱狂により状態異常耐性あり（想定） |

```
params: type:battle, enemy_group_id:[要定義: enemy_heretic が含まれるグループ], next:capture_leader, fail:end_failure
```

#### `capture_leader`（text）
```
信徒たちを制圧した。指導者らしき男が床に崩れ落ちている。
聖騎士団に引き渡す——彼の末路は、もう関係ない。
```

#### `end_success`（end, result: success）
```
粛清完了。聖騎士団副隊長から報酬を受け取った。「よくやった」とだけ言われた。
```

#### `end_failure`（end, result: failure）
```
異端者の激しい抵抗に押し返された。彼らは地下に潜り直した。
```

---

## 4. CSVエントリ

```csv
7010,qst_rol_heretic,異端者の粛清,2,2,1,loc_holy_empire,,,80,,Gold:400|Order:5,聖騎士団,[討伐] 教会に背く異端の信徒たちを、騎士団に代わって処理する。
```

---

## 5. 実装チェックリスト

- [ ] 出現拠点が `loc_holy_empire` のみに制限されている
- [ ] 受注条件 `min_reputation: 80` が正しく機能する
- [ ] `enemy_heretic` がDBに登録済み
- [ ] Order +5 アライメント変動が適用される

---

## 6. 拡張メモ

- 「異端者に同情して騎士団を裏切る」選択肢（Justice変動・依頼失敗）
- 異端者が実は正しい教えを持っていた……という結末フレーバー
