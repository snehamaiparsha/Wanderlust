const Listing = require("../models/listing");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

// Index Route - Get all listings
module.exports.index = async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings });
};

// New Route - Render form to create a new listing
module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

// Show Route - Get a specific listing by ID
module.exports.showListing = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("owner");

  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    res.redirect("/listings");
  }

  console.log(listing);
  res.render("listings/show.ejs", { listing });
};

// Create Route - Create a new listing
module.exports.createListing = async (req, res) => {
  try {
    // Geocode location to get coordinates
    let response = await geocodingClient
      .forwardGeocode({
        query: req.body.listing.location,
        limit: 1,
      })
      .send();

    // Handle missing location
    if (!response.body.features.length) {
      req.flash("error", "Location not found!");
      return res.redirect("/listings/new");
    }

    // Prepare image data
    let url = req.file.path;
    let filename = req.file.filename;

    // Create a new listing object
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = { url, filename };
    newListing.geometry = response.body.features[0].geometry; // Coordinates

    // Save the new listing
    let savedListing = await newListing.save();
    console.log(savedListing);

    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
  } catch (error) {
    console.error(error);
    req.flash("error", "Something went wrong while creating the listing.");
    res.redirect("/listings/new");
  }
};

// Edit Route - Render form to edit a listing
module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Listing you requested for does not exist");
    res.redirect("/listings");
  }

  // Handle image URL modification for preview
  let originalImageUrl = listing.image.url;
  originalImageUrl = originalImageUrl.replace("/upload,", "/upload/w_250");

  res.render("listings/edit.ejs", { listing, originalImageUrl });
};

// Update Route - Update an existing listing
module.exports.updateListing = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

  // Handle file upload if a new image is provided
  if (typeof req.file !== "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = { url, filename };
    await listing.save();
  }

  req.flash("success", "Listing Updated!");
  res.redirect(`/listings/${id}`);
};

// Delete Route - Delete a listing
module.exports.destroyListing = async (req, res) => {
  const { id } = req.params;
  await Listing.findByIdAndDelete(id);
  req.flash("success", "Listing Deleted!");
  res.redirect("/listings");
};
