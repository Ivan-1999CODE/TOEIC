import React, { useState, useMemo } from 'react';
import { X, LogOut, Shield } from 'lucide-react';

const DROPOUT_QUOTES = [
    { prof: "Severus Snape", quote: "看來這點程度的單字對你來說太沉重了。回去交誼廳休息吧，波特。", seal: "snape.png" },
    { prof: "Minerva McGonagall", quote: "勇氣不代表魯莽，如果你尚未準備好，退回圖書館重新溫習也是明智之舉。", seal: "mcgonagall.png" },
    { prof: "Filius Flitwick", quote: "喔！你的專注力就像沒唸好的漂浮咒一樣飄走了。再多加練習，直到你能完美掌握它們！", seal: "flitwick.png" },
    { prof: "Remus Lupin", quote: "每個人都有感到力不從心的時刻。這不是失敗，只是一個暫停。去吃片巧克力，下次我們會做得更好。", seal: "lupin.png" },
    { prof: "Gilderoy Lockhart", quote: "這測驗確實有點難，連我也得花點心思。想學得更輕鬆？去讀我的自傳《神奇的我》吧，裡面有秘訣！", seal: "lockhart.png" },
    { prof: "Albus Dumbledore", quote: "有時候，最大的勇氣不是面對困難，而是承認自己還需要更多準備。去吧，魔法世界會等你回來的。", seal: "dumbledore.png" },
];

const DropoutModal = ({ show, onStay, onDropout }) => {
    // 隨機選教授 - 只在 show 變化時重新選
    const selected = useMemo(() => {
        return DROPOUT_QUOTES[Math.floor(Math.random() * DROPOUT_QUOTES.length)];
    }, [show]);

    if (!show) return null;

    return (
        <div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
            <div
                className="relative w-full max-w-sm bg-[#f2eadd] rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.4)] border-4 border-double border-[#4a3728] overflow-hidden"
                style={{
                    backgroundImage: "url('https://www.transparenttextures.com/patterns/aged-paper.png')",
                    animation: 'scaleIn 0.35s ease-out'
                }}
            >
                {/* 動畫 keyframes */}
                <style>{`
                    @keyframes scaleIn {
                        0% { transform: scale(0.8); opacity: 0; }
                        100% { transform: scale(1); opacity: 1; }
                    }
                `}</style>

                {/* 蠟封圖章 - 右上角 */}
                <div className="absolute -top-2 -right-2 z-10">
                    <img
                        src={`/wax_seals/${selected.seal}`}
                        alt="Seal"
                        className="w-20 h-20 drop-shadow-lg object-contain"
                        style={{ transform: 'rotate(12deg)' }}
                        onError={(e) => e.target.style.display = 'none'}
                    />
                </div>

                {/* 頂部標題列 */}
                <div className="bg-[#740001] text-[#e5d5a7] p-3 border-b-2 border-[#4a3728]">
                    <h3 className="font-serif font-bold text-sm uppercase tracking-[0.2em] text-center">
                        ⚠ WARNING ⚠
                    </h3>
                </div>

                {/* 內容區 */}
                <div className="p-6 pt-5">
                    {/* 教授名稱 */}
                    <p className="text-center font-serif font-bold text-[#4a3728] text-sm uppercase tracking-[0.15em] mb-3 border-b border-[#4a3728]/20 pb-2">
                        — {selected.prof} —
                    </p>

                    {/* 教授語錄 */}
                    <p className="text-[#2d2d2d] font-serif italic text-base leading-relaxed text-center mb-5 px-2">
                        「{selected.quote}」
                    </p>

                    {/* 警告 */}
                    <p className="text-center text-xs text-[#740001] font-serif font-bold mb-5 tracking-wide">
                        ⚡ 棄考將損失本次測驗的所有進度 ⚡
                    </p>

                    {/* 按鈕區 */}
                    <div className="flex gap-3">
                        {/* Stay 按鈕 */}
                        <button
                            onClick={onStay}
                            className="flex-1 py-2.5 px-4 rounded border-2 border-[#4a3728] text-[#4a3728] font-serif font-bold text-sm uppercase tracking-wider hover:bg-[#4a3728]/10 transition-all flex items-center justify-center gap-2"
                        >
                            <Shield size={16} />
                            Stay
                        </button>

                        {/* Drop out 按鈕 */}
                        <button
                            onClick={onDropout}
                            className="flex-1 py-2.5 px-4 rounded bg-[#740001] text-[#e5d5a7] font-serif font-bold text-sm uppercase tracking-wider hover:bg-[#8b0000] transition-all shadow-md flex items-center justify-center gap-2 border border-[#e5d5a7]/20"
                        >
                            <LogOut size={16} />
                            Drop out
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DropoutModal;
