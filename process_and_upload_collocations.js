const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// --- Configuration ---
const COLLECTION_NAME = 'collocations';
const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'serviceAccountKey.json');

// --- Raw Data ---
const rawData = `001,across the board,全盤的，全面的
002,around the corner,近在眼前的，在附近的
003,as we speak,就是現在，就在我們該談話的時候
004,at any rate,無論如何
005,back out,(從原本想做的事中) 退出
006,be better off,不如...，做...會更好
007,be jammed with,被...擠滿的，被...塞住的
008,be on one's way,在某人前往的道路上
009,be on track,在朝向目標的軌道上
010,be open to,向...開放的，歡迎、接受...的
011,be set to do,被預定做...
012,be up for,欣然打算做...
013,better (to be) safe than sorry,與其有不好的結果，倒不如小心行事
014,big on,非常喜歡...，對...很狂熱
015,big-name,一流的，著名的
016,blow A away,給 A 留下深刻的印象
017,bottom line,核心要件；最終結果
018,break ground,開始，動工
019,build up,建立，累積，逐漸增加
020,by all means,(表示許可的) 當然可以；務必
021,call a meeting,召開會議
022,catch up,趕上 (進度、水準等)
023,come along,發展，進行
024,come around,讓步，改變立場
025,count A in,(在某個活動中) 納入 A、把 A 算進去
026,cover for,代替做...的事
027,curve ball,料想不到的事；騙局
028,cut into,切入...；侵入 (市場)
029,cut it close,在 (時間、預算等) 極限下做某事
030,cut to the chase,直接切入重點，開門見山
031,do not make sense,不合常理，沒有道理
032,fall behind,無法配合，跟不上 (期限、目標等)
033,fall within (= fall under),屬於...的範圍
034,for sometime,暫時，一段時間
035,gain a foothold in,在...之上獲得立足點
036,get back to,接著做...；給...回電
037,get in the way of,妨礙...，介入...
038,get in touch with,與...取得聯絡
039,get into,對...感興趣，加入，參與...
040,get underway,開始，進行
041,get word,接到通知，聽到消息
042,give A a go,做一次 A 試試
043,give A a hand,幫 A 一個忙
044,give A a round of applause,給 A 一陣掌聲
045,go ahead,開始，進行
046,go out of one's way,特別費心，努力
047,go over,檢討，檢查
048,hang in,堅持住，挺住
049,have a lot on one's plate,某人有很多需要做的事
050,have a point,有道理
051,have a taste of,嚐嚐看...，試試看...，體驗...
052,heads up,預先告知，預先警告
053,here we go,我們開始吧；開始了
054,hit the road,出發 (旅行等)
055,hit the store,發售
056,hold off on,將...延期，推遲
057,in a bind,為難的，處於困境的
058,in a rush,匆匆忙忙
059,in due time,不久後，到時候
060,in no time,立刻，馬上
061,in shape,健康的
062,in talks with,協議中的
063,in the long run,終究，從長遠來看
064,in the works,正在進行的，正在討論的
065,iron out,解決 (問題)；消除 (分歧)
066,it can't be helped,沒有辦法；別無選擇
067,jot down,匆匆記下
068,jump the gun,輕率地行動，冒進
069,keep A in the loop,繼續告訴 A 圈內消息，使 A 介入決策圈
070,keep A posted,持續告知 A 最新消息
071,keep up with,跟上...，不落後於...
072,live with,承受...，忍耐...
073,lose one's spot,錯失某人的順位，失去某人的位置
074,make good money,賺很多錢
075,make it,趕得上；成功
076,mark A down,把 A 記下來；降低 A 的價格
077,miss out on,錯過...，錯失...
078,new face,新人，新面孔
079,not for the world,無論如何都不...
080,of late,最近，近來
081,off the top of one's head,憑既有的知識；不假思索地
082,on a walk-in basis,不用事先預約地
083,on the alert,警戒
084,one's hands are tied,無法幫忙地，受到限制地
085,out of the question,不可能的，討論也沒有用的
086,point taken,知道了 (聽了並接受對方的話)
087,pose a problem,引起問題
088,put A out,使 A 心情不高興
089,put on hold,暫停，保留
090,put together,組裝，組合，拼湊
091,receive word from,從...那裡聽到消息
092,ring up,(在收銀機) 輸入商品價格，結帳
093,run into,邂逅...，偶然遇見...
094,run long,長期，長遠
095,say the word,下命令，要求
096,send A off,把 A 送走，將 A 寄出
097,sort out,整理...，處理...，歸類...
098,stand out,醒目，顯眼，突出
099,stay on the line,在線上稍等不要掛斷電話
100,take note of,注意
101,take on,承擔...
102,take one's chances,碰運氣，準備冒險
103,take one's time,慢慢來，不著急
104,take one's word,相信某人的話
105,take up,佔用 (時間、場所等)
106,team up with,與...協力；與...相配
107,tell me about it,(表示附和贊同時) 可不是嗎
108,throw a party,開派對
109,toss-up,勝負各半的機會
110,tune in,調整頻道收聽或收看某節目
111,turn out,結果成為，最終發現
112,up and running,運轉中的，運行中的
113,up in the air,懸而未決的，不確定的
114,up-and-coming,引人矚目的，有前途的
115,wave down,(向司機、車等) 招手停車
116,without further ado,不再遲延地，乾脆地
117,word of mouth,口耳相傳，口碑
118,work against the clock,爭分奪秒的工作 (以準時完成)
119,work around,避開...來做
120,work out,(事情) 解決`;

