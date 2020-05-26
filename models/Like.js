const mongoose = require("mongoose");
const Like = mongoose.model("Like", {
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product"
  },
  date: {
    type: Date
  }
});

module.exports = Like;
