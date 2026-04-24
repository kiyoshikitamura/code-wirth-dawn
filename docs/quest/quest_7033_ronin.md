# クエスト仕様書：7033 — 食い詰めた浪人狩り

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7033 |
| **Slug** | `qst_yat_ronin` |
| **クエスト種別** | 矢渡クエスト（Yato） |
| **推奨レベル** | 6（Normal） |
| **難度** | 2 |
| **依頼主** | 代官所 |
| **出現条件** | 制限なし / 出現拠点: loc_yatoshin |
| **リピート** | リピート可能 |
| **難易度Tier** | Normal（rec_level: 6） |
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
Gold:350
```

---

## 3. シナリオノードフロー

```
start → enter_gambling_den → confront_leader
  └─ battle_ronin_wave_01 → leader_fight
       ├─ 勝利 → scatter → end_success
       └─ 敗北 → end_failure
```

#### `start`（text）
```
代官所から依頼書を受け取った。賭場の場所は繁華街の裏通りだ。
昼間から怒声と賞金稼ぎの気配が漏れ聞こえてくる。
```

#### `enter_gambling_den`（text）
```
賭場の戸を開けると、酒臭い空気と浪人の目が一斉にこちらを向いた。
「何の用だ。立ち去れ」
```
- 選択肢: 「依頼で来た。大人しく出ていけ」→ `confront_leader`（次ノードへ）

#### `confront_leader`（text）
```
奥に座った大柄な浪人が立ち上がった。頭目と思われる。
「出て行く代わりに、お前の命をもらおうか」
```

#### `battle_ronin_wave_01`（battle）
**演出パラメータ:**
- **BGM**: `[要定義: 例 bgm_battle_normal]`

| 設定 | 値 |
|-----|-----|
| 敵グループ | `enemy_ronin` |
| 敵名 | 食い詰め浪人（雑兵） |

```
params: type:battle, enemy_group_id:[要定義: enemy_ronin が含まれるグループ], next:leader_fight, fail:end_failure
```

#### `leader_fight`（battle）
```
params: type:battle, enemy_group_id:[要定義: enemy_ronin が含まれるグループ], next:scatter, fail:end_failure
```
> 頭目は `enemy_ronin_leader`（強化版）として定義。

#### `scatter`（text）
```
頭目が倒れると、残りの浪人たちは我先にと逃げ出した。
賭場の客たちが、恐る恐る立ち上がった。
```

#### `end_success` / `end_failure`
（標準定義）

---

## 4. CSVエントリ

```csv
7033,qst_yat_ronin,食い詰めた浪人狩り,2,2,1,loc_yatoshin,,,,,Gold:350|Order:5,代官所,[討伐] 賭場の手入れ。悪事に手を染めた浪人集団を一網打尽にする。
```

---

## 5. 実装チェックリスト

- [ ] 出現拠点 `loc_yatoshin` のみ
- [ ] `enemy_ronin` がDBに登録済み
- [ ] `enemy_ronin_leader`（頭目・強化版）がDBに登録済み
- [ ] Order +5 アライメント変動が適用される

---

## 6. 拡張メモ

- 浪人の頭目が「元は藩の重臣だった」フレーバー（没落の理由）
- 「浪人に同情して見逃す」選択肢（失敗・フレーバーのみの選択肢）
