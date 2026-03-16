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
    console.error('Error initializing Firebase Admin:', error);
    process.exit(1);
}

const db = admin.firestore();
const collectionName = 'toeic_words';
const targetDay = 5;

async function deleteDayData() {
    try {
        console.log(`Querying for documents with day = ${targetDay} in '${collectionName}'...`);
        const snapshot = await db.collection(collectionName).where('day', '==', targetDay).get();

        if (snapshot.empty) {
            console.log('No matching documents found.');
            return;
        }

        console.log(`Found ${snapshot.size} documents to delete.`);

        const batch = db.batch();
        let count = 0;
        const batchSize = 500;

        snapshot.forEach(doc => {
            batch.delete(doc.ref);
            count++;
        });

        await batch.commit();
        console.log(`Successfully deleted ${count} documents from '${collectionName}' where day is ${targetDay}.`);

    } catch (error) {
        console.error('Error deleting data:', error);
    }
}

deleteDayData();
