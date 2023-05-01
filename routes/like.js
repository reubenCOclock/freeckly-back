const express = require("express");
const router = express.Router();

const Offer = require("../models/Offer");
const User = require("../models/User");
const Like = require("../models/Like");
const ProductDetail = require("../models/ProductDetails");
const Product = require("../models/Product");
const isUserAuthorized = require("../authentication/isUserAuthorized");
const isSimplyConnected = require("../authentication/isSimplyConnected");

router.post("/like/add/:productId", isUserAuthorized, async (req, res) => {
  try {
    console.log("Just testing for git, that's all!");
    const productId = req.params.productId;
    // to check if _id is valid
    if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400).json({ message: `${_id} is not a valid Id parameter` });
    }

    console.log("hello world");
    // find the product for which to like

    const likedProduct = await Product.findById(req.params.productId);

    const userLikes = await Like.find({
      user: req.user,
      product: likedProduct
    });

    if (userLikes.length == 0) {
      const newLike = new Like({
        user: req.user,
        product: likedProduct,
        date: new Date()
      });
      await newLike.save();
      res.status(200).json({ like: newLike });
    } else {
      res.status(200).json({ message: "you have already liked this product" });
    }
  } catch (error) {
    res.json(error.message);
  }
});

// return all likes of a user
router.get("/like/user/:id", async (req, res) => {
  try {
    const id = req.params.id;
    // check if _id is a valid id parameter in MongoDB
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400).json({ message: `${id} is not a valid Id parameter` });
    } else {
      const likes = await Like.find({ user: id });
      //   console.log(likes);
      res.status(200).json(likes);
    }
  } catch (error) {
    res.json(error.message);
  }
});

// return all likes of a user from user token if user is connected
router.get("/like/user", isSimplyConnected, async (req, res) => {
  try {
    const user = req.user;
    console.log("user", user);
    const id = user._id;
    console.log("id", id);
    const likes = await Like.find({ user: id });
    //   console.log(likes);
    res.status(200).json(likes);
  } catch (error) {
    res.json(error.message);
  }
});

// number of likes for a  product
router.get("/like/product/:id", async (req, res) => {
  try {
    const id = req.params.id;
    // check if _id is a valid id parameter in MongoDB
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400).json({ message: `${id} is not a valid Id parameter` });
    } else {
      const product = await Product.findById(id);
      const likes = await Like.find({ product: id });
      //   console.log(likes);
      res.status(200).json({ product, likes: likes.length });
    }
  } catch (error) {
    res.json(error.message);
  }
});

router.post("/like/delete/:productId", isUserAuthorized, async (req, res) => {
  try {
    const productId = req.params.productId;
    if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400).json({ message: `${id} is not a valid Id parameter` });
    } else {
      const userLike = await Like.findOne({
        product: productId,
        user: req.user
      });
      console.log(userLike);
      await userLike.remove();
      res.status(200).json({ message: "product removed" });
    }
  } catch (error) {
    res.json(error.message);
  }
});

module.exports = router;
