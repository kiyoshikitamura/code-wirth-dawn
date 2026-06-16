import React, { useState, useEffect } from 'react';
import { UserProfile, PartyMember } from '@/types/game';
import { X, UserPlus, Shield, Sword, Heart, RefreshCw, Flag, Sparkles, Ghost, Star, Crown } from 'lucide-react';
import { ShadowSummary } from '@/services/shadowService';
import { getAuthToken, getAuthHeaders } from '@/lib/authToken';
import { getNpcForLocation } from '@/lib/getNpcForLocation';
import { toJpJobClass } from '@/lib/jobClass';
import SimpleUserProfilePopup from '@/components/shared/SimpleUserProfilePopup';
import { useGameStore } from '@/store/gameStore';

interface TavernModalProps {
    isOpen: boolean;
    onClose: () => void | Promise<void>;
    userProfile: UserProfile;
    locationId: string;
    reputationScore?: number;
    locationSlug?: string;
}

// 英霊情報
interface MyHeroic {
    id: string;
    name: string;
    level: number;
    job_class: string;
    created_at: string;
}

export default function TavernModal({ isOpen, onClose, userProfile, locationId, reputationScore = 0, locationSlug }: TavernModalProps) {
    const { 
        tavernShadows, 
        partyMembers, 
        setTavernShadows, 
        setPartyMembers,
        gold,
        userProfile: storeUserProfile
    } = useGameStore();

    const [isClosing, setIsClosing] = useState(false);

    const handleClose = async () => {
        if (isClosing) return;
        setIsClosing(true);
        try {
            await onClose();
        } catch (e) {
            console.error('[TavernModal] onClose failed:', e);
            setIsClosing(false);
        }
    };

    const activeGold = storeUserProfile?.gold ?? userProfile.gold;

    const [activeTab, setActiveTab] = useState<'hire' | 'register' | 'heroic'>('hire');
    const shadows = tavernShadows;
    const currentParty = partyMembers;

    const [loading, setLoading] = useState(() => {
        return tavernShadows.length === 0;
    });
    const [hirePhase, setHirePhase] = useState<'idle' | 'loading' | 'done'>('idle');
    const [hireResultMsg, setHireResultMsg] = useState<string>('');
    const [reportTarget, setReportTarget] = useState<ShadowSummary | null>(null);
    const [reportReason, setReportReason] = useState('');
    const [reportStatus, setReportStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
    const [selectedShadow, setSelectedShadow] = useState<ShadowSummary | null>(null);
    const [simpleProfileUser, setSimpleProfileUser] = useState<ShadowSummary | null>(null);
    const [myHeroics, setMyHeroics] = useState<MyHeroic[]>([]);
    const [heroicLoading, setHeroicLoading] = useState(false);
    const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
    const [heroicHallList, setHeroicHallList] = useState<ShadowSummary[]>([]);
    const [heroicHallLoading, setHeroicHallLoading] = useState(false);
    const [dismissing, setDismissing] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const store = useGameStore.getState();
            const lastFetch = store.lastInitPageFetchTime || 0;
            const hasShadows = tavernShadows.length > 0;

            // SWR: すでにメモリ上にデータがあれば即表示し、ローディング状態を排除
            if (hasShadows) {
                setLoading(false);
            }

            // 直近60秒以内の新鮮なデータがあれば、API通信を一切行わない
            if (hasShadows && Date.now() - lastFetch < 60000) {
                return;
            }

            // すでに Zustand にデータがある場合は、バックグラウンド更新のみ行い、ローディングは表示しない
            if (hasShadows) {
                Promise.all([fetchPartyData(), fetchShadows()]);
                return;
            }

            // Zustand にデータがない場合、sessionStorage キャッシュからの復帰を試みる
            let hasCache = false;
            try {
                const cacheKey = `tavern_shadows_cache_${locationId}`;
                const cached = sessionStorage.getItem(cacheKey);
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        const asApiFormat = parsed.map((s: any) => ({
                            profile_id: s.id || s.profile_id,
                            name: s.name,
                            epithet: s.epithet || '',
                            level: s.level || 1,
                            job_class: s.job_class || 'Mercenary',
                            origin_type: s.origin_type || 'system_mercenary',
                            contract_fee: s.contract_fee || ((s.level || 1) * 50),
                            stats: s.stats || { atk: 0, def: 0, hp: s.durability || 100 },
                            signature_deck_preview: s.signature_deck_preview || [],
                            subscription_tier: s.subscription_tier || 'free',
                            icon_url: s.icon_url || s.avatar_url,
                            npc_image_url: s.npc_image_url || s.avatar_url,
                            flavor_text: s.flavor_text,
                            slug: s.slug || undefined,
                        }));
                        setTavernShadows(asApiFormat);
                        setLoading(false);
                        hasCache = true;
                    }
                }
            } catch (e) {
                console.warn(e);
            }

            // キャッシュがあればバックグラウンド更新、なければローディングを表示して通信
            if (hasCache) {
                Promise.all([fetchPartyData(), fetchShadows()]);
            } else {
                setLoading(true);
                Promise.all([fetchPartyData(), fetchShadows()]).finally(() => setLoading(false));
            }
        }
    }, [isOpen, locationId, tavernShadows.length]);

    useEffect(() => {
        if (isOpen && activeTab === 'register') {
            fetchMyHeroics();
        }
        if (isOpen && activeTab === 'heroic') {
            fetchHeroicHall();
        }
    }, [isOpen, activeTab]);

    const fetchPartyData = async () => {
        try {
            const authHeaders = await getAuthHeaders();
            const res = await fetch(`/api/party/list?owner_id=${userProfile.id}`, {
                headers: authHeaders,
            });
            const data = await res.json();
            if (data.party) setPartyMembers(data.party);
        } catch (e) {
            console.error("Failed to fetch party data", e);
        }
    };

    // v2.9.3f: sessionStorageキャッシュがあればそれを使い、なければAPIから取得
    const fetchShadowsWithCache = async () => {
        try {
            const cacheKey = `tavern_shadows_cache_${locationId}`;
            const cached = sessionStorage.getItem(cacheKey);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    const asApiFormat = parsed.map((s: any) => ({
                        profile_id: s.id || s.profile_id,
                        name: s.name,
                        epithet: s.epithet || '',
                        level: s.level || 1,
                        job_class: s.job_class || 'Mercenary',
                        origin_type: s.origin_type || 'system_mercenary',
                        contract_fee: s.contract_fee || ((s.level || 1) * 50),
                        stats: s.stats || { atk: 0, def: 0, hp: s.durability || 100 },
                        signature_deck_preview: s.signature_deck_preview || [],
                        subscription_tier: s.subscription_tier || 'free',
                        icon_url: s.icon_url || s.avatar_url,
                        npc_image_url: s.npc_image_url || s.avatar_url,
                        flavor_text: s.flavor_text,
                        slug: s.slug || undefined,
                    }));
                    setTavernShadows(asApiFormat);
                    return;
                }
            }
        } catch { /* sessionStorage unavailable */ }
        await fetchShadows();
    };

    const fetchShadows = async () => {
        try {
            const authHeaders = await getAuthHeaders();
            const res = await fetch(`/api/tavern/list?location_id=${locationId}&user_id=${userProfile.id}`, {
                headers: authHeaders
            });
            const data = await res.json();
            if (data.shadows) {
                setTavernShadows(data.shadows);
                try {
                    sessionStorage.setItem(`tavern_shadows_cache_${locationId}`, JSON.stringify(data.shadows));
                } catch { /* ignore */ }
            }
        } catch (e) {
            console.error("Failed to fetch shadows", e);
        }
    };

    const fetchMyHeroics = async () => {
        setHeroicLoading(true);
        try {
            const authHeaders = await getAuthHeaders();
            const res = await fetch(`/api/tavern/my-heroic?user_id=${userProfile.id}`, {
                headers: authHeaders
            });
            const data = await res.json();
            if (data.heroics) setMyHeroics(data.heroics);
        } catch (e) {
            console.error("Failed to fetch my heroics", e);
        } finally {
            setHeroicLoading(false);
        }
    };

    // v4.1: 英霊の間リスト取得
    const fetchHeroicHall = async () => {
        setHeroicHallLoading(true);
        try {
            const authHeaders = await getAuthHeaders();
            const res = await fetch(`/api/tavern/heroic-list?location_id=${locationId}&user_id=${userProfile.id}`, {
                headers: authHeaders
            });
            const data = await res.json();
            if (data.heroics) setHeroicHallList(data.heroics);
        } catch (e) {
            console.error("Failed to fetch heroic hall", e);
        } finally {
            setHeroicHallLoading(false);
        }
    };

    const isAlreadyHired = (shadow: ShadowSummary): boolean => {
        return currentParty.some(member =>
            member.name === shadow.name ||
            (shadow.profile_id && (member as any).source_user_id === shadow.profile_id)
        );
    };

    const handleHire = async (shadow: ShadowSummary) => {
        if (isAlreadyHired(shadow)) { setHireResultMsg('この冒険者は既に契約済みです。'); setHirePhase('done'); setTimeout(() => setHirePhase('idle'), 2000); return; }
        if (currentParty.length >= 4) { setHireResultMsg('パーティが満員です。'); setHirePhase('done'); setTimeout(() => setHirePhase('idle'), 2000); return; }
        if (activeGold < shadow.contract_fee) { setHireResultMsg('ゴールドが足りません！'); setHirePhase('done'); setTimeout(() => setHirePhase('idle'), 2000); return; }

        setHirePhase('loading');

        // スナップショット（バックアップ）
        const previousParty = [...partyMembers];
        const previousGold = gold;
        const previousProfile = storeUserProfile ? { ...storeUserProfile } : null;

        // 楽観的UI用の新規メンバーオブジェクト
        const optimisticMember: PartyMember = {
            ...shadow,
            id: shadow.profile_id || `temp-${Date.now()}`,
            owner_id: userProfile.id,
            durability: shadow.stats?.hp || 100,
            max_durability: shadow.stats?.hp || 100,
            hp: shadow.stats?.hp || 100,
            max_hp: shadow.stats?.hp || 100,
            atk: shadow.stats?.atk || 0,
            def: shadow.stats?.def || 0,
            is_active: true,
            source_user_id: shadow.origin_type === 'system_mercenary' ? null : shadow.profile_id,
        } as any;

        // Zustandの楽観的更新
        const newGold = Math.max(0, gold - shadow.contract_fee);
        useGameStore.setState({
            gold: newGold,
            partyMembers: [...partyMembers, optimisticMember],
            userProfile: storeUserProfile ? {
                ...storeUserProfile,
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
                body: JSON.stringify({ user_id: userProfile.id, shadow })
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
                throw new Error(errData.error || '不明なエラー');
            }
            const data = await res.json();
            if (data.success) {
                setHireResultMsg('パーティに加入した！ ✨');
                setHirePhase('done');
                // バックグラウンドで同期
                fetchPartyData();
                fetchShadows();
                useGameStore.getState().fetchUserProfile();
                setTimeout(() => setHirePhase('idle'), 2200);
            } else {
                throw new Error(data.error || '不明なエラー');
            }
        } catch (e: any) {
            // ロールバック
            useGameStore.setState({
                gold: previousGold,
                partyMembers: previousParty,
                userProfile: previousProfile
            });
            setHireResultMsg(`雇用に失敗しました: ${e.message || '通信エラー'}`);
            setHirePhase('done');
            setTimeout(() => setHirePhase('idle'), 2500);
        }
    };

    const handleDismiss = async (memberId: string, memberName: string) => {
        if (!window.confirm(`${memberName} との契約を解除しますか？\nパーティから除外されます。`)) return;
        setDismissing(true);

        // スナップショット
        const previousParty = [...partyMembers];

        // 楽観的除外
        useGameStore.setState({
            partyMembers: partyMembers.filter(m => m.id !== memberId)
        });

        try {
            const authHeaders = await getAuthHeaders();
            const res = await fetch(`/api/party/member?id=${memberId}`, {
                method: 'DELETE',
                headers: authHeaders,
            });
            if (res.ok) {
                setHireResultMsg(`${memberName} との契約を解除した。`);
                setHirePhase('done');
                fetchPartyData();
                setTimeout(() => setHirePhase('idle'), 2000);
            } else {
                const err = await res.json().catch(() => ({ error: 'Unknown' }));
                throw new Error(err.error || '不明なエラー');
            }
        } catch (e: any) {
            // ロールバック
            useGameStore.setState({
                partyMembers: previousParty
            });
            setHireResultMsg(`解雇に失敗: ${e.message}`);
            setHirePhase('done');
            setTimeout(() => setHirePhase('idle'), 2500);
        } finally {
            setDismissing(false);
        }
    };

    const handleReport = async () => {
        if (!reportTarget || !reportReason) return;
        setReportStatus('sending');
        try {
            const authHeaders = await getAuthHeaders();
            const res = await fetch('/api/report', {
                method: 'POST',
                // [Security] JWT認証のみ — x-user-id廃止 (v27.2)
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders,
                },
                body: JSON.stringify({
                    reported_user_id: reportTarget.profile_id,
                    target_url: reportTarget.icon_url || reportTarget.image_url || '',
                    reason: reportReason,
                }),
            });
            setReportStatus(res.ok ? 'done' : 'error');
        } catch { setReportStatus('error'); }
    };

    const closeReportModal = () => { setReportTarget(null); setReportReason(''); setReportStatus('idle'); };

    // origin_type に応じたバッジ + Tier装飾 (v13.2)
    const TierBadge = ({ tier }: { tier: string }) => {
        if (tier === 'premium') return (
            <span className="flex items-center gap-0.5 bg-gradient-to-r from-yellow-500 to-amber-400 text-[8px] font-bold text-slate-950 px-1 py-0.5 rounded">
                <Crown size={7} />P
            </span>
        );
        if (tier === 'basic') return (
            <span className="flex items-center gap-0.5 bg-gradient-to-r from-blue-500 to-blue-400 text-[8px] font-bold text-white px-1 py-0.5 rounded">
                ⚡B
            </span>
        );
        return null;
    };

    const OriginBadge = ({ shadow }: { shadow: ShadowSummary }) => {
        const tierBadge = shadow.subscription_tier && shadow.subscription_tier !== 'free'
            ? <TierBadge tier={shadow.subscription_tier} />
            : null;

        if (shadow.origin_type === 'shadow_heroic') {
            return (
                <span className="flex items-center gap-0.5">
                    <span className="flex items-center gap-0.5 bg-gradient-to-r from-amber-600 to-yellow-400 text-[9px] font-bold text-slate-950 px-1.5 py-0.5 rounded">
                        <Star size={8} />英霊
                    </span>
                    {tierBadge}
                </span>
            );
        }
        if (shadow.origin_type === 'shadow_active') {
            return (
                <span className="flex items-center gap-0.5">
                    <span className="flex items-center gap-0.5 bg-blue-600 text-[9px] font-bold text-white px-1.5 py-0.5 rounded">
                        <Ghost size={8} />残影
                    </span>
                    {tierBadge}
                </span>
            );
        }
        return tierBadge; // system_mercenary はTierバッジのみ（あれば）
    };

    const isEmbargoed = reputationScore < 0;
    if (!isOpen) return null;

    return (
        <>
        <div className="fixed inset-0 z-[60] flex justify-center items-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-[#e3d5b8] text-[#2c241b] w-full max-w-md h-[85vh] flex flex-col rounded-sm shadow-[0_0_20px_rgba(0,0,0,0.8)] border-4 border-[#8b5a2b] relative overflow-hidden">
                {isClosing && (
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center gap-3">
                        <div className="w-8 h-8 border-2 border-[#8b5a2b] border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-[#3e2723] font-serif tracking-widest animate-pulse">読み込み中…</p>
                    </div>
                )}

                {/* ===== Header ===== */}
                <div className="bg-[#3e2723] border-b-2 border-[#8b5a2b] p-4 flex justify-between items-center flex-shrink-0">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <h2 className="text-lg font-serif font-bold tracking-widest text-amber-400">酒場</h2>
                            <span className="ml-2 text-[11px] font-mono font-bold text-amber-300 bg-amber-900/40 px-2 py-0.5 rounded border border-amber-700/50">{userProfile.gold.toLocaleString()} G</span>
                        </div>
                        <p className="text-[10px] text-[#a38b6b] mt-0.5 font-serif italic">― 冒険者の集う喧騒の場所 ―</p>
                    </div>
                    <button 
                        onClick={handleClose} 
                        disabled={isClosing}
                        className="text-[#a38b6b] hover:text-white transition-colors disabled:opacity-50"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {isEmbargoed ? (() => {
                    const tavernNpc = locationSlug ? getNpcForLocation(locationSlug, 'inn', reputationScore) : null;
                    return (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                        {tavernNpc?.imageUrl && (
                            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-red-700/50 mb-4 shadow-lg">
                                <img src={tavernNpc.imageUrl} alt={tavernNpc.name} className="w-full h-full object-cover" />
                            </div>
                        )}
                        <h2 className="text-3xl font-serif text-red-700 font-bold mb-4 tracking-widest">出入り禁止</h2>
                        <div className="bg-red-50/60 border border-red-300/50 p-6 rounded-lg max-w-lg">
                            <p className="text-red-800 font-serif italic text-lg leading-relaxed">
                                「{tavernNpc?.dialogue || 'お前のような悪党に飲ませる酒も、紹介する仲間もねえ。さっさと俺の店から出て行きな！'}」
                            </p>
                            {tavernNpc && <p className="text-red-600 text-sm mt-2 font-bold">— {tavernNpc.name}</p>}
                        </div>
                    </div>
                    );
                })() : (
                    <>
                        {/* ===== 通報モーダル ===== */}
                        {reportTarget && (
                            <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4">
                                <div className="bg-[#fdfbf7] border-2 border-red-700 max-w-sm w-full p-6 shadow-2xl rounded-lg">
                                    <h3 className="text-lg font-bold text-red-700 mb-4 flex items-center gap-2">
                                        <Flag size={18} /> 不適切な画像を通報
                                    </h3>
                                    {reportStatus === 'done' ? (
                                        <div className="text-green-700 text-center py-4">
                                            <p className="font-bold mb-2">通報を受け付けました。</p>
                                            <button onClick={closeReportModal} className="mt-4 px-4 py-2 bg-[#8b5a2b] text-white text-sm rounded hover:bg-[#6b4522]">閉じる</button>
                                        </div>
                                    ) : reportStatus === 'error' ? (
                                        <div className="text-red-700 text-center py-4">
                                            <p>通報に失敗しました。</p>
                                            <button onClick={closeReportModal} className="mt-4 px-4 py-2 bg-[#8b5a2b] text-white text-sm rounded hover:bg-[#6b4522]">閉じる</button>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-[#5d4037] text-sm mb-4"><span className="font-bold text-[#3e2723]">{reportTarget.name}</span> のアイコン画像を通報します。</p>
                                            <div className="space-y-2 mb-4">
                                                {['不適切な画像', '公序良俗に反する', 'その他'].map(reason => (
                                                    <label key={reason} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-[#8b5a2b]/10">
                                                        <input type="radio" name="report-reason" value={reason} checked={reportReason === reason} onChange={e => setReportReason(e.target.value)} className="accent-red-600" />
                                                        <span className="text-sm text-[#3e2723]">{reason}</span>
                                                    </label>
                                                ))}
                                            </div>
                                            <div className="flex gap-3">
                                                <button onClick={closeReportModal} className="flex-1 py-2 border border-[#8b5a2b] text-[#8b5a2b] hover:bg-[#8b5a2b]/10 text-sm rounded">キャンセル</button>
                                                <button onClick={handleReport} disabled={!reportReason || reportStatus === 'sending'} className="flex-1 py-2 bg-red-700 text-white text-sm font-bold rounded disabled:opacity-50">
                                                    {reportStatus === 'sending' ? '送信中...' : '通報する'}
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ===== Tabs ===== */}
                        <div className="flex bg-[#2c1e1a] p-1 gap-1 flex-shrink-0">
                            <button onClick={() => setActiveTab('hire')} className={`flex-1 py-2 font-bold font-serif text-sm transition-colors ${activeTab === 'hire' ? 'bg-[#8b5a2b] text-[#e3d5b8]' : 'bg-[#3e2723] text-[#8b5a2b] hover:bg-[#4e342e]'}`}>
                                傭兵を雇う
                            </button>
                            <button onClick={() => setActiveTab('register')} className={`flex-1 py-2 font-bold font-serif text-sm transition-colors ${activeTab === 'register' ? 'bg-[#8b5a2b] text-[#e3d5b8]' : 'bg-[#3e2723] text-[#8b5a2b] hover:bg-[#4e342e]'}`}>
                                影の記録
                            </button>
                            <button onClick={() => setActiveTab('heroic')} className={`flex-1 py-2 font-bold font-serif text-sm transition-colors flex items-center justify-center gap-1 ${activeTab === 'heroic' ? 'bg-[#8b5a2b] text-[#e3d5b8]' : 'bg-[#3e2723] text-[#8b5a2b] hover:bg-[#4e342e]'}`}>
                                <Crown size={12} />英霊の間
                            </button>
                            {activeTab === 'hire' && (
                                <button
                                    onClick={async () => {
                                        setLoading(true);
                                        try { sessionStorage.removeItem(`tavern_shadows_cache_${locationId}`); } catch {}
                                        await fetchShadows();
                                        setLoading(false);
                                    }}
                                    disabled={loading}
                                    className="px-3 py-2 flex items-center gap-1.5 bg-[#3e2723] text-[#8b5a2b] hover:bg-[#4e342e] hover:text-[#e3d5b8] transition-colors rounded-sm">
                                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                                    <span className="text-xs font-bold">見渡す</span>
                                </button>
                            )}
                        </div>

                        {/* ===== Content ===== */}
                        <div className="flex-1 overflow-y-auto p-3">
                            {loading ? (
                                <div className="h-full flex items-center justify-center text-[#8b5a2b] font-serif animate-pulse text-lg">
                                    酒場を見回しています...
                                </div>
                            ) : activeTab === 'hire' ? (
                                <div className="space-y-2">
                                    {/* === Current Party === */}
                                    {currentParty.length > 0 && (
                                        <>
                                            <div className="text-[#3e2723] font-serif font-bold border-b border-[#8b5a2b]/40 pb-1 text-xs">
                                                同行中のパーティ ({currentParty.length}/4)
                                            </div>
                                            {currentParty.map(member => {
                                                const memberImgSrc = (member as any).icon_url || (member as any).image_url;
                                                const memberEpithet = (member as any).epithet;
                                                const memberDisplayName = memberEpithet ? `${memberEpithet} ${member.name}` : member.name;
                                                const memberSkills: string[] = (member as any).skill_names || [];
                                                // クリック時に詳細ポップアップを開くためShadowSummaryに変換
                                                const asShadow: ShadowSummary = {
                                                    profile_id: (member as any).source_user_id || member.id,
                                                    name: member.name,
                                                    epithet: memberEpithet,
                                                    level: (member as any).level || 1,
                                                    job_class: (member as any).job_class || member.job_class || '冒険者',
                                                    origin_type: ((member as any).origin_type || 'system_mercenary') as any,
                                                    contract_fee: 0,
                                                    stats: {
                                                        hp: (member as any).hp ?? (member as any).durability ?? 100,
                                                        atk: (member as any).atk ?? 0,
                                                        def: (member as any).def ?? 0,
                                                    },
                                                    signature_deck_preview: memberSkills,
                                                    subscription_tier: 'free',
                                                    icon_url: memberImgSrc,
                                                    image_url: memberImgSrc,
                                                    npc_image_url: memberImgSrc,
                                                    flavor_text: (member as any).flavor_text || (member as any).introduction,
                                                };
                                                return (
                                                    <div
                                                        key={`party-${member.id}`}
                                                        className="flex items-center gap-2 p-2.5 border border-[#6b8cae]/50 bg-[#eef3f7] rounded-md cursor-pointer hover:border-[#4a7da8]/60 active:scale-[0.99] transition-all"
                                                        onClick={() => setSelectedShadow(asShadow)}
                                                    >
                                                        <div 
                                                            onClick={(e) => { e.stopPropagation(); setSimpleProfileUser(asShadow); }}
                                                            className="w-9 h-9 rounded-full bg-[#d0dde8] overflow-hidden border border-[#6b8cae]/40 flex shrink-0 items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                                                        >
                                                            {memberImgSrc
                                                                ? <img src={memberImgSrc} alt={member.name} className="w-full h-full object-cover" />
                                                                : <span className="text-[#4a7da8] font-bold text-sm">{member.name[0]}</span>}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-1 flex-wrap">
                                                                <span className="text-xs font-bold text-[#3e2723] truncate max-w-[140px]">{memberDisplayName}</span>
                                                                <span className="bg-[#4a7da8] text-white text-[9px] px-1.5 py-0.5 font-bold rounded flex-shrink-0">同行中</span>
                                                            </div>
                                                            <div className="text-[10px] text-[#8b6f4e]">
                                                                Lv.{(member as any).level ?? '?'} {(member as any).job_class || member.job_class}
                                                            </div>
                                                            {memberSkills.length > 0 && (
                                                                <div className="flex gap-1 flex-wrap mt-1">
                                                                    {memberSkills.slice(0, 3).map((sk, i) => (
                                                                        <span key={i} className="px-1 py-0.5 bg-[#d0dde8] text-[#3e5a7a] text-[8px] rounded border border-[#6b8cae]/30">{sk}</span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                                                            <div className="text-[9px] text-[#4a7da8] font-mono">HP {(member as any).hp ?? (member as any).durability ?? '?'}</div>
                                                            <span className="text-[10px] text-[#8b5a2b] font-bold">詳細 →</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            <div className="text-[#3e2723] font-serif font-bold border-b border-[#8b5a2b]/40 pb-1 text-xs mt-3">
                                                酒場にいる冒険者たち
                                            </div>
                                        </>
                                    )}

                                    {/* === Empty State === */}
                                    {shadows.length === 0 && !loading && (
                                        <div className="text-center text-[#8b5a2b]/70 py-10 font-serif">
                                            <p>ここには誰もいないようだ...</p>
                                            <p className="text-sm mt-2">他のプレイヤーがこの地を訪れるのを待ちましょう。</p>
                                        </div>
                                    )}

                                    {/* === Party Full Warning === */}
                                    {currentParty.length >= 4 && shadows.length > 0 && (
                                        <div className="bg-red-50/80 border border-red-300 text-red-700 p-2 text-center text-xs rounded">
                                            パーティメンバーが上限（4人）に達しています。
                                        </div>
                                    )}

                                    {/* === Shadow Cards (compact) === */}
                                    {shadows.map((shadow, idx) => {
                                        const hired = isAlreadyHired(shadow);
                                        const isHeroic = shadow.origin_type === 'shadow_heroic';
                                        const imgSrc = shadow.npc_image_url || shadow.icon_url || shadow.image_url;
                                        const displayName = shadow.epithet
                                            ? `${shadow.epithet} ${shadow.name}`
                                            : shadow.name;
                                        return (
                                            <div
                                                key={idx}
                                                className={`p-2.5 border rounded-md transition-all cursor-pointer active:scale-[0.99] ${
                                                    hired ? 'border-[#6b8cae]/40 bg-[#eef3f7] opacity-80'
                                                    : isHeroic ? 'ring-1 ring-amber-500 bg-gradient-to-r from-amber-50/60 to-[#fdfbf7] hover:ring-amber-400'
                                                    : shadow.origin_type === 'shadow_active' ? 'border-blue-300/50 bg-blue-50/20 hover:border-blue-400/60'
                                                    : 'border-[#c2b280] bg-[#fdfbf7] hover:border-[#a38b6b]'
                                                }`}
                                                onClick={() => setSelectedShadow(shadow)}
                                            >
                                                {/* Row 1: アイコン + 名前 + バッジ + 金額 */}
                                                <div className="flex items-center gap-2">
                                                    <div 
                                                        onClick={(e) => { e.stopPropagation(); setSimpleProfileUser(shadow); }}
                                                        className="w-9 h-9 rounded-full bg-[#e3d5b8] overflow-hidden border border-[#a38b6b] flex shrink-0 items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                                                    >
                                                        {imgSrc
                                                            ? <img src={imgSrc} alt={shadow.name} className="w-full h-full object-cover" />
                                                            : <span className="text-[#8b5a2b] font-bold text-sm">{shadow.name?.[0] || '?'}</span>}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1 flex-wrap">
                                                            <span className="text-xs font-bold text-[#3e2723] truncate max-w-[140px]">{displayName}</span>
                                                            {hired
                                                                ? <span className="bg-[#4a7da8] text-white text-[9px] px-1.5 py-0.5 font-bold rounded">雇用中</span>
                                                                : <OriginBadge shadow={shadow} />
                                                            }
                                                        </div>
                                                        <div className="text-[10px] text-[#8b6f4e]">
                                                            Lv.{shadow.level} {toJpJobClass(shadow.job_class)}
                                                        </div>
                                                    </div>
                                                    {/* 金額 + 通報 + 詳細 */}
                                                    <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                                                        {!hired && (
                                                            <div className="text-amber-700 font-mono font-bold text-xs">{shadow.contract_fee.toLocaleString()} G</div>
                                                        )}
                                                        <div className="flex items-center gap-1">
                                                            {(shadow.icon_url || shadow.image_url) && shadow.origin_type !== 'system_mercenary' && (
                                                                <button onClick={(e) => { e.stopPropagation(); setReportTarget(shadow); }} className="text-[#a38b6b] hover:text-red-600 transition-colors" title="通報">
                                                                    <Flag size={10} />
                                                                </button>
                                                            )}
                                                            <span className="text-[10px] text-[#8b5a2b] font-bold">詳細 →</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Row 2: スキルタグ */}
                                                {shadow.signature_deck_preview.length > 0 && (
                                                    <div className="flex gap-1 flex-wrap mt-1.5 ml-11">
                                                        {shadow.signature_deck_preview.slice(0, 4).map((card: string, i: number) => (
                                                            <span key={i} className="px-1.5 py-0.5 bg-[#e3d5b8] text-[#5d4037] text-[9px] rounded border border-[#a38b6b]">{card}</span>
                                                        ))}
                                                        {shadow.signature_deck_preview.length > 4 && (
                                                            <span className="text-[9px] text-[#8b6f4e]">+{shadow.signature_deck_preview.length - 4}</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : activeTab === 'heroic' ? (
                                /* ===== 英霊の間タブ (v4.1) ===== */
                                <div className="space-y-2">
                                    <div className="bg-amber-50/60 border border-amber-400/40 rounded-lg p-3 mb-2">
                                        <h3 className="text-sm font-bold text-[#3e2723] font-serif mb-1 flex items-center gap-1.5">
                                            <Crown size={14} className="text-amber-600" />英霊の間
                                        </h3>
                                        <p className="text-[11px] text-[#5d4037] leading-relaxed">
                                            かつてこの世界を旅した冒険者たちの魂。英霊はより強力なAIで行動し、レベルに応じた特殊効果を発揮します。
                                        </p>
                                    </div>

                                    {heroicHallLoading ? (
                                        <div className="text-center text-[#8b5a2b] text-xs py-8 animate-pulse font-serif">
                                            英霊の記録を紐解いています...
                                        </div>
                                    ) : heroicHallList.length === 0 ? (
                                        <div className="text-center text-[#8b6f4e] text-xs py-10 font-serif italic">
                                            <p>この地に英霊の記録はまだありません。</p>
                                        </div>
                                    ) : (
                                        <>
                                            {currentParty.length >= 4 && (
                                                <div className="bg-red-50/80 border border-red-300 text-red-700 p-2 text-center text-xs rounded">
                                                    パーティメンバーが上限（4人）に達しています。
                                                </div>
                                            )}
                                            {heroicHallList.map((shadow, idx) => {
                                                const hired = isAlreadyHired(shadow);
                                                const imgSrc = shadow.npc_image_url || shadow.icon_url || shadow.image_url;
                                                const displayName = shadow.epithet ? `${shadow.epithet} ${shadow.name}` : shadow.name;
                                                return (
                                                    <div
                                                        key={idx}
                                                        className={`p-2.5 border rounded-md transition-all cursor-pointer active:scale-[0.99] ${
                                                            hired ? 'border-[#6b8cae]/40 bg-[#eef3f7] opacity-80'
                                                            : 'ring-1 ring-amber-500 bg-gradient-to-r from-amber-50/60 to-[#fdfbf7] hover:ring-amber-400'
                                                        }`}
                                                        onClick={() => setSelectedShadow(shadow)}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-9 h-9 rounded-full bg-amber-100 overflow-hidden border border-amber-400/60 flex shrink-0 items-center justify-center">
                                                                {imgSrc
                                                                    ? <img src={imgSrc} alt={shadow.name} className="w-full h-full object-cover" />
                                                                    : <Star size={14} className="text-amber-600" />}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-1 flex-wrap">
                                                                    <span className="text-xs font-bold text-[#3e2723] truncate max-w-[140px]">{displayName}</span>
                                                                    {hired
                                                                        ? <span className="bg-[#4a7da8] text-white text-[9px] px-1.5 py-0.5 font-bold rounded">雇用中</span>
                                                                        : <OriginBadge shadow={shadow} />
                                                                    }
                                                                </div>
                                                                <div className="text-[10px] text-[#8b6f4e]">
                                                                    Lv.{shadow.level} {toJpJobClass(shadow.job_class)}
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                                                                {!hired && (
                                                                    <div className="text-amber-700 font-mono font-bold text-xs">{shadow.contract_fee.toLocaleString()} G</div>
                                                                )}
                                                                <span className="text-[10px] text-[#8b5a2b] font-bold">詳細 →</span>
                                                            </div>
                                                        </div>
                                                        {shadow.signature_deck_preview.length > 0 && (
                                                            <div className="flex gap-1 flex-wrap mt-1.5 ml-11">
                                                                {shadow.signature_deck_preview.slice(0, 4).map((card: string, i: number) => (
                                                                    <span key={i} className="px-1.5 py-0.5 bg-amber-100 text-[#5d4037] text-[9px] rounded border border-amber-300">{card}</span>
                                                                ))}
                                                                {shadow.signature_deck_preview.length > 4 && (
                                                                    <span className="text-[9px] text-[#8b6f4e]">+{shadow.signature_deck_preview.length - 4}</span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </>
                                    )}
                                </div>
                            ) : (
                                /* ===== 影の記録タブ ===== */
                                <div className="space-y-4">
                                    {/* 説明文 */}
                                    <div className="bg-amber-50/60 border border-[#a38b6b]/40 rounded-lg p-3">
                                        <h3 className="text-sm font-bold text-[#3e2723] font-serif mb-1.5">残影とは</h3>
                                        <p className="text-[11px] text-[#5d4037] leading-relaxed">
                                            引退・死亡したキャラクターは「英霊」として酒場の系譜に刻まれ、他の冒険者のパーティに加わることができます。
                                            英霊が雇われるたびに、あなたのもとへロイヤリティが届きます。
                                        </p>
                                    </div>

                                    {/* サブスクリプション案内 */}
                                    <div className="bg-[#fdfbf7] border border-[#c2b280] rounded-lg p-3">
                                        <h3 className="text-xs font-bold text-[#3e2723] mb-2 font-serif">英霊登録上限</h3>
                                        <div className="space-y-1 text-[10px] text-[#5d4037]">
                                            <div className="flex justify-between">
                                                <span>Free</span><span className="font-bold text-[#8b5a2b]">登録不可</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Basic</span><span className="font-bold text-[#8b5a2b]">最大 3体</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="flex items-center gap-1"><Sparkles size={9} className="text-amber-500" />Premium</span>
                                                <span className="font-bold text-[#8b5a2b]">最大 10体</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 自分の英霊リスト */}
                                    <div>
                                        <h3 className="text-xs font-bold text-[#3e2723] mb-2 font-serif border-b border-[#8b5a2b]/30 pb-1">
                                            あなたの英霊
                                        </h3>
                                        {heroicLoading ? (
                                            <div className="text-center text-[#8b5a2b] text-xs py-4 animate-pulse">記録を確認中...</div>
                                        ) : myHeroics.length === 0 ? (
                                            <div className="text-center text-[#8b6f4e] text-xs py-6 font-serif italic">
                                                <p>英霊の記録はまだありません。</p>
                                                <p className="mt-1">引退または死亡したキャラクターが、英霊として刻まれます。</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {myHeroics.map(h => (
                                                    <div key={h.id} className="flex items-center gap-2 p-2 bg-gradient-to-r from-amber-50/60 to-[#fdfbf7] border border-amber-300/60 rounded ring-1 ring-amber-400/30">
                                                        <div className="w-7 h-7 rounded-full bg-amber-100 border border-amber-400/50 flex items-center justify-center flex-shrink-0">
                                                            <Star size={12} className="text-amber-600" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-xs font-bold text-[#3e2723] truncate">{h.name}</div>
                                                            <div className="text-[10px] text-[#8b6f4e]">Lv.{h.level} {toJpJobClass(h.job_class)}</div>
                                                        </div>
                                                        <span className="flex items-center gap-0.5 bg-gradient-to-r from-amber-600 to-yellow-400 text-[9px] font-bold text-slate-950 px-1.5 py-0.5 rounded flex-shrink-0">
                                                            <Star size={8} />英霊
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>

        {/* ===== NPC Detail Popup ===== */}
        {selectedShadow && (() => {
            const hired = isAlreadyHired(selectedShadow);
            const imgSrc = selectedShadow.npc_image_url || selectedShadow.icon_url || selectedShadow.image_url;
            const displayName = selectedShadow.epithet
                ? `${selectedShadow.epithet} ${selectedShadow.name}`
                : selectedShadow.name;
            return (
            <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedShadow(null)}>
                <div className="bg-[#fdfbf7] border-2 border-[#8b5a2b] w-full max-w-md rounded-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                    {/* Header */}
                    <div className="bg-[#3e2723] p-5 flex items-center gap-4 border-b-2 border-[#8b5a2b]">
                        <div 
                            className={`w-16 h-16 rounded-full bg-[#e3d5b8] overflow-hidden border-2 border-[#a38b6b] flex items-center justify-center flex-shrink-0 ${imgSrc ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                            onClick={(e) => {
                                if (imgSrc) {
                                    e.stopPropagation();
                                    setEnlargedImage(imgSrc);
                                }
                            }}
                        >
                            {imgSrc
                                ? <img src={imgSrc} alt={selectedShadow.name} className="w-full h-full object-cover" />
                                : <span className="text-2xl font-bold text-[#a38b6b]">{selectedShadow.name[0]}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <OriginBadge shadow={selectedShadow} />
                            </div>
                            <div className="text-lg font-bold text-amber-400 truncate">{displayName}</div>
                            <div className="text-sm text-[#a38b6b]">Lv.{selectedShadow.level} {toJpJobClass(selectedShadow.job_class)}</div>
                            {!hired && <div className="text-amber-300 font-mono font-bold mt-1">{selectedShadow.contract_fee.toLocaleString()} G</div>}
                            {hired && <div className="text-[#6b8cae] font-bold mt-1 text-sm">雇用中</div>}
                        </div>
                        <button onClick={() => setSelectedShadow(null)} className="text-[#a38b6b] hover:text-white p-1 flex-shrink-0">✕</button>
                    </div>

                    <div className="p-5 space-y-4">
                        {/* Stats — 順序: HP → 攻撃 → 防御 */}
                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-[#e3d5b8]/50 rounded p-2 text-center border border-[#a38b6b]/30">
                                <div className="text-[10px] text-[#8b6f4e] mb-0.5 flex items-center justify-center gap-0.5"><Heart size={9} />HP</div>
                                <div className="text-green-700 font-bold font-mono">{selectedShadow.stats.hp}</div>
                            </div>
                            <div className="bg-[#e3d5b8]/50 rounded p-2 text-center border border-[#a38b6b]/30">
                                <div className="text-[10px] text-[#8b6f4e] mb-0.5 flex items-center justify-center gap-0.5"><Sword size={9} />攻撃</div>
                                <div className="text-red-700 font-bold font-mono">{selectedShadow.stats.atk}</div>
                            </div>
                            <div className="bg-[#e3d5b8]/50 rounded p-2 text-center border border-[#a38b6b]/30">
                                <div className="text-[10px] text-[#8b6f4e] mb-0.5 flex items-center justify-center gap-0.5"><Shield size={9} />防御</div>
                                <div className="text-blue-700 font-bold font-mono">{selectedShadow.stats.def}</div>
                            </div>
                        </div>

                        {/* Skills */}
                        {selectedShadow.signature_deck_preview.length > 0 && (
                            <div className="bg-[#e3d5b8]/30 rounded-lg p-3 border border-[#a38b6b]/30">
                                <div className="text-[10px] text-[#8b6f4e] mb-2">所持スキル</div>
                                <div className="flex flex-wrap gap-1.5">
                                    {selectedShadow.signature_deck_preview.map((card, i) => (
                                        <span key={i} className="px-2 py-1 bg-[#fdfbf7] text-[#5d4037] text-xs rounded border border-[#a38b6b] font-medium">{card}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Flavor */}
                        {selectedShadow.flavor_text && (
                            <div className="bg-amber-50/50 rounded-lg p-3 border border-[#a38b6b]/30">
                                <p className="text-[#8b5a2b] font-serif italic text-sm leading-relaxed">「{selectedShadow.flavor_text}」</p>
                            </div>
                        )}

                        {/* Buttons */}
                        <div className="flex gap-3">
                            <button onClick={() => setSelectedShadow(null)} className="flex-1 py-2.5 border border-[#8b5a2b] text-[#8b5a2b] hover:bg-[#8b5a2b]/10 text-sm rounded-lg">
                                閉じる
                            </button>
                            {hired ? (
                                <button
                                    onClick={() => {
                                        const member = currentParty.find(m => m.name === selectedShadow.name || (selectedShadow.profile_id && (m as any).source_user_id === selectedShadow.profile_id));
                                        if (member) {
                                            setSelectedShadow(null);
                                            handleDismiss(member.id, member.name);
                                        }
                                    }}
                                    disabled={dismissing}
                                    className="flex-1 py-2.5 text-sm font-bold rounded-lg bg-red-50 text-red-700 border border-red-300 hover:bg-red-100 transition-all active:scale-95"
                                >
                                    契約解除
                                </button>
                            ) : (
                                <button
                                    onClick={async () => { if (isAlreadyHired(selectedShadow)) return; await handleHire(selectedShadow); setSelectedShadow(null); }}
                                    disabled={hirePhase !== 'idle' || userProfile.gold < selectedShadow.contract_fee || currentParty.length >= 4}
                                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                                        currentParty.length >= 4 ? 'bg-gray-200 text-gray-500 border border-gray-300 cursor-not-allowed'
                                        : userProfile.gold < selectedShadow.contract_fee ? 'bg-gray-200 text-gray-500 border border-gray-300 cursor-not-allowed'
                                        : 'bg-[#8b5a2b] hover:bg-[#6b4522] text-white border border-[#8b5a2b] shadow-lg'
                                    }`}>
                                    {currentParty.length >= 4 ? 'パーティ満員' : userProfile.gold < selectedShadow.contract_fee ? '資金不足' : `契約を結ぶ (${selectedShadow.contract_fee.toLocaleString()} G)`}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            );
        })()}

        {/* ===== Simple User Profile Popup ===== */}
        {simpleProfileUser && (
            <SimpleUserProfilePopup
                isOpen={!!simpleProfileUser}
                onClose={() => setSimpleProfileUser(null)}
                avatarUrl={simpleProfileUser.npc_image_url || simpleProfileUser.icon_url || simpleProfileUser.image_url}
                name={simpleProfileUser.name}
                epithet={simpleProfileUser.epithet}
                introduction={simpleProfileUser.introduction}
            />
        )}

        {/* ===== Enlarged Image Popup ===== */}
        {enlargedImage && (
            <div 
                className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
                onClick={() => setEnlargedImage(null)}
            >
                <div className="relative max-w-2xl max-h-[90vh] flex flex-col items-center">
                    <button 
                        onClick={() => setEnlargedImage(null)}
                        className="absolute -top-10 right-0 text-white hover:text-amber-400 p-2"
                    >
                        <X className="w-8 h-8" />
                    </button>
                    <img 
                        src={enlargedImage} 
                        alt="Enlarged view" 
                        className="object-contain max-w-full max-h-[85vh] rounded shadow-2xl"
                    />
                </div>
            </div>
        )}
        {/* ===== 加入中 / 加入完了 Overlay ===== */}
        {hirePhase !== 'idle' && (
            <div className="fixed inset-0 z-[250] bg-black/60 backdrop-blur-sm flex items-center justify-center">
                <div className={`px-8 py-6 rounded-2xl shadow-2xl text-center animate-in fade-in zoom-in-90 duration-200 border ${
                    hirePhase === 'loading'
                        ? 'bg-[#3e2723]/95 border-[#8b5a2b] text-amber-300'
                        : hireResultMsg.includes('エラー') || hireResultMsg.includes('失敗') || hireResultMsg.includes('満員') || hireResultMsg.includes('足り')
                            ? 'bg-red-950/95 border-red-700 text-red-200'
                            : 'bg-[#1a3a2a]/95 border-emerald-700 text-emerald-300'
                }`}>
                    {hirePhase === 'loading' ? (
                        <>
                            <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                            <p className="text-base font-serif font-bold tracking-widest animate-pulse">加入中...</p>
                        </>
                    ) : (
                        <p className="text-base font-bold font-serif tracking-wide">{hireResultMsg}</p>
                    )}
                </div>
            </div>
        )}
        </>
    );
}
