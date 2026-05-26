# UGC Quest Template (Markdown形式)
# このテンプレートを編集して、あなただけのクエストを作れます。

## meta
- format_version: 2.0
- template_type: quest
- title: はじめてのマークダウンクエスト
- author: あなたの名前
- description: Markdown形式のクエストテンプレートです
- difficulty: 1
- rec_level: 1
- scenario_type: Other

## scenario
- title: 薬草採取の依頼
- short_description: 森で薬草を採取して届けよ
- client_name: 薬師のマリア
- difficulty: 1
- rec_level: 1
- scenario_type: Delivery
- time_cost: 1
- days_success: 1
- days_failure: 1
- rewards.gold: 50
- rewards.exp: 20

## nodes

### start
- type: text
- text: 「冒険者さん、お願いがあるの。森に生えている薬草を採取してきてくれないかしら？最近、怪我人が多くて薬草が足りないの…」
- bg_key: bg_shop
- bgm_key: bgm_quest_calm
- speaker_name: 薬師マリア
- choices:
  - label: 引き受ける → forest
  - label: 断る → end_failure

### forest
- type: text
- text: 森に到着した。辺りを見回すと、薬草らしき植物がいくつか見える。丁寧に採取しよう。
- bg_key: bg_forest_day
- choices:
  - label: 薬草を採取する → end_success
  - label: もう少し奥を探す → battle_slime

### battle_slime
- type: battle
- text: 奥に進むと、スライムが現れた！
- enemy_group_id: slime
- bg_key: bg_forest_day
- bgm_key: bgm_battle
- battle_success_next: end_success

### end_success
- type: end
- result: success
- text: 薬草を無事に届けることができた。マリアは喜んで報酬を渡してくれた。「ありがとう！これで怪我人を治せるわ！」

### end_failure
- type: end
- result: failure
- text: 依頼を断ってしまった。薬師マリアは残念そうだった。
