// set up env variables
require("dotenv").config();
const moment = require("moment-timezone");

//import function for notifications
const sendOfferNotification = require("./utility/offerNotification");
const sendSms = require("./utility/send-sms");

// Node scheduler for price update
const cron = require("node-cron");
// set up server
const express = require("express");
const app = express();
// server for socket.io
const server = require("http").createServer(app);
// socket.io for broadcasting
const io = require("socket.io")(server);

const Product = require("./models/Product.js");
const ProductDetails = require("./models/ProductDetails.js");
const Offer = require("./models/Offer.js");

app.use(express.static(__dirname + "/node_modules"));
app.get("/", function(req, res, next) {
  res.sendFile(__dirname + "/index.html");
});

// express-formidable
const expressFormidable = require("express-formidable");
app.use(expressFormidable());

// cors
const cors = require("cors");
app.use(cors());

// set up database
const mongoose = require("mongoose");

const databaseURL = process.env.MONGODB_URI;

mongoose.connect(databaseURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true
});

// Use if socket for each client or room
// io.on("connection", socket => {
//   // console.log("socket started");
//   // socket.on("disconnect", () => {
//   //   console.log("Client disconnected");
//   //   clearInterval(interval);
//   // });
// });

// Scheduler for node sc/mi/ho/da/mo/ye
cron.schedule("*/4 * * * * *", async () => {
  const updatedProdList = await getUpdatedProdList();
  const dateNow = moment().format("HH:mm:ss");
  io.emit("cronData", {
    dateNow,
    updatedProdList
  });
});

//Every 5 minutes , closing the offers that have been email sent.
cron.schedule("*/5 * * * *", async () => {
  const timeRangeMail = 1000 * 60 * 3;
  const dateCurrent = new Date(Date.now());
  const dateSinceRange = new Date(Date.now() - timeRangeMail);
  const checkingEmailOffer = await Offer.find({
    timeEmailSent: {
      $lte: dateCurrent
    },
    closedAt: null
  });

  for (let i = 0; i < checkingEmailOffer.length; i++) {
    console.log(">>> EMAIL TO CLOSE", checkingEmailOffer);
    try {
      checkingEmailOffer[i].closedAt = dateCurrent;
      await checkingEmailOffer[i].save();
    } catch (error) {
      console.log(error);
    }
  }
});

const getUpdatedProdList = async () => {
  // Array to send
  let updatedProdList = [];
  // Range time to wait to reduce price in Millisecond / 7mn here
  const timeRangeReduce = 1000 * 60;
  // Percentage reduction price / 6% here
  const percentageReduce = 6;
  // Right Now
  const dateCurrent = new Date(Date.now());
  // All dates before the range need to be updated
  const dateSinceRange = new Date(Date.now() - timeRangeReduce);
  // Get all with lastPriceChange < dateSinceRange
  const products = await Product.find({
    lastPriceChange: {
      $lte: dateSinceRange
    },
    closedAt: null
  });

  for (let i = 0; i < products.length; i++) {
    const productDetailsConcerned = await ProductDetails.find({
      product: products[i]
    });
    let currentProd = products[i];
    const currentPrice = currentProd.currentPrice;
    const newPrice = Math.round(
      currentPrice - (currentPrice * percentageReduce) / 100
    );

    try {
      currentProd.currentPrice = newPrice;
      currentProd.lastPriceChange = dateCurrent;
      await currentProd.save(); // Changing in DB all prices with new price.
      updatedProdList.push({ id: products[i]._id, newPrice: newPrice }); // sending to front all products with their new prices.

      // With these new prices, checking if an offer matches.
      sendOfferNotification(productDetailsConcerned);
      sendSms(productDetailsConcerned);
    } catch (error) {
      console.log(error);
    }
  }

  // console.log(updatedProdList);
  return updatedProdList;

  // console.log("products", products);
  // console.log(dateCurrent, "dateCurrent");
  // console.log(dateSinceRange, "dateSinceRange");
  //console.log(updatedProdList);
};

// import models

// routers
const productRoute = require("./routes/product.js");
app.use(productRoute);

const userRoute = require("./routes/user");
app.use(userRoute);

const productDetailsRoute = require("./routes/productDetails");
app.use(productDetailsRoute);

const purchaseRoute = require("./routes/purchase.js");
app.use(purchaseRoute);

const likeRoute = require("./routes/like");
app.use(likeRoute);

const offerRoute = require("./routes/offer");
app.use(offerRoute);

// handling of unidentified routes
app.all("*", (req, res) => {
  res.status(404).json({
    error: {
      message: "404 Not Found"
    }
  });
});

server.listen(process.env.PORT, () =>
  console.log(`--> Express started with Socket ${process.env.PORT}`)
);

// start server
// app.listen(process.env.PORT, () => {
//   console.log("Server has started !");
// });
