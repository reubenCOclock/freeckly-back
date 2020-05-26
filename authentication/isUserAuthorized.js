const User = require("../models/User");
const isUserAuthorized = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      res.status(401).json({ message: "no token given" });
    } else {
      const token = req.headers.authorization.replace("Bearer ", "");
      // console.log("token", token);
      const findUser = await User.findOne({ token: token });
      // console.log("email", findUser.email);
      if (!findUser) {
        res.status(401).json({ message: "unauthorized" });
      } else {
        // add user details in req
        req.user = findUser;
        next();
      }
    }
  } catch (error) {
    res.status(400).json(error.message);
  }
};

module.exports = isUserAuthorized;
