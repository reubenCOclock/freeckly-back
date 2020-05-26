// import packages
const mongoose = require("mongoose");

// create model
const Purchase = mongoose.model("Purchase", {
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  productDetailsId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProductDetails"
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product"
  },
  offerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Offer"
  },
  purchaseDate: Date,
  purchasePrice: Number,
  deliveryFees: Number,
  billingDetails: Object
});

// export
module.exports = Purchase;
