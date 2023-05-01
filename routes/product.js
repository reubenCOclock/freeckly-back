const express = require("express");
const router = express.Router();
// set up env variables
require("dotenv").config();
console.log("Je suis en train de changer ce fichier!!");

// import packages
const cloudinary = require("cloudinary");
const slugify = require("slugify");

// import models
const Product = require("../models/Product.js");
const ProductDetails = require("../models/ProductDetails.js");
const Offer = require("../models/Offer");
const Like = require("../models/Like");

// import middleware
const isAdminAuthorized = require("../authentication/isAdminAuthorized");
const isConnected = require("../authentication/isConnected");
const isSimplyConnected = require("../authentication/isSimplyConnected");

// *******************ROUTES**************************************

// to set up verifications of req fields
router.post("/product/create", isAdminAuthorized, async (req, res) => {
  try {
    let imageUrl;
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_KEY,
      api_secret: process.env.CLOUDINARY_SECRET
    });
    console.log(req.files.files.path);
    await cloudinary.v2.uploader.upload(
      req.files.files.path,
      (error, result) => {
        if (error) {
          res.json(error);
          console.log(error);
        } else {
          // console.log("result", result);
          imageUrl = result.secure_url;
          console.log(imageUrl);
        }
      }
    );

    // console.log("imageUrl", imageUrl);

    const newProduct = new Product({
      name: req.fields.name,
      slug: slugify(`${req.fields.name}`, {
        remove: /[*+~.()'"!:@/]/g,
        lower: true
      }),
      description: req.fields.description,
      image: imageUrl,
      seller: req.fields.seller,
      initialPrice: req.fields.initialPrice,
      currentPrice: req.fields.initialPrice,
      deliveryFees: req.fields.deliveryFees,

      openedAt: new Date(),
      closedAt: "",
      createdAt: new Date()
    });
    await newProduct.save();

    res.status(200).json(newProduct);
  } catch (error) {
    res.json(error.message);
  }
});

// home page route to show the product information to an ananympous user or a registered user
router.get("/product/find-all", isConnected, async (req, res) => {
  try {
    // sort products by if not closedAt and by openedAt in descending order
    const products = await Product.find().sort({ closedAt: 1, openedAt: -1 });

    // create array to show the number of offers for each product
    const offerArray = [];

    // create array to show the number of likes for each product
    const likesArray = [];
    // create array to show the products which the user has liked
    const userLikesArray = [];

    // create array to show the products for which the user has made an offer and for which
    const userOffersArray = [];
    // create an array of objects which will store all the information (the information about the product, if the user liked the product, if the user made an offer for the product and how many offers and likes there are for the product)
    const productInformation = [];

    let userIsDefined;

    // looping on the products
    for (let i = 0; i < products.length; i++) {
      let productCopy = {};
      // recuperate the product details for the product
      const productDetail = await ProductDetails.find({ product: products[i] });
      //recuperate the offers for which the productDetail is related to
      const productDetailOffers = await Offer.find({
        productDetails: productDetail,
        closedAt: null
      });

      // console.log(productDetailOffers);
      // determine the amount of offers made on each product
      offerArray.push(productDetailOffers.length);

      // determine the amount of likes which are related to the product
      let productLikes = await Like.find({ product: products[i] });
      likesArray.push(productLikes.length);
      // if there is a user who is connected,the variable userIsDefined is set to true
      if (req.user) {
        userIsDefined = true;
        // find if the user has liked the product in the loop
        const userLikes = await Like.find({
          product: products[i],
          user: req.user
        });

        // if the user has liked the product in the loop, I push that id into the array
        if (userLikes.length != 0) {
          userLikesArray.push(userLikes[0].product);
        }
      }

      productCopy.product = products[i];
      productCopy.likes = likesArray[i];
      productCopy.offers = offerArray[i];

      productInformation.push(productCopy);
    }

    // if the user is defined
    if (userIsDefined == true) {
      // recuperate all of the offers which are related to the user
      const userOffers = await Offer.find({
        user: req.user,
        closedAt: null
      }).populate("productDetails");
      //console.log(userOffers);
      // loop on the offers related to the user and push the information in an array
      for (let i = 0; i < userOffers.length; i++) {
        if (userOffers[i].productDetails !== undefined) {
          userOffersArray.push({
            product: userOffers[i].productDetails.product,
            productDetails: userOffers[i].productDetails._id,
            offeredPrice: userOffers[i].offeredPrice
          });
        }
      }
      // push the additional information related to the user which is connected
      let userInformation = {};
      userInformation.likes = userLikesArray;
      userInformation.offers = userOffersArray;

      /*
      userCluster.push({
        userLikes: userLikesArray,
        userOffersArray: userOffersArray
      });
      */

      return res.json({ products: productInformation, user: userInformation });
    } else {
      return res.json({ products: productInformation });
    }
  } catch (error) {
    res.json(error.message);
  }
});

