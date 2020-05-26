const MG_API_KEY = process.env.MAILGUN_API_KEY;
const MG_DOMAIN = process.env.MAILGUN_DOMAIN;
const URL_FRONT = process.env.FRONTEND_HOST;

const mailgun = require("mailgun-js")({
  apiKey: MG_API_KEY,
  domain: MG_DOMAIN
});

const express = require("express");
const router = express.Router();

const Offer = require("../models/Offer");
const User = require("../models/User");
const Product = require("../models/Product");
const ProductDetails = require("../models/ProductDetails");

const sendOfferNotification = async productDetails => {
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
        let recipient = user.email;

        if (productInformation.inventory > 0) {
          if (
            productInformation.product.currentPrice <= offers[i].offeredPrice
          ) {
            if (offers[i].isEmailSent === false) {
              const data = {
                from: "Freeckly <postmaster@" + MG_DOMAIN + ">",
                to: recipient,
                subject: "Saisissez votre chance !",

                html: `Bravo! Votre produit 
                ${productInformation.product.name} est actuellement disponible pour

                ${offers[i].offeredPrice} euros. 
                <br/>
                Cliquez sur ce lien pour accéder à la page de paiement ! 
                <a href="${URL_FRONT}/checkout/${offers[i]._id}"> CLIQUEZ ICI </a>
                Vous n'avez que cinq minutes avant que l'offre ne soit cloturée!
                `
              };
              mailgun.messages().send(data, (error, body) => {
                // console.log(body);
                console.log(">> Email success/sent", body);
              });
              offers[i].isEmailSent = true;
              offers[i].timeEmailSent = new Date();

              await offers[i].save();
            }
          }
        }
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = sendOfferNotification;
