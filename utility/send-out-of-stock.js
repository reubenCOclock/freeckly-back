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

const outOfStock = async productDetails => {
  console.log("TRYING TO SEND OOS EMAIL");
  try {
    const users = await User.find();

    const offers = await Offer.find({
      productDetails: productDetails
    }).populate("product");
    console.log("offers concerned", offers);

    for (let i = 0; i < users.length; i++) {
      console.log("users", users[i]);

      for (let j = 0; j < offers.length; j++) {
        console.log("offers", offers[j]);

        console.log("COMPARING -->", offers[j].user, "AND", users[i]._id);

        if (offers[j].user.toString() === users[i]._id.toString()) {
          console.log("offer user found ", offers[j].user);

          if (offers[j].closedAt === null) {
            // let recipientStatic = "mofofb@gmail.com";
            let recipient = users[i].email;
            const data = {
              from: "Freeckly <postmaster@" + MG_DOMAIN + ">",
              to: recipient,
              subject: "Vente cloturée",
              text: ` Bonjour, nous regrettons de vous informer que le produit
                ${offers[j].product.name} est en rupture de stock ! Votre offre est donc cloturée.`
            };
            mailgun.messages().send(data, (error, body) => {
              console.log(body);
              console.log("EMAIL OOS SENT TO", recipient);
            });

            offers[j].closedAt = new Date();
            await offers[j].save();
            console.log("closing offer status : ", offers[j].closedAt);
          }
        }
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = outOfStock;
