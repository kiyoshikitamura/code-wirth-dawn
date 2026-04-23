# Code: Wirth-Dawn 窶・繧ｳ繝ｼ繝峨い繝ｼ繧ｭ繝・け繝√Ε莉墓ｧ・v1.1

## 讎りｦ・
譛ｬ繝峨く繝･繝｡繝ｳ繝医・ `Code: Wirth-Dawn` 繝輔Ο繝ｳ繝医お繝ｳ繝峨・繧ｽ繝ｼ繧ｹ繧ｳ繝ｼ繝画ｧ区・縺ｨ縲∝推繝｢繧ｸ繝･繝ｼ繝ｫ縺ｮ雋ｬ蜍吶ｒ螳夂ｾｩ縺吶ｋ縲・
繝舌ヨ繝ｫ繧ｷ繧ｹ繝・Β繝ｻ繧ｯ繧ｨ繧ｹ繝医す繧ｹ繝・Β縺ｨ繧ゅ↓ **繧ｯ繝ｩ繧､繧｢繝ｳ繝医し繧､繝我src/
笏懌楳笏 app/                  # Next.js App Router 繝壹・繧ｸ
笏・  笏懌楳笏 title/page.tsx    # 繧ｿ繧､繝医Ν逕ｻ髱｢・・Auth繝ｻ譁・ｭ嶺ｽ懈・・・笏・  笏懌楳笏 inn/page.tsx      # 譌・ｱ�・医Γ繧､繝ｳ繝上ヶ・峨贋ｿ晁ｭｷ縲・笏・  笏懌楳笏 world-map/        # 繝ｯ繝ｼ繝ｫ繝峨・繝・・縲贋ｿ晁ｭｷ縲・笏・  笏懌楳笏 battle/           # 繝舌ヨ繝ｫ縲贋ｿ晁ｭｷ縲・笏・  笏懌楳笏 quest/[id]/       # 繧ｯ繧ｨ繧ｹ繝医贋ｿ晁ｭｷ縲・笏・  笏懌楳笏 editor/           # UGC繧ｨ繝・ぅ繧ｿ縲贋ｿ晁ｭｷ縲・笏・  笏懌楳笏 battle-test/      # 髢狗匱逕ｨ繝舌ヨ繝ｫ繝・せ繝茨ｼ井ｿ晁ｭｷ蟇ｹ雎｡螟厄ｼ・笏・  笏披楳笏 ...
笏・笏懌楳笏 components/
笏・  笏懌楳笏 battle/           # 繝舌ヨ繝ｫUI
笏・  笏・  笏懌楳笏 BattleView.tsx               # 繝舌ヨ繝ｫ逕ｻ髱｢譛ｬ菴・(~970陦・
笏・  笏・  笏懌楳笏 StatusEffectBadges.tsx       # 迥ｶ諷狗焚蟶ｸ繝舌ャ繧ｸ
笏・  笏・  笏披楳笏 hooks/
笏・  笏・      笏披楳笏 useBattleTypewriter.ts   # [NEW v1.0] 繧ｿ繧､繝励Λ繧､繧ｿ繝ｼ邂｡逅・笏・  笏懌楳笏 quest/
笏・  笏・  笏懌楳笏 ScenarioEngine.tsx           # 繧ｯ繧ｨ繧ｹ繝医ヮ繝ｼ繝峨お繝ｳ繧ｸ繝ｳ (~560陦・
笏・  笏・  笏披楳笏 hooks/
笏・  笏・      笏披楳笏 useScenarioNodeProcessor.ts  # [NEW v1.0] 繝弱・繝芽・蜍募・逅・ヵ繝・け
笏・  笏披楳笏 inn/
笏・      笏懌楳笏 StatusModal.tsx
笏・      笏披楳笏 TavernModal.tsx
笏・笏懌楳笏 hooks/                # 繧ｫ繧ｹ繧ｿ繝�繝輔ャ繧ｯ
笏・  笏懌楳笏 useAuthGuard.ts   # [NEW v1.1] 繧ｲ繝ｼ繝�繝壹・繧ｸ隱崎ｨｼ繧ｬ繝ｼ繝・笏・  笏懌楳笏 useBgm.ts         # BGM螳牙ｮ壼・逕・笏・  笏披楳笏 ...
笏・笏懌楳笏 store/                # Zustand 迥ｶ諷狗ｮ｡逅・笏・  笏懌楳笏 gameStore.ts      # [SLIM v1.0] 繧ｨ繝ｳ繝医Μ繝ｼ繝昴う繝ｳ繝・(~75陦・
笏・  笏懌楳笏 types.ts          # [NEW v1.0] GameState 蝙句ｮ夂ｾｩ
笏・  笏懌楳笏 useQuestState.ts  # 繧ｯ繧ｨ繧ｹ繝磯ｲ陦檎憾諷・笏・  笏披楳笏 slices/           # [NEW v1.0] 繝峨Γ繧､繝ｳ繧ｹ繝ｩ繧､繧ｹ
笏・      笏懌楳笏 index.ts         # 繝舌Ξ繝ｫ繧ｨ繧ｯ繧ｹ繝昴・繝・笏・      笏懌楳笏 profileSlice.ts  # 繝励Ο繝輔ぅ繝ｼ繝ｫ繝ｻ陬・ｙ繝ｻ繧ｴ繝ｼ繝ｫ繝・笏・      笏懌楳笏 battleSlice.ts   # 繝舌ヨ繝ｫ繝ｭ繧ｸ繝・け蜈ｨ菴・笏・      笏懌楳笏 inventorySlice.ts # 繧､繝ｳ繝吶Φ繝医Μ
笏・      笏披楳笏 questSlice.ts    # 繧ｯ繧ｨ繧ｹ繝医・謌ｦ陦薙・騾・ｵｰ
笏・笏懌楳笏 lib/                  # 繝斐Η繧｢繝ｭ繧ｸ繝・け繝ｩ繧､繝悶Λ繝ｪ
笏・  笏懌楳笏 battleEngine.ts   # 繝繝｡繝ｼ繧ｸ險育ｮ励・繝・ャ繧ｭ讒狗ｯ・笏・  笏懌楳笏 statusEffects.ts  # 迥ｶ諷狗焚蟶ｸ繝ｭ繧ｸ繝・け
笏・  笏懌楳笏 npcAI.ts          # NPC AI 蛻､譁ｭ繝ｭ繧ｸ繝・け
笏・  笏懌楳笏 enemySkills.ts    # 謨ｵ繧ｹ繧ｭ繝ｫ螳夂ｾｩ
笏・  笏懌楳笏 cardEffects.ts    # 繧ｫ繝ｼ繝牙柑譫懷・鬘・笏・  笏懌楳笏 targeting.ts      # 繧ｿ繝ｼ繧ｲ繝・ヨ驕ｸ謚・笏・  笏懌楳笏 passiveEffects.ts # 繝代ャ繧ｷ繝門柑譫・笏・  笏披楳笏 soundManager.ts   # BGM/SE 邂｡逅・笏・笏懌楳笏 types/
笏・  笏披楳笏 game.ts           # 繧ｲ繝ｼ繝�蝙句ｮ夂ｾｩ (Card, Enemy, BattleState, etc.)
笏・笏披楳笏 constants/
    笏披楳笏 game_rules.ts     # 謌宣聞繝ｫ繝ｼ繝ｫ (GROWTH_RULES)
