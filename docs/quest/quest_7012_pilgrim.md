# クエスト仕様書：7012 — 聖地巡礼者の護衛

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7012 |
| **Slug** | `qst_rol_pilgrim` |
| **クエスト種別** | 聖王国クエスト（Roland） |
| **推奨レベル** | 4（Normal） |
| **難度** | 3 |
| **依頼主** | 教会 |
| **出現条件** | 制限なし / 出現拠点: loc_holy_empire |
| **リピート** | リピート可能 |
| **難易度Tier** | Normal（rec_level: 4） |
| **経過日数 (time_cost)** | 10（成功: 10日 / 失敗: 5日） |
| **ノード数** | 23ノード |
| **サムネイル画像** | `/images/quests/bg_road_day.png` |

## 1. クエスト概要

### 短文説明
```
[護衛] 狂信的な巡礼者を護送する。彼が死ねば報酬はない。
```

### 長文説明
```
教会からの依頼。西の山脈にある古い聖地の祠まで、熱心な巡礼者「アルバート」を護衛する任務。道中は山賊や魔物が出没する危険地帯だが、アルバートは「神の御加護」を盲信しており、一切の危険を省みずに歩き続けるという厄介な人物だ。彼を死なせずに聖地へ届け、無事に祈りを捧げさせることができれば高額な報酬が約束されている。
```

## 2. 報酬定義

**CSV記載形式:**
```
Gold:700|Chaos:10|Exp:150|Rep:-10
```

## 2.5. 失敗ペナルティ（共通仕様）

| 条件 | ペナルティ |
|------|-----------|
| クエスト失敗（敗北/撤退/ギブアップ） | 名声 -3〜-10（ランダム、現在拠点） |
| バトル敗北（全般） | VIT -1（クエスト/ランダムエンカウント/賞金稼ぎ共通） |
| 経過日数 | クエスト定義の days_failure 値を適用 |

> **護衛失敗（アルバートHP=0）:** 即座にクエスト失敗（`end_failure`）へ遷移。

## 3. シナリオノード構成

### 全体フロー

