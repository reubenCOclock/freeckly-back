const express = require("express");
const router = express.Router();

const MG_API_KEY = process.env.MAILGUN_API_KEY;
const MG_DOMAIN = process.env.MAILGUN_DOMAIN;

const mailgun = require("mailgun-js")({
  apiKey: MG_API_KEY,
  domain: MG_DOMAIN
});

const Offer = require("../models/Offer");
const User = require("../models/User");

const Product = require("../models/Product");

const ProductDetails = require("../models/ProductDetails");

const outOfStock = async (req, res) => {
  try {
    const offers = await Offer.find();
    for (let i = 0; i < offers.length; i++) {
      const productDetail = await ProductDetails.findById(
        offers[i].productDetails
      ).populate("product");
      //console.log(productDetail);
      console.log(productDetail);

      const user = await User.findById(offers[i].user);
      if (offers[i].closedAt === null) {
        if (productDetail.inventory == 0) {
          let recipient = user.email;
          let recipientTest = "mofofb@gmail.com";
          const data = {
            from: "Mailgun Sandbox <postmaster@" + MG_DOMAIN + ">",
            to: recipientTest,
            subject: "Désolé, le produit est en rupture de stock !",
            text:
              "Nous regrettons de vous informer que le produit" +
              productDetail.product.name +
              " " +
              "est en rupture de stock, et que votre offre n'est plus valable"
          };
          mailgun.messages().send(data, (error, body) => {
            console.log(body);
            console.log(recipient);
          });

          offers[i].closedAt = new Date();

          await offers[i].save();
        }
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = outOfStock;
