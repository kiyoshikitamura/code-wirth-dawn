'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin, Clock, Loader2, Trash2, Send } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { soundManager } from '@/lib/soundManager';
import SimpleUserProfilePopup from '@/components/shared/SimpleUserProfilePopup';
import { getAuthHeaders, getAuthToken } from '@/lib/authToken';
import { supabase } from '@/lib/supabase';

interface Props {
    onClose: () => void;
    onOpenTavern?: () => void; // Keep for compatibility
}

export default function GossipModal({ onClose }: Props) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    const { userProfile, worldState } = useGameStore();
    const [channel, setChannel] = useState<'global' | 'local'>('global');
    const currentLocationName = worldState?.location_name || '酒場';
    const [pinnedSystemPost, setPinnedSystemPost] = useState<any | null>(null);
    const [posts, setPosts] = useState<any[]>([]);
    const [hideSystemMessages, setHideSystemMessages] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [nextOffset, setNextOffset] = useState(50);

    const [newPostContent, setNewPostContent] = useState('');
    const [posting, setPosting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [cooldownTime, setCooldownTime] = useState(0);
    const [simpleProfileUser, setSimpleProfileUser] = useState<any | null>(null);

    const scrollerRef = useRef<HTMLDivElement>(null);
    const lastFetchTimeRef = useRef<number>(0);

    // Initial fetch / Reload
    const fetchInitialData = async (isRefresh = false, excludeSys = hideSystemMessages) => {
        if (isRefresh) {
            const now = Date.now();
            if (now - lastFetchTimeRef.current < 2000) {
                return;
            }
        }

        if (!isRefresh) setLoading(true);
        try {
            const authHeaders = await getAuthHeaders();
            const res = await fetch(
                `/api/gossip?limit=50&offset=0&excludeSystem=${excludeSys}&channel=${channel}&locationId=${userProfile?.current_location_id || ''}`,
                { headers: authHeaders }
            );
            if (res.ok) {
                const data = await res.json();
                setPinnedSystemPost(data.pinned_system_post);
                setPosts(data.posts || []);
                setNextOffset(50);
                setHasMore((data.posts || []).length >= 50);
                lastFetchTimeRef.current = Date.now();

                // Update last_viewed_gossip_time
                let maxTime = 0;
                if (data.pinned_system_post?.created_at) {
                    maxTime = Math.max(maxTime, new Date(data.pinned_system_post.created_at).getTime());
                }
                if (data.posts && data.posts.length > 0 && data.posts[0].created_at) {
                    maxTime = Math.max(maxTime, new Date(data.posts[0].created_at).getTime());
                }
                if (maxTime > 0) {
                    localStorage.setItem('last_viewed_gossip_time', String(maxTime));
                }
            }
        } catch (e) {
            console.error('Failed to fetch initial gossip:', e);
        } finally {
            if (!isRefresh) setLoading(false);
        }
    };

    // Load initial settings and trigger fetch
    useEffect(() => {
        soundManager?.playSE('se_modal_open');
        let initialHideSystem = false;
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('wirth_dawn_gossip_hide_system');
            if (saved === 'true') {
                initialHideSystem = true;
                setHideSystemMessages(true);
            }
        }
        fetchInitialData(false, initialHideSystem);
    }, [channel]);

    // Supabase Real-time Sync
    useEffect(() => {
        const channelName = `public:gossip_posts_realtime`;
        const activeLocationId = userProfile?.current_location_id;
        let subscription: any = null;

        getAuthToken().then(token => {
            if (token) {
                supabase.realtime.setAuth(token);
            }
            subscription = supabase
                .channel(channelName)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'gossip_posts'
                    },
                    async (payload) => {
                        const newPost = payload.new;

                        // Enrich post with user's subscription tier
                        let enrichedPost = { ...newPost };
                        if (newPost.user_id && !newPost.is_system) {
                            try {
                                const { data: p } = await supabase
                                    .from('user_profiles')
                                    .select('subscription_tier')
                                    .eq('id', newPost.user_id)
                                    .maybeSingle();
                                if (p) {
                                    enrichedPost.user_profiles = { subscription_tier: p.subscription_tier };
                                }
                            } catch (err) {
                                console.error('[GossipRealtime] Enrichment error:', err);
                            }
                        }

                        if (channel === 'local') {
                            if (enrichedPost.location_id === activeLocationId && !enrichedPost.is_system) {
                                setPosts(prev => {
                                    if (prev.some(p => p.id === enrichedPost.id)) return prev;
                                    return [enrichedPost, ...prev];
                                });
                            }
                        } else {
                            // channel === 'global'
                            const isUserPost = !enrichedPost.is_system;
                            const isGlobalSystemPost = enrichedPost.is_system && enrichedPost.location_id === null;

                            if (isUserPost || isGlobalSystemPost) {
                                if (hideSystemMessages && enrichedPost.is_system) return;
                                setPosts(prev => {
                                    if (prev.some(p => p.id === enrichedPost.id)) return prev;
                                    return [enrichedPost, ...prev];
                                });
                            }
                        }
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'DELETE',
                        schema: 'public',
                        table: 'gossip_posts'
                    },
                    (payload) => {
                        const oldPost = payload.old;
                        setPosts(prev => prev.filter(p => p.id !== oldPost.id));
                    }
                )
                .subscribe();
        });

        return () => {
            if (subscription) {
                supabase.removeChannel(subscription);
            }
        };
    }, [channel, userProfile?.current_location_id, hideSystemMessages]);

    // Auto-scroll to bottom on new message
    useEffect(() => {
        if (scrollerRef.current && posts.length > 0 && !loadingMore) {
            setTimeout(() => {
                if (scrollerRef.current) {
                    scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
                }
            }, 60);
        }
    }, [posts.length]);

    const handleToggleHideSystem = () => {
        const newVal = !hideSystemMessages;
        setHideSystemMessages(newVal);
        soundManager?.playSE('se_click');
        if (typeof window !== 'undefined') {
            localStorage.setItem('wirth_dawn_gossip_hide_system', String(newVal));
        }
        fetchInitialData(false, newVal);
    };

    // Cooldown timer
    useEffect(() => {
        const checkCooldown = () => {
            const lastPost = localStorage.getItem('last_gossip_post_time');
            if (lastPost) {
                const elapsed = (Date.now() - Number(lastPost)) / 1000;
                if (elapsed < 10) {
                    setCooldownTime(Math.ceil(10 - elapsed));
                } else {
                    setCooldownTime(0);
                }
            }
        };
        checkCooldown();
        const interval = setInterval(checkCooldown, 1000);
        return () => clearInterval(interval);
    }, []);

    // Scroll handler for top-scroll pagination (loading older posts)
    const handleScroll = () => {
        if (!scrollerRef.current || loading || loadingMore || !hasMore) return;
        const target = scrollerRef.current;
        if (target.scrollTop <= 20) {
            fetchMoreData();
        }
    };

    const fetchMoreData = async () => {
        if (loadingMore || !hasMore || !scrollerRef.current) return;
        const target = scrollerRef.current;
        const prevScrollHeight = target.scrollHeight;
        const prevScrollTop = target.scrollTop;

        setLoadingMore(true);
        try {
            const authHeaders = await getAuthHeaders();
            const res = await fetch(
                `/api/gossip?limit=50&offset=${nextOffset}&excludeSystem=${hideSystemMessages}&channel=${channel}&locationId=${userProfile?.current_location_id || ''}`,
                { headers: authHeaders }
            );
            if (res.ok) {
                const data = await res.json();
                const newPosts = data.posts || [];
                setPosts(prev => [...prev, ...newPosts]);
                setNextOffset(prev => prev + 50);
                if (newPosts.length < 50) {
                    setHasMore(false);
                }
                // Maintain scroll position after prepending
                setTimeout(() => {
                    if (scrollerRef.current) {
                        const newScrollHeight = scrollerRef.current.scrollHeight;
                        scrollerRef.current.scrollTop = prevScrollTop + (newScrollHeight - prevScrollHeight);
                    }
                }, 50);
            }
        } catch (e) {
            console.error('Failed to fetch more gossip:', e);
        } finally {
            setLoadingMore(false);
        }
    };

    // User post submission
    const handlePostSubmit = async () => {
        if (newPostContent.trim().length === 0 || posting || cooldownTime > 0) return;
        setPosting(true);
        setErrorMsg(null);
        try {
            const authHeaders = await getAuthHeaders();
            const res = await fetch('/api/gossip', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders
                },
                body: JSON.stringify({
                    content: newPostContent,
                    isGlobal: channel === 'global'
                })
            });

            const result = await res.json().catch(() => ({}));
            if (!res.ok) {
                setErrorMsg(result.error || '投稿に失敗しました。');
            } else {
                soundManager?.playSE('se_item_equip');
                localStorage.setItem('last_gossip_post_time', String(Date.now()));
                setNewPostContent('');
                setCooldownTime(10);
                fetchInitialData(true);
            }
        } catch (e: any) {
            setErrorMsg(e.message || '通信エラーが発生しました。');
        } finally {
            setPosting(false);
        }
    };

    // Delete post
    const handleDeletePost = async (postId: string) => {
        if (!window.confirm('この噂話を削除しますか？')) return;
        try {
            soundManager?.playSE('se_click');
            const authHeaders = await getAuthHeaders();
            const res = await fetch(`/api/gossip?postId=${postId}`, {
                method: 'DELETE',
                headers: authHeaders
            });
            if (res.ok) {
                setPosts(prev => prev.filter(p => p.id !== postId));
            } else {
                const err = await res.json().catch(() => ({}));
                alert(err.error || '削除に失敗しました。');
            }
        } catch (e) {
            console.error('Failed to delete post:', e);
            alert('削除中にエラーが発生しました。');
        }
    };

    // Open profile popup
    const handleAvatarClick = async (post: any) => {
        if (post.is_system || !post.user_id) return;
        soundManager?.playSE('se_click');
        try {
            const token = await getAuthToken();
            if (!token) return;
            const res = await fetch(`/api/profile?profileId=${post.user_id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const profileData = await res.json();
                setSimpleProfileUser({
                    name: profileData.name || '名もなき旅人',
                    avatar_url: profileData.avatar_url,
                    epithet: profileData.title_name,
                    introduction: profileData.introduction || '',
                    level: profileData.level,
                    age: (profileData.age || 18) + Math.floor((profileData.accumulated_days || 0) / 365),
                    subscriptionTier: profileData.subscription_tier
                });
            }
        } catch (e) {
            console.error('Failed to fetch user profile:', e);
        }
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const h = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        return `${m}/${day} ${h}:${min}`;
    };

    // UI chronological sorting (oldest at top, newest at bottom)
    const displayedPosts = [...posts].reverse();

    if (!mounted) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200"
            onClick={e => e.target === e.currentTarget && onClose()}
        >
            <style>{`
                .gossip-scrollbar::-webkit-scrollbar {
                    width: 5px;
                }
                .gossip-scrollbar::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 4px;
                }
                .gossip-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(163, 139, 107, 0.4);
                    border-radius: 4px;
                }
                .gossip-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(163, 139, 107, 0.7);
                }
            `}</style>

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/85" onClick={onClose} />

            {/* Panel */}
            <div className="relative z-10 w-full max-w-lg h-[85dvh] max-h-[750px] flex flex-col rounded-2xl overflow-hidden shadow-2xl bg-gray-900 border border-gray-800">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 bg-gray-950/90 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <span className="text-xl">💬</span>
                        <div>
                            <h2 className="text-sm font-black text-gray-100 tracking-wider">
                                街の噂話 (Chat)
                            </h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {channel === 'global' && (
                            <button
                                onClick={handleToggleHideSystem}
                                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all flex items-center gap-1.5 select-none active:scale-95 ${
                                    hideSystemMessages
                                        ? 'bg-purple-950/40 border-purple-500/60 text-purple-300 shadow-[0_0_8px_rgba(168,85,247,0.2)]'
                                        : 'bg-gray-800/40 border-gray-700/60 text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                                }`}
                                title={hideSystemMessages ? 'システム投稿を非表示中' : 'システム投稿を表示中'}
                            >
                                <span className={`w-1.5 h-1.5 rounded-full ${hideSystemMessages ? 'bg-purple-400 animate-pulse' : 'bg-gray-500'}`} />
                                システム非表示
                            </button>
                        )}
                        <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white bg-gray-800/50 rounded-full hover:bg-gray-700 transition-colors active:scale-90">
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex bg-gray-950 border-b border-gray-800 shrink-0">
                    <button
                        onClick={() => {
                            soundManager?.playSE('se_click');
                            setChannel('global');
                        }}
                        className={`flex-1 py-3.5 text-xs font-bold text-center border-b-2 transition-all duration-200 ${
                            channel === 'global'
                                ? 'text-amber-400 border-amber-500 bg-amber-500/5'
                                : 'text-gray-500 border-transparent hover:text-gray-300'
                        }`}
                    >
                        🌐 ワールド
                    </button>
                    <button
                        onClick={() => {
                            soundManager?.playSE('se_click');
                            setChannel('local');
                        }}
                        className={`flex-1 py-3.5 text-xs font-bold text-center border-b-2 transition-all duration-200 ${
                            channel === 'local'
                                ? 'text-amber-400 border-amber-500 bg-amber-500/5'
                                : 'text-gray-500 border-transparent hover:text-gray-300'
                        }`}
                    >
                        🍺 酒場 ({currentLocationName})
                    </button>
                </div>

                {/* Chat Feed Area */}
                <div
                    ref={scrollerRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto gossip-scrollbar px-4 py-4 space-y-3 bg-[#0c0e14]/50 relative"
                >
                    {loadingMore && (
                        <div className="flex items-center justify-center py-2 text-xs text-gray-500 gap-1.5">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                            <span>過去のログを読み込み中...</span>
                        </div>
                    )}

                    {loading ? (
                        <div className="flex flex-col items-center gap-3 py-20 text-gray-500">
                            <Loader2 className="w-7 h-7 animate-spin text-amber-400" />
                            <p className="text-xs italic">噂話を集めています…</p>
                        </div>
                    ) : displayedPosts.length === 0 ? (
                        <div className="text-center py-20">
                            <p className="text-xs text-gray-500 italic">
                                {channel === 'local'
                                    ? `「この酒場は静かだな。最初の噂話を書き込んでみよう。」`
                                    : `「今は大した噂話はないようだ。また後で来てみよう。」`}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {displayedPosts.map((post) => {
                                if (post.is_system) {
                                    return (
                                        <div key={post.id} className="p-3.5 rounded-xl border border-purple-900/40 bg-gradient-to-r from-purple-950/30 to-blue-950/20 space-y-2 flex gap-3 shadow-md">
                                            {/* System Icon/Avatar */}
                                            <div className="w-9 h-9 rounded-full overflow-hidden bg-purple-950 border border-purple-500/40 shrink-0 flex items-center justify-center text-base">
                                                🔮
                                            </div>
                                            {/* Body */}
                                            <div className="flex-1 min-w-0 space-y-1">
                                                <div className="flex items-baseline gap-1.5 flex-wrap">
                                                    <span className="text-[8px] bg-purple-800/80 text-purple-200 font-bold px-1.5 py-0.5 rounded tracking-wide shrink-0">
                                                        観測ログ
                                                    </span>
                                                    <span className="text-xs font-black text-amber-400">
                                                        {post.name}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-200 leading-relaxed font-medium whitespace-pre-wrap break-all">
                                                    {post.content}
                                                </p>
                                                <div className="flex items-center gap-2 text-[9px] text-purple-300/40 pt-0.5">
                                                    {post.location_name && (
                                                        <span className="flex items-center gap-0.5">
                                                            <MapPin size={9} />
                                                            {post.location_name}
                                                        </span>
                                                    )}
                                                    <span>·</span>
                                                    <span className="flex items-center gap-0.5">
                                                        <Clock size={9} />
                                                        {formatDate(post.created_at)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }

                                const tier = post.user_profiles?.subscription_tier || 'free';
                                let frameStyle = "w-9 h-9 rounded-full overflow-hidden bg-gray-800 border border-gray-700/50 cursor-pointer shrink-0";
                                let imgWrapperStyle = "w-full h-full";
                                
                                if (tier === 'premium') {
                                    frameStyle = "w-9 h-9 rounded-full overflow-hidden bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 p-[1.5px] cursor-pointer shrink-0 shadow-md shadow-yellow-500/10";
                                    imgWrapperStyle = "w-full h-full rounded-full overflow-hidden bg-gray-800";
                                } else if (tier === 'basic') {
                                    frameStyle = "w-9 h-9 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500 p-[1.5px] cursor-pointer shrink-0 shadow-md shadow-blue-500/10";
                                    imgWrapperStyle = "w-full h-full rounded-full overflow-hidden bg-gray-800";
                                }

                                return (
                                    <div key={post.id} className={`p-3.5 rounded-xl border space-y-2 flex gap-3 hover:border-gray-700/50 transition-colors ${
                                        userProfile && post.user_id === userProfile.id
                                            ? 'border-amber-500/30 bg-amber-950/10'
                                            : 'border-gray-800 bg-gray-950/30'
                                    }`}>
                                        {/* Avatar */}
                                        <div onClick={() => handleAvatarClick(post)} className={frameStyle}>
                                            <div className={imgWrapperStyle}>
                                                <img src={post.avatar_url || '/avatars/adventurer.jpg'} alt={post.name} className="w-full h-full object-cover" />
                                            </div>
                                        </div>
                                        {/* Body */}
                                        <div className="flex-1 min-w-0 space-y-1">
                                            <div className="flex items-center justify-between gap-1.5">
                                                <div className="flex items-baseline gap-1.5 flex-wrap min-w-0">
                                                    {post.epithet && (
                                                        <span className="text-[9px] text-[#a38b6b] font-bold tracking-wider truncate">
                                                            [{post.epithet}]
                                                        </span>
                                                    )}
                                                    <span
                                                        onClick={() => handleAvatarClick(post)}
                                                        className="text-xs font-black text-gray-200 truncate cursor-pointer hover:underline"
                                                    >
                                                        {post.name}
                                                    </span>
                                                </div>
                                                {/* Delete Button */}
                                                {userProfile && post.user_id === userProfile.id && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeletePost(post.id);
                                                        }}
                                                        className="text-gray-500 hover:text-red-400 transition-colors p-1 shrink-0"
                                                        title="削除する"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap break-all">
                                                {post.content}
                                            </p>
                                            <div className="flex items-center gap-2 text-[9px] text-gray-500 pt-0.5">
                                                {post.location_name && (
                                                    <span className="flex items-center gap-0.5">
                                                        <MapPin size={9} />
                                                        {post.location_name}
                                                    </span>
                                                )}
                                                <span>·</span>
                                                <span className="flex items-center gap-0.5">
                                                    <Clock size={9} />
                                                    {formatDate(post.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Input Bar */}
                <div className="p-3 border-t border-gray-800 bg-gray-950/95 flex flex-col gap-2 shrink-0">
                    {errorMsg && (
                        <div className="text-[10px] text-red-400 font-bold bg-red-950/20 border border-red-500/20 px-2.5 py-1.5 rounded-lg">
                            {errorMsg}
                        </div>
                    )}
                    <div className="flex gap-2 items-center">
                        <input
                            type="text"
                            value={newPostContent}
                            onChange={(e) => {
                                setNewPostContent(e.target.value.slice(0, 140));
                                setErrorMsg(null);
                            }}
                            disabled={posting}
                            placeholder={cooldownTime > 0 ? `連続投稿制限: あと ${cooldownTime}秒` : `${channel === 'global' ? 'ワールド' : '酒場'}に噂話を書き込む...`}
                            className="flex-1 px-3.5 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-amber-500/50 resize-none disabled:opacity-50"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handlePostSubmit();
                                }
                            }}
                        />
                        <button
                            onClick={handlePostSubmit}
                            disabled={posting || newPostContent.trim().length === 0 || cooldownTime > 0}
                            className="p-2.5 bg-gradient-to-r from-amber-500 to-[#a38b6b] text-gray-950 rounded-xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none shrink-0"
                            title="送信する"
                        >
                            <Send size={14} className="transform rotate-0" />
                        </button>
                    </div>
                    <div className="flex justify-between text-[8px] text-gray-600 px-1">
                        <span>{cooldownTime > 0 ? `再投稿制限中 (${cooldownTime}s)` : 'Enterキーで送信'}</span>
                        <span className={newPostContent.length >= 130 ? 'text-red-500 font-bold animate-pulse' : ''}>
                            {newPostContent.length} / 140
                        </span>
                    </div>
                </div>
            </div>

            {/* Simple User Profile Popup */}
            {simpleProfileUser && (
                <SimpleUserProfilePopup
                    isOpen={!!simpleProfileUser}
                    onClose={() => setSimpleProfileUser(null)}
                    avatarUrl={simpleProfileUser.avatar_url}
                    name={simpleProfileUser.name}
                    epithet={simpleProfileUser.epithet}
                    introduction={simpleProfileUser.introduction}
                    level={simpleProfileUser.level}
                    age={simpleProfileUser.age}
                    subscriptionTier={simpleProfileUser.subscriptionTier}
                />
            )}
        </div>,
        document.body
    );
}
