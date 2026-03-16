import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertTriangle, Music, Skull, ChevronRight, Target } from 'lucide-react';

// 各 Boss 關卡的內容資料
const BOSS_CONTENT = {
    // Boss 01 (Level 6): 三頭犬
    6: {
        descriptions: [
            "毛毛的六隻眼睛正狠狠盯著你，牠的咆哮震得地板都在發抖！",
            "其中一個腦袋開始搖晃，但牠尖銳的爪子仍在抓撓地面，別掉以輕心！",
            "三個頭都開始打哈欠了！空氣中緊繃的氣氛稍稍緩和，繼續彈奏！",
            "牠已經陷入深沉的白日夢，但只要一個錯音，這頭巨獸就會隨時驚醒！",
            "完美！巨犬已沉入夢鄉。現在，輕輕收起琴弦，真正的冒險才要開始。"
        ],
        goals: [
            "穩住顫抖的手，在混亂的節奏中找回基礎邏輯的共鳴。",
            "保持旋律的連貫性，不能讓音樂中斷。",
            "進入樂章核心，用精準的邏輯加強催眠的力道。",
            "進入最後的收尾，確保旋律完美無瑕，徹底麻痺牠的感官。",
            "完成最後的施法，在寂靜中拉開通往下一章的大門。"
        ]
    },
    // Boss 02 (Level 12): 蛇妖
    12: {
        descriptions: [
            "密室的積水浸透了你的鞋底，四周死寂，唯有管道內傳來指甲刮擦石壁的嘶嘶聲。你緊握魔杖，指尖因為寒冷而微微發抖。",
            "巨大的黑影掠過，你迅速轉頭，透過牆上潮濕的倒影觀察敵人。直接對視即是死亡，你必須學會利用周遭的一切來捕捉目標。",
            "蛇妖噴出的毒氣模糊了視線，你乾脆閉上眼睛。此刻，在決鬥社練就的極速反應成了唯一的救命稻草。",
            "蛇妖因為久攻不下而變得焦躁，牠張開血盆大口發出狂暴的嘶吼。就在那一瞬間，你感受到了藏在陰影中、蛇鱗縫隙下的命門。",
            "這是最後的對決。你感受到了體內法力的奔湧，與手中魔杖合而為一。當蛇妖再次發動致命一擊時，你將給予最精準的迴旋反擊。"
        ],
        goals: [
            "嘶吼聲近在咫尺，黑暗中似乎有一對致命的黃色巨眼正搜尋著你的蹤跡！",
            "你從水影中看到了閃爍的鱗片！保持專注，絕不要抬頭直視！",
            "雖然視線受阻，但你的感官變得前所未有的敏銳。感受那股腥風的來源！",
            "蛇妖最脆弱的部位已暴露在你的魔杖指向之處。",
            "決戰時刻！給予這頭千年怪物最後的慈悲，終結這場噩夢。"
        ]
    },
    // Boss 03 (Level 18): 吸魂衣
    18: {
        descriptions: [
            "湖畔的冷風刺骨，水面瞬間結成厚冰。你的呼吸化為白霧，恐懼感試圖在你的大腦深處生根。你必須在凍結的思緒中，尋找那一絲微弱的快樂火花。",
            "隨著咒語聲響起，魔杖尖端噴湧出稀薄的銀色霧氣。雖然還無法擊退對手，但這道屏障暫時擋住了那些致命的灰手。",
            "十幾隻吸魂衣同時俯衝，陰冷的氣息幾乎要壓垮銀色屏障。這不再只是施法，而是一場關於誰更堅韌的意志較量。你必須將過去學過的所有高階魔法轉化為支撐。",
            "銀光開始扭曲、凝聚，在光芒的核心，某種具有生命力的形體呼之欲出。你感受到了體內湧現出一股前所未有的暖流，徹底驅散了寒顫。",
            "這是最終的釋放。實體護法破繭而出，發出震耳欲聾的靈魂咆哮，衝向那群黑暗的化身。當純粹的光照亮整片黑夜，所有的陰霾都將無所遁形。"
        ],
        goals: [
            "吸魂衣正在雲層中盤旋，四周的色彩正在褪去，快握緊你的魔杖！",
            "寒冷被阻隔在一步之外，但銀霧還不夠堅固，繼續強化你的回憶！",
            "空氣因高度的法力碰撞而發出滋滋聲，別讓黑暗吞噬你的光亮！",
            "守護者的輪廓已經顯現！那股強大的正面能量正在震懾整片湖泊！",
            "黎明就在你的杖尖！釋放最強的護法，讓黑暗徹底煙消雲散！"
        ]
    },
    // Boss 04 (Level 24): 火盃迷宮
    24: {
        descriptions: [
            "隨著一聲悶響，入口的樹籬在你身後緊閉。迷宮內的空氣異常安靜，唯有你的心跳聲。這不是普通的牆壁，它們似乎在隨著你的呼吸微微顫動。",
            "腳下的泥土在震動，巨大的樹籬牆開始無預警地滑動與重組。原本的路瞬間變成死胡同，時間在無聲地流逝，你必須在路徑消失前做出決斷。",
            "迷霧四起，樹籬深處傳來不明怪獸的低語與樹枝折斷聲。體力開始透支，壓力像無形的重擔壓在肩膀上，試圖誤導你的判斷。",
            "穿過一道厚實的屏障，你終於在遠方的盡頭看見了那抹幽藍色的火光。獎盃就在那裡！但迷宮發動了最後的瘋狂，所有的牆壁都在向你合圍。",
            "你站在獎盃平台前，四周的牆壁如潮水般退去。這是最後的綜合測試，只有真正的鬥士能在那道藍光下，穩定地伸出雙手，迎接勝利。"
        ],
        goals: [
            "樹籬已經合攏，前方的道路充滿未知。冷靜下來，找出通往核心的第一條線索！",
            "震耳欲聾的聲音，是牆壁正在重組！別在同一個轉角停留太久，快跟上迷宮變動的節奏！",
            "怪獸的氣息近在咫尺，但別被幻覺迷惑。最正確的路徑，就藏在你的直覺裡！",
            "你看見它了！獎盃就在前方，穿過最後的障礙，衝過去，別分心！",
            "決鬥最後一步！觸碰那座閃爍藍光的獎盃，向世界宣告你的勝利"
        ]
    },
    // Boss 05 (Level 30): 神祕部門
    30: {
        descriptions: [
            "進入神祕部門，四周的門扉開始瘋狂旋轉，重力與方向感瞬間失效。你必須在暈眩感中重新找回邏輯的錨點，否則將永遠迷失在無盡的門扉後方。",
            "進入預言廳，成千上萬顆發光的球體散發著幽光。食死人的低語像毒蛇般鑽進你的耳膜，試圖激發你內心的焦慮與動搖。",
            "你必須在幾秒鐘內掃視數百排預言球。錯誤的資訊會引發劇烈的爆炸，啟動「鎖心術」初階防禦，將干擾雜音降至最低。",
            "穿過一道厚實的屏障，你終於在遠方的盡頭看見了那抹幽藍色的火光。獎盃就在那裡！但迷宮發動了最後的瘋狂，所有的牆壁都在向你合圍。",
            "黑影已將出口重重包圍。你一手握著預言球，一手揮動魔杖。這不是單打獨鬥，而是將過去 所有技巧化為最鋒利的箭矢，衝破那道黑暗的封鎖線"
        ],
        goals: [
            "世界正在旋轉！閉上眼感受魔力的流向，別被變幻莫測的門道帶偏了方向！",
            "那些聲音在試圖誤導你的判斷！封鎖大腦的裂縫，只聽取與真理有關的訊號！",
            "預言球的閃爍頻率太快了！冷靜下來，用你的直覺找出近在眼前的的答案！",
            "真相就在眼前，但空間正在崩塌！在一切毀滅之前，完成最後的邏輯拼圖！",
            "這是最後的突圍戰！別回頭，將你所有的法力灌注在這一刻，衝向光明的出口！"
        ]
    },
    // Boss 06 (Level 36): 終極決賽
    36: {
        descriptions: [
            "城堡的防禦咒語正在劇烈晃動，巨大的火球劃破夜空擊中塔樓。你站在中庭，看著那些由你過去「遺忘的單字」所化成的黑影正不斷逼近。",
            "黑色的煙霧在長廊中凝聚，化作巨大的蛇形或火龍。這些分靈體擁有極強的誤導性，它們會偽裝成相似的邏輯來迷惑你的雙眼。",
            "城堡的燈火逐漸熄滅，四周陷入了最深沉的絕望感。這是最後的大型分靈體在作祟，它試圖讓你想起過去所有的挫敗，讓你的手腕變得沉重。",
            "隨著你不斷的精準施法，最後一個分靈體開始發出慘烈的尖叫並逐漸碎裂。遠方的地平線隱約透出了一絲暖紅色的微光。",
            "太陽終於躍出地平線，溫暖的曙光照亮了整座霍格華茲。所有的黑暗在瞬間消散。你站在廢墟中，手中緊握著那本發光的《全知全能之書》。"
        ],
        goals: [
            "防衛戰已經打響！別被崩塌的瓦礫分心，鎖定那個困擾你已久的知識盲點！",
            "黑魔法的干擾正在增強！保持絕對的冷靜，用最正確的咒語擊碎偽裝的假象！",
            "這是黎明前最黑暗的時刻！別讓恐懼凍結你的思考，你的知識就是最強的防禦！",
            "詛咒正在解除！你看見那道光了嗎？再堅持一下，最後的勝利就在眼前！",
            "黎明已至！釋放你所有的法力，迎接這場史詩冒險的終章。你是真正的傳奇！"
        ]
    }
};

