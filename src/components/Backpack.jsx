import { X, ScrollText, BookOpen, Lock } from 'lucide-react';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useState, useEffect, useRef, useCallback } from 'react';

// ======================================================
// 🔧 DEV_DRAG：設為 true 可拖曳所有文字元素，放開後 console 印出座標
//    完成定位後請改回 false
// ======================================================
const DEV_DRAG = false;

// ===== 學生證等級配置表 =====
const STUDENT_ID_CONFIG = [
    {
        minLevel: 1, maxLevel: 6, tier: 1,
        title: "魔法學徒 (Apprentice)",
        quote: "每一次的試煉都會化為你的力量。繼續累積吧，年輕的巫師！"
    },
    {
        minLevel: 7, maxLevel: 12, tier: 2,
        title: "見習法師 (Journeyman)",
        quote: "你已經不再是新手了。魔杖的揮舞更加穩健，知識的光芒正在萌芽。"
    },
    {
        minLevel: 13, maxLevel: 18, tier: 3,
        title: "高階巫師 (High Wizard)",
        quote: "高深的魔法需要強大的心智。你已經證明了自己有能力駕馭更強的力量。"
    },
    {
        minLevel: 19, maxLevel: 24, tier: 4,
        title: "三巫鬥法大賽鬥士 (Champion)",
        quote: "榮耀屬於勇敢的靈魂。在火焰與試煉中，你鍛造出了鋼鐵般的意志。"
    },
    {
        minLevel: 25, maxLevel: 30, tier: 5,
        title: "鳳凰會成員 (Order Member)",
        quote: "為了守護珍視之物，你挺身而出。你的智慧已成為抵抗黑暗的鋒利武器。"
    },
    {
        minLevel: 31, maxLevel: 999, tier: 6,
        title: "霍格華茲傳奇 (Legendary Wizard)",
        quote: "你的名字將被霍格華茲永遠銘記。你是真理的追尋者，也是傳奇的締造者。"
    }
];

const getCurrentConfig = (level) => {
    const numLevel = Number(level) || 1;
    return STUDENT_ID_CONFIG.find(cfg => numLevel >= cfg.minLevel && numLevel <= cfg.maxLevel)
        || STUDENT_ID_CONFIG[0];
};

// ===== 可拖曳 hook（僅 DEV_DRAG=true 時啟用）=====
const useDraggable = (label, initialTop, initialLeft, containerRef) => {
    const [pos, setPos] = useState({ top: initialTop, left: initialLeft });
    const dragging = useRef(false);
    const offset = useRef({ x: 0, y: 0 });

    const getPercent = useCallback((clientX, clientY) => {
        if (!containerRef.current) return { top: pos.top, left: pos.left };
        const rect = containerRef.current.getBoundingClientRect();
        const topPct = ((clientY - rect.top) / rect.height * 100).toFixed(2);
        const leftPct = ((clientX - rect.left) / rect.width * 100).toFixed(2);
        return { top: `${topPct}%`, left: `${leftPct}%` };
    }, [containerRef, pos]);

    const onPointerDown = useCallback((e) => {
        if (!DEV_DRAG) return;
        e.preventDefault();
        e.stopPropagation();
        dragging.current = true;
        const rect = e.currentTarget.getBoundingClientRect();
        offset.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
        e.currentTarget.setPointerCapture(e.pointerId);
    }, []);

    const onPointerMove = useCallback((e) => {
        if (!dragging.current || !containerRef.current) return;
        e.preventDefault();
        const containerRect = containerRef.current.getBoundingClientRect();
        const newTop = ((e.clientY - offset.current.y - containerRect.top) / containerRect.height * 100).toFixed(2);
        const newLeft = ((e.clientX - offset.current.x - containerRect.left) / containerRect.width * 100).toFixed(2);
        setPos({ top: `${newTop}%`, left: `${newLeft}%` });
    }, [containerRef]);

    const onPointerUp = useCallback((e) => {
        if (!dragging.current) return;
        dragging.current = false;
        console.log(`📍 [${label}] top: '${pos.top}', left: '${pos.left}'`);
    }, [label, pos]);

    const handlers = DEV_DRAG ? { onPointerDown, onPointerMove, onPointerUp } : {};
    const style = DEV_DRAG ? {
        cursor: 'grab',
        outline: '1px dashed rgba(255,0,0,0.5)',
        zIndex: 50,
    } : {};

    return { pos, handlers, devStyle: style };
};

