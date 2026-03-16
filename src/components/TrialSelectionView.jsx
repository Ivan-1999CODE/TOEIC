import React, { useState } from 'react';
import { Scroll, Wand2, ChevronLeft, CheckCircle, Feather, Leaf, Moon, Castle, Sword, Flame, Lock } from 'lucide-react';
import TrialConfirmationModal from './TrialConfirmationModal';

// --- 30 天冒險劇情資料庫 ---
const adventureDays = [
    { id: 1, title: "貓頭鷹的入學信", desc: "收到錄取通知，踏入魔法世界。" },
    { id: 2, title: "斜角巷的魔杖店", desc: "挑選專屬魔杖，準備學習工具。" },
    { id: 3, title: "分類帽的抉擇", desc: "分析自我特質，決定學院歸屬。" },
    { id: 4, title: "飄浮咒：溫咖癲啦唯啊薩", desc: "第一次成功施法，掌握基礎邏輯。" },
    { id: 5, title: "時光逆流的懷錶", desc: "學習精確的操作時間的方式。" },
    { id: 6, title: "曼德拉草的尖叫", desc: "藥草學實作，處理棘手的問題。" },
    { id: 7, title: "決鬥社：去去武器走", desc: "學習攻防應對，反應力訓練。" },
    { id: 8, title: "魁地奇：搜捕手的特訓", desc: "專注力訓練，在混亂中抓取重點。" },
    { id: 9, title: "多變身藥水的熬製", desc: "長時間的準備與耐心，改變視角。" },
    { id: 10, title: "密室的蛇語暗號", desc: "解開隱藏的謎題與邏輯。" },
    { id: 11, title: "賢者之石的煉成", desc: "適應快速變化的環境與節奏。" },
    { id: 12, title: "幻形怪：叱叱，荒唐", desc: "克服學習上的恐懼與弱點。" },
    { id: 13, title: "護法咒：快樂的回憶", desc: "高階防禦魔法，保持正向心態。" },
    { id: 14, title: "時光器的迴旋", desc: "複習與補強，修正過去的錯誤。" },
    { id: 15, title: "劫盜地圖的密道", desc: "發現解題的捷徑與全貌。" },
    { id: 16, title: "火盃的考驗：報名", desc: "決定接受更高難度的挑戰。" },
    { id: 17, title: "第一試煉：鬥龍競技場", desc: "面對強大的單一主題難題。" },
    { id: 18, title: "隱藏的金蛋", desc: "在放鬆中尋找線索，聽音辨位。" },
    { id: 19, title: "第二試煉：魔法部的特別實習", desc: "限時壓力下的解題挑戰。" },
    { id: 20, title: "第三試煉：迷宮與獎盃", desc: "綜合能力的最終測試。" },
    { id: 21, title: "萬應室：鄧不利多的軍隊", desc: "自主學習與同儕互助的集會。" },
    { id: 22, title: "鎖心術：大腦防禦", desc: "強化邏輯防禦，不被題目誤導。" },
    { id: 23, title: "神祕部門的預言球", desc: "探索未知的領域與高深理論。" },
    { id: 24, title: "真理之門的鑰匙", desc: "掌握空間跳躍，快速解題技巧。" },
    { id: 25, title: "鳳凰的眼淚", desc: "療癒與重生，從失敗中恢復。" },
    { id: 26, title: "世界樹的根源", desc: "完美的狀態，考試順利的祝福。" },
    { id: 27, title: "分靈體的搜尋", desc: "尋找分散的知識碎片並擊破。" },
    { id: 28, title: "霍格華茲的防衛戰", desc: "最終的總複習大戰，全力以赴。" },
    { id: 29, title: "混血王子的身世", desc: "考後的反思與沉澱，理解真理。" },
    { id: 30, title: "全知全能之書", desc: "結束學業，邁向新的旅程。" }
];

const chapters = [
    { id: 1, title: "學徒的覺醒" },
    { id: 2, title: "見習法師的征途" },
    { id: 3, title: "高階巫師的昇華" },
    { id: 4, title: "鬥士選拔的考驗" },
    { id: 5, title: "鳳凰會的崛起" },
    { id: 6, title: "終極法師的傳奇" }
];

// --- 萬應室：失傳咒語 (Endgame Data) ---
const iconMap = { Feather, Leaf, Moon, Castle, Sword, Flame };

