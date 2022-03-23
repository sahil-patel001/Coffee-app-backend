const dotenv = require("dotenv").config();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const asyncHandler = require("express-async-handler");
const User = require("../modals/userModal");
const nodemailer = require("nodemailer");
const path = require("path");
const hbs = require("nodemailer-express-handlebars");
const Joi = require("joi");
const aws = require("aws-sdk");

const region = process.env.AWS_BUCKET_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_KEY;

const s3 = new aws.S3({
  region,
  accessKeyId,
  secretAccessKey,
});

// Register User Method
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, image } = req.body;

  // Check for all fieldss
  const validation_schema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    image: Joi.string(),
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
    image,
  });

  var params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Prefix: "Axcessminiproject/temp",
  };

  await s3.listObjectsV2(params, function (err, data) {
    data.Contents.forEach(async (contetnData) => {
      var copySourceData =
        contetnData.Key.split("/")[contetnData.Key.split("/").length - 1];
      if (copySourceData === image) {
        var copyParams = {
          Bucket: process.env.AWS_BUCKET_NAME,
          CopySource:
            process.env.AWS_BUCKET_NAME + "/Axcessminiproject/temp/" + image,
          Key: "Axcessminiproject/coffeeuser/" + user.id + "/" + image,
        };

        await s3.copyObject(copyParams, async function (copyErr, copyData) {
          if (!copyErr) {
            var deleteParams = {
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: "Axcessminiproject/temp/" + image,
            };

            await s3.deleteObject(deleteParams, function (err, data) {});
          }
        });
      }
    });
  });

  if (user) {
    res.status(201).json({
      message: "User Register Successfully",
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
        user: process.env.USER_EMAIL,
        pass: process.env.USER_PASSWORD,
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
      from: process.env.USER_EMAIL,
      to: email,
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
