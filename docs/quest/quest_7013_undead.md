# クエスト仕様書：7013 — 遺体安置所の亡者討伐

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7013 |
| **Slug** | `qst_rol_undead` |
| **クエスト種別** | 聖王国クエスト（Roland） |
| **推奨レベル** | 4（Normal） |
| **難度** | 3 |
| **依頼主** | 聖騎士団 |
| **出現条件** | 制限なし / 出現拠点: loc_holy_empire |
| **リピート** | リピート可能 |
| **難易度Tier** | Normal（rec_level: 4） |
| **経過日数 (time_cost)** | 2（成功: 2日 / 失敗: 1日） |
| **ノード数** | 23ノード |
| **サムネイル画像** | `/images/quests/bg_crypt.png` |

## 1. クエスト概要

### 短文説明
```
[討伐] 瘴気によって動き出した腐乱死体たちを土へと還す。
```

### 長文説明
```
聖騎士団からの緊急依頼。王都の地下にある教区の共同墓地（遺体安置所）で、死体が瘴気に当てられてアンデッド化し、徘徊している。このままでは地上に被害が出るため、安置所は現在封鎖されている。内部へ潜入し、動く死体たちを物理的に「昇天」させ、元凶となっている瘴気の源を絶つ必要がある。閉鎖空間での3連戦に備えよ。
```

## 2. 報酬定義

**CSV記載形式:**
```
Gold:450|Order:10|Exp:100|Rep:15
```

## 2.5. 失敗ペナルティ（共通仕様）

| 条件 | ペナルティ |
|------|-----------|
| クエスト失敗（敗北/撤退/ギブアップ） | 名声 -3〜-10（ランダム、現在拠点） |
| バトル敗北（全般） | VIT -1（クエスト/ランダムエンカウント/賞金稼ぎ共通） |
| 経過日数 | クエスト定義の days_failure 値を適用 |

## 3. シナリオノード構成

### 全体フロー

```text
start → intro_1 → intro_2 → enter_crypt → crypt_desc
  → encounter_wave1 → battle_wave1 (スケルトン x1 / ゾンビ x1 / レイス x1)
     ├─ [勝利] → after_wave1 → deeper → encounter_wave2
     │    → battle_wave2 (レイス x3)
     │       ├─ [勝利] → after_wave2 → find_altar → boss_desc
     │       │    → encounter_wave3 → battle_wave3 (レイス x5)
     │       │       ├─ [勝利] → after_wave3 → destroy_stone → purge_done
     │       │       │    → report → knight_thanks → end_success
     │       │       └─ [敗北] → end_failure
     │       └─ [敗北] → end_failure
     └─ [敗北] → end_failure
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm
```text
聖騎士団の詰め所に呼ばれた。
緊迫した空気が漂う中、担当の騎士が地図を広げる。
```

#### `intro_1`（text）
**演出:** bg: bg_guild, speaker: 担当の騎士
```text
「教区の共同墓地を閉鎖した。
　罪深き霊が肉体を求めて彷徨い、死体が動き出している」
```

#### `intro_2`（text）
**演出:** bg: bg_guild, speaker: 担当の騎士
```text
「彼らの手足を切り落とし、物理的に昇天させたまえ。
　そして、なぜ瘴気が発生しているのか、原因を突き止めてくれ」
```

#### `enter_crypt`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
閉鎖された遺体安置所の鉄格子を開け、地下への石段を下りる。
途端に、強烈な腐敗臭と冷気が押し寄せてきた。
```

#### `crypt_desc`（text）
**演出:** bg: bg_crypt
```text
壁面に並んだ棺の一部が破壊され、中身がもぬけの殻になっている。
暗闇の奥から、湿った足音とうめき声が聞こえてきた。
```

#### `encounter_wave1`（text）
**演出:** bg: bg_crypt
```text
松明を掲げると、通路を塞ぐように異なる種類の亡者たちが立っていた。
骸骨、腐敗した死体、そして半透明の幽鬼——生者の熱を感知し、こちらへ向き直る。
```

#### `battle_wave1`（battle）【第1戦】
**演出:** bg: bg_crypt, bgm: bgm_battle

| 設定 | 値 |
|-----|-----|
| 敵グループID | `413` |
| 敵グループSlug | `grp_undead_mixed` |
| 構成 | スケルトン(1031) x1 / ゾンビ(1032) x1 / レイス(1033) x1 |
| 敵表示名 | 混成亡者 |

```text
遺体安置所の亡者たちが襲いかかってきた！
```

#### `after_wave1`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
最初の群れを切り伏せた。
腐肉を焼く匂いが地下にこもる。だが、奥からさらに濃い瘴気が流れてくる。
```

#### `deeper`（text）
**演出:** bg: bg_crypt
```text
血糊を払い、安置所のさらに深部へと進む。
床は冷たく湿り、壁には黒いカビのようなものがびっしりと生えている。
```

#### `encounter_wave2`（text）
**演出:** bg: bg_crypt
```text
通路の奥から、不気味な青白い光が漂ってきた。
実体を持たないレイスたちだ。壁を透過しながらこちらへ忍び寄ってくる。
```

#### `battle_wave2`（battle）【第2戦】
**演出:** bg: bg_crypt, bgm: bgm_battle

| 設定 | 値 |
|-----|-----|
| 敵グループID | `416`（新規作成） |
| 敵グループSlug | `grp_wraith_trio` |
| 構成 | レイス(1033) x3 |
| 敵表示名 | レイスの群れ |

```text
レイスの群れが壁から湧き出てくる！物理攻撃が通りにくい厄介な相手だ！
```

#### `after_wave2`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
レイスの群れを退けた。だが、まだ終わりではない。
最奥から、一段と強烈な瘴気の波動が押し寄せてくる。
```

