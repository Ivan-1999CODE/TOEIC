import React, { useState } from 'react';
import { Music, VolumeX, Volume1, Volume2, ChevronUp, ChevronDown } from 'lucide-react';
import { HOME_TRACKS, MUSIC_TRACKS } from '../hooks/useMusicPlayer';

// 曲目顯示名稱
const TRACK_LABELS = {
    [MUSIC_TRACKS.HOME_COOL]: '🎵 HomeCool',
    [MUSIC_TRACKS.HOME_WARM]: '🎵 HomeWarm',
    [MUSIC_TRACKS.HOME_HARRY]: '🎵 HomeHarry',
    [MUSIC_TRACKS.BATTLE]: '⚔️ Battle',
    [MUSIC_TRACKS.RESULT]: '📜 Result',
    [MUSIC_TRACKS.ROOM]: '🏛️ Room',
    [MUSIC_TRACKS.TEST]: '🦉 Test',
};

const MusicBar = ({
    currentTrackPath,
    isPlaying,
    isEnabled,
    volume,
    homeTrackKey,
    toggleMusic,
    setVolume,
    setHomeTrack,
    playTrack,
    homeTrackPath,
}) => {
    const [expanded, setExpanded] = useState(false);

    const trackLabel = TRACK_LABELS[currentTrackPath] || '—';

    // 是否目前在首頁音樂（可讓使用者選擇）
    const isHomeTrack = [MUSIC_TRACKS.HOME_COOL, MUSIC_TRACKS.HOME_WARM, MUSIC_TRACKS.HOME_HARRY]
        .includes(currentTrackPath);

    const VolumeIcon = volume === 0 || !isEnabled ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

    return (
        <div
            className="shrink-0 z-30 relative"
            style={{
                background: 'linear-gradient(135deg, rgba(30,10,5,0.97) 0%, rgba(58,20,10,0.97) 100%)',
                borderTop: '2px solid rgba(180,120,60,0.4)',
            }}
        >
            {/* 展開面板（曲目選擇 + 音量） */}
            {expanded && (
                <div
                    className="px-4 pt-3 pb-2 space-y-3 animate-fadeIn"
                    style={{ borderBottom: '1px solid rgba(180,120,60,0.2)' }}
                >
                    {/* 音量控制 */}
                    <div className="flex items-center gap-3">
                        <VolumeIcon size={15} className="text-amber-400 shrink-0" />
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={volume}
                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                            className="flex-1 h-1.5 rounded-full accent-amber-500 cursor-pointer"
                            style={{ accentColor: '#f59e0b' }}
                        />
                        <span className="text-amber-500/60 text-[10px] font-mono w-8 text-right">
                            {Math.round(volume * 100)}%
                        </span>
                    </div>

                    {/* 首頁音樂選擇（只有在首頁系列音樂時才顯示） */}
                    {isHomeTrack && (
                        <div>
                            <p className="text-amber-500/50 text-[10px] uppercase tracking-widest mb-1.5">
                                首頁音樂選擇
                            </p>
                            <div className="flex gap-2">
                                {HOME_TRACKS.map((track) => (
                                    <button
                                        key={track.key}
                                        onClick={() => {
                                            setHomeTrack(track.key);
                                            playTrack(track.path);
                                        }}
                                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border
                                            ${homeTrackKey === track.key
                                                ? 'bg-amber-700/40 border-amber-500/60 text-amber-200'
                                                : 'bg-black/30 border-white/10 text-amber-500/60 hover:border-amber-500/30 hover:text-amber-400'
                                            }`}
                                    >
                                        {track.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 主控制列 */}
            <div className="flex items-center gap-3 px-4 py-2">
                {/* 音樂開關 */}
                <button
                    onClick={toggleMusic}
                    title={isEnabled ? '關閉音樂' : '開啟音樂'}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all border shrink-0
                        ${isEnabled
                            ? 'bg-amber-700/30 border-amber-500/50 text-amber-300 hover:bg-amber-600/40'
                            : 'bg-black/30 border-white/10 text-white/30 hover:border-amber-500/30 hover:text-amber-400/50'
                        }`}
                >
                    {isEnabled ? (
                        <Music size={15} className={isPlaying ? 'animate-pulse' : ''} />
                    ) : (
                        <VolumeX size={15} />
                    )}
                </button>

                {/* 曲目名稱 */}
                <div className="flex-1 min-w-0">
                    <p
                        className={`text-xs font-serif truncate transition-all
                            ${isEnabled ? 'text-amber-200/80' : 'text-white/25'}`}
                    >
                        {isEnabled ? trackLabel : '— 靜音 —'}
                    </p>
                    {isEnabled && isPlaying && (
                        <div className="flex gap-0.5 mt-0.5 items-end h-2">
                            {[1, 2, 3, 4].map((i) => (
                                <div
                                    key={i}
                                    className="w-0.5 bg-amber-500/60 rounded-full"
                                    style={{
                                        height: `${40 + (i % 3) * 20}%`,
                                        animation: `musicBar${i} ${0.6 + i * 0.15}s ease-in-out infinite alternate`,
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* 展開/收起按鈕 */}
                <button
                    onClick={() => setExpanded(p => !p)}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-amber-500/50 hover:text-amber-300 hover:bg-white/5 transition-all shrink-0"
                    title="更多設定"
                >
                    {expanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                </button>
            </div>

            {/* 音符動畫 keyframes */}
            <style>{`
                @keyframes musicBar1 { from { height: 30%; } to { height: 80%; } }
                @keyframes musicBar2 { from { height: 60%; } to { height: 30%; } }
                @keyframes musicBar3 { from { height: 40%; } to { height: 90%; } }
                @keyframes musicBar4 { from { height: 70%; } to { height: 40%; } }
            `}</style>
        </div>
    );
};

export default MusicBar;
