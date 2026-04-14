Code: Wirth-Dawn Specification v14.0 (Battle System v3.3)
# Battle System & Data Architecture

## 1. 讎りｦ・(Overview)
譛ｬ莉墓ｧ俶嶌縺ｯ縲，ode: Wirth-Dawn 縺ｮ繝舌ヨ繝ｫ繧ｷ繧ｹ繝・Β縺ｮ螳夂ｾｩ縺ｧ縺ゅｋ縲・繝舌ヨ繝ｫ縺ｮ螟ｧ驛ｨ蛻・・**繧ｯ繝ｩ繧､繧｢繝ｳ繝医し繧､繝会ｼ・gameStore.ts`・・*縺ｧ蜃ｦ逅・＆繧後√し繝ｼ繝舌・API (`/api/battle/turn`) 縺ｯ陬懷勧逧・↑謨ｵ陦悟虚蜃ｦ逅・ｒ諡・≧縲・
<!-- v14.0: HP繝舌・繝ｪ繧｢繝ｫ繧ｿ繧､繝蜷梧悄・医・繝ｼ繧ｫ繝ｼ譁ｹ蠑擾ｼ峨√き繝ｼ繝永mage_url/description蜿門ｾ励ヵ繝ｭ繝ｼ謾ｹ蝟・√ヱ繝ｼ繝・ぅHP菫ｮ豁｣ -->

**Core Philosophy:**
- **Determinism**: 繝繝｡繝ｼ繧ｸ險育ｮ励↓荵ｱ謨ｰ繧・せ繧ｱ繝ｼ繝ｪ繝ｳ繧ｰ繧貞性繧√★縲∬ｨ育ｮ鈴壹ｊ縺ｮ邨先棡繧貞・蜉帙☆繧具ｼ亥ｮ悟・諠・ｱ繧ｲ繝ｼ繝・峨・- **High Risk**: 謨怜圏譎ゅ・繝ｪ繧ｽ繝ｼ繧ｹ蜈ｨ繝ｭ繧ｹ繝医→縲∝屓蠕ｩ縺励↑縺Хitality・亥ｯｿ蜻ｽ・峨↓繧医ｋ邱雁ｼｵ諢溘・
---

## 2. 繝・・繧ｿ繧｢繝ｼ繧ｭ繝・け繝√Ε (Data Architecture)

### 2.1 髢｢騾｣繝・・繝悶Ν

| 繝・・繝悶Ν | 荳ｻ隕√き繝ｩ繝 | 逕ｨ騾・|
|---|---|---|
| `enemies` | slug, hp, atk, def, action_pattern, image_url | 謨ｵ繝・・繧ｿ螳夂ｾｩ |
| `enemy_skills` | slug, name, value, effect_type, inject_card_id | 謨ｵ繧ｹ繧ｭ繝ｫ螳夂ｾｩ |
| `cards` | id, name, type, cost_val, effect_val, description, image_url, ap_cost, target_type, effect_id | 繧ｫ繝ｼ繝峨ョ繝ｼ繧ｿ・・3.3: image_url/description繧ｫ繝ｩ繝霑ｽ蜉貂医∩・・|
| `skills` | id, slug, name, card_id, image_url, description, base_price, deck_cost | 繧ｹ繧ｭ繝ｫ繧｢繧､繝・Β螳夂ｾｩ |
| `user_skills` | id, user_id, skill_id, is_equipped | 繝ｦ繝ｼ繧ｶ繝ｼ陬・ｙ繧ｹ繧ｭ繝ｫ |
| `items` | id, slug, name, type, base_price, effect_data, image_url | 繧｢繧､繝・Β/豸郁怜刀螳夂ｾｩ |

### 2.2 繝輔Ο繝ｳ繝医お繝ｳ繝牙梛螳夂ｾｩ
<!-- v12.0: StatusEffect 縺ｫ value 繝輔ぅ繝ｼ繝ｫ繝芽ｿｽ蜉・域署譯・・峨ｒ蜿肴丐 -->
```typescript
export type CardType = 'Skill' | 'Item' | 'Basic' | 'Personality' | 'Consumable' | 'noise';
export type TargetType = 'single_enemy' | 'all_enemies' | 'random_enemy' | 'self' | 'single_ally' | 'all_allies';

