require("dotenv").config();
const URL_FRONT = process.env.FRONTEND_HOST;

// TWILIO SET UP
const twilio = require("twilio");
// Account SID
const twlSid = process.env.TWILIO_AUCCOUNT_SID;
// Auth Token
const twlToken = process.env.TWILIO_AUTH_TOKEN;
// Auth Number we bought
const twlFrom = process.env.TWILIO_NUMBER_FROM;
// My number for test
// const twlTo = process.env.TWILIO_NUMBER_TO;

// EXPRESS SETUP
const express = require("express");
const router = express.Router();
const Offer = require("../models/Offer");
const User = require("../models/User");
const Product = require("../models/Product");
const ProductDetails = require("../models/ProductDetails");

const sendSms = async productDetails => {
  try {
    const users = [];
    const offerInformation = [];
    const offers = await Offer.find({ productDetails: productDetails });
    const products = await Product.find();

    for (let i = 0; i < offers.length; i++) {
      const user = await User.findById(offers[i].user);
      users.push(user);

      const productInformation = await ProductDetails.findById(
        offers[i].productDetails
      ).populate("product");

      if (offers[i].closedAt == null) {
        if (productInformation.inventory > 0) {
          if (
            productInformation.product.currentPrice <= offers[i].offeredPrice
          ) {
            if (user.phoneNumber) {
              if (offers[i].isEmailSent === false) {
                console.log("IM SENDING SMS");
                // Sending sms
                let client = new twilio(twlSid, twlToken);
                // console.log(">>>>> client", client);
                client.messages
                  .create({
                    body: `Bonjour c'est Freeckly ! Vous avez fait une offre sur ${productInformation.product.name}; saisissez votre chance et obtenez le produit sur ce lien : ${URL_FRONT}/checkout/${offers[i]._id}. Vous avez 5 minutes avant que l'offre ne soit annulée ! `,
                    from: twlFrom,
                    to: user.phoneNumber
                  })
                  .then(message => console.log(">> success/sent", message.sid));
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.log("CATCH SMS", error.message);
  }
};

module.exports = sendSms;
