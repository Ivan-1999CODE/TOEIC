import React from 'react';
import { ChevronRight, Sparkles } from 'lucide-react';

const TOTAL_SPELLS = 120;

const RoomEntrance = ({ unlockedCount = 0, onOpen }) => {
    const progress = Math.min((unlockedCount / TOTAL_SPELLS) * 100, 100);

    return (
        <div className="mx-auto mt-4 max-w-md">
            <button
                type="button"
                onClick={onOpen}
                aria-label={`進入萬應室，目前已尋回 ${unlockedCount} 道失傳咒語`}
                className="group relative w-full overflow-hidden rounded-2xl border border-amber-400/40 bg-[#090c12] text-left shadow-[0_14px_34px_rgba(29,20,13,0.30)] transition-all duration-300 hover:-translate-y-1 hover:border-amber-300/70 hover:shadow-[0_18px_42px_rgba(29,20,13,0.40)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4ead8] active:scale-[0.99]"
            >
                <img
                    src="/assets/room-of-requirement-door.webp"
                    alt=""
                    aria-hidden="true"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.035]"
                />

                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,5,8,0.02)_0%,rgba(3,5,8,0.16)_32%,rgba(6,8,13,0.78)_58%,rgba(6,8,13,0.97)_100%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.22)_0%,transparent_38%,rgba(0,0,0,0.55)_100%)]" />
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/70 to-transparent" />
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full border border-amber-200/25 bg-black/45 px-2.5 py-1 text-[9px] font-bold tracking-[0.14em] text-amber-100/90 shadow-lg backdrop-blur-sm transition-colors group-hover:border-amber-200/45 group-hover:bg-black/55">
                    <Sparkles size={10} aria-hidden="true" />
                    隱藏空間
                </div>

                <div className="relative min-h-[196px] p-4 sm:min-h-[210px] sm:p-5">
                    <div className="ml-[38%] flex min-h-[164px] min-w-0 flex-col justify-center sm:min-h-[170px]">
                        <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.26em] text-amber-300/70">
                            Hidden Chamber
                        </p>

                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <h3 className="font-serif text-[22px] font-bold leading-tight tracking-wide text-amber-50 drop-shadow-md transition-colors group-hover:text-white">
                                    萬應室
                                </h3>
                                <p className="mt-1 text-[11px] leading-relaxed text-stone-300/85">
                                    推開門，尋回失傳的咒語
                                </p>
                            </div>
                            <div className="shrink-0 pt-0.5 text-right">
                                <span className="font-mono text-xl font-bold leading-none text-amber-300">{unlockedCount}</span>
                                <span className="ml-0.5 text-[9px] text-stone-400">/ {TOTAL_SPELLS}</span>
                            </div>
                        </div>

                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/55 ring-1 ring-white/10">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-amber-700 via-amber-400 to-yellow-100 shadow-[0_0_8px_rgba(251,191,36,0.45)] transition-all duration-700"
                                style={{ width: `${progress}%` }}
                            />
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/10 pt-3">
                            <span className="text-[10px] text-stone-400">收藏進度</span>
                            <span className="flex items-center gap-1 text-[11px] font-bold text-amber-200 transition-colors group-hover:text-amber-100">
                                讓房間現身
                                <ChevronRight size={14} aria-hidden="true" className="transition-transform group-hover:translate-x-1" />
                            </span>
                        </div>
                    </div>
                </div>
            </button>
        </div>
    );
};

export default RoomEntrance;
