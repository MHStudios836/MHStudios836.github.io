const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// Import the Lobes
const sentinel = require('./nervous_system/sentinel');
const overseer = require('./nervous_system/overseer');

// --- EXPORTED FUNCTIONS (The Nerves) ---

// 1. SECURITY: Watch Chat Messages
exports.monitorChat = functions.firestore
    .document('chats/{chatId}/messages/{messageId}')
    .onCreate((snap, context) => {
        return sentinel.interceptFaultyChat(snap, context, db);
    });

// 2. LOGIC: Watch User Stats for Promotions
exports.monitorStats = functions.firestore
    .document('users/{userId}')
    .onUpdate((change, context) => {
        return overseer.checkPromotion(change, context, db);
    });

// 3. PASSIVE: Daily Admin Report (Runs every night at midnight)
exports.dailyReport = functions.pubsub.schedule('every 24 hours').onRun((context) => {
    console.log("Generating Daily Intelligence Report...");
    // Logic to summarize data goes here
    return null;
});

/* functions/index.js */
const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// IMPORT NERVOUS SYSTEM MODULES
const sentinel = require('./nervous_system/sentinel');
const overseer = require('./nervous_system/overseer');
const banker = require('./nervous_system/banker'); // <--- NEW MODULE

// --- 1. SECURITY (Sentinel) ---
exports.monitorChat = functions.firestore
    .document('chats/{chatId}/messages/{messageId}')
    .onCreate((snap, context) => sentinel.interceptFaultyChat(snap, context, db));

// --- 2. RANK LOGIC (Overseer) ---
exports.monitorStats = functions.firestore
    .document('users/{userId}')
    .onUpdate((change, context) => overseer.checkPromotion(change, context, db));

// --- 3. ECONOMY (The Banker) ---
// Triggers whenever a mission is created in any artifact
exports.auditMission = functions.firestore
    .document('artifacts/{dbId}/missions/{missionId}')
    .onCreate((snap, context) => banker.validateMissionFunds(snap, context, db));