// 預設內容 (若找不到對應關卡)
const DEFAULT_BOSS_CONTENT = BOSS_CONTENT[6];

// 封印印章 SVG 元件
const SealStamp = ({ filled = false, index }) => (
    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${filled
        ? 'shadow-lg scale-110'
        : 'bg-stone-200 border-2 border-dashed border-stone-400'
        }`}>
        {filled ? (
            <div className="relative w-full h-full flex items-center justify-center">
                <img src="/assets/wizard_id/seal.png" alt="Seal" className="w-full h-full object-contain drop-shadow-md" />
            </div>
        ) : (
            <span className="text-stone-400 text-xs font-bold">{index + 1}</span>
        )}
    </div>
);

const BossChallengeModal = ({
    show,
    onClose,
    onStartChallenge,
    level,
    completedStages = 0 // 0-5，表示已完成的階段數
}) => {
    const [isAnimating, setIsAnimating] = useState(false);
    const [showGoalView, setShowGoalView] = useState(false); // 是否顯示階段目標視圖

    // 取得當前關卡的 Boss 內容
    const content = (level && BOSS_CONTENT[level.id]) || DEFAULT_BOSS_CONTENT;

    // 取得當前階段描述
    const currentDescription = completedStages < 5
        ? content.descriptions[completedStages]
        : content.descriptions[4];

    // 取得當前階段目標（基於已完成階段數，下一個要挑戰的是 completedStages + 1）
    const currentGoalIndex = Math.min(completedStages, 4);
    const currentGoal = content.goals[currentGoalIndex];

    // 是否已完全通關
    const isCompleted = completedStages >= 5;

    useEffect(() => {
        if (show) {
            setIsAnimating(true);
            setShowGoalView(false); // 重置為初始畫面
        }
    }, [show]);

    // 點擊「接受試煉」顯示階段目標
    const handleAcceptChallenge = () => {
        setShowGoalView(true);
    };

    // 點擊「踏入禁區走廊」開始真正的測驗
    const handleEnterCorridor = () => {
        setShowGoalView(false);
        onStartChallenge();
    };

    // 返回主畫面
    const handleBackToMain = () => {
        setShowGoalView(false);
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* 背景遮罩 */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            {/* Modal 內容 */}
            <div className={`relative w-full max-w-md transform transition-all duration-500 ${isAnimating ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
                }`}>
                {/* 卷軸主體 */}
                <div className="relative bg-gradient-to-br from-amber-50 via-amber-100 to-amber-50 rounded-xl border-4 border-amber-800 shadow-2xl overflow-hidden">

                    {/* 頂部裝飾條 */}
                    <div className="h-3 bg-amber-900"></div>

                    {/* 關閉按鈕 */}
                    <button
                        onClick={onClose}
                        className="absolute top-5 right-3 p-1.5 rounded-full hover:bg-red-100 text-red-900 transition-colors z-20"
                    >
                        <X size={20} />
                    </button>

                    {/* =========== 主畫面 (警告與進度) =========== */}
                    {!showGoalView && (
                        <div className="p-6 pb-4 animate-fadeIn">
                            {/* 警告標題 */}
                            <div className="flex items-center justify-center gap-2 mb-4">
                                <AlertTriangle className="text-red-600 animate-pulse" size={24} />
                                <h2 className="text-xl font-bold text-red-900 tracking-wide">
                                    ⚠️ 禁區走廊警告 ⚠️
                                </h2>
                                <AlertTriangle className="text-red-600 animate-pulse" size={24} />
                            </div>

                            {/* 故事描述框 */}
                            <div className="bg-stone-800/90 rounded-lg p-4 mb-6 border-2 border-amber-600 shadow-inner">
                                <p className="text-amber-100 text-sm leading-relaxed text-center">
                                    你深夜來到禁區走廊，推開沉重木門，巨犬「<span className="text-red-400 font-bold">毛毛</span>」的三個頭同時發出雷鳴般的咆哮。
                                </p>
                                <p className="text-amber-200 text-sm leading-relaxed text-center mt-3">
                                    唯一通過的方法是讓牠入睡！你必須精確地撥動「<span className="text-yellow-400 font-bold">基礎邏輯</span>」的琴弦，在混亂的節奏中找到完美的平衡，並多次嘗試。
                                </p>
                                <div className="mt-3 pt-3 border-t border-amber-500/30 text-center">
                                    <span className="text-red-400 font-bold text-xs">
                                        ⚡ 必須 5 次以上通關才能馴服巨犬 ⚡
                                    </span>
                                </div>
                            </div>

                            {/* 當前狀態框 */}
                            <div className="bg-gradient-to-br from-red-900/10 to-amber-900/10 rounded-lg p-4 mb-6 border border-amber-700/50">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <Music className="text-amber-700" size={16} />
                                    <span className="text-xs font-bold text-amber-800 uppercase tracking-widest">
                                        現狀描述
                                    </span>
                                    <Music className="text-amber-700" size={16} />
                                </div>
                                <p className={`text-center font-semibold leading-relaxed ${isCompleted ? 'text-green-700' : 'text-slate-800'
                                    }`}>
                                    {currentDescription}
                                </p>

                                {/* 進度指示 */}
                                <div className="mt-3 text-center">
                                    <span className={`text-sm font-bold ${isCompleted ? 'text-green-600' : 'text-red-700'
                                        }`}>
                                        {isCompleted
                                            ? '🎉 挑戰完成！巨犬已被馴服！'
                                            : `挑戰進度：${completedStages} / 5`
                                        }
                                    </span>
                                </div>
                            </div>

                            {/* 印章區域 */}
                            <div className="mb-6">
                                <div className="flex items-center justify-center gap-2 mb-3">
                                    <Skull className="text-red-800" size={14} />
                                    <span className="text-xs font-bold text-red-900 uppercase tracking-wider">
                                        封印印章
                                    </span>
                                    <Skull className="text-red-800" size={14} />
                                </div>
                                <div className="flex justify-center gap-3">
                                    {[0, 1, 2, 3, 4].map((idx) => (
                                        <SealStamp
                                            key={idx}
                                            index={idx}
                                            filled={idx < completedStages}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* 行動按鈕 */}
                            {isCompleted ? (
                                <button
                                    onClick={onClose}
                                    className="w-full py-4 bg-green-700 hover:bg-green-600 text-white font-bold rounded-lg shadow-lg border-2 border-green-500 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <Sparkles size={20} className="animate-spin" />
                                    繼續冒險
                                </button>
                            ) : (
                                <button
                                    onClick={handleAcceptChallenge}
                                    className="w-full py-4 bg-red-800 hover:bg-red-700 text-amber-100 font-bold rounded-lg shadow-lg border-2 border-amber-600 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 group"
                                >
                                    <Sparkles size={20} className="group-hover:animate-spin" />
                                    接受試煉
                                </button>
                            )}

                            {/* 返回按鈕 */}
                            <button
                                onClick={onClose}
                                className="w-full mt-3 py-3 bg-transparent hover:bg-amber-900/10 text-amber-900 font-bold rounded-lg border border-amber-900/30 transition-all"
                            >
                                暫時離開
                            </button>
                        </div>
                    )}

                    {/* =========== 階段目標視圖 =========== */}
                    {showGoalView && (
                        <div className="p-6 pb-4 animate-fadeIn">
                            {/* 標題 */}
                            <div className="flex items-center justify-center gap-2 mb-6">
                                <Target className="text-amber-700" size={24} />
                                <h2 className="text-xl font-bold text-red-900 tracking-wide">
                                    第 {completedStages + 1} 階段試煉
                                </h2>
                                <Target className="text-amber-700" size={24} />
                            </div>

                            {/* 階段目標框 */}
                            <div className="bg-gradient-to-br from-stone-800 to-stone-900 rounded-lg p-6 mb-6 border-2 border-amber-600 shadow-xl">
                                <div className="flex items-center justify-center gap-2 mb-4">
                                    <Sparkles className="text-amber-400" size={16} />
                                    <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                                        階段目標
                                    </span>
                                    <Sparkles className="text-amber-400" size={16} />
                                </div>
                                <p className="text-amber-100 text-center font-semibold leading-relaxed text-lg">
                                    {currentGoal}
                                </p>
                            </div>

                            {/* 進度提示 */}
                            <div className="text-center mb-6">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-900/20 rounded-full border border-red-700/30">
                                    <span className="text-sm text-slate-700">
                                        完成後將獲得第 <span className="font-bold text-red-700">{completedStages + 1}</span> 個封印印章
                                    </span>
                                </div>
                            </div>

                            {/* 開始測驗按鈕 */}
                            <button
                                onClick={handleEnterCorridor}
                                className="w-full py-4 bg-red-800 hover:bg-red-700 text-amber-100 font-bold rounded-lg shadow-lg border-2 border-amber-600 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 group"
                            >
                                踏入禁區走廊
                                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </button>

                            {/* 返回按鈕 */}
                            <button
                                onClick={handleBackToMain}
                                className="w-full mt-3 py-3 bg-transparent hover:bg-amber-900/10 text-amber-900 font-bold rounded-lg border border-amber-900/30 transition-all"
                            >
                                返回
                            </button>
                        </div>
                    )}

                    {/* 底部裝飾條 */}
                    <div className="h-3 bg-amber-900"></div>
                </div>

                {/* 卷軸端點裝飾 */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-24 h-5 bg-amber-900 rounded-full shadow-lg"></div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-5 bg-amber-900 rounded-full shadow-lg"></div>
            </div>
        </div>
    );
};

export default BossChallengeModal;
