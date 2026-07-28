import { useState, useEffect, useRef, useCallback } from 'react';

// 所有音樂路徑常數
export const MUSIC_TRACKS = {
    HOME_COOL: '/music/HomeCool.mp3',
    HOME_WARM: '/music/HomeWarm.mp3',
    HOME_HARRY: '/music/Homeharry.mp3',
    BATTLE: '/music/battle.MP3',
    RESULT: '/music/result.mp3',
    ROOM: '/music/Room.mp3',
    TEST: '/music/test.mp3',
};

export const HOME_TRACKS = [
    { key: 'HOME_COOL', label: 'Cool', path: MUSIC_TRACKS.HOME_COOL },
    { key: 'HOME_WARM', label: 'Warm', path: MUSIC_TRACKS.HOME_WARM },
    { key: 'HOME_HARRY', label: 'Harry', path: MUSIC_TRACKS.HOME_HARRY },
];

const FADE_DURATION = 600; // ms
const DEFAULT_VOLUME = 0.35;

/**
 * useMusicPlayer — 全域音樂播放 hook
 */
const useMusicPlayer = () => {
    const audioRef = useRef(null);
    const audioContextRef = useRef(null);
    const sourceNodeRef = useRef(null);
    const gainNodeRef = useRef(null);
    const fadeTimerRef = useRef(null);
    const pendingTrackRef = useRef(null);
    const volumeRef = useRef(DEFAULT_VOLUME);
    const isEnabledRef = useRef(true);
    const currentTrackPathRef = useRef(null);
    const shouldBePlayingRef = useRef(false);
    const wasPlayingBeforeHiddenRef = useRef(false);

    const [currentTrackPath, setCurrentTrackPath] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolumeState] = useState(DEFAULT_VOLUME);
    const [homeTrackKey, setHomeTrackKey] = useState('HOME_HARRY');
    const [isEnabled, setIsEnabled] = useState(true); // master switch

    /**
     * 建立 iOS 可程式控制音量的 Web Audio 音訊鏈：
     * HTMLAudioElement → MediaElementAudioSourceNode → GainNode → 喇叭
     */
    const ensureAudioGraph = useCallback(() => {
        const audio = audioRef.current;
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;

        if (!audio || !AudioContextClass) return false;

        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new AudioContextClass();
            }

            if (!gainNodeRef.current) {
                const gainNode = audioContextRef.current.createGain();
                gainNode.gain.value = isEnabledRef.current ? volumeRef.current : 0;
                gainNode.connect(audioContextRef.current.destination);
                gainNodeRef.current = gainNode;
            }

            // 同一個 HTMLAudioElement 只能建立一次 MediaElementAudioSourceNode。
            if (!sourceNodeRef.current) {
                const sourceNode = audioContextRef.current.createMediaElementSource(audio);
                sourceNode.connect(gainNodeRef.current);
                sourceNodeRef.current = sourceNode;
            }

            // Web Audio 啟用後，元素維持全音量，實際音量交給 GainNode。
            audio.volume = 1;
            return true;
        } catch (error) {
            console.log('Web Audio setup failed:', error);
            return false;
        }
    }, []);

    /** 同時支援 GainNode 與不支援 Web Audio 的瀏覽器 fallback。 */
    const setOutputVolume = useCallback((nextVolume) => {
        const audio = audioRef.current;
        if (!audio) return;

        const safeVolume = Math.max(0, Math.min(1, nextVolume));
        const gainNode = gainNodeRef.current;
        const audioContext = audioContextRef.current;

        if (gainNode && audioContext) {
            audio.volume = 1;
            gainNode.gain.cancelScheduledValues(audioContext.currentTime);
            gainNode.gain.setValueAtTime(safeVolume, audioContext.currentTime);
        } else {
            audio.volume = safeVolume;
        }
    }, []);

    const getOutputVolume = useCallback(() => {
        if (gainNodeRef.current) return gainNodeRef.current.gain.value;
        return audioRef.current?.volume ?? 0;
    }, []);

    /** iOS 的 AudioContext 必須在 click／touch 等使用者手勢中喚醒。 */
    const resumeAudioContext = useCallback(async () => {
        if (!ensureAudioGraph()) return;

        const audioContext = audioContextRef.current;
        // WebKit 在 iOS 被切到背景後可能回報非標準的 interrupted 狀態。
        if (
            audioContext &&
            audioContext.state !== 'running' &&
            audioContext.state !== 'closed'
        ) {
            try {
                await audioContext.resume();
            } catch (error) {
                console.log('AudioContext resume was blocked:', error);
            }
        }
    }, [ensureAudioGraph]);

    // 初始化 Audio、解除行動裝置音訊限制，並處理頁面切到背景的生命週期。
    useEffect(() => {
        const audio = new Audio();
        audio.loop = true;
        audio.playsInline = true;
        audio.volume = DEFAULT_VOLUME;
        audioRef.current = audio;

        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);

        const unlockAudio = async () => {
            await resumeAudioContext();

            // 自動播放若先前被 iOS 擋住，第一次使用者互動時接續播放。
            if (
                shouldBePlayingRef.current &&
                isEnabledRef.current &&
                currentTrackPathRef.current &&
                !document.hidden &&
                audio.paused
            ) {
                setOutputVolume(volumeRef.current);
                audio.play().catch(error => {
                    console.log('Audio play was blocked:', error);
                });
            }
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                wasPlayingBeforeHiddenRef.current =
                    !audio.paused && isEnabledRef.current;

                audio.pause();

                if (audioContextRef.current?.state === 'running') {
                    audioContextRef.current.suspend().catch(() => { });
                }
                return;
            }

            const shouldResume = wasPlayingBeforeHiddenRef.current;
            wasPlayingBeforeHiddenRef.current = false;

            // 只有離開前原本正在播放，回來時才恢復，避免違反使用者的靜音意願。
            if (
                shouldResume &&
                shouldBePlayingRef.current &&
                isEnabledRef.current &&
                currentTrackPathRef.current
            ) {
                resumeAudioContext().then(() => {
                    setOutputVolume(volumeRef.current);
                    return audio.play();
                }).catch(error => {
                    console.log('BGM resume was blocked:', error);
                });
            }
        };

        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        document.addEventListener('click', unlockAudio);
        document.addEventListener('touchstart', unlockAudio, { passive: true });
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            if (fadeTimerRef.current) clearInterval(fadeTimerRef.current);

            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            document.removeEventListener('click', unlockAudio);
            document.removeEventListener('touchstart', unlockAudio);
            document.removeEventListener('visibilitychange', handleVisibilityChange);

            audio.pause();
            audio.src = '';

            sourceNodeRef.current?.disconnect();
            gainNodeRef.current?.disconnect();
            audioContextRef.current?.close().catch(() => { });

            audioRef.current = null;
            sourceNodeRef.current = null;
            gainNodeRef.current = null;
            audioContextRef.current = null;
        };
    }, [resumeAudioContext, setOutputVolume]);

    /** 淡出 → 切換 → 淡入 */
    const fadeToTrack = useCallback((trackPath) => {
        if (!audioRef.current) return;

        const audio = audioRef.current;
        const canPlay = isEnabledRef.current && !document.hidden;

        shouldBePlayingRef.current = isEnabledRef.current;

        // 清除現有 fade timer
        if (fadeTimerRef.current) clearInterval(fadeTimerRef.current);

        // 保存目標曲目
        pendingTrackRef.current = trackPath;

        // 如果目前就是同一首，不需要切換
        if (audio.src && audio.src.endsWith(trackPath) && !audio.paused) return;

        // 如果目前沒有在播放，直接換曲
        if (audio.paused || !isEnabledRef.current) {
            audio.src = trackPath;
            audio.load();
            currentTrackPathRef.current = trackPath;
            setCurrentTrackPath(trackPath);

            if (canPlay) {
                ensureAudioGraph();
                setOutputVolume(volumeRef.current);
                audio.play().catch(error => {
                    console.log('Audio play was blocked:', error);
                });
            }
            return;
        }

        // 為了避免行動裝置 (iOS Safari 等) 阻擋非使用者互動的 audio.play()，
        // 我們必須在第一時間「同步」切換 .src 並觸發 .play()，不能等淡出結束才做。

        // 1. 同步切換音軌並播放
        ensureAudioGraph();
        const startVol = getOutputVolume();
        audio.src = trackPath;
        audio.load();
        currentTrackPathRef.current = trackPath;
        setCurrentTrackPath(trackPath);

        if (!canPlay || startVol === 0) {
            setOutputVolume(canPlay ? volumeRef.current : 0);
            if (canPlay) {
                audio.play().catch(error => {
                    console.log('Audio play was blocked:', error);
                });
            }
            return;
        }

        // 2. 如果之前有聲音，我們先強制設為 0，然後開始淡入新歌
        setOutputVolume(0);
        audio.play().catch(error => {
            console.log('Audio play was blocked:', error);
        });

        const targetVol = volumeRef.current;
        const stepIn = targetVol / (FADE_DURATION / 50);
        let nextVolume = 0;

        fadeTimerRef.current = setInterval(() => {
            nextVolume = Math.min(targetVol, nextVolume + stepIn);
            setOutputVolume(nextVolume);

            if (nextVolume >= targetVol) {
                clearInterval(fadeTimerRef.current);
                fadeTimerRef.current = null;
            }
        }, 50);
    }, [ensureAudioGraph, getOutputVolume, setOutputVolume]);

    /** 直接播放指定曲目（帶淡出淡入） */
    const playTrack = useCallback((trackPath) => {
        if (!trackPath) return;
        fadeToTrack(trackPath);
    }, [fadeToTrack]);

    /** 暫停 */
    const pauseMusic = useCallback(() => {
        shouldBePlayingRef.current = false;

        if (audioRef.current) {
            audioRef.current.pause();
        }
    }, []);

    /** 繼續 */
    const resumeMusic = useCallback(() => {
        if (
            audioRef.current &&
            currentTrackPathRef.current &&
            isEnabledRef.current &&
            !document.hidden
        ) {
            shouldBePlayingRef.current = true;
            resumeAudioContext().then(() => {
                setOutputVolume(volumeRef.current);
                return audioRef.current?.play();
            }).catch(error => {
                console.log('Audio play was blocked:', error);
            });
        }
    }, [resumeAudioContext, setOutputVolume]);

    /** 開關切換 */
    const toggleMusic = useCallback(() => {
        const next = !isEnabledRef.current;
        isEnabledRef.current = next;
        setIsEnabled(next);

        if (!next) {
            shouldBePlayingRef.current = false;
            audioRef.current?.pause();
            setOutputVolume(0);
            return;
        }

        shouldBePlayingRef.current = Boolean(currentTrackPathRef.current);
        setOutputVolume(volumeRef.current);

        if (audioRef.current && currentTrackPathRef.current && !document.hidden) {
            resumeAudioContext().then(() => {
                return audioRef.current?.play();
            }).catch(error => {
                console.log('Audio play was blocked:', error);
            });
        }
    }, [resumeAudioContext, setOutputVolume]);

    /** 設定音量 */
    const setVolume = useCallback((nextVolume) => {
        const safeVolume = Math.max(0, Math.min(1, nextVolume));
        volumeRef.current = safeVolume;
        setVolumeState(safeVolume);

        if (isEnabledRef.current) {
            ensureAudioGraph();
            setOutputVolume(safeVolume);
        }
    }, [ensureAudioGraph, setOutputVolume]);

    /** 切換首頁音樂選擇 */
    const setHomeTrack = useCallback((key) => {
        setHomeTrackKey(key);
    }, []);

    // 取得首頁音樂路徑
    const homeTrackPath = MUSIC_TRACKS[homeTrackKey];

    return {
        currentTrackPath,
        isPlaying,
        isEnabled,
        volume,
        homeTrackKey,
        homeTrackPath,
        playTrack,
        pauseMusic,
        resumeMusic,
        toggleMusic,
        setVolume,
        setHomeTrack,
    };
};

export default useMusicPlayer;
