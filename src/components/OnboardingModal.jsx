import { useState } from 'react';
import { Wand2, Sparkles, User } from 'lucide-react';

const OnboardingModal = ({ show, defaultName, onComplete }) => {
    const [displayName, setDisplayName] = useState(defaultName || '');
    const [gender, setGender] = useState(''); // 'male' | 'female'

    if (!show) return null;

    const isValid = displayName.trim().length > 0 && gender !== '';

    return (
        <div className="absolute inset-0 z-[500] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <div className="w-full max-w-sm bg-gradient-to-b from-[#2a1a0e] to-[#1a0f08] rounded-2xl border-2 border-amber-700 shadow-[0_0_60px_rgba(234,179,8,0.15)] overflow-hidden animate-fadeIn">

                {/* Header */}
                <div className="relative bg-gradient-to-r from-red-900 via-amber-900 to-red-900 py-6 text-center border-b-2 border-amber-600">
                    <div className="absolute inset-0 opacity-20" style={{
                        backgroundImage: `url("https://www.transparenttextures.com/patterns/old-mathematics.png")`
                    }} />
                    <div className="relative">
                        <div className="flex justify-center mb-2">
                            <div className="p-3 bg-amber-900/50 rounded-full border-2 border-amber-500 shadow-lg">
                                <Wand2 size={28} className="text-amber-300" />
                            </div>
                        </div>
                        <h2 className="text-amber-100 font-serif font-bold text-lg tracking-wide">
                            歡迎來到霍格華茲
                        </h2>
                        <p className="text-amber-400/60 text-[11px] italic mt-1 font-serif">
                            Welcome to Hogwarts School of Witchcraft and Wizardry
                        </p>
                    </div>
                </div>

                {/* Form */}
                <div className="p-6 space-y-5">
                    <p className="text-amber-300/70 text-xs text-center font-serif italic leading-relaxed">
                        在開始你的魔法旅程前，請先完成入學登記。
                    </p>

                    {/* Display Name */}
                    <div>
                        <label className="flex items-center gap-1.5 text-amber-400 text-xs font-bold font-serif mb-1.5 tracking-wide">
                            <User size={12} />
                            巫師姓名 (Name)
                        </label>
                        <input
                            type="text"
                            maxLength={10}
                            value={displayName}
                            onChange={e => setDisplayName(e.target.value)}
                            placeholder="輸入你的姓名..."
                            className="w-full px-4 py-2.5 bg-[#0d0906] text-amber-100 rounded-lg border border-amber-800/50 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30 text-sm placeholder-amber-800/40 font-serif"
                        />
                    </div>

                    {/* Gender */}
                    <div>
                        <label className="flex items-center gap-1.5 text-amber-400 text-xs font-bold font-serif mb-2 tracking-wide">
                            🧙 性別 (Gender)
                        </label>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setGender('male')}
                                className={`flex-1 py-2.5 rounded-lg border text-sm font-serif font-bold transition-all ${gender === 'male'
                                    ? 'bg-blue-900/40 border-blue-500 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.2)]'
                                    : 'bg-[#0d0906] border-amber-800/30 text-amber-700/60 hover:border-amber-700'
                                    }`}
                            >
                                🧙‍♂️ 男 (Male)
                            </button>
                            <button
                                type="button"
                                onClick={() => setGender('female')}
                                className={`flex-1 py-2.5 rounded-lg border text-sm font-serif font-bold transition-all ${gender === 'female'
                                    ? 'bg-pink-900/40 border-pink-500 text-pink-300 shadow-[0_0_12px_rgba(236,72,153,0.2)]'
                                    : 'bg-[#0d0906] border-amber-800/30 text-amber-700/60 hover:border-amber-700'
                                    }`}
                            >
                                🧙‍♀️ 女 (Female)
                            </button>
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        onClick={() => {
                            if (isValid) {
                                onComplete(displayName.trim(), gender);
                            }
                        }}
                        disabled={!isValid}
                        className={`w-full py-3 rounded-lg font-bold font-serif text-sm tracking-wide flex items-center justify-center gap-2 transition-all ${isValid
                            ? 'bg-gradient-to-r from-red-800 to-amber-800 hover:from-red-700 hover:to-amber-700 text-amber-100 border-2 border-amber-600 shadow-lg transform hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer'
                            : 'bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed'
                            }`}
                    >
                        <Sparkles size={16} className={isValid ? 'animate-pulse' : ''} />
                        開始魔法旅程
                    </button>

                    {!isValid && (
                        <p className="text-amber-700/40 text-[10px] text-center italic">
                            請填寫姓名並選擇性別才能進入
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OnboardingModal;
