// set up routers
const express = require("express");
const router = express.Router();

// import models
const Offer = require("../models/Offer");
const Product = require("../models/Product");
const ProductDetails = require("../models/ProductDetails");

const User = require("../models/User");
//const ProductDetail = require("../models/ProductDetails");
const isUserAuthorized = require("../authentication/isUserAuthorized");
const isSimplyConnected = require("../authentication/isSimplyConnected");
const isAdminAuthorized = require("../authentication/isAdminAuthorized");

// return all offers of a user by Id

router.get("/offer/find-all", isAdminAuthorized, async (req, res) => {
  try {
    const offers = await Offer.find()
      .populate("productDetails")
      .populate("product")
      .populate("user");
    return res.status(200).json(offers);
  } catch (error) {
    res.json(error.message);
  }
});
router.get("/offer/user/:id", async (req, res) => {
  try {
    const id = req.params.id;
    // check if _id is a valid id parameter in MongoDB
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400).json({ message: `${id} is not a valid Id parameter` });
    } else {
      const offers = await Offer.find({ user: id, closedAt: null });
      //   console.log(likes);
      res.status(200).json(offers);
    }
  } catch (error) {
    res.json(error.message);
  }
});

// return all offer of a user from user token if user is connected
router.get("/offer/user", isSimplyConnected, async (req, res) => {
  try {
    const user = req.user;
    const id = user._id;
    const offers = await Offer.find({ user: id, closedAt: null });
    //   console.log(likes);
    res.status(200).json(offers);
  } catch (error) {
    res.json(error.message);
  }
});

// number of offers for a  product
router.get("/offer/product/:id", async (req, res) => {
  try {
    const id = req.params.id;
    // check if _id is a valid id parameter in MongoDB
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400).json({ message: `${id} is not a valid Id parameter` });
    } else {
      // find product with id and then find all related productDetails
      const product = await Product.findById(id);
      const relatedProductDetails = await ProductDetails.find({
        product
      });
      // console.log("relatedProductDetails", relatedProductDetails);

      let offersNum = 0;
      for (let i = 0; i < relatedProductDetails.length; i++) {
        // offers on teh related productDetails
        const offers = await Offer.find({
          productDetails: relatedProductDetails[i],
          closedAt: null
        });
        // console.log("offers", offers.length);
        offersNum = offersNum + offers.length;
        // console.log(offersNum);
      }
      res.status(200).json({ product, offers: offersNum });
    }
  } catch (error) {
    res.json(error.message);
  }
});

// create an offer with the productDetails Id
router.post(
  "/offer/create/:productDetailId",
  isUserAuthorized,
  async (req, res) => {
    try {
      const productDetailId = req.params.productDetailId;
      // test if there is a productDetails with id
      if (!productDetailId.match(/^[0-9a-fA-F]{24}$/)) {
        res
          .status(400)
          .json({ message: `${productDetailId} is not a valid Id parameter` });
      } else {
        const productDetailById = await ProductDetails.findById(
          productDetailId
        );
        if (!productDetailById) {
          res
            .status(400)
            .json({ message: `No productDetails with id ${productDetailId}` });
        } else {
          // test if there are already offer by the user on the same product

          // get product related to productDetails
          const product = await Product.findById(productDetailById.product);
          // console.log(product);
          // get offers by the user for this product that are not closed
          const getOffersByUser = await Offer.find({
            product,
            user: req.user,
            closedAt: null
          });

          // console.log(getOffersByUser);

          if (getOffersByUser.length == 0) {
            const NewOffer = new Offer({
              user: req.user._id,
              productDetails: productDetailId,
              product: productDetailById.product._id,
              offeredPrice: req.fields.offeredPrice,
              closedAt: null
            });
            await NewOffer.save();
            res.status(200).json(NewOffer);
          } else {
            res.status(400).json({
              message: "you have already made an offer on this product"
            });
          }
        }
      }
    } catch (error) {
      res.json(error.message);
    }
  }
);

// get all info about and related to an offer
router.get("/offer/complete-info/:_id", isUserAuthorized, async (req, res) => {
  try {
    // _id is the id of the offer
    const offerId = req.params._id;
    // console.log(offerId);

    // check if _id is a valid id parameter in MongoDB
    if (!offerId.match(/^[0-9a-fA-F]{24}$/)) {
      res
        .status(400)
        .json({ message: `${offerId} is not a valid Id parameter` });
    } else {
      const offer = await Offer.findById(offerId);
      const user = await User.findById(req.user._id);

      // console.log(">>", user._id.toString());
      // console.log(">>", offer.user.toString());

      if (user._id.toString() !== offer.user.toString()) {
        res.status(401).json({ message: "Unauthorized" });
      } else {
        const productDetails = await ProductDetails.findById(
          offer.productDetails
        );
        const product = await Product.findById(offer.product);
        const isAvailable = productDetails.inventory > 0;

        res.status(200).json({
          offer,
          user,
          productDetails: {
            _id: productDetails._id,
            details: productDetails.details,
            isAvailable
          },
          product
        });
      }
    }
  } catch (error) {
    res.json(error.message);
  }
});

