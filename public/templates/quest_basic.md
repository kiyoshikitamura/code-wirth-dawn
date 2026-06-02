---
version: "1.0"
type: quest
title: "薬草採取の依頼"
short_description: "森で薬草を採取して届けよ"
full_description: "薬師マリアからの依頼。森に生えている薬草を採取し、届けるクエスト。道中にはスライムが出没することもある。"
client_name: "薬師マリア"
scenario_type: Delivery
difficulty: 1
rec_level: 5
days_success: 1
days_failure: 1
conditions:
rewards:
  items:
    - name: "回復薬"
      type: consumable
      description: "HPを少量回復する薬"
      base_price: 1
      rarity: common
---

## ノード 1: 依頼の受注（テキスト）

**話者**: 薬師マリア
**背景**: bg_shop_day
**BGM**: bgm_quest_calm

> 冒険者さん、お願いがあるの。森に生えている薬草を採取してきてくれないかしら？
> 最近、怪我人が多くて薬草が足りないの…

**選択肢**:
- [引き受ける] → ノード 2
- [断る] → ノード 5

## ノード 2: 森の探索（テキスト）

**背景**: bg_forest_day

> 森に到着した。辺りを見回すと、薬草らしき植物がいくつか見える。丁寧に採取しよう。

**選択肢**:
- [薬草を採取する] → ノード 4
- [もう少し奥を探す] → ノード 3

## ノード 3: スライム遭遇（バトル）

**背景**: bg_forest_day
**BGM**: bgm_battle

奥に進むと、スライムが現れた！

**エネミー**:
名前: スライム
レベル: 3
HP: 25
ATK: 4
DEF: 2
スキル: []
フレーバー: 森に生息するごく普通のスライム。

→ ノード 4

## ノード 4: 依頼達成（成功）

> 薬草を無事に届けることができた。
> マリアは喜んで報酬を渡してくれた。「ありがとう！これで怪我人を治せるわ！」

## ノード 5: 依頼辞退（失敗）

> 依頼を断ってしまった。薬師マリアは残念そうだった。
