const CouponCode = require("../modals/couponCodeModal");
const asyncHandler = require("express-async-handler");
const voucher_codes = require("voucher-code-generator");
const Joi = require("joi");

const generateCode = asyncHandler(async (req, res) => {
  const { userCount, percentage, expireDate } = req.body;

  // check for all the required fields
  const validation_schema = Joi.object({
    userCount: Joi.number().required(),
    percentage: Joi.number().required(),
    expireDate: Joi.string().required(),
  });

  const result = await validation_schema.validate(req.body);

  if (result.error) {
    return res.status(400).json({
      message: "Invalid Data",
    });
  }

  // generate a coupon code of 6 length for discount
  const code = voucher_codes.generate({
    length: 6,
    count: 1,
    charset: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  });

  // Add a generated coupon code in database
  const generatedCode = await CouponCode.create({
    couponCode: code[0],
    userCount,
    percentage,
    expireDate,
  });

  if (generatedCode) {
    res.status(201).json({
      message: "Coupon code generated successfully..",
      data: generatedCode,
    });
  } else {
    res.status(500);
    throw new Error("Something went wrong");
  }
});

module.exports = { generateCode };
