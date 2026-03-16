import React, { useEffect, useState } from 'react';
import { X, TrendingUp, Calendar, Target, Award } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const formatConsecutiveDays = (days) => {
    if (!days || days.length === 0) return '';
    // 將所有非數字前綴拿掉(如果有)，以防萬一，但此處主要針對1~30的數字
    const numDays = days.map(d => parseInt(d, 10)).filter(n => !isNaN(n)).sort((a, b) => a - b);
    if (numDays.length === 0) return days.join(', '); // If they aren't numbers (e.g. endgame_01), fallback

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

const TrialHistoryModal = ({ show, onClose, user }) => {
    const [historyData, setHistoryData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (show) {
            fetchHistory();
        }
    }, [show]);

    const fetchHistory = async () => {
        if (!user?.uid) return;
        setLoading(true);
        try {
            const q = query(
                collection(db, "users", user.uid, "trial_records"),
                orderBy("timestamp", "desc"),
                limit(20) // Fetch last 20 for chart
            );
            const querySnapshot = await getDocs(q);
            const records = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    // Format timestamp safely
                    date: data.timestamp ? new Date(data.timestamp.seconds * 1000).toLocaleDateString() : 'Just now',
                    fullDate: data.timestamp ? new Date(data.timestamp.seconds * 1000).toLocaleString() : 'Just now'
                };
            });
            // Reverse for chart (oldest to newest)
            setHistoryData(records);
        } catch (error) {
            console.error("Error fetching history:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!show) return null;

    // Data for Chart (Oldest first)
    const chartData = [...historyData].reverse();

    // Data for List (Newest first - max 10)
    const listData = historyData.slice(0, 10);

    const getGrade = (score) => {
        if (score >= 1800) return 'S';
        if (score >= 1600) return 'A';
        if (score >= 1400) return 'B';
        if (score >= 1200) return 'C';
        if (score >= 1000) return 'D';
        return 'E';
    };

    const getGradeColor = (grade) => {
        switch (grade) {
            case 'S': return 'text-yellow-500';
            case 'A': return 'text-red-500';
            case 'B': return 'text-blue-500';
            case 'C': return 'text-green-500';
            case 'D': return 'text-slate-500';
            default: return 'text-slate-400';
        }
    };

    return (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn p-4">
            <div className="relative w-full max-w-lg bg-[#f5e6c8] rounded-xl shadow-2xl border-4 border-amber-800 overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-amber-900 text-amber-100 p-3 flex justify-between items-center border-b-2 border-amber-700 shrink-0">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <TrendingUp size={20} className="text-amber-400" /> 學習歷程曲線 (Learning Curve)
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-red-800 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')] custom-scrollbar">

                    {/* Chart Section */}
                    <div className="bg-white/40 p-4 rounded-lg border border-amber-900/10 shadow-sm">
                        <h4 className="text-amber-900 font-bold mb-4 text-sm uppercase tracking-wider text-center">Recent Performance</h4>
                        <div className="h-48 w-full">
                            {loading ? (
                                <div className="h-full flex items-center justify-center text-amber-800/50">Loading magic...</div>
                            ) : chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
                                        <XAxis
                                            dataKey="id"
                                            tickFormatter={(value, index) => {
                                                const item = chartData.find(d => d.id === value);
                                                if (!item || !item.timestamp) return '';
                                                const d = new Date(item.timestamp.seconds * 1000);
                                                return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
                                            }}
                                            tick={{ fontSize: 10, fill: '#78350f' }}
                                            tickLine={false}
                                            axisLine={false}
                                            interval="preserveStartEnd"
                                        />
                                        <YAxis
                                            hide
                                            domain={[0, 'auto']}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#fffbeb', borderColor: '#b45309', borderRadius: '8px', fontSize: '12px' }}
                                            labelStyle={{ color: '#92400e', fontWeight: 'bold' }}
                                            labelFormatter={(value, payload) => {
                                                if (payload && payload.length > 0) {
                                                    return payload[0].payload.fullDate;
                                                }
                                                const item = chartData.find(d => d.id === value);
                                                return item ? item.fullDate : value;
                                            }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="score"
                                            stroke="#fbbf24"
                                            strokeWidth={3}
                                            dot={{ r: 4, fill: '#b45309', strokeWidth: 0 }}
                                            activeDot={{ r: 6, fill: '#f59e0b' }}
                                            animationDuration={1500}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-amber-800/50">No records yet. Start a trial!</div>
                            )}
                        </div>
                    </div>

                    {/* List Section */}
                    <div className="space-y-3">
                        <h4 className="text-amber-900 font-bold text-sm uppercase tracking-wider text-center flex items-center justify-center gap-2">
                            <Calendar size={14} /> Recent Trials
                        </h4>
                        <div className="space-y-2">
                            {loading ? (
                                <p className="text-center text-xs text-amber-800/50">Reading tome...</p>
                            ) : listData.length > 0 ? (
                                listData.map((record) => (
                                    <div key={record.id} className="bg-amber-50/50 p-3 rounded border border-amber-200 flex justify-between items-center text-sm">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-slate-500 text-xs font-mono">{record.fullDate}</span>
                                            <span className="font-bold text-amber-900 text-xs flex items-center gap-1">
                                                <Target size={10} />
                                                {Array.isArray(record.selectedDays) ? formatConsecutiveDays(record.selectedDays) : 'Days ???'}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <div className={`font-black text-lg ${getGradeColor(record.grade || getGrade(record.score))}`}>
                                                {record.grade || getGrade(record.score)}
                                            </div>
                                            <div className="text-xs text-slate-600 font-bold">
                                                {record.score} pts
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-xs text-amber-800/50 italic">The pages are empty.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrialHistoryModal;
