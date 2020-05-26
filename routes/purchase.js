const express = require("express");
const router = express.Router();
//import model
const Purchase = require("../models/Purchase");
const ProductDetails = require("../models/ProductDetails");
const Product = require("../models/Product");
const Offer = require("../models/Offer");
const sendOutOfstock = require("../utility/send-out-of-stock");

//import middleware
const isSimplyConnected = require("../authentication/isSimplyConnected");
const isUserAuthorized = require("../authentication/isUserAuthorized");

//setup stripe - the one of Freeckly
const createStripe = require("stripe");
const stripe = createStripe(process.env.STRIPE_KEY);

//Setup Mailgun - to send email confirmation order
const mailgun = require("mailgun-js");
const MG_API_KEY = process.env.MAILGUN_API_KEY;
const MG_DOMAIN = process.env.MAILGUN_DOMAIN;

require("dotenv").config();

// route purchase, create instance without offer
router.post("/purchase/instant/create", isUserAuthorized, async (req, res) => {
  try {
    // object to create in body of req
    const { productDetailsId, purchasePrice, billingDetails } = req.fields;
    const user = req.user;
    // find related ProductDetails
    const productDetails = await ProductDetails.findById(productDetailsId);
    // Find the related product linked to this productdetail
    const product = await Product.findById(productDetails.product);

    // Checking if the user has already purchased this product
    const userPurchases = await Purchase.find({
      product: product,
      userId: req.user._id
    });
    if (userPurchases.length !== 0) {
      // He has already made a purchase : refused then
      res
        .status(400)
        .json({ message: "you hava already purchases this product" });
    } else {
      if (productDetails.inventory > 1) {
        // save in the database the purchase
        const newPurchase = new Purchase({
          userId: user._id,
          productDetailsId,
          product: product._id,
          purchaseDate: new Date(),
          purchasePrice,
          deliveryFees: product.deliveryFees,
          billingDetails
        });
        await newPurchase.save();

        // decrease inventory by 1
        productDetails.inventory = productDetails.inventory - 1;
        await productDetails.save();

        res.status(200).json(newPurchase);
      } else if (productDetails.inventory === 1) {
        // CREATE PURCHASE FOR THE USER
        const product = await Product.findById(productDetails.product);

        try {
          const newPurchase = new Purchase({
            userId: user._id,
            productDetailsId,
            product: product._id,
            purchaseDate: new Date(),
            purchasePrice,
            deliveryFees: product.deliveryFees,
            billingDetails
          });
          await newPurchase.save();

          //Decrease 1 in inventory
          productDetails.inventory = productDetails.inventory - 1;
          await productDetails.save();

          // SEND EMAIL TO OTHERS
          sendOutOfstock(productDetails._id);

          res.status(200).json(newPurchase);
        } catch (error) {
          console.log("ERROR TRYING TO MAKE PURCHASE", error.message);
        }
      } else {
        res.status(401).json({ message: "out of stock" });
      }
    }
  } catch (error) {
    res.json(error.message);
  }
});

