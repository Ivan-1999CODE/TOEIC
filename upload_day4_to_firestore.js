const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

let credential;
if (fs.existsSync(serviceAccountPath)) {
    console.log('Found serviceAccountKey.json, using it for authentication.');
    credential = admin.credential.cert(require(serviceAccountPath));
} else {
    console.log('No serviceAccountKey.json found, trying application default credentials...');
    credential = admin.credential.applicationDefault();
}

try {
    admin.initializeApp({
        credential: credential,
        projectId: 'toeic-vocabulary-app'
    });
} catch (error) {
    // Ignore error if already initialized
    if (error.code !== 'app/already-exists') {
        console.error('Error initializing:', error);
        process.exit(1);
    }
}

const db = admin.firestore();
const dataFile = path.join(__dirname, 'vocab_day4.json');
const collectionName = 'toeic_words';

async function uploadData() {
    try {
        const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
        console.log(`Read ${data.length} items from ${dataFile}`);

        const batch = db.batch();
        let count = 0;

        for (const item of data) {
            if (!item.word) {
                console.warn('Skipping item without word:', item);
                continue;
            }

            // Constructed ID: day4_word
            const docId = `day4_${item.word}`;
            const docRef = db.collection(collectionName).doc(docId);

            batch.set(docRef, item);
            count++;
        }

        await batch.commit();
        console.log(`Successfully uploaded ${count} items to '${collectionName}' collection.`);
    } catch (error) {
        console.error('Error uploading data:', error);
    }
}

uploadData();
