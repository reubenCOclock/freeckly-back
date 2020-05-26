const express = require("express");

const router = express.Router();

const ProductDetails = require("../models/ProductDetails");

// import middleware
const isAdminAuthorized = require("../authentication/isAdminAuthorized");

const Product = require("../models/Product.js");

// send a product form id of a productDetail
router.get("/product-details/product/:productDetailId", async (req, res) => {
  try {
    const productDetailId = req.params.productDetailId;
    // console.log(productDetailId);
    const productDetail = await ProductDetails.findById(productDetailId);
    const product = await Product.findById(productDetail.product);
    // console.log(product);
    res.status(200).json({ productDetails: productDetail, product });
  } catch (error) {
    res.json(error.message);
  }
});

// route to be modified if consistency
// create a product-details
router.post(
  "/product-details/new/:productId",
  isAdminAuthorized,
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.productId);

      const productDetailsArray = await ProductDetails.find({
        product: product
      });

      //console.log(productDetailsArray);

      const newProductDetails = new ProductDetails({
        product: product,
        details: req.fields.details,
        initialQuantity: req.fields.initialQuantity,
        inventory: req.fields.initialQuantity,
        numberOfOffers: 0
      });

      await newProductDetails.save();
      console.log("falls in the first condition");
      console.log(newProductDetails);

      res.status(200).json(newProductDetails);
    } catch (error) {
      res.json(error.message);
    }
  }
);

router.post("/product-detail/modify/:productDetailId", async (req, res) => {
  try {
    const productDetail = await ProductDetails.findById(
      req.params.productDetailId
    );

    productDetail.inventory =
      productDetail.inventory + req.fields.initialQuantity;

    await productDetail.save();

    res.json(productDetail);
  } catch (error) {
    res.json(error.message);
  }
});

router.get(
  "/product-detail/is-available/:productDetailId",
  async (req, res) => {
    try {
      const productDetail = await ProductDetails.findById(
        req.params.productDetailId
      );
      if (!productDetail) {
        res.status(400).json({
          message: `no productDetails with id ${req.params.productDetailId}`
        });
      } else {
        let isAvailable = false;
        if (productDetail.inventory > 0) {
          isAvailable = true;
        }

        res.status(200).json({
          _id: productDetail._id,
          details: productDetail.details,
          product: productDetail.product,
          isAvailable
        });
      }
    } catch (error) {
      res.json(error.message);
    }
  }
);

module.exports = router;
