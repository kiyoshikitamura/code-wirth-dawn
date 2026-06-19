import { useState, useRef, useCallback } from 'react';

export interface BattleTypewriterResult {
    // Display state
    displayedLogs: string[];
    activeMessage: string | null;
    isTypingDone: boolean;
    liveHp: number | null;
    livePartyDurability: Record<string, number>;

    // Refs used by BattleView
    typingQueue: React.MutableRefObject<string[]>;
    isTypingRef: React.MutableRefObject<boolean>;

    // Actions
    setLiveHp: (hp: number | null) => void;
    setLivePartyDurability: React.Dispatch<React.SetStateAction<Record<string, number>>>;
    setDisplayedLogs: React.Dispatch<React.SetStateAction<string[]>>;
    setIsTypingDone: React.Dispatch<React.SetStateAction<boolean>>;
    processQueue: () => void;
    flushQueue: () => void;
    completeActiveMessage: () => void;
    enqueuedUpToRef: React.MutableRefObject<number>;
}

/**
 * useBattleTypewriter
 *
 * バトルログのタイプライター表示・キュー管理・HP同期を担うカスタムフック。
 * BattleView.tsx から抽出。
 */
export function useBattleTypewriter(initialHp?: number | null, onMessageStart?: (msg: string) => void): BattleTypewriterResult {
    const [displayedLogs, setDisplayedLogs] = useState<string[]>([]);
    const [activeMessage, setActiveMessage] = useState<string | null>(null);
    const [isTypingDone, setIsTypingDone] = useState(true);
    const [liveHp, setLiveHp] = useState<number | null>(initialHp ?? null);
    const [livePartyDurability, setLivePartyDurability] = useState<Record<string, number>>({});

    const typingQueue = useRef<string[]>([]);
    const isTypingRef = useRef(false);
    const enqueuedUpToRef = useRef(0);

    const completeActiveMessage = useCallback(() => {
        if (!isTypingRef.current || !activeMessage) return;

        setDisplayedLogs(prev => [...prev, activeMessage]);
        setActiveMessage(null);
        isTypingRef.current = false;

        if (typingQueue.current.length > 0) {
            setTimeout(() => processQueue(), 80);
        } else {
            setIsTypingDone(true);
        }
    }, [activeMessage]);

    // キューを即時フラッシュ（NEXT ボタンで早送り）
    const flushQueue = useCallback(() => {
        const remaining = [
            ...(activeMessage ? [activeMessage] : []),
            ...typingQueue.current.filter(m => !m.startsWith('__'))
        ];
        typingQueue.current = [];
        isTypingRef.current = false;
        setActiveMessage(null);
        if (remaining.length > 0) {
            setDisplayedLogs(prev => [...prev, ...remaining]);
        }
        setIsTypingDone(true);
    }, [activeMessage]);

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
            if (typingQueue.current.length === 0) {
                setIsTypingDone(true);
            } else {
                setTimeout(() => processQueue(), 80);
            }
            return;
        }

        // 通常メッセージ: 子コンポーネントでタイプライターさせる
        isTypingRef.current = true;
        setIsTypingDone(false);
        if (onMessageStart) onMessageStart(message);
        setActiveMessage(message);
    }, [onMessageStart]);

    return {
        displayedLogs,
        activeMessage,
        isTypingDone,
        liveHp,
        livePartyDurability,
        typingQueue,
        isTypingRef,
        setLiveHp,
        setLivePartyDurability,
        setDisplayedLogs,
        setIsTypingDone,
        processQueue,
        flushQueue,
        completeActiveMessage,
        enqueuedUpToRef,
    };
}
