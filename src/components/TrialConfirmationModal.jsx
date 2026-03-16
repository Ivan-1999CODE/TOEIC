import React, { useState, useEffect } from 'react';

const MESSAGES = [
    {
        title: "你準備好支付代價了嗎？",
        body: "「凡人渴望真理，必先展現意志。進入真理之門後，唯有完成試煉方能回頭。在此之後，你的魔力（積分）將被重新定義。」",
        cancelText: "我還沒準備好。",
        confirmText: "開啟門扉，支付代價"
    },
    {
        title: "真理就在門的另一端...",
        body: "「這是一條通往純粹知識的路徑，沒有捷徑，只有專注。在此門之後，唯有真實的記憶能指引你前行。」",
        cancelText: "退回安全區。",
        confirmText: "直視真理"
    },
    {
        title: "正式的試煉即將開始",
        body: "「這不是一場遊戲，這是對你靈魂（單字量）的終極拷問。請握緊你的魔杖，保持清晰的思路。」",
        cancelText: "稍後再來。",
        confirmText: "接受挑戰"
    }
];

const TrialConfirmationModal = ({ show, onConfirm, onCancel }) => {
    const [message, setMessage] = useState(MESSAGES[0]);

    useEffect(() => {
        if (show) {
            const randomIndex = Math.floor(Math.random() * MESSAGES.length);
            setMessage(MESSAGES[randomIndex]);
        }
    }, [show]);

    if (!show) return null;

    return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn p-4 font-serif">
            <div className="relative w-full max-w-sm bg-[#1a0f0a] border-2 border-amber-800 rounded-lg shadow-2xl overflow-hidden p-6 text-center transform transition-all scale-100">
                <div className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{
                        backgroundImage: `url("https://www.transparenttextures.com/patterns/wood-pattern.png")`
                    }}>
                </div>

                <h3 className="relative z-10 text-xl font-bold text-red-700 mb-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-wide">
                    {message.title}
                </h3>

                <div className="relative z-10 bg-black/40 border border-amber-900/50 p-4 rounded mb-6 inner-shadow">
                    <p className="text-amber-100/90 text-sm leading-relaxed italic">
                        {message.body}
                    </p>
                </div>

                <div className="relative z-10 flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3 px-2 bg-stone-900 hover:bg-stone-800 text-stone-400 border border-stone-700 rounded transition-colors text-sm"
                    >
                        {message.cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-3 px-2 bg-red-900 hover:bg-red-800 text-amber-100 font-bold border-2 border-red-700 rounded shadow-[0_0_15px_rgba(185,28,28,0.4)] transition-all active:scale-95 text-sm"
                    >
                        {message.confirmText}
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default TrialConfirmationModal;
