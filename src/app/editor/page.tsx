'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { supabase } from '@/lib/supabase';
import { HUB_LOCATION_ID, LEGACY_ZERO_UUID } from '@/utils/constants';
import { PenTool, Plus, Trash2, Save, Send, ChevronDown, ChevronUp, Sword, X, ArrowLeft, Play, ScrollText, Package, Sparkles } from 'lucide-react';
import EnemyEditor from '@/components/editor/EnemyEditor';
import CustomItemEditor, { CustomReward } from '@/components/editor/CustomItemEditor';

// Auth helper for API calls
const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export default function EditorPage() {
    const router = useRouter();
    const { userProfile, fetchUserProfile, worldState, fetchWorldState } = useGameStore();
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [questId, setQuestId] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [shortDescription, setShortDescription] = useState('');
    const [fullDescription, setFullDescription] = useState('');
    const [startLocationId, setStartLocationId] = useState('loc_regalia');
    const [customReward, setCustomReward] = useState<CustomReward | null>(null);
    const [nodes, setNodes] = useState<any[]>([]);
    const [isTested, setIsTested] = useState(false);
    const [worldLocations, setWorldLocations] = useState<{ id: string, name: string }[]>([]);

    // UI state
    const [activeTab, setActiveTab] = useState<'basic' | 'nodes' | 'reward' | 'action'>('basic');
    const [expandedNode, setExpandedNode] = useState<number | null>(null);

    useEffect(() => {
        async function init() {
            const [profileRes, worldRes, locRes] = await Promise.all([
                fetchUserProfile(),
                fetchWorldState(),
                supabase.from('locations').select('slug, name')
            ]);

            if (locRes && locRes.data) {
                setWorldLocations(locRes.data.map(l => ({ id: l.slug, name: l.name })));
            }

            setLoading(false);
        }
        init();
    }, []);

    // Check if quest has been tested
    useEffect(() => {
        if (questId) {
            const tested = localStorage.getItem(`ugc_tested_${questId}`);
            if (tested === 'true') {
                setIsTested(true);
            }
        }
    }, [questId]);

    // Hub access check — single definition (L2 fix)
    useEffect(() => {
        if (!loading && userProfile && worldState) {
            const validHubs = [HUB_LOCATION_ID, LEGACY_ZERO_UUID];
            const isHubName = worldState?.location_name === '名も無き旅人の拠所' || worldState?.location_name === '名もなき旅人の拠所';
            const isHub = validHubs.includes(userProfile.current_location_id || '') || isHubName;

            if (!isHub) {
                alert(`この機能は「名もなき旅人の拠所」からのみアクセス可能です。`);
                router.push('/inn');
            }
        }
    }, [userProfile, worldState, loading, router]);

    const handleAddNode = () => {
        if (nodes.length >= 20) {
            alert('ノードは最大20個までです。');
            return;
        }
        const newNode = {
            id: `node_${Date.now()}`,
            type: 'text',
            text: '',
            choices: []
        };
        setNodes([...nodes, newNode]);
        setExpandedNode(nodes.length);
    };

    const handleRemoveNode = (index: number) => {
        const newNodes = [...nodes];
        newNodes.splice(index, 1);
        setNodes(newNodes);
        if (expandedNode === index) setExpandedNode(null);
    };

    const handleUpdateNode = (index: number, updates: any) => {
        const newNodes = [...nodes];
        newNodes[index] = { ...newNodes[index], ...updates };
        setNodes(newNodes);
    };

    const handleSaveDraft = async () => {
        if (!title.trim()) {
            alert('クエスト名を入力してください');
            return;
        }

        setIsSaving(true);
        try {
            const headers = await getAuthHeaders();
            const res = await fetch('/api/ugc/save', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    id: questId,
                    userId: userProfile?.id,
                    payload: {
                        title,
                        shortDescription,
                        fullDescription,
                        startLocationId,
                        nodes,
                        customReward
                    }
                })
            });
            const data = await res.json();
            if (data.success) {
                setQuestId(String(data.questId));
                alert('下書きを保存しました！');
            } else {
                alert('保存に失敗しました: ' + data.error);
            }
        } catch (e: any) {
            console.error(e);
            alert('通信エラーが発生しました');
        } finally {
            setIsSaving(false);
        }
    };

    const handleTestPlay = async () => {
        if (!title.trim() || nodes.length === 0) {
            alert('クエスト名とノードが必要です');
            return;
        }

        setIsSaving(true);
        try {
            const headers = await getAuthHeaders();
            const res = await fetch('/api/ugc/save', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    id: questId,
                    userId: userProfile?.id,
                    payload: { title, shortDescription, fullDescription, startLocationId, nodes, customReward }
                })
            });
            const data = await res.json();
            if (data.success) {
                setQuestId(String(data.questId));
                router.push(`/quest/${data.questId}?test_play=true`);
            } else {
                alert('保存に失敗しました: ' + data.error);
            }
        } catch (e: any) {
            alert('通信エラー');
        } finally {
            setIsSaving(false);
        }
    };

    // Calculate Publish Tax
    const publishTax = 100 + (customReward?.price || 500);

    const handlePublish = async () => {
        if (!questId || !userProfile) return;

        if (userProfile.gold < publishTax) {
            alert(`ゴールドが不足しています。(必要なパブリッシュ税: ${publishTax}G)`);
            return;
        }

        if (!confirm(`審査申請を送信しますか？パブリッシュ税（${publishTax}G）の引き落としが発生します。`)) return;

        setIsSaving(true);
        try {
            const headers = await getAuthHeaders();
            const res = await fetch('/api/ugc/publish', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    id: questId,
                    userId: userProfile?.id,
                    rewardData: customReward
                })
            });
            const data = await res.json();
            if (data.success) {
                alert('審査申請が完了しました！マイページまたは酒場でステータスを確認できます。');
                router.push('/inn');
            } else {
                alert('申請に失敗しました: ' + data.error);
            }
        } catch (e) {
            alert('通信エラー');
        } finally {
            setIsSaving(false);
        }
    };

    // Node type labels
    const nodeTypeLabel = (type: string) => {
        switch (type) {
            case 'text': return '会話';
            case 'battle': return 'バトル';
            case 'check_delivery': return '納品';
            case 'hire_mercenary': return 'NPC';
            default: return type;
        }
    };

    const nodeTypeColor = (type: string) => {
        switch (type) {
            case 'text': return 'bg-amber-900/30 text-amber-300 border-amber-700';
            case 'battle': return 'bg-red-900/30 text-red-300 border-red-700';
            case 'check_delivery': return 'bg-green-900/30 text-green-300 border-green-700';
            case 'hire_mercenary': return 'bg-blue-900/30 text-blue-300 border-blue-700';
            default: return 'bg-slate-800 text-slate-300 border-slate-700';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-900 font-sans select-none text-slate-200">
                <div className="relative w-full max-w-[390px] h-screen sm:h-[844px] sm:border-[6px] sm:border-slate-800 sm:rounded-[40px] shadow-2xl flex flex-col items-center justify-center gap-4 bg-slate-950">
                    <PenTool className="w-12 h-12 text-amber-500 animate-pulse" />
                    <p className="text-sm text-amber-400 font-serif tracking-widest">工房を準備中...</p>
                </div>
            </div>
        );
    }

    // Hub access guard (render)
    if (userProfile && worldState) {
        const validHubs = [HUB_LOCATION_ID, LEGACY_ZERO_UUID];
        const isHubName = worldState?.location_name === '名も無き旅人の拠所' || worldState?.location_name === '名もなき旅人の拠所';
        if (!validHubs.includes(userProfile.current_location_id || '') && !isHubName) {
            return null;
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-900 font-sans select-none overflow-hidden text-slate-200">
            <div className="relative w-full max-w-[430px] h-screen sm:h-[844px] sm:border-[6px] sm:border-slate-800 sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col bg-slate-950">

                {/* HEADER */}
                <div className="relative z-40 bg-slate-950/90 border-b border-amber-900/30 px-4 pt-[env(safe-area-inset-top,10px)] pb-2 flex items-center justify-between backdrop-blur-sm">
                    <div className="flex items-center gap-2 min-w-0">
                        <button onClick={() => router.push('/inn')} className="text-slate-500 hover:text-amber-400 transition-colors p-1">
                            <ArrowLeft size={16} />
                        </button>
                        <PenTool size={14} className="text-amber-500 flex-shrink-0" />
                        <span className="text-xs font-bold text-amber-400 tracking-widest uppercase truncate">クリエイターズ工房</span>
                    </div>
                    {questId && (
                        <span className="text-[9px] text-slate-600 font-mono truncate max-w-[100px]">ID: {String(questId).substring(0, 8)}</span>
                    )}
                </div>

                {/* TAB NAVIGATION */}
                <div className="flex bg-slate-950 border-b border-slate-800 px-0.5 gap-0 flex-shrink-0 overflow-x-auto">
                    {[
                        { key: 'basic', label: '基本', icon: <ScrollText size={11} /> },
                        { key: 'nodes', label: `ノード(${nodes.length})`, icon: <Plus size={11} /> },
                        { key: 'reward', label: '報酬', icon: <Package size={11} /> },
                        { key: 'action', label: 'アクション', icon: <Send size={11} /> },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as any)}
                            className={`flex-1 min-w-0 py-2.5 text-[10px] font-bold flex items-center justify-center gap-0.5 transition-colors whitespace-nowrap ${
                                activeTab === tab.key
                                    ? 'text-amber-400 border-b-2 border-amber-500 bg-amber-900/10'
                                    : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* CONTENT */}
                <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

                    {/* === TAB: 基本情報 === */}
                    {activeTab === 'basic' && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                            <div>
                                <label className="block text-[10px] text-amber-600 font-bold uppercase tracking-wider mb-1">クエスト名 *</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 focus:border-amber-600 rounded-lg p-3 text-sm text-white outline-none transition-colors"
                                    placeholder="例: ゴブリンの討伐"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] text-amber-600 font-bold uppercase tracking-wider mb-1">概要 <span className="text-slate-600">({shortDescription.length}/40)</span></label>
                                <textarea
                                    value={shortDescription}
                                    onChange={e => setShortDescription(e.target.value.substring(0, 40))}
                                    className="w-full bg-slate-900 border border-slate-700 focus:border-amber-600 rounded-lg p-3 text-sm text-white outline-none h-16 resize-none transition-colors"
                                    placeholder="ボードに表示される概要"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] text-amber-600 font-bold uppercase tracking-wider mb-1">詳細フレーバーテキスト</label>
                                <textarea
                                    value={fullDescription}
                                    onChange={e => setFullDescription(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 focus:border-amber-600 rounded-lg p-3 text-sm text-white outline-none h-28 resize-none transition-colors"
                                    placeholder="クエストの詳細な背景など"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] text-amber-600 font-bold uppercase tracking-wider mb-1">出発拠点</label>
                                <select
                                    value={startLocationId}
                                    onChange={e => setStartLocationId(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 focus:border-amber-600 rounded-lg p-3 text-sm text-white outline-none transition-colors"
                                >
                                    {worldLocations.map(loc => (
                                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* === TAB: ノード構築 === */}
                    {activeTab === 'nodes' && (
                        <div className="space-y-3 animate-in fade-in duration-200">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xs font-bold text-slate-300">シナリオ・ノード</h3>
                                <span className="text-[10px] text-slate-500 font-mono">{nodes.length}/20</span>
                            </div>

                            {nodes.length === 0 ? (
                                <div className="bg-slate-900/50 border border-dashed border-slate-700 rounded-xl p-8 text-center flex flex-col items-center gap-3">
                                    <Sparkles className="w-8 h-8 text-amber-600/50" />
                                    <p className="text-xs text-slate-500">ノードがありません。<br />最初のノードを追加してクエストを構築しましょう。</p>
                                    <button onClick={handleAddNode} className="bg-amber-900/30 text-amber-400 px-4 py-2 rounded-lg border border-amber-700/50 text-xs font-bold hover:bg-amber-900/50 transition-colors">
                                        + 最初のノードを追加
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {nodes.map((node, index) => (
                                        <div key={node.id} className="bg-slate-900/80 border border-slate-700/50 rounded-xl overflow-hidden transition-all">
                                            {/* Node Header — clickable accordion */}
                                            <button
                                                onClick={() => setExpandedNode(expandedNode === index ? null : index)}
                                                className="w-full p-3 flex items-center gap-2 text-left hover:bg-slate-800/50 transition-colors"
                                            >
                                                <span className="w-6 h-6 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-[10px] font-bold text-slate-400 flex-shrink-0">
                                                    {index + 1}
                                                </span>
                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${nodeTypeColor(node.type)}`}>
                                                    {nodeTypeLabel(node.type)}
                                                </span>
                                                <span className="flex-1 text-xs text-slate-300 truncate">
                                                    {node.type === 'text' ? (node.text || '未入力') : node.type === 'battle' ? (node.enemyData?.name || '敵未設定') : node.npcName || 'NPC'}
                                                </span>
                                                {expandedNode === index ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
                                            </button>

                                            {/* Node Content — expanded */}
                                            {expandedNode === index && (
                                                <div className="px-3 pb-3 space-y-3 border-t border-slate-800 pt-3 animate-in slide-in-from-top-2 duration-200">
                                                    <div className="flex gap-2 items-center">
                                                        <select
                                                            value={node.type}
                                                            onChange={(e) => handleUpdateNode(index, { type: e.target.value })}
                                                            className="bg-slate-800 border border-slate-600 rounded-lg p-2 text-xs text-slate-300 outline-none flex-1"
                                                        >
                                                            <option value="text">テキスト / 会話</option>
                                                            <option value="battle">バトル進行</option>
                                                            <option value="check_delivery">アイテム納品</option>
                                                            <option value="hire_mercenary">同行NPC追加</option>
                                                        </select>
                                                        <button onClick={() => handleRemoveNode(index)} className="text-red-500 hover:bg-red-900/30 p-2 rounded-lg transition-colors">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>

                                                    {/* Text Node */}
                                                    {node.type === 'text' && (
                                                        <textarea
                                                            value={node.text}
                                                            onChange={(e) => handleUpdateNode(index, { text: e.target.value })}
                                                            className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-white outline-none h-24 resize-none focus:border-amber-600 transition-colors"
                                                            placeholder="テキスト本文を入力"
                                                        />
                                                    )}

                                                    {/* Battle Node */}
                                                    {node.type === 'battle' && (
                                                        <EnemyEditor
                                                            value={node.enemyData || { name: 'スライム', level: 1, hp: 50, atk: 5, def: 5, image_url: '', skills: [] }}
                                                            onChange={(newEnemy) => handleUpdateNode(index, { enemyData: newEnemy })}
                                                        />
                                                    )}

                                                    {/* Hire Mercenary Node */}
                                                    {node.type === 'hire_mercenary' && (
                                                        <div className="space-y-2">
                                                            <div>
                                                                <label className="block text-[10px] text-blue-400 mb-1">NPC名</label>
                                                                <input
                                                                    type="text"
                                                                    placeholder="同行者名"
                                                                    value={node.npcName || ''}
                                                                    onChange={(e) => handleUpdateNode(index, { npcName: e.target.value })}
                                                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-sm text-white outline-none focus:border-blue-500 transition-colors"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] text-blue-400 mb-1">画像URL</label>
                                                                <input
                                                                    type="text"
                                                                    placeholder="https://..."
                                                                    value={node.npcImageUrl || ''}
                                                                    onChange={(e) => handleUpdateNode(index, { npcImageUrl: e.target.value })}
                                                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-sm text-white outline-none focus:border-blue-500 transition-colors"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {nodes.length < 20 && (
                                        <button
                                            onClick={handleAddNode}
                                            className="w-full py-3 bg-transparent border-2 border-dashed border-slate-700 hover:border-amber-600 hover:bg-amber-900/10 text-slate-500 hover:text-amber-400 rounded-xl flex items-center justify-center gap-2 transition-all text-xs font-bold"
                                        >
                                            <Plus size={14} /> ノードを追加
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* === TAB: 報酬設定 === */}
                    {activeTab === 'reward' && (
                        <div className="animate-in fade-in duration-200">
                            <CustomItemEditor value={customReward} onChange={setCustomReward} />
                        </div>
                    )}

                    {/* === TAB: アクション === */}
                    {activeTab === 'action' && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                            {/* Status Summary */}
                            <div className="bg-slate-900/80 border border-slate-700/50 rounded-xl p-4 space-y-2">
                                <h3 className="text-xs font-bold text-amber-400 mb-2">ステータス</h3>
                                <div className="grid grid-cols-2 gap-2 text-[11px]">
                                    <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                                        <div className="text-slate-500">クエスト名</div>
                                        <div className="text-white font-bold truncate">{title || '未設定'}</div>
                                    </div>
                                    <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                                        <div className="text-slate-500">ノード数</div>
                                        <div className="text-white font-bold">{nodes.length}/20</div>
                                    </div>
                                    <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                                        <div className="text-slate-500">テスト済</div>
                                        <div className={`font-bold ${isTested ? 'text-green-400' : 'text-red-400'}`}>{isTested ? '✓ 合格' : '✗ 未テスト'}</div>
                                    </div>
                                    <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                                        <div className="text-slate-500">パブリッシュ税</div>
                                        <div className="text-amber-400 font-bold font-mono">{publishTax} G</div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <button
                                onClick={handleSaveDraft}
                                disabled={isSaving}
                                className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white p-3.5 rounded-xl transition-colors font-bold border border-slate-600 disabled:opacity-50 text-sm"
                            >
                                <Save size={16} /> {isSaving ? '保存中...' : '下書き保存'}
                            </button>

                            <button
                                onClick={() => {
                                    if (!title.trim()) {
                                        alert('クエスト名を入力してください');
                                        setActiveTab('basic');
                                        return;
                                    }
                                    if (nodes.length === 0) {
                                        alert('ノードを1つ以上追加してください');
                                        setActiveTab('nodes');
                                        return;
                                    }
                                    handleTestPlay();
                                }}
                                disabled={isSaving}
                                className="w-full flex items-center justify-center gap-2 bg-amber-900/40 hover:bg-amber-900/60 text-amber-200 p-3.5 rounded-xl transition-colors font-bold border border-amber-700/50 disabled:opacity-50 text-sm"
                            >
                                <Play size={16} /> テストプレイ開始
                            </button>

                            <button
                                onClick={handlePublish}
                                disabled={!isTested || isSaving || !userProfile || userProfile.gold < publishTax}
                                className={`w-full flex items-center justify-center gap-2 p-3.5 rounded-xl transition-colors font-bold border text-sm ${
                                    isTested && userProfile && userProfile.gold >= publishTax
                                        ? 'bg-gradient-to-r from-amber-900 to-amber-700 text-amber-100 border-amber-500 hover:from-amber-800 hover:to-amber-600 shadow-[0_0_15px_rgba(234,179,8,0.2)]'
                                        : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed opacity-50'
                                }`}
                                title={!isTested ? "テストプレイをクリアする必要があります" : userProfile && userProfile.gold < publishTax ? `所持金が不足しています（必要: ${publishTax}G）` : "審査申請を行います"}
                            >
                                <Send size={16} /> 審査申請 — {publishTax} G
                            </button>

                            <div className="text-[10px] text-slate-600 text-center mt-2">
                                ※申請時、パブリッシュ税（基本税100G ＋ アイテム価値等）が引き落とされます。
                            </div>
                        </div>
                    )}
                </main>

                {/* HOME INDICATOR */}
                <div className="w-32 h-1 bg-slate-800 rounded-full absolute bottom-2 left-1/2 -translate-x-1/2" />
            </div>
        </div>
    );
}
