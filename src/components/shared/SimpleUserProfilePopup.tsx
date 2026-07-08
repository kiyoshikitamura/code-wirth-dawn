'use client';

import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Shield, Coins, BookOpen, User, Briefcase, Eye } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { getAuthHeaders } from '@/lib/authToken';
import { soundManager } from '@/lib/soundManager';
import { toJpJobClass } from '@/lib/jobClass';

interface SimpleUserProfilePopupProps {
    isOpen: boolean;
    onClose: () => void;
    avatarUrl?: string;
    name: string;
    epithet?: string;
    introduction?: string;
    level?: number;
    age?: number;
    subscriptionTier?: 'free' | 'basic' | 'premium';
    userId?: string;       // 表示対象のユーザーID
    callerUserId?: string; // ログイン中のユーザーID
}

export default function SimpleUserProfilePopup({
    isOpen,
    onClose,
    avatarUrl,
    name,
    epithet,
    introduction,
    level,
    age,
    subscriptionTier,
    userId,
    callerUserId,
}: SimpleUserProfilePopupProps) {
    const { partyMembers, setPartyMembers, gold, userProfile } = useGameStore();

    const [activeTab, setActiveTab] = useState<'intro' | 'stats' | 'equipped' | 'skills'>('intro');
    const [shadow, setShadow] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);
    const [hirePhase, setHirePhase] = useState<'idle' | 'loading' | 'done'>('idle');
    const [hireMessage, setHireMessage] = useState<string>('');

    // 対象の影データをフェッチする
    useEffect(() => {
        if (!isOpen || !userId) return;

        const loadProfileShadow = async () => {
            setLoading(true);
            setShadow(null);
            setHireMessage('');
            setActiveTab('intro');
            try {
                const authHeaders = await getAuthHeaders();
                const res = await fetch(`/api/tavern/profile-shadow?user_id=${userId}`, {
                    method: 'GET',
                    headers: authHeaders
                });

                if (res.ok) {
                    const data = await res.json();
                    setShadow(data.shadow);
                } else {
                    console.warn('[ProfileShadow] Failed to load shadow snapshot');
                }
            } catch (err) {
                console.error('[ProfileShadow] Error:', err);
            } finally {
                setLoading(false);
            }
        };

        loadProfileShadow();
    }, [isOpen, userId]);

    if (!isOpen) return null;

    const displayAvatar = avatarUrl || '/avatars/adventurer.jpg';
    const displayName = epithet ? `${epithet} ${name}` : name;
    const displayIntro = introduction || '自己紹介は設定されていません。';

    // 既にパーティに雇われているかの判定
    const isAlreadyHired = () => {
        return partyMembers.some((m: any) =>
            m.source_user_id === userId || m.name === name
        );
    };

    const hired = isAlreadyHired();
    const isSelf = userId === callerUserId;

    // 直接雇用の実行
    const handleDirectHire = async () => {
        if (!shadow) return;
        if (hired) {
            setHireMessage('既に契約済みです。');
            return;
        }
        if (partyMembers.length >= 4) {
            setHireMessage('パーティが満員です（最大4名）。');
            soundManager?.playSE('se_click');
            return;
        }

        const activeGold = userProfile?.gold ?? gold;
        if (activeGold < shadow.contract_fee) {
            setHireMessage('金貨が足りません！');
            soundManager?.playSE('se_click');
            return;
        }

        setHirePhase('loading');
        setHireMessage('');
        soundManager?.playSE('se_item_get');

        // 楽観的UI更新のためのスナップショット退避
        const previousParty = [...partyMembers];
        const previousGold = gold;
        const previousProfile = userProfile ? { ...userProfile } : null;

        // 楽観的メンバーの構築
        const optimisticMember = {
            ...shadow,
            id: shadow.profile_id || `temp-${Date.now()}`,
            owner_id: callerUserId,
            durability: shadow.stats?.hp || 100,
            max_durability: shadow.stats?.hp || 100,
            hp: shadow.stats?.hp || 100,
            max_hp: shadow.stats?.hp || 100,
            atk: shadow.stats?.atk || 0,
            def: shadow.stats?.def || 0,
            is_active: true,
            source_user_id: shadow.profile_id,
        };

        const newGold = Math.max(0, activeGold - shadow.contract_fee);
        useGameStore.setState({
            gold: newGold,
            partyMembers: [...partyMembers, optimisticMember],
            userProfile: userProfile ? {
                ...userProfile,
                gold: newGold
            } : null
        });

        try {
            const authHeaders = await getAuthHeaders();
            const res = await fetch('/api/tavern/hire', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders
                },
                body: JSON.stringify({
                    user_id: callerUserId,
                    shadow,
                    is_profile_hire: true // 所在地チェックをバイパス
                })
            });

            if (res.ok) {
                setHireMessage('契約に成功し、パーティに加入した！ ✨');
                setHirePhase('done');
                
                // 最新状態に同期
                try {
                    const listRes = await fetch(`/api/party/list?owner_id=${callerUserId}`, {
                        headers: authHeaders
                    });
                    if (listRes.ok) {
                        const listData = await listRes.json();
                        if (listData.party) setPartyMembers(listData.party);
                    }
                    await useGameStore.getState().fetchUserProfile();
                } catch (syncErr) {
                    console.error('Failed to sync party after profile hire:', syncErr);
                }

                setTimeout(() => setHirePhase('idle'), 3000);
            } else {
                const errData = await res.json().catch(() => ({ error: '不明なエラー' }));
                throw new Error(errData.error || '雇用処理に失敗しました。');
            }

        } catch (e: any) {
            // ロールバック
            useGameStore.setState({
                gold: previousGold,
                partyMembers: previousParty,
                userProfile: previousProfile
            });
            setHireMessage(`契約失敗: ${e.message}`);
            setHirePhase('done');
            setTimeout(() => setHirePhase('idle'), 3000);
        }
    };

    // アバターの外枠スタイル
    let frameStyle = "w-16 h-16 rounded-full overflow-hidden border-2 border-slate-700 bg-slate-800 shadow-md relative";
    let imgWrapperStyle = "w-full h-full";
    if (subscriptionTier === 'premium') {
        frameStyle = "w-16 h-16 rounded-full overflow-hidden bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 p-[2px] shadow-lg shadow-yellow-500/20 relative";
        imgWrapperStyle = "w-full h-full rounded-full overflow-hidden bg-slate-900";
    } else if (subscriptionTier === 'basic') {
        frameStyle = "w-16 h-16 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500 p-[2px] shadow-lg shadow-blue-500/20 relative";
        imgWrapperStyle = "w-full h-full rounded-full overflow-hidden bg-slate-900";
    }

    return (
        <div 
            className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-[#050b14]/85 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div 
                className="bg-[#0f172a] border border-amber-500/30 w-full max-w-sm shadow-[0_0_50px_rgba(245,158,11,0.15)] relative p-5 rounded-2xl animate-in zoom-in-95 duration-150 text-slate-100"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 閉じるボタン */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors bg-slate-900/60 border border-slate-800 rounded-full p-1.5 active:scale-95"
                >
                    <X size={14} />
                </button>

                {/* Profile Basic Info */}
                <div className="flex items-center gap-4 mt-2 mb-4">
                    <div className={frameStyle}>
                        <div className={imgWrapperStyle}>
                            <img
                                src={displayAvatar}
                                alt={name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = '/avatars/adventurer.jpg';
                                }}
                            />
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        {epithet && (
                            <p className="text-[10px] text-amber-500 font-bold tracking-widest uppercase mb-0.5">
                                {epithet}
                            </p>
                        )}
                        <h4 className="text-slate-100 text-base font-black tracking-wide truncate">
                            {name}
                        </h4>
                        
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-slate-300 bg-slate-800/80 border border-slate-700/50 px-2 py-0.5 rounded font-mono">
                                Lv.{level || 1} {shadow ? toJpJobClass(shadow.job_class) : '冒険者'}
                            </span>
                            {age !== undefined && (
                                <span className="text-[10px] font-bold text-slate-400">{age}歳</span>
                            )}
                        </div>

                        {shadow && (
                            <div className="flex items-center gap-2 mt-1.5 text-[9px] text-slate-400 font-mono">
                                <span>被雇用:</span>
                                <span>影: <strong className="text-amber-500 font-bold">{shadow.hired_shadow_count ?? 0}</strong>回</span>
                                <span className="text-slate-800">|</span>
                                <span>英霊: <strong className="text-amber-500 font-bold">{shadow.hired_heroic_count ?? 0}</strong>回</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-800 gap-1 mb-4">
                    <button
                        onClick={() => { soundManager?.playSE('se_click'); setActiveTab('intro'); }}
                        className={`flex-1 py-2 text-[11px] font-bold tracking-wider text-center border-b-2 transition-all ${activeTab === 'intro' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                    >
                        自己紹介
                    </button>
                    <button
                        onClick={() => { soundManager?.playSE('se_click'); setActiveTab('stats'); }}
                        className={`flex-1 py-2 text-[11px] font-bold tracking-wider text-center border-b-2 transition-all ${activeTab === 'stats' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                    >
                        能力
                    </button>
                    <button
                        onClick={() => { soundManager?.playSE('se_click'); setActiveTab('equipped'); }}
                        className={`flex-1 py-2 text-[11px] font-bold tracking-wider text-center border-b-2 transition-all ${activeTab === 'equipped' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                    >
                        装備
                    </button>
                    <button
                        onClick={() => { soundManager?.playSE('se_click'); setActiveTab('skills'); }}
                        className={`flex-1 py-2 text-[11px] font-bold tracking-wider text-center border-b-2 transition-all ${activeTab === 'skills' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                    >
                        スキル
                    </button>
                </div>

                {/* Tab Contents */}
                <div className="min-h-[140px] flex flex-col justify-between">
                    <div className="flex-1">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-8 gap-2">
                                <RefreshCw className="animate-spin text-amber-500" size={24} />
                                <span className="text-xs text-slate-500 font-mono">データを取得中...</span>
                            </div>
                        ) : (
                            <>
                                {/* Tab: Introduction */}
                                {activeTab === 'intro' && (
                                    <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 min-h-[110px] flex items-center justify-center">
                                        <p className="text-slate-300 text-xs font-serif leading-relaxed italic break-all">
                                            「{displayIntro}」
                                        </p>
                                    </div>
                                )}

                                {/* Tab: Stats */}
                                {activeTab === 'stats' && (
                                    <div className="grid grid-cols-2 gap-2.5">
                                        <div className="bg-slate-950/40 rounded-xl p-3 flex flex-col items-center border border-slate-850">
                                            <span className="text-[10px] text-slate-500 font-bold block mb-1">最大体力 (HP)</span>
                                            <span className="text-sm font-black font-mono text-emerald-400">
                                                {shadow?.stats?.hp ?? '---'}
                                            </span>
                                        </div>
                                        <div className="bg-slate-950/40 rounded-xl p-3 flex flex-col items-center border border-slate-850">
                                            <span className="text-[10px] text-slate-500 font-bold block mb-1">物理攻撃力 (ATK)</span>
                                            <span className="text-sm font-black font-mono text-rose-400">
                                                {shadow?.stats?.atk ?? '---'}
                                            </span>
                                        </div>
                                        <div className="bg-slate-950/40 rounded-xl p-3 flex flex-col items-center border border-slate-850">
                                            <span className="text-[10px] text-slate-500 font-bold block mb-1">物理防御力 (DEF)</span>
                                            <span className="text-sm font-black font-mono text-sky-400">
                                                {shadow?.stats?.def ?? '---'}
                                            </span>
                                        </div>
                                        <div className="bg-slate-950/40 rounded-xl p-3 flex flex-col items-center border border-slate-850">
                                            <span className="text-[10px] text-slate-500 font-bold block mb-1">現在の活力 (VIT)</span>
                                            <span className="text-sm font-black font-mono text-amber-500">
                                                {shadow?.vitality ?? '---'}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Tab: Equipped Items */}
                                {activeTab === 'equipped' && (
                                    <div className="space-y-1.5">
                                        {!shadow?.equipped_items || shadow.equipped_items.length === 0 ? (
                                            <p className="text-xs text-slate-500 text-center py-6">装備しているアイテムがありません。</p>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                {shadow.equipped_items.map((eq: any, i: number) => (
                                                    <div key={i} className="flex justify-between items-center bg-slate-950/40 px-3 py-2 rounded-xl border border-slate-850">
                                                        <span className="font-black text-[9px] uppercase tracking-wider text-purple-400 bg-purple-950/30 border border-purple-500/20 px-1.5 py-0.5 rounded">
                                                            {toJpSlotName(eq.slot)}
                                                        </span>
                                                        <span className="truncate ml-2 text-[10px] font-bold text-slate-200 text-right flex-1">{eq.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Tab: Skills */}
                                {activeTab === 'skills' && (
                                    <div>
                                        {!shadow?.signature_deck_preview || shadow.signature_deck_preview.length === 0 ? (
                                            <p className="text-xs text-slate-500 text-center py-6">装備しているスキルカードがありません。</p>
                                        ) : (
                                            <div className="flex flex-wrap gap-1.5">
                                                {shadow.signature_deck_preview.map((card: string, i: number) => (
                                                    <span key={i} className="px-2.5 py-1 bg-slate-900 border border-slate-800 text-slate-300 text-[10px] rounded-lg font-bold">
                                                        {card}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Hire Operations Section */}
                    {shadow && !loading && !isSelf && (
                        <div className="mt-5 pt-4 border-t border-slate-850 flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                    <Shield size={12} className="text-amber-500/80" /> 契約費
                                </span>
                                {hired ? (
                                    <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-lg">雇用中</span>
                                ) : (
                                    <span className="text-base font-black text-amber-400 font-mono flex items-center gap-1">
                                        <Coins size={16} /> {shadow.contract_fee?.toLocaleString()} G
                                    </span>
                                )}
                            </div>

                            {/* Hire Button */}
                            {!hired && (
                                <button
                                    onClick={handleDirectHire}
                                    disabled={hirePhase === 'loading'}
                                    className="w-full mt-1 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:from-slate-800 disabled:to-slate-900 text-slate-100 font-black text-xs tracking-widest py-3 px-4 rounded-xl border border-amber-500/40 hover:border-amber-400/50 shadow-lg hover:shadow-amber-500/10 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    {hirePhase === 'loading' ? (
                                        <>
                                            <RefreshCw className="animate-spin" size={14} />
                                            <span>契約中...</span>
                                        </>
                                    ) : (
                                        <>
                                            <User size={14} />
                                            <span>この影を直接雇用する</span>
                                        </>
                                    )}
                                </button>
                            )}

                            {/* Message Toast */}
                            {hireMessage && (
                                <p className="text-[10px] font-bold text-center mt-1.5 text-amber-400 animate-pulse bg-amber-500/5 py-1.5 rounded-lg border border-amber-500/10">
                                    {hireMessage}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function toJpSlotName(slot: string): string {
    switch (slot) {
        case 'weapon': return '武器';
        case 'armor': return '防具';
        case 'accessory': return '装飾品';
        case 'accessory_1': return '装飾品1';
        case 'accessory_2': return '装飾品2';
        case 'accessory_3': return '装飾品3';
        default: return slot;
    }
}
