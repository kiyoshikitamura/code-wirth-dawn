'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { supabase } from '@/lib/supabase';
import { HUB_LOCATION_ID, LEGACY_ZERO_UUID } from '@/utils/constants';
import { ShieldAlert, Plus, Trash2, Save, Send } from 'lucide-react';
import EnemyEditor from '@/components/editor/EnemyEditor';
import CustomItemEditor, { CustomReward } from '@/components/editor/CustomItemEditor';

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

    useEffect(() => {
        if (!loading && userProfile && worldState) {
            // "名も無き旅人の拠所" 以外からのアクセスを弾く
            // We allow if ID strictly matches 'loc_nameless_hub' or Name is strict match, to be safe.
            const validHubs = [
                HUB_LOCATION_ID,
                LEGACY_ZERO_UUID
            ];

            // Check using the hubState from store if possible, or fallback to UUID check
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
        setNodes([...nodes, {
            id: `node_${Date.now()}`,
            type: 'text',
            text: '新しいテキスト',
            choices: []
        }]);
    };

    const handleRemoveNode = (index: number) => {
        const newNodes = [...nodes];
        newNodes.splice(index, 1);
        setNodes(newNodes);
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
            const res = await fetch('/api/ugc/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
                setQuestId(data.questId);
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
            const res = await fetch('/api/ugc/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: questId,
                    userId: userProfile?.id,
                    payload: { title, shortDescription, fullDescription, startLocationId, nodes, customReward }
                })
            });
            const data = await res.json();
            if (data.success) {
                setQuestId(data.questId);
                // Redirect to Quest Page with Test Play Flag
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
            const res = await fetch('/api/ugc/publish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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

    if (loading) {
        return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;
    }

    if (!loading && userProfile && worldState) {
        const validHubs = [HUB_LOCATION_ID, LEGACY_ZERO_UUID];
        const isHubName = worldState?.location_name === '名も無き旅人の拠所' || worldState?.location_name === '名もなき旅人の拠所';
        if (!validHubs.includes(userProfile.current_location_id || '') && !isHubName) {
            return null; // Redirecting
        }
    }

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-gray-200 font-sans p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                <header className="mb-8 border-b-2 border-purple-900/50 pb-4 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-serif text-purple-400 font-bold mb-2 flex items-center gap-2">
                            <span className="text-4xl">✍️</span> UGC Creator Portal
                        </h1>
                        <p className="text-gray-400 text-sm">名も無き旅人の拠所 - クエスト作成エディタ</p>
                    </div>
                    <button onClick={() => router.push('/inn')} className="text-gray-500 hover:text-white transition-colors text-sm">
                        酒場へ戻る ✕
                    </button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left Column: Quest Meta */}
                    <div className="col-span-1 space-y-6">
                        <section className="bg-[#1a1525] border border-purple-900/30 p-6 rounded shadow-lg">
                            <h2 className="text-xl font-bold text-purple-300 mb-4 border-b border-purple-900/50 pb-2">基本情報</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">クエスト名 (必須)</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        className="w-full bg-black/50 border border-purple-900/50 rounded p-2 text-white focus:border-purple-500 outline-none"
                                        placeholder="例: ゴブリンの討伐"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">一覧表示用テキスト (最大40文字)</label>
                                    <textarea
                                        value={shortDescription}
                                        onChange={e => setShortDescription(e.target.value.substring(0, 40))}
                                        className="w-full bg-black/50 border border-purple-900/50 rounded p-2 text-white focus:border-purple-500 outline-none h-16 resize-none"
                                        placeholder="ボードに表示される概要"
                                    />
                                    <div className="text-right text-[10px] text-gray-500">{shortDescription.length}/40</div>
                                </div>

                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">詳細フレーバーテキスト</label>
                                    <textarea
                                        value={fullDescription}
                                        onChange={e => setFullDescription(e.target.value)}
                                        className="w-full bg-black/50 border border-purple-900/50 rounded p-2 text-white focus:border-purple-500 outline-none h-32 resize-none"
                                        placeholder="クエストの詳細な背景など"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">出発拠点 (発生場所)</label>
                                    <select
                                        value={startLocationId}
                                        onChange={e => setStartLocationId(e.target.value)}
                                        className="w-full bg-black/50 border border-purple-900/50 rounded p-2 text-white focus:border-purple-500 outline-none"
                                    >
                                        {worldLocations.map(loc => (
                                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </section>

                        <CustomItemEditor value={customReward} onChange={setCustomReward} />

                        <section className="bg-[#1a1525] border border-purple-900/30 p-6 rounded shadow-lg flex flex-col gap-3 mt-6">
                            <h2 className="text-xl font-bold text-gray-300 mb-2 border-b border-gray-700 pb-2">アクション</h2>
                            <button
                                onClick={handleSaveDraft}
                                disabled={isSaving}
                                className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white p-3 rounded transition-colors font-bold border border-gray-600 disabled:opacity-50"
                            >
                                <Save className="w-5 h-5" /> {isSaving ? '保存中...' : '下書き保存 (Draft)'}
                            </button>
                            <button
                                onClick={handleTestPlay}
                                disabled={isSaving || nodes.length === 0}
                                className="flex items-center justify-center gap-2 bg-purple-900 hover:bg-purple-800 text-purple-100 p-3 rounded transition-colors font-bold border border-purple-600 disabled:opacity-50"
                            >
                                ⚔️ テストプレイ開始
                            </button>
                            <button
                                onClick={handlePublish}
                                disabled={!isTested || isSaving || !userProfile || userProfile.gold < publishTax}
                                className={`flex items-center justify-center gap-2 p-3 rounded transition-colors font-bold border ${isTested && userProfile && userProfile.gold >= publishTax ? 'bg-indigo-900 hover:bg-indigo-800 text-indigo-100 border-indigo-600' : 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed opacity-50'}`}
                                title={!isTested ? "テストプレイをクリアする必要があります" : userProfile && userProfile.gold < publishTax ? `所持金が不足しています（必要: ${publishTax}G）` : "審査申請を行います"}
                            >
                                <Send className="w-5 h-5" /> 審査申請 (Submit) - 費用: {publishTax}G
                            </button>
                            <div className="text-[10px] text-gray-500 mt-2">
                                ※申請時、報酬価値に応じたパブリッシュ税（基本税100G ＋ アイテム価値等）が引き落とされます。
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Node Editor */}
                    <div className="col-span-1 md:col-span-2 space-y-4">
                        <div className="flex justify-between items-end mb-2">
                            <h2 className="text-2xl font-bold text-gray-200">シナリオ・ノード構築</h2>
                            <div className="text-sm text-gray-400">ノード数: {nodes.length}/20</div>
                        </div>

                        {nodes.length === 0 ? (
                            <div className="bg-black/40 border border-dashed border-gray-700 rounded-lg p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-4">
                                <ShieldAlert className="w-12 h-12 opacity-50" />
                                <p>ノードがありません。<br />最初のノードを追加してクエストを構築しましょう。</p>
                                <button onClick={handleAddNode} className="bg-purple-900/50 text-purple-300 px-4 py-2 rounded border border-purple-700/50 hover:bg-purple-800/50 transition-colors mt-2">
                                    + 最初のノードを追加
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {nodes.map((node, index) => (
                                    <div key={node.id} className="bg-[#1a1a24] border border-gray-700 rounded-lg p-4 relative group transition-all hover:border-purple-500/50">
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleRemoveNode(index)} className="text-red-500 hover:bg-red-900/30 p-1 rounded">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="flex gap-4 mb-4">
                                            <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-xl font-bold border-2 border-gray-700 text-gray-500 shrink-0">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1 space-y-3">
                                                <div className="flex gap-2">
                                                    <select
                                                        value={node.type}
                                                        onChange={(e) => handleUpdateNode(index, { type: e.target.value })}
                                                        className="bg-black border border-gray-600 rounded p-1 text-sm text-gray-300 outline-none"
                                                    >
                                                        <option value="text">テキスト / 会話</option>
                                                        <option value="battle">バトル進行</option>
                                                        <option value="check_delivery">アイテム納品</option>
                                                        <option value="hire_mercenary">同行NPC追加</option>
                                                    </select>
                                                    <input
                                                        type="text"
                                                        placeholder="ノードID (例: start, battle_1)"
                                                        value={node.id}
                                                        onChange={(e) => handleUpdateNode(index, { id: e.target.value })}
                                                        className="bg-black border border-gray-600 rounded p-1 text-sm text-gray-300 outline-none flex-1 font-mono"
                                                    />
                                                </div>

                                                {/* Node Content based on Type */}
                                                {node.type === 'text' && (
                                                    <textarea
                                                        value={node.text}
                                                        onChange={(e) => handleUpdateNode(index, { text: e.target.value })}
                                                        className="w-full bg-black/50 border border-gray-600 rounded p-2 text-white focus:border-purple-500 outline-none h-20 resize-none text-sm"
                                                        placeholder="テキスト本文を入力"
                                                    />
                                                )}

                                                {node.type === 'battle' && (
                                                    <div className="mt-2">
                                                        <EnemyEditor
                                                            value={node.enemyData || { name: 'スライム', level: 1, hp: 50, atk: 5, def: 5, image_url: '', skills: [] }}
                                                            onChange={(newEnemy) => handleUpdateNode(index, { enemyData: newEnemy })}
                                                        />
                                                    </div>
                                                )}

                                                {node.type === 'hire_mercenary' && (
                                                    <div className="bg-blue-900/20 border border-blue-900 p-3 rounded text-sm text-blue-200">
                                                        <label className="block text-xs mb-1 text-blue-400">NPC名</label>
                                                        <input
                                                            type="text"
                                                            placeholder="同行者名"
                                                            value={node.npcName || ''}
                                                            onChange={(e) => handleUpdateNode(index, { npcName: e.target.value })}
                                                            className="w-full bg-black border border-blue-900/50 rounded p-2 outline-none mb-2"
                                                        />
                                                        <label className="block text-xs mb-1 text-blue-400">画像URL</label>
                                                        <input
                                                            type="text"
                                                            placeholder="https://..."
                                                            value={node.npcImageUrl || ''}
                                                            onChange={(e) => handleUpdateNode(index, { npcImageUrl: e.target.value })}
                                                            className="w-full bg-black border border-blue-900/50 rounded p-2 outline-none"
                                                        />
                                                    </div>
                                                )}

                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {nodes.length < 20 && (
                                    <button
                                        onClick={handleAddNode}
                                        className="w-full py-4 bg-transparent border-2 border-dashed border-gray-700 hover:border-purple-600 hover:bg-purple-900/10 text-gray-400 hover:text-purple-300 rounded-lg flex items-center justify-center gap-2 transition-all font-bold"
                                    >
                                        <Plus className="w-5 h-5" /> 次のノードを追加
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
