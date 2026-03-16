import React, { useState } from 'react';
import { Ghost, X, Trash2, ShieldAlert } from 'lucide-react';

const MonsterBook = ({ show, onClose, wrongAnswers, onRemove }) => {
    const [wordToRemove, setWordToRemove] = useState(null);

    if (!show) return null;

    const handleConfirmRemove = () => {
        if (wordToRemove) {
            onRemove(wordToRemove);
            setWordToRemove(null);
        }
    };

    const handleCancelRemove = () => {
        setWordToRemove(null);
    };

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn p-4">
            <div className="relative w-full max-w-sm bg-[#3f2e26] rounded-xl shadow-[0_0_30px_rgba(255,0,0,0.3)] border-4 border-[#5d4037] overflow-hidden flex flex-col max-h-[85vh]">

                {/* 毛皮/牙齒裝飾 (CSS 模擬) */}
                <div className="absolute top-0 left-0 w-full h-4 bg-[repeating-linear-gradient(45deg,#3f2e26,#3f2e26_10px,#2a1d18_10px,#2a1d18_20px)]"></div>

                {/* Modal Header */}
                <div className="mt-4 bg-[#2a1d18] text-amber-500 p-4 flex justify-between items-center border-b-2 border-[#5d4037] shadow-inner relative">
                    <h3 className="font-bold text-lg flex items-center gap-2 font-serif tracking-widest">
                        <Ghost size={24} className="text-red-600 animate-bounce" />
                        怪獸的怪獸書
                        <span className="text-xs text-amber-700/80 block mt-1">(錯題捕捉誌)</span>
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-red-900/50 rounded-full transition-colors text-amber-700 hover:text-amber-500"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-[#2a1d18] space-y-4">
                    {wrongAnswers.length === 0 ? (
                        <div className="text-center py-10 text-amber-700/50 flex flex-col items-center gap-4">
                            <Ghost size={48} className="opacity-20" />
                            <p>你的旅程一帆風順...<br />目前沒有捕捉到任何錯字怪獸。</p>
                        </div>
                    ) : (
                        wrongAnswers.map((item, idx) => (
                            <div key={idx} className="bg-[#1a120f] border border-[#5d4037] rounded-lg p-4 relative group hover:border-red-900 hover:shadow-[0_0_15px_rgba(220,38,38,0.1)] transition-all">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="text-xl font-bold text-amber-500">{item.word}</h4>
                                    <span className="text-xs font-bold text-red-400 bg-red-900/40 border border-red-800/50 px-2 py-0.5 rounded-full flex items-center gap-1" title="累計答錯次數">
                                        ✕ {item.errorCount || 1}
                                    </span>
                                </div>
                                <p className="text-amber-100/80 text-sm mb-3 font-medium">{item.meaning}</p>
                                <div className="space-y-2 mt-3 text-amber-900/80">
                                    {item.fixed_collocation && (
                                        <div>
                                            <span className="text-[10px] text-amber-500/80 font-bold block mb-1 tracking-wider">● 固定用法</span>
                                            <p className="text-xs italic border-l-2 border-red-900/30 pl-2 text-amber-100/60">
                                                {item.fixed_collocation}
                                            </p>
                                        </div>
                                    )}
                                    {item.common_usage && (
                                        <div>
                                            <span className="text-[10px] text-amber-500/80 font-bold block mb-1 tracking-wider">● 常見用法</span>
                                            <p className="text-xs italic border-l-2 border-red-900/30 pl-2 text-amber-100/60">
                                                {item.common_usage}
                                            </p>
                                        </div>
                                    )}
                                    {!item.fixed_collocation && !item.common_usage && (
                                        <p className="text-xs italic border-l-2 border-red-900/30 pl-2 text-amber-100/50">
                                            {item.sentence !== "No example available." && item.sentence ? `"${item.sentence}"` : "目前尚無例句紀錄"}
                                        </p>
                                    )}
                                </div>

                                {/* 刪除按鈕 */}
                                <button
                                    onClick={() => setWordToRemove(item.word)}
                                    className="absolute bottom-2 right-2 p-2 text-stone-600 hover:text-red-500 hover:bg-red-950/30 rounded transition-all md:opacity-0 group-hover:opacity-100"
                                    title="我已經學會了 (移除)"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Modal Footer */}
                <div className="p-4 bg-[#1a120f] border-t border-[#5d4037] text-center">
                    <p className="text-xs text-amber-900/40 italic mb-3">
                        "小心，這本書會咬人..."
                    </p>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-[#5d4037] hover:bg-[#724e41] text-amber-100 rounded-lg font-bold shadow hover:shadow-lg transition w-full border border-[#3f2e26]"
                    >
                        合上怪獸書 (Close)
                    </button>
                </div>

                {/* 刪除確認層 */}
                {wordToRemove && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                        <div className="bg-[#1a120f] border-2 border-[#5d4037] rounded-xl p-5 text-center shadow-2xl relative max-w-sm w-full mx-4">
                            <ShieldAlert size={36} className="text-amber-500 mx-auto mb-3" />
                            <h4 className="text-lg font-bold text-amber-500 mb-2 font-serif">海格的肯定</h4>
                            <p className="text-sm text-amber-100/90 mb-6 leading-relaxed">
                                「海格給了你一個大大的擁抱！看來你已經完全掌握這隻『單字奇獸』（<strong className="text-red-400">{wordToRemove}</strong>）的習性了。確定要打開籠子，將牠放生回禁忌森林嗎？」
                            </p>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleConfirmRemove}
                                    className="w-full py-2.5 px-4 bg-green-900/40 hover:bg-green-800/60 border border-green-800/50 text-green-400 font-bold rounded flex items-center justify-center transition"
                                >
                                    ✅ 打開籠子 (放生刪除)
                                </button>
                                <button
                                    onClick={handleCancelRemove}
                                    className="w-full py-2.5 px-4 bg-[#3f2e26] hover:bg-[#5d4037] border border-[#5d4037] text-amber-200/80 font-bold rounded flex items-center justify-center transition"
                                >
                                    ❌ 再多養幾天 (取消)
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MonsterBook;
