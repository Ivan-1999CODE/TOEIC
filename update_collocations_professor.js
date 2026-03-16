const admin = require('firebase-admin');
const path = require('path');

const COLLECTION_NAME = 'collocations';
const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'serviceAccountKey.json');

// 6 位教授分配
const PROFESSORS = [
    { range: [1, 20], chapterId: 'endgame_01', professor: 'Professor Flitwick' },
    { range: [21, 40], chapterId: 'endgame_02', professor: 'Professor Sprout' },
    { range: [41, 60], chapterId: 'endgame_03', professor: 'Professor Lupin' },
    { range: [61, 80], chapterId: 'endgame_04', professor: 'Professor McGonagall' },
    { range: [81, 100], chapterId: 'endgame_05', professor: 'Professor Snape' },
    { range: [101, 120], chapterId: 'endgame_06', professor: 'Albus Dumbledore' },
];

function getAssignment(spellNumber) {
    for (const prof of PROFESSORS) {
        if (spellNumber >= prof.range[0] && spellNumber <= prof.range[1]) {
            return { chapterId: prof.chapterId, professor: prof.professor };
        }
    }
    return null;
}

async function main() {
    const serviceAccount = require(SERVICE_ACCOUNT_PATH);
    try {
        admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    } catch (error) {
        if (error.code !== 'app/already-exists') { console.error(error); process.exit(1); }
    }

    const db = admin.firestore();
    console.log('=== 開始更新 collocations: chapterId + professor ===\n');

    const batch = db.batch();
    let count = 0;

    for (let i = 1; i <= 120; i++) {
        const docId = `spell_${String(i).padStart(3, '0')}`;
        const assignment = getAssignment(i);
        const docRef = db.collection(COLLECTION_NAME).doc(docId);
        batch.update(docRef, { chapterId: assignment.chapterId, professor: assignment.professor });
        count++;
        console.log(`  ${docId} => ${assignment.chapterId} / ${assignment.professor}`);
    }

    console.log(`\n正在提交 ${count} 筆更新...`);
    await batch.commit();
    console.log('✅ 全部更新完成！\n');

    // 驗證
    console.log('=== 驗證結果 ===');
    for (const prof of PROFESSORS) {
        const snapshot = await db.collection(COLLECTION_NAME)
            .where('chapterId', '==', prof.chapterId)
            .get();
        console.log(`${prof.chapterId} (${prof.professor}): ${snapshot.size} 筆`);
    }
}

main().catch(console.error);
