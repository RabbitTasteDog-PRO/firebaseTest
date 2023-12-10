const admin = require('firebase-admin');
const functions = require('firebase-functions');

admin.initializeApp();

exports.sayHello = functions.https.onRequest((request, response) => {
  console.log("hello");
  response.send("Hello!"); // 웹 요청에 응답
});

//// 게임의 총 플레이횟수 저장함
exports.recordPlayerPlayCount = functions.https.onRequest(async (req, res) => {
    try {
        const firestore = admin.firestore();
        const playerRef = firestore.collection('PlayerPlayCounts').doc('gamePlayCount'); // 특정 게임의 플레이 횟수를 기록하는 문서를 사용합니다.

        // 플레이어의 플레이 횟수를 1씩 증가시킵니다.
        await playerRef.set({
            playCount: admin.firestore.FieldValue.increment(1)
        }, { merge: true });

        res.status(200).send({ "status": "ok" });
    } catch (error) {
        console.error("Error recording player's play count: ", error);
        res.status(500).send("Error recording player's play count: " + error.message);
    }
});

//// 게임의 총 플레이횟수 가져옴
exports.getGamePlayCount = functions.https.onRequest(async (req, res) => {
    try {
        const firestore = admin.firestore();
        const playerRef = firestore.collection('PlayerPlayCounts').doc('gamePlayCount'); // 특정 게임의 플레이 횟수를 기록하는 문서를 사용합니다.

        // 해당 게임의 플레이 횟수를 Firestore에서 가져옵니다.
        const doc = await playerRef.get();
        if (!doc.exists) {
            res.status(404).send("Game play count not found.");
            return;
        }

        const playCount = doc.data().playCount || 0; // 게임의 플레이 횟수를 가져옵니다.

        res.status(200).send({ "playCount": playCount });
    } catch (error) {
        console.error("Error getting game play count: ", error);
        res.status(500).send("Error getting game play count: " + error.message);
    }
});


/// 특정 아이템의 개수 저장
exports.recodItemQuantity = functions.https.onRequest(async (req, res) => {
    try {
        const itemId = req.body.itemId; // HTTP 요청의 body에서 아이템 ID를 받아옵니다.
        const amount = req.body.amount; // HTTP 요청의 body에서 변경할 양을 받아옵니다.

        if (!itemId || amount === undefined) {
            res.status(400).send("Item ID and amount are required.");
            return;
        }

        const firestore = admin.firestore();
        const itemRef = firestore.collection('ItemQuantities').doc(itemId);

        // 아이템의 수량을 변경합니다.
        await itemRef.set({
            quantity: admin.firestore.FieldValue.increment(amount)
        }, { merge: true });

        res.status(200).send({ "status": "ok" });
    } catch (error) {
        console.error("Error updating item quantity: ", error);
        res.status(500).send("Error updating item quantity: " + error.message);
    }
});

/// 특정 아이템의 개수 가져옴
exports.getItemQuantity = functions.https.onRequest(async (req, res) => {
    try {
        const itemId = req.query.itemId; // HTTP 요청의 쿼리 파라미터에서 아이템 ID를 받아옵니다.

        if (!itemId) {
            res.status(400).send("Item ID is required.");
            return;
        }

        const firestore = admin.firestore();
        const itemRef = firestore.collection('ItemQuantities').doc(itemId);

        // 해당 아이템의 개수를 Firestore에서 가져옵니다.
        const doc = await itemRef.get();
        if (!doc.exists) {
            res.status(404).send("Item quantity not found.");
            return;
        }

        const quantity = doc.data().quantity || 0; // 아이템의 개수를 가져옵니다.

        res.status(200).send({ "itemId": itemId, "quantity": quantity });
    } catch (error) {
        console.error("Error getting item quantity: ", error);
        res.status(500).send("Error getting item quantity: " + error.message);
    }
});


//// 초기화
exports.resetGameStats = functions.pubsub.schedule('0 0 * * *') // 매일 자정에 실행
    .timeZone('UTC') // UTC 시간대로 설정
    .onRun(async (context) => {
        try {
            const firestore = admin.firestore();

            // 게임 플레이 횟수 초기화
            const gamePlayCountRef = firestore.collection('PlayerPlayCounts').doc('gamePlayCount');
            await gamePlayCountRef.set({ playCount: 0 });

            // 아이템 개수 초기화
            const itemQuantitiesRef = firestore.collection('ItemQuantities');
            const itemsSnapshot = await itemQuantitiesRef.get();
            const batch = firestore.batch();
            itemsSnapshot.forEach((doc) => {
                batch.update(doc.ref, { quantity: 0 });
            });
            await batch.commit();

            console.log("Game stats reset successfully.");
            return null;
        } catch (error) {
            console.error("Error resetting game stats: ", error);
            throw new functions.https.HttpsError("internal", "Error resetting game stats: " + error.message);
        }
    });




