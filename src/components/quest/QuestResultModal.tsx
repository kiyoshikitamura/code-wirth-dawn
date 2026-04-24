
import React from 'react';
import { Shield, Heart, Zap, Award, Coins, Trophy, Clock, MapPin, Users, LogOut, Star, Swords, ArrowDown, XCircle } from 'lucide-react';
import XShareButton from '../shared/XShareButton';

interface LevelUpInfo {
    // API response fields (from questService.calculateGrowth)
    level_up?: boolean;
    new_level?: number;
    hp_increase?: number;
    atk_increase?: number;
    def_increase?: number;
    new_max_hp?: number;
    new_max_cost?: number;
    // Legacy/fallback fields
    oldLevel?: number;
    newLevel?: number;
    hpDiff?: number;
    costDiff?: number;
    newHp?: number;
    newCost?: number;
}

interface QuestChanges {
    gold_gained: number;
    old_age: number;
    new_age: number;
    aged_up: boolean;
    vit_penalty: number;
    atk_decay: number;
    def_decay: number;
    level_up?: LevelUpInfo;
}

interface RepChange {
    amount: number;
    location: string;
}

interface PartyChange {
    name: string;
    oldDurability: number;
    newDurability: number;
    perished: boolean;
    memento?: string | null;
}

interface GuestConversion {
    name: string;
    success: boolean;
    reason?: string;
}

interface QuestResultModalProps {
    onClose: () => void;
    result: 'success' | 'failure';
    questTitle?: string;
    changes: QuestChanges;
    rewards: any;
    daysPassed: number;
    shareText?: string;
    repChange?: RepChange | null;
    partyChanges?: PartyChange[];
    newLocationName?: string | null;
    earnedExp?: number;
    lootSaved?: any[];
    guestConversion?: GuestConversion | null;
}