export interface Card {
  id: string;
  name: string;
  type: CardType;
  description: string;
  cost: number;
  ap_cost?: number;
  power?: number;
  isEquipment?: boolean;
  source?: string;
  effect_id?: string;
  effect_duration?: number;
  target_type?: TargetType;
  discard_cost?: number;      // Noise蟒・｣・さ繧ｹ繝・(AP)
  isInjected?: boolean;       // 迺ｰ蠅・き繝ｼ繝・(Cost 0謇ｱ縺・
  cost_type?: 'mp' | 'vitality';
  image_url?: string;         // v3.3: 繝舌ヨ繝ｫUI繧ｫ繝ｼ繝臥判蜒・}

// v3.0: StatusEffect 縺ｫ value 繝輔ぅ繝ｼ繝ｫ繝峨ｒ霑ｽ蜉・域署譯・・・export interface StatusEffect {
  id: StatusEffectId;
  duration: number;
  value?: number; // def_up: DEF蜉邂怜､・・effect_val・・ atk_down: 譛ｪ菴ｿ逕ｨ・亥崋螳・.7蛟搾ｼ臥ｭ・}

export type StatusEffectId =
  | 'atk_up' | 'def_up' | 'def_up_heavy' | 'taunt' | 'regen' | 'poison'
  | 'stun' | 'bind' | 'bleed' | 'bleed_minor' | 'fear' | 'stun_immune'
  | 'blind' | 'blind_minor' | 'evasion_up' | 'atk_down'
  | 'cure_status' | 'cure_debuff' | 'ap_max';

export interface Enemy {
  id: string;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  def?: number;
  slug?: string;
  traits?: string[];
  vit_damage?: number;
  status_effects?: StatusEffect[]; // v3.0: value莉倥″StatusEffect繧剃ｽｿ逕ｨ
  drop_rate?: number;
  drop_item_slug?: string;
  image_url?: string;
}
```

---

## 3. 繝舌ヨ繝ｫ蛻晄悄蛹・(Battle Initialization)
<!-- v14.0: v3.3縺ｮ螳溯｣・ｒ蜿肴丐 -->

### 繝舌ヨ繝ｫ蛻晄悄蛹悶・豬√ｌ

`startBattle(enemiesInput: Enemy | Enemy[])` 縺ｧ蛻晄悄蛹悶・
1. **Multi-Enemy蟇ｾ蠢・*: 蜈･蜉帙・蜊倅ｽ・or 驟榊・縲よ怙螟ｧ5菴馴・鄂ｮ蜿ｯ閭ｽ縲・2. **繝代・繝・ぅ蜿門ｾ・*: `GET /api/party/list` 縺九ｉDB縺ｮ繝代・繝・ぅ繝｡繝ｳ繝舌・繧貞叙蠕励・3. **繧､繝ｳ繝吶Φ繝医Μ蜿門ｾ暦ｼ・3.3霑ｽ蜉・・*: `fetchInventory()` 繧貞ｿ・★螳溯｡後＠縲∵怙譁ｰ縺ｮ image_url / description 繧貞性繧陬・ｙ繧ｹ繧ｭ繝ｫ繝・・繧ｿ繧貞叙蠕励☆繧九ゅく繝｣繝・す繝･・・ustand persist・峨・蜿､縺・ョ繝ｼ繧ｿ繧剃ｽｿ繧上↑縺・◆繧√・謗ｪ鄂ｮ縲・4. **繝・ャ繧ｭ讒狗ｯ・*: 陬・ｙ荳ｭ繧､繝ｳ繝吶Φ繝医Μ繧｢繧､繝・Β (`is_equipped: true`) 縺九ｉ繧ｫ繝ｼ繝峨ｒ逕滓・縲Ａeffect_data.image_url` / `effect_data.description` 繧偵き繝ｼ繝峨↓莉伜刈縲・5. **繧ｫ繝ｼ繝峨・繝ｼ繝ｫ繝輔ぉ繝・メ・・3.3霑ｽ蜉・・*: NPC繧ｫ繝ｼ繝峨↓蜉縺医※縲∝・譛溘き繝ｼ繝会ｼ・d=1縲・0: 蠑ｷ謇薙・譁ｬ謦・・髦ｲ蠕｡遲会ｼ峨ｂDB縺九ｉ `cards` 繝・・繝悶Ν繧医ｊ荳諡ｬ繝輔ぉ繝・メ縺・`image_url` / `description` 繧剃ｻ倅ｸ弱・6. **繝代・繝・ぅ繧ｫ繝ｼ繝画ｷｷ蜈･**: NPC 縺ｮ `inject_cards` 縺九ｉ繧ｫ繝ｼ繝迂D繧定ｧ｣豎ｺ縺励√ョ繝・く縺ｫ霑ｽ蜉縲・7. **迺ｰ蠅・き繝ｼ繝・*: `buildBattleDeck()` 蜀・〒 `worldState.status` 縺ｫ蠢懊§縺滓ｳｨ蜈･蜃ｦ逅・・8. **蛻晄悄AP**: `current_ap: 5`縲・9. **陬・ｙ蜩√・繝ｼ繝翫せ**: `gameStore.equipBonus`・医せ繝医い繝ｬ繝吶Ν縺ｧ邂｡逅・ｼ峨ｒ `battleState.equipBonus` 縺ｫ繧ｳ繝斐・縲・   - `fetchEquipment()` 縺・`fetchUserProfile()` 蜀・〒閾ｪ蜍募他縺ｳ蜃ｺ縺輔ｌ繧九・   - `getEffectiveAtk(userProfile, battleState)` 縺翫ｈ縺ｳ `getEffectiveDef` 繝倥Ν繝代・髢｢謨ｰ縺ｧ螳溷柑蛟､繧定ｨ育ｮ励・10. **蜈ｱ魑ｴ繝懊・繝翫せ**: 蜷梧侠轤ｹ繝励Ξ繧､繝､繝ｼ縺悟惠鬧舌＠縺ｦ縺・ｋ蝣ｴ蜷・`resonanceActive: true` 竊・ATK/DEF +10%縲・11. **縲振I/繝｢繝舌う繝ｫ蟇ｾ蠢懊全PA謖吝虚**: 繝舌ヨ繝ｫ逕ｻ髱｢縺ｯ蜊倡峡縺ｮ繝壹・繧ｸ驕ｷ遘ｻ・・/battle`・峨ｒ陦後ｏ縺壹∵侠轤ｹ繝ｻ繧ｯ繧ｨ繧ｹ繝磯ｲ陦檎判髱｢・・quest/[id]/page.tsx`・牙・縺ｫ繝阪せ繝医＆繧後◆迥ｶ諷・(`<BattleView />`) 縺ｧSPA縺ｨ縺励※繧ｷ繝ｼ繝繝ｬ繧ｹ縺ｫ髢矩哩縺輔ｌ繧九・
### BattleState 讒矩
<!-- v12.0: 螳溯｣・・BattleState蝙九ｒ蜿肴丐 -->
```typescript
export interface BattleState {
  enemy: Enemy | null;          // 迴ｾ蝨ｨ縺ｮ繧ｿ繝ｼ繧ｲ繝・ヨ
  enemies: Enemy[];             // 蜈ｨ謨ｵ繝ｪ繧ｹ繝・(v3.5: multi-enemy)
  party: PartyMember[];
  turn: number;
  current_ap: number;
  messages: string[];           // v3.3: __hp_sync:NNN / __party_sync:ID:NNN 繝槭・繧ｫ繝ｼ繧貞性繧・・I髱櫁｡ｨ遉ｺ・・  isVictory: boolean;
  isDefeat: boolean;
  currentTactic: 'Aggressive' | 'Defensive' | 'Standby';
  player_effects: StatusEffect[]; // v3.0: value莉倥″StatusEffect
  enemy_effects: StatusEffect[];
  exhaustPile: any[];
  consumedItems: string[];
  vitDamageTakenThisTurn?: boolean;  // drain_vit 1繧ｿ繝ｼ繝ｳ1蝗槫宛髯・  battle_result?: string;
  // v3.1: 繝懊・繝翫せ邂｡逅・ｼ・etEffectiveAtk/Def 縺ｧ蜿ら・・・  resonanceActive: boolean;          // 蜈ｱ魑ｴ繝懊・繝翫せ: ATK/DEF +10%
  equipBonus: { atk: number; def: number; hp: number }; // 陬・ｙ蜩√・繝ｼ繝翫せ蜷郁ｨ・}
```

---

## 4. 繧ｿ繝ｼ繝ｳ騾ｲ陦後・繝ｭ繧ｻ繧ｹ (Turn Sequence)

### 4.1 繝輔ぉ繝ｼ繧ｺ隧ｳ邏ｰ
1. **Draw Phase (繝峨Ο繝ｼ)**: `dealHand()` 窶・謇区惆縺御ｸ企剞譫壽焚縺ｫ縺ｪ繧九∪縺ｧ蠑輔￥縲ょｱｱ譛ｭ荳崎ｶｳ譎ゅ・謐ｨ縺ｦ譛ｭ繧偵Μ繧ｷ繝｣繝・ヵ繝ｫ縲・   - **謇区惆荳企剞**: Lv1-4: 4譫・/ Lv5-9: 5譫・/ Lv10+: 6譫・2. **Energy Phase (AP蝗槫ｾｩ)**: `AP = Min(10, CurrentAP + 5)`縲４tun/Bind迥ｶ諷区凾縺ｯAP蝗槫ｾｩ縺ｪ縺励・3. **Action Phase (陦悟虚)**: AP縺後≠繧矩剞繧願｡悟虚蜿ｯ閭ｽ縲・   - **Purge (繝弱う繧ｺ蟒・｣・**: `type: noise` 縺ｮ繧ｫ繝ｼ繝峨・ `discard_cost`・医ョ繝輔か繝ｫ繝・ AP・峨ｒ謾ｯ謇輔▲縺ｦ謇区惆縺九ｉ豸域ｻ・ｼ・xhaust・峨・4. **End Phase (繧ｿ繝ｼ繝ｳ邨ゆｺ・**: `endTurn()` 窶・迥ｶ諷狗焚蟶ｸ縺ｮ蜃ｦ逅・ｼ・oison: HP -5%, Regen: HP蝗槫ｾｩ・峨√ヰ繝輔・繝・ヰ繝輔・譛滄俣貂帷ｮ励・5. **Party Phase (蜻ｳ譁ｹ陦悟虚)**: `processPartyTurn()` 窶・蜷НPC縺窟I蛻､螳壹〒陦悟虚縲・6. **Enemy Phase (謨ｵ陦悟虚)**: `processEnemyTurn()` 窶・蜈ｨ逕溷ｭ俶雰縺碁・↓陦悟虚・・3.0: 繧ｹ繧ｿ繝ｳ/blind/evasion_up蜿肴丐・峨・
### 4.2 繧ｿ繝ｼ繝ｳ蛻ｶ髯・(Turn Limit)
- **Limit**: 30繧ｿ繝ｼ繝ｳ縲・- **Result**: 30繧ｿ繝ｼ繝ｳ邨碁℃譎らせ縺ｧ謨ｵ縺檎函蟄倥＠縺ｦ縺・ｋ蝣ｴ蜷医～battle_result: 'time_over'` 縺ｧ **謨怜圏** 縺ｨ縺ｪ繧九・
---

## 5. 繝繝｡繝ｼ繧ｸ縺ｨ繧ｹ繝・・繧ｿ繧ｹ險育ｮ・(v3.0)

### 5.1 繝励Ξ繧､繝､繝ｼ縺ｮ謾ｻ謦・ム繝｡繝ｼ繧ｸ險育ｮ・<!-- v13.0: equipBonus.atk 縺ｨ resonanceActive 繧貞渚譏縺励◆螳溷柑ATK險育ｮ励ｒ霑ｽ險・-->
```
// 螳溷柑ATK險育ｮ・(gameStore getEffectiveAtk 繝倥Ν繝代・)
EffectiveATK = (userProfile.atk + battleState.equipBonus.atk)
               ﾃ・(battleState.resonanceActive ? 1.1 : 1.0)

// 繝繝｡繝ｼ繧ｸ險育ｮ・BaseDamage = Card.Power + EffectiveATK
BuffedDamage = floor(BaseDamage ﾃ・AtkMod)    // atk_up譎・ﾃ・.5
FinalDamage = Max(1, BuffedDamage - Enemy.DEF - 0)  // 迚ｩ逅・・縺ｿ
              or Max(1, BuffedDamage)              // 鬲疲ｳ・pierce・・EF辟｡隕厄ｼ・```
- `AtkMod`: `atk_up` 莉倅ｸ取凾 1.5縲√◎繧御ｻ･螟・1.0縲・
### 5.2 謨ｵ謾ｻ謦・・繝励Ξ繧､繝､繝ｼ縺ｸ縺ｮ繝繝｡繝ｼ繧ｸ險育ｮ暦ｼ・3.0・・<!-- v12.0: def_up蝗ｺ螳壼､蜉邂励∥tk_down/blind/evasion_up霑ｽ蜉繧貞渚譏 -->
```
// 謨ｵ繧ｹ繧ｿ繝ｳ荳ｭ繝√ぉ繝・け
if (enemy.stun || enemy.bind) 竊・陦悟虚繧ｹ繧ｭ繝・・

// 逶ｮ貎ｰ縺暦ｼ・lind・峨Α繧ｹ蛻､螳・if (enemy.blind) 竊・50%縺ｧ繝溘せ・郁｡悟虚繧ｹ繧ｭ繝・・・・if (enemy.blind_minor) 竊・30%縺ｧ繝溘せ・郁｡悟虚繧ｹ繧ｭ繝・・・・
// 謨ｵ縺ｮ謾ｻ謦・鴨險育ｮ・BaseEnemyATK = Enemy.level ﾃ・3 + 5
EnemyATK = floor(BaseEnemyATK ﾃ・skill.value ﾃ・AtkDownMod)
  // AtkDownMod: 謨ｵ縺ｫatk_down縺後≠繧後・ ﾃ・.7縲√↑縺代ｌ縺ｰﾃ・.0

// 繝励Ξ繧､繝､繝ｼ蝗樣∩・・vasion_up・・if (player.evasion_up) 竊・30%縺ｧ繝溘せ・郁｡悟虚繧ｹ繧ｭ繝・・・・
// 繝繝｡繝ｼ繧ｸ險育ｮ暦ｼ・3.1: equipBonus.def 縺ｨ resonanceActive 繧定・・・・EffectiveDEF = (userProfile.def + battleState.equipBonus.def)
               ﾃ・(battleState.resonanceActive ? 1.1 : 1.0)
DefSkillBonus = player_effects.def_up.value ?? 0   // StatusEffect.value縺九ｉ蜿門ｾ・MitigatedDamage = Max(1, EnemyATK - EffectiveDEF - DefSkillBonus)
```

**v3.0縺ｮ驥崎ｦ∝､画峩** 窶・`def_up` 縺ｮ險育ｮ玲婿蠑上・螟画峩:
- **譌ｧ譁ｹ蠑擾ｼ・2.x・・*: `def_up` 莉倅ｸ取凾縲√ム繝｡繝ｼ繧ｸ縺ｫ蝗ｺ螳・.5蛟堺ｹ礼ｮ暦ｼ亥・繧ｫ繝ｼ繝牙酔荳蜉ｹ譫懶ｼ・- **譁ｰ譁ｹ蠑擾ｼ・3.0・・*: `def_up.value`・・ 繧ｫ繝ｼ繝峨・ `effect_val`・峨ｒDEF縺ｫ蜉邂・  - `card_guard` (effect_val=10) 竊・DEF+10
  - `card_holy_wall` (effect_val=20) 竊・DEF+20
  - `card_iron_body` / `def_up_heavy` (effect_val=30) 竊・DEF+30
  - `card_absolute_def` (effect_val=50) 竊・DEF+50

### 5.3 繧ｹ繧ｭ繝ｫ縺ｪ縺暦ｼ医ヵ繧ｩ繝ｼ繝ｫ繝舌ャ繧ｯ / `action_pattern` 譛ｪ螳夂ｾｩ縺ｮ蝣ｴ蜷茨ｼ・```
EnemyATK = Enemy.level ﾃ・5 + 10
MitigatedDamage = Max(1, EnemyATK - Player.DEF - DefBonus)
```

### 5.4 迚ｹ谿翫ム繝｡繝ｼ繧ｸ・啖itality (蟇ｿ蜻ｽ)
- **Effect**: `drain_vit` 繝医Ξ繧､繝医ｒ謖√▽謨ｵ謾ｻ謦・・ `user.vitality` 繧堤峩謗･貂帙ｉ縺吶・- **Damage Value**: 蝗ｺ螳壹〒 **-1**縲・- **Safety Cap**: `vitDamageTakenThisTurn` 繝輔Λ繧ｰ縺ｫ繧医ｊ縲・*1繧ｿ繝ｼ繝ｳ縺ｫ縺､縺肴怙螟ｧ1蝗槭∪縺ｧ**縲・- **豌ｸ邯壼喧**: `POST /api/profile/consume-vitality` 縺ｧ蜊ｳ蠎ｧ縺ｫDB縺ｫ蜿肴丐縲・
---

## 6. 繝ｪ繧ｽ繝ｼ繧ｹ縺ｮ豌ｸ邯壽ｧ縺ｨ繝ｭ繧ｹ繝・(Persistence & Risk)
<!-- v11.0: useQuestState.ts 縺ｮ螳溯｣・ｒ蜿肴丐 -->

| Resource | Rule | 螳溯｣・|
|---|---|---|
| HP | Carry Over (謖√■雜翫＠) | `useQuestState.playerHp` 縺ｧ邂｡逅・|
| AP / Deck | Reset | 繝舌ヨ繝ｫ縺斐→縺ｫ蛻晄悄蛹・|
| Loot / EXP | Risk (蜈ｨ繝ｭ繧ｹ繝・ | `useQuestState.lootPool` 窶・謨怜圏譎ゅ↓遨ｺ驟榊・蛹・|
| NPC | Permadeath (豸域ｻ・ | `useQuestState.deadNpcs` 窶・HP0縺ｧ `is_active: false` 縺ｫ譖ｴ譁ｰ |
| Consumables | Consumed | `useQuestState.consumedItems` 縺ｧ霑ｽ霍｡ |

---

## 7. 繧ｷ繧ｹ繝・Β髢灘ｹｲ貂峨・隗｣豎ｺ (Conflict Resolution)

### 7.1 迺ｰ蠅・き繝ｼ繝我ｻ句・ (World Injection)
- 迺ｰ蠅・き繝ｼ繝会ｼ・njection Cards・峨・**繝・ャ繧ｭ繧ｳ繧ｹ繝郁ｨ育ｮ励・蟇ｾ雎｡螟厄ｼ・ost 0謇ｱ縺・ｼ・*縲・- `buildBattleDeck()` 縺ｮ繝舌Μ繝・・繧ｷ繝ｧ繝ｳ蠕後↓謖ｿ蜈･縲・- `isInjected: true` 繝輔Λ繧ｰ縺ｧ隴伜挨縲・
### 7.2 豎壽沒繧ｫ繝ｼ繝牙ｯｾ遲・(Noise Handling)
- 蜈ｨ `type: noise` 繧ｫ繝ｼ繝峨↓縲悟ｻ・｣・(Purge)縲阪い繧ｯ繧ｷ繝ｧ繝ｳ縺御ｻ倅ｸ弱＆繧後※縺・ｋ縲・- Cost: `card.discard_cost ?? 1` AP縲・- Effect: 縺昴・繧ｫ繝ｼ繝峨ｒ `exhaustPile` 縺ｫ遘ｻ蜍包ｼ医ご繝ｼ繝縺九ｉ髯､螟厄ｼ峨・
### 7.3 谿句ｽｱ縺ｮ荳肴ｭ｣蛻ｩ逕ｨ髦ｲ豁｢ (Shadow Constraints)
- Shadow・郁恭髴奇ｼ臥匳骭ｲ譎ゅ～inject_cards` 縺ｫ菫晏ｭ倥〒縺阪ｋ縺ｮ縺ｯ **`type === 'skill'` 縺ｮ繧｢繧､繝・Β縺ｮ縺ｿ**・遺怛 螳溯｣・ｸ医∩・峨・- `type: 'consumable'`・域ｶ郁ｲｻ繧｢繧､繝・Β・峨・逋ｻ骭ｲ繧貞宍蟇・↓遖∵ｭ｢縲・- `cost_type: 'vitality'`・亥ｯｿ蜻ｽ繧ｳ繧ｹ繝医き繝ｼ繝会ｼ峨・ `type` 繝√ぉ繝・け縺ｮ谿ｵ髫弱〒閾ｪ蜍暮勁螟悶＆繧後ｋ縲・
---

## 8. 繧ｿ繝ｼ繧ｲ繝・ヨ縺ｨAI謖吝虚 (Targeting)

### 8.1 繝励Ξ繧､繝､繝ｼ縺ｮ繧ｿ繝ｼ繧ｲ繝・ヨ驕ｸ謚・- 謖・ｮ壹↑縺励・蝣ｴ蜷医～battleState.enemy` (迴ｾ蝨ｨ縺ｮ繧ｿ繝ｼ繧ｲ繝・ヨ) 繧剃ｽｿ逕ｨ縲・- 繧ｿ繝ｼ繧ｲ繝・ヨ縺梧ｭｻ莠｡縺励※縺・ｋ蝣ｴ蜷医∵怙蛻昴・逕溷ｭ俶雰縺ｫ閾ｪ蜍輔せ繧､繝・メ縲・- `setTarget(enemyId)` 縺ｧ繧ｿ繝ｼ繧ｲ繝・ヨ螟画峩蜿ｯ閭ｽ縲・
### 8.2 謨ｵ縺ｮ謾ｻ謦・Ν繝ｼ繝・ぅ繝ｳ繧ｰ
- 蜷НPC縺ｮ `cover_rate` 縺ｫ蝓ｺ縺･縺咲｢ｺ邇・〒蠎・≧縲・- 蠎・▲縺溷ｴ蜷・NPC 縺後ム繝｡繝ｼ繧ｸ繧貞女縺代ｋ・・PC.DEF 縺ｧ霆ｽ貂幢ｼ峨・
### 8.3 迥ｶ諷狗焚蟶ｸ・・3.0 螳悟・荳隕ｧ・・<!-- v12.0: v3.0螳溯｣・ｸ医∩縺ｮ蜈ｨ蜉ｹ譫懊ｒ霑ｽ險・-->

| 蜉ｹ譫・| 莉倅ｸ主・ | 隧ｳ邏ｰ |
|---|---|---|
| `stun` / `bind` | 謨ｵ/繝励Ξ繧､繝､繝ｼ | 莉倅ｸ弱＆繧後◆繧ｿ繝ｼ繝ｳ縲∬｡悟虚荳崎・縲・P蝗槫ｾｩ繧ゅ↑縺励・|
| `poison` | 謨ｵ/繝励Ξ繧､繝､繝ｼ | 繧ｿ繝ｼ繝ｳ邨ゆｺ・凾 HP -5% (Min 1)縲・|
| `regen` | 繝励Ξ繧､繝､繝ｼ | 繧ｿ繝ｼ繝ｳ邨ゆｺ・凾 HP +5% (Min 1)縲・|
| `atk_up` | 繝励Ξ繧､繝､繝ｼ | 荳弱ム繝｡繝ｼ繧ｸ ﾃ・.5縲・|
| `def_up` / `def_up_heavy` | 繝励Ξ繧､繝､繝ｼ | **蜿励￠繧九ム繝｡繝ｼ繧ｸ繧・`value` 蛻・崋螳夊ｻｽ貂・*・・alue = effect_val・峨・|
| `bleed` | 繝励Ξ繧､繝､繝ｼ | 繧ｫ繝ｼ繝我ｽｿ逕ｨ譎ゅ↓霑ｽ蜉3繝繝｡縲・|
| `bleed_minor` | 繝励Ξ繧､繝､繝ｼ | 繧ｫ繝ｼ繝我ｽｿ逕ｨ譎ゅ↓霑ｽ蜉1繝繝｡縲・|
| `blind` | 謨ｵ | 謨ｵ縺ｮ謾ｻ謦・′50%縺ｧ繝溘せ縲・|
| `blind_minor` | 謨ｵ | 謨ｵ縺ｮ謾ｻ謦・′30%縺ｧ繝溘せ縲・|
| `evasion_up` | 繝励Ξ繧､繝､繝ｼ | 謨ｵ縺ｮ謾ｻ謦・ｒ30%縺ｧ螳悟・蝗樣∩縲・|
| `atk_down` | 謨ｵ | 謨ｵ縺ｮ荳弱ム繝｡繝ｼ繧ｸ縺古・.7縺ｫ縺ｪ繧九・|
| `cure_status` | 窶・| 蜊ｳ譎ゑｼ嗔oison/bleed/stun遲峨ｒ隗｣髯､縲・|
| `cure_debuff` | 窶・| 蜊ｳ譎ゑｼ啾tk_down/blind遲峨ｒ隗｣髯､縲・|
| `taunt` | 繝励Ξ繧､繝､繝ｼ | 謨ｵ縺ｮ蜊倅ｽ捺判謦・ｒ蠑輔″蜿励￠繧九・|
| `stun_immune` | 繝励Ξ繧､繝､繝ｼ | 谺｡蝗槭せ繧ｿ繝ｳ莉倅ｸ弱ｒ1蝗樒┌蜉ｹ蛹悶・|

---

## 9. 繧ｵ繝ｼ繝舌・繧ｵ繧､繝芽｣懷勧API

### 9.1 POST /api/battle/turn
謨ｵ繧ｿ繝ｼ繝ｳ縺ｮ蜃ｦ逅・ｒ陦後≧繧ｵ繝ｼ繝舌・API・医け繝ｩ繧､繧｢繝ｳ繝医し繧､繝牙・逅・→菴ｵ逕ｨ・峨・
- 謨ｵ繧ｹ繧ｭ繝ｫ縺ｮ `action_pattern` 縺ｫ蝓ｺ縺･縺乗擅莉ｶ莉倥″繧ｹ繧ｭ繝ｫ驕ｸ謚槭・- `effect_type: 'inject'` 縺ｧ繝・ャ繧ｭ豕ｨ蜈･縲・- `effect_type: 'drain_vit'` 縺ｧVitality謾ｻ謦・・- Meat Shield 繝ｭ繧ｸ繝・け・・PC `cover_rate` 縺ｫ繧医ｋ蠎・＞・峨・
> **Note (v13.0)**: 迴ｾ蝨ｨ縲√ヰ繝医Ν縺ｮ荳ｻ隕√Ο繧ｸ繝・け・医ム繝｡繝ｼ繧ｸ險育ｮ励√ち繝ｼ繝ｳ騾ｲ陦後∝享謨怜愛螳夲ｼ峨・蜈ｨ縺ｦ繧ｯ繝ｩ繧､繧｢繝ｳ繝医し繧､繝会ｼ・gameStore.ts`・峨〒蜃ｦ逅・＆繧後※縺・ｋ縲・> `/api/battle/turn` 縺ｯ迴ｾ蝨ｨ繝・ャ繝峨さ繝ｼ繝臥憾諷九□縺後∝ｰ・擂縺ｮ荳肴ｭ｣髦ｲ豁｢繝ｻ繝槭Ν繝√・繝ｬ繧､繝､繝ｼ蟇ｾ蠢懊・縺溘ａ縺ｮ縲梧ｨｩ螽√し繝ｼ繝舌・縲崎・蜉帙→縺励※菫晄戟繝ｻ謨ｴ蛯吶☆繧九・
---

## 10. 陬・ｙ蜩√・繝ｼ繝翫せ縺ｮ繝舌ヨ繝ｫ縺ｸ縺ｮ驕ｩ逕ｨ (v3.1)

### 10.1 繝・・繧ｿ縺ｮ豬√ｌ

```
[陬・ｙ繧ｿ繝望 陬・ｙ繝懊ち繝ｳ
    竊・POST /api/equipment 竊・equipped_items 繝・・繝悶Ν
    竊・PATCH /api/inventory 竊・inventory.is_equipped = true (蜷梧悄)
    竊・fetchEquipment() 竊・gameStore.equipBonus / gameStore.equippedItems 譖ｴ譁ｰ

[繝舌ヨ繝ｫ髢句ｧ犠 (v3.3謾ｹ險・
    竊・startBattle()
        竊・fetchInventory() 繧貞ｿ・★螳溯｡鯉ｼ医く繝｣繝・す繝･遐ｴ譽・ｼ・        竊・get().equipBonus 繧・battleState.equipBonus 縺ｫ繧ｻ繝・ヨ
        竊・getEffectiveAtk/Def 繝倥Ν繝代・縺ｧ螳溷柑蛟､險育ｮ・ 竊・謾ｻ謦・・陲ｫ蠑ｾ譎ゅ↓蜿ら・
```

### 10.2 繧ｹ繝医い繝ｬ繝吶Ν邂｡逅・
| 繝輔ぅ繝ｼ繝ｫ繝・| 蝣ｴ謇 | 隱ｬ譏・|
|---|---|---|
| `equipBonus` | `GameState` | `{atk, def, hp}` 陬・ｙ蜩√・繝ｼ繝翫せ蜷郁ｨ・|
| `equippedItems` | `GameState` | 陬・ｙ荳ｭ繧｢繧､繝・Β繧ｪ繝悶ず繧ｧ繧ｯ繝磯・蛻・(UI陦ｨ遉ｺ逕ｨ) |
| `fetchEquipment()` | `GameState` | `/api/equipment` 繧貞他縺ｳ store 繧呈峩譁ｰ |

### 10.3 繝倥Ν繝代・髢｢謨ｰ

```typescript
// src/store/gameStore.ts
function getEffectiveAtk(userProfile, battleState): number {
  const base = (userProfile?.atk ?? 1) + (battleState?.equipBonus?.atk ?? 0);
  return battleState?.resonanceActive ? Math.floor(base * 1.1) : base;
}

function getEffectiveDef(userProfile, battleState): number {
  const base = (userProfile?.def ?? 0) + (battleState?.equipBonus?.def ?? 0);
  return battleState?.resonanceActive ? Math.floor(base * 1.1) : base;
}

function getEffectiveMaxHp(userProfile, battleState): number {
  const base = (userProfile?.max_hp ?? 100) + (battleState?.equipBonus?.hp ?? 0);
  return battleState?.resonanceActive ? Math.floor(base * 1.1) : base;
}
```

---

## 11. 迥ｶ諷狗焚蟶ｸ繝舌ャ繧ｸ UI (v3.1)

### 11.1 讎りｦ・
繝舌ヨ繝ｫ逕ｻ髱｢縺ｫ縺翫＞縺ｦ縲∵怏蜉ｹ縺ｪ迥ｶ諷狗焚蟶ｸ・・uff / debuff・峨ｒ繧｢繧､繧ｳ繝ｳ荳翫↓繝ｪ繧｢繝ｫ繧ｿ繧､繝陦ｨ遉ｺ縺吶ｋ縲・
**螳溯｣・さ繝ｳ繝昴・繝阪Φ繝・*: `src/components/battle/StatusEffectBadges.tsx`

### 11.2 陦ｨ遉ｺ蟇ｾ雎｡

| 蟇ｾ雎｡ | 繧ｵ繧､繧ｺ | 迥ｶ諷句盾辣ｧ蜈・| 譛螟ｧ謨ｰ |
|---|---|---|---|
| 繧ｿ繝ｼ繧ｲ繝・ヨ謨ｵ・亥､ｧ繧ｹ繝励Λ繧､繝亥ｷｦ荳奇ｼ・| md (18px) | `target.status_effects` | 6 |
| 髱槭ち繝ｼ繧ｲ繝・ヨ謨ｵ繧｢繧､繧ｳ繝ｳ・亥ｷｦ荳奇ｼ・| sm (14px) | `enemy.status_effects` | 3 |
| 繝励Ξ繧､繝､繝ｼ繧｢繧､繧ｳ繝ｳ・亥ｷｦ荳奇ｼ・| sm (14px) | `battleState.player_effects` | 6 |
| 繝代・繝・ぅ繝｡繝ｳ繝舌・繧｢繧､繧ｳ繝ｳ・亥ｷｦ荳奇ｼ・| sm (14px) | `member.status_effects` | 3 |

### 11.3 繝舌ャ繧ｸ螳夂ｾｩ

| 繝ｩ繝吶Ν | StatusEffectId | 繧ｫ繝・ざ繝ｪ | 濶ｲ | 轤ｹ貊・|
|---|---|---|---|---|
| `竊羨` | atk_up | BUFF | 繧ｪ繝ｬ繝ｳ繧ｸ | 縺ｪ縺・|
| `竊船` | def_up / def_up_heavy | BUFF | 髱・| 縺ｪ縺・|
| `笙･` | regen | BUFF | 邱・| 繧・▲縺上ｊ(1.5s) |
| `竊薦` | evasion_up | BUFF | 豌ｴ濶ｲ | 縺ｪ縺・|
| `笘・ | taunt | BUFF | 驥・| 縺ｪ縺・|
| `笳餐 | stun_immune | BUFF | 邏ｫ | 縺ｪ縺・|
| `S` | stun / bind | DEBUFF | 鮟・| 騾溘＞(0.6s) |
| `B` | blind / `b` blind_minor | DEBUFF | 阮・ｴｫ | 荳ｭ騾・1.0s) |
| `笘` | poison | DEBUFF | 鮟・ｷ・| 繧・▲縺上ｊ(1.5s) |
| `笨ｦ` / `笨ｧ` | bleed / bleed_minor | DEBUFF | 襍､ | 騾溘＞(0.6s) |
| `!` | fear | DEBUFF | 讖・| 荳ｭ騾・1.0s) |
| `竊鄭` | atk_down | DEBUFF | 證苓ｵ､ | 縺ｪ縺・|

### 11.4 陦ｨ遉ｺ繝ｫ繝ｼ繝ｫ

- `duration > 0` 縺ｮ蜉ｹ譫懊・縺ｿ陦ｨ遉ｺ・亥柑譫懷・繧後・閾ｪ蜍慕噪縺ｫ豸医∴繧具ｼ・- BUFF 蜆ｪ蜈茨ｼ亥ｷｦ・俄・ DEBUFF・亥承・峨・鬆・〒讓ｪ荳ｦ縺ｳ
- `cure_status` / `cure_debuff` / `ap_max` 縺ｯ蜊ｳ譎ょ柑譫懊・縺溘ａ髱櫁｡ｨ遉ｺ
- 繝帙ヰ繝ｼ譎ゅ↓ `{effectId} (谿九ｊ{duration}T)` 繝・・繝ｫ繝√ャ繝励ｒ陦ｨ遉ｺ

---

## 12. HP繝舌・縺ｮ繝ｪ繧｢繝ｫ繧ｿ繧､繝蜷梧悄・・3.3・・
### 12.1 讎りｦ・
繝繝｡繝ｼ繧ｸ繧・屓蠕ｩ縺ｮ繝・く繧ｹ繝医Ο繧ｰ縺後ち繧､繝励Λ繧､繧ｿ繝ｼ縺ｧ豬√ｌ繧九ち繧､繝溘Φ繧ｰ縺ｫ蜷医ｏ縺帙？P繝舌・繧呈ｮｵ髫守噪縺ｫ譖ｴ譁ｰ縺吶ｋ縲３eact 18縺ｮ閾ｪ蜍輔ヰ繝・メ蜃ｦ逅・ｒ蝗樣∩縺吶ｋ縺溘ａ縲・*繝ｭ繧ｰ繝槭・繧ｫ繝ｼ譁ｹ蠑・*繧呈治逕ｨ縲・
### 12.2 繝槭・繧ｫ繝ｼ蠖｢蠑・
| 繝槭・繧ｫ繝ｼ | 譖ｴ譁ｰ蟇ｾ雎｡ | 蠖｢蠑・|
|---|---|---|
| `__hp_sync:NNN` | 繝励Ξ繧､繝､繝ｼHP繝舌・ | NNN = 譖ｴ譁ｰ蠕粂P蛟､ |
| `__party_sync:ID:NNN` | 繝代・繝・ぅ繝｡繝ｳ繝舌・HP繝舌・ | ID = member.id, NNN = 譖ｴ譁ｰ蠕慧urability |

### 12.3 繝槭・繧ｫ繝ｼ謖ｿ蜈･繧ｿ繧､繝溘Φ繧ｰ

| 繧､繝吶Φ繝・| 謖ｿ蜈･邂・園 | 螳溯｣・|
|---|---|---|
| 謨ｵ縺九ｉ繝励Ξ繧､繝､繝ｼ縺ｸ縺ｮ繝繝｡繝ｼ繧ｸ | `processEnemyTurn` 窶・繝繝｡繝ｼ繧ｸ繝｡繝・そ繝ｼ繧ｸ逶ｴ蠕・| `newMessages.push(__hp_sync:newHp)` |
| 繝励Ξ繧､繝､繝ｼ縺ｮ豐ｻ逋偵き繝ｼ繝我ｽｿ逕ｨ | `attackEnemy` 窶・heal case 縺ｮ logMsg 蠕・| `healSyncHp` 繝ｭ繝ｼ繧ｫ繝ｫ螟画焚 竊・`__hp_sync` 霑ｽ蜉 |
| NPC縺後・繝ｬ繧､繝､繝ｼ繧呈ｲｻ逋・| `processPartyTurn` 窶・heal action 蜃ｦ逅・ｾ・| `newMessages.push(__hp_sync:newHp)` |
| 謨ｵ縺九ｉ繝代・繝・ぅ縺ｸ縺ｮ繝繝｡繝ｼ繧ｸ | `processEnemyTurn` 窶・繝繝｡繝ｼ繧ｸ繝｡繝・そ繝ｼ繧ｸ逶ｴ蠕・| `newMessages.push(__party_sync:ID:NNN)` |
| NPC縺後ヱ繝ｼ繝・ぅ繝｡繝ｳ繝舌・繧呈ｲｻ逋・| `processPartyTurn` 窶・heal action 蜃ｦ逅・ｾ・| `newMessages.push(__party_sync:ID:NNN)` + durability譖ｴ譁ｰ |

### 12.4 BattleView 縺ｧ縺ｮ蜃ｦ逅・
`BattleView.tsx` 縺ｮ `processQueue()` 髢｢謨ｰ縺後ち繧､繝励Λ繧､繧ｿ繝ｼ繧ｭ繝･繝ｼ繧貞・逅・＠縺ｪ縺後ｉ・・- `__hp_sync:NNN` 繧呈､懷・ 竊・`setLiveHp(NNN)` 竊・繝励Ξ繧､繝､繝ｼHP繝舌・繧貞叉譎よ峩譁ｰ・磯撼陦ｨ遉ｺ繝｡繝・そ繝ｼ繧ｸ・・- `__party_sync:ID:NNN` 繧呈､懷・ 竊・`setLivePartyDurability(prev => ({...prev, [ID]: NNN}))` 竊・隧ｲ蠖薙ヱ繝ｼ繝・ぅ繝｡繝ｳ繝舌・HP繝舌・繧貞叉譎よ峩譁ｰ・磯撼陦ｨ遉ｺ繝｡繝・そ繝ｼ繧ｸ・・
---

## 13. 螟画峩螻･豁ｴ

| 繝舌・繧ｸ繝ｧ繝ｳ | 譌･莉・| 荳ｻ縺ｪ螟画峩蜀・ｮｹ |
|---|---|---|
| v11.0 | 2026-04 | 螳溯｣・㍾隕悶・蜈ｨ髱｢謾ｹ險ゅ√け繝ｩ繧､繧｢繝ｳ繝医し繧､繝我ｸｻ菴灘喧 |
| v12.0 | 2026-04-11 | 繝舌ヨ繝ｫ繧ｨ繝ｳ繧ｸ繝ｳv3.0蟇ｾ蠢懶ｼ單ef_up蝗ｺ螳壼､蛹悶・遞ｮStatusEffectId霑ｽ蜉縲∵雰繧ｹ繧ｿ繝ｳ/blind/evasion_up/atk_down蟇ｾ蠢・|
| v13.0 | 2026-04-11 | 陬・ｙ蜩√・繝ｼ繝翫せ縺ｮ繝舌ヨ繝ｫ險育ｮ励∈縺ｮ驕ｩ逕ｨ・・quipBonus・峨・繧ｹ繝医い繝ｬ繝吶Ν邂｡逅・ｧｻ陦後・迥ｶ諷狗焚蟶ｸ繝舌ャ繧ｸUI霑ｽ蜉・・tatusEffectBadges・・|
| **v14.0** | **2026-04-12** | **HP繝舌・繝ｪ繧｢繝ｫ繧ｿ繧､繝蜷梧悄・医・繝ｼ繧ｫ繝ｼ譁ｹ蠑擾ｼ峨・繧ｫ繝ｼ繝永mage_url/description蜿門ｾ励ヵ繝ｭ繝ｼ謾ｹ蝟・・繝代・繝・ぅHP蜷梧悄・・ax_durability蜿ら・菫ｮ豁｣・峨・startBattle 縺ｧ縺ｮ fetchInventory 蠑ｷ蛻ｶ螳溯｡・* |



## 2. 繝・・繧ｿ繧｢繝ｼ繧ｭ繝・け繝√Ε (Data Architecture)

### 2.1 髢｢騾｣繝・・繝悶Ν

| 繝・・繝悶Ν | 荳ｻ隕√き繝ｩ繝 | 逕ｨ騾・|
|---|---|---|
| `enemies` | slug, hp, atk, def, action_pattern, image_url | 謨ｵ繝・・繧ｿ螳夂ｾｩ |
| `enemy_skills` | slug, name, value, effect_type, inject_card_id | 謨ｵ繧ｹ繧ｭ繝ｫ螳夂ｾｩ |
| `cards` | id, name, type, cost_val, effect_val, description, image_url | 繧ｫ繝ｼ繝峨ョ繝ｼ繧ｿ |
| `items` | id, slug, name, type, base_price, effect_data, image_url | 繧｢繧､繝・Β/繧ｹ繧ｭ繝ｫ螳夂ｾｩ |

### 2.2 繝輔Ο繝ｳ繝医お繝ｳ繝牙梛螳夂ｾｩ
<!-- v12.0: StatusEffect 縺ｫ value 繝輔ぅ繝ｼ繝ｫ繝芽ｿｽ蜉・域署譯・・峨ｒ蜿肴丐 -->
```typescript
export type CardType = 'Skill' | 'Item' | 'Basic' | 'Personality' | 'Consumable' | 'noise';
export type TargetType = 'single_enemy' | 'all_enemies' | 'random_enemy' | 'self' | 'single_ally' | 'all_allies';

export interface Card {
  id: string;
  name: string;
  type: CardType;
  description: string;
  cost: number;
  ap_cost?: number;
  power?: number;
  isEquipment?: boolean;
  source?: string;
  effect_id?: string;
  effect_duration?: number;
  target_type?: TargetType;
  discard_cost?: number;      // Noise蟒・｣・さ繧ｹ繝・(AP)
  isInjected?: boolean;       // 迺ｰ蠅・き繝ｼ繝・(Cost 0謇ｱ縺・
  cost_type?: 'mp' | 'vitality';
  image_url?: string;
}

// v3.0: StatusEffect 縺ｫ value 繝輔ぅ繝ｼ繝ｫ繝峨ｒ霑ｽ蜉・域署譯・・・export interface StatusEffect {
  id: StatusEffectId;
  duration: number;
  value?: number; // def_up: DEF蜉邂怜､・・effect_val・・ atk_down: 譛ｪ菴ｿ逕ｨ・亥崋螳・.7蛟搾ｼ臥ｭ・}

export type StatusEffectId =
  | 'atk_up' | 'def_up' | 'def_up_heavy' | 'taunt' | 'regen' | 'poison'
  | 'stun' | 'bind' | 'bleed' | 'bleed_minor' | 'fear' | 'stun_immune'
  | 'blind' | 'blind_minor' | 'evasion_up' | 'atk_down'
  | 'cure_status' | 'cure_debuff' | 'ap_max';

export interface Enemy {
  id: string;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  def?: number;
  slug?: string;
  traits?: string[];
  vit_damage?: number;
  status_effects?: StatusEffect[]; // v3.0: value莉倥″StatusEffect繧剃ｽｿ逕ｨ
  drop_rate?: number;
  drop_item_slug?: string;
  image_url?: string;
}
```

---

## 3. 繝舌ヨ繝ｫ蛻晄悄蛹・(Battle Initialization)
<!-- v11.0: gameStore.startBattle() 縺ｮ螳溯｣・ｒ蜿肴丐 -->

### 繝舌ヨ繝ｫ蛻晄悄蛹悶・豬√ｌ

`startBattle(enemiesInput: Enemy | Enemy[])` 縺ｧ蛻晄悄蛹悶・
1. **Multi-Enemy蟇ｾ蠢・*: 蜈･蜉帙・蜊倅ｽ・or 驟榊・縲よ怙螟ｧ5菴馴・鄂ｮ蜿ｯ閭ｽ縲・2. **繝代・繝・ぅ蜿門ｾ・*: `GET /api/party/list` 縺九ｉDB縺ｮ繝代・繝・ぅ繝｡繝ｳ繝舌・繧貞叙蠕励・3. **繝・ャ繧ｭ讒狗ｯ・*: 陬・ｙ荳ｭ繧､繝ｳ繝吶Φ繝医Μ繧｢繧､繝・Β (`is_equipped: true`) 縺九ｉ繧ｫ繝ｼ繝峨ｒ逕滓・縲・4. **繝代・繝・ぅ繧ｫ繝ｼ繝画ｷｷ蜈･**: NPC 縺ｮ `inject_cards` 縺九ｉ繧ｫ繝ｼ繝迂D繧定ｧ｣豎ｺ縺励√ョ繝・く縺ｫ霑ｽ蜉縲・5. **迺ｰ蠅・き繝ｼ繝・*: `buildBattleDeck()` 蜀・〒 `worldState.status` 縺ｫ蠢懊§縺滓ｳｨ蜈･蜃ｦ逅・・6. **蛻晄悄AP**: `current_ap: 5`縲・7. **陬・ｙ蜩√・繝ｼ繝翫せ**: `gameStore.equipBonus`・医せ繝医い繝ｬ繝吶Ν縺ｧ邂｡逅・ｼ峨ｒ `battleState.equipBonus` 縺ｫ繧ｳ繝斐・縲・   - `fetchEquipment()` 縺・`StatusModal` 襍ｷ蜍墓凾縺ｫ繧ｹ繝医い繧呈峩譁ｰ縺吶ｋ縺溘ａ縲√ヰ繝医Ν髢句ｧ区凾縺ｫ霑ｽ蜉API蜻ｼ縺ｳ蜃ｺ縺嶺ｸ崎ｦ√・   - `getEffectiveAtk(userProfile, battleState)` 縺翫ｈ縺ｳ `getEffectiveDef` 繝倥Ν繝代・髢｢謨ｰ縺ｧ螳溷柑蛟､繧定ｨ育ｮ励・8. **蜈ｱ魑ｴ繝懊・繝翫せ**: 蜷梧侠轤ｹ繝励Ξ繧､繝､繝ｼ縺悟惠鬧舌＠縺ｦ縺・ｋ蝣ｴ蜷・`resonanceActive: true` 竊・ATK/DEF +10%縲・9. **縲振I/繝｢繝舌う繝ｫ蟇ｾ蠢懊全PA謖吝虚**: 繝舌ヨ繝ｫ逕ｻ髱｢縺ｯ蜊倡峡縺ｮ繝壹・繧ｸ驕ｷ遘ｻ・・/battle`・峨ｒ陦後ｏ縺壹∵侠轤ｹ繝ｻ繧ｯ繧ｨ繧ｹ繝磯ｲ陦檎判髱｢・・quest/[id]/page.tsx`・牙・縺ｫ繝阪せ繝医＆繧後◆迥ｶ諷・(`<BattleView />`) 縺ｧSPA縺ｨ縺励※繧ｷ繝ｼ繝繝ｬ繧ｹ縺ｫ髢矩哩縺輔ｌ繧九・
### BattleState 讒矩
<!-- v12.0: 螳溯｣・・BattleState蝙九ｒ蜿肴丐 -->
```typescript
export interface BattleState {
  enemy: Enemy | null;          // 迴ｾ蝨ｨ縺ｮ繧ｿ繝ｼ繧ｲ繝・ヨ
  enemies: Enemy[];             // 蜈ｨ謨ｵ繝ｪ繧ｹ繝・(v3.5: multi-enemy)
  party: PartyMember[];
  turn: number;
  current_ap: number;
  messages: string[];
  isVictory: boolean;
  isDefeat: boolean;
  currentTactic: 'Aggressive' | 'Defensive' | 'Standby';
  player_effects: StatusEffect[]; // v3.0: value莉倥″StatusEffect
  enemy_effects: StatusEffect[];
