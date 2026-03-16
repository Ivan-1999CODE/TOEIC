import React, { useState } from 'react';
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from '../firebase';
import { Loader2 } from 'lucide-react';

const LoginView = ({ onLoginSuccess }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            console.log("Wizard detected:", user.displayName);
            if (onLoginSuccess) onLoginSuccess(user);
        } catch (error) {
            console.error("Login spell failed:", error);
            alert("傳送門故障 (Login Error): " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center p-4 relative overflow-hidden">
            {/* 背景星空特效 */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>

            {/* 浮動粒子 */}
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.6; }
                    50% { transform: translateY(-20px) rotate(180deg); opacity: 1; }
                }
                @keyframes shimmer {
                    0% { background-position: -200% center; }
                    100% { background-position: 200% center; }
                }
                @keyframes sealStamp {
                    0% { transform: scale(3) rotate(-30deg); opacity: 0; }
                    60% { transform: scale(0.9) rotate(5deg); opacity: 1; }
                    80% { transform: scale(1.05) rotate(-2deg); }
                    100% { transform: scale(1) rotate(0deg); opacity: 1; }
                }
                .seal-stamp {
                    animation: sealStamp 0.8s ease-out forwards;
                    animation-delay: 0.5s;
                    opacity: 0;
                }
                .shimmer-text {
                    background: linear-gradient(90deg, #d4af37, #f5e6a3, #d4af37);
                    background-size: 200% auto;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    animation: shimmer 3s linear infinite;
                }
            `}</style>

            {/* 飄浮的星星 */}
            {[...Array(6)].map((_, i) => (
                <div
                    key={i}
                    className="absolute text-amber-400/40 text-lg"
                    style={{
                        top: `${15 + i * 13}%`,
                        left: `${10 + i * 15}%`,
                        animation: `float ${3 + i * 0.5}s ease-in-out infinite`,
                        animationDelay: `${i * 0.3}s`
                    }}
                >
                    ✦
                </div>
            ))}

            {/* 入學信封容器 */}
            <div className="max-w-md w-full bg-[#f2eadd] rounded-lg shadow-[0_0_50px_rgba(251,191,36,0.2)] border-8 border-double border-[#4a3728] p-8 text-center relative transform hover:scale-[1.01] transition-transform duration-500">

                {/* 背景紋理 */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')] opacity-50 rounded-lg pointer-events-none"></div>

                {/* 校徽 */}
                <div className="mb-6 flex justify-center relative z-10">
                    <img
                        src="/hogwarts_crest.png"
                        alt="Hogwarts"
                        className="w-32 h-32 drop-shadow-md object-contain seal-stamp"
                    />
                </div>

                {/* 歡迎標題 */}
                <h1 className="text-3xl font-serif font-bold text-[#740001] mb-2 tracking-wide drop-shadow-sm relative z-10" style={{ fontFamily: 'Cinzel Decorative' }}>
                    HOGWARTS
                </h1>
                <p className="text-[#5c4033] font-serif italic mb-8 border-b border-[#5c4033]/30 pb-4 relative z-10">
                    School of Witchcraft and Wizardry
                </p>

                {/* 內文 */}
                <div className="text-left mb-8 space-y-4 relative z-10">
                    <p className="text-[#2d2d2d] font-serif leading-relaxed">
                        Dear Student,
                    </p>
                    <p className="text-[#2d2d2d] font-serif leading-relaxed">
                        We are pleased to inform you that you have been accepted at Hogwarts School of Witchcraft and Wizardry. Please sign in to access your spell book.
                    </p>
                </div>

                {/* Google 登入按鈕 (魔法風格) */}
                <button
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full group relative py-3 px-6 rounded bg-[#740001] text-[#e5d5a7] font-serif font-bold text-lg tracking-widest uppercase shadow-lg hover:bg-[#8b0000] transition-all overflow-hidden border border-[#e5d5a7]/30 disabled:opacity-50 disabled:cursor-not-allowed relative z-10"
                >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                        {isLoading ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                            </svg>
                        )}
                        {isLoading ? 'Casting Spell...' : 'Present Ticket'}
                    </span>
                    {/* 按鈕光效 */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                </button>

                <p className="mt-6 text-xs text-[#5c4033]/60 font-serif relative z-10">
                    Term begins immediately. We await your owl by no later than July 31.
                </p>

            </div>
        </div>
    );
};

export default LoginView;
