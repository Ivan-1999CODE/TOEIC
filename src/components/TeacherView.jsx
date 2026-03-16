import { useState, useEffect } from 'react';
import { X, ChevronLeft, Search, Loader2, Eye } from 'lucide-react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import ArchivesModal from './ArchivesModal';

const TeacherView = ({ show, onClose }) => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [detailUid, setDetailUid] = useState(null); // 選中學生的 uid，用來開 ArchivesModal

    // 載入所有學生
    useEffect(() => {
        if (!show) return;
        setDetailUid(null);
        const fetchStudents = async () => {
            setLoading(true);
            try {
                const snap = await getDocs(collection(db, 'users'));
                const list = snap.docs.map(d => {
                    const data = d.data();
                    const cc = data.completionCounts || {};
                    const totalPoints = Object.values(cc).reduce((s, c) => s + Math.min(c, 5), 0);
                    return {
                        uid: d.id,
                        ...data,
                        totalPoints,
                        progress: Math.min(Math.round((totalPoints / 175) * 100), 100)
                    };
                });
                list.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
                setStudents(list);
            } catch (e) {
                console.error('Error fetching students:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, [show]);

    if (!show) return null;

    const filtered = students.filter(s => {
        const term = searchTerm.toLowerCase();
        return (s.displayName || '').toLowerCase().includes(term)
            || (s.studentId || '').toLowerCase().includes(term)
            || (s.email || '').toLowerCase().includes(term);
    });

    return (
        <>
            <div className="absolute inset-0 z-[300] flex items-center justify-center bg-black/85 backdrop-blur-sm animate-fadeIn p-2">
                <div className="relative w-full max-w-lg bg-[#1a1a2e] rounded-2xl shadow-2xl border-2 border-amber-700 overflow-hidden flex flex-col max-h-[95vh]">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-red-900 to-amber-900 text-amber-100 px-5 py-3 flex items-center gap-2 shrink-0">
                        <span className="text-lg">🔮</span>
                        <h2 className="font-bold font-serif tracking-wide flex-1 text-sm">
                            教師密室 · Professor's Archive
                        </h2>
                        <button onClick={onClose}
                            className="p-1.5 bg-red-800 hover:bg-red-700 rounded-full border border-amber-600 transition-transform hover:scale-110">
                            <X size={14} className="text-amber-100" />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="p-3 border-b border-amber-800/30 bg-[#1a1a2e] shrink-0">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-600" />
                            <input
                                type="text"
                                placeholder="搜尋巫師姓名或學號..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-8 pr-3 py-2 bg-[#2a2a4e] text-amber-100 text-sm rounded-lg border border-amber-800/40 focus:border-amber-500 focus:outline-none placeholder-amber-700/50 font-serif"
                            />
                        </div>
                    </div>

                    {/* Column Header */}
                    <div className="grid grid-cols-3 px-4 py-2 text-[11px] font-bold font-serif tracking-wider text-amber-500/70 uppercase border-b border-amber-800/30 bg-[#1e1e3a] shrink-0">
                        <span>巫師</span>
                        <span className="text-center">攻略進度</span>
                        <span className="text-right pr-1">紀錄</span>
                    </div>

                    {/* Student List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {loading ? (
                            <div className="flex items-center justify-center h-32 text-amber-500 font-serif">
                                <Loader2 size={20} className="animate-spin mr-2" />
                                載入學生資料...
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="text-center py-10 text-amber-700/50 text-sm italic font-serif">
                                找不到符合的學生
                            </div>
                        ) : (
                            filtered.map((s, i) => (
                                <div
                                    key={s.uid}
                                    className={`grid grid-cols-3 items-center px-4 py-3 border-b border-amber-800/10 ${i % 2 === 0 ? 'bg-[#1e1e3a]/50' : ''}`}
                                >
                                    {/* 第一欄：巫師 */}
                                    <div className="min-w-0">
                                        <div className="text-amber-100 font-bold text-sm font-serif truncate">
                                            {s.displayName || 'Unknown'}
                                        </div>
                                        <div className="text-gray-400 text-[10px] mt-0.5 font-mono">
                                            {s.totalPoints} / 175
                                        </div>
                                    </div>

                                    {/* 第二欄：攻略進度 */}
                                    <div className="text-center">
                                        <span className={`font-bold font-mono text-lg ${s.progress >= 80 ? 'text-yellow-400' :
                                                s.progress >= 50 ? 'text-green-400' :
                                                    s.progress >= 20 ? 'text-blue-400' :
                                                        'text-gray-400'
                                            }`}>
                                            {s.progress}%
                                        </span>
                                    </div>

                                    {/* 第三欄：紀錄 */}
                                    <div className="text-right">
                                        <button
                                            onClick={() => setDetailUid(s.uid)}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-800/30 hover:bg-amber-700/50 text-amber-300 text-xs font-bold font-serif rounded-lg border border-amber-700/40 hover:border-amber-500 transition-all hover:scale-105 active:scale-95"
                                        >
                                            <Eye size={12} />
                                            詳情
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="text-center py-1.5 text-[10px] text-amber-700/30 font-serif italic border-t border-amber-800/20 shrink-0">
                        共 {filtered.length} 位學生
                    </div>
                </div>
            </div>

            {/* 學生詳情 — 直接使用 ArchivesModal */}
            <ArchivesModal
                show={!!detailUid}
                onClose={() => setDetailUid(null)}
                uid={detailUid}
            />
        </>
    );
};

export default TeacherView;
