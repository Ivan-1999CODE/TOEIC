import React, { useState, useEffect, useRef } from 'react';
import { X, Lock, Sparkles, Feather, Leaf, Moon, Castle, Sword, Flame, Swords, CheckCircle2, XCircle, ChevronRight, ChevronLeft, Check, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs, query } from 'firebase/firestore';

// --- 六大導師的視覺主題 (用於圖章與資料夾) ---
const PROFESSOR_THEMES = {
    'endgame_01': { icon: Feather, label: 'Charms Master' },
    'endgame_02': { icon: Leaf, label: 'Herbology' },
    'endgame_03': { icon: Moon, label: 'Defense Against the Dark Arts' },
    'endgame_04': { icon: Castle, label: 'Transfiguration' },
    'endgame_05': { icon: Sword, label: 'Potions Master' },
    'endgame_06': { icon: Flame, label: 'Headmaster' }
};

// --- 6 位教授資料夾區段 ---
const PROFESSOR_SECTIONS = [
    { name: '菲力・弗立維', spell: 'Wingardium Leviosa', desc: '漂浮與精準，是咒語學的第一道光。', themeKey: 'endgame_01', folderColor: 'from-blue-600 to-blue-900', folderBorder: 'border-blue-500/40', accent: 'bg-blue-400', glow: 'shadow-blue-900/30', range: [1, 20] },
    { name: '波莫娜・芽菜', spell: 'Lumos Solem', desc: '讓埋藏的知識，如種子般重新甦醒。', themeKey: 'endgame_02', folderColor: 'from-green-600 to-green-900', folderBorder: 'border-green-500/40', accent: 'bg-emerald-400', glow: 'shadow-emerald-900/30', range: [21, 40] },
    { name: '雷木思・路平', spell: 'Riddikulus', desc: '直視恐懼，才能把未知變成力量。', themeKey: 'endgame_03', folderColor: 'from-slate-400 to-slate-600', folderBorder: 'border-slate-400/40', accent: 'bg-slate-300', glow: 'shadow-slate-900/30', range: [41, 60] },
    { name: '米奈娃・麥', spell: 'Piertotum Locomotor', desc: '嚴謹的秩序，守護每一道變形魔法。', themeKey: 'endgame_04', folderColor: 'from-red-700 to-red-900', folderBorder: 'border-red-500/40', accent: 'bg-rose-400', glow: 'shadow-red-950/30', range: [61, 80] },
    { name: '賽佛勒斯・石內卜', spell: 'Sectumsempra', desc: '危險的知識，總藏在最深的暗處。', themeKey: 'endgame_05', folderColor: 'from-slate-800 to-black', folderBorder: 'border-slate-500/40', accent: 'bg-violet-300', glow: 'shadow-black/50', range: [81, 100] },
    { name: '阿不思・鄧不利多', spell: 'Gubraithian Fire', desc: '有些火焰不會熄滅，如同真正的智慧。', themeKey: 'endgame_06', folderColor: 'from-amber-500 to-orange-800', folderBorder: 'border-amber-500/40', accent: 'bg-amber-300', glow: 'shadow-amber-950/30', range: [101, 120] },
];

// 根據 index 推算 chapterId
function getChapterIdFromIndex(index) {
    if (index <= 20) return 'endgame_01';
    if (index <= 40) return 'endgame_02';
    if (index <= 60) return 'endgame_03';
    if (index <= 80) return 'endgame_04';
    if (index <= 100) return 'endgame_05';
    return 'endgame_06';
}

// 稀有度樣式
function getRarityStyle(rarity) {
    switch (rarity) {
        case 'Legendary':
            return {
                bg: 'bg-gradient-to-br from-[#422006] via-[#78350f] to-[#1a0f0a]',
                border: 'border-yellow-500',
                shadow: 'shadow-[0_0_15px_rgba(234,179,8,0.3)]',
                textColor: 'text-yellow-200',
                stampBg: 'bg-yellow-900/40 border-yellow-500/40',
                stampIcon: 'text-yellow-400/70',
                badgeClass: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
            };
        case 'Rare':
            return {
                bg: 'bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#1e1b4b]',
                border: 'border-blue-400',
                shadow: 'shadow-[0_0_10px_rgba(96,165,250,0.3)]',
                textColor: 'text-blue-200',
                stampBg: 'bg-blue-900/40 border-blue-400/40',
                stampIcon: 'text-blue-300/70',
                badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
            };
        default:
            return {
                bg: 'bg-gradient-to-br from-[#2c2018] to-[#1a0f0a]',
                border: 'border-[#8d6e63]',
                shadow: '',
                textColor: 'text-[#eecfa1]',
                stampBg: 'bg-black/25 border-white/15',
                stampIcon: 'text-amber-200/50',
                badgeClass: 'bg-amber-800/20 text-amber-300 border-amber-700/30'
            };
    }
}

