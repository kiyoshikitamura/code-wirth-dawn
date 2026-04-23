# クエスト仕様書：7033 — 食い詰めた浪人狩り

## 0. メタデータ

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7033 |
| **Slug** | `qst_yat_ronin` |
| **種別** | 討伐（Battle） |
| **依頼主** | 代官所 |
| **推奨Lv / 難度** | 6（Normal） / 2 |
| **所要日数** | 成功:1 / 失敗:1 |
| **出現拠点** | `loc_yatoshin` |
| **出現条件** | 出現国: 夜刀神国 |
| **リピート** | リピート可能 |
| **難易度Tier** | Normal（rec_level: 6） |
| **サムネイル画像** | `/images/quests/bg_tavern_night.png` |

※BGM、SE、進行中の背景画像などはノードごとに指定します。
| **受注条件** | なし |
| **敵スラッグ** | `enemy_ronin`（浪人） |
| **道徳的傾向** | 秩序（Order +5） |

---

## 1. クエスト説明

### 短文（ボード表示・40字以内）
```
賭場に居座る悪事の浪人集団を一網打尽にせよ。
```

### 長文（詳細モーダル）
```
代官所から賞金付きの手配が出ている。
食い詰めた浪人たちが賭場を占拠し、客を脅して金を巻き上げている。
剣の腕は立つが、浪人ゆえに後ろ盾のない無法者集団だ。
代官所の捕吏では力が及ばないため、代わりに処理してほしいという。
「生死は問わない——ただし、無関係の客に手を出すなら依頼は取り消す」
と代官所の役人は念を押した。
```

---

## 2. 報酬

| 種別 | 値 |
|-----|-----|
| Gold | 350G |
| アライメント | Order +5 |

```
Gold:350|Order:5
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
