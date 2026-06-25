'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { supabase } from '@/lib/supabase';
import { getAuthHeaders, clearAuthTokenCache } from '@/lib/authToken';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useBgm } from '@/hooks/useBgm';
import { soundManager } from '@/lib/soundManager';
import { getBgmKey } from '@/lib/getBgmKey';
import { getNpcForLocation } from '@/lib/getNpcForLocation';
import type { FacilityKey } from '@/data/npcMasterData';
import type { FacilityType } from '@/components/inn/FacilityGrid';
import type { NpcDialogData, SecondaryAction } from '@/components/inn/NpcDialogModal';

type ModalType = FacilityType | 'workshop' | 'history' | 'questBoard' | 'gossip' | 'collection' | 'questLog' | 'ranking' | null;

/**
 * useInnPageState — 拠点ページの全状態管理カスタムフック
 * v27.0: inn/page.tsx (753行) からロジックを分離
 */
export function useInnPageState() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { gold, spendGold, worldState, fetchWorldState, userProfile, fetchUserProfile, showStatus, setShowStatus, hubState, equipBonus, _hasHydrated } = useGameStore();
    const locationSlug = worldState?.location_name || '名もなき旅人の拠所';

    const [billingDialog, setBillingDialog] = useState<{
        title: string;
        message: string;
    } | null>(null);

    useEffect(() => {
        if (_hasHydrated && userProfile && worldState) {
            setLoading(false);
        }
    }, [_hasHydrated, userProfile, worldState]);

    // Stripe billing success conversion tracking
    useEffect(() => {
        const billing = searchParams.get('billing');
        if (billing === 'success' || billing === 'gold_success') {
            const tier = searchParams.get('tier');
            const amount = searchParams.get('amount');
            const pkg = searchParams.get('package');

            let title = '購入完了';
            let message = '';

            if (billing === 'success') {
                title = '契約が反映されました';
                if (tier === 'premium') {
                    message = '旅人のサブスクリプション（Premium プラン）が有効になりました。\n特典として「5,000 G」と「知識と契約の鍵 x3」、「魔道と鉄壁の鍵 x2」が宿屋の倉庫（インベントリ）に付与されました。';
                } else {
                    message = '旅人のサブスクリプション（Basic プラン）が有効になりました。\n特典として「2,000 G」と「知識と契約の鍵 x1」、「魔道と鉄壁の鍵 x1」が宿屋の倉庫（インベントリ）に付与されました。';
                }
            } else {
                if (pkg === 'starter_pack') {
                    title = 'スターターパック購入完了';
                    message = 'スターターパックの購入が反映されました！\n「10,000 G」と「知識と契約の鍵 x5」、「魔道と鉄壁の鍵 x3」が宿屋の倉庫（インベントリ）に付与されました。';
                } else if (pkg === 'elite_pack') {
                    title = 'エリートパック購入完了';
                    message = 'エリートパックの購入が反映されました！\n「30,000 G」と「知識と契約の鍵 x8」、「魔道と鉄壁の鍵 x5」が宿屋の倉庫（インベントリ）に付与されました。';
                } else {
                    title = 'ゴールド購入完了';
                    const goldG = amount ? Number(amount).toLocaleString() : '---';
                    message = `ご購入いただいた「${goldG} G」が所持ゴールドに反映されました。`;
                }
            }

            setBillingDialog({ title, message });
            soundManager?.playSE('se_item_get');

            // ユーザープロフィールを再読み込みして最新データを画面に即時反映
            fetchUserProfile();

            const purchaseId = process.env.NEXT_PUBLIC_X_CONVERSION_PURCHASE_ID;
            if (purchaseId) {
                import('@/utils/xads').then(({ trackXEvent }) => {
                    const amountVal = Number(amount || 0);
                    // 金額算出（サブスクの場合は想定金額等）
                    const value = billing === 'success' 
                        ? (tier === 'premium' ? 1000 : 500) // プラン別仮金額
                        : amountVal;

                    trackXEvent(purchaseId, {
                        value: String(value),
                        currency: 'JPY'
                    });
                });
            }

            // 二重送信防止のためクエリパラメーターを除去してURLをクリーンアップ
            const url = new URL(window.location.href);
            url.searchParams.delete('billing');
            url.searchParams.delete('tier');
            url.searchParams.delete('amount');
            url.searchParams.delete('package');
            window.history.replaceState({}, '', url.pathname + url.search);
        }
    }, [searchParams, fetchUserProfile]);

    // 拠点状態に応じた動的BGM選択 (spec_v14.1 §4)
    const isTutorialActive = userProfile && userProfile.is_tutorial_completed === false;
    const bgmKey = isTutorialActive
        ? 'bgm_title'
        : getBgmKey(
            worldState?.location_name,
            worldState?.controlling_nation,
            worldState?.prosperity_level
        );
    useBgm(bgmKey);

    // UI States
    const [activeModal, setActiveModal] = useState<ModalType>(null);
    const [loading, setLoading] = useState(() => {
        // Zustand ストアに先行ロードされたデータがあるなら初期ローディングをスキップ
        const state = useGameStore.getState();
        const skipLoading = !!(state.userProfile && state.worldState);
        return !skipLoading;
    });
    const [showAccount, setShowAccount] = useState(false);
    const [showTavern, setShowTavern] = useState(false);
    const [showShop, setShowShop] = useState(false);
    const [showAcademy, setShowAcademy] = useState(false);
    const [showPrayer, setShowPrayer] = useState(false);
    const [showBilling, setShowBilling] = useState(false);
    const [resultOverlay, setResultOverlay] = useState<{ result: 'success' | 'failure'; data: any } | null>(null);
    const [restLoading, setRestLoading] = useState(false);
    const [traveling, setTraveling] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    // Quest Data State (ギルド用)
    const [allQuests, setAllQuests] = useState<any[]>([]);
    const [loadingQuests, setLoadingQuests] = useState(false);

    const locationQuests = useGameStore(state => state.locationQuests);
    useEffect(() => {
        if (locationQuests?.quests) {
            setAllQuests(locationQuests.quests);
        }
    }, [locationQuests]);

    // Reputation
    const [reputation, setReputation] = useState<any>(null);

    // News & History Logic
    const [showTutorial, setShowTutorial] = useState(false);

    // Profile 読み込み時にチュートリアル未完了なら表示
    useEffect(() => {
        if (userProfile && userProfile.is_tutorial_completed === false) {
            setShowTutorial(true);
        }
    }, [userProfile?.is_tutorial_completed]);

    const handleCompleteTutorial = async () => {
        if (!userProfile) return;
        try {
            let token = await (await import('@/lib/authToken')).getAuthToken();
            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch('/api/profile/complete-tutorial', {
                method: 'POST',
                headers,
            });

            if (res.ok) {
                // ローカルの Profile 状態を更新
                useGameStore.setState(state => ({
                    userProfile: state.userProfile ? {
                        ...state.userProfile,
                        is_tutorial_completed: true,
                    } : null
                }));
                setShowTutorial(false);
            } else {
                console.error('Failed to complete tutorial on server');
                setShowTutorial(false);
            }
        } catch (e) {
            console.error('Failed to complete tutorial', e);
            setShowTutorial(false);
        }
    };


    // Badge states (赤！バッジ)
    const [showHistoryBadge, setShowHistoryBadge] = useState(true);

    // ハブ判定
    const isHub = hubState?.is_in_hub === true;

    // Vitality枯渇死亡モーダル (spec_v15.1 §3.3)
    const [showVitalityDeath, setShowVitalityDeath] = useState(false);
    const [vitalityDeathHandled, setVitalityDeathHandled] = useState(false);

    // v27.0: HP満タン確認ダイアログ
    const [showRestConfirm, setShowRestConfirm] = useState(false);

    useAuthGuard(); // タイトル画面経由チェック

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 2500);
    };

    // Initial load — init-page APIで一括取得
    const fetchInitPage = useCallback(async (forceFetch = false) => {
        const store = useGameStore.getState();
        const lastFetch = store.lastInitPageFetchTime || 0;
        const hasData = store.userProfile && store.worldState;
        
        // SWRパターン: メモリ上にデータがあれば即表示し、ローディング状態を解除
        if (hasData && !forceFetch) {
            setLoading(false);
            setInitialLoadComplete(true);
        }

        // キャッシュチェック（直近60秒以内かつ強制フェッチでないならAPI取得自体をスキップ）
        if (hasData && !forceFetch && Date.now() - lastFetch < 60000) {
            console.log('[useInnPageState] skip init-page fetch. Data is fresh.');
            return;
        }

        try {
            let token = await (await import('@/lib/authToken')).getAuthToken();
            const isOauthCallback = typeof window !== 'undefined' && window.location.search.includes('code=');
            if (!token && isOauthCallback) {
                // Google OAuth 直後の書き込みタイムラグ対策として1000ms待ってリトライ
                await new Promise(resolve => setTimeout(resolve, 1000));
                token = await (await import('@/lib/authToken')).getAuthToken();
            }
            const headers: HeadersInit = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch('/api/init-page', { headers, cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();

                // Profile + gold + equipBonus をストアに反映
                if (data.profile) {
                    useGameStore.setState({
                        userProfile: data.profile,
                        gold: data.profile.gold || 0,
                        equipBonus: data.profile.equip_bonus || { atk: 0, def: 0, hp: 0 },
                    });
                }

                // Hub State
                if (data.hub_state) {
                    useGameStore.setState({ hubState: data.hub_state });
                }

                // World State（hegemony 含む）
                if (data.world_state) {
                    useGameStore.setState({ worldState: data.world_state });
                }

                // キャッシュのセット
                useGameStore.setState({
                    tavernShadows: data.tavern_shadows || [],
                    partyMembers: data.party_members || [],
                    locationQuests: data.location_quests || { quests: [], special_quests: [], normal_quests: [] },
                    gossipData: data.gossip_data,
                    completedQuests: data.completed_quests || [],
                    lastInitPageFetchTime: Date.now(), // 更新
                });

                if (typeof window !== 'undefined' && data.profile?.current_location_id) {
                    const locId = data.profile.current_location_id;
                    try {
                        if (data.tavern_shadows) {
                            sessionStorage.setItem(`tavern_shadows_cache_${locId}`, JSON.stringify(data.tavern_shadows));
                        }
                        if (data.location_quests) {
                            sessionStorage.setItem(`location_quests_cache_${locId}`, JSON.stringify(data.location_quests));
                        }
                    } catch {}
                }

                // Reputation
                if (data.reputation !== undefined) {
                    setReputation(data.reputation || { rank: 'Stranger', score: 0 });
                }

                if (!data.profile) {
                    router.push('/title');
                }
            } else {
                // Fallback: 従来の個別フェッチ
                await Promise.all([
                    fetchWorldState(),
                    useGameStore.getState().fetchUserProfile()
                ]);
                useGameStore.setState({ lastInitPageFetchTime: Date.now() });
                if (!useGameStore.getState().userProfile) {
                    router.push('/title');
                }
            }
        } catch (e) {
            console.error('[useInnPageState] init-page fetch failed, falling back:', e);
            await Promise.all([
                fetchWorldState(),
                useGameStore.getState().fetchUserProfile()
            ]);
            useGameStore.setState({ lastInitPageFetchTime: Date.now() });
            if (!useGameStore.getState().userProfile) {
                router.push('/title');
            }
        } finally {
            setLoading(false);
            setInitialLoadComplete(true);
        }
    }, [router, fetchWorldState]);

    useEffect(() => {
        if (!_hasHydrated) return; // ハイドレーション完了まで待機
        fetchInitPage(false);
    }, [_hasHydrated, fetchInitPage]);

    // 拠点施設NPCマスター画像の先行バックグラウンドロード (v39)
    useEffect(() => {
        if (typeof window === 'undefined' || !locationSlug) return;
        const repScore = reputation?.score || 0;
        const facilities: FacilityKey[] = ['inn', 'guild', 'shop', 'temple', 'magicAcademy'];
        facilities.forEach((fac) => {
            try {
                const resolved = getNpcForLocation(locationSlug, fac, repScore);
                if (resolved && resolved.imageUrl) {
                    const img = new Image();
                    img.src = resolved.imageUrl;
                }
            } catch (e) {
                console.error('[useInnPageState] Preload NPC image failed:', e);
            }
        });
    }, [locationSlug, reputation?.score]);

    // linkIdentity コールバック処理
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const checkOAuthErrors = () => {
            const url = new URL(window.location.href);
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            
            const error = url.searchParams.get('error') || hashParams.get('error');
            const errorDesc = url.searchParams.get('error_description') || hashParams.get('error_description');

            if (error) {
                console.error('[linkIdentity] OAuth error detected:', error, errorDesc);
                let userFriendlyMsg = 'アカウント連携に失敗しました。';
                if (error === 'identity_already_linked' || errorDesc?.includes('already_linked') || errorDesc?.includes('already linked')) {
                    userFriendlyMsg = 'このGoogleアカウントは既に他のプレイヤーデータと連携されています。タイトル画面からこのGoogleアカウントでログインするか、別のGoogleアカウントと連携してください。';
                } else if (errorDesc) {
                    userFriendlyMsg = `アカウント連携に失敗しました: ${decodeURIComponent(errorDesc)}`;
                }
                alert(userFriendlyMsg);

                // URLクリーンアップ (クエリパラメータとハッシュ)
                const currentUrl = new URL(window.location.href);
                currentUrl.hash = '';
                ['error', 'error_description', 'error_code'].forEach(p => {
                    currentUrl.searchParams.delete(p);
                });
                window.history.replaceState({}, '', currentUrl.pathname + currentUrl.search);
                return true;
            }
            return false;
        };

        if (checkOAuthErrors()) return;

        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        if (!code) return;

        const cleanUrl = () => {
            const currentUrl = new URL(window.location.href);
            let changed = false;
            ['code', 'error', 'error_description', 'error_code'].forEach(p => {
                if (currentUrl.searchParams.has(p)) {
                    currentUrl.searchParams.delete(p);
                    changed = true;
                }
            });
            if (currentUrl.hash) {
                currentUrl.hash = '';
                changed = true;
            }
            if (changed) {
                window.history.replaceState({}, '', currentUrl.pathname + currentUrl.search);
            }
        };

        const handleOAuthCallback = async () => {
            try {
                // セッション交換前にメモリキャッシュをクリア
                clearAuthTokenCache();

                // 手動で認証コードをセッションと交換する
                const { data, error } = await supabase.auth.exchangeCodeForSession(code);
                if (error) throw error;

                // セッション交換後にも再度クリア（新しいセッションのトークンを確実に取得するため）
                clearAuthTokenCache();

                const user = data.session?.user;
                if (user && !user.is_anonymous) {
                    await supabase.from('user_profiles').update({ is_anonymous: false }).eq('id', user.id);
                    await fetchUserProfile();
                    await fetchInitPage(true);
                    console.log('[linkIdentity] 手動アカウント連携完了。is_anonymous → false');
                }
            } catch (e) {
                console.warn('[linkIdentity] 手動アカウント連携・同期に失敗:', e);
            } finally {
                cleanUrl();
            }
        };

        handleOAuthCallback();
    }, [fetchUserProfile, fetchInitPage]);

    // エンカウントバトル結果処理
    useEffect(() => {
        const battleResult = searchParams.get('battle_result');
        const bType = searchParams.get('type');
        const targetLocId = searchParams.get('target');
        const originLocId = searchParams.get('origin');
        const isEncounterType = bType === 'bounty_hunter_ambush' || bType === 'random_encounter';
        
        // パラメータが正常に含まれている場合のみAPI処理を呼び出し（二重呼び出し抑止）
        const hasValidParams = targetLocId && targetLocId !== 'undefined' && targetLocId !== 'null' &&
                              originLocId && originLocId !== 'undefined' && originLocId !== 'null';

        if (!battleResult || !isEncounterType || !userProfile?.id || !hasValidParams) return;

        const resolveEncounterResult = async () => {
            setLoading(true);
            try {
                const authHeaders = await getAuthHeaders();
                const res = await fetch('/api/move/encounter-result', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...authHeaders,
                    },
                    body: JSON.stringify({
                        result: battleResult === 'win' ? 'win' : 'lose',
                        encounter_type: bType,
                        target_location_id: targetLocId,
                        origin_location_id: originLocId,
                        travel_days: parseInt(searchParams.get('days') || '1', 10)
                    })
                });
                const data = await res.json();
                if (res.ok) {
                    await fetchUserProfile();
                    // 新しい拠点データを強制更新 (force=true) でプリフェッチしてストア状態を完全同期
                    await useGameStore.getState().prefetchTownData(undefined, true);
                    
                    if (data.redirect_to_map) {
                        router.replace(`/world-map`);
                    }
                }
            } catch (e) {
                console.error('[InnPage] encounter-result resolve failed', e);
            }
            router.replace('/inn');
        };
        resolveEncounterResult();
    }, [searchParams.get('battle_result'), userProfile?.id]);

    // Vitality枯渇死亡検知
    useEffect(() => {
        if (!userProfile || vitalityDeathHandled) return;
        if ((userProfile.vitality ?? 100) <= 0) {
            setShowVitalityDeath(true);
            setVitalityDeathHandled(true);
        }
    }, [userProfile?.vitality]);

    // Reputation Logic (通常拠点でのみ取得)
    const fetchRep = useCallback(async () => {
        if (!userProfile?.id || !worldState?.location_name) return;
        if (isHub) return;
        const { data } = await supabase
            .from('reputations')
            .select('*')
            .eq('user_id', userProfile.id)
            .eq('location_name', worldState.location_name)
            .maybeSingle();
        setReputation(data || { rank: 'Stranger', score: 0 });
    }, [userProfile?.id, worldState?.location_name, isHub]);

    // init-page APIで既に取得済みの場合はスキップ
    useEffect(() => {
        if (!initialLoadComplete) return;
        if (reputation !== null) return;
        fetchRep();
    }, [fetchRep, reputation, initialLoadComplete]);

    // 所在地（ロケーション）が変わったタイミングで、名声を null にリセットして再取得を促す
    useEffect(() => {
        if (worldState?.location_name) {
            setReputation(null);
        }
    }, [worldState?.location_name]);



    // NPC Data Generator
    const FACILITY_LABELS: Record<string, string> = {
        inn: '宿屋/酒場', guild: 'ギルド', shop: '道具屋', temple: '神殿', magicAcademy: '魔術学院'
    };


    const getNpcData = (facility: FacilityType): NpcDialogData | null => {
        const facilityKey = facility as FacilityKey;
        if (!['inn', 'guild', 'shop', 'temple', 'magicAcademy'].includes(facilityKey)) return null;

        const repScore = reputation?.score || 0;
        const resolved = getNpcForLocation(locationSlug, facilityKey, repScore);

        if (!resolved) {
            return {
                facilityName: FACILITY_LABELS[facility] || facility,
                role: '担当者',
                name: '名のある者',
                dialogue: 'いらっしゃい。何かご用ですか？',
            };
        }

        return {
            facilityName: FACILITY_LABELS[facility] || facility,
            role: resolved.role,
            name: resolved.name,
            dialogue: resolved.dialogue,
            imageUrl: resolved.imageUrl,
            isBanned: resolved.isBanned,
        };
    };

    const handleSelectFacility = (facility: FacilityType) => {
        if (['map', 'status', 'settings', 'gossip', 'collection', 'questLog', 'ranking'].includes(facility)) {
            if (facility === 'map') {
                soundManager?.playSE('se_travel');
                setTimeout(() => router.push('/world-map'), 150);
            }
            if (facility === 'status') setShowStatus(true);
            if (facility === 'settings') setShowAccount(true);
            if (facility === 'gossip') setActiveModal('gossip');
            if (facility === 'collection') setActiveModal('collection');
            if (facility === 'questLog') setActiveModal('questLog');
            if (facility === 'ranking') setActiveModal('ranking');
            if (facility === 'colosseum') setActiveModal('colosseum');
        } else {
            const facilitySeMap: Record<string, string> = {
                inn: 'se_enter_inn', guild: 'se_enter_guild',
                shop: 'se_enter_shop', temple: 'se_enter_temple',
                colosseum: 'se_enter_guild',
            };
            const seKey = facilitySeMap[facility];
            if (seKey) soundManager?.playSE(seKey);
            setActiveModal(facility);
        }
    };

    // v27.0: ハブでは固定コスト100G
    const getInnCost = () => {
        if (isHub) return 100;
        const prosp = worldState?.prosperity_level || 3;
        if (prosp >= 4) return 100;
        if (prosp <= 2) return 300;
        return 200;
    };

    const activeDialogConfig = (): { buttonText: string; isDisabled: boolean; secondaryActions?: SecondaryAction[] } => {
        if (!activeModal) return { buttonText: '', isDisabled: false };
        if (activeModal === 'inn') {
            const cost = getInnCost();
            const canAfford = (userProfile?.gold || 0) >= cost;
            const secondary: SecondaryAction[] = [];
            if (!isHub) {
                secondary.push({ label: '冒険者を探す', onClick: () => { setActiveModal(null); setShowTavern(true); } });
            }
            return {
                buttonText: canAfford ? `休息する（${cost} G）` : 'ゴールドが不足しています',
                isDisabled: !canAfford,
                secondaryActions: secondary,
            };
        }
        if (activeModal === 'shop') return { buttonText: '品揃えを見る', isDisabled: false };
        if (activeModal === 'temple') return { buttonText: '礼拝堂に行く', isDisabled: false };
        if (activeModal === 'guild') return { buttonText: '依頼を見る', isDisabled: false };
        if (activeModal === 'magicAcademy') return { buttonText: '魔術学院に入る', isDisabled: false };
        return { buttonText: '機能を利用する', isDisabled: false };
    };

    const handleDialogAction = (facility: FacilityType) => {
        setActiveModal(null);
        if (facility === 'inn') {
            handleRest();
        } else if (facility === 'shop') {
            setShowShop(true);
        } else if (facility === 'temple') {
            setShowPrayer(true);
        } else if (facility === 'guild') {
            setActiveModal('questBoard');
            fetchQuestsForBoard();
        } else if (facility === 'magicAcademy') {
            setShowAcademy(true);
        }
    };

    const fetchQuestsForBoard = async () => {
        if (!userProfile?.id || !worldState?.location_name) return;

        const locationId = userProfile.current_location_id || '';
        const cacheKey = `location_quests_cache_${locationId}`;
        const store = useGameStore.getState();
        const lastFetch = store.lastInitPageFetchTime || 0;
        const hasQuests = store.locationQuests;

        // SWR: すでにメモリ上にデータがあれば即表示し、ローディング状態を排除
        if (hasQuests) {
            setAllQuests(hasQuests.quests || []);
            setLoadingQuests(false);
        }

        // キャッシュチェック（直近60秒以内ならスキップ）
        if (hasQuests && Date.now() - lastFetch < 60000) {
            return;
        }

        // すでにキャッシュがある場合はそれを使用し、バックグラウンドでのみフェッチする
        let cachedQuests = hasQuests;
        if (!cachedQuests && typeof window !== 'undefined') {
            try {
                const cached = sessionStorage.getItem(cacheKey);
                if (cached) {
                    cachedQuests = JSON.parse(cached);
                    if (cachedQuests) {
                        useGameStore.setState({ locationQuests: cachedQuests });
                        setAllQuests(cachedQuests.quests || []);
                        setLoadingQuests(false);
                    }
                }
            } catch {}
        }

        // キャッシュが全く存在しない場合のみ、フォアグラウンドローディングを表示
        if (!cachedQuests) {
            setLoadingQuests(true);
        }

        try {
            const authHeaders = await getAuthHeaders();
            const res = await fetch(`/api/location/quests?userId=${userProfile.id}&locationId=${locationId}`, {
                headers: authHeaders
            });
            if (res.ok) {
                const data = await res.json();
                const questData = {
                    quests: data.quests || [],
                    special_quests: data.special_quests || [],
                    normal_quests: data.normal_quests || []
                };
                setAllQuests(data.quests || []);
                // キャッシュの更新
                useGameStore.setState({ locationQuests: questData });
                if (typeof window !== 'undefined') {
                    try {
                        sessionStorage.setItem(cacheKey, JSON.stringify(questData));
                    } catch {}
                }
            }
        } catch (e) {
            console.error("クエスト読み込み失敗", e);
        } finally {
            setLoadingQuests(false);
        }
    };

    const handleRest = async () => {
        const cost = getInnCost();
        if ((userProfile?.gold || 0) < cost) {
            showToast('ゴールドが不足しています。', 'error');
            return;
        }

        // HP満タンガード — v27.0: ConfirmDialog使用
        const effectiveMaxHp = (userProfile?.max_hp || 100) + (equipBonus?.hp || 0);
        if ((userProfile?.hp || 0) >= effectiveMaxHp) {
            setShowRestConfirm(true);
            return;
        }

        await executeRest();
    };

    const executeRest = async () => {
        setShowRestConfirm(false);
        const cost = getInnCost();
        const effectiveMaxHp = (userProfile?.max_hp || 100) + (equipBonus?.hp || 0);

        // C6: Optimistic UI — 即座にHP全快 & ゴールド減少を反映
        useGameStore.setState(state => ({
            userProfile: state.userProfile ? {
                ...state.userProfile,
                hp: effectiveMaxHp,
            } : null,
            gold: Math.max(0, (state.gold || 0) - cost),
            battleState: {
                ...state.battleState,
                party: [],
                enemy: null,
                enemies: [],
                isVictory: false,
                isDefeat: false,
            }
        }));

        setRestLoading(true);
        try {
            const authHeaders = await getAuthHeaders();
            const res = await fetch('/api/inn/rest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders,
                },
                body: JSON.stringify({ id: userProfile?.id, effectiveMaxHp })
            });
            if (res.ok) {
                const data = await res.json();
                // API結果で正確な値に同期
                await useGameStore.getState().fetchUserProfile();
                let toastMsg = `✨ 休息完了：HPが全快しました（宿泊費: ${cost} G / ${data.days_passed || 1}日経過）`;
                if (data.aging_decay && (data.aging_decay.vit > 0 || data.aging_decay.atk > 0 || data.aging_decay.def > 0)) {
                    const parts: string[] = [];
                    if (data.aging_decay.vit > 0) parts.push(`VIT-${data.aging_decay.vit}`);
                    if (data.aging_decay.atk > 0) parts.push(`ATK-${data.aging_decay.atk}`);
                    if (data.aging_decay.def > 0) parts.push(`DEF-${data.aging_decay.def}`);
                    toastMsg += `\n⚠️ 加齢: ${parts.join(' / ')}`;
                }
                showToast(toastMsg);
            } else {
                const err = await res.json();
                // 失敗時: 楽観的更新をロールバック
                await useGameStore.getState().fetchUserProfile();
                showToast(`宿泊できませんでした: ${err.error || '不明なエラー'}`, 'error');
            }
        } catch (e) {
            console.error(e);
            await useGameStore.getState().fetchUserProfile();
            showToast('通信エラーが発生しました。', 'error');
        } finally {
            setRestLoading(false);
        }
    };

    const returnToHub = async () => {
        if (!userProfile) return;
        setTraveling(true);
        try {
            soundManager?.playSE('se_travel');
            await new Promise(r => setTimeout(r, 1000));

            const { error } = await supabase
                .from('user_hub_states')
                .upsert({ user_id: userProfile.id, is_in_hub: true });

            if (error) throw error;

            // ハブ情報を先行一括ロードしてキャッシュを更新 (force=trueでキャッシュスキップ)
            await useGameStore.getState().prefetchTownData(undefined, true);
            showToast('名もなき旅人の拠所へ帰還しました');
        } catch (e) {
            console.error("Failed to return to hub", e);
            showToast('帰還に失敗しました。', 'error');
        } finally {
            setTraveling(false);
        }
    };

    const leaveHub = async () => {
        if (!userProfile) return;
        setTraveling(true);
        try {
            soundManager?.playSE('se_enter_location');
            await new Promise(r => setTimeout(r, 1000));

            const { error } = await supabase
                .from('user_hub_states')
                .upsert({ user_id: userProfile.id, is_in_hub: false });

            if (error) throw error;

            // 遷移先の拠点情報を先行一括ロードしてキャッシュを更新 (force=trueでキャッシュスキップ)
            await useGameStore.getState().prefetchTownData(undefined, true);
            showToast('直前の拠点へ戻りました');
        } catch (e) {
            console.error("Failed to leave hub", e);
            showToast('移動に失敗しました。', 'error');
        } finally {
            setTraveling(false);
        }
    };

    const openHistoryHall = () => {
        setShowHistoryBadge(false);
        setActiveModal('history');
    };

    // Derived states
    const activeNpcData = activeModal && ['inn', 'shop', 'temple', 'guild', 'magicAcademy'].includes(activeModal)
        ? getNpcData(activeModal as FacilityType) : null;
    const { buttonText, isDisabled, secondaryActions } = activeDialogConfig();

    return {
        // State
        router, loading, worldState, userProfile, equipBonus, isHub,
        activeModal, setActiveModal,
        billingDialog, setBillingDialog,
        showAccount, setShowAccount,
        showTavern, setShowTavern,
        showShop, setShowShop,
        showAcademy, setShowAcademy,
        showPrayer, setShowPrayer,
        showStatus, setShowStatus,
        showBilling, setShowBilling,
        resultOverlay, setResultOverlay,
        restLoading,
        traveling,
        toast,
        allQuests, loadingQuests,
        reputation,
        showTutorial, handleCompleteTutorial,
        showHistoryBadge,
        showVitalityDeath, setShowVitalityDeath,
        showRestConfirm, setShowRestConfirm,
        locationSlug,

        // NPC
        activeNpcData, buttonText, isDisabled, secondaryActions,

        // Actions
        handleSelectFacility,
        handleDialogAction,
        openHistoryHall,
        executeRest,
        fetchRep,
        returnToHub,
        leaveHub,
    };
}
