import { describe, it, expect } from 'vitest';
import { parseTemplate } from '../ugcTemplateParser';

const AI_GENERATED_QUEST = `---
version: "1.0"
type: quest
title: 古代竜の遺産と目覚めし血脈
short_description: 最果ての地に現れた古代竜の末裔を討伐せよ
client_name: アストラル大魔術導師
scenario_type: Subjugation
difficulty: 10
rec_level: 40
days_success: 7
days_failure: 3
---

人間の尽きない欲望と度重なる戦争。

## 報酬

### アイテム

- 星霊の聖水 (trade_good)
- 世界樹のしずく (consumable, rare, heal_hp=50)

### スキルカード

- アストラル・バースト (power=12, effect=aoe_attack, ap_cost=4)

## ノード

### start [text]

アストラル大魔術導師：「よく来てくれた」

→ next: quest_info

### quest_info [text]

「奴の周囲には大結界が張られている」

→ next: gate1_trap

### gate1_trap [trap]

古書庫の防衛魔術トラップが襲いかかる！

trap_damage_pct: 20
→ next: gate2_battle

### gate2_battle [battle]

魔導竜騎士ヴィルヘルム：「人間どもめ！」

**enemy:** 魔導竜騎士ヴィルヘルム (Lv40, HP80, ATK35, DEF25, skills: pierce_attack)

→ next: gate3_join

### gate3_join [npc_join]

ステラ：「私が結界を中和します」

**npc:** 魔導士ステラ (Lv40, HP300, skills: buff_party, heal)
→ next: gate3_leave

### gate3_leave [npc_leave]

ステラはすべての魔力を解き放った。

→ next: boss_battle

### boss_battle [battle]

古代竜の末裔アジ・ダハーカ：「矮小なる人間よ」

**enemy:** 古代竜の末裔アジ・ダハーカ (Lv45, HP95, ATK40, DEF30, skills: aoe_attack, multi_attack)

→ next: success_node

### success_node [success]

古代竜の末裔は光の粒子となって霧散した。

### failure_node [failure]

力及ばず、英傑たちは全滅した。
`;

describe('AI生成テンプレート パース（TP修正版）', () => {
  it('TP上限内のエネミーでバリデーション通過する', () => {
    const result = parseTemplate(AI_GENERATED_QUEST, 'md');
    console.log('Success:', result.success);
    if (!result.success) {
      console.log('Errors:', JSON.stringify(result.errors, null, 2));
    }
    if (result.data && result.data.type === 'quest') {
      console.log('Nodes:', result.data.nodes?.length);
      console.log('Rewards items:', result.data.rewards?.items?.length);
      console.log('Rewards card:', result.data.rewards?.skill_card?.name);
    }
    if (result.balance?.enemies) {
      for (const e of result.balance.enemies) console.log(`  Enemy ${e.name}: valid=${e.result.is_valid} TP=${e.result.consumed_points}/${e.result.total_points}`);
    }
    expect(result.success).toBe(true);
    expect(result.type).toBe('quest');
  });
});
