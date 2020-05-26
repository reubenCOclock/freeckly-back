const mongoose = require("mongoose");

const productDetails = mongoose.model("ProductDetails", {
  details: {
    type: String
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product"
  },
  initialQuantity: {
    type: Number,
    default: 0
  },
  inventory: {
    type: Number,
    default: 0
  }
});

module.exports = productDetails;