const Backpack = ({ show, onClose, maxUnlockedLevel, onOpenHistory, onOpenArchives, onOpenTeacher, user, userName, gender }) => {
    const [highScore, setHighScore] = useState(0);
    const [bestRank, setBestRank] = useState('—');
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState(false);
    const containerRef = useRef(null);

    // 評價顏色對照
    const RANK_STYLE_MAP = {
        S: 'text-[#fbbf24] font-extrabold',
        A: 'text-[#ef4444] font-bold',
        B: 'text-[#3b82f6] font-bold',
        C: 'text-[#10b981] font-bold',
        D: 'text-[#9ca3af] font-bold',
        E: 'text-[#4b5563] font-bold',
    };
    const RANK_SHADOW_MAP = {
        S: '1px 1px 3px rgba(0,0,0,0.6)',
        A: '1px 1px 3px rgba(0,0,0,0.6)',
        B: '1px 1px 3px rgba(0,0,0,0.6)',
        C: '1px 1px 3px rgba(0,0,0,0.6)',
        D: '1px 1px 3px rgba(0,0,0,0.6)',
        E: '1px 1px 3px rgba(0,0,0,0.6)',
    };

    // SCORE 區域拆成三個獨立元素
    const dragRank = useDraggable('RANK', '74.99%', '18.97%', containerRef);
    const dragPts = useDraggable('POINTS', '75.14%', '72.50%', containerRef);
    const dragIcons = useDraggable('ICONS', '75.14%', '85.41%', containerRef);

    useEffect(() => {
        if (show) {
            const fetchHighScore = async () => {
                try {
                    if (!user?.uid) return;
                    const q = query(
                        collection(db, "users", user.uid, "trial_records"),
                        orderBy("score", "desc"),
                        limit(1)
                    );
                    const querySnapshot = await getDocs(q);
                    if (!querySnapshot.empty) {
                        setHighScore(querySnapshot.docs[0].data().score);
                    } else {
                        setHighScore(0);
                    }
                } catch (error) {
                    console.error("Error fetching high score:", error);
                }
            };
            fetchHighScore();

            // 取得歷史最高評價 (gate_of_truth)
            const fetchBestRank = async () => {
                if (!user?.uid) return;
                try {
                    const RANK_ORDER = ['S', 'A', 'B', 'C', 'D', 'E'];
                    const histRef = collection(db, 'users', user.uid, 'history');
                    const q2 = query(histRef, where('mode', '==', 'gate_of_truth'));
                    const snap = await getDocs(q2);
                    let best = null;
                    snap.docs.forEach(d => {
                        const r = d.data().rank;
                        if (r && RANK_ORDER.includes(r)) {
                            if (!best || RANK_ORDER.indexOf(r) < RANK_ORDER.indexOf(best)) {
                                best = r;
                            }
                        }
                    });
                    setBestRank(best || '—');
                } catch (err) {
                    console.error('Error fetching best rank:', err);
                }
            };
            fetchBestRank();
        }
    }, [show, user]);

    if (!show) return null;

    // 取得當前等級配置
    const config = getCurrentConfig(maxUnlockedLevel);

    // 動態構建背景圖路徑
    const genderKey = gender === 'female' ? 'girl' : 'boy';
    const bgImagePath = `/IDcard/IDcard_${genderKey}${config.tier}.png`;

    // Format enroll date
    const getEnrollDate = () => {
        if (user?.metadata?.creationTime) {
            const d = new Date(user.metadata.creationTime);
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        }
        return '2026-02-19';
    };

    const handlePasswordSubmit = () => {
        if (password === '1999') {
            setShowPasswordModal(false);
            setPassword('');
            setPasswordError(false);
            onClose();
            if (onOpenTeacher) onOpenTeacher();
        } else {
            setPasswordError(true);
            setTimeout(() => setPasswordError(false), 1500);
        }
    };

    return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn p-4">
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-6 right-6 z-[110] p-2 bg-red-900 hover:bg-red-800 text-amber-100 rounded-full border-2 border-amber-600 shadow-xl transition-transform hover:scale-110"
            >
                <X size={24} />
            </button>

            {/* Container — ref 用於計算百分比座標 */}
            <div
                ref={containerRef}
                className="relative w-full max-w-lg aspect-[1535/2125] max-h-[95vh] rounded-[24px] overflow-hidden shadow-2xl flex-shrink-0"
                style={{ backgroundColor: 'transparent' }}
            >
                {/* Background Image */}
                <img
                    src={bgImagePath}
                    alt="ID Card Background"
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                    style={{ mixBlendMode: 'normal' }}
                />

                {/* === 隱藏入口：蠟封 === */}
                <button
                    onClick={() => {
                        setShowPasswordModal(true);
                        setPassword('');
                        setPasswordError(false);
                    }}
                    className="absolute cursor-pointer z-20 rounded-full hover:brightness-110 active:scale-95 transition-all"
                    style={{ top: '10%', right: '5%', width: '14%', height: '9.5%' }}
                    title=""
                />

                {/* 1. NAME */}
                <div
                    className="absolute font-bold text-[#3e2723] text-[clamp(12px,4.5vw,20px)] whitespace-nowrap flex justify-center items-center"
                    style={{
                        top: '49.38%',
                        left: '73.5%', // Center of the underline space
                        transform: 'translate(-50%, -50%)',
                        width: '35%',
                        fontFamily: '"Georgia Bold Italic"',
                    }}
                >
                    {userName || user?.displayName || 'Unknown Wizard'}
                </div>

                {/* 2. HOUSE */}
                <div
                    className="absolute italic font-bold text-[#3e2723] text-[clamp(12px,4.5vw,20px)] whitespace-nowrap"
                    style={{
                        top: '54.00%',
                        left: '63.51%',
                        transform: 'translateY(-50%)',
                        width: '35%',
                        fontFamily: '"Crimson Text", serif',
                    }}
                >
                    Gryffindor
                </div>

                {/* 3. ENROLL */}
                <div
                    className="absolute italic font-bold text-[#3e2723] text-[clamp(12px,4.5vw,20px)] whitespace-nowrap"
                    style={{
                        top: '58.46%',
                        left: '61.39%',
                        transform: 'translateY(-50%)',
                        width: '35%',
                        fontFamily: '"Crimson Text", serif',
                        letterSpacing: '1px',
                    }}
                >
                    {getEnrollDate()}
                </div>

                {/* 4. LEVEL */}
                <div
                    className="absolute italic font-bold text-[#3e2723] text-[clamp(12px,4.5vw,20px)] whitespace-nowrap"
                    style={{
                        top: '63.08%',
                        left: '70.29%',
                        transform: 'translateY(-50%)',
                        width: '35%',
                        fontFamily: '"Crimson Text", serif',
                    }}
                >
                    {maxUnlockedLevel}
                </div>

                {/* 5. TITLE */}
                <div
                    className="absolute italic font-bold text-[#4e342e] text-lg sm:text-xl md:text-2xl text-center"
                    style={{
                        top: '59.79%',
                        left: '23.52%',
                        transform: 'translate(-50%, -50%)',
                        width: '40%',
                        fontFamily: '"Crimson Text", serif',
                    }}
                >
                    {config.title}
                </div>

                {/* 6a. RANK — 評價字母 */}
                <div
                    {...dragRank.handlers}
                    className="absolute flex items-center justify-center"
                    style={{
                        top: dragRank.pos.top,
                        left: dragRank.pos.left,
                        transform: 'translate(-50%, -50%)',
                        ...dragRank.devStyle,
                    }}
                >
                    <span className={`text-lg sm:text-xl md:text-2xl ${RANK_STYLE_MAP[bestRank] || 'text-[#4e342e] font-bold'}`}
                        style={{ fontFamily: '"Cinzel", serif', textShadow: RANK_SHADOW_MAP[bestRank] || 'none' }}>
                        {bestRank}
                    </span>
                </div>

                {/* 6b. POINTS — 分數 */}
                <div
                    {...dragPts.handlers}
                    className="absolute flex items-center justify-center"
                    style={{
                        top: dragPts.pos.top,
                        left: dragPts.pos.left,
                        transform: 'translate(-50%, -50%)',
                        fontFamily: '"Cinzel", serif',
                        ...dragPts.devStyle,
                    }}
                >
                    <span className="font-bold text-[#4e342e] text-sm sm:text-base md:text-lg tracking-[0.2em] drop-shadow-sm">
                        {highScore} pts
                    </span>
                </div>

                {/* 6c. ICONS — 歷史 & 歸檔按鈕 */}
                <div
                    {...dragIcons.handlers}
                    className="absolute flex items-center gap-1"
                    style={{
                        top: dragIcons.pos.top,
                        left: dragIcons.pos.left,
                        transform: 'translate(-50%, -50%)',
                        ...dragIcons.devStyle,
                    }}
                >
                    <button
                        onClick={onOpenHistory}
                        className="hover:scale-110 hover:opacity-80 transition-all p-1"
                        title="Trial History"
                    >
                        <ScrollText size={20} className="text-[#4e342e] drop-shadow-sm" />
                    </button>
                </div>

                {/* 7. QUOTE BOX */}
                <div
                    className="absolute flex items-center justify-center px-8 text-center"
                    style={{
                        top: '86.06%',
                        left: '49.79%',
                        transform: 'translate(-50%, -50%)',
                        width: '85%',
                        height: '10%',
                        fontFamily: '"Crimson Text", serif',
                    }}
                >
                    <p className="italic font-bold text-[#4e342e] text-base sm:text-lg md:text-xl leading-relaxed break-words drop-shadow-sm">
                        {config.quote}
                    </p>
                </div>
            </div>

            {/* === 密碼輸入 Modal === */}
            {showPasswordModal && (
                <div className="absolute inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
                    <div className={`bg-[#2a1a0e] rounded-xl border-2 p-6 shadow-2xl w-72 transition-all ${passwordError ? 'border-red-500 animate-shake' : 'border-amber-700'}`}>
                        <div className="text-center mb-4">
                            <Lock size={28} className="mx-auto text-amber-500 mb-2" />
                            <h3 className="text-amber-200 font-serif font-bold text-sm">此蠟封需要教師密碼</h3>
                            <p className="text-amber-700 text-[10px] mt-1 italic">Only authorized professors may proceed.</p>
                        </div>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handlePasswordSubmit()}
                            placeholder="輸入密碼..."
                            autoFocus
                            className="w-full px-3 py-2 bg-[#1a0f08] text-amber-100 text-center text-lg font-mono rounded-lg border border-amber-800/50 focus:border-amber-500 focus:outline-none tracking-[0.3em] placeholder-amber-800/40"
                        />
                        {passwordError && (
                            <p className="text-red-400 text-xs text-center mt-2 animate-pulse">密碼錯誤！Access Denied.</p>
                        )}
                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={() => setShowPasswordModal(false)}
                                className="flex-1 py-2 bg-amber-900/30 hover:bg-amber-900/50 text-amber-400 text-xs rounded-lg border border-amber-800/30 transition-colors"
                            >
                                取消
                            </button>
                            <button
                                onClick={handlePasswordSubmit}
                                className="flex-1 py-2 bg-amber-700 hover:bg-amber-600 text-amber-50 text-xs font-bold rounded-lg transition-colors"
                            >
                                確認
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Backpack;
