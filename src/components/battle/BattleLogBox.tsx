import React, { useEffect, useState, useRef } from 'react';

interface BattleLogBoxProps {
    displayedLogs: string[];
    activeMessage: string | null;
    onMessageComplete: () => void;
    partyNames?: string[];
}

export const BattleLogBox: React.FC<BattleLogBoxProps> = React.memo(({
    displayedLogs,
    activeMessage,
    onMessageComplete,
    partyNames = []
}) => {
    const logContainerRef = useRef<HTMLDivElement>(null);
    const logEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll logs
    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [displayedLogs, activeMessage]);

    return (
        <div className="relative z-20 px-3 w-full flex-shrink-0 drop-shadow-md">
            <div
                ref={logContainerRef}
                className="bg-black/60 backdrop-blur-lg border border-white/20 rounded p-1.5 text-[10px] font-mono leading-relaxed h-[5.5rem] overflow-y-auto scroll-smooth shadow-inner"
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}
            >
                {displayedLogs.map((log, idx) => {
                    const isLatest = idx === displayedLogs.length - 1 && !activeMessage;
                    
                    // Log color categories: Player (green), Enemy (red), Party (blue), System (yellow)
                    const isPlayerLog = log.includes('あなた') || log.includes('を使用') || log.includes('のダメージ！');
                    const isEnemyLog = log.includes('の行動') || log.includes('に攻撃') || (log.includes('あなたに') && log.includes('ダメージ'));
                    const isPartyLog = log.includes('がかばった') || log.includes('パーティ') || partyNames.some(name => log.startsWith(name));
                    const isSystemLog = log.startsWith('---') || log.includes('勝利') || log.includes('敗北') || log.includes('ターゲット') || log.includes('逃') || log.includes('力尽きた') || log.includes('全ての敵');
                    
                    let logColor = isLatest ? 'text-white drop-shadow' : 'text-slate-300 drop-shadow opacity-80';
                    let bulletColor = isLatest ? 'text-amber-400 drop-shadow' : 'text-slate-500 drop-shadow';
                    
                    if (isSystemLog) {
                        logColor = isLatest ? 'text-yellow-300 drop-shadow' : 'text-yellow-600 drop-shadow';
                        bulletColor = 'text-yellow-500 drop-shadow';
                    } else if (isEnemyLog) {
                        logColor = isLatest ? 'text-red-300 drop-shadow' : 'text-red-700 drop-shadow';
                        bulletColor = 'text-red-500 drop-shadow';
                    } else if (isPartyLog) {
                        logColor = isLatest ? 'text-sky-300 drop-shadow' : 'text-sky-600 drop-shadow';
                        bulletColor = 'text-sky-400 drop-shadow';
                    } else if (isPlayerLog) {
                        logColor = isLatest ? 'text-green-300 drop-shadow' : 'text-green-600 drop-shadow';
                        bulletColor = 'text-green-500 drop-shadow';
                    }
                    
                    return (
                        <div key={idx} className={`flex gap-1.5 ${logColor} ${isLatest ? 'font-bold' : ''}`}>
                            <span className={`shrink-0 ${bulletColor}`}>▸</span>
                            <span className="break-all">{log}</span>
                        </div>
                    );
                })}
                
                {activeMessage && (
                    <TypewriterLine
                        message={activeMessage}
                        onComplete={onMessageComplete}
                    />
                )}
                <div ref={logEndRef} />
            </div>
        </div>
    );
});

BattleLogBox.displayName = 'BattleLogBox';

// A local line component to isolate the typewriter state updates
const TypewriterLine: React.FC<{ message: string; onComplete: () => void }> = ({ message, onComplete }) => {
    const [typedText, setTypedText] = useState('');
    const onCompleteRef = useRef(onComplete);
    onCompleteRef.current = onComplete;

    useEffect(() => {
        setTypedText('');
        let charIdx = 0;
        const timerId = setInterval(() => {
            charIdx++;
            if (charIdx <= message.length) {
                setTypedText(message.slice(0, charIdx));
            } else {
                clearInterval(timerId);
                onCompleteRef.current();
            }
        }, 20);

        return () => {
            clearInterval(timerId);
        };
    }, [message]);

    return (
        <div className="flex gap-1.5 text-slate-200 font-bold">
            <span className="shrink-0 text-amber-500">▸</span>
            <span className="break-all">{typedText}<span className="animate-pulse text-amber-400">|</span></span>
        </div>
    );
};
