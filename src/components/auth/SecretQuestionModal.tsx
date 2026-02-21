
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface SecretQuestionModalProps {
    onClose: () => void; // Optional close (though usually forced)
    onSuccess: () => void;
}

const QUESTIONS = [
    "母親の旧姓は？",
    "最初のペットの名前は？",
    "卒業した小学校の名前は？",
    "好きな食べ物は？",
    "生まれた街は？"
];

export default function SecretQuestionModal({ onClose, onSuccess }: SecretQuestionModalProps) {
    const [question, setQuestion] = useState(QUESTIONS[0]);
    const [customQuestion, setCustomQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [isCustom, setIsCustom] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const finalQuestion = isCustom ? customQuestion : question;
        if (!finalQuestion || !answer) {
            setError("質問と回答を入力してください");
            setLoading(false);
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not authenticated");

            const { error: insertError } = await supabase
                .from('user_secrets')
                .upsert({
                    user_id: user.id,
                    question: finalQuestion,
                    answer: answer // Ideally hash this, but for verify via RLS comparison or server logic plain might be needed if naive matching
                });

            if (insertError) throw insertError;

            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Setup failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <div className="bg-[#1a0f0f] border border-red-900/50 p-6 rounded max-w-md w-full relative shadow-[0_0_30px_rgba(255,0,0,0.1)]">
                <h2 className="text-xl font-serif text-red-200 mb-2 text-center">魂の刻印</h2>
                <p className="text-xs text-gray-400 mb-6 text-center">
                    パスワードを忘れた際、本人確認のために使用する秘密の問いを設定してください。<br />
                    この問いは変更できません。慎重に選んでください。
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs text-red-300 mb-1">秘密の質問</label>
                        {!isCustom ? (
                            <select
                                value={question}
                                onChange={e => setQuestion(e.target.value)}
                                className="w-full bg-black/50 border border-red-900/30 p-2 text-gray-200 text-sm focus:border-red-500 outline-none mb-1"
                            >
                                {QUESTIONS.map(q => <option key={q} value={q}>{q}</option>)}
                            </select>
                        ) : (
                            <input
                                type="text"
                                value={customQuestion}
                                onChange={e => setCustomQuestion(e.target.value)}
                                className="w-full bg-black/50 border border-red-900/30 p-2 text-gray-200 text-sm focus:border-red-500 outline-none mb-1"
                                placeholder="独自の質問を入力"
                            />
                        )}
                        <button
                            type="button"
                            onClick={() => setIsCustom(!isCustom)}
                            className="text-xs text-gray-500 underline hover:text-gray-300"
                        >
                            {isCustom ? "既定の質問から選ぶ" : "自分で質問を作る"}
                        </button>
                    </div>

                    <div>
                        <label className="block text-xs text-red-300 mb-1">回答 (ひらがな・カタカナ推奨)</label>
                        <input
                            type="text"
                            value={answer}
                            onChange={e => setAnswer(e.target.value)}
                            className="w-full bg-black/50 border border-red-900/30 p-2 text-gray-200 text-sm focus:border-red-500 outline-none"
                            required
                        />
                    </div>

                    {error && <div className="text-red-500 text-xs text-center">{error}</div>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-red-900/40 text-red-200 border border-red-800 font-bold py-3 rounded hover:bg-red-900/60 transition-colors disabled:opacity-50 mt-4"
                    >
                        {loading ? '刻印中...' : '決定する'}
                    </button>
                </form>
            </div>
        </div>
    );
}
