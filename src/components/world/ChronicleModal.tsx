import React from 'react';
import { Newspaper, X, Share2, Globe, MapPin } from 'lucide-react';
import XShareButton from '../shared/XShareButton';

interface HistoryEvent {
    id: string;
    event_type: 'prosperity_change' | 'alignment_change';
    message: string;
    old_value: string;
    new_value: string;
    created_at: string;
    location?: { name: string };
}

interface ChronicleModalProps {
    events: HistoryEvent[];
    onClose: () => void;
}

export default function ChronicleModal({ events, onClose }: ChronicleModalProps) {
    if (events.length === 0) return null;

    const latestEvent = events[0];

    // Generate aggregate share text
    const locationName = latestEvent.location?.name || '各地';
    const shareText = events.length === 1
        ? latestEvent.message + " #WirthDawn #CWD #歴史の証人"
        : `「世界が動き始めた。${locationName}での変革を含む${events.length}件の情勢変化を確認した。歴史は、止まらない。」 #WirthDawn #CWD #歴史の証人`;

    // OGPシェアURL構築
    const isCollapse = events.some(e => e.new_value === 'Ruined');
    const triggerSlug = isCollapse ? 'world_collapse' : 'world_change';
    const shareUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/share?t=${triggerSlug}&location=${encodeURIComponent(locationName)}&description=${encodeURIComponent(latestEvent.message)}`
        : undefined;

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
            <div className="relative w-full max-w-sm bg-[#f4e4bc] text-gray-900 shadow-[0_0_50px_rgba(0,0,0,0.8)] border-[12px] border-[#2c1810] rounded-sm overflow-hidden flex flex-col max-h-[90vh]">

                {/* Newspaper Header */}
                <div className="bg-[#2c1810] p-4 text-[#f4e4bc] text-center border-b-4 border-double border-[#f4e4bc]/30">
                    <div className="flex items-center justify-center gap-2 mb-1">
                        <Newspaper className="w-5 h-5 text-amber-500" />
                        <span className="font-serif font-black text-2xl tracking-[0.3em] text-amber-100">号外</span>
                    </div>
                    <div className="text-[10px] opacity-70 font-mono">WORLD EXTRA EDITION - {new Date().toLocaleDateString()}</div>
                </div>

                <div className="p-6 overflow-y-auto flex-1 font-serif">
                    <div className="text-center mb-6">
                        <h2 className="text-3xl font-black text-[#2c1810] mb-2 leading-tight border-y-2 border-[#2c1810] py-2">
                            世界情勢：激動の刻
                        </h2>
                    </div>

                    <div className="space-y-8">
                        {events.map((event, idx) => (
                            <div key={event.id} className={`space-y-2 ${idx !== 0 ? 'border-t border-[#2c1810]/20 pt-6' : ''}`}>
                                <div className="flex items-center gap-2 text-[#8b4513] font-bold text-xs">
                                    <MapPin className="w-3 h-3" />
                                    <span>{event.location?.name || '未知の領域'}</span>
                                    <span className="ml-auto opacity-50">{new Date(event.created_at).toLocaleTimeString()}</span>
                                </div>
                                <p className="text-lg leading-relaxed font-bold italic text-[#2c1810]">
                                    {event.message}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Flavor Text / Filler */}
                    <div className="mt-10 pt-6 border-t-4 border-double border-[#2c1810]/20 text-[10px] text-gray-600 italic text-center">
                        ※本紙は宿屋組合の提供でお送りしております。
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-[#2c1810]/5 border-t border-[#2c1810]/10 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#2c1810]/70 font-serif">歴史を刻む：</span>
                        <XShareButton
                            text={shareText}
                            shareUrl={shareUrl}
                            iconOnly={true}
                            className="!w-10 !h-10 !p-0 !bg-[#2c1810] !text-[#f4e4bc] hover:!bg-[#4a2c1e] !rounded-full shadow-md flex items-center justify-center"
                        />
                    </div>
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-[#2c1810] hover:bg-[#4a2c1e] text-[#f4e4bc] text-xs font-bold rounded transition-colors shadow-md font-serif"
                    >
                        閉じる
                    </button>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-black/20 to-transparent pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-black/20 to-transparent pointer-events-none" />
            </div>
        </div>
    );
}
