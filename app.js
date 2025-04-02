const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema } = require("./schema.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

main()
	.then(() => {
		console.log("connected to db");
	})
	.catch((err) => {
		console.log(err);
	});

async function main() {
	await mongoose.connect(MONGO_URL);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));
app.get("/", (req, res) => {
	res.send("this is root.");
});

const validateListing = (req, res, next) => {
	let { error } = listingSchema.validate(req.body);
	if (error) {
		let errMsg = error.details.map((el) => el.message).join(",");
		throw new ExpressError(400, errMsg);
	} else {
		next();
	}
};

//INDEX RouTE
app.get(
	"/listings",
	wrapAsync(async (req, res) => {
		const allListings = await Listing.find({});
		res.render("./listings/index.ejs", { allListings });
	})
);

//New Route
app.get("/listings/new", (req, res) => {
	res.render("listings/new.ejs");
});

//show route
app.get(
	"/listings/:id",
	wrapAsync(async (req, res) => {
		let { id } = req.params;
		const listing = await Listing.findById(id);
		res.render("listings/show.ejs", { listing });
	})
);

//Create Route
app.post(
	"/listings",
	validateListing,
	wrapAsync(async (req, res) => {
		// let { title, description, image, price, country, loaction } = req.body;
		const newListing = new Listing(req.body.listing);
		await newListing.save();
		res.redirect("/listings");
	})
);

//Edit route
app.get(
	"/listings/:id/edit",
	wrapAsync(async (req, res) => {
		let { id } = req.params;
		const listing = await Listing.findById(id);
		res.render("listings/edit.ejs", { listing });
	})
);

//Update Route
app.put(
	"/listings/:id",
	validateListing,
	wrapAsync(async (req, res) => {
		if (!req.body.listing) {
			throw new ExpressError(400, "Invalid Data");
		}
		let { id } = req.params;
		await Listing.findByIdAndUpdate(id, { ...req.body.listing });
		res.redirect(`/listings/${id}`);
	})
);

//DELTE RoUTE
app.delete(
	"/listings/:id",
	wrapAsync(async (req, res) => {
		let { id } = req.params;
		let deletedListing = await Listing.findByIdAndDelete(id);
		console.log(deletedListing);
		res.redirect("/listings");
	})
);

// app.get("/testListing", async(req, res)=>{
//     let sampleListing = new Listing({
//         title:"My new Villa",
//         description:"By the beach",
//         price:1200,
//         location:"Goa",
//         country:"India",
//     });
//     await sampleListing.save();
//     console.log("sample was saved");
//     res.send("successfull testing");
// });

app.all("*", (req, res, next) => {
	next(new ExpressError(404, "Page not found"));
});

app.use((err, req, res, next) => {
	let { statusCode = 500, message = "Somwthing went wrong." } = err;
	res.status(statusCode).render("error.ejs", { message });
	// res.status(statusCode).send(message);
});

app.listen(8080, () => {
	console.log("app is listening on port 8080");
});
