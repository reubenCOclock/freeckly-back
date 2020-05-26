const User = require("../models/User");

const isConnected = async (req, res, next) => {
  try {
    //if the token retrieved is not empty
    if (req.headers.authorization) {
      const token = req.headers.authorization.replace("Bearer ", "");
      //find the user based on the token
      const findUser = await User.find({ token: token });
      //if the token matches the user
      if (findUser) {
        //create the user object based on this token
        req.user = findUser;
        next();
      } else {
        // throw an invalid token message error
        res.status(401).json({ message: "invalid token" });
      }
      //if there is no token it means there is no user and that a user object doesn't need to be created
    } else {
      next();
    }
  } catch (error) {
    res.json(error.message);
  }
};

module.exports = isConnected;
