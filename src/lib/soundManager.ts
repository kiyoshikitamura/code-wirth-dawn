/**
 * SoundManager — BGM/SE 再生エンジン (シングルトン)
 *
 * BGM: HTMLAudioElement（ループ再生・クロスフェード）
 * SE:  Web Audio API（バッファキャッシュ・多重再生対応）
 */

// ─── BGM / SE ファイルマッピング ───────────────────────────

const BGM_FILES: Record<string, string> = {
    bgm_title:       '/audio/bgm/bgm_title.ogg',
    bgm_inn:         '/audio/bgm/bgm_inn.ogg',
    bgm_field:       '/audio/bgm/bgm_field.ogg',
    bgm_battle:      '/audio/bgm/bgm_battle.ogg',
    bgm_quest_calm:  '/audio/bgm/bgm_quest_calm.ogg',
    bgm_quest_tense: '/audio/bgm/bgm_quest_tense.ogg',
};

const SE_FILES: Record<string, string> = {
    // UI
    se_click:        '/audio/se/se_click.ogg',
    se_modal_open:   '/audio/se/se_modal_open.ogg',
    se_cancel:       '/audio/se/se_cancel.ogg',
    // 拠点・移動
    se_enter_inn:    '/audio/se/se_enter_inn.ogg',
    se_travel:       '/audio/se/se_travel.ogg',
    // クエスト
    se_quest_accept: '/audio/se/se_quest_accept.ogg',
    se_quest_success:'/audio/se/se_quest_success.ogg',
    se_quest_fail:   '/audio/se/se_quest_fail.ogg',
    // バトル
    se_attack:       '/audio/se/se_attack.ogg',
    se_magic:        '/audio/se/se_magic.ogg',
    se_heal:         '/audio/se/se_heal.ogg',
    se_buff:         '/audio/se/se_buff.ogg',
    se_debuff:       '/audio/se/se_debuff.ogg',
    se_taunt:        '/audio/se/se_taunt.ogg',
    se_escape:       '/audio/se/se_escape.ogg',
    se_hit:          '/audio/se/se_hit.ogg',
    se_battle_win:   '/audio/se/se_battle_win.ogg',
    se_battle_lose:  '/audio/se/se_battle_lose.ogg',
    // その他
    se_item_get:     '/audio/se/se_item_get.ogg',
    se_prayer:       '/audio/se/se_prayer.ogg',
    se_level_up:     '/audio/se/se_level_up.ogg',
};

// ─── CardEffectType → SE キーのマッピング ─────────────────

export const CARD_EFFECT_SE_MAP: Record<string, string> = {
    attack:            'se_attack',
    aoe_attack:        'se_magic',
    heal:              'se_heal',
    buff_self:         'se_buff',
    buff_party:        'se_buff',
    support_activate:  'se_buff',
    debuff_enemy:      'se_debuff',
    taunt:             'se_taunt',
    escape:            'se_escape',
};

// ─── フェード定数 ─────────────────────────────────────────

const FADE_DURATION_MS = 800;
const FADE_STEP_MS = 50;

// ─── SoundManager クラス ──────────────────────────────────

class SoundManager {
    private static instance: SoundManager | null = null;

    // BGM
    private bgmAudio: HTMLAudioElement | null = null;
    private currentBgmKey: string | null = null;
    private bgmVolume = 0.7;
    private isFading = false;

    // SE
    private audioCtx: AudioContext | null = null;
    private seBufferCache: Map<string, AudioBuffer> = new Map();
    private seVolume = 0.8;

    // 初期化済みフラグ
    private initialized = false;

    private constructor() {}

    static getInstance(): SoundManager {
        if (!SoundManager.instance) {
            SoundManager.instance = new SoundManager();
        }
        return SoundManager.instance;
    }

    // ─── 初期化（ユーザー操作後に呼ぶ） ───────────────────

    init(): void {
        if (this.initialized) return;
        try {
            this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            console.warn('[SoundManager] AudioContext init failed:', e);
        }
    }

    /** Autoplay Policy 解除 */
    async resume(): Promise<void> {
        if (this.audioCtx?.state === 'suspended') {
            await this.audioCtx.resume();
        }
    }

    // ─── BGM ──────────────────────────────────────────────