export default function QuestResultModal({
    onClose, result, questTitle, changes, rewards, daysPassed, shareText,
    repChange, partyChanges, newLocationName, earnedExp, lootSaved, guestConversion
}: QuestResultModalProps) {
    const { level_up, gold_gained, aged_up } = changes;
    const isSuccess = result === 'success';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
            <div className="bg-gray-900 border border-amber-500/50 rounded-lg max-w-md w-full shadow-2xl relative my-8">
                <div className="absolute inset-0 bg-gradient-to-b from-amber-900/20 to-transparent pointer-events-none rounded-lg" />

                {/* ── §1 ヘッダー ── */}
                <header className="p-5 text-center border-b border-gray-800 relative z-10">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-widest mb-2 ${
                        isSuccess
                            ? 'bg-amber-900/40 border border-amber-600/50 text-amber-400'
                            : 'bg-red-900/40 border border-red-600/50 text-red-400'
                    }`}>
                        {isSuccess ? <Trophy className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {isSuccess ? 'クエスト完了' : 'クエスト失敗'}
                    </div>
                    {questTitle && (
                        <h2 className="text-lg font-serif font-bold text-slate-200 mt-1">「{questTitle}」</h2>
                    )}
                    <div className="w-16 h-0.5 bg-amber-600/50 mx-auto mt-2 rounded-full" />
                </header>

                <div className="p-5 space-y-4 relative z-10">

                    {/* ── §2 報酬セクション ── */}
                    {isSuccess && (gold_gained > 0 || earnedExp || repChange) && (
                        <section>
                            <h3 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                <Award className="w-3 h-3" /> 報酬
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                {gold_gained > 0 && (
                                    <div className="flex items-center gap-2.5 bg-black/40 p-2.5 rounded border border-gray-800">
                                        <div className="p-1.5 bg-amber-900/30 rounded-full text-amber-400">
                                            <Coins className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-amber-300 font-bold text-sm">+{gold_gained} G</div>
                                            <div className="text-[9px] text-gray-600">報酬金</div>
                                        </div>
                                    </div>
                                )}
                                {(earnedExp ?? 0) > 0 && (
                                    <div className="flex items-center gap-2.5 bg-black/40 p-2.5 rounded border border-gray-800">
                                        <div className="p-1.5 bg-blue-900/30 rounded-full text-blue-400">
                                            <Star className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-blue-300 font-bold text-sm">+{earnedExp} Exp</div>
                                            <div className="text-[9px] text-gray-600">経験値</div>
                                        </div>
                                    </div>
                                )}
                                {repChange && repChange.amount !== 0 && (
                                    <div className="flex items-center gap-2.5 bg-black/40 p-2.5 rounded border border-gray-800 col-span-2">
                                        <div className={`p-1.5 rounded-full ${repChange.amount > 0 ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'}`}>
                                            <Shield className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className={`font-bold text-sm ${repChange.amount > 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                                                {repChange.amount > 0 ? '+' : ''}{repChange.amount} 名声
                                            </div>
                                            <div className="text-[9px] text-gray-600">{repChange.location}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            {/* ドロップアイテム */}
                            {lootSaved && lootSaved.length > 0 && (
                                <div className="mt-2 space-y-1">
                                    {lootSaved.map((loot: any, i: number) => (
                                        <div key={i} className="flex items-center gap-2 bg-black/30 px-2.5 py-1.5 rounded border border-gray-800 text-xs">
                                            <span className="text-purple-400">📦</span>
                                            <span className="text-slate-300">{loot.name || `Item #${loot.itemId}`}</span>
                                            <span className="text-gray-500 ml-auto">x{loot.quantity || 1}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    )}

                    {/* 失敗時の名声ペナルティ */}
                    {!isSuccess && repChange && repChange.amount !== 0 && (
                        <section>
                            <div className="flex items-center gap-2.5 bg-red-950/30 p-2.5 rounded border border-red-900/50">
                                <div className="p-1.5 bg-red-900/30 rounded-full text-red-400">
                                    <Shield className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="text-red-300 font-bold text-sm">{repChange.amount} 名声</div>
                                    <div className="text-[9px] text-gray-500">{repChange.location} での評判が下がった</div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* ── §3 キャラクター変化セクション ── */}
                    {(level_up || aged_up || (changes.atk_decay > 0) || (changes.def_decay > 0)) && (
                        <section>
                            <h3 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                <Swords className="w-3 h-3" /> キャラクター変化
                            </h3>
                            <div className="space-y-2">
                                {/* レベルアップ */}
                                {level_up && (() => {
                                    const lvNew = level_up.new_level ?? level_up.newLevel ?? 0;
                                    const lvOld = level_up.oldLevel ?? (lvNew - 1);
                                    const hpInc = level_up.hp_increase ?? level_up.hpDiff ?? 0;
                                    const atkInc = level_up.atk_increase ?? 0;
                                    const defInc = level_up.def_increase ?? 0;
                                    const newMaxHp = level_up.new_max_hp ?? level_up.newHp ?? 0;
                                    const newMaxCost = level_up.new_max_cost ?? level_up.newCost ?? 0;
                                    return (
                                    <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-500/50 p-3 rounded-lg relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-3 opacity-10">
                                            <Award className="w-16 h-16 text-white" />
                                        </div>
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">レベルアップ！</span>
                                            </div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-gray-400 text-sm">Lv.{lvOld}</span>
                                                <span className="text-blue-400 text-xs">▸</span>
                                                <span className="text-2xl font-bold text-white">Lv.{lvNew}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                {hpInc > 0 && (
                                                    <div className="flex items-center gap-1.5 text-green-300">
                                                        <Heart className="w-3.5 h-3.5" />
                                                        <span>最大HP +{hpInc} ({newMaxHp})</span>
                                                    </div>
                                                )}
                                                {atkInc > 0 && (
                                                    <div className="flex items-center gap-1.5 text-red-300">
                                                        <Swords className="w-3.5 h-3.5" />
                                                        <span>ATK +{atkInc}</span>
                                                    </div>
                                                )}
                                                {defInc > 0 && (
                                                    <div className="flex items-center gap-1.5 text-blue-300">
                                                        <Shield className="w-3.5 h-3.5" />
                                                        <span>DEF +{defInc}</span>
                                                    </div>
                                                )}
                                                {newMaxCost > 0 && (
                                                    <div className="flex items-center gap-1.5 text-cyan-300">
                                                        <Zap className="w-3.5 h-3.5" />
                                                        <span>デッキコスト {newMaxCost}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    );
                                })()}

                                {/* 加齢 */}
                                {aged_up && (
                                    changes.vit_penalty > 0 ? (
                                        <div className="relative overflow-hidden rounded-lg border border-red-900/50 bg-black/80 p-4 text-center">
                                            <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(80,0,0,0.4)_0%,transparent_70%)] animate-pulse pointer-events-none" />
                                            <div className="relative z-10 space-y-1.5">
                                                <div className="text-red-600 font-serif font-bold text-base tracking-widest">⚠ 老化の兆候 ⚠</div>
                                                <div className="text-gray-400 text-xs">{changes.new_age}歳の誕生日を迎えました...</div>
                                                <div className="flex items-center justify-center gap-3 mt-2">
                                                    <div className="flex items-center gap-1 text-sm text-red-400">
                                                        <Heart className="w-4 h-4" />
                                                        <span>体力上限 -{changes.vit_penalty}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-amber-900/20 border border-amber-500/30 p-3 rounded flex items-center gap-3">
                                            <div className="p-2 bg-amber-900/50 rounded-full text-amber-500">
                                                <Zap className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="text-amber-300 font-bold text-sm">誕生日おめでとう！</div>
                                                <div className="text-xs text-amber-400">
                                                    無事に {changes.new_age} 歳を迎えました。
                                                </div>
                                            </div>
                                        </div>
                                    )
                                )}

                                {/* ATK/DEF減衰 */}
                                {(changes.atk_decay > 0 || changes.def_decay > 0) && (
                                    <div className="flex gap-2">
                                        {changes.atk_decay > 0 && (
                                            <div className="flex-1 flex items-center gap-2 bg-red-950/20 border border-red-900/40 rounded px-2.5 py-1.5 text-xs">
                                                <ArrowDown className="w-3 h-3 text-red-400" />
                                                <span className="text-red-300">攻撃力 -{changes.atk_decay}</span>
                                                <span className="text-gray-600 text-[9px]">（加齢）</span>
                                            </div>
                                        )}
                                        {changes.def_decay > 0 && (
                                            <div className="flex-1 flex items-center gap-2 bg-blue-950/20 border border-blue-900/40 rounded px-2.5 py-1.5 text-xs">
                                                <ArrowDown className="w-3 h-3 text-blue-400" />
                                                <span className="text-blue-300">防御力 -{changes.def_decay}</span>
                                                <span className="text-gray-600 text-[9px]">（加齢）</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {/* ── §4 時間経過 & 移動 ── */}
                    <section className="flex items-center gap-3 text-xs border-t border-gray-800 pt-3">
                        <div className="flex items-center gap-1.5 text-gray-400">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{daysPassed}日が経過</span>
                        </div>
                        {newLocationName && (
                            <div className="flex items-center gap-1.5 text-cyan-400 ml-auto">
                                <MapPin className="w-3.5 h-3.5" />
                                <span>{newLocationName} に到着</span>
                            </div>
                        )}
                    </section>

                    {/* ── §5 パーティ状態 ── */}
                    {partyChanges && partyChanges.length > 0 && (
                        <section className="border-t border-gray-800 pt-3">
                            <h3 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                <Users className="w-3 h-3" /> パーティ状態
                            </h3>
                            <div className="space-y-1.5">
                                {partyChanges.map((pc, i) => (
                                    <div key={i} className={`flex items-center justify-between px-2.5 py-1.5 rounded text-xs ${
                                        pc.perished ? 'bg-orange-950/20 border border-orange-900/40' : 'bg-black/30 border border-gray-800'
                                    }`}>
                                        <div className="flex items-center gap-2">
                                            {pc.perished ? (
                                                <LogOut className="w-3.5 h-3.5 text-orange-400" />
                                            ) : (
                                                <Users className="w-3.5 h-3.5 text-slate-500" />
                                            )}
                                            <span className={pc.perished ? 'text-orange-300' : 'text-slate-300'}>{pc.name}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            {pc.perished ? (
                                                <span className="text-orange-400 font-bold">離脱</span>
                                            ) : (
                                                <span className="text-gray-400 font-mono">
                                                    VIT {pc.oldDurability} ▸ {pc.newDurability}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {partyChanges.filter(pc => pc.perished && pc.memento).map((pc, i) => (
                                    <div key={`m-${i}`} className="flex items-center gap-2 px-2.5 py-1.5 bg-purple-950/20 border border-purple-800/30 rounded text-xs">
                                        <span className="text-purple-400">📦</span>
                                        <span className="text-purple-300">{pc.name} の形見「{pc.memento}」を獲得</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* ── §5.5 ゲストNPC正式加入通知 ── */}
                    {guestConversion && (
                        <section className="border-t border-gray-800 pt-3">
                            {guestConversion.success ? (
                                <div className="flex items-center gap-3 bg-gradient-to-r from-amber-900/30 to-amber-950/20 border border-amber-600/40 rounded-lg p-3">
                                    <div className="p-2 bg-amber-900/50 rounded-full text-amber-400 shrink-0">
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-amber-300 font-bold text-sm">🤝 {guestConversion.name} が正式にパーティに加入！</div>
                                        <div className="text-[9px] text-amber-500/70 mt-0.5">これからは常に共に旅を続けます。</div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 bg-slate-900/50 border border-slate-700/50 rounded-lg p-3">
                                    <div className="p-2 bg-slate-800 rounded-full text-slate-500 shrink-0">
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-slate-400 text-xs">{guestConversion.name} の加入を見送り</div>
                                        <div className="text-[9px] text-slate-600 mt-0.5">{guestConversion.reason}</div>
                                    </div>
                                </div>
                            )}
                        </section>
                    )}

                    {/* ── シェアセクション ── */}
                    {shareText && (
                        <section className="border-t border-gray-800 pt-3">
                            <div className="bg-amber-900/10 border border-amber-500/20 p-3 rounded-lg space-y-2">
                                <div className="flex items-center gap-1.5 text-amber-500 font-bold text-[10px]">
                                    <Trophy className="w-3 h-3" />
                                    <span>冒険を共有しよう</span>
                                </div>
                                <p className="text-gray-300 text-xs italic leading-relaxed">
                                    "{shareText.length > 80 ? shareText.substring(0, 80) + '...' : shareText}"
                                </p>
                                <XShareButton text={shareText} variant="large" />
                            </div>
                        </section>
                    )}
                </div>

                <footer className="p-4 bg-black/40 text-center border-t border-gray-800 relative z-10">
                    <button
                        onClick={onClose}
                        className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 px-6 rounded transition-colors shadow-lg hover:shadow-amber-500/20"
                    >
                        冒険を続ける
                    </button>
                </footer>
            </div>
        </div>
    );
}
