import React, { useState, useEffect } from 'react';
import { X, Sparkles, Star, Gem, Crown, Feather, Leaf, Moon, Castle, Sword, Flame } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc, arrayUnion } from 'firebase/firestore';

const LootModal = ({ show, onClose, onUnlock, unlockedSpells = [], user }) => {
    const [cards, setCards] = useState([]);
    const [selectedIndices, setSelectedIndices] = useState([]); // Indices of cards selected by user
    const [loading, setLoading] = useState(false);
    const [revealedData, setRevealedData] = useState({}); // Map index -> card data { word, rarity, ... }

    // Rarity colors/config
    const RARITY_CONFIG = {
        Common: { color: 'text-amber-700', bg: 'bg-amber-100', border: 'border-amber-700', shadow: 'shadow-amber-500/20', icon: Star },
        Rare: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-500', shadow: 'shadow-blue-500/40', icon: Gem },
        Legendary: { color: 'text-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-500', shadow: 'shadow-yellow-500/60', icon: Crown },
    };

    // --- 六大導師的視覺主題 (用於圖章與資料夾) ---
    const PROFESSOR_THEMES = {
        'endgame_01': { icon: Feather, label: 'Charms Master' },
        'endgame_02': { icon: Leaf, label: 'Herbology' },
        'endgame_03': { icon: Moon, label: 'Defense Against the Dark Arts' },
        'endgame_04': { icon: Castle, label: 'Transfiguration' },
        'endgame_05': { icon: Sword, label: 'Potions Master' },
        'endgame_06': { icon: Flame, label: 'Headmaster' }
    };

    // 根據 index 推算 chapterId
    function getChapterIdFromIndex(index) {
        if (index <= 20) return 'endgame_01';
        if (index <= 40) return 'endgame_02';
        if (index <= 60) return 'endgame_03';
        if (index <= 80) return 'endgame_04';
        if (index <= 100) return 'endgame_05';
        return 'endgame_06';
    }

    useEffect(() => {
        if (show) {
            fetchLootCandidate();
        } else {
            // Reset state on close
            setCards([]);
            setSelectedIndices([]);
            setRevealedData({});
        }
    }, [show]);

    const fetchLootCandidate = async () => {
        setLoading(true);
        try {
            // Fetch all locked items first
            // Note: Ideally we should use a more efficient random query if the dataset is huge, 
            // but for 120 items, fetching unlocked=false is fine.
            const q = query(collection(db, "collocations"));
            const snapshot = await getDocs(q);

            let candidates = snapshot.docs
                .map(doc => ({ ...doc.data(), id: doc.id }))
                .filter(c => !unlockedSpells.includes(c.id));

            // Randomly pick 8
            // If fewer than 8, pick all and maybe fill with dummies if strictly needed, 
            // but for now let's just show what's available (up to 8).
            candidates = candidates.sort(() => Math.random() - 0.5).slice(0, 8);

            // If we still have fewer than 8 (e.g. nearly complete), that's fine, just show them.
            // We just need to track them. We'll use local state 'cards' to hold them.
            // We don't reveal their content yet.
            setCards(candidates);
        } catch (error) {
            console.error("Error fetching loot:", error);
        }
        setLoading(false);
    };

    const handleCardClick = async (index) => {
        // Validation: 
        // 1. Index valid
        // 2. Not already selected
        // 3. Max 4 selected
        if (index >= cards.length || selectedIndices.includes(index) || selectedIndices.length >= 4) {
            return;
        }

        const selectedCard = cards[index];

        // 1. Add to selected list immediately (trigger flip animation)
        setSelectedIndices(prev => [...prev, index]);

        // 2. Unlock in Firestore
        try {
            const cardId = String(selectedCard.id); // Ensure string
            // 2. 同步到 users/{uid}.unlockedSpells
            if (user?.uid) {
                const userRef = doc(db, 'users', user.uid);
                updateDoc(userRef, { unlockedSpells: arrayUnion(cardId) }).catch(console.error);
            }
            // 即時更新父元件的 unlockedSpells 狀態
            if (onUnlock) onUnlock([cardId]);

            // 3. Reveal data
            setRevealedData(prev => ({
                ...prev,
                [index]: selectedCard
            }));

            // Play sound effect based on rarity? (Optional optimization)

        } catch (error) {
            console.error("Error unlocking card:", error);
        }
    };

    const handleCloseEarly = async () => {
        // 如果還沒選滿 4 張，隨機幫使用者抽完剩下的
        const remainingParams = 4 - selectedIndices.length;
        if (remainingParams > 0 && cards.length > 0) {
            const unpickedIndices = cards.map((_, i) => i).filter(i => !selectedIndices.includes(i));
            const toUnlock = unpickedIndices.sort(() => Math.random() - 0.5).slice(0, remainingParams);
            const unlockIds = toUnlock.map(i => String(cards[i].id));

            // 同步到 users/{uid}.unlockedSpells
            if (user?.uid && unlockIds.length > 0) {
                const userRef = doc(db, 'users', user.uid);
                updateDoc(userRef, { unlockedSpells: arrayUnion(...unlockIds) }).catch(console.error);
            }
            // 即時更新父元件的 unlockedSpells 狀態
            if (onUnlock && unlockIds.length > 0) onUnlock(unlockIds);
        }
        onClose(); // 通知外部關閉
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center animate-fadeIn">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md cursor-pointer" onClick={handleCloseEarly} />

            {/* 關閉按鈕 */}
            <button
                onClick={handleCloseEarly}
                className="absolute top-6 right-6 z-[80] text-amber-500/50 hover:text-amber-400 transition-colors p-2 hover:bg-amber-900/30 rounded-full"
            >
                <X size={32} />
            </button>

            <div className="relative w-full max-w-5xl p-4 flex flex-col items-center gap-8">

                {/* Header */}
                <div className="text-center space-y-2 z-10">
                    <h2 className="text-4xl font-serif font-bold text-amber-100 tracking-widest drop-shadow-lg">
                        萬應室的餽贈
                    </h2>
                    <p className="text-amber-400/80 font-mono text-sm tracking-widest uppercase">
                        The Room of Requirement Presents
                    </p>
                    <p className="text-white/60 text-sm">
                        請選取 4 張命運卡牌 ({selectedIndices.length}/4)
                    </p>
                </div>

                {/* Cards Grid */}
                {loading ? (
                    <div className="text-amber-500 animate-pulse">Summoning ancient scrolls...</div>
                ) : (
                    <div className="grid grid-cols-4 gap-4 sm:gap-6 w-full max-w-4xl perspective-1000">
                        {cards.map((card, idx) => {
                            const isSelected = selectedIndices.includes(idx);
                            const cardData = revealedData[idx]; // Only exists if selected
                            const rarity = cardData?.rarity || 'Common'; // Default to Common if not ready
                            const config = RARITY_CONFIG[rarity] || RARITY_CONFIG['Common'];
                            const RarityIcon = config.icon;

                            // Determine Professor Info
                            const order = cardData?.order || parseInt(card.id.replace(/\D/g, '')) || 0;
                            const chapterId = getChapterIdFromIndex(order);
                            const profTheme = PROFESSOR_THEMES[chapterId];
                            const ProfIcon = profTheme?.icon;

                            // Stamp style based on rarity (similar to SpellLibraryView, but stronger for visibility)
                            let stampStyle = 'bg-black/10 border-black/20 text-slate-600';
                            if (rarity === 'Legendary') stampStyle = 'bg-yellow-600/20 border-yellow-600/40 text-yellow-700';
                            else if (rarity === 'Rare') stampStyle = 'bg-blue-600/20 border-blue-600/40 text-blue-700';
                            else stampStyle = 'bg-amber-900/10 border-amber-900/30 text-amber-800';

                            return (
                                <div
                                    key={card.id}
                                    onClick={() => handleCardClick(idx)}
                                    className={`relative aspect-[3/4] cursor-pointer group transition-all duration-300 ${isSelected ? '' : 'hover:-translate-y-2 hover:shadow-[0_0_20px_rgba(251,191,36,0.4)]'
                                        } ${selectedIndices.length >= 4 && !isSelected ? 'opacity-30 cursor-not-allowed grayscale' : ''}`}
                                >
                                    <div className={`relative w-full h-full transition-all duration-700 transform-style-3d ${isSelected ? 'rotate-y-180' : ''}`}>

                                        {/* Back Face (Locked) */}
                                        <div className="absolute inset-0 w-full h-full backface-hidden rounded-xl border-4 border-amber-900/50 bg-[#2d1b15] shadow-xl overflow-hidden flex items-center justify-center leading-normal">
                                            <div className="absolute inset-0 opacity-40"
                                                style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/black-scales.png")` }} />
                                            <div className="w-16 h-16 rounded-full border-2 border-amber-500/30 flex items-center justify-center bg-black/20 group-hover:bg-amber-500/10 transition-colors">
                                                <Sparkles className="text-amber-700 group-hover:text-amber-500 transition-colors" size={32} />
                                            </div>
                                        </div>

                                        {/* Front Face (Revealed) */}
                                        <div className={`absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-xl border-2 ${config.border} ${config.bg} shadow-2xl flex flex-col items-center justify-between p-3 text-center overflow-hidden`}>

                                            {/* Professor Icon (Top Right Stamp) */}
                                            {isSelected && ProfIcon && (
                                                <div className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center border ${stampStyle}`}>
                                                    <ProfIcon size={16} />
                                                </div>
                                            )}

                                            {/* Rarity & Particles */}
                                            {isSelected && rarity === 'Legendary' && (
                                                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-yellow-500/20 blur-3xl rounded-full animate-pulse" />
                                                </div>
                                            )}

                                            <div className="z-10 mt-6">
                                                <RarityIcon size={24} className={`mx-auto ${config.color}`} />
                                                <span className={`text-[10px] uppercase font-bold tracking-wider block mt-1 ${config.color}`}>
                                                    {rarity}
                                                </span>
                                            </div>

                                            <div className="z-10 flex-1 flex flex-col justify-center items-center gap-1 w-full px-1">
                                                <h3 className="text-lg font-bold font-serif text-slate-800 leading-tight break-words w-full">
                                                    {cardData?.phrase || "..."}
                                                </h3>
                                                <div className="w-8 h-0.5 bg-slate-300 rounded-full my-1" />
                                                <p className="text-xs text-slate-600 font-medium line-clamp-2">
                                                    {cardData?.meaning || "..."}
                                                </p>
                                            </div>

                                            <div className="z-10 w-full flex justify-between items-end mt-1">
                                                <span className="text-[10px] text-slate-400 font-mono">
                                                    #{String(order).padStart(3, '0')}
                                                </span>
                                                {profTheme && (
                                                    <span className="text-[9px] font-bold text-slate-400/80 uppercase tracking-tighter truncate max-w-[80px] text-right">
                                                        {profTheme.label}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Empty Slots Filler if < 8 */}
                        {[...Array(Math.max(0, 8 - cards.length))].map((_, i) => (
                            <div key={`empty-${i}`} className="aspect-[3/4] rounded-xl border-2 border-dashed border-white/10 bg-white/5 flex items-center justify-center">
                                <span className="text-white/20 text-xs">Slot Empty</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Footer / Close Button */}
                <div className="z-10 pt-4">
                    {selectedIndices.length >= 4 ? (
                        <button
                            onClick={onClose}
                            className="px-8 py-3 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-bold rounded-lg shadow-[0_0_20px_rgba(251,191,36,0.5)] transition-all transform hover:scale-105 animate-bounce"
                        >
                            收入萬應室 (Collect & Close)
                        </button>
                    ) : (
                        <p className="text-amber-200/50 animate-pulse">
                            Select {4 - selectedIndices.length} more...
                        </p>
                    )}
                </div>

            </div>

            <style>{`
                .perspective-1000 { perspective: 1000px; }
                .transform-style-3d { transform-style: preserve-3d; }
                .backface-hidden { backface-visibility: hidden; }
                .rotate-y-180 { transform: rotateY(180deg); }
            `}</style>
        </div>
    );
};

export default LootModal;