```う繧ｹ
笏・      笏懌楳笏 index.ts         # 繝舌Ξ繝ｫ繧ｨ繧ｯ繧ｹ繝昴・繝・笏・      笏懌楳笏 profileSlice.ts  # 繝励Ο繝輔ぅ繝ｼ繝ｫ繝ｻ陬・ｙ繝ｻ繧ｴ繝ｼ繝ｫ繝・笏・      笏懌楳笏 battleSlice.ts   # 繝舌ヨ繝ｫ繝ｭ繧ｸ繝・け蜈ｨ菴・笏・      笏懌楳笏 inventorySlice.ts # 繧､繝ｳ繝吶Φ繝医Μ
笏・      笏披楳笏 questSlice.ts    # 繧ｯ繧ｨ繧ｹ繝医・謌ｦ陦薙・騾・ｵｰ
笏・笏懌楳笏 lib/                  # 繝斐Η繧｢繝ｭ繧ｸ繝・け繝ｩ繧､繝悶Λ繝ｪ
笏・  笏懌楳笏 battleEngine.ts   # 繝繝｡繝ｼ繧ｸ險育ｮ励・繝・ャ繧ｭ讒狗ｯ・笏・  笏懌楳笏 statusEffects.ts  # 迥ｶ諷狗焚蟶ｸ繝ｭ繧ｸ繝・け
笏・  笏懌楳笏 npcAI.ts          # NPC AI 蛻､譁ｭ繝ｭ繧ｸ繝・け
笏・  笏懌楳笏 enemySkills.ts    # 謨ｵ繧ｹ繧ｭ繝ｫ螳夂ｾｩ
笏・  笏懌楳笏 cardEffects.ts    # 繧ｫ繝ｼ繝牙柑譫懷・鬘・笏・  笏懌楳笏 targeting.ts      # 繧ｿ繝ｼ繧ｲ繝・ヨ驕ｸ謚・笏・  笏懌楳笏 passiveEffects.ts # 繝代ャ繧ｷ繝門柑譫・笏・  笏披楳笏 soundManager.ts   # BGM/SE 邂｡逅・笏・笏懌楳笏 types/
笏・  笏披楳笏 game.ts           # 繧ｲ繝ｼ繝�蝙句ｮ夂ｾｩ (Card, Enemy, BattleState, etc.)
笏・笏披楳笏 constants/
    笏披楳笏 game_rules.ts     # 謌宣聞繝ｫ繝ｼ繝ｫ (GROWTH_RULES)
```