    async playBgm(key: string): Promise<void> {
        if (!key || key === this.currentBgmKey) return;

        const src = BGM_FILES[key];
        if (!src) {
            console.warn(`[SoundManager] Unknown BGM key: ${key}`);
            return;
        }

        // フェードアウト中のBGMがあれば待つ
        if (this.bgmAudio && this.currentBgmKey) {
            await this.fadeOutBgm();
        }

        this.currentBgmKey = key;

        // 新しいBGMを作成
        const audio = new Audio(src);
        audio.loop = true;
        audio.volume = 0;
        audio.preload = 'auto';

        // エラーハンドリング（ファイルが見つからない場合静かに失敗）
        audio.onerror = () => {
            console.warn(`[SoundManager] Failed to load BGM: ${src}`);
        };

        this.bgmAudio = audio;

        try {
            await audio.play();
            // フェードイン
            await this.fadeBgmTo(this.bgmVolume);
        } catch (e) {
            // Autoplay blocked — ユーザー操作後にリトライされる
            console.warn('[SoundManager] BGM play blocked (autoplay policy)');
        }
    }

    stopBgm(): void {
        if (this.bgmAudio) {
            this.bgmAudio.pause();
            this.bgmAudio.currentTime = 0;
            this.bgmAudio = null;
        }
        this.currentBgmKey = null;
    }

    private fadeOutBgm(): Promise<void> {
        return this.fadeBgmTo(0).then(() => {
            if (this.bgmAudio) {
                this.bgmAudio.pause();
                this.bgmAudio = null;
            }
        });
    }

    private fadeBgmTo(targetVolume: number): Promise<void> {
        return new Promise((resolve) => {
            if (!this.bgmAudio) { resolve(); return; }
            if (this.isFading) { resolve(); return; }

            this.isFading = true;
            const audio = this.bgmAudio;
            const startVolume = audio.volume;
            const steps = Math.ceil(FADE_DURATION_MS / FADE_STEP_MS);
            const volumeDelta = (targetVolume - startVolume) / steps;
            let step = 0;

            const timer = setInterval(() => {
                step++;
                if (step >= steps || !this.bgmAudio || this.bgmAudio !== audio) {
                    clearInterval(timer);
                    if (audio === this.bgmAudio) {
                        audio.volume = Math.max(0, Math.min(1, targetVolume));
                    }
                    this.isFading = false;
                    resolve();
                    return;
                }
                audio.volume = Math.max(0, Math.min(1, startVolume + volumeDelta * step));
            }, FADE_STEP_MS);
        });
    }

    setBgmVolume(vol: number): void {
        this.bgmVolume = Math.max(0, Math.min(1, vol));
        if (this.bgmAudio && !this.isFading) {
            this.bgmAudio.volume = this.bgmVolume;
        }
    }

    getBgmVolume(): number {
        return this.bgmVolume;
    }

    getCurrentBgmKey(): string | null {
        return this.currentBgmKey;
    }

    // ─── SE ───────────────────────────────────────────────

    async playSE(key: string): Promise<void> {
        if (this.seVolume <= 0) return;
        if (!this.audioCtx) this.init();
        if (!this.audioCtx) return;

        await this.resume();

        const src = SE_FILES[key];
        if (!src) {
            console.warn(`[SoundManager] Unknown SE key: ${key}`);
            return;
        }

        try {
            let buffer = this.seBufferCache.get(key);
            if (!buffer) {
                const response = await fetch(src);
                if (!response.ok) {
                    console.warn(`[SoundManager] Failed to fetch SE: ${src}`);
                    return;
                }
                const arrayBuffer = await response.arrayBuffer();
                buffer = await this.audioCtx.decodeAudioData(arrayBuffer);
                this.seBufferCache.set(key, buffer);
            }

            const source = this.audioCtx.createBufferSource();
            source.buffer = buffer;

            const gainNode = this.audioCtx.createGain();
            gainNode.gain.value = this.seVolume;

            source.connect(gainNode);
            gainNode.connect(this.audioCtx.destination);
            source.start(0);
        } catch (e) {
            console.warn(`[SoundManager] SE play error (${key}):`, e);
        }
    }

    /** CardEffectType からSEを再生 */
    playSEForCardEffect(effectType: string): void {
        const seKey = CARD_EFFECT_SE_MAP[effectType];
        if (seKey) this.playSE(seKey);
    }

    setSeVolume(vol: number): void {
        this.seVolume = Math.max(0, Math.min(1, vol));
    }

    getSeVolume(): number {
        return this.seVolume;
    }

    // ─── クリーンアップ ───────────────────────────────────

    dispose(): void {
        this.stopBgm();
        this.seBufferCache.clear();
        if (this.audioCtx) {
            this.audioCtx.close().catch(() => {});
            this.audioCtx = null;
        }
        this.initialized = false;
    }
}

// シングルトンエクスポート
export const soundManager = typeof window !== 'undefined' ? SoundManager.getInstance() : null;
export default SoundManager;
