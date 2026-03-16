import React from 'react';
import { Sparkles, RotateCcw, Map, ArrowRight, Scroll, AlertTriangle } from 'lucide-react';
import Draggable from 'react-draggable';

const isDevMode = false; // 開發模式自由拖曳開關

const DraggableItem = ({ name, children, defaultPos }) => {
    const nodeRef = React.useRef(null);
    const handleStop = (e, data) => {
        if (!nodeRef.current || !nodeRef.current.parentElement) return;
        const parent = nodeRef.current.parentElement;
        const rect = parent.getBoundingClientRect();

        // 算出該節點基點在容器中對應的百分比
        const defaultX = parseFloat(defaultPos?.left || '50') / 100 * rect.width;
        const defaultY = parseFloat(defaultPos?.top || '50') / 100 * rect.height;

        const finalX = defaultX + data.x;
        const finalY = defaultY + data.y;

        const xPercent = (finalX / rect.width) * 100;
        const yPercent = (finalY / rect.height) * 100;

        console.log(`[${name}]\n  top: '${yPercent.toFixed(2)}%',\n  left: '${xPercent.toFixed(2)}%'`);
    };

    if (!isDevMode) {
        return (
            <div className="absolute z-50 pointer-events-auto" style={{ ...defaultPos }}>
                <div className="relative -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    {children}
                </div>
            </div>
        );
    }

    return (
        <Draggable nodeRef={nodeRef} onStop={handleStop}>
            <div ref={nodeRef} className="absolute z-50 cursor-move hover:ring-2 hover:ring-red-500 hover:bg-red-500/20" style={{ ...defaultPos }}>
                <div className="relative -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    {children}
                </div>
            </div>
        </Draggable>
    );
};