// 打亂陣列
function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// =============================================
// ======= SpellLibraryView 主元件 =============
// =============================================
const SpellLibraryView = ({ show, onClose, onSaveRecord, unlockedSpells = [] }) => {
    const [spells, setSpells] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unlockedCount, setUnlockedCount] = useState(0);
    const [viewMode, setViewMode] = useState('room'); // 'room' | 'collection' | 'quiz'
    const [selectedProfessor, setSelectedProfessor] = useState(null);
    const [collectionFilter, setCollectionFilter] = useState('unlocked');
    const [isQuizPlaying, setIsQuizPlaying] = useState(false);
    const [showDropoutConfirm, setShowDropoutConfirm] = useState(false);
    const [dropoutDestination, setDropoutDestination] = useState('close');
    const [forceQuizRestart, setForceQuizRestart] = useState(0);

    const handleCloseClick = () => {
        if (viewMode === 'quiz' && isQuizPlaying) {
            setDropoutDestination('close');
            setShowDropoutConfirm(true);
        } else {
            onClose();
        }
    };

    const handleBackClick = () => {
        if (viewMode === 'quiz' && isQuizPlaying) {
            setDropoutDestination('room');
            setShowDropoutConfirm(true);
            return;
        }
        setViewMode('room');
        setSelectedProfessor(null);
    };

    useEffect(() => {
        if (show) {
            setViewMode('room');
            setSelectedProfessor(null);
            setCollectionFilter('unlocked');
        }
    }, [show]);

    useEffect(() => {
        const fetchSpells = async () => {
            if (!show) return;
            try {
                const q = query(collection(db, "collocations"));
                const snapshot = await getDocs(q);
                let fetchedSpells = snapshot.docs.map(doc => ({
                    ...doc.data(),
                    id: doc.id,
                    isUnlocked: unlockedSpells.includes(doc.id)
                }));
                fetchedSpells.sort((a, b) => {
                    if (a.order && b.order) return a.order - b.order;
                    return a.id.localeCompare(b.id);
                });
                setSpells(fetchedSpells);
                setUnlockedCount(fetchedSpells.filter(s => s.isUnlocked).length);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching spells:", error);
                setLoading(false);
            }
        };
        fetchSpells();
    }, [show, unlockedSpells]);

    if (!show) return null;

    const totalSlots = 120;
    const slots = Array.from({ length: totalSlots }, (_, i) => {
        const spell = spells[i];
        return { index: i + 1, data: spell || null, isUnlocked: spell?.isUnlocked || false };
    });

    const selectedSection = selectedProfessor === null ? null : PROFESSOR_SECTIONS[selectedProfessor];
    const latestUnlocked = [...slots].reverse().find(slot => slot.isUnlocked && slot.data);
    const canStartPractice = unlockedCount >= 4;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center room-overlay-reveal">
            <div className="absolute inset-0 bg-[#05070d]/90 backdrop-blur-md" onClick={handleCloseClick} />

            <div className="room-panel-reveal relative flex h-[100dvh] w-full max-w-5xl flex-col overflow-hidden bg-[#0b0e17] shadow-[0_24px_90px_rgba(0,0,0,0.75)] sm:h-[94dvh] sm:w-[calc(100%-2rem)] sm:rounded-3xl sm:border sm:border-amber-500/30">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(245,158,11,0.12),transparent_34%),radial-gradient(circle_at_8%_72%,rgba(127,29,29,0.12),transparent_28%),linear-gradient(145deg,#111827_0%,#090b12_54%,#170f0b_100%)]" />
                <div className="room-light-seam pointer-events-none absolute inset-y-0 left-1/2 z-0 w-px bg-amber-200/20 shadow-[0_0_36px_8px_rgba(252,211,77,0.06)]" />

                {/* ===== Header ===== */}
                <div className="relative z-20 flex min-h-[72px] items-center justify-between border-b border-amber-500/15 bg-[#0b0e17]/90 px-3 py-3 backdrop-blur-xl sm:px-6">
                    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                        <button
                            onClick={viewMode === 'room' ? handleCloseClick : handleBackClick}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-amber-200 transition-colors hover:border-amber-400/40 hover:bg-amber-400/10"
                            aria-label={viewMode === 'room' ? '返回主畫面' : '返回萬應室大廳'}
                            title={viewMode === 'room' ? '返回主畫面' : '返回萬應室大廳'}
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div className="min-w-0">
                            <p className="mb-0.5 text-[9px] font-bold uppercase tracking-[0.28em] text-amber-500/50">
                                {viewMode === 'quiz' ? 'Spell Examination' : viewMode === 'collection' ? 'Professor Collection' : 'The Room of Requirement'}
                            </p>
                            <h2 className="truncate font-serif text-base font-bold tracking-wide text-amber-100 sm:text-xl">
                                {viewMode === 'quiz' ? '咒語測驗' : selectedSection ? selectedSection.name : '萬應室・失傳咒語'}
                            </h2>
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                        {viewMode !== 'quiz' && (
                            <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 sm:flex">
                                <span className="font-mono text-sm font-bold text-amber-300">{unlockedCount}</span>
                                <span className="text-[10px] text-stone-500">/ {totalSlots} 已尋回</span>
                            </div>
                        )}
                        <button
                            onClick={handleCloseClick}
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-stone-300 transition-colors hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-200"
                            aria-label="關閉萬應室"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* ===== Content Area ===== */}
                <div className="relative z-10 flex min-h-0 flex-1 flex-col">
                    {loading ? (
                        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-amber-300/70">
                            <Sparkles size={34} className="animate-pulse" />
                            <p className="text-sm tracking-widest">房間正在回應你的需要…</p>
                        </div>
                    ) : (
                        <>
                            {viewMode === 'room' && (
                                <RoomOverview
                                    slots={slots}
                                    unlockedCount={unlockedCount}
                                    latestUnlocked={latestUnlocked}
                                    onSelectProfessor={(professorIndex) => {
                                        setSelectedProfessor(professorIndex);
                                        setCollectionFilter('unlocked');
                                        setViewMode('collection');
                                    }}
                                />
                            )}
                            {viewMode === 'collection' && selectedSection && (
                                <CollectionView
                                    slots={slots}
                                    professor={selectedSection}
                                    filter={collectionFilter}
                                    onFilterChange={setCollectionFilter}
                                />
                            )}
                            {viewMode === 'quiz' && (
                                <QuizView
                                    slots={slots}
                                    allSpells={spells}
                                    setIsPlaying={setIsQuizPlaying}
                                    onSaveRecord={onSaveRecord}
                                    forceRestart={forceQuizRestart}
                                />
                            )}
                        </>
                    )}

                    {viewMode !== 'quiz' && !loading && (
                        <div className="relative z-20 border-t border-amber-500/15 bg-[#0b0e17]/95 px-4 py-3 backdrop-blur-xl sm:px-6">
                            <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
                                <div className="hidden min-w-0 sm:block">
                                    <p className="text-xs font-bold text-amber-100">把收藏變成真正記得的咒語</p>
                                    <p className="mt-0.5 text-[10px] text-stone-500">
                                        {canStartPractice ? `目前可練習 ${unlockedCount} 道咒語` : `再尋回 ${Math.max(4 - unlockedCount, 0)} 道咒語即可開始練習`}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setViewMode('quiz')}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-400/30 bg-gradient-to-r from-amber-700 to-red-900 px-5 py-3 text-sm font-bold text-amber-50 shadow-lg shadow-black/30 transition-all hover:-translate-y-0.5 hover:from-amber-600 hover:to-red-800 sm:w-auto"
                                >
                                    <Swords size={17} />
                                    練習與測驗
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ===== Drop out \u78ba\u8a8d\u8986\u5c64 (Global inside modal) ===== */}
                {showDropoutConfirm && (
                    <div className="absolute inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn">
                        <div className="bg-gradient-to-br from-[#2d1b15] to-[#1a0f0a] rounded-2xl border-2 border-amber-700/50 p-8 max-w-xs w-full mx-4 text-center shadow-2xl">
                            <div className="text-4xl mb-4">🧙</div>
                            <h3 className="text-xl font-serif font-bold text-amber-100 mb-2">Drop out?</h3>
                            <p className="text-amber-500/60 text-sm mb-6">
                                放棄測驗後，本次進度將不會記錄。
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDropoutConfirm(false)}
                                    className="flex-1 py-3 rounded-xl font-bold border-2 border-amber-600/40 text-amber-300 hover:bg-amber-900/20 transition-all"
                                >
                                    繼續作答
                                </button>
                                <button
                                    onClick={() => {
                                        setShowDropoutConfirm(false);
                                        setForceQuizRestart(prev => prev + 1);
                                        setIsQuizPlaying(false);
                                        if (dropoutDestination === 'room') {
                                            setViewMode('room');
                                            setSelectedProfessor(null);
                                        } else {
                                            onClose();
                                        }
                                    }}
                                    className="flex-1 py-3 rounded-xl font-bold bg-gradient-to-r from-red-800 to-red-900 text-red-200 hover:from-red-700 hover:to-red-800 border border-red-700/40 transition-all"
                                >
                                    放棄
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .perspective-1000 { perspective: 1000px; }
                .transform-style-3d { transform-style: preserve-3d; -webkit-transform-style: preserve-3d; }
                .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
                .rotate-y-180 { transform: rotateY(180deg); }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(15, 23, 42, 0.45); }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(217, 119, 6, 0.34); border-radius: 999px; }
                @keyframes roomOverlayReveal { from { opacity: 0; } to { opacity: 1; } }
                @keyframes roomPanelReveal { from { opacity: 0; transform: scale(0.965) translateY(16px); } to { opacity: 1; transform: scale(1) translateY(0); } }
                @keyframes roomLightSeam { 0% { opacity: 0; transform: scaleY(0.35); } 55% { opacity: 1; } 100% { opacity: 0.35; transform: scaleY(1); } }
                .room-overlay-reveal { animation: roomOverlayReveal 320ms ease-out both; }
                .room-panel-reveal { animation: roomPanelReveal 460ms cubic-bezier(.2,.75,.2,1) both; }
                .room-light-seam { transform-origin: center; animation: roomLightSeam 800ms ease-out both; }
                @media (prefers-reduced-motion: reduce) {
                    .room-overlay-reveal, .room-panel-reveal, .room-light-seam { animation: none; }
                }
            `}</style>
        </div>
    );
};

// =============================================
// ======= 萬應室大廳 ===========================
// =============================================
const RoomOverview = ({ slots, unlockedCount, latestUnlocked, onSelectProfessor }) => {
    const progress = Math.min(Math.round((unlockedCount / 120) * 100), 100);

    return (
        <div className="custom-scrollbar flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-7">
            <div className="mx-auto max-w-4xl space-y-7">
                <section className="relative overflow-hidden rounded-2xl border border-amber-400/20 bg-black/25 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:p-7">
                    <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-amber-400/10 blur-3xl" />
                    <div className="relative grid gap-5 sm:grid-cols-[1fr_230px] sm:items-center">
                        <div>
                            <div className="mb-3 flex items-center gap-2 text-amber-300/70">
                                <Sparkles size={15} />
                                <span className="text-[10px] font-bold uppercase tracking-[0.25em]">The room has appeared</span>
                            </div>
                            <h3 className="max-w-xl font-serif text-2xl font-bold leading-tight text-amber-50 sm:text-3xl">
                                你帶回的每一道咒語，<br className="hidden sm:block" />都讓房間更加完整。
                            </h3>
                            <p className="mt-3 max-w-xl text-sm leading-relaxed text-stone-400">
                                六位教授將失傳咒語封存在不同的收藏櫃中。選擇一位教授，查看你已尋回的知識。
                            </p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-[#111827]/70 p-4 shadow-lg shadow-black/20">
                            <div className="flex items-end justify-between">
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-stone-500">Collection</p>
                                    <p className="mt-1 font-mono text-3xl font-bold text-amber-300">{unlockedCount}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-mono text-sm font-bold text-stone-300">{progress}%</p>
                                    <p className="text-[10px] text-stone-600">of 120 spells</p>
                                </div>
                            </div>
                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/50 ring-1 ring-white/5">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-amber-700 via-amber-400 to-yellow-200 transition-all duration-700"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <div className="mt-4 border-t border-white/5 pt-3">
                                <p className="text-[10px] uppercase tracking-wider text-stone-600">最近尋回</p>
                                <p className="mt-1 truncate font-serif text-sm font-bold text-amber-100/90">
                                    {latestUnlocked?.data?.phrase || '房間正在等待第一道咒語'}
                                </p>
                                <p className="mt-0.5 truncate text-[11px] text-stone-500">
                                    {latestUnlocked?.data?.meaning || '完成關卡並取得戰利品後，它就會在這裡現身。'}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section>
                    <div className="mb-4 flex items-end justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-500/50">Six hidden collections</p>
                            <h3 className="mt-1 font-serif text-xl font-bold text-amber-100">教授的魔法收藏櫃</h3>
                        </div>
                        <p className="hidden text-right text-[11px] leading-relaxed text-stone-600 sm:block">
                            每座收藏櫃封存 20 道咒語
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {PROFESSOR_SECTIONS.map((professor, professorIndex) => {
                            const theme = PROFESSOR_THEMES[professor.themeKey];
                            const ProfessorIcon = theme.icon;
                            const sectionSlots = slots.slice(professor.range[0] - 1, professor.range[1]);
                            const sectionUnlocked = sectionSlots.filter(slot => slot.isUnlocked).length;
                            const sectionProgress = Math.round((sectionUnlocked / sectionSlots.length) * 100);

                            return (
                                <button
                                    key={professor.themeKey}
                                    onClick={() => onSelectProfessor(professorIndex)}
                                    aria-label={`查看${professor.name}的收藏，已尋回 ${sectionUnlocked} 道咒語`}
                                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#10131d]/80 p-4 text-left shadow-lg shadow-black/20 transition-all duration-300 hover:-translate-y-1 hover:border-amber-400/30 hover:bg-[#151923] hover:shadow-xl"
                                >
                                    <div className={`absolute inset-y-0 left-0 w-1 ${professor.accent} opacity-60 transition-all group-hover:w-1.5 group-hover:opacity-100`} />
                                    <div className="flex items-start gap-3.5">
                                        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white/70 shadow-inner">
                                            <ProfessorIcon size={20} />
                                            <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#10131d] ${professor.accent}`} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <h4 className="truncate font-serif text-base font-bold text-amber-50/90">{professor.name}</h4>
                                                    <p className="truncate text-[10px] italic text-amber-500/45">{professor.spell}</p>
                                                </div>
                                                <ChevronRight size={17} className="mt-0.5 shrink-0 text-stone-600 transition-all group-hover:translate-x-1 group-hover:text-amber-300" />
                                            </div>
                                            <p className="mt-3 line-clamp-2 min-h-[34px] text-[11px] leading-relaxed text-stone-500">{professor.desc}</p>
                                            <div className="mt-3 flex items-center gap-3">
                                                <div className="h-1 flex-1 overflow-hidden rounded-full bg-black/50">
                                                    <div className={`h-full rounded-full ${professor.accent}`} style={{ width: `${sectionProgress}%` }} />
                                                </div>
                                                <span className="font-mono text-[10px] font-bold text-stone-400">{sectionUnlocked}/20</span>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </section>
            </div>
        </div>
    );
};

