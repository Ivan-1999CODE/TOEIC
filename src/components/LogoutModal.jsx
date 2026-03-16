import React from 'react';
import { DoorOpen, LogOut, X } from 'lucide-react';

const LogoutModal = ({ show, onClose, onConfirm }) => {
    if (!show) return null;

    return (
        <div className="absolute inset-0 z-[500] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="w-full max-w-sm bg-gradient-to-b from-[#2a1a0e] to-[#1a0f08] rounded-xl border-2 border-stone-600 shadow-2xl overflow-hidden relative">

                {/* 裝飾背景 */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/black-linen.png")' }}></div>

                {/* 標題區 */}
                <div className="relative bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 py-4 text-center border-b border-stone-600/50">
                    <div className="flex justify-center mb-2">
                        <div className="p-3 bg-stone-900/50 rounded-full border border-stone-500 shadow-lg">
                            <DoorOpen size={24} className="text-stone-300" />
                        </div>
                    </div>
                    <h2 className="text-stone-200 font-serif font-bold text-lg tracking-widest">
                        登出魔法學校
                    </h2>
                </div>

                {/* 內容區 */}
                <div className="p-6 relative text-center">
                    <p className="text-amber-100/90 font-serif text-sm leading-relaxed mb-8">
                        準備好返回麻瓜世界了嗎？<br />
                        請確保你的行李都已收拾妥當，<br />
                        點擊這裡施展『消影術』安全離開。
                    </p>

                    {/* 按鈕區 */}
                    <div className="flex gap-4">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-lg border border-stone-600 text-stone-300 bg-stone-800 hover:bg-stone-700 font-bold tracking-wider transition-colors"
                        >
                            留在霍格華茲
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 py-2.5 rounded-lg border-2 border-red-900/50 text-red-100 bg-red-950 hover:bg-red-900 font-bold tracking-wider transition-colors flex justify-center items-center gap-2 shadow-[0_0_15px_rgba(153,27,27,0.4)] hover:shadow-[0_0_20px_rgba(220,38,38,0.6)]"
                        >
                            <LogOut size={16} />消影術
                        </button>
                    </div>
                </div>

                {/* 右上角關閉按鈕 */}
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 p-1 text-stone-400 hover:text-stone-200 transition-colors"
                >
                    <X size={20} />
                </button>
            </div>
        </div>
    );
};

export default LogoutModal;