const ResultView = ({
    score,
    level,
    historyInfo,
    isTrialMode,
    trialHighScore,
    onRetry,
    onNext,
    onBack,
    hp,
    user,
    sessionWrongAnswers = [],
    hasDraftedLoot,
    onManualOpenLoot,
    onGoToLibrary,
    completedBossStages = 0
}) => {

    const isBossLevel = level?.isBoss === true;

    const getWizardRank = (currentScore, currentHp = 5) => {
        if (currentHp <= 0) {
            return {
                title: "飛怪 (Troll)",
                color: "text-red-500",
                prof: "Gilderoy Lockhart",
                role: "ORDER OF MERLIN (3RD CLASS)",
                message: "「你剛才是在練習單字，還是在跟巨怪跳舞？連派西都比你強。」",
                sigFont: "'Princess Sofia', cursive",
                sigColor: "#db2777",
                sigSize: "text-4xl",
                isTroll: true,
                seal: "lockhart.png",
                grade: "E",
                gradeColor: "text-red-500",
                gradeBg: "from-red-500/20 to-red-600/10"
            };
        }

        if (currentScore >= 1800) return {
            title: "傑出 (Outstanding)",
            color: "text-yellow-400",
            prof: "Albus Dumbledore",
            role: "HEADMASTER",
            message: "「太驚人了！即使是葛萊分多本人，恐怕也無法做得更好了。十分！」",
            sigFont: "'Pinyon Script', serif",
            sigColor: "#b45309",
            sigSize: "text-3xl",
            seal: "dumbledore.png",
            grade: "S",
            gradeColor: "text-yellow-400",
            gradeBg: "from-yellow-400/20 to-amber-500/10"
        };

        if (currentScore >= 1600) return {
            title: "超乎期待 (Exceeds Expectations)",
            color: "text-purple-400",
            prof: "Minerva McGonagall",
            role: "DEPUTY HEADMISTRESS",
            message: "「非常出色。看來變形學並不是唯一你擅長的領域。葛萊分多加十分。」",
            sigFont: "'Mrs Saint Delafield', cursive",
            sigColor: "#065f46",
            sigSize: "text-2xl",
            seal: "mcgonagall.png",
            grade: "A",
            gradeColor: "text-purple-400",
            gradeBg: "from-purple-400/20 to-purple-500/10"
        };

        if (currentScore >= 1400) return {
            title: "合格 (Acceptable)",
            color: "text-green-400",
            prof: "Filius Flitwick",
            role: "CHARMS MASTER",
            message: "「噢，做得好！發音清晰，揮杖動作也相當標準。繼續保持！」",
            sigFont: "'Pinyon Script', serif",
            sigColor: "#1e40af",
            sigSize: "text-xl",
            seal: "flitwick.png",
            grade: "B",
            gradeColor: "text-green-400",
            gradeBg: "from-green-400/20 to-green-500/10"
        };

        if (currentScore >= 1200) return {
            title: "不佳 (Poor)",
            color: "text-orange-400",
            prof: "Remus Lupin",
            role: "DEFENSE AGAINST THE DARK ARTS",
            message: "「別灰心。面對催狂魔時重要的是快樂的回憶，學習也是如此。吃塊巧克力吧。」",
            sigFont: "'Indie Flower', cursive",
            sigColor: "#4b5563",
            sigSize: "text-2xl",
            seal: "lupin.png",
            grade: "C",
            gradeColor: "text-orange-400",
            gradeBg: "from-orange-400/20 to-orange-500/10"
        };

        return {
            title: "極差 (Dreadful)",
            color: "text-slate-400",
            prof: "Severus Snape",
            role: "POTIONS MASTER",
            message: "「顯然，名氣並不能代表一切。重做，否則就禁閉。」",
            sigFont: "'Rock Salt', cursive",
            sigColor: "#000000",
            sigSize: "text-xl",
            seal: "snape.png",
            grade: "D",
            gradeColor: "text-slate-400",
            gradeBg: "from-slate-400/20 to-slate-500/10"
        };
    };

    const rank = getWizardRank(score, hp);

    const prevBestScore = isTrialMode ? trialHighScore : (historyInfo?.highScore || 0);
    const isNewRecord = score > prevBestScore;
    const displayBestScore = isNewRecord ? score : prevBestScore;
    const isPassed = score >= 1400;

    const gradeStyleMap = {
        S: { color: '#fbbf24', shadow: '0 0 20px rgba(251,191,36,0.6), 0 0 40px rgba(251,191,36,0.4), 0 0 80px rgba(251,191,36,0.2), 2px 4px 10px rgba(0,0,0,0.5)' },
        A: { color: '#c084fc', shadow: '0 0 20px rgba(192,132,252,0.6), 0 0 30px rgba(192,132,252,0.4), 0 0 60px rgba(192,132,252,0.2), 2px 4px 10px rgba(0,0,0,0.4)' },
        B: { color: '#4ade80', shadow: '0 0 15px rgba(74,222,128,0.5), 0 0 25px rgba(74,222,128,0.3), 0 0 50px rgba(74,222,128,0.2), 2px 4px 10px rgba(0,0,0,0.4)' },
        C: { color: '#fb923c', shadow: '0 0 15px rgba(251,146,60,0.5), 0 0 25px rgba(251,146,60,0.3), 0 0 50px rgba(251,146,60,0.2), 2px 4px 10px rgba(0,0,0,0.4)' },
        D: { color: '#94a3b8', shadow: '0 0 15px rgba(148,163,184,0.4), 0 0 20px rgba(148,163,184,0.2), 2px 4px 10px rgba(0,0,0,0.3)' },
        E: { color: '#ef4444', shadow: '0 0 15px rgba(239,68,68,0.6), 0 0 25px rgba(239,68,68,0.4), 0 0 50px rgba(239,68,68,0.2), 2px 4px 10px rgba(0,0,0,0.5)' },
    };

    const gradeStyle = gradeStyleMap[rank.grade] || gradeStyleMap.E;

    const canLoot = (!level?.isBoss && !isTrialMode) && score >= 1400 && !(historyInfo?.hasPlayed && historyInfo?.highScore >= 1400);

    const gradingLegend = [
        { grade: 'S', label: 'Superb', range: '1800+', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
        { grade: 'A', label: 'Exceeds Expectations', range: '1600-1799', color: 'text-purple-400', bg: 'bg-purple-400/10' },
        { grade: 'B', label: 'Acceptable', range: '1400-1599', color: 'text-green-400', bg: 'bg-green-400/10' },
        { grade: 'C', label: 'Poor', range: '1200-1399', color: 'text-orange-400', bg: 'bg-orange-400/10' },
        { grade: 'D', label: 'Dreadful', range: '1000-1199', color: 'text-slate-400', bg: 'bg-slate-400/10' },
        { grade: 'E', label: 'Troll', range: '<1000 / HP=0', color: 'text-red-400', bg: 'bg-red-400/10' },
    ];

    const randomPraise = React.useMemo(() => {
        const praises = [
            "葛萊芬多加五十分！",
            "分類帽把你分到葛萊芬多絕對是最正確的決定。",
            "梅林的鬍子啊！你竟然全對了！"
        ];
        return praises[Math.floor(Math.random() * praises.length)];
    }, []);

    return (
        <div className="flex flex-col animate-fadeIn" style={{ margin: '-1rem -1.5rem' }}>
            <style>
                {`
                    @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500&family=Cinzel:wght@400;700;900&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Gochi+Hand&family=Indie+Flower&family=Mrs+Saint+Delafield&family=Pinyon+Script&family=Princess+Sofia&family=Rock+Salt&display=swap');

                    @keyframes gradeGlowPulse {
                        0%, 100% { 
                            text-shadow: ${gradeStyle.shadow};
                            transform: scale(1);
                        }
                        50% { 
                            text-shadow: ${gradeStyle.shadow.replace(/[\d.]+px/g, (m) => parseFloat(m) * 1.4 + 'px')};
                            transform: scale(1.03);
                        }
                    }
                    .animate-gradeGlow {
                        animation: gradeGlowPulse 3s ease-in-out infinite;
                    }

                    @keyframes popIn {
                        0% { transform: scale(0) rotate(-20deg); opacity: 0; }
                        60% { transform: scale(1.1) rotate(5deg); }
                        100% { transform: scale(1) rotate(0deg); opacity: 1; }
                    }
                    .animate-popIn { animation: popIn 0.6s ease-out forwards; }

                    @keyframes stampSlam {
                        0% { transform: scale(3) rotate(-20deg); opacity: 0; }
                        40% { transform: scale(1.0) rotate(2deg); opacity: 1; }
                        55% { transform: scale(1.15) rotate(-1deg); }
                        70% { transform: scale(0.95) rotate(1deg); }
                        85% { transform: scale(1.05) rotate(0deg); }
                        100% { transform: scale(1) rotate(0deg); opacity: 1; }
                    }
                    .animate-stampSlam {
                        animation: stampSlam 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                        animation-delay: 0.8s;
                        opacity: 0;
                    }
                    @keyframes stampShake {
                        0%, 100% { transform: translate(0, 0); }
                        20% { transform: translate(-2px, 1px); }
                        40% { transform: translate(2px, -1px); }
                        60% { transform: translate(-1px, 2px); }
                        80% { transform: translate(1px, -2px); }
                    }
                    .animate-stampShake {
                        animation: stampShake 0.3s ease-in-out;
                        animation-delay: 1.2s;
                    }

                    .scroll-result-container {
                        font-family: 'EB Garamond', 'Cinzel', serif;
                    }
                `}
            </style>

            <div className="scroll-result-container relative w-full h-auto mx-auto bg-black shadow-2xl overflow-hidden"
                style={{ maxWidth: '600px', backfaceVisibility: 'hidden', transform: 'translateZ(0)' }}>
                {/* 絕對定位的背景圖片撐起高度 */}
                <img src="/finish/FinishGame.png" className="w-full h-auto block pointer-events-none select-none object-cover" alt="Finish Game Background" />

                {/* 內部元素的絕對定位容器 */}
                <div className="absolute inset-0 w-full h-full">

                    {/* ── CANDIDATE 姓名 ── */}
                    <DraggableItem name="Candidate" defaultPos={{ top: '22.09%', left: '50.80%' }}>
                        <div className="text-center w-64">
                            <p className="text-xl mt-0.5 drop-shadow-sm truncate"
                                style={{ fontFamily: "'EB Garamond', 'Pinyon Script', serif", color: '#2a1a10', fontWeight: 600 }}>
                                {user?.displayName || 'Unknown Wizard'}
                            </p>
                        </div>
                    </DraggableItem>

                    {/* ── Subject 科目 ── */}
                    <DraggableItem name="Subject" defaultPos={{ top: '24.67%', left: '64.05%' }}>
                        <div className="text-center w-64">
                            <p className="text-sm mt-0.5 opacity-90 truncate"
                                style={{ fontFamily: "'EB Garamond', serif", color: '#4a3728', fontStyle: 'italic' }}>
                                {isTrialMode ? '🏆 Ultimate Trial Challenge' : (level?.title ? level.title : 'Magical Examination')}
                            </p>
                        </div>
                    </DraggableItem>

                    {/* ── Boss 集章卡 或 等第字母 ── */}
                    {isBossLevel ? (
                        <DraggableItem name="BossStampCard" defaultPos={{ top: '44.50%', left: '50.20%' }}>
                            <div className="w-72 animate-stampShake">
                                {/* 卡片標題 */}
                                <div className="text-center mb-2">
                                    <h3 className="text-sm font-bold uppercase tracking-[0.25em]"
                                        style={{ fontFamily: "'Cinzel', serif", color: '#8b4513' }}>
                                        ⚡ 封印集章卡 ⚡
                                    </h3>
                                    <p className="text-[10px] mt-0.5" style={{ color: '#9a8b70', fontFamily: "'EB Garamond', serif" }}>
                                        Seal Stamp Collection · {completedBossStages} / 5
                                    </p>
                                </div>

                                {/* 集章格子 */}
                                <div className="flex items-center justify-center gap-3 py-3 px-4 bg-[#f5ecd8]/50 rounded-lg border border-[#c2b280]/60 shadow-inner">
                                    {[0, 1, 2, 3, 4].map((idx) => {
                                        const isFilled = idx < completedBossStages;
                                        const isNewest = idx === completedBossStages - 1;
                                        return (
                                            <div key={idx} className="flex flex-col items-center gap-1">
                                                <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-500 ${isFilled
                                                    ? 'shadow-lg'
                                                    : 'bg-[#e6dcc3] border-2 border-dashed border-[#c2b280]'
                                                    }`}>
                                                    {isFilled ? (
                                                        <div className={`relative w-full h-full flex items-center justify-center ${isNewest ? 'animate-stampSlam' : ''}`}>
                                                            <img src="/assets/wizard_id/seal.png" alt="Seal" className="w-full h-full object-contain drop-shadow-md" />
                                                        </div>
                                                    ) : (
                                                        <span className="text-[#c2b280] text-xs font-bold" style={{ fontFamily: "'Cinzel', serif" }}>
                                                            {idx + 1}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* 分數顯示 */}
                                <div className="text-center mt-2">
                                    <span className="text-lg font-bold tracking-wide drop-shadow-sm"
                                        style={{ fontFamily: "'EB Garamond', 'Playfair Display', serif", color: '#2a1a10' }}>
                                        Score: {score} / 2000
                                    </span>
                                </div>

                                {/* 狀態文字 */}
                                <div className="text-center mt-1">
                                    {completedBossStages >= 5 ? (
                                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-800/20 border border-green-600/40"
                                            style={{ color: '#15803d', fontFamily: "'Cinzel', serif" }}>
                                            🎉 All Seals Collected!
                                        </span>
                                    ) : (
                                        <span className="text-xs px-3 py-1 rounded-full bg-red-800/10 border border-red-600/30"
                                            style={{ color: '#991b1b', fontFamily: "'EB Garamond', serif" }}>
                                            還需 {5 - completedBossStages} 次通關才能馴服
                                        </span>
                                    )}
                                </div>
                            </div>
                        </DraggableItem>
                    ) : (
                        <>
                            {/* ── 超大等第字母 ── */}
                            <DraggableItem name="GradeLetter" defaultPos={{ top: '37.41%', left: '50.20%' }}>
                                <div
                                    className="font-black select-none pointer-events-none"
                                    style={{
                                        fontFamily: "'Cinzel', serif",
                                        color: gradeStyle.color,
                                        fontSize: 'clamp(5rem, 18vw, 9rem)',
                                        lineHeight: 1,
                                        textShadow: gradeStyle.shadow,
                                    }}
                                >
                                    {rank.grade}
                                </div>
                            </DraggableItem>

                            {/* ── 分隔裝飾 ── */}
                            <div className="absolute" style={{ top: '54.53%', left: '51.61%' }}>
                                <div className="relative -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                                    <div className="flex items-center justify-center gap-3 opacity-60 pointer-events-none w-32">
                                        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#8b4513]"></div>
                                        <div className="w-1.5 h-1.5 rotate-45 bg-[#8b4513]"></div>
                                        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#8b4513]"></div>
                                    </div>
                                </div>
                            </div>

                            {/* ── 等第中文名稱 ── */}
                            <DraggableItem name="GradeTitle" defaultPos={{ top: '44.16%', left: '51.81%' }}>
                                <div
                                    className="text-lg font-bold tracking-widest uppercase text-center w-max"
                                    style={{
                                        fontFamily: "'Cinzel', serif",
                                        color: gradeStyle.color,
                                        textShadow: '0 0 10px ' + gradeStyle.color + '80, 1px 2px 4px rgba(0,0,0,0.5)'
                                    }}
                                >
                                    {rank.title}
                                </div>
                            </DraggableItem>

                            {/* ── 分數 ── */}
                            <DraggableItem name="Score" defaultPos={{ top: '48.09%', left: '50.20%' }}>
                                <div className="text-5xl font-bold tracking-tighter drop-shadow-sm text-center"
                                    style={{ fontFamily: "'EB Garamond', 'Playfair Display', serif", color: '#2a1a10' }}>
                                    {score}
                                </div>
                            </DraggableItem>

                            {/* ── 歷史最高紀錄 Badge ── */}
                            <DraggableItem name="HistoryBadge" defaultPos={{ top: '52.16%', left: '52.61%' }}>
                                <div className="relative inline-flex items-center justify-center px-5 py-1 w-max">
                                    <div className="absolute inset-0 bg-[#e6dcc3]/80 transform skew-x-12 border border-[#c2b280] shadow-sm rounded-sm"></div>
                                    <div className="relative flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
                                        style={{ fontFamily: "'Cinzel', serif", color: '#8b4513' }}>
                                        <Scroll size={12} />
                                        History Best: {displayBestScore}
                                        {isNewRecord && (
                                            <span className="ml-1 bg-[#b45309] text-amber-100 px-1.5 py-0.5 rounded text-[10px] shadow-sm animate-pulse">
                                                NEW RECORD
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </DraggableItem>
                        </>
                    )}

                    {/* ── 教授評語與簽名 ── */}
                    <div className="absolute" style={{ top: '63.61%', left: '53.41%' }}>
                        <div className="relative -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                            <div className="w-80">
                                <h4 className="text-xs font-bold uppercase mb-2 flex items-center gap-2 opacity-70"
                                    style={{ fontFamily: "'Cinzel', serif", color: '#8c7b60' }}>
                                    <Scroll size={12} /> Professor's Remarks
                                </h4>
                                <p className="text-sm italic leading-relaxed pl-3 border-l-2 border-[#c2b280]/60 mb-3"
                                    style={{ fontFamily: "'EB Garamond', serif", color: '#3d2b1f' }}>
                                    {rank.message}
                                </p>

                                <div className="flex items-end justify-between">
                                    <div className="flex flex-col items-start ml-3">
                                        <div
                                            className={`${rank.sigSize} max-w-[200px] break-words`}
                                            style={{
                                                fontFamily: rank.sigFont,
                                                color: rank.sigColor,
                                                transform: 'rotate(-3deg)',
                                                textShadow: '1px 1px 0px rgba(0,0,0,0.1)'
                                            }}
                                        >
                                            {rank.prof}
                                            {rank.isTroll && <span className="ml-2 text-2xl not-italic animate-pulse">💗</span>}
                                        </div>
                                        <div className="text-[9px] uppercase tracking-wider border-t pt-1 mt-1"
                                            style={{ fontFamily: "'EB Garamond', serif", color: '#9a8b70', borderColor: '#c2b280' }}>
                                            {rank.role}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 蠟封 */}
                    <div className="absolute" style={{ top: '68.20%', left: '78.98%' }}>
                        <div className="relative -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                            <div className="transform rotate-6 opacity-90 w-24 h-24">
                                <img
                                    src={`/wax_seals/${rank.seal}`}
                                    alt="Wax Seal"
                                    className="w-full h-full drop-shadow-xl animate-popIn object-contain"
                                    onError={(e) => e.target.style.display = 'none'}
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── 本次錯字區 ── */}
                    {sessionWrongAnswers.length > 0 ? (
                        <div className="absolute z-40" style={{ top: '82.29%', left: '51.73%' }}>
                            <div className="relative -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                                <div className="w-80">
                                    <div className="bg-[#f5ecd8]/40 rounded-lg p-3 border border-[#d4c5a9]/50 backdrop-blur-sm shadow-xl">
                                        <h4 className="text-xs font-bold uppercase mb-2 flex items-center gap-2"
                                            style={{ fontFamily: "'Cinzel', serif", color: '#8b2020' }}>
                                            <AlertTriangle size={13} /> 本次錯誤咒語 ({sessionWrongAnswers.length})
                                        </h4>
                                        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 custom-scrollbar pointer-events-auto">
                                            {sessionWrongAnswers.map((item, idx) => (
                                                <div key={idx} className="flex flex-wrap items-start gap-2 text-sm bg-[#f5ecd8]/60 px-2.5 py-1.5 rounded border border-[#d4c5a9]/50">
                                                    <span className="font-bold shrink-0" style={{ fontFamily: "'EB Garamond', serif", color: '#4a3728' }}>
                                                        {item.word}
                                                    </span>
                                                    <span className="text-xs mt-0.5" style={{ color: '#6b7280' }}>
                                                        ({item.reason === 'timeout' ? '⏰ 超時' : <><span style={{ color: '#dc2626' }}>{item.userAnswer} ❌</span></>}
                                                        {item.reason !== 'timeout' && <> → <span style={{ color: '#15803d' }}>{item.correctAnswer} ✅</span></>})
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="absolute z-40" style={{ top: '82.29%', left: '51.73%' }}>
                            <div className="relative -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                                <div className="w-80">
                                    <div className="bg-[#f5ecd8]/40 rounded-lg p-3 border border-[#d4c5a9]/50 backdrop-blur-sm shadow-xl text-center">
                                        <h4 className="text-xs font-bold uppercase mb-2 flex items-center justify-center gap-2"
                                            style={{ fontFamily: "'Cinzel', serif", color: '#15803d' }}>
                                            <Sparkles size={13} /> 完美通關 (0 錯誤)
                                        </h4>
                                        <div className="py-3 px-1 text-sm font-bold tracking-wide" style={{ fontFamily: "'EB Garamond', serif", color: '#3d2b1f' }}>
                                            {randomPraise}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}





                    {/* ── 按鈕區塊 ── */}
                    <DraggableItem name="RetryButton" defaultPos={{ top: '95.57%', left: '29.40%' }}>
                        <button
                            onClick={onRetry}
                            className="flex items-center gap-2 px-4 py-2 bg-[#e6dcc3]/90 hover:bg-[#dcd0b0] rounded font-bold border border-[#c2b280] shadow-xl transition-colors text-sm tracking-wide"
                            style={{ fontFamily: "'EB Garamond', serif", color: '#5c4033' }}
                        >
                            <RotateCcw size={15} />
                            重考 (Retry)
                        </button>
                    </DraggableItem>

                    <DraggableItem name="BackButton" defaultPos={{ top: '95.57%', left: '59.46%' }}>
                        {canLoot ? (
                            !hasDraftedLoot ? (
                                <button
                                    onClick={onManualOpenLoot}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-100 to-amber-200 border border-amber-400 rounded font-bold shadow-[0_0_10px_rgba(251,191,36,0.3)] hover:scale-105 transition-transform text-amber-900 text-sm tracking-wide pointer-events-auto"
                                    style={{ fontFamily: "'EB Garamond', serif" }}
                                >
                                    <Sparkles size={15} className="text-amber-600" />
                                    領取咒語
                                </button>
                            ) : (
                                <button
                                    onClick={onGoToLibrary}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-teal-800 to-emerald-900 border border-emerald-600 rounded font-bold shadow-[0_0_10px_rgba(16,185,129,0.3)] hover:scale-105 transition-transform text-emerald-100 text-sm tracking-wide pointer-events-auto"
                                    style={{ fontFamily: "'EB Garamond', serif" }}
                                >
                                    <Sparkles size={15} className="text-emerald-400" />
                                    前往萬應室
                                </button>
                            )
                        ) : (
                            <button
                                onClick={onBack}
                                className="flex items-center gap-2 px-4 py-2 bg-[#e6dcc3]/90 hover:bg-[#dcd0b0] rounded font-bold border border-[#c2b280] shadow-xl transition-colors text-sm tracking-wide pointer-events-auto"
                                style={{ fontFamily: "'EB Garamond', serif", color: '#5c4033' }}
                            >
                                <Map size={15} />
                                返回地圖
                            </button>
                        )}
                    </DraggableItem>



                </div>
            </div>
        </div>
    );
};

export default ResultView;

