const { db } = require("../util/admin");

//Function to get all the destinations
exports.getAllDestinations = (req, res) => {
	db.collection("destinations")
		.orderBy("createdAt", "desc")
		.get()
		.then(data => {
			let destinations = [];
			data.forEach(doc => {
				destinations.push({
					hotelId: doc.id,
					hotelHandle: doc.data().hotelHandle,
					country: doc.data().country,
					type: doc.data().type,
					price: doc.data().price,
					summary: doc.data().summary,
					description: doc.data().description,
					note: doc.data().note,
					createdAt: doc.data().createdAt
				});
			});
			return res.json(destinations);
		})
		.catch(err => {
			res.status(500).json({ error: err.code });
		});
};

//Post one destination
exports.postOneDestination = (req, res) => {
	if (req.user.role === "admin") {
		if (req.body.hotelHandle.trim() === "") {
			return res.status(400).json({ body: "Handle must not be empty" });
		}

		console.error("res: ", res);
		console.log("req: ", req);

		const newDestination = {
			userHandle: req.user.handle,
			hotelHandle: req.body.hotelHandle,
			location: req.body.country,
			type: req.body.type,
			price: req.body.price,
			summary: req.body.summary,
			description: req.body.description,
			createdAt: new Date().toISOString(),
			rating: 0,
			commentCount: 0
		};

		db.collection(`destinations`)
			.add(newDestination)
			.then(doc => {
				const resDestination = newDestination;
				resDestination.destinationId = doc.id;
				res.json(resDestination);
			})
			.catch(err => {
				res.status(500).json({ error: "something went wrong" });
				console.log(err);
			});
	} else {
		return res.status(403).json({ error: "Must be an admin to post a new destination" });
	}
};

// Fetch one destination
exports.getDestination = (req, res) => {
	let destinationData = {};
	db.doc(`/destinations/${req.params.destinationId}`)
		.get()
		.then(doc => {
			if (!doc.exists) {
				return res.status(404).json({ error: "Destination not found" });
			}
			destinationData = doc.data();
			destinationData.destinationId = doc.id;
			return db
				.collection("reviews")
				.orderBy("createdAt", "desc")
				.where("destinationId", "==", req.params.destinationId)
				.get();
		})
		.then(data => {
			destinationData.reviews = [];
			data.forEach(doc => {
				destinationData.reviews.push(doc.data());
			});
			return res.json(destinationData);
		})
		.catch(err => {
			console.error(err);
			res.status(500).json({ error: err.code });
		});
};

// Comment on a destination
exports.commentOnDestination = (req, res) => {
	if (req.body.comment.trim() === "") return res.status(400).json({ comment: "Must not be empty" });

	const newComment = {
		comment: req.body.comment,
		createdAt: new Date().toISOString(),
		destinationId: req.params.destinationId,
		userHandle: req.user.handle,
		rating: req.body.rating
	};

	db.doc(`/destinations/${req.params.destinationId}`)
		.get()
		.then(doc => {
			if (!doc.exists) {
				return res.status(404).json({ error: "Destination not found" });
			}
			return doc.ref.update({ commentCount: doc.data().commentCount + 1 });
		})
		.then(() => {
			return db.collection("reviews").add(newComment);
		})
		.then(() => {
			res.json(newComment);
		})
		.catch(err => {
			console.log(err);
			res.status(500).json({ error: "Something went wrong" });
		});
};

// Delete a destination
exports.deleteDestination = (req, res) => {
	const document = db.doc(`/destinations/${req.params.destinationId}`);
	document
		.get()
		.then(doc => {
			if (!doc.exists) {
				return res.status(404).json({ error: "Destination not found" });
			}
			if (req.user.role !== "admin") {
				return res.status(403).json({ error: "Unauthorized" });
			} else {
				return document.delete();
			}
		})
		.then(() => {
			res.json({ message: "Destination deleted successfully" });
		})
		.catch(err => {
			console.error(err);
			return res.status(500).json({ error: err.code });
		});
};
