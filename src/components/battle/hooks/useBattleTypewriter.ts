import { useState, useRef, useCallback } from 'react';

export interface BattleTypewriterResult {
    // Display state
    displayedLogs: string[];
    typingText: string;
    isTypingDone: boolean;
    liveHp: number | null;
    livePartyDurability: Record<string, number>;

    // Refs used by BattleView
    typingQueue: React.MutableRefObject<string[]>;
    isTypingRef: React.MutableRefObject<boolean>;

    // Actions
    setLiveHp: (hp: number | null) => void;
    setTypingText: React.Dispatch<React.SetStateAction<string>>;
    setLivePartyDurability: React.Dispatch<React.SetStateAction<Record<string, number>>>;
    setDisplayedLogs: React.Dispatch<React.SetStateAction<string[]>>;
    setIsTypingDone: React.Dispatch<React.SetStateAction<boolean>>;
    processQueue: () => void;
    flushQueue: () => void;
    enqueuedUpToRef: React.MutableRefObject<number>;
}

/**
 * useBattleTypewriter
 *
 * バトルログのタイプライター表示・キュー管理・HP同期を担うカスタムフック。
 * BattleView.tsx から抽出。
 */
export function useBattleTypewriter(initialHp?: number | null): BattleTypewriterResult {
    const [displayedLogs, setDisplayedLogs] = useState<string[]>([]);
    const [typingText, setTypingText] = useState<string>('');
    const [isTypingDone, setIsTypingDone] = useState(true);
    const [liveHp, setLiveHp] = useState<number | null>(initialHp ?? null);
    const [livePartyDurability, setLivePartyDurability] = useState<Record<string, number>>({});

    const typingQueue = useRef<string[]>([]);
    const isTypingRef = useRef(false);
    const currentTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const enqueuedUpToRef = useRef(0);

    // キューを即時フラッシュ（NEXT ボタンで早送り）
    const flushQueue = useCallback(() => {
        if (currentTimerRef.current) {
            clearInterval(currentTimerRef.current);
            currentTimerRef.current = null;
        }
        const remaining = typingQueue.current.filter(m => !m.startsWith('__'));
        typingQueue.current = [];
        isTypingRef.current = false;
        if (remaining.length > 0) {
            setDisplayedLogs(prev => [...prev, ...remaining]);
        }
        setTypingText('');
        setIsTypingDone(true);
    }, []);

    // タイプライターキューを1件処理
    const processQueue = useCallback(() => {
        if (typingQueue.current.length === 0 && !isTypingRef.current) {
            setIsTypingDone(true);
            return;
        }
        if (isTypingRef.current || typingQueue.current.length === 0) return;

        const message = typingQueue.current.shift()!;

        // __hp_sync:NNN — HPバーのみ更新（表示しない）
        if (message.startsWith('__hp_sync:')) {
            const newHp = parseInt(message.slice(10), 10);
            if (!isNaN(newHp)) setLiveHp(newHp);
            setTimeout(() => processQueue(), 0);
            return;
        }

        // __party_sync:ID:DUR — パーティHPバーのみ更新（表示しない）
        if (message.startsWith('__party_sync:')) {
            const parts = message.slice(13).split(':');
            const memberId = parts[0];
            const newDur = parseInt(parts[1], 10);
            if (memberId && !isNaN(newDur)) {
                setLivePartyDurability(prev => ({ ...prev, [memberId]: newDur }));
            }
            setTimeout(() => processQueue(), 0);
            return;
        }

        // ターン区切り（--- ターン N ---）は即時表示
        if (/^--- .+ ---$/.test(message)) {
            setDisplayedLogs(prev => [...prev, message]);
            setTypingText('');
            if (typingQueue.current.length === 0) {
                setIsTypingDone(true);
            } else {
                setTimeout(() => processQueue(), 80);
            }
            return;
        }

        // 通常メッセージ: タイプライター
        isTypingRef.current = true;
        setIsTypingDone(false);
        let charIdx = 0;
        setTypingText('');

        const timerId = setInterval(() => {
            charIdx++;
            if (charIdx <= message.length) {
                setTypingText(message.slice(0, charIdx));
            } else {
                clearInterval(timerId);
                if (currentTimerRef.current === timerId) currentTimerRef.current = null;
                setDisplayedLogs(prev => [...prev, message]);
                setTypingText('');
                isTypingRef.current = false;
                if (typingQueue.current.length > 0) {
                    setTimeout(() => processQueue(), 80);
                } else {
                    setIsTypingDone(true);
                }
            }
        }, 20);
        currentTimerRef.current = timerId;
    }, []);

    return {
        displayedLogs,
        typingText,
        isTypingDone,
        liveHp,
        livePartyDurability,
        typingQueue,
        isTypingRef,
        setLiveHp,
        setTypingText,
        setLivePartyDurability,
        setDisplayedLogs,
        setIsTypingDone,
        processQueue,
        flushQueue,
        enqueuedUpToRef,
    };
}
