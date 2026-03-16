// 關卡資料結構
export const booksData = [
    {
        title: "第一章：學徒的覺醒 (Chapter 1: The Awakening)",
        levels: [
            { id: 1, week: "Day 01", title: "Class 01_貓頭鷹的入學信", desc: "收到錄取通知，踏入魔法世界。" },
            { id: 2, week: "Day 02", title: "Class 02_斜角巷的魔杖店", desc: "挑選專屬魔杖，準備學習工具。" },
            { id: 3, week: "Day 03", title: "Class 03_分類帽的抉擇", desc: "分析自我特質，決定學院歸屬。" },
            { id: 4, week: "Day 04", title: "Class 04_飄浮咒：溫咖癲啦唯啊薩", desc: "第一次成功施法，掌握基礎邏輯。" },
            { id: 5, week: "Day 05", title: "Class 05_時光逆流的懷錶", desc: "學習精確的操作時間的方式。" },
            {
                id: 6,
                week: "Boss 01",
                title: "Boss 01_三頭犬的活板門",
                desc: "守護霍格華茲：真理之門：深夜禁區走廊，巨犬毛毛守護的秘密。",
                isBoss: true,
                bossChallenge: "你深夜來到禁區走廊，推開沉重木門，巨犬「毛毛」的三個頭同時發出雷鳴般的咆哮。",
                bossVictory: "當最後一個音符精準落下，巨犬的鼾聲如雷。你毫不猶豫地跳入開啟的活板門，在一陣失重感後，你穩穩落在柔軟的魔鬼網上。恭喜你！你已經正式告別了「麻瓜」的思維，成功墜入魔法的核心世界。"
            }
        ]
    },
    {
        title: "第二章：見習法師的征途 (Chapter 2: The Journeyman's Quest)",
        levels: [
            { id: 7, week: "Day 06", title: "Class 06_曼德拉草的尖叫", desc: "藥草學實作，處理棘手的問題。" },
            { id: 8, week: "Day 07", title: "Class 07_決鬥社：去去武器走", desc: "學習攻防應對，反應力訓練。" },
            { id: 9, week: "Day 08", title: "Class 08_魁地奇：搜捕手的特訓", desc: "專注力訓練，在混亂中抓取重點。" },
            { id: 10, week: "Day 09", title: "Class 09_多變身藥水的熬製", desc: "長時間的準備與耐心，改變視角。" },
            { id: 11, week: "Day 10", title: "Class 10_密室的蛇語暗號", desc: "解開隱藏的謎題與邏輯。" },
            {
                id: 12,
                week: "Boss 02",
                title: "Boss 02_密室決戰：蛇妖的致命凝視",
                desc: "守護霍格華茲：真理之門：別直視牠的眼睛！",
                isBoss: true,
                bossChallenge: "潮濕的牆面上映著你蒼白的臉龐，蛇妖的嘶吼在管道中迴盪。別直視牠的眼睛！",
                bossVictory: "劍光一閃（或是咒語擊中），巨大的蛇身轟然倒地，毒牙碎裂。你抹去臉上的水漬，從蛇腹下取出了被守護的真相。那一刻，你不再是膽怯的新生，你證明了自己擁有面對恐懼、擊碎混亂的強大韌性！"
            }
        ]
    },
    {
        title: "第三章：高階巫師的昇華 (Chapter 3: The High Wizard's Ascendance)",
        levels: [
            { id: 13, week: "Day 11", title: "Class 11_賢者之石的煉成", desc: "適應快速變化的環境與節奏。" },
            { id: 14, week: "Day 12", title: "Class 12_幻形怪：叱叱，荒唐", desc: "克服學習上的恐懼與弱點。" },
            { id: 15, week: "Day 13", title: "Class 13_護法咒：快樂的回憶", desc: "高階防禦魔法，保持正向心態。" },
            { id: 16, week: "Day 14", title: "Class 14_時光器的迴旋", desc: "複習與補強，修正過去的錯誤。" },
            { id: 17, week: "Day 15", title: "Class 15_劫盜地圖的密道", desc: "發現解題的捷徑與全貌。" },
            {
                id: 18,
                week: "Boss 03",
                title: "Boss 03_正義集結：呼神護衛的驅魔戰",
                desc: "守護霍格華茲：真理之門：守護你的內心，驅散吸魂怪。",
                isBoss: true,
                bossChallenge: "湖畔氣溫驟降，成群的吸魂衣如烏雲般壓頂，企圖吸走你所有的快樂。空氣結霜，思緒開始凍結。",
                bossVictory: "「呼神護衛！」隨著一聲怒吼，銀色的壯麗光芒從你的杖尖噴湧而出，將黑暗撕開一道巨大的裂縫。寒冷退去，溫暖的陽光重新灑在湖面。你成功守護了自己的內心，這代表你已經具備了駕馭高階魔法的靈魂強度。"
            }
        ]
    },
    {
        title: "第四章：鬥士選拔的考驗 (Chapter 4: The Champion's Selection)",
        levels: [
            { id: 19, week: "Day 16", title: "Class 16_火盃的考驗：報名", desc: "決定接受更高難度的挑戰。" },
            { id: 20, week: "Day 17", title: "Class 17_第一試煉：鬥龍競技場", desc: "面對強大的單一主題難題。" },
            { id: 21, week: "Day 18", title: "Class 18_隱藏的金蛋", desc: "在放鬆中尋找線索，聽音辨位。" },
            { id: 22, week: "Day 19", title: "Class 19_第二試煉：魔法部的特別實習", desc: "限時壓力下的解題挑戰。" },
            { id: 23, week: "Day 20", title: "Class 20_第三試煉：迷宮與獎盃", desc: "綜合能力的最終測試，只有一個冠軍。" },
            {
                id: 24,
                week: "Boss 04",
                title: "Boss 04_火盃之巔：迷宮盡頭的獎盃",
                desc: "守護霍格華茲：真理之門：迷宮樹籬合攏，與時間的殘酷賽跑。",
                isBoss: true,
                bossChallenge: "迷宮的樹籬在你身後合攏。這是與時間的殘酷賽跑，牆壁在移動，怪獸在低語。",
                bossVictory: "就在迷宮合攏的前一秒，你的手緊緊握住了冰冷的獎盃。一陣強大的拉力將你瞬間傳送回競技場中央。萬人歡呼雷動，你是唯一的贏家。這座獎盃證明了你的全能，你在極端壓力下的冷靜，讓你成為了名副其實的鬥士。"
            }
        ]
    },
    {
        title: "第五章：鳳凰會的崛起 (Chapter 5: The Order's Rebellion)",
        levels: [
            { id: 25, week: "Day 21", title: "Class 21_萬應室：鄧不利多的軍隊", desc: "自主學習與同儕互助的集會。" },
            { id: 26, week: "Day 22", title: "Class 22_鎖心術：大腦防禦", desc: "強化邏輯防禦，不被題目誤導。" },
            { id: 27, week: "Day 23", title: "Class 23_神祕部門的預言球", desc: "探索未知的領域與高深理論。" },
            { id: 28, week: "Day 24", title: "Class 24_真理之門的鑰匙", desc: "掌握空間跳躍，快速解題技巧。" },
            { id: 29, week: "Day 25", title: "Class 25_鳳凰的眼淚", desc: "療癒與重生，從失敗中恢復。" },
            {
                id: 30,
                week: "Boss 05",
                title: "Boss 05_預言之役：神祕部門的生死鬥",
                desc: "守護霍格華茲：真理之門：預言球破碎的真理之戰。",
                isBoss: true,
                bossChallenge: "旋轉的石室、無窮無盡的預言球。食死人的低語在耳邊盤旋，試圖干擾你的判斷。",
                bossVictory: "預言球在身後連環破碎，發出清脆的爆裂聲，但你已帶領同伴衝出重圍，將真理握在手心。黑暗的力量在你面前潰散。你展現了無與倫比的洞察力與邏輯防禦，現在，你已經擁有了看穿一切迷霧的魔法視野。"
            }
        ]
    },
    {
        title: "第六章：終極法師的傳奇 (Chapter 6: The Ultimate Legacy)",
        levels: [
            { id: 31, week: "Day 26", title: "Class 26_世界樹的根源", desc: "完美的狀態，考試順利的祝福。" },
            { id: 32, week: "Day 27", title: "Class 27_分靈體的搜尋", desc: "尋找分散的知識碎片並擊破。" },
            { id: 33, week: "Day 28", title: "Class 28_霍格華茲的防衛戰", desc: "最終的總複習大戰，全力以赴。" },
            { id: 34, week: "Day 29", title: "Class 29_混血王子的身世", desc: "考後的反思與沉澱，理解真理。" },
            { id: 35, week: "Day 30", title: "Class 30_全知全能之書", desc: "結束學業，邁向新的旅程。" },
            {
                id: 36,
                week: "Boss 06",
                title: "Boss 06_終極決賽：霍格華茲的黎明曙光",
                desc: "守護霍格華茲：真理之門：最後的保衛戰，全能力的總攻擊。",
                isBoss: true,
                bossChallenge: "城堡的城牆正在崩塌，這是最後的保衛戰。你要面對的是那些潛伏在暗處的「分靈體」。這是一場全能力的總攻擊，只有徹底擊破它們，才能迎來永恆的勝利。",
                bossVictory: "當最後一個分靈體在你的咒語下灰飛煙滅，黑色的煙霧散去，黎明的第一道曙光灑在霍格華茲的斷垣殘壁上，一切煥然一新。你翻開了《全知全能之書》，你的名字被金色的文字鐫刻其上。戰鬥結束了，你不再是追隨者，你已成為傳奇。"
            }
        ]
    }
];

// 計算 Level ID 對應的 Day
// 每 6 個關卡為一個章節，最後一個是 Boss 關
// 1-5 -> Day 1-5
// 7-11 -> Day 6-10
// ...
export const getDayFromLevel = (levelId) => {
    // 扣除掉前面的 Boss 關卡數量 (每 6 改為 1 個 Boss)
    // Chapters before this level: Math.floor((levelId - 1) / 6)
    return levelId - Math.floor((levelId - 1) / 6);
};
