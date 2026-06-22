import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Users, X, Heart, Sword, Shield, Activity, ChevronUp, ChevronDown } from 'lucide-react';
import { toJpJobClass } from '@/lib/jobClass';
import { getAuthHeaders } from '@/lib/authToken';

interface PartyModalProps {
    onClose: () => void;
    userProfile: any;
}

export default function PartyModal({ onClose, userProfile }: PartyModalProps) {
    const [party, setParty] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDetail, setSelectedDetail] = useState<any | null>(null);
    const [reordering, setReordering] = useState(false);

    const handleReorder = async (newParty: any[]) => {
        if (reordering) return;
        setReordering(true);

        const originalParty = [...party];
        setParty(newParty);

        try {
            const memberIds = newParty.map(p => p.id);
            const headers: HeadersInit = { 'Content-Type': 'application/json', ...(await getAuthHeaders()) };
            const res = await fetch('/api/party/reorder', {
                method: 'POST',
                headers,
                body: JSON.stringify({ memberIds })
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                alert(`順序の変更に失敗しました。${errData.error ? `（${errData.error}）` : ''}`);
                setParty(originalParty);
            }
        } catch (e) {
            console.error(e);
            alert('通信エラーが発生しました。');
            setParty(originalParty);
        } finally {
            setReordering(false);
        }
    };

    const handleMoveUp = (index: number) => {
        if (index === 0) return;
        const newParty = [...party];
        const temp = newParty[index];
        newParty[index] = newParty[index - 1];
        newParty[index - 1] = temp;
        handleReorder(newParty);
    };

    const handleMoveDown = (index: number) => {
        if (index === party.length - 1) return;
        const newParty = [...party];
        const temp = newParty[index];
        newParty[index] = newParty[index + 1];
        newParty[index + 1] = temp;
        handleReorder(newParty);
    };

    const fetchPartyList = async () => {
        if (!userProfile?.id) return;
        setLoading(true);
        try {
            const headers = await getAuthHeaders();
            const res = await fetch(`/api/party/list?owner_id=${userProfile.id}`, { headers });
            if (res.ok) {
                const data = await res.json();
                setParty(data.party || []);
            }
        } catch (err) {
            console.error('Failed to fetch party:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPartyList();
    }, [userProfile?.id]);

    const handleDismiss = async (memberId: string, name: string) => {
        if (!confirm(`${name}と別れますか？`)) return;
        try {
            const headers: HeadersInit = { 'Content-Type': 'application/json', ...(await getAuthHeaders()) };
            const res = await fetch(`/api/party/member?id=${memberId}`, { method: 'DELETE', headers });
            if (res.ok) {
                setParty(prev => prev.filter(p => p.id !== memberId));
                alert(`${name}と別れました。`);
            } else {
                const errData = await res.json().catch(() => ({}));
                alert(`別れに失敗しました。${errData.error ? `（${errData.error}）` : ''}`);
            }
        } catch (e) {
            console.error(e);
            alert('エラーが発生しました。');
        }
        setSelectedDetail(null);
    };

    const renderDetailPopup = () => {
        if (!selectedDetail) return null;

        const vit = selectedDetail.vitality ?? 
            (selectedDetail.max_durability ? Math.round((selectedDetail.durability / selectedDetail.max_durability) * 100) : 100);
        const originTypeLabel = 
            selectedDetail.origin_type === 'shadow_active' ? '影の残像' : 
            selectedDetail.origin_type === 'shadow_heroic' ? '英霊' : '傭兵';

        return createPortal(
            <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150" onClick={() => setSelectedDetail(null)}>
                <div className="bg-[#0f172a] border border-purple-900/50 w-full max-w-sm rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                    
                    {/* Header */}
                    <div className="bg-gradient-to-r from-purple-950/40 to-slate-900 p-4 flex items-center gap-3 border-b border-purple-900/30">
                        <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700/50 flex items-center justify-center shrink-0 overflow-hidden">
                            {selectedDetail.icon_url || selectedDetail.image_url ? (
                                <img src={selectedDetail.icon_url || selectedDetail.image_url} alt={selectedDetail.name} className="w-full h-full object-cover" />
                            ) : (
                                <Users className="w-5 h-5 text-purple-400" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-white truncate">
                                {selectedDetail.epithet ? `${selectedDetail.epithet} ${selectedDetail.name}` : selectedDetail.name}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] px-1.5 py-0.5 rounded border border-purple-700/40 text-purple-300 bg-purple-950/20">
                                    Lv.{selectedDetail.level || '?'} {toJpJobClass(selectedDetail.job_class || 'Adventurer')}
                                </span>
                            </div>
                        </div>
                        <button onClick={() => setSelectedDetail(null)} className="text-gray-500 hover:text-white p-1">✕</button>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-4">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-4 gap-2">
                            <div className="bg-black/40 rounded p-2 text-center border border-slate-800">
                                <div className="text-[10px] text-gray-500 mb-0.5">HP</div>
                                <div className="text-green-400 font-bold font-mono text-xs">
                                    {selectedDetail.hp ?? selectedDetail.durability ?? 0} / {selectedDetail.max_hp ?? selectedDetail.max_durability ?? 100}
                                </div>
                            </div>
                            <div className="bg-black/40 rounded p-2 text-center border border-slate-800">
                                <div className="text-[10px] text-gray-500 mb-0.5">ATK</div>
                                <div className="text-red-400 font-bold font-mono text-xs">
                                    {selectedDetail.atk ?? '—'}
                                </div>
                            </div>
                            <div className="bg-black/40 rounded p-2 text-center border border-slate-800">
                                <div className="text-[10px] text-gray-500 mb-0.5">DEF</div>
                                <div className="text-blue-400 font-bold font-mono text-xs">
                                    {selectedDetail.def ?? '—'}
                                </div>
                            </div>
                            <div className="bg-black/40 rounded p-2 text-center border border-slate-800">
                                <div className="text-[10px] text-gray-500 mb-0.5">VIT</div>
                                <div className={`font-bold font-mono text-xs ${vit <= 20 ? 'text-red-400 animate-pulse' : 'text-amber-400'}`}>
                                    {vit}
                                </div>
                            </div>
                        </div>

                        {/* Origin details */}
                        <div className="bg-slate-900/50 rounded-lg p-2.5 border border-slate-800 space-y-1.5 text-xs">
                            <div className="flex justify-between">
                                <span className="text-gray-500">同行タイプ</span>
                                <span className="text-gray-200 font-bold">{originTypeLabel}</span>
                            </div>
                            {selectedDetail.personality && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">性格</span>
                                    <span className="text-gray-200">{selectedDetail.personality}</span>
                                </div>
                            )}
                        </div>

                        {/* Signature Skills */}
                        {selectedDetail.skill_names && selectedDetail.skill_names.length > 0 && (
                            <div className="bg-black/20 rounded-lg p-2.5 border border-slate-800">
                                <div className="text-[10px] text-purple-400 mb-1.5 font-bold">所持スキル</div>
                                <div className="flex flex-wrap gap-1">
                                    {selectedDetail.skill_names.map((name: string, i: number) => (
                                        <span key={i} className="px-1.5 py-0.5 bg-slate-800 text-slate-300 text-[10px] rounded border border-slate-700/60 font-medium">
                                            {name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Flavor text */}
                        {selectedDetail.flavor_text && (
                            <div className="bg-purple-950/10 rounded-lg p-2.5 border border-purple-900/20">
                                <p className="text-xs text-purple-400/80 italic leading-relaxed">
                                    「{selectedDetail.flavor_text}」
                                </p>
                            </div>
                        )}

                        {/* Action Button */}
                        <button
                            onClick={() => handleDismiss(selectedDetail.id, selectedDetail.name)}
                            className="w-full py-2 rounded text-xs font-bold bg-red-955/80 text-red-200 border border-red-800/60 hover:bg-red-900/70 transition-all active:scale-95"
                        >
                            同行を終える（別れる）
                        </button>
                    </div>
                </div>
            </div>,
            document.body
        );
    };

    return createPortal(
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-lg h-[90dvh] bg-[#0c1222] border-2 border-purple-950/40 rounded-lg shadow-2xl overflow-hidden flex flex-col relative text-slate-100">
                
                {/* Header */}
                <header className="flex items-center justify-between px-4 py-3 border-b border-purple-950/30 bg-[#090d1a] shrink-0">
                    <h2 className="text-sm font-bold tracking-widest text-purple-400 flex items-center gap-1.5 font-serif">
                        <Users className="w-4 h-4 text-purple-400" /> パーティメンバー管理
                    </h2>
                    <button onClick={onClose} className="p-1 text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800 rounded-full transition-colors active:scale-95">
                        <X className="w-4 h-4" />
                    </button>
                </header>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-3">
                            <div className="w-8 h-8 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
                            <span className="text-xs text-purple-400 font-medium">情報を読み込み中...</span>
                        </div>
                    ) : party.length === 0 ? (
                        <div className="text-center text-slate-500 py-12 text-xs border border-dashed border-slate-800 rounded-lg bg-slate-950/10">
                            現在同行しているメンバーはいません。<br />
                            <span className="text-[10px] text-amber-600 font-bold block mt-1">酒場で仲間を雇うことができます。</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-2">
                            {party.map((member, index) => {
                                const isFirst = index === 0;
                                const isLast = index === party.length - 1;
                                const questLocked = !!userProfile?.current_quest_id;

                                return (
                                    <div 
                                        key={member.id} 
                                        onClick={() => setSelectedDetail(member)} 
                                        className="flex items-center justify-between p-2.5 bg-slate-900/30 border border-slate-800/80 hover:border-slate-700 cursor-pointer active:bg-slate-900/50 transition-all rounded-lg group animate-in fade-in duration-150"
                                    >
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            {/* 順序番号 (1〜4) */}
                                            <span className="text-[11px] font-mono font-bold text-slate-500 w-3 text-center shrink-0">
                                                {index + 1}
                                            </span>
                                            {/* アイコン */}
                                            <div className="w-8 h-8 rounded-full bg-slate-950 flex items-center justify-center shrink-0 overflow-hidden border border-slate-800/60">
                                                {member.icon_url || member.image_url ? (
                                                    <img src={member.icon_url || member.image_url} alt={member.name} className="w-full h-full object-cover animate-in fade-in" />
                                                ) : (
                                                    <div className="text-purple-400 font-bold text-xs">{member.name[0]}</div>
                                                )}
                                            </div>
                                            {/* 名前・職業 */}
                                            <div className="min-w-0 flex-1">
                                                <div className="text-xs font-bold text-purple-300 group-hover:text-purple-200 transition-colors truncate">
                                                    {member.name}
                                                </div>
                                                <div className="text-[9px] text-slate-500 mt-0.5 truncate">
                                                    {member.epithet || toJpJobClass(member.job_class || 'Adventurer')}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0 ml-2" onClick={e => e.stopPropagation()}>
                                            {/* HP表示バッジ（改行防止） */}
                                            <div className="text-[9px] font-mono bg-black/40 px-1.5 py-0.5 rounded border border-slate-800 text-green-400 font-bold shrink-0">
                                                HP {member.hp ?? member.durability ?? 0}/{member.max_hp ?? member.max_durability ?? 100}
                                            </div>
                                            {party.length > 1 && (
                                                <div className="flex items-center gap-1 bg-slate-950/40 rounded border border-slate-800/80 p-0.5">
                                                    <button
                                                        onClick={() => handleMoveUp(index)}
                                                        disabled={isFirst || reordering || questLocked}
                                                        className={`p-1 rounded transition-colors ${
                                                            isFirst || reordering || questLocked
                                                                ? 'text-slate-700 cursor-not-allowed'
                                                                : 'text-slate-400 hover:text-purple-400 hover:bg-purple-950/20 active:scale-90'
                                                        }`}
                                                        title={questLocked ? 'クエスト進行中は並び替えできません' : '上へ'}
                                                    >
                                                        <ChevronUp className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleMoveDown(index)}
                                                        disabled={isLast || reordering || questLocked}
                                                        className={`p-1 rounded transition-colors ${
                                                            isLast || reordering || questLocked
                                                                ? 'text-slate-700 cursor-not-allowed'
                                                                : 'text-slate-400 hover:text-purple-400 hover:bg-purple-950/20 active:scale-90'
                                                        }`}
                                                        title={questLocked ? 'クエスト進行中は並び替えできません' : '下へ'}
                                                    >
                                                        <ChevronDown className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            )}
                                            <button 
                                                onClick={() => setSelectedDetail(member)}
                                                className="text-[10px] text-slate-500 hover:text-purple-300 font-medium py-1 px-1.5 rounded hover:bg-slate-800/40 transition-colors"
                                            >
                                                ▶ 詳細
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <footer className="p-2 border-t border-purple-950/20 bg-[#090d1a] text-center text-[10px] text-slate-500 font-serif shrink-0">
                    ※ 同行している仲間は、戦闘中に支援カードを提供したり、身代わり防御を行ってくれます。
                </footer>
            </div>
            {renderDetailPopup()}
        </div>,
        document.body
    );
}
