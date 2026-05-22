import fs from 'fs';
import path from 'path';
import PlayGuideView from '@/components/ui/PlayGuideView';

export const metadata = {
    title: 'プレイガイド - Code: Wirth-Dawn',
    description: '『Code: Wirth-Dawn』のゲームシステム、ルール、および冒険を進める上での重要な仕様についての説明書。',
};

export default async function PlayGuidePage() {
    const filePath = path.join(process.cwd(), 'docs', 'play_guide.md');
    let fileContent = '';

    try {
        fileContent = fs.readFileSync(filePath, 'utf-8');
    } catch (e) {
        console.error('Failed to read play_guide.md:', e);
    }

    const sections: { id: number; title: string; content: string }[] = [];
    let introduction = '';

    if (fileContent) {
        // 改行コードを統一
        const normalizedContent = fileContent.replace(/\r\n/g, '\n');
        
        // 最初の見出し "## " で分割
        const parts = normalizedContent.split(/\n## /);

        if (parts.length > 0) {
            // 最初のパートは導入（イントロダクション）
            introduction = parts[0];

            // 2番目以降のパートが各セクション
            for (let i = 1; i < parts.length; i++) {
                const part = parts[i];
                const lines = part.split('\n');
                const title = lines[0].trim(); // 最初の行がセクションタイトル
                const content = lines.slice(1).join('\n'); // 残りの行がコンテンツ

                sections.push({
                    id: i,
                    title,
                    content,
                });
            }
        }
    }

    return (
        <PlayGuideView 
            introduction={introduction} 
            sections={sections} 
        />
    );
}
