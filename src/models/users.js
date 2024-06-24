const mongoose = require("mongoose");
const validator = require("validator");
const bycrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Task = require("./tasks");
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minLength: [7, "Length of password must be greater than 6"],
      trim: true,
      validate(value) {
        const cleaned = value.trim().toLowerCase();
        console.log(cleaned);
        if (cleaned.includes("password")) {
          throw new Error('Password cannot contain the word "password"');
        }
      },
    },
    age: {
      type: Number,
      default: 0,
      validate(value) {
        if (value < 0) {
          throw new Error("Age must be a positive number");
        }
      },
    },
    email: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Email is invalid");
        }
      },
    },
    tokens: [
      {
        token: { type: String, required: true },
      },
    ],
    avatar: {
      type: Buffer,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
);

//custom function for User model
userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("Unable to login");
  }
  const isMatch = await bycrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Unable to login");
  }
  return user;
};

const tokenSecret = "superdupersecret";
userSchema.methods.generateAuthToken = async function () {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, tokenSecret, {
    expiresIn: "2 days",
  });
  user.tokens = user.tokens.concat({ token });
  await user.save();
  return token;
};

userSchema.methods.toJSON = function () {
  const user = this;
  const obj = user.toObject();
  delete obj.password;
  delete obj.tokens;
  delete obj.avatar;
  return obj;
};

//relationship between user and task
//populate with any task that has user's _id as their "owner" ref
userSchema.virtual("tasks", {
  ref: "Task",
  localField: "_id",
  foreignField: "owner",
});

//hash the plain text password
userSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password")) {
    user.password = await bycrypt.hash(user.password, 8);
  }
  next();
});

//delete user tasks when user is deleted
userSchema.pre("deleteOne", async function (next) {
  const user = await this.model.findOne(this.getQuery());
  await Task.deleteMany({ owner: user._id });
  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
