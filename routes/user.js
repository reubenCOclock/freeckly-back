// set up routers
const express = require("express");
const router = express.Router();

// import crypto
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");
const _ = require("lodash");

// import models
const User = require("../models/User");

const Offer = require("../models/Offer");

const Purchase = require("../models/Purchase");

// import middleware
const isUserAuthorized = require("../authentication/isUserAuthorized");
const isAdminAuthorized = require("../authentication/isAdminAuthorized");

// signup new user
router.post("/user/sign-up", async (req, res) => {
  try {
    // destructure req.fields to create User and set up token, hash from passwordConfirm and password
    const {
      passwordConfirm,
      password,
      email,
      phoneNumber,
      surName,
      firstName,
      birthDate,
      address,
      address2,
      city,
      zipCode,
      country,
      over18
    } = req.fields;

    // did I put an email ?
    if (!email) {
      res.status(400).json({ message: "email required" });
      // what about password ?
    } else if (!password || password !== passwordConfirm) {
      res.status(400).json({ message: "passwords are not the same" });
    } else {
      // Does email already exist ?
      const emailAlreadyExist = await User.findOne({ email });
      if (emailAlreadyExist) {
        res.status(400).json({ message: "email already exists" });
      } else {
        // Do I have phone number ?
        if (phoneNumber) {
          const phoneNumberExist = await User.findOne({ phoneNumber });
          if (phoneNumberExist) {
            res.status(400).json({ message: "phone already exists" });
          } else {
            // I have phone and its unique
            const salt = password.slice(password.length - 3, password.length);
            const token = uid2(64);
            const hash = SHA256(password + salt).toString(encBase64);
            const newUser = new User({
              email,
              phoneNumber,
              surName,
              firstName,
              birthDate,
              address,
              address2,
              city,
              zipCode,
              country,
              over18,
              token,
              hash
            });
            await newUser.save();
            const response = {
              _id: newUser._id,
              email: newUser.email,
              token: newUser.token
            };
            res.status(200).json(response);
          }
        } else {
          // I dont have phone number
          const salt = password.slice(password.length - 3, password.length);
          const token = uid2(64);
          const hash = SHA256(password + salt).toString(encBase64);
          const newUser = new User({
            email,
            surName,
            firstName,
            birthDate,
            address,
            address2,
            city,
            zipCode,
            country,
            over18,
            token,
            hash
          });
          await newUser.save();
          const response = {
            _id: newUser._id,
            email: newUser.email,
            token: newUser.token
          };
          res.status(200).json(response);
        }
      }
    }
  } catch (error) {
    res.json(error.message);
  }
});

// sign-in existing user
router.post("/user/sign-in", async (req, res) => {
  try {
    const { password, email } = req.fields;
    if (!email) {
      res.status(400).json({ message: "email required" });
    } else {
      const user = await User.findOne({ email });

      if (!user) {
        res.status(400).json({ message: "user not found" });
      } else {
        // salt is the last 3 digits
        const salt = password.slice(password.length - 3, password.length);
        if (SHA256(password + salt).toString(encBase64) === user.hash) {
          res
            .status(200)
            .json({ _id: user._id, token: user.token, email: user.email });
        } else {
          // res.status(401).json({ message: "unauthorized" });
          res.status(401).json({ message: "unauthorized" });
        }
      }
    }
  } catch (error) {
    res.json(error.message);
  }
});

router.post("/user/admin-sign-in", async (req, res) => {
  try {
    const email = req.fields.email;
    const password = req.fields.password;
    const user = await User.findOne({ email: email });
    if (!user) {
      res.status(400).json({ message: "no user found" });
    } else {
      if (user.role == "user") {
        res.status(200).json({ message: "this page is for admins only" });
      }

      if (user.role == "admin") {
        res.status(200).json({ message: "authorized", token: user.token });
      }
    }
  } catch (error) {
    res.json(error.message);
  }
});

