# クエスト仕様書：7034 — 御前試合の果たし状配達

## 0. メタデータ

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7034 |
| **Slug** | `qst_yat_shogun` |
| **種別** | 配達（Delivery） |
| **依頼主** | 剣客道場 |
| **推奨Lv / 難度** | 2 / 2 |
| **所要日数** | 成功:1 / 失敗:1 |
| **出現拠点** | `loc_yatoshin` |
| **受注条件** | なし |
| **戦闘** | なし（基本）/ 途中トラブルの可能性あり |

---

## 1. クエスト説明

### 短文（ボード表示・40字以内）
```
不吉な血判状を、隣の剣客道場まで無傷で届けてほしい。
```

### 長文（詳細モーダル）
```
剣客道場の師範から奇妙な依頼が来た。
御前試合への挑戦状——通称「果たし状」を、
隣の峠道の向こうにある道場まで届けてほしいというのだ。
「なぜ使いを寄越さないのか」と聞くと、
「前の使者が二人、途中で引き返してきた」と師範が渋面で答えた。
果たし状は血判を押した縦幕紙で、妙に重い。
道中に何かいるのかもしれない——それを確かめた上で届けてほしい。
```

---

## 2. 報酬

| 種別 | 値 |
|-----|-----|
| Gold | 200G |

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
| 設定 | 値 |
|-----|-----|
| 敵スラッグ | `enemy_yokai`（或いは `enemy_spirit`） |
| 敵名 | 峠の怨霊 |

```
params: type:battle, enemy:enemy_yokai, next:deliver_letter, fail:end_failure
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
- BGM: `bgm_quest_calm`（峠道・静か）
