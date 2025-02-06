const express = require("express");
const router = express.Router();
const Listing = require("../models/listing.js");
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const listingController = require("../controllers/listings.js");
const multer = require("multer");
const { storage } = require("../cloudconfig.js");
const upload = multer({ storage });

router
  .route("/")
  .get(wrapAsync(listingController.index))
  .post(
    isLoggedIn,
    upload.single("listing[image]"),
    validateListing,
    wrapAsync(listingController.createListing)
  );

// New Route - Render form to create a new listing
router.get("/new", isLoggedIn, listingController.renderNewForm);

router
  .route("/:id") // Corrected from "/id" to "/:id"
  .get(wrapAsync(listingController.showListing))
  .put(
    isLoggedIn, // Place isLoggedIn first
    isOwner,
    upload.single("listing[image]"),
    validateListing,
    wrapAsync(listingController.updateListing)
  )
  .delete(
    isLoggedIn, // Place isLoggedIn first
    isOwner,
    wrapAsync(listingController.destroyListing)
  );

// Edit Route - Render form to edit a listing
router.get(
  "/:id/edit",
  isLoggedIn,
  isOwner,
  wrapAsync(listingController.renderEditForm)
);

module.exports = router;