const lostSpellsChapters = [
    {
        id: 'endgame_01',
        professor: '菲力·弗立維',
        spell: 'Wingardium Leviosa',
        desc: '(溫咖癲啦唯阿薩)',
        color: 'from-blue-600 to-blue-900',
        icon: 'Feather',
        image: '/endgame_images/1.1.png'
    },
    {
        id: 'endgame_02',
        professor: '波莫娜·芽菜',
        spell: 'Lumos Solem',
        desc: '(路摸思·索雷姆)',
        color: 'from-green-600 to-green-900',
        icon: 'Leaf',
        image: '/endgame_images/2.2.png'
    },
    {
        id: 'endgame_03',
        professor: '雷木思·路平',
        spell: 'Riddikulus',
        desc: '(去去幻形走)',
        color: 'from-slate-400 to-slate-600',
        icon: 'Moon',
        image: '/endgame_images/3.3.png'
    },
    {
        id: 'endgame_04',
        professor: '米奈娃·麥',
        spell: 'Piertotum Locomotor',
        desc: '(石墩出動)',
        color: 'from-red-700 to-red-900',
        icon: 'Castle',
        image: '/endgame_images/4.4.png'
    },
    {
        id: 'endgame_05',
        professor: '賽佛勒斯·石內卜',
        spell: 'Sectumsempra',
        desc: '(神鋒無影)',
        color: 'from-slate-800 to-black',
        icon: 'Sword',
        image: '/endgame_images/5.5.png'
    },
    {
        id: 'endgame_06',
        professor: '阿不思·鄧不利多',
        spell: 'Gubraithian Fire',
        desc: '(古布拉仙之火)',
        color: 'from-amber-500 to-orange-800',
        icon: 'Flame',
        image: '/endgame_images/6.6.png'
    },
];

// --- 魔法封蠟印章組件 ---
const RedWaxSeal = ({ size = "w-14 h-14" }) => (
    <img
        src="/assets/wizard_id/seal.png"
        alt="Wax Seal"
        className={`absolute -top-2 -right-2 ${size} z-50 animate-popIn drop-shadow-lg object-contain transform rotate-12`}
    />
);

