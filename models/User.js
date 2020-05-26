const mongoose = require("mongoose");

// email, role, hash, token are required and unique
// email is the identification of User
const User = mongoose.model("User", {
  email: {
    type: String,
    required: true,
    unique: true
  },
  phoneNumber: {
    type: String
  },
  role: {
    type: String,
    required: true,
    default: "user"
  },
  hash: {
    type: String,
    required: true
  },
  token: {
    type: String,
    required: true
  },
  surName: {
    type: String,
    required: false
  },
  firstName: {
    type: String
  },

  birthDate: {
    type: Date
  },
  address: {
    type: String
  },
  address2: {
    type: String
  },
  city: {
    type: String
  },
  zipCode: {
    type: String
  },
  country: {
    type: String
  },
  over18: {
    type: Boolean
  }
});

module.exports = User;
