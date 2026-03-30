/**
 * 拠点・施設・名声スコアから対応するNPCデータを動的に解決するヘルパー
 */
import { NPC_MASTER, FacilityKey, NpcMasterEntry, NpcDialogues } from '@/data/npcMasterData';

// 名声閾値の定数
export const FAME_THRESHOLDS = {
  HIGH: 300,      // 名声高 — 尊敬と称賛
  LOW: -100,      // 名声低 — 蔑みの対応
  BANNED: -300,   // 出禁 — 施設利用不可
} as const;

export type FameLevel = 'high' | 'normal' | 'low' | 'banned';

/**
 * 名声スコアから名声レベルを算出
 */
export function getFameLevel(reputationScore: number): FameLevel {
  if (reputationScore >= FAME_THRESHOLDS.HIGH) return 'high';
  if (reputationScore <= FAME_THRESHOLDS.BANNED) return 'banned';
  if (reputationScore <= FAME_THRESHOLDS.LOW) return 'low';
  return 'normal';
}

export interface ResolvedNpc {
  name: string;
  role: string;
  imageUrl: string;
  dialogue: string;
  fameLevel: FameLevel;
  isBanned: boolean;
}

/**
 * location_name と施設タイプ、名声スコアから
 * 該当するNPCの名前・画像・セリフを解決する。
 *
 * @param locationName - DB上の拠点名（例: 王都アーカディア）
 * @param facilityType - `inn`, `guild`, `shop`, `temple`
 * @param reputationScore - プレイヤーの名声スコア (default: 0)
 * @returns ResolvedNpc | null (マッチするNPCがない場合)
 */
export function getNpcForLocation(
  locationSlug: string | undefined,
  facilityType: FacilityKey,
  reputationScore: number = 0
): ResolvedNpc | null {
  if (!locationSlug) return null;

  const locationData = NPC_MASTER[locationSlug];
  if (!locationData) return null;

  const npcEntry = locationData[facilityType];
  if (!npcEntry) return null;

  const fameLevel = getFameLevel(reputationScore);
  const dialogue = npcEntry.dialogues[fameLevel];

  return {
    name: npcEntry.name,
    role: npcEntry.role,
    imageUrl: npcEntry.imageUrl,
    dialogue,
    fameLevel,
    isBanned: fameLevel === 'banned',
  };
}
