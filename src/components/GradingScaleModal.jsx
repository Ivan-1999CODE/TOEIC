import React from 'react';
import { X } from 'lucide-react';

const gradingLegend = [
    { grade: 'S', color: 'text-amber-500', bg: 'bg-amber-100', label: 'Superb', range: '1800+' },
    { grade: 'A', color: 'text-purple-500', bg: 'bg-purple-100', label: 'Exceeds Expectations', range: '1600-1799' },
    { grade: 'B', color: 'text-blue-500', bg: 'bg-blue-100', label: 'Acceptable', range: '1400-1599' },
    { grade: 'C', color: 'text-green-500', bg: 'bg-green-100', label: 'Poor', range: '1200-1399' },
    { grade: 'D', color: 'text-gray-500', bg: 'bg-gray-100', label: 'Dreadful', range: '1000-1199' },
    { grade: 'E', color: 'text-red-600', bg: 'bg-red-100', label: 'Troll', range: '<1000 / HP=0' }
];

const GradingScaleModal = ({ show, onClose }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-sm bg-[#f5ecd8] rounded-xl border border-[#d4c5a9] shadow-2xl overflow-hidden scale-animation animate-scaleIn">
                {/* 關閉按鈕 */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 p-1.5 hover:bg-black/10 rounded-full transition-colors z-10"
                >
                    <X size={20} className="text-[#8c7b60]" />
                </button>

                <div className="p-6">
                    <h4 className="text-sm font-bold uppercase mb-4 tracking-widest text-center"
                        style={{ fontFamily: "'Cinzel', serif", color: '#8c7b60' }}>
                        ─── O.W.L.s Grading Scale ───
                    </h4>

                    <div className="grid grid-cols-2 gap-2">
                        {gradingLegend.map((item) => (
                            <div
                                key={item.grade}
                                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border border-black/5 ${item.bg} shadow-sm`}
                            >
                                <span className={`font-black text-2xl w-8 text-center drop-shadow-sm ${item.color}`}
                                    style={{ fontFamily: "'Cinzel', serif" }}>
                                    {item.grade}
                                </span>
                                <div className="flex flex-col flex-1">
                                    <span className="font-bold text-xs" style={{ color: '#374151' }}>
                                        {item.label}
                                    </span>
                                    <span className="text-[10px] uppercase font-mono tracking-wider" style={{ color: '#6b7280' }}>
                                        {item.range}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GradingScaleModal;
