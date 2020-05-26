// set up env variables
require("dotenv").config();

// import crypto packages
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const moment = require("moment-timezone");

// import packages
const lodash = require("lodash");
const slugify = require("slugify");

// set up database
const mongoose = require("mongoose");
const databaseURL = process.env.MONGODB_URI;

// connect to the database
mongoose.connect(databaseURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true
});

// In the test we have timeRangeReduce = 7mn (every 7 mn we reduce the price)
// We check it every 5sc (for each product > 7mn)
// So we shift each product to 30sc to be able to see the test in front-end
const timeRangePrice = 1000 * 20; // 20 sc shift
const timeRangeCreate = 1000 * 60 * 60; // 1h shift
const dateNow = new Date(Date.now());
// timeRangePrice = dateNow - 1 timeRange
// timeRangePrice = dateNow - 2 timeRange
// etc.

// import json data
const products = require("./products");
const users = require("./users");

// import models
const User = require("../models/User");
const Product = require("../models/Product");
const ProductDetails = require("../models/ProductDetails");
const Offer = require("../models/Offer");
const Like = require("../models/Like");

const userImport = async () => {
  try {
    let nbUser = 0;
    // creation Users
    for (let i = 0; i < users.length; i++) {
      // generate hash and token
      const password = "password";
      // salt is the last three digits of password
      const salt = password.slice(password.length - 3, password.length);
      const token = uid2(64);
      const hash = SHA256(password + salt).toString(encBase64);

      // console.log("password", password);
      // console.log("salt", salt);
      // console.log("token", token);
      // console.log("hash", hash);

      // input features to User
      const newUser = new User({
        surName: users[i].surName,
        firstName: users[i].firstName,
        birthDate: new Date(2000, 01, 01),
        email: users[i].email,
        address: users[i].address,
        address2: users[i].address2,
        zipCode: users[i].zipCode,
        city: users[i].city,
        country: users[i].country,
        phoneNumber: users[i].phoneNumber + i,
        hash: hash,
        token: token,
        over18: true,
        role: users[i].role
      });
      await newUser.save();
      nbUser++;
    }
    console.log("import User done ", nbUser);
  } catch (error) {
    console.log(error);
  }
};

// const dateCurrent = new Date(Date.now());
// const rangeTime = 1000 * 60 * 60 * 2; // in millisecond
// const dateSinceRange = new Date(Date.now() - rangeTime);

// import product function
const productImport = async () => {
  try {
    let nbProduct = 0;
    for (let i = 0; i < products.length; i++) {
      nbProduct++;
      // input products features
      const newProduct = new Product({
        name: products[i].name,
        slug: slugify(`${products[i].name}`, {
          remove: /[*+~.()'"!:@/]/g,
          lower: true
        }),
        description: products[i].description,
        image: products[i].image,
        seller: products[i].seller,
        initialPrice: products[i].initialPrice,
        currentPrice: products[i].currentPrice,
        lastPriceChange: dateNow - nbProduct * timeRangePrice,
        openedAt: new Date(),
        closedAt: products[i].closedAt,
        createdAt: dateNow - nbProduct * timeRangeCreate
      });
      await newProduct.save();
    }
    console.log("import Product done ", nbProduct);
  } catch (error) {
    console.log(error);
  }
};

// import productDetails function
const productDetailsImport = async () => {
  try {
    // table of details
    const details = ["detail1", "detail2", "detail3"];
    const detailsNum = details.length;
    // import products collection
    const products = await Product.find();

    let nbProductDetails = 0;
    for (let i = 0; i < products.length; i++) {
      for (let j = 0; j < detailsNum; j++) {
        const newProductDetails = new ProductDetails({
          details: details[j],
          product: products[i],
          initialQuantity: (j + 1) * 100,
          inventory: Math.floor(Math.random() * (j + 1) * 100)
        });
        await newProductDetails.save();
        nbProductDetails++;
      }
    }
    console.log("import ProductDetails done ", nbProductDetails);
  } catch (error) {
    console.log(error);
  }
};

// import offers
const offerImport = async () => {
  // pull all users with role user
  const usersRoleOnly = await User.find({ role: "user" });
  // console.log(userRoleOnly.length);
  const usersNum = usersRoleOnly.length;

  // pull all products
  const productsAll = await Product.find();
  const productNum = productsAll.length;
  // console.log("productNum", productNum);

  let nbOffer = 0;
  for (let i = 0; i < usersNum; i++) {
    // random number of offers for this user
    const offerNum = Math.floor(Math.random() * productNum);
    // console.log("offerNum", offerNum);
    let excluProducts = [];
    for (let j = 0; j < offerNum; j++) {
      // remaining products
      const remainProducts = lodash.each(productsAll, excluProducts);
      // random selection in remaining products
      const randomProductIndex = Math.floor(
        Math.random() * remainProducts.length
      );
      const offerProduct = remainProducts[randomProductIndex];
      // find productDetail with productId and "detail1"
      const newProductDetail = await ProductDetails.findOne({
        details: "detail1",
        product: offerProduct
      });

      // console.log("newProductDetail", newProductDetail);

      // create new offer on product with randomProductIndex
      const newOffer = new Offer({
        user: usersRoleOnly[i],
        productDetails: newProductDetail,
        product: offerProduct,
        createdAt: new Date(),
        offeredPrice: offerProduct.currentPrice,
        closedAt: null,
        isEmailSent: false,
        timeEmailSent: null
      });
      await newOffer.save();
      nbOffer++;
      excluProducts.push(remainProducts[randomProductIndex]);
      // console.log("excluProducts", excluProducts.length);
    }
  }
  console.log("import Offer done ", nbOffer);
};

// import likes
const likeImport = async () => {
  // pull all users with role user
  const usersRoleOnly = await User.find({ role: "user" });
  // console.log(userRoleOnly.length);
  const usersNum = usersRoleOnly.length;

  // pull all products
  const productsAll = await Product.find();
  const productNum = productsAll.length;
  // console.log("productNum", productNum);

  let nbLike = 0;
  for (let i = 0; i < usersNum; i++) {
    // random number of likes for this user
    const likeNum = Math.floor(Math.random() * productNum);
    // console.log("likeNum", likeNum);
    let excluProducts = [];
    for (let j = 0; j < likeNum; j++) {
      // remaining products
      const remainProducts = lodash.each(productsAll, excluProducts);
      // random selection in remaining products
      const randomProductIndex = Math.floor(
        Math.random() * remainProducts.length
      );
      const likeProduct = remainProducts[randomProductIndex];

      // create new offer on product with randomProductIndex
      const newLike = new Like({
        user: usersRoleOnly[i],
        product: likeProduct,
        date: new Date()
      });
      await newLike.save();
      nbLike++;
      excluProducts.push(remainProducts[randomProductIndex]);
      // console.log("excluProducts", excluProducts.length);
    }
  }
  console.log("import Like done ", nbLike);
};

const importAll = async () => {
  // exec import functions
  await userImport();
  await productImport();
  await productDetailsImport();
  await offerImport();
  await likeImport();

  // close database connection
  await mongoose.connection.close(function(err, result) {
    return result;
  });
};

importAll();