// --- Utility Functions ---

// Fisher-Yates Shuffle
function shuffle(array) {
    let currentIndex = array.length, randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex != 0) {

        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }

    return array;
}

// Generate Rarity Distribution
function generateRarityPool() {
    const distribution = {
        'Common': 60,
        'Rare': 40,
        'Legendary': 20
    };

    let pool = [];
    for (const [rarity, count] of Object.entries(distribution)) {
        for (let i = 0; i < count; i++) {
            pool.push(rarity);
        }
    }

    // Verify total
    if (pool.length !== 120) {
        throw new Error(`Rarity pool size mismatch! Expected 120, got ${pool.length}`);
    }

    return shuffle(pool);
}

// Parse Raw Data
function parseData() {
    const lines = rawData.trim().split('\n');
    const parsed = [];

    const rarityPool = generateRarityPool();
    console.log('Rarity pool generated and shuffled.');

    // Check distribution in shuffled pool just to be safe
    const checkDist = { 'Common': 0, 'Rare': 0, 'Legendary': 0 };
    rarityPool.forEach(r => checkDist[r]++);
    console.log('Rarity Distribution Verification:', checkDist);

    lines.forEach((line, index) => {
        // Simple CSV parse: id, phrase, meaning
        // Note: The data sometimes has commas in the meaning, but the format seems to be:
        // ID, Phrase, Meaning
        // We should be careful. The format provided says:
        // 001,across the board,全盤的，全面的
        // The first comma separates ID. The second separates phrase. The rest is meaning.

        const firstCommaIndex = line.indexOf(',');
        const secondCommaIndex = line.indexOf(',', firstCommaIndex + 1);

        if (firstCommaIndex === -1 || secondCommaIndex === -1) {
            console.warn(`Skipping malformed line: ${line}`);
            return;
        }

        const idStr = line.substring(0, firstCommaIndex).trim();
        const phrase = line.substring(firstCommaIndex + 1, secondCommaIndex).trim();
        const meaning = line.substring(secondCommaIndex + 1).trim();
        const id = parseInt(idStr, 10);

        const rarity = rarityPool[index];

        parsed.push({
            id: id,
            phrase: phrase,
            meaning: meaning,
            rarity: rarity,
            isUnlocked: false
        });
    });

    return parsed;
}

// --- Main Execution ---

async function main() {
    // 1. Initialize Firebase
    let credential;
    if (fs.existsSync(SERVICE_ACCOUNT_PATH)) {
        console.log('Found serviceAccountKey.json');
        credential = admin.credential.cert(require(SERVICE_ACCOUNT_PATH));
    } else {
        console.log('No serviceAccountKey.json found, trying application default credentials...');
        credential = admin.credential.applicationDefault();
    }

    try {
        admin.initializeApp({
            credential: credential,
            projectId: 'toeic-vocabulary-app' // Using project ID from package.json or previous context if known
        });
    } catch (error) {
        if (error.code !== 'app/already-exists') {
            console.error('Firebase Init Error:', error);
            process.exit(1);
        }
    }

    const db = admin.firestore();

    // 2. Prepare Data
    console.log('Parsing and processing data...');
    const collocations = parseData();

    if (collocations.length !== 120) {
        console.error(`Error: Expected 120 items, but parsed ${collocations.length}. Aborting.`);
        process.exit(1);
    }

    // 3. Upload Data
    console.log(`Starting upload of ${collocations.length} items to '${COLLECTION_NAME}'...`);

    const batchSize = 400; // Safe batch size
    let batch = db.batch();
    let count = 0;

    for (const item of collocations) {
        // Document ID: spell_001, spell_002, ...
        const docId = `spell_${String(item.id).padStart(3, '0')}`;
        const docRef = db.collection(COLLECTION_NAME).doc(docId);

        batch.set(docRef, item);
        count++;

        if (count % batchSize === 0) {
            await batch.commit();
            console.log(`Committed batch of ${batchSize} (Total: ${count})`);
            batch = db.batch();
        }
    }

    if (count % batchSize !== 0) {
        await batch.commit();
        console.log(`Committed final batch (Total: ${count})`);
    }

    console.log('Upload complete!');

    // 4. Verification Read
    console.log('Verifying a few documents...');
    const snapshot = await db.collection(COLLECTION_NAME).limit(3).get();
    snapshot.forEach(doc => {
        console.log(doc.id, '=>', doc.data());
    });
}

main().catch(console.error);
