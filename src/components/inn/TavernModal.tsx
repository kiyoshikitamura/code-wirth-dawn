import React, { useState, useEffect } from 'react';
import { UserProfile, PartyMember } from '@/types/game';
import { X, UserPlus, Shield, Sword, Heart, RefreshCw, Flag, Sparkles } from 'lucide-react';
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
    const [loading, setLoading] = useState(true);
    const [hireStatus, setHireStatus] = useState<string | null>(null);
    const [reportTarget, setReportTarget] = useState<ShadowSummary | null>(null);
    const [reportReason, setReportReason] = useState('');
    const [reportStatus, setReportStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
    const [selectedShadow, setSelectedShadow] = useState<ShadowSummary | null>(null);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            Promise.all([fetchPartyData(), fetchShadows()]).finally(() => setLoading(false));
        }
    }, [isOpen, locationId]);

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
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            const res = await fetch(`/api/party/list?owner_id=${userProfile.id}`, {
                headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
            });
            const data = await res.json();
            if (data.party) setCurrentParty(data.party);
        } catch (e) {
            console.error("Failed to fetch party data", e);
        }
    };

    const fetchShadows = async () => {
        try {
            const res = await fetch(`/api/tavern/list?location_id=${locationId}&user_id=${userProfile.id}`);
            const data = await res.json();
            if (data.shadows) setShadows(data.shadows);
        } catch (e) {
            console.error("Failed to fetch shadows", e);
        }
    };

    const isAlreadyHired = (shadow: ShadowSummary): boolean => {
        return currentParty.some(member =>
            member.name === shadow.name ||
            (shadow.profile_id && (member as any).source_user_id === shadow.profile_id)
        );
    };

    const handleHire = async (shadow: ShadowSummary) => {
        if (isAlreadyHired(shadow)) { alert('この冒険者は既に契約済みです。'); return; }
        if (currentParty.length >= 4) { alert('パーティが満員です。'); return; }
        if (userProfile.gold < shadow.contract_fee) { alert('ゴールドが足りません！'); return; }
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
                setHireStatus('雇用完了！');
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
        } catch { setReportStatus('error'); }
    };

    const closeReportModal = () => { setReportTarget(null); setReportReason(''); setReportStatus('idle'); };

    const isEmbargoed = reputationScore < 0;
    if (!isOpen) return null;

    return (
        <>
        <div className="fixed inset-0 z-[60] flex justify-center items-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-[#e3d5b8] text-[#2c241b] w-full max-w-4xl h-[85vh] flex flex-col rounded-sm shadow-[0_0_20px_rgba(0,0,0,0.8)] border-4 border-[#8b5a2b] relative overflow-hidden">

                {/* ===== Header ===== */}
                <div className="bg-[#3e2723] border-b-2 border-[#8b5a2b] p-4 flex justify-between items-center flex-shrink-0">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <h2 className="text-lg font-serif font-bold tracking-widest text-amber-400">酒場</h2>
                        </div>
                        <p className="text-[10px] text-[#a38b6b] mt-0.5 font-serif italic">― 冒険者の集う喧騒の場所 ―</p>
                    </div>
                    <button onClick={onClose} className="text-[#a38b6b] hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {isEmbargoed ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                        <h2 className="text-3xl font-serif text-red-700 font-bold mb-4 tracking-widest">出入り禁止</h2>
                        <div className="bg-red-50/60 border border-red-300/50 p-6 rounded-lg max-w-lg">
                            <p className="text-red-800 font-serif italic text-lg leading-relaxed">
                                「お前のような悪党に飲ませる酒も、紹介する仲間もねえ。さっさと俺の店から出て行きな！」
                            </p>
                        </div>
                    </div>
                ) : (
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
                                影の登録
                            </button>
                            {activeTab === 'hire' && (
                                <button onClick={async () => { setLoading(true); await Promise.all([fetchPartyData(), fetchShadows()]); setLoading(false); }} disabled={loading}
                                    className="px-3 py-2 flex items-center gap-1.5 bg-[#3e2723] text-[#8b5a2b] hover:bg-[#4e342e] hover:text-[#e3d5b8] transition-colors rounded-sm">
                                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                                    <span className="text-xs font-bold">見渡す</span>
                                </button>
                            )}
                        </div>

                        {/* ===== Content ===== */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-6">
                            {loading ? (
                                <div className="h-full flex items-center justify-center text-[#8b5a2b] font-serif animate-pulse text-lg">
                                    酒場を見回しています...
                                </div>
                            ) : hireStatus ? (
                                <div className="h-full flex items-center justify-center text-[#8b5a2b] font-serif animate-pulse text-lg">
                                    {hireStatus}
                                </div>
                            ) : activeTab === 'hire' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* === Current Party === */}
                                    {currentParty.length > 0 && (
                                        <>
                                            <div className="col-span-1 md:col-span-2 text-[#3e2723] font-serif font-bold border-b-2 border-[#8b5a2b]/40 pb-1 mb-1">
                                                現在のパーティ ({currentParty.length}/4)
                                            </div>
                                            {currentParty.map(member => (
                                                <div key={`party-${member.id}`} className="relative p-3 border-2 border-[#6b8cae]/40 bg-[#eef3f7] rounded">
                                                    <div className="absolute top-0 right-0 bg-[#4a7da8] text-white text-[10px] px-2 py-0.5 font-bold rounded-bl">同行中</div>
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="w-9 h-9 rounded-full bg-[#d0dde8] overflow-hidden border border-[#6b8cae]/40 flex shrink-0 items-center justify-center">
                                                            {member.icon_url || member.image_url
                                                                ? <img src={member.icon_url || member.image_url} alt={member.name} className="w-full h-full object-cover" />
                                                                : <span className="text-[#4a7da8] font-bold text-sm">{member.name[0]}</span>}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-sm font-bold text-[#3e2723] truncate">{member.name}</div>
                                                            <div className="text-[11px] text-[#8b6f4e]">{member.job_class}</div>
                                                        </div>
                                                        <div className="text-[11px] text-[#6b8cae] font-bold">契約済</div>
                                                    </div>
                                                    <div className="flex gap-3 text-[11px] font-mono text-[#8b6f4e]">
                                                        <span className="flex items-center gap-1"><Shield size={11} /> ??</span>
                                                        <span className="flex items-center gap-1"><Heart size={11} /> {member.durability}</span>
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="col-span-1 md:col-span-2 text-[#3e2723] font-serif font-bold border-b-2 border-[#8b5a2b]/40 pb-1 mb-1 mt-3">
                                                酒場にいる冒険者たち
                                            </div>
                                        </>
                                    )}

                                    {/* === Empty State === */}
                                    {shadows.length === 0 && !loading && (
                                        <div className="text-center text-[#8b5a2b]/70 col-span-2 py-10 font-serif">
                                            <p>ここには誰もいないようだ...</p>
                                            <p className="text-sm mt-2">他のプレイヤーがこの地を訪れるのを待ちましょう。</p>
                                        </div>
                                    )}

                                    {/* === Party Full Warning === */}
                                    {currentParty.length >= 4 && shadows.length > 0 && (
                                        <div className="col-span-2 bg-red-50/80 border border-red-300 text-red-700 p-2 text-center text-xs rounded">
                                            パーティメンバーが上限（4人）に達しています。
                                        </div>
                                    )}

                                    {/* === Shadow Cards === */}
                                    {shadows.map((shadow, idx) => {
                                        const isHeroic = shadow.level >= 20;
                                        const hired = isAlreadyHired(shadow);
                                        return (
                                            <div key={idx} className={`relative overflow-hidden p-3 border rounded transition-all ${
                                                hired ? 'border-[#6b8cae]/40 bg-[#eef3f7] opacity-75'
                                                : isHeroic ? 'ring-2 ring-amber-500 bg-gradient-to-b from-[#fdfbf7] to-amber-50/60'
                                                : shadow.subscription_tier === 'premium' ? 'border-amber-500/50 bg-amber-50/30'
                                                : shadow.subscription_tier === 'basic' ? 'border-[#6b8cae]/30 bg-[#f5f8fb]'
                                                : 'border-[#c2b280] bg-[#fdfbf7] hover:border-[#a38b6b]'
                                            }`}>
                                                {/* Badge */}
                                                {hired && <div className="absolute top-0 right-0 bg-[#4a7da8] text-white text-[10px] px-2 py-0.5 font-bold rounded-bl z-10">雇用中</div>}
                                                {!hired && isHeroic && (
                                                    <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-600 to-yellow-400 text-[10px] font-bold text-slate-950 px-2 py-0.5 rounded-bl z-10 flex items-center gap-1"><Sparkles size={10} /> HERO</div>
                                                )}
                                                {!hired && !isHeroic && shadow.subscription_tier === 'premium' && <div className="absolute top-0 right-0 bg-amber-600 text-white text-[10px] px-2 py-0.5 font-bold z-10 rounded-bl">伝説</div>}
                                                {!hired && !isHeroic && shadow.subscription_tier === 'basic' && shadow.origin_type !== 'system_mercenary' && <div className="absolute top-0 right-0 bg-[#4a7da8] text-white text-[10px] px-2 py-0.5 font-bold z-10 rounded-bl">傑出</div>}
                                                {!hired && !isHeroic && shadow.origin_type === 'system_mercenary' && <div className="absolute top-0 right-0 bg-[#4a7da8] text-white text-[10px] px-2 py-0.5 font-bold z-10 rounded-bl">公式</div>}

                                                {/* Info */}
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-[#e3d5b8] overflow-hidden border border-[#a38b6b] flex shrink-0 items-center justify-center">
                                                            {shadow.icon_url || shadow.image_url
                                                                ? <img src={shadow.icon_url || shadow.image_url} alt={shadow.name} className="w-full h-full object-cover" />
                                                                : <span className="text-[#8b5a2b] font-bold">{shadow.name[0]}</span>}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold text-[#3e2723]">{shadow.name}</div>
                                                            <div className="text-[11px] text-[#8b6f4e]">Lv.{shadow.level} {toJpJobClass(shadow.job_class)}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-0.5">
                                                        {!hired && <div className="text-amber-700 font-mono font-bold text-sm">{shadow.contract_fee} G</div>}
                                                        {!hired && <div className="text-[10px] text-[#8b6f4e]">契約金</div>}
                                                        {(shadow.icon_url || shadow.image_url) && shadow.origin_type !== 'system_mercenary' && (
                                                            <button onClick={(e) => { e.stopPropagation(); setReportTarget(shadow); }} className="text-[#a38b6b] hover:text-red-600 transition-colors mt-0.5" title="通報"><Flag size={11} /></button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Stats */}
                                                <div className="flex gap-3 mb-3 text-[11px] font-mono text-[#5d4037]">
                                                    <span className="flex items-center gap-1"><Sword size={11} /> {shadow.stats.atk}</span>
                                                    <span className="flex items-center gap-1"><Shield size={11} /> {shadow.stats.def}</span>
                                                    <span className="flex items-center gap-1"><Heart size={11} /> {shadow.stats.hp}</span>
                                                </div>

                                                {/* Skills */}
                                                {shadow.signature_deck_preview.length > 0 && (
                                                    <div className="mb-3">
                                                        <div className="text-[10px] text-[#8b6f4e] mb-1">所持スキル</div>
                                                        <div className="flex gap-1 flex-wrap">
                                                            {shadow.signature_deck_preview.map((card, i) => (
                                                                <span key={i} className="px-1.5 py-0.5 bg-[#e3d5b8] text-[#5d4037] text-[10px] rounded border border-[#a38b6b]">{card}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Action Button */}
                                                <button
                                                    onClick={() => setSelectedShadow(shadow)}
                                                    className={`w-full py-2 flex items-center justify-center gap-2 border rounded text-sm font-bold transition-colors ${
                                                        hired ? 'border-[#6b8cae]/30 text-[#6b8cae] bg-[#eef3f7]' : 'border-[#8b5a2b] text-[#8b5a2b] hover:bg-[#8b5a2b]/10'
                                                    }`}>
                                                    <UserPlus size={14} />
                                                    {hired ? '雇用中 - 詳細を見る' : '詳細を見る'}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center text-[#8b5a2b]/70 py-20 font-serif">
                                    <h3 className="text-xl mb-4 text-[#3e2723]">影の登録</h3>
                                    <p>自分の写し身を酒場に登録し、不労所得を得ることができます。</p>
                                    <p className="text-sm mt-4 text-amber-700">※ この機能は開発中です。</p>
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
            return (
            <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedShadow(null)}>
                <div className="bg-[#fdfbf7] border-2 border-[#8b5a2b] w-full max-w-md rounded-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                    {/* Header */}
                    <div className="bg-[#3e2723] p-5 flex items-center gap-4 border-b-2 border-[#8b5a2b]">
                        <div className="w-16 h-16 rounded-full bg-[#e3d5b8] overflow-hidden border-2 border-[#a38b6b] flex items-center justify-center flex-shrink-0">
                            {(selectedShadow as any).npc_image_url || selectedShadow.icon_url || selectedShadow.image_url
                                ? <img src={(selectedShadow as any).npc_image_url || selectedShadow.icon_url || selectedShadow.image_url} alt={selectedShadow.name} className="w-full h-full object-cover" />
                                : <span className="text-2xl font-bold text-[#a38b6b]">{selectedShadow.name[0]}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-lg font-bold text-amber-400 truncate">{selectedShadow.name}</div>
                            <div className="text-sm text-[#a38b6b]">Lv.{selectedShadow.level} {toJpJobClass(selectedShadow.job_class)}</div>
                            {!hired && <div className="text-amber-300 font-mono font-bold mt-1">{selectedShadow.contract_fee.toLocaleString()} G</div>}
                            {hired && <div className="text-[#6b8cae] font-bold mt-1 text-sm">雇用中</div>}
                        </div>
                        <button onClick={() => setSelectedShadow(null)} className="text-[#a38b6b] hover:text-white p-1 flex-shrink-0">✕</button>
                    </div>

                    <div className="p-5 space-y-4">
                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-[#e3d5b8]/50 rounded p-2 text-center border border-[#a38b6b]/30">
                                <div className="text-[10px] text-[#8b6f4e] mb-0.5">攻撃</div>
                                <div className="text-red-700 font-bold font-mono">{selectedShadow.stats.atk}</div>
                            </div>
                            <div className="bg-[#e3d5b8]/50 rounded p-2 text-center border border-[#a38b6b]/30">
                                <div className="text-[10px] text-[#8b6f4e] mb-0.5">防御</div>
                                <div className="text-blue-700 font-bold font-mono">{selectedShadow.stats.def}</div>
                            </div>
                            <div className="bg-[#e3d5b8]/50 rounded p-2 text-center border border-[#a38b6b]/30">
                                <div className="text-[10px] text-[#8b6f4e] mb-0.5">HP</div>
                                <div className="text-green-700 font-bold font-mono">{selectedShadow.stats.hp}</div>
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
                                <button disabled className="flex-1 py-2.5 text-sm font-bold rounded-lg bg-[#d0dde8] text-[#6b8cae] border border-[#6b8cae]/30 cursor-not-allowed">
                                    雇用中
                                </button>
                            ) : (
                                <button
                                    onClick={async () => { if (isAlreadyHired(selectedShadow)) return; await handleHire(selectedShadow); setSelectedShadow(null); }}
                                    disabled={!!hireStatus || userProfile.gold < selectedShadow.contract_fee || currentParty.length >= 4}
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
        </>
    );
}