// close an offer by Id and by putting new Date in closedAt
router.post("/offer/close/:productId", isUserAuthorized, async (req, res) => {
  try {
    const productId = req.params.productId;
    if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
      res
        .status(400)
        .json({ message: `${productId} is not a valid Id parameter` });
    } else {
      const productDetails = await ProductDetails.find({
        product: productId
      });
      let offerSelected = [];
      for (let i = 0; i < productDetails.length; i++) {
        const offer = await Offer.findOne({
          productDetails: productDetails[i],
          user: req.user,
          closedAt: null
        });

        if (offer) {
          offerSelected = offer;
        }
      }
      if (offerSelected.closedAt == null) {
        offerSelected.closedAt = new Date();
        await offerSelected.save();
        res.status(200).json(offerSelected);
      } else {
        res.status(200).json({ message: "offer has already been closed" });
      }
    }
  } catch (error) {
    res.json(error.message);
  }
});

// modify an offer
router.post("/offer/update/:productId", isUserAuthorized, async (req, res) => {
  try {
    const productId = req.params.productId;
    console.log("hello world");
    if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
      res
        .status(400)
        .json({ message: `${productId} is not a valid Id parameter` });
    } else {
      const productDetails = await ProductDetails.find({
        product: productId
      });
      let offerSelected = [];
      for (let i = 0; i < productDetails.length; i++) {
        const offer = await Offer.findOne({
          productDetails: productDetails[i],
          user: req.user
        });

        if (offer) {
          offerSelected = offer;
        }
      }

      const productDetailsArray = await ProductDetails.find({
        product: productId
      });

      let newProductDetail = [];

      for (let i = 0; i < productDetailsArray.length; i++) {
        if (productDetailsArray[i]._id == req.fields.detailsId) {
          newProductDetail = productDetailsArray[i];
        }
      }

      offerSelected.offeredPrice = req.fields.offeredPrice;
      offerSelected.productDetails = newProductDetail;

      await offerSelected.save();

      res.status(200).json(offerSelected);
    }
  } catch (error) {
    res.json(error.message);
  }
});

// return offer of a user on a product by id ?
router.post(
  "/offer/information/:productId",
  isUserAuthorized,
  async (req, res) => {
    try {
      const productId = req.params.productId;

      if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
        res
          .status(400)
          .json({ message: `${productId} is not a valid Id parameter` });
      } else {
        const productDetailsArray = await ProductDetails.find({
          product: productId
        });

        let selectedOffer = [];
        for (let i = 0; i < productDetailsArray.length; i++) {
          const offer = await Offer.findOne({
            productDetails: productDetailsArray[i],
            user: req.user
          });

          if (offer) {
            console.log(offer);
            console.log("offer has been seen");
            selectedOffer = offer;
          }
        }

        res.json(selectedOffer);
      }
    } catch (error) {
      res.json(error.message);
    }
  }
);

// return all info related to an offer (product, productDetails and user) from offer id
router.get("/offer/complete-info/:_id", isUserAuthorized, async (req, res) => {
  try {
    // _id is the id of the offer
    const offerId = req.params._id;
    // check if _id is a valid id parameter in MongoDB
    if (!offerId.match(/^[0-9a-fA-F]{24}$/)) {
      res
        .status(400)
        .json({ message: `${offerId} is not a valid Id parameter` });
    } else {
      const offer = await Offer.findById(offerId);
      const user = await User.findById(req.user._id);

      if (user._id.toString() !== offer.user.toString()) {
        res.status(401).json("Unauthorized");
      } else {
        const productDetails = await ProductDetails.findById(
          offer.productDetails
        );
        const product = await Product.findById(offer.product);
        const isAvailable = productDetails.inventory > 0;

        res.status(200).json({
          offer,
          user,
          productDetails: {
            _id: productDetails._id,
            details: productDetails.details,
            isAvailable
          },
          product
        });
      }
    }
  } catch (error) {
    res.json(error.message);
  }
});

module.exports = router;
