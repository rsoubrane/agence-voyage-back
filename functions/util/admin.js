var admin = require("firebase-admin");

var serviceAccount = require("./adminSDK.json");

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL: "https://react-agence-de-voyage.firebaseio.com"
});

const db = admin.firestore();

module.exports = { admin, db };
