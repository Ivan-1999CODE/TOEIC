import React, { useState } from 'react';
import { Wand2, RotateCcw, ChevronLeft, ChevronRight, Sparkles, BookOpen, List, CreditCard, Volume2 } from 'lucide-react';

const FlashcardView = ({ words, level, onStartQuiz, onBack }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [viewMode, setViewMode] = useState('card'); // 'card' or 'list'

    const currentWord = words[currentIndex];

    const handleNext = () => {
        if (currentIndex < words.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setIsFlipped(false);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setIsFlipped(false);
        }
    };

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
    };

    const handleSpeak = (word, event) => {
        event.stopPropagation(); // 防止觸發卡片點擊
        if ('speechSynthesis' in window) {
            // 停止當前正在播放的語音
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(word);
            utterance.lang = 'en-US'; // 設置為英文
            utterance.rate = 0.9; // 語速稍慢一點
            window.speechSynthesis.speak(utterance);
        } else {
            console.warn('此瀏覽器不支援 Web Speech API');
        }
    };

    if (!currentWord) {
        return (
            <div className="text-center py-10 text-amber-900">
                <p>載入單字中...</p>
            </div>
        );
    }

    return (
        <div className="animate-fadeIn h-full flex flex-col">
            {/* Header Area - Sticky (全模式分割線 + 列表防穿透) */}
            <div className={`sticky z-20 bg-[#f5e6c8] transition-all duration-300 ${viewMode === 'list'
                ? '-top-4 sm:-top-6 -mx-4 sm:-mx-6 px-4 sm:px-6 pb-4 pt-2 sm:pt-3 border-b border-amber-800/10 shadow-sm'
                : 'top-0 pb-4 pt-1'
                }`}>
                {/* 第一行：標題與計數按鈕 */}
                <div className="flex justify-between items-center text-amber-900 font-bold text-[10px] sm:text-xs uppercase tracking-widest">
                    <span className="flex items-center gap-1">
                        <button
                            onClick={onBack}
                            className="p-1 -ml-1 rounded-full hover:bg-amber-900/10 transition-colors"
                            title="返回地圖"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <BookOpen size={14} className="ml-1" />
                        {level?.week} - {viewMode === 'card' ? '卡牌' : '列表'}模式
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setViewMode(viewMode === 'card' ? 'list' : 'card')}
                            className="p-1.5 rounded-md hover:bg-amber-900/10 transition-colors border border-amber-700/30 flex items-center gap-1"
                        >
                            {viewMode === 'card' ? <List size={14} /> : <CreditCard size={14} />}
                            <span className="text-[10px]">{currentIndex + 1}/{words.length}</span>
                        </button>
                    </div>
                </div>

                {/* --- 中間分割線：兩個模式現在都有了！ --- */}
                <div className="h-[1px] w-full bg-amber-800/20 my-3"></div>

                {/* 第二行：進度條 */}
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden border border-slate-300">
                    <div
                        className="bg-amber-600 h-full transition-all duration-300"
                        style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
                    ></div>
                </div>
            </div>

            {/* 內容區域 - 卡牌或列表 */}
            {viewMode === 'card' ? (
                /* 卡牌模式 */
                <div className="flex-1 flex flex-col items-center justify-center">
                    <div
                        onClick={handleFlip}
                        className="relative w-full max-w-xs h-64 cursor-pointer perspective-1000"
                        style={{ perspective: '1000px' }}
                    >
                        <div
                            className={`relative w-full h-full transition-transform duration-500 transform-style-preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}
                            style={{
                                transformStyle: 'preserve-3d',
                                WebkitTransformStyle: 'preserve-3d',
                                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                            }}
                        >
                            {/* 正面 - 英文 */}
                            <div
                                className="absolute inset-0 w-full h-full bg-gradient-to-br from-amber-50 via-amber-100 to-amber-50 rounded-xl border-4 border-amber-700 shadow-xl flex flex-col items-center justify-center p-6 backface-hidden"
                                style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                            >
                                <button
                                    onClick={(e) => handleSpeak(currentWord.word, e)}
                                    className="absolute top-3 right-3 p-2 rounded-md hover:bg-amber-200/50 transition-colors group"
                                    title="發音"
                                >
                                    <Volume2 size={20} className="text-amber-600 group-hover:text-amber-800" />
                                </button>
                                <p className="text-xs text-amber-700 uppercase tracking-widest mb-2">English</p>
                                <h2 className="text-4xl font-extrabold text-slate-800 text-center drop-shadow-sm">
                                    {currentWord.word}
                                </h2>
                                <p className="text-sm text-amber-800 mt-3 italic">
                                    {currentWord.pos}
                                </p>
                                <p className="text-xs text-amber-600 mt-6 animate-pulse">
                                    點擊翻轉 →
                                </p>
                            </div>

                            {/* 背面 - 中文與用法 */}
                            <div
                                className="absolute inset-0 w-full h-full bg-gradient-to-br from-red-900 via-red-800 to-red-900 rounded-xl border-4 border-amber-600 shadow-xl flex flex-col items-center justify-center p-6 backface-hidden rotate-y-180"
                                style={{
                                    backfaceVisibility: 'hidden',
                                    WebkitBackfaceVisibility: 'hidden',
                                    transform: 'rotateY(180deg)'
                                }}
                            >
                                <div className="absolute top-3 left-3">
                                    <Wand2 size={20} className="text-amber-400" />
                                </div>
                                <p className="text-xs text-amber-400 uppercase tracking-widest mb-2">Chinese</p>
                                <h2 className="text-2xl font-bold text-amber-100 text-center mb-3">
                                    {currentWord.meaning || currentWord.chinese}
                                </h2>
                                <div className="w-full flex flex-col gap-2 overflow-y-auto custom-scrollbar pr-1 max-h-[120px]">
                                    {currentWord.fixed_collocation && (
                                        <div className="bg-black/20 rounded-lg p-2.5 w-full border border-amber-800/50 shadow-inner">
                                            <p className="text-[10px] text-amber-500/80 uppercase tracking-widest mb-1 text-center font-bold">● 固定用法</p>
                                            <p className="text-xs text-amber-200 text-center leading-relaxed">
                                                {currentWord.fixed_collocation}
                                            </p>
                                        </div>
                                    )}
                                    {currentWord.common_usage && (
                                        <div className="bg-black/20 rounded-lg p-2.5 w-full border border-amber-800/50 shadow-inner">
                                            <p className="text-[10px] text-amber-500/80 uppercase tracking-widest mb-1 text-center font-bold">● 常見用法</p>
                                            <p className="text-xs text-amber-200 text-center leading-relaxed">
                                                {currentWord.common_usage}
                                            </p>
                                        </div>
                                    )}
                                    {!currentWord.fixed_collocation && !currentWord.common_usage && (
                                        <div className="bg-black/20 rounded-lg p-2.5 w-full border border-amber-800/50 shadow-inner">
                                            <p className="text-xs text-amber-500/50 italic text-center leading-relaxed">
                                                {currentWord.sentence !== "No example available." && currentWord.sentence ? `"${currentWord.sentence}"` : "目前尚無例句紀錄"}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* 列表模式 */
                <div className="flex-1 overflow-y-auto">
                    <div className="space-y-2">
                        {words.map((word, index) => (
                            <div
                                key={index}
                                className={`p-3 rounded-lg border-2 transition-all cursor-pointer relative ${index === currentIndex
                                    ? 'bg-amber-100 border-amber-600 shadow-md'
                                    : 'bg-white/60 border-amber-200 hover:bg-amber-50'
                                    }`}
                                onClick={() => setCurrentIndex(index)}
                            >
                                {/* 發音按鈕 - 右上角 */}
                                <button
                                    onClick={(e) => handleSpeak(word.word, e)}
                                    className="absolute top-2 right-2 p-1.5 rounded-md hover:bg-amber-200 transition-colors group"
                                    title="發音"
                                >
                                    <Volume2 size={16} className="text-amber-700 group-hover:text-amber-900" />
                                </button>

                                <div className="flex items-start gap-3 pr-10">
                                    {/* 序號 */}
                                    <span className="text-sm font-bold text-slate-500 shrink-0 mt-0.5">{index + 1}.</span>

                                    <div className="flex-1">
                                        {/* 英文單字 + 詞性 */}
                                        <div className="flex items-baseline gap-2 mb-1">
                                            <h3 className="text-lg font-bold text-slate-800">{word.word}</h3>
                                            <span className="text-xs text-amber-700 italic">{word.pos}</span>
                                        </div>
                                        {/* 中文意思 */}
                                        <p className="text-sm text-slate-700">{word.meaning || word.chinese}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 導航按鈕 */}
            <div className="flex items-center justify-between gap-4 mt-6">
                <button
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${currentIndex === 0
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300'
                        }`}
                >
                    <ChevronLeft size={20} />
                    上一張
                </button>

                <button
                    onClick={handleFlip}
                    className="px-4 py-3 bg-slate-800 text-amber-400 rounded-lg font-bold hover:bg-slate-700 transition-all"
                >
                    <RotateCcw size={20} />
                </button>

                <button
                    onClick={handleNext}
                    disabled={currentIndex === words.length - 1}
                    className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${currentIndex === words.length - 1
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300'
                        }`}
                >
                    下一張
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* 進入試煉按鈕 */}
            <div className="mt-6 space-y-3">
                <button
                    onClick={onStartQuiz}
                    className="w-full py-4 bg-red-800 hover:bg-red-700 text-amber-100 font-bold rounded-lg shadow-lg border-2 border-amber-600 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 group"
                >
                    <Wand2 className="group-hover:rotate-12 transition-transform" size={20} />
                    進入試煉 (Start Quiz)
                </button>

                <button
                    onClick={onBack}
                    className="w-full py-3 bg-transparent hover:bg-amber-900/10 text-amber-900 font-bold rounded-lg border border-amber-900/30 flex items-center justify-center gap-2"
                >
                    返回地圖
                </button>
            </div>
        </div>
    );
};

export default FlashcardView;