---

## 2. 迥ｶ諷狗ｮ｡逅・い繝ｼ繧ｭ繝・け繝√Ε・・ustand 繧ｹ繝ｩ繧､繧ｹ繝代ち繝ｼ繝ｳ・・
### 2.1 閭梧勹縺ｨ險ｭ險域婿驥・
繝ｪ繝輔ぃ繧ｯ繧ｿ繝ｪ繝ｳ繧ｰ蜑・(v14.0 莉･蜑・ 縺ｯ蜈ｨ繧ｲ繝ｼ繝�繝ｭ繧ｸ繝・け縺・`src/store/gameStore.ts` 1繝輔ぃ繧､繝ｫ・・,154陦鯉ｼ峨↓髮・ｸｭ縺励※縺・◆縲・
v1.0 繝ｪ繝輔ぃ繧ｯ繧ｿ繝ｪ繝ｳ繧ｰ縺ｧ縺ｯ **繧ｹ繝ｩ繧､繧ｹ繝代ち繝ｼ繝ｳ** 繧呈治逕ｨ縺励∽ｻ･荳九ｒ螳溽樟縺励◆・・
- `useGameStore()` 縺ｮ蜻ｼ縺ｳ蜃ｺ縺玲婿縺ｯ **蜈ｨ縺ｦ縺ｮ譌｢蟄倥さ繝ｳ繝昴・繝阪Φ繝医〒螟画峩縺ｪ縺・*・育�ｴ螢顔噪螟画峩繧ｼ繝ｭ・・- `create()` 縺ｨ `persist()` 險ｭ螳壹・縺ｿ縺・`gameStore.ts` 縺ｫ谿九ｋ
- 繝ｭ繧ｸ繝・け縺ｯ雋ｬ蜍吝腰菴阪・繧ｹ繝ｩ繧､繧ｹ繝輔ぃ繧､繝ｫ縺ｫ遘ｻ蜍・
### 2.2 繧ｹ繝ｩ繧､繧ｹ荳隕ｧ

| 繝輔ぃ繧､繝ｫ | 雋ｬ蜍・| 荳ｻ隕√い繧ｯ繧ｷ繝ｧ繝ｳ |
|---|---|---|
| `slices/profileSlice.ts` | 繝励Ο繝輔ぅ繝ｼ繝ｫ縲√Ρ繝ｼ繝ｫ繝峨∬｣・ｙ縲√ざ繝ｼ繝ｫ繝・| `fetchUserProfile`, `fetchWorldState`, `fetchHubState`, `fetchEquipment`, `addGold`, `spendGold` |
| `slices/battleSlice.ts` | 繝舌ヨ繝ｫ蜈ｨ菴・| `startBattle`, `attackEnemy`, `runNpcPhase`, `runEnemyPhase`, `advanceTurn`, `processPartyTurn`, `processEnemyTurn`, `dealHand`, `useBattleItem` |
| `slices/inventorySlice.ts` | 繧､繝ｳ繝吶Φ繝医Μ | `fetchInventory`, `toggleEquip` |
| `slices/questSlice.ts` | 繧ｯ繧ｨ繧ｹ繝医・謌ｦ陦薙・騾・ｵｰ | `selectScenario`, `setTactic`, `setTarget`, `fleeBattle`, `waitTurn` |

### 2.3 gameStore.ts 縺ｮ讒矩�・・1.0 莉･髯搾ｼ・
```typescript
// src/store/gameStore.ts 窶・繧ｨ繝ｳ繝医Μ繝昴う繝ｳ繝医・縺ｿ・・75陦鯉ｼ・
export const useGameStore = create<GameState>()(
    persist(
        (set, get) => ({
            // 蛻晄悄蛟､縺ｮ縺ｿ險倩ｿｰ
            userProfile: null,
            battleState: INITIAL_BATTLE_STATE,
            // ...

            // 繧ｹ繝ｩ繧､繧ｹ繧貞ｱ暮幕
            ...createProfileSlice(set, get),
            ...createBattleSlice(set, get),
            ...createInventorySlice(set, get),
            ...createQuestSlice(set, get),
        }),
        { name: 'game-storage', ... }
    )
);
```

### 2.4 getEffective 繝倥Ν繝代・髢｢謨ｰ縺ｮ驟咲ｽｮ

陬・ｙ繝懊・繝翫せ繝ｻ蜈ｱ魑ｴ繝懊・繝翫せ繧貞性繧譛牙柑繧ｹ繝・・繧ｿ繧ｹ縺ｮ險育ｮ鈴未謨ｰ縺ｯ `profileSlice.ts` 縺ｧ繧ｨ繧ｯ繧ｹ繝昴・繝医＆繧後～battleSlice.ts` 縺後う繝ｳ繝昴・繝医＠縺ｦ菴ｿ逕ｨ縺吶ｋ縲・
```typescript
// src/store/slices/profileSlice.ts
export function getEffectiveAtk(userProfile, battleState): number
export function getEffectiveDef(userProfile, battleState): number
export function getEffectiveMaxHp(userProfile, battleState): number
```

> **Note**: 譌ｧ莉墓ｧ俶嶌 spec_v2 Section 10.3 縺ｧ縺ｯ `src/store/gameStore.ts` 縺ｫ螳夂ｾｩ縺輔ｌ縺ｦ縺・ｋ縺ｨ險倩ｼ峨＠縺ｦ縺・◆縺後√Μ繝輔ぃ繧ｯ繧ｿ繝ｪ繝ｳ繧ｰ蠕後・ `src/store/slices/profileSlice.ts` 縺ｫ遘ｻ蜍輔＠縺溘・
---

## 3. 繧ｫ繧ｹ繧ｿ繝�繝輔ャ繧ｯ讒区・

### 3.1 `useBattleTypewriter` (NEW v1.0)

**繝代せ**: `src/components/battle/hooks/useBattleTypewriter.ts`

繝舌ヨ繝ｫ繝ｭ繧ｰ縺ｮ繧ｿ繧､繝励Λ繧､繧ｿ繝ｼ陦ｨ遉ｺ繝ｻ繧ｭ繝･繝ｼ邂｡逅・・HP蜷梧悄繧・`BattleView.tsx` 縺九ｉ蛻・屬縺励◆繝輔ャ繧ｯ縲・
**謠蝉ｾ帙☆繧狗憾諷・**
- `displayedLogs`, `typingText` 窶・陦ｨ遉ｺ繝ｭ繧ｰ
- `isTypingDone` 窶・繧ｭ繝･繝ｼ蜃ｦ逅・ｮ御ｺ・ヵ繝ｩ繧ｰ
- `liveHp`, `livePartyDurability` 窶・繧ｿ繧､繝励Λ繧､繧ｿ繝ｼ縺ｨ蜷梧悄縺励◆HP繝舌・蛟､

**謠蝉ｾ帙☆繧九い繧ｯ繧ｷ繝ｧ繝ｳ:**
- `processQueue()` 窶・繧ｭ繝･繝ｼ縺九ｉ1繝｡繝・そ繝ｼ繧ｸ繧貞・逅・- `flushQueue()` 窶・繧ｭ繝･繝ｼ蜊ｳ譎ゅヵ繝ｩ繝・す繝･・・EXT 譌ｩ騾√ｊ逕ｨ・・- `enqueuedUpToRef` 窶・stale closure 髦ｲ豁｢繧､繝ｳ繝・ャ繧ｯ繧ｹ

**繝｡繝・そ繝ｼ繧ｸ繝槭・繧ｫ繝ｼ蟇ｾ蠢・**

| 繝槭・繧ｫ繝ｼ | 蜃ｦ逅・|
|---|---|
| `__hp_sync:NNN` | `setLiveHp(NNN)` 窶・HP繝舌・譖ｴ譁ｰ縺ｮ縺ｿ・磯撼陦ｨ遉ｺ・・|
| `__party_sync:ID:NNN` | `setLivePartyDurability` 窶・繝代・繝・ぅHP繝舌・譖ｴ譁ｰ・磯撼陦ｨ遉ｺ・・|
| `--- ... ---` | 蜊ｳ譎り｡ｨ遉ｺ・医ち繧､繝励Λ繧､繧ｿ繝ｼ縺ｪ縺暦ｼ・|
| 縺昴・莉・| 繧ｿ繧､繝励Λ繧､繧ｿ繝ｼ・・0ms/譁・ｭ暦ｼ・|

---

### 3.2 `useAuthGuard` (v1.2)

**パス**: `src/hooks/useAuthGuard.ts`

繧ｿ繧､繝医Ν逕ｻ髱｢繧堤ｵ檎罰縺励↑縺・ご繝ｼ繝繝壹・繧ｸ縺ｸ縺ｮURL逶ｴ謇薙■繝ｻ繝悶Λ繧ｦ繧ｶ繝舌ャ繧ｯ繧帝亟豁｢縺吶ｋ隱崎ｨｼ繧ｬ繝ｼ繝峨ヵ繝・け縲・
**莉慕ｵ・∩・・essionStorage 繝輔Λ繧ｰ譁ｹ蠑擾ｼ・**

```
[/title] 讀懆ｨｼ螳御ｺ・  竊・setGameStarted()   竊・sessionStorage縺ｫ 'cwd_game_started' 繧偵そ繝・ヨ
  竊・router.push('/inn')

[繧ｲ繝ｼ繝�繝壹・繧ｸ隱ｭ縺ｿ霎ｼ縺ｿ]
  竊・useAuthGuard() 縺・sessionStorage 繧偵メ繧ｧ繝・け
| **v1.2** | **2026-04-16** | **useAuthGuard 縺ｫ linkIdentity OAuth 繧ｳ繝ｼ繝ｫ繝舌ャ繧ｯ蟇ｾ蠢懆ｿｽ蜉・・code= 繝代Λ繝｡繝ｼ繧ｿ讀懷・譎ゅ・繧ｬ繝ｼ繝峨せ繧ｭ繝・・・峨Ｊnn 繝壹・繧ｸ縺ｫ OAuth code URL 繧ｯ繝ｪ繝ｼ繝ｳ繧｢繝・・蜃ｦ逅・ｿｽ蜉縲・* |
      - 繝輔Λ繧ｰ縺ｪ縺・竊・router.replace('/title')  竊・URL逶ｴ謇薙■謫豁｢
      - 繝輔Λ繧ｰ縺ゅｊ 竊・Supabase繧ｻ繝・す繝ｧ繝ｳ讀懆ｨｼ
          - 繧ｻ繝・す繝ｧ繝ｳ辟｡蜉ｹ 竊・clearGameStarted() + router.replace('/title')
          - 繧ｻ繝・す繝ｧ繝ｳ譛牙柑 竊・騾ｲ陦・
[繧ｵ繧､繝ｳ繧｢繧ｦ繝域凾]
  竊・clearGameStarted()  竊・繝輔Λ繧ｰ繧貞炎髯､
  竊・谺｡蝗槭・繧ｲ繝ｼ繝�繝壹・繧ｸ繧｢繧ｯ繧ｻ繧ｹ譎ゅ↓繝ｪ繝繧､繝ｬ繧ｯ繝・```

**sessionStorage 縺ｮ迚ｹ諤ｧ:**
- 繧ｿ繝悶・繝悶Λ繧ｦ繧ｶ繧ｫ繧ｳ繝ｧ繧帝哩縺倥ｋ縺ｨ閾ｪ蜍募炎髯､・亥・險ｪ蝠乗凾縺ｯ蠢・★/title邨檎罰縺悟ｿ・ｦ・ｼ・- localStorage 縺ｨ驕輔＞豌ｸ邯壼喧縺輔ｌ縺ｪ縺・◆繧√√そ繝・す繝ｧ繝ｳ繝吶・繧ｹ縺ｮ繧ｬ繝ｼ繝峨↓驕ｩ蛻・
**菫晁ｭｷ蟇ｾ雎｡繝倥・繧ｸ:**

| 繝ｫ繝ｼ繝・| 菫晁ｭｷ | 蛯呵・|
|---|---|---|
| `/inn` | 笨・| popstate繝ｪ繧ｹ繝翫・縺ｧ繝舌ャ繧ｯ繝懊ち繝ｳ繧ょ宛蠕｡ |
| `/world-map` | 笨・| |
| `/battle` | 笨・| |
| `/quest/[id]` | 笨・| |
| `/editor` | 笨・| |
| `/editor/manage` | 笨・| |
| `/battle-test` | 笶・| 髢狗匱逕ｨ繝・せ繝医・繝ｼ繧ｸ縺ｯ蟇ｾ雎｡螟・|
| `/title` | 笶・| 髢句ｧ狗せ縺ｪ縺ｮ縺ｧ荳崎ｦ・|

**clearGameStarted() 繧貞他縺ｶ繧ｿ繧､繝溘Φ繧ｰ:**
- `handleNewGame()` 窶・Google OAuth 蜀崎ｪ崎ｨｼ蜑・- `handleTestPlay()` 窶・蛹ｿ蜷阪し繧､繝ｳ繧､繝ｳ蜑・- `繧ｿ繧､繝医Ν縺ｫ謌ｺ繧義 繝懊ち繝ｳ 窶・CHAR_CREATION 竊・ENTRY縺ｸ謌ｺ繧区凾
- `/inn` 縺ｮ popstate 繝ｪ繧ｹ繝翫・ 窶・繝悶Λ繧ｦ繧ｶ繝舌ャ繧ｯ譎・

**v1.2 追加仕様: linkIdentity OAuth コールバック対応**

`linkIdentity`（テストプレイ→Google連携）完了後、ブラウザが `/inn?code=xxx` にリダイレクトされる。
この時 `useAuthGuard` が `?code=` パラメータを検出した場合、ガードチェックをスキップする。

理由: `linkIdentity` は既存セッションに Identity を追加するだけで、認証状態は有効なまま。
`cwd_game_started` フラグも sessionStorage に残っているため、ガードは不要。

```
[/inn?code=xxx で着地]
  → useAuthGuard() が ?code= を検出 → ガードスキップ
  → inn ページの useEffect が ?code= を検出
     → window.history.replaceState({}, '', '/inn')  ← URLクリーンアップ
     → cwd_link_identity フラグがあれば fetchUserProfile() を再実行
```

---

### 3.3 `useScenarioNodeProcessor` (NEW v1.0)

**繝代せ**: `src/components/quest/hooks/useScenarioNodeProcessor.ts`

`ScenarioEngine.tsx` 縺ｮ繝弱・繝芽・蜍募・逅・`useEffect` 繧呈歓蜃ｺ縺励◆繝輔ャ繧ｯ縲ょ・縺ｦ縺ｮ `processNode()` 繝ｭ繧ｸ繝・け繧呈球縺・€・
**蟇ｾ蠢懊ヮ繝ｼ繝峨ち繧､繝・**

| 繝弱・繝峨ち繧､繝・| 蜃ｦ逅・・螳ｹ |
|---|---|
| `random_branch` | 遒ｺ邇・・蟯・|
| `check_status` | 繧｢繝ｩ繧､繝｡繝ｳ繝域擅莉ｶ繝√ぉ繝・け |
| `check_possession` | 繧｢繧､繝・Β謇謖√メ繧ｧ繝・け |
| `check_equipped` | 陬・ｙ繝√ぉ繝・け |
| `check_delivery` | 邏榊刀繝√ぉ繝・け・・PI豸郁ｲｻ・・|
| `travel` | 遘ｻ蜍輔さ繧ｹ繝郁ｨ育ｮ輸PI蜻ｼ縺ｳ蜃ｺ縺・|
| `guest_join` | 繧ｲ繧ｹ繝・PC蜿ょ刈API蜻ｼ縺ｳ蜃ｺ縺・|
| `leave` | 繧ｲ繧ｹ繝・PC髮｢閼ｱ |
| `trap` / `modify_state` | 繝医Λ繝・・繝繝｡繝ｼ繧ｸ |
| `modify_flag` | 繧ｯ繧ｨ繧ｹ繝医ヵ繝ｩ繧ｰ謫堺ｽ・|
| `check_flags` | 繧ｯ繧ｨ繧ｹ繝医ヵ繝ｩ繧ｰ譚｡莉ｶ蛻・ｲ・|
| `modify_reputation` | 蜷榊｣ｰ螟牙虚API蜻ｼ縺ｳ蜃ｺ縺・|
| `reward` | 荳ｭ髢灘�ｱ驟ｬ莉倅ｸ拶PI蜻ｼ縺ｳ蜃ｺ縺・|
| `shop_access` | 繧ｷ繝ｧ繝・・繝ｪ繝繧､繝ｬ繧ｯ繝・|
| `end` | 繧ｯ繧ｨ繧ｹ繝育ｵゆｺ・憾諷九そ繝・ヨ |

---

## 4. 繝舌ヨ繝ｫ繧ｷ繧ｹ繝・Β雋ｬ蜍吝・諡・
```
BattleView.tsx (UI繝ｻ繧､繝吶Φ繝医ワ繝ｳ繝峨Μ繝ｳ繧ｰ)
  笏懌楳笏 useBattleTypewriter (繝ｭ繧ｰ陦ｨ遉ｺ繝ｻHP蜷梧悄)
  笏披楳笏 useGameStore (迥ｶ諷句盾辣ｧ繝ｻ繧｢繧ｯ繧ｷ繝ｧ繝ｳ)
       笏披楳笏 battleSlice.ts (繧ｲ繝ｼ繝�繝ｭ繧ｸ繝・け)
            笏懌楳笏 battleEngine.ts (繝繝｡繝ｼ繧ｸ險育ｮ・
            笏懌楳笏 statusEffects.ts (迥ｶ諷狗焚蟶ｸ)
            笏懌楳笏 npcAI.ts (NPC蛻､譁ｭ)
            笏懌楳笏 enemySkills.ts (謨ｵ繧ｹ繧ｭ繝ｫ)
            笏披楳笏 profileSlice.ts (繧ｹ繝・・繧ｿ繧ｹ險育ｮ・
```

---

## 5. 繧ｯ繧ｨ繧ｹ繝医す繧ｹ繝・Β雋ｬ蜍吝・諡・
```
quest/[id]/page.tsx (繝壹・繧ｸ繝ｻ繝舌ヨ繝ｫ邨ｱ蜷・
  笏披楳笏 ScenarioEngine.tsx (繝弱・繝蔚I繝ｻ驕ｸ謚櫁い陦ｨ遉ｺ)
       笏懌楳笏 useScenarioNodeProcessor (繝弱・繝芽・蜍募・逅・
       笏披楳笏 useQuestState (繧ｯ繧ｨ繧ｹ繝溢ｧ・｡檎憾諷・
```

---

## 6. 繝舌・繧ｸ繝ｧ繝ｳ螻･豁ｴ

| 繝舌・繧ｸ繝ｧ繝ｳ | 譌･莉・| 螟画峩蜀・ｮｹ |
|---|---|---|
| v1.0 | 2026-04-15 | 蛻晉沿縲ＨameStore.ts 繧ｹ繝ｩ繧､繧ｹ蛻・牡縲「seBattleTypewriter縲「seScenarioNodeProcessor 謚ｽ蜃ｺ縲４cenarioEngine 988陦娯・559陦後“ameStore 2,154陦娯・75陦・|
| v1.1 | 2026-04-15 | useAuthGuard 繝輔ャ繧ｯ霑ｽ蜉�縲ＴessionStorage繝吶・繧ｹ縺ｮ繧ｲ繝ｼ繝�繝壹・繧ｸ菫晁ｭｷ・育峩謗･URL繧｢繧ｯ繧ｻ繧ｹ繝ｻ繝悶Λ繧ｦ繧ｶ繝舌ャ繧ｯ蛻ｶ蠕｡・・|
| **v1.2** | **2026-04-16** | **useAuthGuard 縺ｫ linkIdentity OAuth 繧ｳ繝ｼ繝ｫ繝舌ャ繧ｯ蟇ｾ蠢懆ｿｽ蜉・・?code=` 繝代Λ繝｡繝ｼ繧ｿ讀懷・譎ゅ・繧ｬ繝ｼ繝峨せ繧ｭ繝・・・峨Ｊnn 繝壹・繧ｸ縺ｫ OAuth code URL 繧ｯ繝ｪ繝ｼ繝ｳ繧｢繝・・蜃ｦ逅・ｿｽ蜉縲ＴessionStorage Intent 繝輔Λ繧ｰ蜆ｪ蜈磯・ｽ阪・譏守｢ｺ蛹厄ｼ・pec_v10 ﾂｧ5.3 蜿ら・・峨・* |

---

## 7. 髢狗匱繧ｬ繧､繝峨Λ繧､繝ｳ

### 譁ｰ讖溯・霑ｽ蜉�譎ゅ・繝ｫ繝ｼ繝ｫ

1. **繝舌ヨ繝ｫ繝ｭ繧ｸ繝・け螟画峩** 竊・`src/store/slices/battleSlice.ts` 繧堤ｷｨ髮・2. **繝励Ο繝輔ぅ繝ｼ繝ｫ/繧ｹ繝・・繧ｿ繧ｹ螟画峩** 竊・`src/store/slices/profileSlice.ts` 繧堤ｷｨ髮・3. **譁ｰ縺励＞繧ｹ繝医い繧｢繧ｯ繧ｷ繝ｧ繝ｳ霑ｽ蜉�** 竊・蟇ｾ蠢懊☆繧九せ繝ｩ繧､繧ｹ縺ｫ霑ｽ蜉�蠕後～src/store/types.ts` 縺ｮ `GameState` 繧､繝ｳ繧ｿ繝ｼ繝輔ぉ繝ｼ繧ｹ繧呈峩譁ｰ
4. **BattleView 縺ｫ迥ｶ諷九ｒ霑ｽ蜉�** 竊・縺ｾ縺・`useBattleTypewriter` 繧・ｻ悶ヵ繝・け縺ｸ縺ｮ蛻・ｊ蜃ｺ縺励ｒ讀懆ｨ・5. **ScenarioEngine 縺ｫ譁ｰ繝弱・繝峨ち繧､繝苓ｿｽ蜉�** 竊・`useScenarioNodeProcessor.ts` 縺ｮ `processNode` 髢｢謨ｰ蜀・↓霑ｽ蜉�

### 蝙句ｮ牙・諤ｧ

- `GameState` 縺ｮ蝙句ｮ夂ｾｩ縺ｯ `src/store/types.ts` 縺ｧ荳蜈・ｮ｡逅・- 蜷・せ繝ｩ繧､繧ｹ縺ｮ `set` / `get` 縺ｯ `GameState` 繧貞盾辣ｧ縺吶ｋ縺溘ａ蝙句ｮ牙・
- `npx tsc --noEmit` 縺ｧ繧ｳ繝ｳ繝代う繝ｫ繧ｨ繝ｩ繝ｼ縺後↑縺・％縺ｨ繧堤｢ｺ隱阪＠縺ｦ縺九ｉ繧ｳ繝溘ャ繝・
