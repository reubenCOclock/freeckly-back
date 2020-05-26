// import packages
const mongoose = require("mongoose");

// create model
const Notice = mongoose.model("Notice", {
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  purchaseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Purchase"
  },
  offerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Offer"
  },
  type: String,
  sentDate: Date,
  reference: String
});

// export
module.exports = Notice;
