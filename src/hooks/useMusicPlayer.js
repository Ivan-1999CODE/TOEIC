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

/**
 * useMusicPlayer — 全域音樂播放 hook
 */
const useMusicPlayer = () => {
    const audioRef = useRef(null);
    const fadeTimerRef = useRef(null);
    const pendingTrackRef = useRef(null);

    const [currentTrackPath, setCurrentTrackPath] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolumeState] = useState(0.35);
    const [homeTrackKey, setHomeTrackKey] = useState('HOME_HARRY');
    const [isEnabled, setIsEnabled] = useState(true); // master switch

    // 初始化 Audio 物件與解除行動裝置音訊限制
    useEffect(() => {
        const audio = new Audio();
        audio.loop = true;
        audio.volume = 0.35;
        audioRef.current = audio;

        // 解除 iOS/Android 自動播放限制：在使用者第一次互動時初始化 audio context
        const unlockAudio = () => {
            if (audioRef.current) {
                audioRef.current.play().then(() => {
                    audioRef.current.pause();
                }).catch(() => { });

                // 解除限制後就移除監聽器
                document.removeEventListener('click', unlockAudio);
                document.removeEventListener('touchstart', unlockAudio);
            }
        };

        document.addEventListener('click', unlockAudio);
        document.addEventListener('touchstart', unlockAudio);

        return () => {
            document.removeEventListener('click', unlockAudio);
            document.removeEventListener('touchstart', unlockAudio);
            audio.pause();
            audio.src = '';
        };
    }, []);

    // 音量同步
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = isEnabled ? volume : 0;
        }
    }, [volume, isEnabled]);

    /** 淡出 → 切換 → 淡入 */
    const fadeToTrack = useCallback((trackPath) => {
        if (!audioRef.current) return;

        const audio = audioRef.current;

        // 清除現有 fade timer
        if (fadeTimerRef.current) clearInterval(fadeTimerRef.current);

        // 保存目標曲目
        pendingTrackRef.current = trackPath;

        // 如果目前就是同一首，不需要切換
        if (audio.src && audio.src.endsWith(trackPath) && !audio.paused) return;

        // 如果目前沒有在播放，直接換曲
        if (audio.paused || !isEnabled) {
            audio.src = trackPath;
            audio.load();
            setCurrentTrackPath(trackPath);
            if (isEnabled) {
                audio.play().catch(() => { });
                setIsPlaying(true);
            }
            return;
        }

        // 為了避免行動裝置 (iOS Safari 等) 阻擋非使用者互動的 audio.play()，
        // 我們必須在第一時間「同步」切換 .src 並觸發 .play()，不能等淡出結束才做。

        // 1. 同步切換音軌並播放
        const startVol = audio.volume;
        audio.src = trackPath;
        audio.load();
        setCurrentTrackPath(trackPath);

        if (!isEnabled || startVol === 0) {
            audio.volume = isEnabled ? volume : 0;
            if (isEnabled) {
                audio.play().catch(e => console.log('Audio play blocked:', e));
                setIsPlaying(true);
            }
            return;
        }

        // 2. 如果之前有聲音，我們先強制設為 0，然後開始淡入新歌
        audio.volume = 0;
        audio.play().catch(e => console.log('Audio play blocked:', e));
        setIsPlaying(true);

        const targetVol = volume;
        const stepIn = targetVol / (FADE_DURATION / 50);

        fadeTimerRef.current = setInterval(() => {
            if (audio.volume < targetVol - stepIn) {
                audio.volume = Math.min(targetVol, audio.volume + stepIn);
            } else {
                audio.volume = targetVol;
                clearInterval(fadeTimerRef.current);
            }
        }, 50);
    }, [isEnabled, volume]);

    /** 直接播放指定曲目（帶淡出淡入） */
    const playTrack = useCallback((trackPath) => {
        if (!trackPath) return;
        fadeToTrack(trackPath);
    }, [fadeToTrack]);

    /** 暫停 */
    const pauseMusic = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    }, []);

    /** 繼續 */
    const resumeMusic = useCallback(() => {
        if (audioRef.current && currentTrackPath && isEnabled) {
            audioRef.current.play().catch(() => { });
            setIsPlaying(true);
        }
    }, [currentTrackPath, isEnabled]);

    /** 開關切換 */
    const toggleMusic = useCallback(() => {
        setIsEnabled(prev => {
            const next = !prev;
            if (!next) {
                audioRef.current?.pause();
                setIsPlaying(false);
            } else {
                if (audioRef.current && currentTrackPath) {
                    audioRef.current.volume = volume;
                    audioRef.current.play().catch(() => { });
                    setIsPlaying(true);
                }
            }
            return next;
        });
    }, [currentTrackPath, volume]);

    /** 設定音量 */
    const setVolume = useCallback((v) => {
        setVolumeState(v);
        if (audioRef.current && isEnabled) {
            audioRef.current.volume = v;
        }
    }, [isEnabled]);

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