#### `find_altar`（text）
**演出:** bg: bg_crypt
```text
最奥の広間。かつては祈りを捧げる場所だったのだろう。
祭壇の上には、黒く脈打つ不気味な石が置かれている。
```

#### `boss_desc`（text）
**演出:** bg: bg_crypt
```text
石を中心に、圧倒的な数のレイスが渦を巻いている。
瘴気の源であるあの石を破壊するには、まずこの群れを突破しなければならない。
```

#### `encounter_wave3`（text）
**演出:** bg: bg_crypt
```text
レイスたちが一斉にこちらへ向き直った。
石を守るように、5体のレイスが壁のように立ちはだかる。
```

#### `battle_wave3`（battle）【第3戦】
**演出:** bg: bg_crypt, bgm: bgm_battle_boss

| 設定 | 値 |
|-----|-----|
| 敵グループID | `417`（新規作成） |
| 敵グループSlug | `grp_wraith_five` |
| 構成 | レイス(1033) x5 |
| 敵表示名 | 大量のレイス |

```text
瘴気の源を守るレイスの大群との最終決戦！
```

#### `after_wave3`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_calm
```text
最後のレイスが消滅し、広間に静寂が戻った。
残るは、祭壇で不気味な波動を放つ黒い石だけだ。
```

#### `destroy_stone`（text）
**演出:** bg: bg_crypt
```text
剣を振り下ろし、黒い石を真っ二つに叩き割る。
ガラスが割れるような甲高い音と共に、地下を満たしていた瘴気が一気に霧散した。
```

#### `purge_done`（text）
**演出:** bg: bg_crypt
```text
空気が澄んでいくのが分かる。もう死体が起き上がることはないだろう。
それにしても、誰がこんなものを持ち込んだのか。
```

#### `report`（text）
**演出:** bg: bg_guild
```text
騎士団に戻り、討伐の完了と黒い石の破片を報告した。
```

#### `knight_thanks`（text）
**演出:** bg: bg_guild, speaker: 担当の騎士
```text
「見事だ。この石は……異端の呪具か。
　背後関係はこちらで洗おう。助かった」
```

#### `end_success`（end_success）
**演出:** bg: bg_guild
```text
報酬を受け取った。
地下の腐臭は、まだ鼻の奥にこびりついている気がした。
```
**rewards:** Gold:450, Order:10, Exp:100, Rep:15

#### `end_failure`（end_failure）
**演出:** bg: bg_crypt
```text
無数の亡者の手に引きずり倒された。
自分もまた、この冷たい地下で永遠に彷徨う肉の塊となるのだ。
```

---

## 4. 敵定義参照（新規エネミーグループ 2件 + 共有 1件）

### エネミーグループ: `grp_undead_mixed` (ID: 413)【7011と共有】

| Slug | 名前 | Lv | HP | ATK | DEF |
|------|------|----|----|-----|-----|
| enemy_skeleton | スケルトン | 4 | 45 | 22 | 3 |
| enemy_zombie | ゾンビ | 6 | 80 | 30 | 2 |
| enemy_wraith | レイス | 10 | 100 | 42 | 15 |

### エネミーグループ: `grp_wraith_trio` (ID: 416)

| Slug | 名前 | Lv | HP | ATK | DEF |
|------|------|----|----|-----|-----|
| enemy_wraith | レイス | 10 | 100 | 42 | 15 |
| enemy_wraith | レイス | 10 | 100 | 42 | 15 |
| enemy_wraith | レイス | 10 | 100 | 42 | 15 |

### エネミーグループ: `grp_wraith_five` (ID: 417)

| Slug | 名前 | Lv | HP | ATK | DEF |
|------|------|----|----|-----|-----|
| enemy_wraith | レイス | 10 | 100 | 42 | 15 |
| enemy_wraith | レイス | 10 | 100 | 42 | 15 |
| enemy_wraith | レイス | 10 | 100 | 42 | 15 |
| enemy_wraith | レイス | 10 | 100 | 42 | 15 |
| enemy_wraith | レイス | 10 | 100 | 42 | 15 |

---

## 5. CSVエントリ（quests_normal.csv）

```csv
7013,qst_rol_undead,遺体安置所の亡者討伐,4,3,2,loc_holy_empire,,,,,Gold:450|Order:10|Exp:100|Rep:15,聖騎士団,[討伐] 瘴気によって動き出した腐乱死体たちを土へと還す。
```

---

## 6. 実装チェックリスト

- [ ] 出現拠点が `loc_holy_empire` のみ
- [ ] エネミーグループ `grp_undead_mixed`（413）がenemy_groups.csvに登録済み
- [ ] エネミーグループ `grp_wraith_trio`（416）がenemy_groups.csvに登録済み
- [ ] エネミーグループ `grp_wraith_five`（417）がenemy_groups.csvに登録済み
- [ ] 3連戦フローが正しく遷移する
- [ ] Order +10, Rep +15 が適用される
- [ ] time_cost: 2（成功）/ 1（失敗）が正しく経過する