```text
start → intro_1 → intro_2 → join_albert（ゲストNPC加入）
  → mountain_road → albert_walk → warning → ambush
    → bandit_threat → albert_ignore → albert_ignore_2
      → battle_wave1 (チンピラ x2 / 野盗の射手 x2)
         ├─ [勝利] → after_battle_1 → deeper_mountain
         │    → encounter_wave2 → battle_wave2 (野盗の射手 x2 / 野盗の用心棒 x2)
         │       ├─ [勝利] → after_battle_2 → albert_praise → sigh
         │       │    → arrive_shrine → albert_pray → albert_thanks
         │       │      → leave_albert（ゲストNPC離脱）→ end_success
         │       └─ [敗北] → end_failure
         └─ [敗北] → end_failure
※ アルバートHP=0 → 即 end_failure
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm
```text
教会の入り口で、依頼主である巡礼者と対面した。
質素なローブを纏い、首から大きな十字架を下げた男だ。
```

#### `intro_1`（text）
**演出:** bg: bg_guild, speaker: 巡礼者アルバート
```text
「あなたが護衛の方ですね。
　主神の声が聞こえるのです。あの危険な谷の奥底へ行かねばなりません」
```

#### `intro_2`（text）
**演出:** bg: bg_guild, speaker: 巡礼者アルバート
```text
「あなたが私の盾となるのは、神の思し召しです。
　さあ、参りましょう。神の御導きのままに」
```

#### `join_albert`（guest_join）
**演出:** bg: bg_road_day

| 設定 | 値 |
|-----|-----|
| guest_id | `npc_pilgrim_albert` |
| is_escort_target | true |

```text
まったく話が通じない相手だ。
ともかく、彼が死ねば報酬はない。聖地への長い旅が始まった。
```

#### `mountain_road`（text）
**演出:** bg: bg_mountain, bgm: bgm_field
```text
数日後、険しい山道に差し掛かった。
岩肌が露出し、道幅は馬車一台がやっと通れる程度しかない。
```

#### `albert_walk`（text）
**演出:** bg: bg_mountain, speaker: 巡礼者アルバート
```text
「おお……神の試練が私の足元に。
　この苦難こそが、信仰の証なのです」
```

#### `warning`（text）
**演出:** bg: bg_mountain
```text
アルバートは足元の悪さも気にせず、祈りを呟きながら歩き続ける。
周囲の岩陰から、殺気を感じた。
```

#### `ambush`（text）
**演出:** bg: bg_mountain, bgm: bgm_quest_tense
```text
「そこまでだ、巡礼者さんよ」
前方の岩の上から、弓を番えた男が顔を出した。背後からも足音がする。
```

#### `bandit_threat`（text）
**演出:** bg: bg_mountain, speaker: 山賊の頭
```text
「教会からたっぷり旅の資金を持たされてるんだろ？
　置いていきな。命までは取らねえよ」
```

#### `albert_ignore`（text）
**演出:** bg: bg_mountain, speaker: 巡礼者アルバート
```text
「……（ぶつぶつと祈りの言葉を唱え続けている）」
```

#### `albert_ignore_2`（text）
**演出:** bg: bg_mountain
```text
アルバートは全く動じず、山賊の脅しを完全に無視して歩き出そうとする。
山賊たちが怒りの形相で得物を構えた！
```

#### `battle_wave1`（battle）【第1戦】
**演出:** bg: bg_mountain, bgm: bgm_battle

| 設定 | 値 |
|-----|-----|
| 敵グループID | `414`（新規作成） |
| 敵グループSlug | `grp_bandit_ambush_1` |
| 構成 | チンピラ(1101) x2 / 野盗の射手(1102) x2 |
| 敵表示名 | 山賊の先遣隊 |

```text
山賊の群れが襲いかかってきた！アルバートを守り抜け！
```

#### `after_battle_1`（text）
**演出:** bg: bg_mountain, bgm: bgm_quest_calm
```text
山賊の先遣隊を撃退した。
だが、奥の岩場から怒号が響く。まだ増援がいるようだ。
```

#### `deeper_mountain`（text）
**演出:** bg: bg_mountain, bgm: bgm_quest_tense
```text
アルバートは戦闘の最中も足を止めず、どんどん先へ進んでしまう。
慌てて追いかけると、前方の峠道に武装した男たちが立ちはだかっていた。
```

#### `encounter_wave2`（text）
**演出:** bg: bg_mountain, speaker: 山賊の用心棒
```text
「仲間をやったな……！
　次はこの俺たちが相手だ。ただじゃおかねえぞ！」
```

#### `battle_wave2`（battle）【第2戦】
**演出:** bg: bg_mountain, bgm: bgm_battle

| 設定 | 値 |
|-----|-----|
| 敵グループID | `415`（新規作成） |
| 敵グループSlug | `grp_bandit_ambush_2` |
| 構成 | 野盗の射手(1102) x2 / 野盗の用心棒(1103) x2 |
| 敵表示名 | 山賊の精鋭 |

```text
山賊の精鋭部隊が立ちはだかる！今度は手強い！
```

#### `after_battle_2`（text）
**演出:** bg: bg_mountain, bgm: bgm_quest_calm
```text
山賊の精鋭を撃退した。もうこの辺りには敵影はない。
アルバートを見ると、彼はかすり傷一つ負わず、ただ祈り続けていた。
```

#### `albert_praise`（text）
**演出:** bg: bg_mountain, speaker: 巡礼者アルバート
```text
「神の御加護が、悪漢どもを退けたのですね。
　主よ、感謝いたします」
```

#### `sigh`（text）
**演出:** bg: bg_mountain
```text
戦ったのはこちらなのだが。
ため息をつきつつ、先を急ぐことにする。
```

#### `arrive_shrine`（text）
**演出:** bg: bg_shrine
```text
ついに目的の聖地の祠に到着した。
風化して苔生した小さな石造りの祠だ。
```

#### `albert_pray`（text）
**演出:** bg: bg_shrine
```text
アルバートは祠の前に跪き、地面に額をつけて長い祈りを始めた。
日が暮れるまで、彼はそこから動かなかった。
```

#### `albert_thanks`（text）
**演出:** bg: bg_shrine, speaker: 巡礼者アルバート
```text
「……お前がいてくれてよかったかもしれぬ。
　神の意志を実現する手足として、よく働いてくれました」
```

#### `leave_albert`（leave）
**演出:** bg: bg_shrine

| 設定 | 値 |
|-----|-----|
| guest_id | `npc_pilgrim_albert` |

```text
珍しく素直な言葉だった。
アルバートをその場に残し、帰途につく。
```

#### `end_success`（end_success）
**演出:** bg: bg_guild
```text
教会に戻り、護衛完了を報告して報酬を受け取った。
あの男は今も、あの山奥で祈り続けているのだろうか。
```
**rewards:** Gold:700, Chaos:10, Exp:150, Rep:-10

#### `end_failure`（end_failure）
**演出:** bg: bg_mountain
```text
山賊の凶刃がアルバートを貫いた。
神の加護は、彼を護ってはくれなかった。護衛失敗だ。
```

---

## 4. NPC定義：アルバート（新規作成）

### npcs.csvエントリ

```csv
4105,npc_pilgrim_albert,狂信の,アルバート,Miko,10,100,5,5,10,0,4|14,「……お役目、果たします。主神の声が聞こえるのです。」,専用: アルバート同行
```

| 項目 | 値 |
|-----|-----|
| ID | 4105 |
| Slug | `npc_pilgrim_albert` |
| 名前 | アルバート |
| Job | Miko |
| Level | 10 |
| HP | 100 |
| ATK | 5 |
| DEF | 5 |
| cover_rate | 10 |
| hire_cost | 0 |
| inject_card_ids | 4\|14 |
| 護衛対象 | is_escort_target: true（HP=0で即失敗） |

> ステータスは撫子(npc_nadeshiko)と同一。

---

## 5. 敵定義参照（新規エネミーグループ 2件）

### エネミーグループ: `grp_bandit_ambush_1` (ID: 414)

| Slug | 名前 | Lv | HP | ATK | DEF |
|------|------|----|----|-----|-----|
| enemy_bandit_thug | チンピラ | 2 | 40 | 20 | 2 |
| enemy_bandit_thug | チンピラ | 2 | 40 | 20 | 2 |
| enemy_bandit_archer | 野盗の射手 | 4 | 35 | 24 | 1 |
| enemy_bandit_archer | 野盗の射手 | 4 | 35 | 24 | 1 |

### エネミーグループ: `grp_bandit_ambush_2` (ID: 415)

| Slug | 名前 | Lv | HP | ATK | DEF |
|------|------|----|----|-----|-----|
| enemy_bandit_archer | 野盗の射手 | 4 | 35 | 24 | 1 |
| enemy_bandit_archer | 野盗の射手 | 4 | 35 | 24 | 1 |
| enemy_bandit_guard | 野盗の用心棒 | 6 | 80 | 36 | 5 |
| enemy_bandit_guard | 野盗の用心棒 | 6 | 80 | 36 | 5 |

---

## 6. CSVエントリ（quests_normal.csv）

```csv
7012,qst_rol_pilgrim,聖地巡礼者の護衛,4,3,10,loc_holy_empire,,,,,Gold:700|Chaos:10|Exp:150|Rep:-10,教会,[護衛] 狂信的な巡礼者を護送する。彼が死ねば報酬はない。
```

---

## 7. 実装チェックリスト

- [ ] 出現拠点が `loc_holy_empire` のみ
- [ ] `npcs` テーブルに `npc_pilgrim_albert` が登録済み
- [ ] エネミーグループ `grp_bandit_ambush_1`（414）がenemy_groups.csvに登録済み
- [ ] エネミーグループ `grp_bandit_ambush_2`（415）がenemy_groups.csvに登録済み
- [ ] guest_join / leave / is_escort_target が正しく機能する
- [ ] アルバートHP=0で即 end_failure に遷移する
- [ ] 2連戦フローが正しく遷移する
- [ ] Chaos +10, Rep:-10 が適用される
- [ ] time_cost: 10（成功）/ 5（失敗）が正しく経過する