// return object with product and all related productDetails
router.get(
  "/product/find-productdetails-all/:_id",
  isAdminAuthorized,
  async (req, res) => {
    try {
      const _id = req.params._id;
      // to check if _id is valid
      if (!_id.match(/^[0-9a-fA-F]{24}$/)) {
        res.status(400).json({ message: `${_id} is not a valid Id parameter` });
      } else {
        const product = await Product.findById(req.params._id);
        // check if product valid
        if (!product) {
          res.status(400).json({ message: `no product with id ${_id}` });
        } else {
          const getProductDetails = await ProductDetails.find({
            product: product
          });
          res.status(200).json({ product, productDetails: getProductDetails });
        }
      }
    } catch (error) {
      res.json(error.message);
    }
  }
);

// return object with product and all details
router.get("/product/find-details-all/:_id", async (req, res) => {
  try {
    const _id = req.params._id;
    // to check if _id is valid
    if (!_id.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400).json({ message: `${_id} is not a valid Id parameter` });
    } else {
      const product = await Product.findById(req.params._id);
      // check if product valid
      if (!product) {
        res.status(400).json({ message: `no product with id ${_id}` });
      } else {
        const getProductDetails = await productDetails.find({
          product: product
        });
        const details = getProductDetails.map(productDetail => {
          return { details: productDetail.details, _id: productDetail._id };
        });
        res.status(200).json({ product, details });
      }
    }
  } catch (error) {
    res.json(error.message);
  }
});

// return object with product and isBeingSold
router.get(
  "/product/is-being-sold/:_id",
  isAdminAuthorized,
  async (req, res) => {
    try {
      const _id = req.params._id;
      // to check if _id is valid
      if (!_id.match(/^[0-9a-fA-F]{24}$/)) {
        res.status(400).json({ message: `${_id} is not a valid Id parameter` });
      } else {
        const product = await Product.findById(req.params._id);
        // check if product valid
        if (!product) {
          res.status(400).json({ message: `no product with id ${_id}` });
        } else {
          const getProductDetails = await ProductDetails.find({
            product: product
          });
          // compute sum of inventory
          let inventory = 0;
          let isBeingSold = true;
          for (let i = 0; i < getProductDetails.length; i++) {
            inventory = inventory + getProductDetails[i].inventory;
          }

          if (inventory === 0) {
            isBeingSold = false;
          }

          res.status(200).json({ product, isBeingSold });
        }
      }
    } catch (error) {
      res.json(error.message);
    }
  }
);

// find product by _id
// need to limit features to be sent
router.get("/product/find/:_id", async (req, res) => {
  try {
    const _id = req.params._id;
    // check if _id is a valid id parameter in MongoDB
    if (!_id.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400).json({ message: `${_id} is not a valid Id parameter` });
    } else {
      const product = await Product.findById(_id);
      if (!product) {
        res.status(400).json({ message: `no product with id ${_id}` });
      } else {
        return res.json(product);
      }
    }
  } catch (error) {
    res.json(error.message);
  }
});

