const functions = require("firebase-functions");

const app = require("express")();

const FBAuth = require("./util/fbAuth");

const cors = require("cors");
app.use(cors({ origin: true }));

const { db } = require("./util/admin");

const {
	getAllDestinations,
	postOneDestination,
	getDestination,
	commentOnDestination,
	deleteDestination
} = require("./handlers/destinations");
const { signup, login, getAuthenticatedUser } = require("./handlers/users");

//Destinations routes
app.get("/destinations", getAllDestinations);
app.post("/destination", FBAuth, postOneDestination);
app.get("/destination/:destinationId", getDestination);
app.delete("/destination/:destinationId", FBAuth, deleteDestination);
app.post("/destination/:destinationId/review", FBAuth, commentOnDestination);

//Users routes
app.post("/signup", signup);
app.post("/login", login);
app.get("/user", FBAuth, getAuthenticatedUser);

//Make the api accessible
exports.api = functions.region("europe-west1").https.onRequest(app);

//Remove everything related to a post on delete
exports.onDestinationDelete = functions
	.region("europe-west1")
	.firestore.document("/destinations/{destinationId}")
	.onDelete((snapshot, context) => {
		const destinationId = context.params.destinationId;
		const batch = db.batch();
		return db
			.collection("reviews")
			.where("destinationId", "==", destinationId)
			.get()
			.then(data => {
				data.forEach(doc => {
					batch.delete(db.doc(`/reviews/${doc.id}`));
				});
				return db
					.collection("likes")
					.where("destinationId", "==", destinationId)
					.get();
			})
			.then(data => {
				data.forEach(doc => {
					batch.delete(db.doc(`/likes/${doc.id}`));
				});
				return db
					.collection("notifications")
					.where("destinationId", "==", destinationId)
					.get();
			})
			.then(data => {
				data.forEach(doc => {
					batch.delete(db.doc(`/notifications/${doc.id}`));
				});
				return batch.commit();
			})
			.catch(err => console.error(err));
	});
