# クエスト仕様書：7006 — 禁制品の闇ルート輸送

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7006 |
| **Slug** | `qst_gen_smuggle` |
| **クエスト種別** | 密輸（Smuggle） |
| **推奨レベル** | 2（Easy） |
| **難度** | 2 |
| **依頼主** | 闇商人 |
| **出現条件** | 名声 -50以下 / 出現拠点: 全拠点 |
| **経過日数 (time_cost)** | 8（成功: 8日 / 失敗: 8日） |
| **ノード数** | 18ノード |

---

## 1. クエスト概要

```
[密輸] 中身不明の禁制品を隣街まで運ぶ。追手に注意。
```

---

## 2. 報酬定義

```
Gold:800|Rep:-5|Evil:5|Chaos:5
```

---

## 3. シナリオノードフロー

```text
start → text_01 → text_02 → text_03 → text_04
  → depart → night_01 → night_02 → night_03
    → encounter_01 → encounter_02
      → battle
        ├─ win → after_01 → after_02 → arrive → arrive_02 → end_success
        └─ lose → end_failure
```

### ノード詳細（18ノード）

| node_id | type | bg | speaker | テキスト |
|---------|------|-----|---------|---------|
| start | text | bg_slum | — | 路地裏で闇商人が待っていた。鋭い目が光る。 |
| text_01 | text | bg_slum | 闇商人 | 「中身は聞くな。この箱を隣街の赤猫亭に届けろ」 |
| text_02 | text | bg_slum | 闇商人 | 「街道は使うな。検問がある。旧道を通れ」 |
| text_03 | text | bg_slum | 闇商人 | 「追手がかかるかもしれんが、腕で何とかしろ」 |
| text_04 | text | bg_slum | — | 闇商人は木箱を押しつけ闇に消えた。ずっしり重い。 |
| depart | text | bg_road_night | — | 旧道に入った。舗装されていない獣道。月明かりだけが頼り。 |
| night_01 | text | bg_road_night | — | 箱を背負い足音を殺して進む。虫の声だけが響く。 |
| night_02 | text | bg_road_night | — | 道の途中で背後に気配。闇の中に人影が二つ。 |
| night_03 | text | bg_road_night | — | 追ってきている。検問の兵か別の組織か。 |
| encounter_01 | text | bg_road_night | 追手 | 「止まれ！ その荷を置いていけ！」 |
| encounter_02 | text | bg_road_night | — | 追手が武器を構えた。逃げるか戦うか。 |
| battle | battle | bg_road_night | — | 追手が襲いかかってきた！（group: 406） |
| after_01 | text | bg_road_night | — | 追手を退けた。荷を確認。無事だ。 |
| after_02 | text | bg_road_night | — | これ以上長居は危険だ。走れ。 |
| arrive | text | bg_tavern_night | — | 夜明け前に隣街に到着。赤猫亭の裏口を叩く。 |
| arrive_02 | text | bg_tavern_night | — | 無言の男が箱を受け取り、金貨の革袋を押しつけた。 |
| end_success | end | bg_tavern_night | — | 密輸完了。金は多いが後味は悪い。 |
| end_failure | end | bg_road_night | — | 追手に捕まり荷を没収された。闇商人への報告が怖い。 |

---

## 4. 敵定義参照

| enemy_group_id | グループ名 |
|----------------|-----------|
| 406 | 追手部隊 |
