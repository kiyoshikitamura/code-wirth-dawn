'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, MapPin, Clock, Loader2, Trash2 } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { soundManager } from '@/lib/soundManager';
import SimpleUserProfilePopup from '@/components/shared/SimpleUserProfilePopup';
import { getAuthHeaders, getAuthToken } from '@/lib/authToken';

interface Props {
    onClose: () => void;
    onOpenTavern?: () => void; // Keep for compatibility
}

export default function GossipModal({ onClose }: Props) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    const { userProfile } = useGameStore();
    const [pinnedSystemPost, setPinnedSystemPost] = useState<any | null>(null);
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [nextOffset, setNextOffset] = useState(30);

    const [showPostModal, setShowPostModal] = useState(false);
    const [newPostContent, setNewPostContent] = useState('');
    const [posting, setPosting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [cooldownTime, setCooldownTime] = useState(0);
    const [simpleProfileUser, setSimpleProfileUser] = useState<any | null>(null);

    const scrollerRef = useRef<HTMLDivElement>(null);

    // Pull-to-refresh states & handlers
    const [pullDistance, setPullDistance] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const touchStartY = useRef(0);
    const isAtTopRef = useRef(false);
    const lastFetchTimeRef = useRef<number>(0);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (!scrollerRef.current || refreshing || loading) return;
        isAtTopRef.current = scrollerRef.current.scrollTop === 0;
        touchStartY.current = e.touches[0].pageY;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!scrollerRef.current || !isAtTopRef.current || refreshing || loading) return;
        const currentY = e.touches[0].pageY;
        const diffY = currentY - touchStartY.current;

        if (diffY > 0) {
            if (e.cancelable) e.preventDefault();
            const resistance = 0.45;
            setPullDistance(Math.min(diffY * resistance, 80));
        }
    };

    const handleTouchEnd = async () => {
        if (!isAtTopRef.current || refreshing || loading) {
            setPullDistance(0);
            return;
        }
        if (pullDistance > 45) {
            setRefreshing(true);
            setPullDistance(45);
            soundManager?.playSE('se_click');
            await fetchInitialData(true);
            setRefreshing(false);
        }
        setPullDistance(0);
    };

    // Initial fetch / Reload
    const fetchInitialData = async (isRefresh = false) => {
        if (isRefresh) {
            const now = Date.now();
            if (now - lastFetchTimeRef.current < 3000) {
                // Throttle pull-to-refresh if triggered within 3s of last fetch
                await new Promise(resolve => setTimeout(resolve, 650));
                return;
            }
        }

        if (!isRefresh) setLoading(true);
        try {
            const authHeaders = await getAuthHeaders();
            const res = await fetch(`/api/gossip?limit=30&offset=0`, {
                headers: authHeaders
            });
            if (res.ok) {
                const data = await res.json();
                setPinnedSystemPost(data.pinned_system_post);
                setPosts(data.posts || []);
                setNextOffset(30);
                if ((data.posts || []).length < 30) {
                    setHasMore(false);
                } else {
                    setHasMore(true);
                }
                lastFetchTimeRef.current = Date.now();
            }
        } catch (e) {
            console.error('Failed to fetch initial gossip:', e);
        } finally {
            if (!isRefresh) setLoading(false);
        }
    };

    useEffect(() => {
        soundManager?.playSE('se_modal_open');
        fetchInitialData();
    }, []);

    // Cooldown timer logic
    useEffect(() => {
        if (!showPostModal) return;
        const lastPost = localStorage.getItem('last_gossip_post_time');
        if (lastPost) {
            const elapsed = (Date.now() - Number(lastPost)) / 1000;
            if (elapsed < 10) {
                setCooldownTime(Math.ceil(10 - elapsed));
            }
        }
    }, [showPostModal]);

    useEffect(() => {
        if (cooldownTime <= 0) return;
        const timer = setTimeout(() => {
            setCooldownTime(prev => prev - 1);
        }, 1000);
        return () => clearTimeout(timer);
    }, [cooldownTime]);

    // Load more (Infinite scroll)
    const handleScroll = () => {
        if (!scrollerRef.current || loading || loadingMore || !hasMore) return;
        const target = scrollerRef.current;
        if (target.scrollHeight - target.scrollTop <= target.clientHeight + 50) {
            fetchMoreData();
        }
    };

    const fetchMoreData = async () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        try {
            const authHeaders = await getAuthHeaders();
            const res = await fetch(`/api/gossip?limit=30&offset=${nextOffset}`, {
                headers: authHeaders
            });
            if (res.ok) {
                const data = await res.json();
                const newPosts = data.posts || [];
                setPosts(prev => [...prev, ...newPosts]);
                setNextOffset(prev => prev + 30);
                if (newPosts.length < 30) {
                    setHasMore(false);
                }
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
            soundManager?.playSE('se_click');
            const authHeaders = await getAuthHeaders();
            const res = await fetch('/api/gossip', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders
                },
                body: JSON.stringify({ content: newPostContent })
            });

            const result = await res.json().catch(() => ({}));
            if (!res.ok) {
                setErrorMsg(result.error || '投稿に失敗しました。');
            } else {
                soundManager?.playSE('se_item_equip');
                localStorage.setItem('last_gossip_post_time', String(Date.now()));
                setNewPostContent('');
                setShowPostModal(false);
                fetchInitialData();
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
                soundManager?.playSE('se_click');
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

    // Open profile popup on click
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
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const h = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        return `${y}/${m}/${day} ${h}:${min}`;
    };

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
                    background: rgba(163, 139, 107, 0.5);
                    border-radius: 4px;
                }
                .gossip-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(163, 139, 107, 0.8);
                }
            `}</style>

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/85" onClick={onClose} />

            {/* Panel */}
            <div className="relative z-10 w-full max-w-lg h-[80dvh] max-h-[700px] flex flex-col rounded-2xl overflow-hidden shadow-2xl bg-gray-900 border border-gray-800">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 bg-gray-950/80 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <span className="text-xl">📰</span>
                        <div>
                            <h2 className="text-sm font-black text-gray-100 tracking-wider flex items-center gap-2">
                                街の噂話
                                <span className="text-[9px] text-gray-500 font-normal">Town Gossip BBS</span>
                            </h2>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white bg-gray-800/50 rounded-full hover:bg-gray-700 transition-colors active:scale-90">
                        <X size={16} />
                    </button>
                </div>

                {/* Main Content Area */}
                <div 
                    ref={scrollerRef}
                    onScroll={handleScroll}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    className="flex-1 overflow-y-auto gossip-scrollbar px-4 py-4 space-y-3 bg-[#0c0e14]/50 relative"
                >
                    {/* Pull to Refresh Indicator */}
                    {(pullDistance > 0 || refreshing) && (
                        <div 
                            className="overflow-hidden transition-all duration-150 flex items-center justify-center text-xs text-amber-500 font-bold bg-[#0d0f17]/60 rounded-xl border border-gray-800/40 shadow-inner select-none shrink-0"
                            style={{ height: `${Math.max(pullDistance, refreshing ? 45 : 0)}px` }}
                        >
                            <div className="flex items-center gap-2 py-2">
                                <Loader2 className={`w-4 h-4 text-amber-400 ${refreshing || pullDistance > 45 ? 'animate-spin' : ''}`} />
                                <span className="tracking-wide">{refreshing ? '噂話を更新中...' : pullDistance > 45 ? '離して更新' : '下にスワイプして更新'}</span>
                            </div>
                        </div>
                    )}
                    {/* Pinned system post at the very top */}
                    {pinnedSystemPost && (
                        <div className="p-4 rounded-xl border border-[#a38b6b]/40 bg-gradient-to-r from-purple-950/40 to-blue-950/40 space-y-2 flex gap-3 shadow-lg shadow-purple-950/20">
                            {/* Avatar */}
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-purple-900 border border-purple-500/50 shrink-0">
                                <img src={pinnedSystemPost.avatar_url || '/images/icons/observer_gem.png'} alt={pinnedSystemPost.name} className="w-full h-full object-cover" />
                            </div>
                            {/* Body */}
                            <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-baseline gap-1.5 flex-wrap">
                                    <span className="text-[9px] bg-purple-800/80 text-purple-200 font-bold px-1.5 py-0.5 rounded tracking-wide shrink-0">
                                        最新の噂
                                    </span>
                                    <span className="text-xs font-black text-amber-300">
                                        {pinnedSystemPost.name}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-200 leading-relaxed font-medium whitespace-pre-wrap break-all">
                                    {pinnedSystemPost.content}
                                </p>
                                <div className="flex items-center gap-2 text-[9px] text-purple-300/60 pt-1">
                                    {pinnedSystemPost.location_name && (
                                        <span className="flex items-center gap-0.5">
                                            <MapPin size={10} />
                                            {pinnedSystemPost.location_name}
                                        </span>
                                    )}
                                    <span>·</span>
                                    <span className="flex items-center gap-0.5">
                                        <Clock size={10} />
                                        {formatDate(pinnedSystemPost.created_at)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Spacer/Divider if pinned exists */}
                    {pinnedSystemPost && posts.length > 0 && (
                        <div className="h-[1px] bg-gray-800/80 mx-2 my-4" />
                    )}

                    {/* Gossip timeline */}
                    {loading ? (
                        <div className="flex flex-col items-center gap-3 py-16 text-gray-500">
                            <Loader2 className="w-7 h-7 animate-spin text-amber-400" />
                            <p className="text-xs italic">噂話を集めています…</p>
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="text-center py-20">
                            <p className="text-xs text-gray-500 italic">「今は大した噂話はないようだ。また後で来てみよう。」</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {posts.map((post) => (
                                <div key={post.id} className="p-4 rounded-xl border border-gray-800 bg-gray-950/40 space-y-2 flex gap-3 hover:border-gray-700/60 transition-colors">
                                    {/* Avatar */}
                                    {(() => {
                                        const tier = post.user_profiles?.subscription_tier || 'free';
                                        let frameStyle = "w-10 h-10 rounded-full overflow-hidden bg-gray-800 border border-gray-700/50 cursor-pointer shrink-0";
                                        let imgWrapperStyle = "w-full h-full";
                                        if (post.is_system) {
                                            frameStyle = "w-10 h-10 rounded-full overflow-hidden bg-gray-800 border border-purple-500/50 shrink-0";
                                        } else if (tier === 'premium') {
                                            frameStyle = "w-10 h-10 rounded-full overflow-hidden bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 p-[1.5px] cursor-pointer shrink-0 shadow-md shadow-yellow-500/10";
                                            imgWrapperStyle = "w-full h-full rounded-full overflow-hidden bg-gray-800";
                                        } else if (tier === 'basic') {
                                            frameStyle = "w-10 h-10 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500 p-[1.5px] cursor-pointer shrink-0 shadow-md shadow-blue-500/10";
                                            imgWrapperStyle = "w-full h-full rounded-full overflow-hidden bg-gray-800";
                                        }
                                        return (
                                            <div onClick={() => handleAvatarClick(post)} className={frameStyle}>
                                                <div className={imgWrapperStyle}>
                                                    <img src={post.avatar_url || '/avatars/adventurer.jpg'} alt={post.name} className="w-full h-full object-cover" />
                                                </div>
                                            </div>
                                        );
                                    })()}
                                    {/* Body */}
                                    <div className="flex-1 min-w-0 space-y-1">
                                        <div className="flex items-center justify-between gap-1.5">
                                            <div className="flex items-baseline gap-1.5 flex-wrap min-w-0">
                                                {post.epithet && (
                                                    <span className="text-[10px] text-[#a38b6b] font-bold tracking-wider truncate">
                                                        [{post.epithet}]
                                                    </span>
                                                )}
                                                <span 
                                                    onClick={() => handleAvatarClick(post)}
                                                    className={`text-xs font-black text-gray-200 truncate ${post.is_system ? '' : 'cursor-pointer hover:underline'}`}
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
                                        <div className="flex items-center gap-2 text-[9px] text-gray-500 pt-1">
                                            {post.location_name && (
                                                <span className="flex items-center gap-0.5">
                                                    <MapPin size={10} />
                                                    {post.location_name}
                                                </span>
                                            )}
                                            <span>·</span>
                                            <span className="flex items-center gap-0.5">
                                                <Clock size={10} />
                                                {formatDate(post.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Infinite scroll loader */}
                    {loadingMore && (
                        <div className="flex items-center justify-center py-4">
                            <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                        </div>
                    )}
                </div>

                {/* FAB */}
                <button
                    onClick={() => {
                        const lastPost = localStorage.getItem('last_gossip_post_time');
                        if (lastPost) {
                            const elapsed = (Date.now() - Number(lastPost)) / 1000;
                            if (elapsed < 10) {
                                soundManager?.playSE('se_click');
                                alert('連続投稿は禁止となります');
                                return;
                            }
                        }
                        soundManager?.playSE('se_click');
                        setShowPostModal(true);
                    }}
                    className="absolute bottom-5 right-5 w-14 h-14 rounded-full bg-gradient-to-r from-amber-500 to-[#a38b6b] text-gray-950 font-black flex items-center justify-center shadow-lg hover:shadow-amber-500/20 active:scale-95 transition-all z-20 select-none cursor-pointer touch-manipulation"
                >
                    <Plus size={28} />
                </button>

                {/* Post Submit Modal Overlay */}
                {showPostModal && (
                    <div className="absolute inset-0 bg-black/90 z-30 flex flex-col justify-center p-6 animate-in fade-in duration-200">
                        <div className="bg-[#111625] border border-[#a38b6b]/40 rounded-xl p-5 space-y-4 shadow-2xl relative">
                            <h3 className="text-sm font-black text-amber-400 tracking-wider">街の噂話に書き込む</h3>
                            
                            <div className="space-y-1">
                                <textarea
                                    value={newPostContent}
                                    onChange={(e) => setNewPostContent(e.target.value.slice(0, 140))}
                                    disabled={posting || cooldownTime > 0}
                                    placeholder={cooldownTime > 0 ? `連続投稿は制限されています。あと ${cooldownTime}秒 お待ちください。` : "街で見聞きしたことや、噂話を広めよう…（140文字以内）"}
                                    className="w-full h-32 p-3 bg-gray-950 border border-gray-800 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-amber-500/50 resize-none disabled:opacity-50"
                                />
                                <div className="flex justify-between text-[10px] text-gray-500">
                                    {cooldownTime > 0 ? (
                                        <span className="text-amber-500 font-bold">再投稿制限: あと {cooldownTime}秒</span>
                                    ) : (
                                        <span />
                                    )}
                                    <span className={newPostContent.length >= 130 ? 'text-red-500 font-bold' : ''}>
                                        {newPostContent.length} / 140
                                    </span>
                                </div>
                            </div>

                            {errorMsg && (
                                <div className="text-[11px] text-red-500 font-bold bg-red-950/20 border border-red-500/30 p-2.5 rounded-lg">
                                    {errorMsg}
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-3">
                                <button
                                    onClick={() => {
                                        soundManager?.playSE('se_click');
                                        setShowPostModal(false);
                                        setNewPostContent('');
                                        setErrorMsg(null);
                                    }}
                                    disabled={posting}
                                    className="px-4 py-2 border border-gray-700 hover:bg-gray-800 text-xs font-bold text-gray-400 hover:text-white rounded-lg transition-all active:scale-[0.98] disabled:opacity-50"
                                >
                                    キャンセル
                                </button>
                                <button
                                    onClick={handlePostSubmit}
                                    disabled={posting || newPostContent.trim().length === 0 || cooldownTime > 0}
                                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-[#a38b6b] text-gray-950 text-xs font-bold rounded-lg hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none"
                                >
                                    {posting ? '投稿中...' : '噂話を広める'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
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