const TrialSelectionView = ({ onStart, onBack, maxUnlockedLevel = 0 }) => {
    const [selectedDays, setSelectedDays] = useState([]);
    const [showConfirmation, setShowConfirmation] = useState(false);

    const playThudSound = () => {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => { });
    };

    const toggleDay = (dayId) => {
        const isSelecting = !selectedDays.includes(dayId);
        if (isSelecting) playThudSound();
        setSelectedDays(prev =>
            prev.includes(dayId) ? prev.filter(id => id !== dayId) : [...prev, dayId]
        );
    };

    const toggleChapter = (chapterIdx) => {
        const startDay = chapterIdx * 5 + 1;
        const dayRange = [startDay, startDay + 1, startDay + 2, startDay + 3, startDay + 4];
        const allSelected = dayRange.every(d => selectedDays.includes(d));

        if (!allSelected) playThudSound();

        setSelectedDays(prev =>
            allSelected
                ? prev.filter(d => !dayRange.includes(d))
                : Array.from(new Set([...prev, ...dayRange]))
        );
    };

    const toggleSelectAll = () => {
        const allDayIds = adventureDays.map(day => day.id);
        const isAllSelected = selectedDays.length === allDayIds.length;

        if (!isAllSelected) playThudSound();

        setSelectedDays(isAllSelected ? [] : allDayIds);
    };

    const handleStart = () => {
        if (selectedDays.length === 0) return;
        setShowConfirmation(true);
    };

    const confirmStart = () => {
        setShowConfirmation(false);
        onStart(selectedDays);
    };

    return (
        <div className="h-full w-full bg-[#120a07] flex flex-col font-serif relative overflow-hidden">
            {/* 深色木頭紋理背景 (移除紫色) */}
            <div className="absolute inset-0 opacity-60"
                style={{
                    backgroundImage: `url("https://www.transparenttextures.com/patterns/wood-pattern.png")`,
                    backgroundBlendMode: 'overlay',
                    backgroundColor: '#1a0f0a'
                }}>
            </div>

            {/* 標題 */}
            <div className="p-4 pt-6 text-center shrink-0 z-10 relative">
                {/* 左上角返回鍵 */}
                <button
                    onClick={onBack}
                    className="absolute top-4 left-4 p-2 bg-stone-900/80 rounded-full border border-stone-700 text-amber-200 active:scale-95 transition-all hover:bg-stone-800 z-50"
                >
                    <ChevronLeft size={18} />
                </button>
                {/* 右上角：選取計數 + 全選鍵 */}
                <div className="absolute top-4 right-4 flex flex-col items-center gap-1 z-50">
                    <button
                        onClick={toggleSelectAll}
                        className={`p-2 rounded-full border transition-all active:scale-95 ${selectedDays.length === adventureDays.length ? 'bg-amber-600 border-amber-400 text-white' : 'bg-stone-900/80 border-stone-700 text-amber-200 hover:bg-stone-800'}`}
                    >
                        <Scroll size={18} />
                    </button>
                    <span className="text-[10px] text-amber-100/50 font-bold tracking-wider">{selectedDays.length}/{adventureDays.length}</span>
                </div>
                <h1 className="text-xl font-bold text-amber-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    守護霍格華茲：真理之門
                </h1>
                <p className="text-[10px] italic text-amber-100/40 mt-1">"Truth is a beautiful and terrible thing..."</p>
            </div>

            {/* 冒險相簿主區域 */}
            <div className="flex-1 w-full px-4 pb-32 overflow-y-auto custom-scrollbar z-10 space-y-12">
                {chapters.map((chapter, cIdx) => {
                    const startIdx = cIdx * 5;
                    const chapterDayIds = [startIdx + 1, startIdx + 2, startIdx + 3, startIdx + 4, startIdx + 5];
                    const allSelected = chapterDayIds.every(d => selectedDays.includes(d));

                    return (
                        <div key={chapter.id} className="space-y-4">
                            {/* 章節標題 - 點選可切換整章 */}
                            <button
                                onClick={() => toggleChapter(cIdx)}
                                className="w-full flex items-center gap-3 border-b border-amber-900/30 pb-2 group"
                            >
                                <div className={`w-3 h-3 rounded-full border border-amber-600 ${allSelected ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-transparent'}`} />
                                <h2 className="text-sm font-bold text-amber-100/80 tracking-widest uppercase group-hover:text-amber-400 transition-colors">
                                    第{chapter.id}章：{chapter.title}
                                </h2>
                            </button>

                            {/* 章節框格佈局：5張小照片置中 */}
                            <div className="flex flex-wrap justify-center gap-3">
                                {adventureDays.slice(startIdx, startIdx + 5).map(day => (
                                    <div key={day.id} className="w-[calc(33.333%-0.5rem)]">
                                        <DayPolaroid
                                            day={day}
                                            isSelected={selectedDays.includes(day.id)}
                                            onClick={() => toggleDay(day.id)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}

                {/* === 萬應室：失傳咒語 (Endgame Section) === */}
                <div className="relative pt-8 pb-4 flex flex-col items-center justify-center">
                    <div className="relative flex items-center justify-center w-full mb-4">
                        <div className="h-px bg-amber-700/30 w-full absolute"></div>
                        <span className="relative bg-[#120a07] px-4 text-amber-500 font-serif font-bold tracking-widest text-sm uppercase">
                            Endgame: Room of Requirement
                        </span>
                    </div>
                    {maxUnlockedLevel < 37 && (
                        <div className="px-5 py-2 border-2 border-red-900/60 bg-red-950/40 rounded-md shadow-inner text-amber-100/90 text-[11px] sm:text-xs font-serif italic tracking-wide animate-pulse shadow-[0_0_10px_rgba(153,27,27,0.3)]">
                            通關所有主線到達 Level 36 (現在等級 {maxUnlockedLevel})
                        </div>
                    )}
                </div>

                {/* Endgame 卡片 Grid (Polaroid Style) */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {lostSpellsChapters.map((chapter) => {
                        const IconComponent = iconMap[chapter.icon];
                        const isLocked = maxUnlockedLevel < 37;
                        return (
                            <div
                                key={chapter.id}
                                onClick={() => !isLocked && toggleDay(chapter.id)}
                                className={`relative group p-3 rounded shadow-lg transition-transform duration-300 border 
                                    ${isLocked ? 'bg-[#f0e6d2]/80 border-[#d4c5a9]/50 cursor-not-allowed' : 'bg-[#f0e6d2] hover:scale-[1.02] cursor-pointer border-[#d4c5a9]'}`}
                            >
                                {/* 1. 照片區域 (Photo Area) */}
                                <div className={`w-full aspect-square bg-gradient-to-br ${chapter.color} rounded-sm shadow-inner flex items-center justify-center relative overflow-hidden mb-3 border border-black/10`}>
                                    {chapter.image ? (
                                        <img
                                            src={chapter.image}
                                            alt={chapter.professor}
                                            className="absolute inset-0 w-full h-full object-cover"
                                        />
                                    ) : (
                                        /* Icon 僅在無圖片時顯示 */
                                        IconComponent && <IconComponent size={48} className="text-white/70 drop-shadow-md relative z-10" />
                                    )}
                                    {/* 復古濾鏡 */}
                                    <div className="absolute inset-0 bg-[#704214] opacity-10 pointer-events-none" />
                                    {/* 內陰影 */}
                                    <div className="absolute inset-0 shadow-[inset_0_0_15px_rgba(0,0,0,0.4)]" />
                                </div>

                                {/* 2. 文字區域 (Text Area) */}
                                <div className="text-center px-1">
                                    <h3 className="text-base font-serif font-bold text-[#2d2d2d] leading-tight mb-0.5">
                                        {chapter.professor}
                                    </h3>
                                    <p className="text-xs font-bold text-[#8b4513] italic tracking-wide mb-0.5">
                                        {chapter.spell}
                                    </p>
                                    <p className="text-[10px] text-slate-500 font-serif">
                                        {chapter.desc}
                                    </p>
                                </div>

                                {/* 鎖定狀態遮罩 */}
                                {isLocked && (
                                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] rounded flex flex-col items-center justify-center z-20">
                                        <Lock size={32} className="text-[#f0e6d2] mb-2" />
                                    </div>
                                )}

                                {/* 紅色封蠟印章 */}
                                {selectedDays.includes(chapter.id) && <RedWaxSeal size="w-10 h-10" />}
                            </div>
                        );
                    })}
                </div>

                {/* 底部安全間距 */}
                <div className="h-8" />
            </div>

            {/* 底部控制欄 */}
            <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-[#120a07] via-[#120a07]/95 to-transparent z-30">


                <button
                    onClick={handleStart}
                    disabled={selectedDays.length === 0}
                    className={`w-full py-4 rounded-md font-bold text-lg tracking-widest transition-all duration-500 border-b-4 active:border-b-0 active:translate-y-1 shadow-2xl
                        ${selectedDays.length > 0
                            ? 'bg-gradient-to-r from-red-950 to-red-800 text-amber-100 border-stone-950 shadow-[0_0_25px_rgba(185,28,28,0.3)]'
                            : 'bg-stone-800 text-stone-600 border-stone-900 opacity-50 cursor-not-allowed'}`}
                >
                    <div className="flex items-center justify-center gap-3">
                        <Wand2 size={24} className={selectedDays.length > 0 ? "animate-pulse" : ""} />
                        進入真理之門
                    </div>
                </button>
            </div>

            {/* 進入確認 Modal */}
            <TrialConfirmationModal
                show={showConfirmation}
                onConfirm={confirmStart}
                onCancel={() => setShowConfirmation(false)}
            />

            <style>{`
                @keyframes popIn { 0% { transform: scale(1.6) rotate(-10deg); opacity: 0; } 100% { transform: scale(1) rotate(12deg); opacity: 1; } }
                .animate-popIn { animation: popIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(251, 191, 36, 0.1); border-radius: 10px; }
            `}</style>
        </div>
    );
};

// --- 拍立得單張組件 ---
const DayPolaroid = ({ day, isSelected, onClick }) => {
    // 圖片顯示邏輯：Level 01, Level 02...
    const dayIdStr = day.id < 10 ? `0${day.id}` : day.id;
    // 圖片路徑邏輯：確保路徑與你的檔案夾一致 (public/chapter_images/1.png)
    const imgSrc = `/chapter_images/${day.id}.png`;

    return (
        <div
            onClick={onClick}
            className={`relative group cursor-pointer transition-all duration-300 ${isSelected ? 'z-20 scale-[1.02]' : 'hover:scale-[1.01]'}`}
        >
            {/* 拍立得相框 */}
            <div className={`bg-[#e5e0d4] p-2 pb-6 shadow-2xl rounded-sm border border-stone-400/40 transition-colors
                ${isSelected ? 'bg-[#f4f1e9] ring-2 ring-amber-500/50' : 'brightness-[0.85] sepia-[0.2]'}`}>

                {/* 圖像區 */}
                <div className="relative overflow-hidden bg-stone-900 aspect-square">
                    <img
                        src={imgSrc}
                        alt={day.title}
                        className={`w-full h-full object-cover transition-all duration-700
                            ${isSelected ? 'scale-105 brightness-110' : 'grayscale-[0.3] brightness-75'}`}
                    />
                    {/* 內陰影 */}
                    <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.6)]" />
                </div>

                {/* 底部文字 (手寫感) */}
                <div className="mt-2 px-1 text-center">
                    <p className="text-[10px] text-stone-500 font-mono mb-0.5 tracking-tighter">LEVEL {dayIdStr}</p>
                    <h3 className="font-serif italic font-bold leading-tight text-[11px] text-stone-900">
                        {day.title}
                    </h3>
                </div>
            </div>

            {/* 紅色封蠟印章 */}
            {isSelected && <RedWaxSeal size="w-12 h-12" />}
        </div>
    );
};

export default TrialSelectionView;
