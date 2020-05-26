const mongoose = require("mongoose");

const Offer = mongoose.model("Offer", {
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  productDetails: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProductDetails"
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product"
  },
  createdAt: {
    type: Date
  },
  offeredPrice: {
    type: Number
  },
  closedAt: {
    type: Date
  },
  isEmailSent: {
    type: Boolean,
    default: false
  },

  timeEmailSent: {
    type: Date
  }
});

module.exports = Offer;
