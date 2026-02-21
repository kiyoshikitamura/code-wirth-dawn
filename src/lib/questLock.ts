/**
 * questLock.ts
 * Deck Locking utility for quest-in-progress (Spec v3.3 §4.2)
 *
 * When a quest is active (current_quest_id != null), deck and equipment
 * changes are forbidden (403 Forbidden).
 */

import { supabaseServer as supabase } from '@/lib/supabase-admin';

export interface QuestLockResult {
    locked: boolean;
    questId: string | null;
}

/**
 * Check if a user is currently in a quest (deck locked).
 * Returns { locked: true, questId } if locked, { locked: false } otherwise.
 */
export async function checkQuestLock(userId: string): Promise<QuestLockResult> {
    const { data: user, error } = await supabase
        .from('user_profiles')
        .select('current_quest_id')
        .eq('id', userId)
        .single();

    if (error || !user) {
        return { locked: false, questId: null };
    }

    if (user.current_quest_id) {
        return { locked: true, questId: user.current_quest_id };
    }

    return { locked: false, questId: null };
}

/**
 * Set quest lock (called on quest start).
 */
export async function setQuestLock(userId: string, questId: string): Promise<void> {
    await supabase
        .from('user_profiles')
        .update({ current_quest_id: questId })
        .eq('id', userId);
}

/**
 * Release quest lock (called on quest complete/fail).
 */
export async function releaseQuestLock(userId: string): Promise<void> {
    await supabase
        .from('user_profiles')
        .update({ current_quest_id: null })
        .eq('id', userId);
}
