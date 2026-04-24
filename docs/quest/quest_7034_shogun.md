# クエスト仕様書：7034 — 御前試合の果たし状配達

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7034 |
| **Slug** | `qst_yat_shogun` |
| **クエスト種別** | 矢渡クエスト（Yato） |
| **推奨レベル** | 6（Normal） |
| **難度** | 2 |
| **依頼主** | 剣客道場 |
| **出現条件** | 制限なし / 出現拠点: loc_yatoshin |
| **リピート** | リピート可能 |
| **難易度Tier** | Normal（rec_level: 6） |
| **経過日数 (time_cost)** | 1（成功: 1日 / 失敗: 1日） |
| **ノード数** | 4ノード（うち選択肢0件） |
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
Gold:200
```

---

## 3. シナリオノードフロー

```
start → receive_letter → travel_pass
  ├─ check_disturbance（random_branch 60%）→ confronted
  │    ├─ [話し合い] → resolve_peacefully → deliver_letter → end_success
  │    └─ [強引に進む] → battle_spirit → deliver_letter → end_success
  └─ [異常なし 40%] → deliver_letter → end_success
```

> **設計メモ:** このクエストは戦闘を回避できる「話し合い」ルートが正道。強引に進むことも可能だが、後者は後味が悪い。

#### `start`（text）
```
剣客道場の師範から、重厚な巻紙を手渡された。
血の匂いがするような気がしたが、気のせいだろう。
...多分。
```

#### `receive_letter`（text）
```
果たし状を懐に収めて、峠道へと向かった。
前の使者が二人も引き返してきた道だ——慎重に進む。
```

#### `travel_pass`（random_branch）
```
params: type:random_branch, prob:60, next:confronted, fallback:deliver_letter
```

#### `confronted`（text）
```
峠の中間地点で、道を塞ぐ人影があった。
武装した浪人……ではない。よく見ると、体が半透明だ。
怨霊か——それとも試みの霊か。
```
- 選択肢: 「落ち着いて話しかける」→ `resolve_peacefully`
- 選択肢: 「構わず進む（戦う）」→ `battle_spirit`

#### `resolve_peacefully`（text）
```
「……この使者は、逃げないのか」
霊は少し驚いた様子で、やがて道を開けた。
「……行け」
前の使者が逃げた理由が分かった気がした。
```

#### `battle_spirit`（battle）
**演出パラメータ:**
- **BGM**: `[要定義: 例 bgm_battle_normal]`

| 設定 | 値 |
|-----|-----|
| 敵グループ | `enemy_yokai`（或いは `enemy_spirit`） |
| 敵名 | 峠の怨霊 |

```
params: type:battle, enemy_group_id:[要定義: enemy_yokai が含まれるグループ], next:deliver_letter, fail:end_failure
```

#### `deliver_letter`（text）
```
隣道場に到着し、師範に果たし状を手渡した。
「無事に届いたか。……お前は肝が据わっているな」
```

#### `end_success`（end, result: success）
```
配達完了。剣客道場から謝礼を受け取った。
怨霊が何者だったかは——聞かないままにした。
```

#### `end_failure`（end, result: failure）
```
峠の霊に阻まれ、引き返した。果たし状は届けられなかった。
```

---

## 4. CSVエントリ

```csv
7034,qst_yat_shogun,御前試合の果たし状配達,2,2,1,loc_yatoshin,,,,,Gold:200,剣客道場,[配達] 不吉な血判状を、隣地の剣客道場まで無傷で送り届ける。
```

---

## 5. 実装チェックリスト

- [ ] 出現拠点 `loc_yatoshin` のみ
- [ ] `enemy_yokai` / `enemy_spirit` がDBに登録済み
- [ ] `random_branch` 60%で遭遇が機能する
- [ ] 「話し合い」ルートで戦闘をスキップできることを確認

---

## 6. 拡張メモ

- 怨霊の正体が道場の先代師範だったことが分かる後続フレーバー
- 「話し合い」で渡した者への隠し報酬（戦闘回避ボーナス）
