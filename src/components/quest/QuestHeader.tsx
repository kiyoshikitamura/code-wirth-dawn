'use client';

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { User, Settings, Shield, Heart, Sword, Flame, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { getEffectiveMaxHp } from '@/store/slices/profileSlice';
import { useQuestState } from '@/store/useQuestState';
import { PartyMember } from '@/types/game';
import StatusModal from '@/components/inn/StatusModal';

interface QuestHeaderProps {
    isSettingsOpen: boolean;
    setIsSettingsOpen: (v: boolean) => void;
    isPartyOpen: boolean;
    setIsPartyOpen: (v: boolean) => void;
    vitalityPulse: boolean;
}

export default function QuestHeader({
    isSettingsOpen,
    setIsSettingsOpen,
    isPartyOpen,
    setIsPartyOpen,
    vitalityPulse
}: QuestHeaderProps) {
    const { userProfile, battleState, equipBonus, fetchEquipment, partyMembers } = useGameStore();
    const [fetchedParty, setFetchedParty] = useState<PartyMember[]>(partyMembers || []);
    const [showStatus, setShowStatus] = useState(false);
    const [isPartyLoading, setIsPartyLoading] = useState(false);

    // 装備ボーナス取得
    useEffect(() => {
        if (userProfile?.id) fetchEquipment();
    }, [userProfile?.id]);

    // バトル前はAPIからパーティ取得、バトル開始後はbattleState.partyを使用
    // マウント時にも必ず最新のパーティを取得（仲間と別れた後のクエスト開始対策）
    const [mountKey] = useState(() => Date.now());
    useEffect(() => {
        if (!userProfile?.id) return;

        let active = true;
        const loadingTimer = setTimeout(() => {
            if (active) {
                setIsPartyLoading(true);
            }
        }, 150);

        fetch(`/api/party/list?owner_id=${userProfile.id}`)
            .then(r => r.json())
            .then(data => {
                if (active) {
                    clearTimeout(loadingTimer);
                    let partyData = data.party || [];
                    const questState = useQuestState.getState();
                    if (questState.isInQuest) {
                        partyData = partyData.map((m: any) => {
                            const savedHp = questState.partyHp[String(m.id)];
                            return {
                                ...m,
                                hp: savedHp !== undefined ? Math.max(0, savedHp) : m.max_hp
                            };
                        });
                    }
                    setFetchedParty(partyData);
                    setIsPartyLoading(false);
                }
            })
            .catch(() => {
                if (active) {
                    clearTimeout(loadingTimer);
                    setIsPartyLoading(false);
                }
            });

        return () => {
            active = false;
            clearTimeout(loadingTimer);
        };
    }, [userProfile?.id, mountKey]);

    // battleState.party はバトル中のみ使用（前回バトルの残留データで新規パーティが隠れる問題を防止）
    // v4.1: 勝利/敗北後のバトルは非アクティブ扱い（stale partyデータの表示を防止）
    const isBattleActive = battleState?.enemy && battleState?.party?.length > 0 && !battleState?.isVictory && !battleState?.isDefeat;
    const questGuest = useQuestState((s) => s.guest);
    const baseParty = isBattleActive ? battleState.party : fetchedParty;
    // クエスト中のゲストNPCをパーティリストに含める（バトル中はbattleState.partyに既に含まれているため除外）
    const party_members = React.useMemo(() => {
        if (!questGuest || isBattleActive) return baseParty;
        // 重複防止: IDが既に含まれていないか確認
        const alreadyInParty = baseParty.some((m: PartyMember) => m.id === questGuest.id || (m as any).slug === (questGuest as any).slug);
        if (alreadyInParty) return baseParty;
        return [...baseParty, { ...questGuest, origin_type: 'quest_guest' } as PartyMember];
    }, [baseParty, questGuest, isBattleActive]);

    // HP: 装備ボーナス込み
    const effectiveMaxHp = getEffectiveMaxHp(userProfile ?? null, { equipBonus });
    const hp = userProfile?.hp || 0;
    const hpPercent = Math.max(0, Math.min(100, (hp / Math.max(1, effectiveMaxHp)) * 100));

    // Vitality
    const maxVitality = userProfile?.max_vitality || 100;
    const vitality = userProfile?.vitality ?? maxVitality;
    const vitPercent = Math.max(0, Math.min(100, (vitality / maxVitality) * 100));
    const vitLow = vitality <= 20;

    // ATK/DEF 装備ボーナス込み
    const effectiveAtk = (userProfile?.atk || 0) + (equipBonus?.atk || 0);
    const effectiveDef = (userProfile?.def || 0) + (equipBonus?.def || 0);

    return (
        <>
            {/* safe-area-inset-top 対応: pt にモバイルのノッチ/時計/電池残量分を確保 */}
            <div className="sticky top-0 z-50 w-full bg-slate-950/95 backdrop-blur-md border-b border-amber-900/40 text-slate-200 shadow-2xl shrink-0"
                 style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 6px)' }}>

                {/* メインステータス行 */}
                <div className="flex items-center gap-2 px-3 pb-2 pt-1.5">
                    {/* アバター（タップでステータス表示） */}
                    <button
                        onClick={() => setShowStatus(true)}
                        className="w-11 h-11 rounded-full border-2 border-amber-500/70 overflow-hidden bg-slate-800 flex-shrink-0 relative active:scale-95 transition-transform"
                    >
                        {userProfile?.avatar_url ? (
                            <img src={userProfile.avatar_url} alt="You" className="object-cover w-full h-full" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-amber-500">
                                <User size={24} />
                            </div>
                        )}
                    </button>

                    {/* HP + ステータス数値 */}
                    <div className="flex-1 min-w-0 space-y-0.5">
                        {/* ユーザー名 + レベル */}
                        <div className="flex items-center gap-1.5 leading-none">
                            <span className="text-[11px] font-bold text-slate-200 truncate">{userProfile?.name || '旅人'}</span>
                            <span className="text-[9px] text-blue-400 font-mono shrink-0">Lv.{userProfile?.level ?? 1}</span>
                        </div>
                        {/* HP バー + 数値 */}
                        <div className="flex items-center gap-1.5">
                            <Heart size={11} className="text-green-500 shrink-0" />
                            <div className="flex-1 h-2.5 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/50">
                                <div className="h-full bg-gradient-to-r from-green-700 to-green-500 transition-all duration-500 rounded-full" style={{ width: `${hpPercent}%` }} />
                            </div>
                            <span className="text-[10px] font-mono text-green-400/80 tabular-nums shrink-0 w-[54px] text-right">
                                {hp}/{effectiveMaxHp}
                            </span>
                        </div>

                        {/* ATK / DEF / VIT コンパクト表示 */}
                        <div className="flex items-center gap-2 text-[9px]">
                            <span className="flex items-center gap-0.5 text-red-400/80">
                                <Sword size={9} /> {effectiveAtk}
                            </span>
                            <span className="flex items-center gap-0.5 text-blue-400/80">
                                <Shield size={9} /> {effectiveDef}
                            </span>
                            <span className="text-slate-600">|</span>
                            <span className={`flex items-center gap-0.5 transition-colors ${vitalityPulse && vitLow ? 'text-red-400' : 'text-orange-500/70'}`}>
                                <Flame size={9} /> {vitality}/{maxVitality}
                            </span>
                            <span className="text-slate-600">|</span>
                            <span className="text-amber-500/70 font-bold">
                                {(userProfile?.gold || 0).toLocaleString()}G
                            </span>
                        </div>
                    </div>

                    {/* 設定ボタン */}
                    <button
                        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                        className="p-2 bg-slate-800/60 rounded-lg text-slate-400 hover:text-amber-500 border border-slate-700/50 active:scale-95 transition-all shrink-0"
                    >
                        <Settings size={18} />
                    </button>
                </div>

                {/* パーティ折りたたみ */}
                <div className="border-t border-slate-800/60">
                    <button onClick={() => setIsPartyOpen(!isPartyOpen)} className="w-full flex justify-between items-center py-1 px-3 text-[9px] text-slate-500 uppercase tracking-widest outline-none active:bg-slate-800/30 transition-colors">
                        <span>パーティ ({party_members.length})</span>
                        {isPartyOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                    {isPartyOpen && (
                        <div className="flex gap-2 py-1.5 px-3 overflow-x-auto no-scrollbar scrollbar-hide pb-2">
                            {isPartyLoading && party_members.length === 0 && (
                                <>
                                    {[0,1,2].map(i => (
                                        <div key={i} className="flex flex-col items-center flex-shrink-0">
                                            <div className="w-10 h-10 rounded-full bg-slate-800 animate-pulse border-2 border-slate-700/50" />
                                            <div className="w-10 h-1.5 mt-1 bg-slate-800 rounded-full animate-pulse" />
                                            <div className="w-8 h-2 mt-0.5 bg-slate-800 rounded animate-pulse" />
                                        </div>
                                    ))}
                                </>
                            )}
                            {!isPartyLoading && party_members.length === 0 && (
                                <span className="text-[10px] text-slate-600 italic">同行者なし</span>
                            )}
                            {party_members.map((m: PartyMember) => {
                                const currentHp = isBattleActive ? m.durability : (m.hp ?? 0);
                                const maxHp = isBattleActive ? (m.max_durability || 100) : (m.max_hp || 100);
                                const hpPct = Math.max(0, Math.min(100, (currentHp / Math.max(1, maxHp)) * 100));
                                const vit = (m as any).vitality ?? (isBattleActive ? 100 : (m.durability ?? 100));
                                const isGuest = m.origin_type === 'quest_guest';
                                return (
                                    <PartyMemberIcon key={m.id} member={m} hp={currentHp} maxHp={maxHp} hpPct={hpPct} vit={vit} isGuest={isGuest} />
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ステータスモーダル（フルスクリーン） */}
            {showStatus && <StatusModal onClose={() => setShowStatus(false)} questLocked={true} />}
        </>
    );
}

/** パーティメンバーアイコン — BattleViewと同じスタイル（名前表示+タップで詳細ポップアップ） */
function PartyMemberIcon({ member, hp, maxHp, hpPct, vit, isGuest }: {
    member: PartyMember; hp: number; maxHp: number; hpPct: number; vit: number; isGuest: boolean;
}) {
    const [showPopup, setShowPopup] = useState(false);

    // ポップアップを document.body に直接レンダリング（overflow:hidden の親を回避）
    const popupPortal = showPopup && typeof document !== 'undefined'
        ? ReactDOM.createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowPopup(false)}>
                <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-xl p-4 w-[280px] shadow-2xl" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className={`w-10 h-10 rounded-full border-2 ${
                                isGuest ? 'border-amber-500' : 'border-sky-500'
                            } bg-slate-800 flex items-center justify-center overflow-hidden`}>
                                {member.icon_url || member.image_url || member.avatar_url ? (
                                    <img src={member.icon_url || member.image_url || member.avatar_url || ''} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={18} className={isGuest ? 'text-amber-400' : 'text-sky-400'} />
                                )}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-200">{member.name || 'NPC'}</p>
                                <p className="text-[9px] text-slate-500">
                                    Lv.{(member as any).level || '?'}
                                    {isGuest ? ' · ゲストNPC' : ' · パーティメンバー'}
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setShowPopup(false)} className="text-slate-500 hover:text-slate-300">
                            <X size={16} />
                        </button>
                    </div>
                    <div className="space-y-2 text-[11px]">
                        <div className="flex justify-between items-center bg-slate-800/50 rounded px-2 py-1.5">
                            <span className="text-green-400 font-bold">HP</span>
                            <span className="text-slate-200 font-mono">{hp} / {maxHp}</span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-800/50 rounded px-2 py-1.5">
                            <span className={`font-bold ${vit <= 20 ? 'text-red-400' : 'text-amber-400'}`}>VIT</span>
                            <span className="text-slate-200 font-mono">{vit}</span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-800/50 rounded px-2 py-1.5">
                            <span className="text-red-400 font-bold">攻撃力</span>
                            <span className="text-slate-200 font-mono">{(member as any).atk ?? 0}</span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-800/50 rounded px-2 py-1.5">
                            <span className="text-sky-400 font-bold">防御力</span>
                            <span className="text-slate-200 font-mono">{(member as any).def ?? 0}</span>
                        </div>
                        <div className="bg-slate-800/50 rounded px-2 py-1.5">
                            <span className="text-amber-400 font-bold text-[10px]">スキル</span>
                            <div className="mt-1 flex flex-wrap gap-1">
                                {((member as any).skill_names || (member as any).skills || (member as any).abilities || []).length > 0 ? (
                                    ((member as any).skill_names || (member as any).skills || (member as any).abilities).map((skill: any, si: number) => (
                                        <span key={si} className="px-1.5 py-0.5 bg-amber-900/30 border border-amber-800/50 rounded text-[9px] text-amber-300">
                                            {typeof skill === 'string' ? skill : skill.name || skill}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-[9px] text-slate-500 italic">なし</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>,
            document.body
        )
        : null;

    return (
        <>
            <button
                onClick={() => setShowPopup(true)}
                className="flex flex-col items-center flex-shrink-0 active:scale-90 transition-transform"
            >
                <div className={`w-10 h-10 rounded-full border-[2px] ${
                    isGuest ? 'border-amber-400/60' : 'border-sky-400/60'
                } bg-slate-800 flex items-center justify-center overflow-hidden shadow-lg`}>
                    {member.icon_url || member.image_url || member.avatar_url ? (
                        <img src={member.icon_url || member.image_url || member.avatar_url || ''} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                        <User size={18} className={isGuest ? 'text-amber-400' : 'text-sky-400'} />
                    )}
                </div>
                <div className="w-10 h-1.5 mt-1 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                    <div
                        className={`h-full transition-all duration-500 ${hpPct > 50 ? 'bg-green-500' : hpPct > 20 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${hpPct}%` }}
                    />
                </div>
                <span className="text-[9px] text-slate-200 font-bold w-[44px] text-center truncate mt-0.5">
                    {member.name?.slice(0, 4) || 'NPC'}
                </span>
            </button>
            {popupPortal}
        </>
    );
}