// =============================================
// ======= 單一教授收藏 =========================
// =============================================
const CollectionView = ({ slots, professor, filter, onFilterChange }) => {
    const theme = PROFESSOR_THEMES[professor.themeKey];
    const ProfessorIcon = theme.icon;
    const sectionSlots = slots.slice(professor.range[0] - 1, professor.range[1]);
    const unlockedSlots = sectionSlots.filter(slot => slot.isUnlocked);
    const visibleSlots = filter === 'unlocked' ? unlockedSlots : sectionSlots;

    return (
        <div className="custom-scrollbar flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-7">
            <div className="mx-auto max-w-4xl">
                <section className="mb-5 overflow-hidden rounded-2xl border border-white/10 bg-black/25 p-4 sm:p-5">
                    <div className="flex items-start gap-4">
                        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border ${professor.folderBorder} bg-gradient-to-br ${professor.folderColor} text-white shadow-lg ${professor.glow}`}>
                            <ProfessorIcon size={23} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-500/45">Sealed Collection</p>
                            <h3 className="mt-1 font-serif text-xl font-bold text-amber-50">{professor.spell}</h3>
                            <p className="mt-1 text-xs leading-relaxed text-stone-500">{professor.desc}</p>
                        </div>
                        <div className="hidden shrink-0 text-right sm:block">
                            <p className="font-mono text-2xl font-bold text-amber-300">{unlockedSlots.length}</p>
                            <p className="text-[10px] text-stone-600">/ 20 已尋回</p>
                        </div>
                    </div>
                </section>

                <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                        <h3 className="font-serif text-lg font-bold text-amber-100">咒語收藏</h3>
                        <p className="mt-0.5 text-[10px] text-stone-600 sm:hidden">已尋回 {unlockedSlots.length} / 20</p>
                    </div>
                    <div className="flex rounded-xl border border-white/10 bg-black/30 p-1">
                        <button
                            onClick={() => onFilterChange('unlocked')}
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${filter === 'unlocked' ? 'bg-amber-600/20 text-amber-300' : 'text-stone-500 hover:text-stone-300'}`}
                        >
                            <Eye size={14} />
                            已收藏
                        </button>
                        <button
                            onClick={() => onFilterChange('all')}
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${filter === 'all' ? 'bg-white/10 text-stone-200' : 'text-stone-500 hover:text-stone-300'}`}
                        >
                            <EyeOff size={14} />
                            全部 20
                        </button>
                    </div>
                </div>

                {visibleSlots.length > 0 ? (
                    <div className="grid auto-rows-[190px] grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                        {visibleSlots.map(slot => <SpellCard key={slot.index} slot={slot} />)}
                    </div>
                ) : (
                    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-amber-500/20 bg-black/15 px-6 text-center">
                        <Lock size={30} className="mb-3 text-amber-500/35" />
                        <h4 className="font-serif text-lg font-bold text-amber-100/80">這座收藏櫃仍在等待</h4>
                        <p className="mt-2 max-w-sm text-xs leading-relaxed text-stone-500">
                            完成關卡並取得戰利品後，失傳咒語就會在這裡現身。
                        </p>
                        <button
                            onClick={() => onFilterChange('all')}
                            className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-stone-300 transition-colors hover:bg-white/10"
                        >
                            查看尚未解鎖的位置
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// =============================================
// ======= Quiz View (測驗模式) =================
// =============================================
const QuizView = ({ slots, allSpells, setIsPlaying, onSaveRecord, forceRestart }) => {
    const [quizState, setQuizState] = useState('select'); // 'select' | 'playing' | 'result'
    const [quizMode, setQuizMode] = useState(null); // null | 'practice' | 'challenge'
    const [selectedProfs, setSelectedProfs] = useState(new Set());
    const [questions, setQuestions] = useState([]);
    const [currentQ, setCurrentQ] = useState(0);
    const [score, setScore] = useState(0);
    const [answered, setAnswered] = useState(null); // null | 'correct' | 'wrong'
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [answerHistory, setAnswerHistory] = useState([]); // 新增：紀錄答題歷程

    // 回報 playing 狀態給父層 (控制右上角 X 按鈕)
    useEffect(() => {
        if (setIsPlaying) setIsPlaying(quizState === 'playing');
    }, [quizState, setIsPlaying]);

    // 父層強制重置 (例如 Dropout 放棄後) // Although if it completely closes, this might just run once before unmount
    useEffect(() => {
        if (forceRestart > 0) {
            restart();
        }
    }, [forceRestart]);

    // 切換選擇教授
    const toggleProf = (idx) => {
        setSelectedProfs(prev => {
            const next = new Set(prev);
            if (next.has(idx)) next.delete(idx);
            else next.add(idx);
            return next;
        });
    };

    const selectAll = () => {
        if (selectedProfs.size === PROFESSOR_SECTIONS.length) {
            setSelectedProfs(new Set());
        } else {
            setSelectedProfs(new Set(PROFESSOR_SECTIONS.map((_, i) => i)));
        }
    };

    // 開始測驗
    const startQuiz = () => {
        let pool = [];

        if (quizMode === 'practice') {
            // 練習模式：直接取所有已解鎖和星，不需選教授
            slots.forEach(s => {
                if (s.data && s.isUnlocked) pool.push(s.data);
            });
        } else {
            // 挑戰模式：依教授範圍，包含未解鎖咊語
            selectedProfs.forEach(pIdx => {
                const prof = PROFESSOR_SECTIONS[pIdx];
                const sectionSlots = slots.slice(prof.range[0] - 1, prof.range[1]);
                sectionSlots.forEach(s => {
                    if (s.data) pool.push(s.data);
                });
            });
        }

        if (pool.length < 4) return; // 需要至少 4 題才能產生選項

        // 打亂取最多 20 題
        const shuffled = shuffleArray(pool);
        const selected = shuffled.slice(0, Math.min(20, shuffled.length));

        // 為每一題生成 4 個選項
        const allPhrases = allSpells.map(s => s.phrase).filter(Boolean);
        const qs = selected.map(spell => {
            const correctAnswer = spell.phrase;
            // 取 3 個錯誤選項（排除正確答案）
            const wrongPool = allPhrases.filter(p => p !== correctAnswer);
            const wrongChoices = shuffleArray(wrongPool).slice(0, 3);
            const options = shuffleArray([correctAnswer, ...wrongChoices]);
            return {
                meaning: spell.meaning,
                correctAnswer,
                rarity: spell.rarity,
                chapterId: spell.chapterId,
                options,
            };
        });

        setQuestions(qs);
        setCurrentQ(0);
        setScore(0);
        setAnswered(null);
        setSelectedAnswer(null);
        setAnswerHistory([]);
        setQuizState('playing');
    };

    // 作答
    const handleAnswer = (choice) => {
        if (answered) return;
        const isCorrect = choice === questions[currentQ].correctAnswer;
        setSelectedAnswer(choice);
        setAnswered(isCorrect ? 'correct' : 'wrong');
        if (isCorrect) setScore(prev => prev + 1);
    };

    // 下一題
    const nextQuestion = () => {
        // 紀錄當前答題結果
        const resultInfo = {
            meaning: questions[currentQ].meaning,
            correctAnswer: questions[currentQ].correctAnswer,
            userAnswer: selectedAnswer,
            isCorrect: selectedAnswer === questions[currentQ].correctAnswer
        };

        if (currentQ + 1 >= questions.length) {
            setAnswerHistory(prev => [...prev, resultInfo]);
            setQuizState('result');
            // 計算成績並儲存
            if (onSaveRecord) {
                const pct = Math.round((score / questions.length) * 100);
                let rank = 'E';
                if (pct >= 90) rank = 'S';
                else if (pct >= 80) rank = 'A';
                else if (pct >= 70) rank = 'B';
                else if (pct >= 60) rank = 'C';
                else if (pct >= 50) rank = 'D';

                // score 傳分數(例如 20), 因為 ArchivesModal 只負責顯示數字
                onSaveRecord('lost_spells', '萬應室', score, rank);
            }
        } else {
            setAnswerHistory(prev => [...prev, resultInfo]);
            setCurrentQ(prev => prev + 1);
            setAnswered(null);
            setSelectedAnswer(null);
        }
    };

    // 重新開始
    const restart = () => {
        setQuizState('select');
        setQuizMode(null); // 回到模式選擇
        setSelectedProfs(new Set());
        setQuestions([]);
        setCurrentQ(0);
        setScore(0);
        setAnswered(null);
        setSelectedAnswer(null);
        setAnswerHistory([]);
    };

    // ---- Selection Screen ----
    if (quizState === 'select') {
        return (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar relative z-10">
                <div className="max-w-2xl mx-auto space-y-5">

                    {/* Title */}
                    <div className="text-center mb-4">
                        <Swords className="text-amber-500 mx-auto mb-2" size={32} />
                        <h3 className="text-xl font-serif font-bold text-amber-100">咒語測驗</h3>
                        <p className="text-xs text-amber-500/50 mt-1">選擇測驗模式</p>
                    </div>

                    {/* ===== 模式選擇區塊 ===== */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                        {/* 練習已學習咊語 */}
                        <button
                            onClick={() => setQuizMode('practice')}
                            className={`relative group p-5 rounded-2xl border-2 text-left transition-all duration-200
                                ${quizMode === 'practice'
                                    ? 'bg-gradient-to-br from-emerald-900/60 to-emerald-950/80 border-emerald-400/70 shadow-[0_0_20px_rgba(52,211,153,0.2)] scale-[1.02]'
                                    : 'bg-black/30 border-white/10 hover:border-emerald-500/40 hover:bg-emerald-950/20'
                                }`}
                        >
                            {quizMode === 'practice' && (
                                <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                                    <Check size={12} className="text-white" />
                                </div>
                            )}
                            <div className="text-2xl mb-2">✨</div>
                            <h4 className={`font-serif font-bold text-base mb-1 ${quizMode === 'practice' ? 'text-emerald-300' : 'text-white/70'}`}>
                                練習已學習咒語
                            </h4>
                            <p className={`text-xs leading-relaxed ${quizMode === 'practice' ? 'text-emerald-200/60' : 'text-white/30'}`}>
                                只測驗已解鎖的咒語，適合鞏固記憶。
                            </p>
                        </button>

                        {/* 挑戰未知咊語 */}
                        <button
                            onClick={() => setQuizMode('challenge')}
                            className={`relative group p-5 rounded-2xl border-2 text-left transition-all duration-200
                                ${quizMode === 'challenge'
                                    ? 'bg-gradient-to-br from-amber-900/60 to-red-950/80 border-amber-400/70 shadow-[0_0_20px_rgba(245,158,11,0.2)] scale-[1.02]'
                                    : 'bg-black/30 border-white/10 hover:border-amber-500/40 hover:bg-amber-950/20'
                                }`}
                        >
                            {quizMode === 'challenge' && (
                                <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                                    <Check size={12} className="text-white" />
                                </div>
                            )}
                            <div className="text-2xl mb-2">⚡</div>
                            <h4 className={`font-serif font-bold text-base mb-1 ${quizMode === 'challenge' ? 'text-amber-300' : 'text-white/70'}`}>
                                挑戰未知咒語
                            </h4>
                            <p className={`text-xs leading-relaxed ${quizMode === 'challenge' ? 'text-amber-200/60' : 'text-white/30'}`}>
                                包含未解鎖咒語，你將面對完全未知的考驗。
                            </p>
                        </button>
                    </div>

                    {/* ===== practice 模式：直接開始（不選教授） ===== */}
                    {quizMode === 'practice' && (
                        <div className="space-y-3 animate-fadeIn">
                            <div className="text-center py-3 px-4 rounded-xl bg-emerald-900/20 border border-emerald-400/20">
                                <p className="text-emerald-300/80 text-sm font-serif">
                                    將測驗你已解鎖的所有咒語
                                </p>
                                <p className="text-emerald-500/50 text-xs mt-1">
                                    共 {slots.filter(s => s.data && s.isUnlocked).length} 個咒語可用於測驗
                                </p>
                            </div>
                            <button
                                onClick={startQuiz}
                                disabled={slots.filter(s => s.data && s.isUnlocked).length < 4}
                                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all
                                    ${slots.filter(s => s.data && s.isUnlocked).length >= 4
                                        ? 'bg-gradient-to-r from-emerald-700 to-teal-700 text-white hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-900/30 hover:shadow-emerald-900/50 transform hover:-translate-y-0.5'
                                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                    }`}
                            >
                                <Swords size={20} />
                                開始練習
                            </button>
                        </div>
                    )}

                    {/* ===== challenge 模式：選教授範圍 ===== */}
                    {quizMode === 'challenge' && (
                        <div className="space-y-4 animate-fadeIn">
                            <div className="flex items-center justify-between">
                                <p className="text-amber-500/60 text-xs uppercase tracking-widest">
                                    ⚡ 選擇教授範圍
                                </p>
                                <button onClick={selectAll}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-amber-600/30 text-amber-400 hover:bg-amber-900/20 transition-colors">
                                    <Check size={14} />
                                    {selectedProfs.size === PROFESSOR_SECTIONS.length ? '取消全選' : '全選'}
                                </button>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {PROFESSOR_SECTIONS.map((prof, pIdx) => {
                                    const theme = PROFESSOR_THEMES[prof.themeKey];
                                    const ProfIcon = theme.icon;
                                    const isSelected = selectedProfs.has(pIdx);
                                    const sectionSlots = slots.slice(prof.range[0] - 1, prof.range[1]);
                                    const spellCount = sectionSlots.filter(s => s.data).length;

                                    return (
                                        <button key={pIdx}
                                            onClick={() => toggleProf(pIdx)}
                                            className={`relative p-4 rounded-xl border-2 transition-all text-left group
                                                ${isSelected
                                                    ? `bg-gradient-to-br ${prof.folderColor} ${prof.folderBorder} shadow-lg scale-[1.02]`
                                                    : 'bg-black/20 border-white/10 hover:border-white/20 hover:bg-black/30'
                                                }`}
                                        >
                                            {isSelected && (
                                                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                                                    <Check size={12} className="text-white" />
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2.5 mb-2">
                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border
                                                    ${isSelected ? 'bg-white/15 border-white/25' : 'bg-white/5 border-white/10'}`}>
                                                    <ProfIcon size={18} className={isSelected ? 'text-white' : 'text-white/40'} />
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className={`text-sm font-serif font-bold leading-tight truncate ${isSelected ? 'text-white' : 'text-white/50'}`}>
                                                        {prof.name}
                                                    </h4>
                                                    <p className={`text-[10px] italic truncate ${isSelected ? 'text-white/60' : 'text-white/25'}`}>
                                                        {prof.spell}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={`text-[11px] font-mono ${isSelected ? 'text-white/60' : 'text-white/25'}`}>
                                                {spellCount} spells · #{prof.range[0]}-{prof.range[1]}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={startQuiz}
                                disabled={selectedProfs.size === 0}
                                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all mt-2
                                    ${selectedProfs.size > 0
                                        ? 'bg-gradient-to-r from-amber-600 to-orange-700 text-white hover:from-amber-500 hover:to-orange-600 shadow-lg shadow-amber-900/30 hover:shadow-amber-900/50 transform hover:-translate-y-0.5'
                                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                    }`}
                            >
                                <Swords size={20} />
                                開始測驗
                                {selectedProfs.size > 0 && (
                                    <span className="text-sm opacity-80 ml-1">
                                        ({selectedProfs.size} 位教授)
                                    </span>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ---- Playing Screen ----
    if (quizState === 'playing') {
        const q = questions[currentQ];
        const profTheme = PROFESSOR_THEMES[q.chapterId] || PROFESSOR_THEMES['endgame_01'];
        const QIcon = profTheme.icon;
        const rs = getRarityStyle(q.rarity);

        return (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar relative z-10">
                <div className="max-w-lg mx-auto">
                    {/* 進度列 */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <span className="text-amber-400 font-mono text-sm font-bold">{currentQ + 1}/{questions.length}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${rs.badgeClass}`}>
                                {q.rarity}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 size={14} className="text-green-400" />
                            <span className="text-green-400 font-mono text-sm">{score}</span>
                        </div>
                    </div>

                    {/* 進度條 */}
                    <div className="w-full bg-white/5 h-1.5 rounded-full mb-8 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500 rounded-full"
                            style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} />
                    </div>

                    {/* 題目卡片 */}
                    <div className="relative bg-gradient-to-br from-[#2d1b15] to-[#1a0f0a] rounded-2xl border-2 border-amber-800/40 p-6 sm:p-8 mb-6 shadow-xl">
                        <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 border border-white/10 flex items-center justify-center">
                            <QIcon size={16} className="text-white/40" />
                        </div>
                        <p className="text-[11px] text-amber-500/50 uppercase tracking-widest mb-3">以下中文意思對應的咒語是？</p>
                        <h2 className="text-2xl sm:text-3xl font-bold text-amber-100 font-serif leading-relaxed">
                            {q.meaning}
                        </h2>
                    </div>

                    {/* 選項 */}
                    <div className="space-y-3">
                        {q.options.map((opt, i) => {
                            let optClass = 'bg-black/20 border-white/10 hover:border-amber-500/40 hover:bg-black/30 text-amber-200';
                            if (answered) {
                                if (opt === q.correctAnswer) {
                                    optClass = 'bg-green-900/30 border-green-500/50 text-green-300';
                                } else if (opt === selectedAnswer && answered === 'wrong') {
                                    optClass = 'bg-red-900/30 border-red-500/50 text-red-300';
                                } else {
                                    optClass = 'bg-black/10 border-white/5 text-white/30';
                                }
                            }

                            return (
                                <button key={i}
                                    onClick={() => handleAnswer(opt)}
                                    disabled={!!answered}
                                    className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${optClass}`}
                                >
                                    <span className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold shrink-0">
                                        {String.fromCharCode(65 + i)}
                                    </span>
                                    <span className="text-sm sm:text-base font-serif font-bold flex-1">{opt}</span>
                                    {answered && opt === q.correctAnswer && <CheckCircle2 size={18} className="text-green-400 shrink-0" />}
                                    {answered === 'wrong' && opt === selectedAnswer && <XCircle size={18} className="text-red-400 shrink-0" />}
                                </button>
                            );
                        })}
                    </div>

                    {/* 下一題按鈕 */}
                    {answered && (
                        <button onClick={nextQuestion}
                            className="w-full mt-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-orange-700 text-white hover:from-amber-500 hover:to-orange-600 shadow-lg transition-all animate-fadeIn">
                            {currentQ + 1 >= questions.length ? '查看結果' : '下一題'}
                            <ChevronRight size={18} />
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // ---- Result Screen ----
    if (quizState === 'result') {
        const pct = Math.round((score / questions.length) * 100);
        const grade = pct >= 90 ? 'O.W.L. 傑出' : pct >= 70 ? 'E.E. 超乎期待' : pct >= 50 ? 'A. 可接受' : 'T. 巨怪';
        const gradeColor = pct >= 90 ? 'text-yellow-300' : pct >= 70 ? 'text-blue-300' : pct >= 50 ? 'text-amber-300' : 'text-red-400';

        return (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar relative z-10 flex items-center justify-center">
                <div className="max-w-md w-full text-center space-y-6">
                    <div className="relative">
                        <Sparkles className="text-amber-500 mx-auto mb-3 animate-pulse" size={48} />
                        <h2 className="text-3xl font-serif font-bold text-amber-100">測驗結束</h2>
                        <p className="text-sm text-amber-500/50 mt-1">Examination Complete</p>
                    </div>

                    {/* 分數圈 */}
                    <div className="relative w-36 h-36 mx-auto">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                            <circle cx="50" cy="50" r="42" fill="none" stroke="url(#scoreGrad)" strokeWidth="6"
                                strokeDasharray={`${pct * 2.64} ${264 - pct * 2.64}`}
                                strokeLinecap="round" className="transition-all duration-1000" />
                            <defs>
                                <linearGradient id="scoreGrad"><stop offset="0%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#ea580c" /></linearGradient>
                            </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold text-white font-mono">{score}/{questions.length}</span>
                            <span className="text-xs text-amber-500/60">{pct}%</span>
                        </div>
                    </div>

                    {/* 等級 */}
                    <div className={`text-2xl font-serif font-bold ${gradeColor}`}>
                        {grade}
                    </div>

                    {/* 答題明細 (Review Table) */}
                    {answerHistory.length > 0 && (
                        <div className="bg-black/40 rounded-xl p-4 border border-white/10 max-h-[30vh] overflow-y-auto custom-scrollbar text-left space-y-3 shadow-inner">
                            {answerHistory.map((item, idx) => (
                                <div key={idx} className="border-b border-white/5 pb-3 mb-1 last:border-0 last:pb-0 last:mb-0">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-white/5">
                                            <span className="text-[10px] font-mono text-white/30">{idx + 1}</span>
                                        </div>
                                        <div className="flex-1 min-w-0 pt-0.5">
                                            <p className="text-sm font-serif font-bold text-amber-100/90 truncate mb-1" title={item.meaning}>
                                                {item.meaning}
                                            </p>
                                            <div className="flex flex-col gap-1 text-xs">
                                                <div className="flex items-center gap-1.5">
                                                    <CheckCircle2 size={12} className="text-green-400" />
                                                    <span className="text-green-300 font-bold">
                                                        正解: {item.correctAnswer}
                                                    </span>
                                                </div>
                                                {!item.isCorrect && (
                                                    <div className="flex items-center gap-1.5">
                                                        <XCircle size={12} className="text-red-400" />
                                                        <span className="text-red-300/80 line-through">
                                                            你的: {item.userAnswer}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* 按鈕 */}
                    <div className="space-y-3 pt-4">
                        <button onClick={restart}
                            className="w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-orange-700 text-white hover:from-amber-500 hover:to-orange-600 shadow-lg transition-all">
                            <RotateCcw size={18} />
                            重新選擇教授
                        </button>
                        <button onClick={() => { restart(); startQuiz(); }}
                            className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 border-2 border-amber-700/30 text-amber-400 hover:bg-amber-900/20 transition-all">
                            <Swords size={16} />
                            相同範圍再測一次
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

// =============================================
// ======= Spell Card Component (卡片元件) ======
// =============================================
const SpellCard = ({ slot }) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const [visibleFace, setVisibleFace] = useState('front');
    const faceSwapTimerRef = useRef(null);
    const flipEndTimerRef = useRef(null);
    const isAnimatingRef = useRef(false);
    const { isUnlocked, data, index } = slot;

    const spellName = data?.phrase || `Spell #${index}`;
    const spellMeaning = data?.meaning || "Locked Content";
    const rarity = data?.rarity || "Common";

    const chapterId = data?.chapterId || getChapterIdFromIndex(index);
    const profTheme = PROFESSOR_THEMES[chapterId] || PROFESSOR_THEMES['endgame_01'];
    const IconComponent = profTheme.icon;
    const rs = getRarityStyle(rarity);

    useEffect(() => () => {
        clearTimeout(faceSwapTimerRef.current);
        clearTimeout(flipEndTimerRef.current);
    }, []);

    const handleFlip = () => {
        if (!isUnlocked || isAnimatingRef.current) return;

        const nextIsFlipped = !isFlipped;
        isAnimatingRef.current = true;
        setIsFlipped(nextIsFlipped);

        // iOS Safari 有時會忽略 3D 卡面的 backface-visibility，導致兩面文字重疊。
        // 等卡片轉到側邊、兩面都看不見時才交換可見卡面，可完全避開鏡像殘影。
        faceSwapTimerRef.current = setTimeout(() => {
            setVisibleFace(nextIsFlipped ? 'back' : 'front');
        }, 350);
        flipEndTimerRef.current = setTimeout(() => {
            isAnimatingRef.current = false;
        }, 700);
    };

    return (
        <button
            type="button"
            className={`relative h-full w-full perspective-1000 group text-left ${isUnlocked
                ? `cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:scale-[1.025] focus:outline-none focus:ring-2 focus:ring-amber-400/60 ${rs.shadow}`
                : 'cursor-not-allowed opacity-60'
                }`}
            onClick={handleFlip}
            disabled={!isUnlocked}
            aria-label={isUnlocked ? `${spellName}，點擊翻面查看意思` : `第 ${index} 道咒語尚未尋回`}
        >
            <div className={`relative w-full h-full transition-all duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>

                {/* === 卡片正面 === */}
                <div
                    className="absolute inset-0 w-full h-full backface-hidden"
                    aria-hidden={visibleFace !== 'front'}
                    style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        opacity: visibleFace === 'front' ? 1 : 0,
                        visibility: visibleFace === 'front' ? 'visible' : 'hidden',
                        zIndex: visibleFace === 'front' ? 1 : 0,
                    }}
                >
                    <div className={`flex h-full w-full flex-col items-center justify-between overflow-hidden rounded-xl border p-3 shadow-lg
                        ${isUnlocked ? `${rs.bg} ${rs.border} text-white` : 'border-white/10 bg-gradient-to-br from-[#151923] to-[#0c0f17] text-white'}`}
                    >
                        {isUnlocked ? (
                            <>
                                <div className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center z-10 border ${rs.stampBg}`}>
                                    <IconComponent size={14} className={rs.stampIcon} />
                                </div>
                                <div className="w-full text-[10px] opacity-80 font-mono z-10">
                                    <span>#{String(index).padStart(3, '0')}</span>
                                </div>
                                <div className="flex-1 flex flex-col items-center justify-center text-center z-10 px-1">
                                    <h3 className={`text-base font-bold font-serif leading-tight drop-shadow-md line-clamp-3 ${rs.textColor}`}>
                                        {spellName}
                                    </h3>
                                </div>
                                <div className="w-full text-center z-10">
                                    <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent mb-1.5" />
                                    <p className="text-[11px] font-light opacity-75 truncate w-full">
                                        {spellMeaning}
                                    </p>
                                </div>
                                {rarity === 'Legendary' && (
                                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-yellow-200/10 to-transparent pointer-events-none" />
                                )}
                            </>
                        ) : (
                            <div className="flex h-full flex-col items-center justify-center text-stone-600">
                                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/5 bg-black/20">
                                    <Lock size={17} className="opacity-60" />
                                </div>
                                <span className="font-mono text-xs opacity-60">#{String(index).padStart(3, '0')}</span>
                                <span className="mt-1 text-[9px] uppercase tracking-widest opacity-45">Not found</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* === 卡片背面 === */}
                <div
                    className="absolute inset-0 w-full h-full backface-hidden rotate-y-180"
                    aria-hidden={visibleFace !== 'back'}
                    style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                        WebkitTransform: 'rotateY(180deg)',
                        opacity: visibleFace === 'back' ? 1 : 0,
                        visibility: visibleFace === 'back' ? 'visible' : 'hidden',
                        zIndex: visibleFace === 'back' ? 1 : 0,
                    }}
                >
                    <div className="relative flex h-full w-full flex-col items-center justify-between overflow-hidden rounded-xl border-2 border-[#9a7654] bg-[radial-gradient(circle_at_25%_15%,rgba(255,255,255,0.45),transparent_28%),linear-gradient(145deg,#f4e7cc_0%,#dfc89f_100%)] p-3 text-[#3e2723] shadow-xl">
                        <div className="pointer-events-none absolute inset-2 rounded-lg border border-[#8d6e63]/25" />
                        <div className="z-10 w-full text-center mt-2">
                            <h3 className="text-md font-bold font-serif border-b border-[#a1887f] pb-1 mb-2">{spellName}</h3>
                            <p className="text-sm font-medium line-clamp-4 leading-relaxed">{spellMeaning}</p>
                        </div>
                        <div className="z-10 w-full flex justify-between items-center text-[10px] text-[#8d6e63]/80 uppercase tracking-widest mt-auto">
                            <span>{rarity}</span>
                            <span>{profTheme.label}</span>
                        </div>
                    </div>
                </div>
            </div>
        </button>
    );
};

export default SpellLibraryView;
