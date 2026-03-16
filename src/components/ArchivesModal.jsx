import { useState, useEffect } from 'react';
import { X, BookOpen, Scroll, Wand2 } from 'lucide-react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const MODE_TABS = [
    { id: 'main_story', label: '主線故事', emoji: '📖', color: 'text-amber-900' },
    { id: 'gate_of_truth', label: '真理之門', emoji: '🦉', color: 'text-indigo-800' },
    { id: 'lost_spells', label: '失傳咒語', emoji: '✨', color: 'text-purple-800' },
];

const RANK_COLORS = {
    S: 'text-yellow-500 font-extrabold',
    A: 'text-red-600 font-bold',
    B: 'text-blue-600 font-bold',
    C: 'text-green-600 font-bold',
    D: 'text-gray-500 font-bold',
    E: 'text-gray-400 font-bold',
};

const formatConsecutiveDays = (days) => {
    if (!days || days.length === 0) return '';
    // 將所有非數字前綴拿掉(如果有)
    const numDays = days.map(d => parseInt(d, 10)).filter(n => !isNaN(n)).sort((a, b) => a - b);
    if (numDays.length === 0) return days.join(', '); // fallback

    const ranges = [];
    let start = numDays[0];
    let prev = numDays[0];

    for (let i = 1; i <= numDays.length; i++) {
        if (numDays[i] === prev + 1) {
            prev = numDays[i];
        } else {
            if (start === prev) {
                ranges.push(`${start}`);
            } else if (start === prev - 1) {
                ranges.push(`${start}, ${prev}`);
            } else {
                ranges.push(`${start}~${prev}`);
            }
            if (i < numDays.length) {
                start = numDays[i];
                prev = numDays[i];
            }
        }
    }
    return ranges.join(', ');
};

const formatLevelId = (mode, levelId) => {
    if (mode === 'main_story') return `第 ${levelId} 關`;
    if (mode === 'gate_of_truth') {
        // levelId is comma-joined day numbers
        const days = String(levelId).split(',').filter(Boolean);
        return `Day ${formatConsecutiveDays(days)}`;
    }
    if (mode === 'lost_spells') return '萬應室';
    return String(levelId);
};

const ArchivesModal = ({ show, onClose, uid }) => {
    const [activeTab, setActiveTab] = useState('main_story');
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!show || !uid) return;
        const fetchRecords = async () => {
            setLoading(true);
            try {
                // 避免需要建立 Firestore Composite Index，改抓全部歷程後在前端 filter & sort
                const q = collection(db, 'users', uid, 'history');
                const snap = await getDocs(q);
                let docsList = snap.docs.map(d => ({ id: d.id, ...d.data() }));

                // 1. 篩選 mode
                docsList = docsList.filter(d => d.mode === activeTab);

                // 2. 依照 timestamp 排序 (desc)
                docsList.sort((a, b) => {
                    const tA = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
                    const tB = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
                    return tB - tA;
                });

                setRecords(docsList);
            } finally {
                setLoading(false);
            }
        };
        fetchRecords();
    }, [show, uid, activeTab]);

    if (!show) return null;

    return (
        <div className="absolute inset-0 z-[400] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn p-4">
            {/* Panel */}
            <div className="relative w-full max-w-md bg-[#fdf6e3] rounded-2xl shadow-2xl border-4 border-double border-amber-800 overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-amber-900 text-amber-100 px-5 py-3 flex items-center gap-2 shrink-0">
                    <Scroll size={18} className="text-amber-300" />
                    <h2 className="font-bold font-serif tracking-wide flex-1">榮譽歷程 · Archives</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 bg-red-900 hover:bg-red-800 rounded-full border border-amber-600 transition-transform hover:scale-110"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b-2 border-amber-700/30 bg-amber-50 shrink-0">
                    {MODE_TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-2.5 text-xs font-bold font-serif transition-all border-b-2 -mb-[2px] ${activeTab === tab.id
                                ? 'border-amber-700 bg-[#fdf6e3] text-amber-900'
                                : 'border-transparent text-amber-700/60 hover:text-amber-900'
                                }`}
                        >
                            <span className="block text-base leading-none mb-0.5">{tab.emoji}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-3">
                    {loading ? (
                        <div className="flex items-center justify-center h-32 text-amber-700 font-serif">
                            <Wand2 size={20} className="animate-spin mr-2" />
                            載入中...
                        </div>
                    ) : records.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-amber-700/60 font-serif italic text-sm gap-2">
                            <BookOpen size={32} className="opacity-40" />
                            尚無歷程紀錄
                        </div>
                    ) : (
                        <table className="w-full text-sm font-serif">
                            <thead>
                                <tr className="text-amber-800/70 text-xs uppercase tracking-wider border-b border-amber-700/20">
                                    <th className="text-left py-2">日期</th>
                                    <th className="text-left py-2">關卡</th>
                                    <th className="text-right py-2">分數</th>
                                    <th className="text-right py-2 pr-1">等級</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.map((rec, i) => (
                                    <tr
                                        key={rec.id}
                                        className={`border-b border-amber-700/10 ${i % 2 === 0 ? 'bg-amber-50/60' : ''}`}
                                    >
                                        <td className="py-2 text-amber-900/70 text-xs whitespace-nowrap">
                                            {rec.dateString || '—'}
                                        </td>
                                        <td className="py-2 text-amber-900 text-xs">
                                            {formatLevelId(activeTab, rec.levelId)}
                                        </td>
                                        <td className="py-2 text-right text-amber-900 font-mono tabular-nums">
                                            {rec.score ?? '—'}
                                        </td>
                                        <td className={`py-2 text-right pr-1 text-base ${RANK_COLORS[rec.rank] || 'text-gray-500 font-bold'}`}>
                                            {rec.rank || '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer */}
                <div className="text-center py-2 text-[10px] text-amber-700/40 font-serif italic border-t border-amber-700/20 shrink-0">
                    共 {records.length} 筆紀錄
                </div>
            </div>
        </div>
    );
};

export default ArchivesModal;
