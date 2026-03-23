import React, { useState, useEffect } from 'react';
import { UserProfile, PartyMember } from '@/types/game';
import { X, UserPlus, Shield, Sword, Heart, Coins, RefreshCw, Flag, Sparkles } from 'lucide-react';
import { ShadowSummary } from '@/services/shadowService';
import { supabase } from '@/lib/supabase';

interface TavernModalProps {
    isOpen: boolean;
    onClose: () => void;
    userProfile: UserProfile;
    locationId: string;
    reputationScore?: number;
}

export default function TavernModal({ isOpen, onClose, userProfile, locationId, reputationScore = 0 }: TavernModalProps) {
    const [activeTab, setActiveTab] = useState<'hire' | 'register'>('hire');
    const [shadows, setShadows] = useState<ShadowSummary[]>([]);
    const [currentParty, setCurrentParty] = useState<PartyMember[]>([]);
    const [loading, setLoading] = useState(false);
    const [hireStatus, setHireStatus] = useState<string | null>(null);
    const [reportTarget, setReportTarget] = useState<ShadowSummary | null>(null);
    const [reportReason, setReportReason] = useState('');
    const [reportStatus, setReportStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
    const [selectedShadow, setSelectedShadow] = useState<ShadowSummary | null>(null); // NPC詳細ポップアップ用

    useEffect(() => {
        if (isOpen) {
            fetchPartyData();
            if (activeTab === 'hire') {
                fetchShadows();
            }
        }
    }, [isOpen, activeTab, locationId]);

    // job_class を日本語に変換するマップ
    const JOB_CLASS_JP: Record<string, string> = {
        Warrior: '戦士', Fighter: '格闘家', Knight: '騎士', Paladin: '聖騎士',
        Ranger: '狩人', Scout: '斥候', Archer: '弓使い', Thief: '盗賊', Rogue: '遊撃士',
        Mage: '魔法使い', Wizard: '魔術師', Sorcerer: '術師', Warlock: '呪術師',
        Cleric: '僧侶', Priest: '神官', Druid: 'ドルイド', Shaman: '呪術師',
        Bard: '吟遊詩人', Merchant: '商人', Alchemist: '錬金術師', Scholar: '学者',
        Adventurer: '冒険者', Assassin: '暗殺者', Monk: '修道士', Necromancer: '死霊術師',
    };
    const toJpJobClass = (jc: string) => JOB_CLASS_JP[jc] || jc;

    const fetchPartyData = async () => {
        try {
            const res = await fetch(`/api/party/list?owner_id=${userProfile.id}`);
            const data = await res.json();
            if (data.party) {
                setCurrentParty(data.party);
            }
        } catch (e) {
            console.error("Failed to fetch party data", e);
        }
    };

    const fetchShadows = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/tavern/list?location_id=${locationId}&user_id=${userProfile.id}`);
            const data = await res.json();
            if (data.shadows) {
                setShadows(data.shadows);
            }
        } catch (e) {
            console.error("Failed to fetch shadows", e);
        } finally {
            setLoading(false);
        }
    };

    const handleHire = async (shadow: ShadowSummary) => {
        if (currentParty.length >= 4) {
            alert('パーティメンバーが上限（4人）に達しています。誰かと別れてから雇用してください。');
            return;
        }

        if (userProfile.gold < shadow.contract_fee) {
            alert('ゴールドが足りません！');
            return;
        }

        if (!confirm(`${shadow.name} を ${shadow.contract_fee}G で雇用しますか？`)) return;

        setHireStatus('雇用処理中...');
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch('/api/tavern/hire', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
                },
                body: JSON.stringify({ user_id: userProfile.id, shadow })
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
                alert(`雇用に失敗しました: ${errData.error || '不明なエラー'}`);
                setHireStatus(null);
                return;
            }

            const data = await res.json();
            if (data.success) {
                setHireStatus('雇用完了！パーティ情報を更新中...');
                setLoading(true);
                await Promise.all([fetchPartyData(), fetchShadows()]);
                setLoading(false);
                alert('雇用契約が成立しました！');
            } else {
                alert(`エラー: ${data.error || '不明なエラー'}`);
            }
        } catch (e) {
            alert('通信エラーが発生しました');
        } finally {
            setHireStatus(null);
        }
    };

    const handleReport = async () => {
        if (!reportTarget || !reportReason) return;
        setReportStatus('sending');
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            const res = await fetch('/api/report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                    'x-user-id': userProfile.id,
                },
                body: JSON.stringify({
                    reported_user_id: reportTarget.profile_id,
                    target_url: reportTarget.icon_url || reportTarget.image_url || '',
                    reason: reportReason,
                }),
            });
            setReportStatus(res.ok ? 'done' : 'error');
        } catch {
            setReportStatus('error');
        }
    };

    const closeReportModal = () => {
        setReportTarget(null);
        setReportReason('');
        setReportStatus('idle');
    };

    // Helper to render PartyMember as Shadow Card (Unified Look)
    const renderPartyMemberCard = (member: PartyMember) => (
        <div key={`party-${member.id}`} className="relative p-4 border border-blue-900/50 bg-blue-950/20 group">
            <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] px-2 py-0.5 font-bold">同行中</div>

            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-900/30 overflow-hidden border border-blue-900/50 flex shrink-0 items-center justify-center">
                        {member.icon_url || member.image_url ? (
                            <img src={member.icon_url || member.image_url} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-blue-500 font-bold">{member.name[0]}</span>
                        )}
                    </div>
                    <div>
                        <div className="text-lg font-bold text-blue-200">{member.name}</div>
                        <div className="text-xs text-blue-400">{toJpJobClass(member.job_class)}</div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-gray-500 font-mono font-bold">--- G</div>
                    <div className="text-[10px] text-gray-600">契約済</div>
                </div>
            </div>

            <div className="flex gap-4 mb-4 text-xs font-mono text-gray-400">
                <div className="flex items-center gap-1"><Shield size={12} /> ??</div>
                <div className="flex items-center gap-1"><Heart size={12} /> {member.durability}</div>
            </div>

            <button
                disabled
                className="w-full py-2 flex items-center justify-center gap-2 border border-blue-900/30 text-blue-500/50 cursor-not-allowed bg-black/20"
            >
                <UserPlus size={16} />
                パーティ加入中
            </button>
        </div>
    );

    const isEmbargoed = reputationScore < 0;

    if (!isOpen) return null;

    return (
        <>
        <div className="fixed inset-0 z-[60] flex justify-center items-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-[#1a0f0a] border border-[#5c3a21] rounded shadow-2xl max-w-4xl w-full h-[85vh] flex flex-col relative overflow-hidden">
                {/* Header */}
                <div className="bg-[#2c1a0f] border-b border-[#5c3a21] p-4 flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="bg-[#1a0f0a] p-2 rounded-full border border-[#5c3a21]">
                            <svg className="w-6 h-6 text-[#d4a373]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-serif font-bold text-[#e6ccb2]">酒場</h2>
                            <div className="text-xs text-[#d4a373] mt-0.5">冒険者の集う喧騒の場所</div>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-[#d4a373] hover:text-white transition-colors bg-black/20 p-2 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {isEmbargoed ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[url('/effects/dirt.png')] bg-cover mix-blend-luminosity relative z-10">
                        <div className="absolute inset-0 bg-red-950/40 mix-blend-multiply z-0 pointer-events-none"></div>
                        <div className="relative z-10 w-48 h-48 border-4 border-red-900 rounded-full overflow-hidden mb-6 shadow-[0_0_30px_rgba(200,0,0,0.5)]">
                            <img src="/avatars/angry_barkeep.jpg" alt="Angry Barkeep" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = '/avatars/inn_master.png'; }} />
                        </div>
                        <h2 className="text-4xl font-serif text-red-500 font-bold mb-4 tracking-widest drop-shadow-lg">出入り禁止</h2>
                        <div className="bg-black/80 border border-red-900/50 p-6 rounded-lg max-w-lg">
                            <p className="text-red-300 font-serif italic text-lg leading-relaxed">
                                「お前のような悪党に飲ませる酒も、紹介する仲間もねえ。さっさと俺の店から出て行きな！」
                            </p>
                        </div>
                    </div>
                ) : (
                    // Regular Tavern Content
                    <>
                        {/* 通報モーダル */}
                        {reportTarget && (
                            <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4">
                                <div className="bg-[#1a202c] border-2 border-red-800/60 max-w-sm w-full p-6 shadow-2xl">
                                    <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
                                        <Flag size={18} /> 不適切な画像を通報
                                    </h3>
                                    {reportStatus === 'done' ? (
                                        <div className="text-green-400 text-center py-4">
                                            <p className="font-bold mb-2">通報を受け付けました。</p>
                                            <p className="text-sm text-gray-400">運営が確認後、適切な対応を行います。</p>
                                            <button onClick={closeReportModal} className="mt-4 px-4 py-2 bg-gray-700 text-white text-sm rounded hover:bg-gray-600">閉じる</button>
                                        </div>
                                    ) : reportStatus === 'error' ? (
                                        <div className="text-red-400 text-center py-4">
                                            <p>通報に失敗しました。もう一度お試しください。</p>
                                            <button onClick={closeReportModal} className="mt-4 px-4 py-2 bg-gray-700 text-white text-sm rounded hover:bg-gray-600">閉じる</button>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-gray-400 text-sm mb-4">
                                                <span className="font-bold text-white">{reportTarget.name}</span> のアイコン画像を通報します。
                                            </p>
                                            <div className="space-y-2 mb-4">
                                                {['不適切な画像', '公序良俗に反する', 'その他'].map(reason => (
                                                    <label key={reason} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-white/5">
                                                        <input
                                                            type="radio"
                                                            name="report-reason"
                                                            value={reason}
                                                            checked={reportReason === reason}
                                                            onChange={e => setReportReason(e.target.value)}
                                                            className="accent-red-500"
                                                        />
                                                        <span className="text-sm text-gray-300">{reason}</span>
                                                    </label>
                                                ))}
                                            </div>
                                            <div className="flex gap-3">
                                                <button onClick={closeReportModal} className="flex-1 py-2 border border-gray-600 text-gray-400 hover:text-white text-sm transition-colors">
                                                    キャンセル
                                                </button>
                                                <button
                                                    onClick={handleReport}
                                                    disabled={!reportReason || reportStatus === 'sending'}
                                                    className="flex-1 py-2 bg-red-800/50 border border-red-700 text-red-300 hover:bg-red-700/50 text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {reportStatus === 'sending' ? '送信中...' : '通報する'}
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                        {/* Tabs & Refresh */}
                        <div className="flex border-b border-[#a38b6b]/20 bg-[#0d1117]/50">
                            <button
                                onClick={() => setActiveTab('hire')}
                                className={`flex-1 p-3 text-center transition-colors font-bold tracking-wider whitespace-nowrap text-sm ${activeTab === 'hire' ? 'bg-[#a38b6b]/20 text-[#e3d5b8] border-b-2 border-[#a38b6b]' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                傭兵を雇う
                            </button>
                        <button
                            onClick={() => setActiveTab('register')}
                            className={`flex-1 p-3 text-center transition-colors font-bold tracking-wider text-sm whitespace-nowrap ${activeTab === 'register' ? 'bg-[#a38b6b]/20 text-[#e3d5b8] border-b-2 border-[#a38b6b]' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            影の登録（準備中）
                        </button>

                            {activeTab === 'hire' && (
                                <button
                                    onClick={fetchShadows}
                                    disabled={loading}
                                    className="px-4 py-2 flex items-center gap-2 text-[#a38b6b] hover:text-[#e3d5b8] hover:bg-[#a38b6b]/20 transition-colors border-l border-[#a38b6b]/20 ml-auto"
                                >
                                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                                    <span className="text-sm font-bold">酒場を見渡す</span>
                                </button>
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 bg-[url('/textures/parchment-dark.jpg')] bg-cover">
                            {activeTab === 'hire' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Current Party Section */}
                                    {currentParty.length > 0 && (
                                        <>
                                            <div className="col-span-1 md:col-span-2 text-[#e3d5b8] font-serif border-b border-[#a38b6b]/30 pb-1 mb-2 mt-2">
                                                現在のパーティ ({currentParty.length}/4)
                                            </div>
                                            {currentParty.map(member => renderPartyMemberCard(member))}

                                            <div className="col-span-1 md:col-span-2 text-[#e3d5b8] font-serif border-b border-[#a38b6b]/30 pb-1 mb-2 mt-4">
                                                酒場にいる冒険者たち
                                            </div>
                                        </>
                                    )}

                                    {loading && <div className="text-center text-gray-400 col-span-2">酒場を見回しています...</div>}

                                    {!loading && shadows.length === 0 && (
                                        <div className="text-center text-gray-500 col-span-2 py-10">
                                            <p>ここには誰もいないようだ...</p>
                                            <p className="text-sm mt-2">他のプレイヤーがこの地を訪れるのを待ちましょう。</p>
                                        </div>
                                    )}

                                    {currentParty.length >= 4 && shadows.length > 0 && (
                                        <div className="col-span-2 bg-red-900/20 border border-red-900 text-red-400 p-2 text-center text-xs mb-2">
                                            パーティメンバーが上限（4人）に達しています。誰かと別れてから雇用してください。
                                        </div>
                                    )}

                                    {shadows.map((shadow, idx) => {
                                        const isHeroic = shadow.level >= 20;

                                        return (
                                        <div key={idx} className={`relative overflow-hidden p-4 border transition-all duration-300 hover:bg-black/40 group ${
                                            isHeroic 
                                            ? 'ring-2 ring-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)] bg-gradient-to-b from-slate-900 to-amber-950/30' 
                                            : shadow.subscription_tier === 'premium' 
                                                ? 'border-yellow-500/50 bg-yellow-900/10' 
                                                : shadow.subscription_tier === 'basic' 
                                                    ? 'border-blue-500/30 bg-blue-900/5' 
                                                    : 'border-gray-700 bg-black/20'
                                        }`}>
                                            {/* Badges */}
                                            {isHeroic && (
                                                <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-600 to-yellow-400 text-[10px] font-bold text-slate-950 px-2 py-0.5 rounded-bl-lg z-10 shadow-md flex items-center gap-1">
                                                    <Sparkles size={10} /> HERO
                                                </div>
                                            )}
                                            {/* Particle Effect for Heroic */}
                                            {isHeroic && (
                                                <div className="absolute inset-0 pointer-events-none mix-blend-screen opacity-30 z-0">
                                                    <div className="w-[200%] h-[200%] bg-[url('/textures/dust-particles.png')] animate-[slide_10s_linear_infinite] opacity-50"></div>
                                                </div>
                                            )}

                                            {!isHeroic && shadow.subscription_tier === 'premium' && (
                                                <div className="absolute top-0 right-0 bg-yellow-600 text-black text-[10px] px-2 py-0.5 font-bold z-10">伝説</div>
                                            )}
                                            {!isHeroic && shadow.subscription_tier === 'basic' && shadow.origin_type !== 'system_mercenary' && (
                                                <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] px-2 py-0.5 font-bold z-10">傑出</div>
                                            )}
                                            {!isHeroic && shadow.origin_type === 'system_mercenary' && (
                                                <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] px-2 py-0.5 font-bold z-10">公式</div>
                                            )}

                                            <div className="flex justify-between items-start mb-2 relative z-10">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden border border-gray-600 flex shrink-0 items-center justify-center">
                                                        {shadow.icon_url || shadow.image_url ? (
                                                            <img src={shadow.icon_url || shadow.image_url} alt={shadow.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-gray-500 font-bold">{shadow.name[0]}</span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="text-lg font-bold text-[#e3d5b8]">{shadow.name}</div>
                                                        <div className="text-xs text-gray-400">Lv.{shadow.level} {toJpJobClass(shadow.job_class)}</div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <div className="text-yellow-400 font-mono font-bold">{shadow.contract_fee} G</div>
                                                    <div className="text-xs text-gray-500">契約金</div>
                                                    {/* 通報ボタン */}
                                                    {(shadow.icon_url || shadow.image_url) && shadow.origin_type !== 'system_mercenary' && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setReportTarget(shadow); }}
                                                            className="text-gray-600 hover:text-red-400 transition-colors mt-1"
                                                            title="アイコン画像を通報する"
                                                        >
                                                            <Flag size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex gap-4 mb-4 text-xs font-mono text-gray-300">
                                                <div className="flex items-center gap-1"><Sword size={12} /> {shadow.stats.atk}</div>
                                                <div className="flex items-center gap-1"><Shield size={12} /> {shadow.stats.def}</div>
                                                <div className="flex items-center gap-1"><Heart size={12} /> {shadow.stats.hp}</div>
                                            </div>

                                            {/* Deck Preview */}
                                            {shadow.signature_deck_preview.length > 0 && (
                                                <div className="mb-4">
                                                    <div className="text-[10px] text-gray-500 mb-1">所持スキル</div>
                                                    <div className="flex gap-1 flex-wrap">
                                                        {shadow.signature_deck_preview.map((card, i) => (
                                                            <span key={i} className="px-1.5 py-0.5 bg-gray-800 text-gray-300 text-[10px] rounded border border-gray-600">
                                                                {card}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <button
                                                onClick={() => setSelectedShadow(shadow)}
                                                className="w-full py-2 flex items-center justify-center gap-2 border border-[#a38b6b] text-[#a38b6b] hover:bg-[#a38b6b]/20 transition-colors font-bold text-sm whitespace-nowrap"
                                            >
                                                <UserPlus size={16} />
                                                詳細を見る
                                            </button>
                                        </div>
                                    );
                                    })}
                                </div>
                            )}

                            {activeTab === 'register' && (
                                <div className="text-center text-gray-400 py-20">
                                    <h3 className="text-xl mb-4">影の登録</h3>
                                    <p>自分の写し身を酒場に登録し、不労所得を得ることができます。</p>
                                    <p className="text-sm mt-4 text-yellow-600">※ この機能は開発中です。</p>
                                </div>
                            )}
                        </div>
                    </>
                )}
        </div>
        </div>

        {/* NPC詳細ポップアップ */}
        {(() => { const ss = selectedShadow; if (!ss) return null; return (
            <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => setSelectedShadow(null)}>
                <div className="bg-[#1a0f0a] border border-[#5c3a21] w-full max-w-md rounded-xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                    {/* ヘッダー */}
                    <div className="bg-[#2c1a0f] p-5 flex items-center gap-4 border-b border-[#5c3a21]">
                        <div className="w-16 h-16 rounded-full bg-gray-800 overflow-hidden border-2 border-[#a38b6b] flex items-center justify-center flex-shrink-0">
                            {selectedShadow.npc_image_url || selectedShadow.icon_url || selectedShadow.image_url
                                ? <img src={selectedShadow.npc_image_url || selectedShadow.icon_url || selectedShadow.image_url} alt={selectedShadow.name} className="w-full h-full object-cover" />
                                : <span className="text-2xl font-bold text-[#a38b6b]">{selectedShadow.name[0]}</span>
                            }
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-lg font-bold text-[#e3d5b8] truncate">{selectedShadow.name}</div>
                            <div className="text-sm text-[#a38b6b]">Lv.{selectedShadow.level} {toJpJobClass(selectedShadow.job_class)}</div>
                            <div className="text-yellow-400 font-mono font-bold mt-1">{selectedShadow.contract_fee.toLocaleString()} G</div>
                        </div>
                        <button onClick={() => setSelectedShadow(null)} className="text-gray-500 hover:text-white p-1 flex-shrink-0">✕</button>
                    </div>
                    <div className="p-5 space-y-4">
                        {/* ステータス */}
                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-black/40 rounded p-2 text-center border border-gray-800">
                                <div className="text-[10px] text-gray-500 mb-0.5">攻撃</div>
                                <div className="text-red-400 font-bold font-mono">{selectedShadow.stats.atk}</div>
                            </div>
                            <div className="bg-black/40 rounded p-2 text-center border border-gray-800">
                                <div className="text-[10px] text-gray-500 mb-0.5">防御</div>
                                <div className="text-blue-400 font-bold font-mono">{selectedShadow.stats.def}</div>
                            </div>
                            <div className="bg-black/40 rounded p-2 text-center border border-gray-800">
                                <div className="text-[10px] text-gray-500 mb-0.5">HP</div>
                                <div className="text-green-400 font-bold font-mono">{selectedShadow.stats.hp}</div>
                            </div>
                        </div>
                        {/* 所持スキル */}
                        {selectedShadow.signature_deck_preview.length > 0 && (
                            <div className="bg-black/30 rounded-lg p-3 border border-gray-800">
                                <div className="text-[10px] text-gray-500 mb-2">所持スキル</div>
                                <div className="flex flex-wrap gap-1.5">
                                    {selectedShadow.signature_deck_preview.map((card, i) => (
                                        <span key={i} className="px-2 py-1 bg-[#2c1a0f] text-[#d4a373] text-xs rounded border border-[#5c3a21] font-medium">
                                            {card}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {/* フレーバーテキスト */}
                        {selectedShadow.flavor_text && (
                            <div className="bg-amber-950/20 rounded-lg p-3 border border-[#5c3a21]">
                                <p className="text-[#d4a373] font-serif italic text-sm leading-relaxed">
                                    「{selectedShadow.flavor_text}」
                                </p>
                            </div>
                        )}
                        {/* ボタン */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setSelectedShadow(null)}
                                className="flex-1 py-2.5 border border-gray-700 text-gray-400 hover:text-white text-sm rounded-lg transition-colors"
                            >
                                閉じる
                            </button>
                            <button
                                onClick={async () => { await handleHire(selectedShadow); setSelectedShadow(null); }}
                                disabled={!!hireStatus || userProfile.gold < selectedShadow.contract_fee || currentParty.length >= 4}
                                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                                    currentParty.length >= 4
                                        ? 'bg-gray-700 text-gray-500 border border-gray-600 cursor-not-allowed'
                                        : userProfile.gold < selectedShadow.contract_fee
                                            ? 'bg-gray-700 text-gray-500 border border-gray-600 cursor-not-allowed'
                                            : 'bg-[#a38b6b] hover:bg-[#e3d5b8] text-black border border-[#a38b6b] shadow-lg'
                                }`}
                            >
                                {currentParty.length >= 4 ? 'パーティ満員' : userProfile.gold < selectedShadow.contract_fee ? '資金不足' : `契約を結ぶ (${selectedShadow.contract_fee.toLocaleString()} G)`}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        ); })()}
        </>
    );
}