// get user by Id
router.get("/user/find/:_id", isUserAuthorized, async (req, res) => {
  try {
    const _id = req.params._id;
    // check if _id is a valid id parameter in MongoDB
    if (!_id.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400).json({ message: `${_id} is not a valid Id parameter` });
    } else {
      const user = await User.findById(_id);
      if (!user) {
        res.status(400).json({ message: `no user with id ${_id}` });
      } else if (user.token !== req.user.token) {
        res.status(401).json({ message: "Unauthorized" });
      } else {
        const response = {
          _id: user._id,
          email: user.email,
          phoneNumber: user.phoneNumber,
          surName: user.surName,
          firstName: user.firstName,
          birthDate: user.birthDate,
          address: user.address,
          address2: user.address2,
          city: user.city,
          zipCode: user.zipCode,
          country: user.country,
          over18: user.over18,
          token: user.token
        };
        res.status(200).json(response);
      }
    }
  } catch (error) {
    res.json(error.message);
  }
});

// update user by Id
router.put("/user/update/:_id", isUserAuthorized, async (req, res) => {
  try {
    const {
      phoneNumber,
      surName,
      firstName,
      birthDate,
      address,
      address2,
      city,
      zipCode,
      country
    } = req.fields;
    const _id = req.params._id;
    // check if _id is a valid id parameter in MongoDB
    if (!_id.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400).json({ message: `${_id} is not a valid Id parameter` });
    } else {
      const user = await User.findById(_id);
      if (!user) {
        res.status(400).json({ message: `no user with id ${_id}` });
      } else {
        if (phoneNumber) {
          const phoneAlreadyExist = await User.findOne({ phoneNumber });
          if (phoneAlreadyExist) {
            res.status(400).json({ message: "phone already exists" });
          } else {
            user.phoneNumber = req.fields.phoneNumber;
          }
        }
        if (surName) {
          user.surName = req.fields.surName;
        }
        if (firstName) {
          user.firstName = req.fields.firstName;
        }
        if (birthDate) {
          user.birthDate = req.fields.birthDate;
        }
        if (address) {
          user.address = req.fields.address;
        }
        if (address2) {
          user.address2 = req.fields.address2;
        }
        if (city) {
          user.city = req.fields.city;
        }
        if (zipCode) {
          user.zipCode = req.fields.zipCode;
        }
        if (country) {
          user.country = req.fields.country;
        }

        await user.save();

        res.status(200).json(user);
      }
    }
  } catch (error) {
    res.json(error.message);
  }
});

// test modularized route
router.get("/test/:_id", async (req, res) => {
  try {
    // require utility function
    const updateById = require("../utility/updateById");

    // set parameters of the request
    const id = req.params._id;
    const body = req.fields;

    const response = await updateById(User, id, body);
    res.status(200).json(response);
  } catch (error) {
    res.json(error.message);
  }
});
router.get("/user/find-all", async (req, res) => {
  try {
    const users = await User.find({ role: "user" });
    res.json(users);
  } catch (error) {
    res.json(error.message);
  }
});

router.get("/user/offers/:id", isAdminAuthorized, async (req, res) => {
  try {
    const userId = req.params.id;
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400).json({ message: `${_id} is not a valid Id parameter` });
    } else {
      const foundUser = await User.findById(userId);
      const userOffers = await Offer.find({ user: userId })
        .populate("user")
        .populate("product");
      res.status(200).json({ user: foundUser, offers: userOffers });
    }
  } catch (error) {
    res.json(error.message);
  }
});

router.get("/user/purchases/:id", isAdminAuthorized, async (req, res) => {
  try {
    const userId = req.params.id;
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400).json({ message: `${_id} is not a valid Id parameter` });
    } else {
      const foundUser = await User.findById(userId);
      const userPurchases = await Purchase.find({ userId: userId })
        .populate("user")
        .populate("product");
      res.status(200).json({ user: foundUser, purchase: userPurchases });
    }
  } catch (error) {
    res.json(error.message);
  }
});

module.exports = router;
