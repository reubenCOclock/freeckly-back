// just check if there is a token and return user in req.user
// in any case do not block user
const User = require("../models/User");

const isSimplyConnected = async (req, res, next) => {
  try {
    //if the token retrieved is not empty
    if (req.headers.authorization) {
      const token = req.headers.authorization.replace("Bearer ", "");
      //find the user based on the token
      const findUser = await User.findOne({ token: token });
      //if the token matches the user
      if (findUser) {
        //create the user object based on this token
        req.user = findUser;
      }
    }
    next();
  } catch (error) {
    res.json(error.message);
  }
};

module.exports = isSimplyConnected;
