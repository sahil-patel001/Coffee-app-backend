const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const asyncHandler = require("express-async-handler");
const User = require("../modals/userModal");
const nodemailer = require("nodemailer");
const path = require("path");
const hbs = require("nodemailer-express-handlebars");
const Joi = require("joi");

// Register User Method
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Check for all fieldss
  const validation_schema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });

  const result = await validation_schema.validate(req.body);

  if (result.error) {
    return res.status(400).json({
      message: "Invalid Data",
    });
  }

  // check if user exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(409);
    throw new Error("User already exists");
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassward = await bcrypt.hash(password, salt);

  // Create User
  const user = await User.create({
    name,
    email,
    password: hashedPassward,
  });

  if (user) {
    res.status(201).json({
      message: "User Register Suc cessfully",
      data: {
        _id: user.id,
        name: user.name,
        email: user.email,
        token: generateToken(user.id),
      },
    });

    var transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: "user-email",
        pass: "user-password",
      },
    });

    const handlebarOptions = {
      viewEngine: {
        extName: ".handlebars",
        partialsDir: path.resolve("../views"),
        defaultLayout: false,
      },
      viewPath: path.resolve("../Coffee-App/backend/views"),
      extName: ".handlebars",
    };

    transporter.use("compile", hbs(handlebarOptions));

    let mailoption = {
      from: "from-email",
      to: "to-email",
      subject: "Welcome mail from coffee app",
      template: "email",
      // For sending attechments you can use below code
      context: {
        // html: '<img src="cid:uniq-welcomemail" />',
        title: "Welcome to coffee app",
        name: name,
        text: "You have successfully sign up and This is a simple mail template which is use for sending mail on successfully signup by user",
      },
      attachments: [
        {
          filename: "welcomemail.jpeg",
          path: "../Coffee-App/backend/views" + "/welcomemail.jpeg",
          cid: "uniq-welcomemail",
        },
      ],
    };

    transporter.sendMail(mailoption, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
  } else {
    res.status(500);
    throw new Error("Something went wrong");
  }
});

// Login User Method
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check for user email
  const user = await User.findOne({ email });

  if (user && (await bcrypt.compare(password, user.password))) {
    res.status(200).json({
      message: "User Login Successfully",
      data: {
        _id: user.id,
        name: user.name,
        email: user.email,
        token: generateToken(user.id),
      },
    });
  } else {
    res.status(401);
    throw new Error("Invalid credentials");
  }
});

// Generate a token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

module.exports = {
  registerUser,
  loginUser,
};