// route purchase, create instance without offer
router.post("/purchase/offer/create", isUserAuthorized, async (req, res) => {
  try {
    // object to create in body of req
    const { offerId, billingDetails } = req.fields;
    const user = req.user;

    // find offer
    const offer = await Offer.findById(offerId);
    // Find product linked to this offer
    const product = await Product.findById(offer.product);

    // Checking if the user has already purchased this product
    const userPurchases = await Purchase.find({
      product: product,
      userId: req.user._id
    });
    if (userPurchases.length !== 0) {
      // He has already made a purchase : refused then
      res
        .status(400)
        .json({ message: "you have already purchased this product" });
    } else {
      // use toString because cannot compare two objects (_id are objects)
      if (toString(user._id) !== toString(offer.user)) {
        res.status(400).json({
          message: "user from token is different from user from offer"
        });
      } else {
        // find related ProductDetails
        const productDetails = await ProductDetails.findById(
          offer.productDetails
        );
        if (productDetails.inventory > 1) {
          // save in the database the purchase
          const newPurchase = new Purchase({
            userId: user._id,
            productDetailsId: productDetails._id,
            product: product._id,
            purchaseDate: new Date(),
            purchasePrice: offer.offeredPrice,
            deliveryFees: product.deliveryFees,
            billingDetails
          });

          await newPurchase.save();
          // decrease inventory by 1
          productDetails.inventory = productDetails.inventory - 1;
          await productDetails.save();
          // Closing the offer now :
          offer.closedAt = new Date();
          await offer.save();

          res.status(200).json(newPurchase);
          // console.log(newPurchase);
        } else if (productDetails.inventory === 1) {
          // CREATE PURCHASE FOR THE USER
          productDetails.inventory = productDetails.inventory - 1;
          await productDetails.save();
          const product = await Product.findById(offer.product);
          const newPurchase = new Purchase({
            userId: user._id,
            productDetailsId: productDetails._id,
            product: product._id,
            purchaseDate: new Date(),
            purchasePrice: offer.offeredPrice,
            deliveryFees: product.deliveryFees,
            billingDetails
          });
          await newPurchase.save();

          // closing offer now.
          offer.closedAt = new Date();
          await offer.save();
          // Sending email to all other people that made an offer still open on this product
          sendOutOfstock(productDetails._id);

          res.status(200).json(newPurchase);
        } else {
          res.status(401).json({ message: "out of stock" });
        }
      }
    }
  } catch (error) {
    res.json(error.message);
  }
});

// Payment with stripe - running at same time as purchase/instant and purchase/offer
router.post("/payment", async (req, res) => {
  let totalPriceInCents = req.fields.amount.toString() + "00"; // we need to convert the final price in cents for stripe

  try {
    // we send the token from Stripe here and create the charges
    let { status } = await stripe.charges.create({
      amount: totalPriceInCents, //  purchase price + delivery fees
      currency: "eur",
      description: req.fields.buyer,
      source: req.fields.token // token from stripe
    });
    console.log("status of stripe", status);
    // Payment success, we update the database;
    // TO DO : update database here (check purchase/create)
    // Then we send answer to client to show status
    res.json({ status });
  } catch (err) {
    console.log(err);
    res.status(500).end();
  }
});

// Email confirmation order - after payment
router.post("/purchase/send-email", async (req, res) => {
  const {
    email,
    name,
    description,
    price,
    deliveryFees,
    choosenDetail
  } = req.fields;
  console.log(email);
  const totalPrice = price + deliveryFees;
  const mg = mailgun({ apiKey: MG_API_KEY, domain: MG_DOMAIN });
  if (choosenDetail) {
    const findDetail = await ProductDetails.findById(choosenDetail);
    const nameDetail = findDetail.details;
    const data = {
      from: "Freeckly <postmaster@" + MG_DOMAIN + ">",
      to: `${email}`,
      subject: "Freeckly - Votre commande",
      html: ` <html>
      <img src="https://media-exp1.licdn.com/dms/image/C4D1BAQGAushJ7xchrQ/company-background_10000/0?e=2159024400&v=beta&t=Em-ydoH_Te_jOS0-ffcVhq00T8pPrm46Bq57qip9Ca4"/>
      
      Merci pour votre achat chez Freeckly !  <br/>
      Nom du produit : <b>${name}</b>,  <br/>
      Modèle : <b>${nameDetail}</b>, <br/>
      Montant total d'achat : <b>${totalPrice}€</b> 
      
      </html>`
    };
    mg.messages().send(data, function(error, body) {
      console.log(body);
      res.json(body);
    });
  }
});

// return all purchases of a user from user token if user is connected
router.get("/purchase/user", isSimplyConnected, async (req, res) => {
  try {
    const user = req.user; //user is an object with all info
    const purchases = await Purchase.find({ userId: user }).populate({
      path: "productDetailsId",
      populate: { path: "product" }
    });
    if (purchases.length !== 0) {
      res.status(200).json(purchases);
    } else {
      res.status(200).json("no purchase");
    }
  } catch (error) {
    res.json(error.message);
  }
});

module.exports = router;