// from product id get likes and offers on product and likes and offers of a user if token is provided
router.get(
  "/product/complete-info/:_id",
  isSimplyConnected,
  async (req, res) => {
    try {
      // productId is the id of the product
      const productId = req.params._id;
      // check if _id is a valid id parameter in MongoDB
      if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
        res
          .status(400)
          .json({ message: `${productId} is not a valid Id parameter` });
      } else {
        const product = await Product.findById(productId);
        if (!product) {
          res.status(400).json({ message: `no product with id ${productId}` });
        } else {
          // user if valid token
          const userLikes = [];
          const userOffers = [];
          // define user
          const user = req.user;
          if (user) {
            // console.log("user", user);
            // find all likes of the user
            const relatedUserLikes = await Like.find({ user: user._id });
            // console.log("relatedUserLikes", relatedUserLikes);
            for (let i = 0; i < relatedUserLikes.length; i++) {
              userLikes.push(relatedUserLikes[i]);
            }
            relatedUserOffers = await Offer.find({
              user: user._id,
              closedAt: null
            });
            // console.log("userOffers", userOffers);
            for (let i = 0; i < relatedUserOffers.length; i++) {
              userOffers.push(relatedUserOffers[i]);
            }
          }
          // all productDetails related to product
          const relatedProductDetails = await ProductDetails.find({
            product: product._id
          });
          // console.log("relatedProductDetails", relatedProductDetails);

          // all likes related to product
          const productLikes = await Like.find({ product: product._id });
          // console.log("productLikes", productLikes);

          // all offers related to product
          const productOffers = [];
          const productProductDetails = [];
          for (let i = 0; i < relatedProductDetails.length; i++) {
            // create the productProductDetails table with only: _id, details and isAvailable (true if can buy)
            let isAvailable = false;
            if (relatedProductDetails[i].inventory > 0) {
              isAvailable = true;
            }
            productProductDetails.push({
              _id: relatedProductDetails[i]._id,
              details: relatedProductDetails[i].details,
              isAvailable: isAvailable
            });
            const relatedOffers = await Offer.find({
              productDetails: relatedProductDetails[i]._id,
              closedAt: null
            });
            // console.log("relatedOffers", i, relatedOffers);
            if (relatedOffers.length > 0) {
              for (let j = 0; j < relatedOffers.length; j++) {
                productOffers.push(relatedOffers[j]);
              }
            }
          }
          // console.log("productOffers", productOffers);
          // console.log("productProductDetails", productProductDetails);
          // console.log("product", product);

          res.status(200).json({
            product,
            productDetails: productProductDetails,
            productLikes: productLikes.length,
            productOffers: productOffers.length,
            user,
            userLikes,
            userOffers
          });
        }
      }
    } catch (error) {
      res.json(error.message);
    }
  }
);

// to be checked
// router.post("/update-product/:productId", async (req, res) => {
//   try {
//     const productToModify = await Product.findById(req.params.productId);
//     if (req.fields.name) {
//       productToModify.name = req.fields.name;
//     }

//     if (req.fields.description) {
//       productToModify.description = req.fields.description;
//     }

//     if (req.fields.floorPrice) {
//       productToModify.floorPrice = req.fields.floorPrice;
//     }

//     cloudinary.config({
//       cloud_name: process.env.CLOUDINARY_NAME,
//       api_key: process.env.CLOUDINARY_KEY,
//       api_secret: process.env.CLOUDINARY_SECRET
//     });

//     if (req.files.file.path) {
//       let imageUrl;
//       await cloudinary.v2.uploader.upload(
//         req.files.file.path,
//         (error, result) => {
//           if (error) {
//             res.json({ message: "upload error" });
//           } else {
//             console.log("result", result);
//             imageUrl = result.secure_url;
//           }
//         }
//       );
//       productToModify.image = imageUrl;
//     }

//     await productToModify.save();

//     res
//       .status(200)
//       .json({ message: "product updated", product: productToModify });
//   } catch (error) {
//     res.json(error.message);
//   }
// });

module.exports = router;
