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
        projectId: 'toeic-vocabulary-app' // Verify this project ID or get from environment
    });
} catch (error) {
    if (error.code === 'app/already-exists') {
        // Already initialized, ignore
    } else {
        console.error('Error initializing Firebase Admin:', error);
        process.exit(1);
    }
}

const db = admin.firestore();
const dataFile = path.join(__dirname, 'vocab_day11.json');
const collectionName = 'toeic_words';

async function uploadData() {
    try {
        if (!fs.existsSync(dataFile)) {
            console.error(`File not found: ${dataFile}`);
            return;
        }

        const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
        console.log(`Read ${data.length} items from ${dataFile}`);

        const batch = db.batch();
        let count = 0;
        const batchSize = 500;

        for (const item of data) {
            if (!item.word) {
                console.warn('Skipping item without word:', item);
                continue;
            }

            // Document ID is already set in item.id by conversion script
            const docRef = db.collection(collectionName).doc(item.id);

            // Remove 'id' from the document data itself if desired, or keep it.
            // Usually keeping it is fine.
            batch.set(docRef, item);
            count++;

            if (count % batchSize === 0) {
                await batch.commit();
                console.log(`Committed batch of ${batchSize} items...`);
                batch = db.batch();
            }
        }

        if (count % batchSize !== 0) {
            await batch.commit();
            console.log(`Committed final batch.`);
        }

        console.log(`Successfully uploaded ${count} items to '${collectionName}' collection.`);
    } catch (error) {
        console.error('Error uploading data:', error);
    }
}

uploadData();
