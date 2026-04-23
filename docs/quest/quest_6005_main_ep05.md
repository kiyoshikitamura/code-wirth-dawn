# クエスト仕様書：6005 — 第5話「大義という名の虚妄」

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6005 |
| **Slug** | `main_ep05` |
| **クエスト種別** | メインエピソード（Main） |
| **推奨レベル** | 5（Normal） |
| **難度** | 1 |
| **依頼主** | 交易商会 |
| **出現条件** | 前提クエストクリア: main_ep04 / 滞在拠点: マルカンド拠点 |
| **リピート** | アカウント通じて1回のみ（継承後も非表示） |
| **難易度Tier** | Normal（rec_level: 5） |
| **サムネイル画像** | `/images/quests/bg_bandit_camp.png` |

※BGM、SE、進行中の背景画像などはノードごとに指定します。

---

## 1. クエスト概要

### 短文説明
```
公式メインシナリオ
```

### 長文説明
```
黄金都市イスハーク近郊。「大義」の名のもとに繰り広げられる殺戮の果てに、老騎士ガウェインが命を散らす。戦争の虚しさを胸に刻みながら、君は新たな道を歩み始める。
```

---

## 2. 報酬定義

**CSV記載形式:**
```
Gold:600|Rep:15|Item:501
```

---

## 3. シナリオノード構成

### 簡易フロー
```text
start
  └─ start
  └─ text0_1
  └─ text1
  └─ text1_1
  └─ battle1
      ├─[狂気の群れに剣を振るう]→ N/A
  └─ text2
  └─ text2_1
  └─ text3
  └─ text3_1
  └─ battle2
      ├─[死力を尽くし、生き延びる]→ N/A
  └─ text4
  └─ text4_1
  └─ text5
  └─ end_node
```

### ノード詳細

#### `start`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_bandit_camp`

**テキスト:**
```
開戦の口火が切られてから数週間。君たちは、なし崩し的にマルカンド王国の前線拠点での防衛戦に巻き込まれていた。
```
**次ノード:** `{type:text, bg:bg_bandit_camp}` (auto-advance)
**params:**
```json
text0_1
```

---

#### `text0_1`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_bandit_camp`

**テキスト:**
```
傭兵として雇い主（マルカンド側）に付くか、祖国（ローラン）の軍に下るか。戦場の混乱の中で、そんな選択肢など意味を持たなかった。生き残るために目の前の敵を斬る、それだけだ。
```
**次ノード:** `{type:text, bg:bg_bandit_camp}` (auto-advance)
**params:**
```json
text1
```

---

#### `text1`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_bandit_camp`

**テキスト:**
```
突如として大地の揺れる音が響く。地平線を埋め尽くすほどの砂埃を上げて、帝国軍の本隊が拠点への全面侵攻を開始したのだ。
```
**次ノード:** `{type:text, bg:bg_bandit_camp}` (auto-advance)
**params:**
```json
text1_1
```

---

#### `text1_1`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_bandit_camp`

**テキスト:**
```
「もはや小競り合いではない……本物の戦争だ！各員、死にたくなければ配置につけ！」ガウェインの悲痛ともとれる叫びが戦場に響き渡る。
```
**次ノード:** `{type:text, bg:bg_bandit_camp, speaker_image_url:/images/npcs/npc_guest_gawain.png}` (auto-advance)
**params:**
```json
battle1
```

---

#### `battle1`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_bandit_camp`

**テキスト:**
```
怒涛の如く押し寄せる帝国兵の群れ。彼らの目には熱狂的な『大義』が宿っており、命の惜しさなど微塵も感じられない。まずは先陣を切り抜けろ！
```
**次ノード:** `{type:battle, enemy_group_id:203}` (auto-advance)
**params:**
```json
choice_1
```

---

#### `text2`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_bandit_camp`

**テキスト:**
```
数名を切り伏せたが、敵の数は減るどころか津波のように増していく。仲間の傭兵やマルカンドの兵士たちが次々と赤い海に沈んでいく。
```
**次ノード:** `{type:text, bg:bg_bandit_camp}` (auto-advance)
**params:**
```json
text2_1
```

---

#### `text2_1`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_bandit_camp`

**テキスト:**
```
矢衾の中から、重装装甲に身を包んだ帝国の精鋭部隊が現れた。彼らの標的は、最前線で踏み留まっているガウェインだ。
```
**次ノード:** `{type:text, bg:bg_bandit_camp}` (auto-advance)
**params:**
```json
text3
```

---

#### `text3`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_bandit_camp`

**テキスト:**
```
「無理だ、多すぎる！……新入り、お前はまだ死ぬべきではない。ここはワシが引き受ける、お前だけでも逃げろ！」
```
**次ノード:** `{type:text, bg:bg_bandit_camp, speaker_image_url:/images/npcs/npc_guest_gawain.png}` (auto-advance)
**params:**
```json
text3_1
```

---

#### `text3_1`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_bandit_camp`

**テキスト:**
```
「そんなことできるわけが――」君の言葉を、耳を劈く烈白な剣戟の音が遮った。
```
**次ノード:** `{type:text, bg:bg_bandit_camp}` (auto-advance)
**params:**
```json
battle2
```

---

#### `battle2`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_bandit_camp`

**テキスト:**
```
ガウェインが君の前に立ち塞がり、精鋭たちの猛攻をその巨大な盾と剣で受け止める。その背後から迫る別働隊の刃が、君に向かって牙を剥いた！
```
**次ノード:** `{type:battle, enemy_group_id:203}` (auto-advance)
**params:**
```json
choice_2
```

---

#### `text4`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_bandit_camp`

**テキスト:**
```
死に物狂いで別働隊を退けた。だが、息をつく暇もなく振り返った君の目に飛び込んできたのは――無数の槍や剣に貫かれ、血だまりの中に崩れ落ちる老騎士の姿だった。
```
**次ノード:** `{type:text, bg:bg_bandit_camp}` (auto-advance)
**params:**
```json
text4_1
```

---

#### `text4_1`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_bandit_camp`

**テキスト:**
```
「ガウェイン……ッ！！」君は泥に塗れた手を伸ばすが、届かない。彼を貫いた兵士たちは、すでに次の獲物を探して遠ざかっていた。
```
**次ノード:** `{type:text, bg:bg_bandit_camp}` (auto-advance)
**params:**
```json
text5
```

---

#### `text5`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_bandit_camp`

**テキスト:**
```
「……行け。……新米。生き延びて、この目で……世界の果てを、見届けろ……」
```
**次ノード:** `{type:text, bg:bg_bandit_camp, speaker_image_url:/images/npcs/npc_guest_gawain.png}` (auto-advance)
**params:**
```json
end_node
```

---

#### `end_node`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_bandit_camp`

**テキスト:**
```
それが、厳しいながらも君を導き続けた老騎士の最期の言葉だった。大義という名の下に散った数多の命の重さを背負い、敗走兵となった君の孤独な真の旅がはじまる。
```
**次ノード:** `{type:end_success}` (auto-advance)
**params:**
```json

```

---


