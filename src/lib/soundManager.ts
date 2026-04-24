/**
 * SoundManager — BGM/SE 再生エンジン (シングルトン)
 *
 * BGM: HTMLAudioElement（ループ再生・クロスフェード）
 * SE:  Web Audio API（バッファキャッシュ・多重再生対応）
 */

// ─── BGM / SE ファイルマッピング ───────────────────────────

const BGM_FILES: Record<string, string> = {
    bgm_title:          '/audio/bgm/bgm_title.ogg',
    bgm_inn:            '/audio/bgm/bgm_inn.ogg',
    bgm_field:          '/audio/bgm/bgm_field.ogg',
    bgm_battle:         '/audio/bgm/bgm_battle.ogg',
    bgm_battle_strong:  '/audio/bgm/bgm_battle_strong.ogg',
    bgm_battle_boss:    '/audio/bgm/bgm_battle_boss.ogg',
    bgm_quest_calm:     '/audio/bgm/bgm_quest_calm.ogg',
    bgm_quest_tense:    '/audio/bgm/bgm_quest_tense.ogg',
    bgm_quest_crisis:   '/audio/bgm/bgm_quest_crisis.ogg',
    bgm_quest_mystery:  '/audio/bgm/bgm_quest_mystery.ogg',
    // 国家テーマBGM (spec_v14.1 §4)
    bgm_roland:         '/audio/bgm/bgm_roland.ogg',
    bgm_markand:        '/audio/bgm/bgm_markand.ogg',
    bgm_yato:           '/audio/bgm/bgm_yato.ogg',
    bgm_karyu:          '/audio/bgm/bgm_karyu.ogg',
    bgm_collapse:       '/audio/bgm/bgm_collapse.ogg',
    // スポットクエスト専用BGM (6101-6104)
    bgm_spot_final_boss:   '/audio/bgm/bgm_spot_final_boss.ogg',
    bgm_spot_final_choice: '/audio/bgm/bgm_spot_final_choice.ogg',
};

