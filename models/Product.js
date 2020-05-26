const mongoose = require("mongoose");

const Product = mongoose.model("Product", {
  name: {
    type: String,
    required: true
  },
  slug: { type: String },
  description: {
    type: String
  },
  image: {
    type: String,
    required: false
  },

  seller: {
    type: String,
    default: "freekly"
  },

  initialPrice: {
    type: Number
  },

  currentPrice: {
    type: Number
  },

  lastPriceChange: {
    type: Date
  },

  openedAt: {
    type: Date
  },

  closedAt: {
    type: Date
  },

  createdAt: {
    type: Date
  },
  deliveryFees: { type: Number, default: 5 }
});

module.exports = Product;
