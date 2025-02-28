const jwt = require("jsonwebtoken");
const User = require("../models/users");
const tokenSecret = process.env.TOKEN_SECRET;

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    const decoded = jwt.verify(token, tokenSecret);
    const user = await User.findOne({
      _id: decoded._id,
      "tokens.token": token,
    });
    console.log(user);
    if (!user) {
      throw new Error();
    }
    req.user = user;
    req.token = token;
    next();
  } catch (e) {
    res.status(401).send({ error: "Please authenticate" });
  }
};

module.exports = auth;