const SE_FILES: Record<string, string> = {
    // UI
    se_click:        '/audio/se/se_click.ogg',
    se_modal_open:   '/audio/se/se_modal_open.ogg',
    se_cancel:       '/audio/se/se_cancel.ogg',
    // 拡点・移動 (spec_v14.1 §5)
    se_enter_inn:    '/audio/se/se_enter_inn.ogg',
    se_enter_guild:  '/audio/se/se_enter_guild.ogg',
    se_enter_shop:   '/audio/se/se_enter_shop.ogg',
    se_enter_temple: '/audio/se/se_enter_temple.ogg',
    se_travel:       '/audio/se/se_travel.ogg',         // 拠点→ワールドマップ（人間の足音）
    // ワールドマップ用 SE (spec_v14.1 §5.3)
    se_enter_location: '/audio/se/se_enter_location.ogg', // 拠点に入る（人間の足音）
    se_travel_horse:   '/audio/se/se_travel_horse.ogg',   // 拠点間移動（馬・馬車の足音）
    se_encounter:      '/audio/se/se_encounter.ogg',      // 敵とのエンカウント
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
    private bgmEnabled = true;
    private readonly BGM_VOLUME = 0.7;
    private isFading = false;

    // SE
    private audioCtx: AudioContext | null = null;
    private seBufferCache: Map<string, AudioBuffer> = new Map();
    private seEnabled = true;
    private readonly SE_VOLUME = 0.8;

    // 初期化済みフラグ
    private initialized = false;

    // モバイル: ユーザー操作アンロック済みフラグ
    private unlocked = false;
    private pendingBgmKey: string | null = null;

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
            // モバイル: 初回ユーザー操作でオーディオをアンロック
            if (!this.unlocked) {
                this.setupUserGestureUnlock();
            }
        } catch (e) {
            console.warn('[SoundManager] AudioContext init failed:', e);
        }
    }

    /** モバイル向け: 初回タッチ/クリックでAudioContextをresumeし、保留中のBGMを再生 */
    private setupUserGestureUnlock(): void {
        const unlock = async () => {
            if (this.unlocked) return;
            this.unlocked = true;

            // AudioContext の suspend 解除
            if (this.audioCtx?.state === 'suspended') {
                try { await this.audioCtx.resume(); } catch (_) {}
            }

            // 保留中のBGMがあれば再生
            if (this.pendingBgmKey) {
                const key = this.pendingBgmKey;
                this.pendingBgmKey = null;
                this.currentBgmKey = null; // reset to allow playBgm
                await this.playBgm(key);
            }

            // リスナー解除
            ['touchstart', 'touchend', 'click', 'keydown'].forEach(ev =>
                document.removeEventListener(ev, unlock, true)
            );
            console.log('[SoundManager] Audio unlocked by user gesture');
        };

        ['touchstart', 'touchend', 'click', 'keydown'].forEach(ev =>
            document.addEventListener(ev, unlock, { once: false, capture: true, passive: true })
        );
    }

    /** Autoplay Policy 解除 */
    async resume(): Promise<void> {
        if (this.audioCtx?.state === 'suspended') {
            await this.audioCtx.resume();
        }
    }

    // ─── BGM ──────────────────────────────────────────────

    private fadeTimerId: ReturnType<typeof setInterval> | null = null;

    /** 進行中のフェードを強制キャンセル */
    private cancelFade(): void {
        if (this.fadeTimerId) {
            clearInterval(this.fadeTimerId);
            this.fadeTimerId = null;
        }
        this.isFading = false;
    }

    async playBgm(key: string): Promise<void> {
        if (!key || key === this.currentBgmKey) return;

        // BGM OFF時: キーだけ記録して実際の再生はスキップ
        if (!this.bgmEnabled) {
            this.currentBgmKey = key;
            this.pendingBgmKey = null;
            return;
        }

        const src = BGM_FILES[key];
        if (!src) {
            console.warn(`[SoundManager] Unknown BGM key: ${key}`);
            return;
        }

        // 古いpendingを上書き（ページ遷移後に古いBGMが再生されるのを防止）
        this.pendingBgmKey = null;

        // 進行中のフェードを即時キャンセル
        this.cancelFade();

        // 現在のBGMを即時停止（フェードアウトの代わりに即停止で競合回避）
        if (this.bgmAudio && this.currentBgmKey) {
            this.bgmAudio.pause();
        }

        this.currentBgmKey = key;

        // iOS Safari対応: Audio要素を再利用（初回ジェスチャでplay済みの要素のみ再生可能）
        if (!this.bgmAudio) {
            this.bgmAudio = new Audio();
            this.bgmAudio.loop = true;
            this.bgmAudio.preload = 'auto';
            this.bgmAudio.onerror = () => {
                console.warn(`[SoundManager] Failed to load BGM: ${this.bgmAudio?.src}`);
            };
        }

        const audio = this.bgmAudio;
        audio.src = src;
        audio.volume = this.BGM_VOLUME; // 即時フルボリューム（フェードインの競合を回避）

        try {
            await audio.play();
            console.log(`[SoundManager] BGM playing: ${key}`);
        } catch (e) {
            // Autoplay blocked — ユーザー操作後にリトライされる
            console.warn('[SoundManager] BGM play blocked (autoplay policy), queuing for unlock');
            this.pendingBgmKey = key;
        }
    }

    stopBgm(): void {
        this.cancelFade();
        if (this.bgmAudio) {
            this.bgmAudio.pause();
            this.bgmAudio.currentTime = 0;
        }
        this.currentBgmKey = null;
    }

    private fadeOutBgm(): Promise<void> {
        return this.fadeBgmTo(0).then(() => {
            if (this.bgmAudio) {
                this.bgmAudio.pause();
            }
        });
    }

    private fadeBgmTo(targetVolume: number): Promise<void> {
        return new Promise((resolve) => {
            if (!this.bgmAudio) { resolve(); return; }

            // 進行中のフェードをキャンセルしてから新しいフェードを開始
            this.cancelFade();

            this.isFading = true;
            const audio = this.bgmAudio;
            const startVolume = audio.volume;
            const steps = Math.ceil(FADE_DURATION_MS / FADE_STEP_MS);
            const volumeDelta = (targetVolume - startVolume) / steps;
            let step = 0;

            this.fadeTimerId = setInterval(() => {
                step++;
                if (step >= steps || !this.bgmAudio || this.bgmAudio !== audio) {
                    this.cancelFade();
                    if (audio === this.bgmAudio) {
                        audio.volume = Math.max(0, Math.min(1, targetVolume));
                    }
                    resolve();
                    return;
                }
                audio.volume = Math.max(0, Math.min(1, startVolume + volumeDelta * step));
            }, FADE_STEP_MS);
        });
    }

    setBgmEnabled(enabled: boolean): void {
        this.bgmEnabled = enabled;
        if (this.bgmAudio) {
            if (!enabled) {
                this.bgmAudio.pause();
            } else if (this.currentBgmKey) {
                this.bgmAudio.volume = this.BGM_VOLUME;
                this.bgmAudio.play().catch(() => {});
            }
        }
    }

    getBgmEnabled(): boolean {
        return this.bgmEnabled;
    }

    getCurrentBgmKey(): string | null {
        return this.currentBgmKey;
    }

    /** モバイル向け: 保留中のBGMをユーザージェスチャコンテキスト内で同期的に再生 */
    playPendingBgm(): void {
        if (!this.pendingBgmKey) return;
        const key = this.pendingBgmKey;
        const src = BGM_FILES[key];
        if (!src) return;

        this.pendingBgmKey = null;
        this.currentBgmKey = key;

        // Audio要素を再利用（なければ作成）
        if (!this.bgmAudio) {
            this.bgmAudio = new Audio();
            this.bgmAudio.loop = true;
            this.bgmAudio.preload = 'auto';
        }

        const audio = this.bgmAudio;
        audio.src = src;
        audio.volume = this.BGM_VOLUME;

        // iOS Safari: play()は同期コールスタック内で呼ぶ（awaitしない）
        audio.play().catch(() => {
            console.warn('[SoundManager] playPendingBgm: play() still blocked');
        });
    }

    // ─── SE ───────────────────────────────────────────────

    async playSE(key: string): Promise<void> {
        if (!this.seEnabled) return;
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
            gainNode.gain.value = this.SE_VOLUME;

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

    setSeEnabled(enabled: boolean): void {
        this.seEnabled = enabled;
    }

    getSeEnabled(): boolean {
        return this.seEnabled;
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
