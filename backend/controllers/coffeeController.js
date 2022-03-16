const Coffee = require("../modals/coffeeModal");
const CoffeeOrder = require("../modals/coffeOrderModal");
const CouponCode = require("../modals/couponCodeModal");
const Rating = require("../modals/ratingModal");
const asyncHandler = require("express-async-handler");
const Joi = require("joi");
const moment = require("moment");
const ObjectId = require("mongoose").Types.ObjectId;

//! Add coffee functionality
const addCoffee = asyncHandler(async (req, res) => {
  const { name, subType, price } = req.body;

  // check for all the required fields
  const validation_schema = Joi.object({
    name: Joi.string().required(),
    subType: Joi.string().required(),
    price: Joi.number().required(),
  });

  const result = await validation_schema.validate(req.body);

  if (result.error) {
    return res.status(400).json({
      message: "Invalid Data",
    });
  }

  // check if the coffee is already exists
  const coffeeExists = await Coffee.findOne({ name });

  if (coffeeExists) {
    res.status(409);
    throw new Error("Coffee already exists");
  }

  // create coffee
  const coffee = await Coffee.create({
    name,
    subType,
    price,
  });

  if (coffee) {
    res.status(201).json({
      message: "Coffee added successfully..",
      data: {
        name,
        subType,
        price,
      },
    });
  } else {
    res.status(500);
    throw new Error("Something went wrong");
  }
});

//! Order coffee functionality
const orderCoffee = asyncHandler(async (req, res) => {
  const { _id, quantity, couponCode } = req.body;

  // check for all the required fields
  const validation_schema = Joi.object({
    _id: Joi.string().alphanum().required(),
    quantity: Joi.number().required(),
    couponCode: Joi.string(),
  });

  const result = await validation_schema.validate(req.body);

  if (result.error) {
    return res.status(400).json({
      message: "Invalid Data",
    });
  }

  const coffeeInfo = await Coffee.findById({ _id });
  const totalAmount = coffeeInfo.price * quantity;

  if (couponCode) {
    const codeAvailable = await CouponCode.find({ couponCode });

    if (codeAvailable[0]) {
      if (
        codeAvailable[0].userCount !== 0 &&
        codeAvailable[0].isActive !== false
      ) {
        const percentage = codeAvailable[0].percentage;

        const discountedAmount = (totalAmount * percentage) / 100;

        const coffeeOrder = await CoffeeOrder.create({
          user_id: req.user.id,
          coffee_id: _id,
          coupon_id: codeAvailable[0]._id,
          totalAmount,
          discountedAmount,
          paidAmount: totalAmount - discountedAmount,
          quantity,
        });

        if (coffeeOrder) {
          const updateUserCount = await CouponCode.findByIdAndUpdate(
            codeAvailable[0]._id,
            { userCount: codeAvailable[0].userCount - 1 }
          );

          res.status(200).json({
            message: "Order successfully..",
            data: coffeeOrder,
          });
        } else {
          res.status(500);
          throw new Error("Something went wrong");
        }
      } else {
        res.status(410);
        throw new Error("Coupon code is not available more");
      }
    } else {
      res.status(404).json({ message: "Coupon code not exists" });
    }
  } else {
    // create an order
    const coffeeOrder = await CoffeeOrder.create({
      user_id: req.user.id,
      coffee_id: _id,
      coupon_id: null,
      totalAmount,
      discountedAmount: "",
      paidAmount: totalAmount,
      quantity,
    });

    if (coffeeOrder) {
      res.status(200).json({
        message: "Order successfully..",
        data: coffeeOrder,
      });
    } else {
      res.status(500);
      throw new Error("Something went wrong");
    }
  }
});

//! coffee recommanded function
const coffeeRecommandation = asyncHandler(async (req, res) => {
  const result = await CoffeeOrder.aggregate([
    {
      $match: {
        user_id: ObjectId(req.user.id),
      },
    },
    {
      $group: {
        _id: {
          coffee_id: "$coffee_id",
        },
        count: {
          $count: {},
        },
      },
    },
    {
      $sort: {
        count: -1,
      },
    },
    {
      $limit: 3,
    },
  ]);

  let finalRecommandation = [];

  if (result) {
    for (let index = 0; index < result.length; index++) {
      const element = result[index];
      let coffeeData = await Coffee.findById(element._id.coffee_id);
      finalRecommandation.push(coffeeData);
    }

    res.status(200).json({
      message: "Recommended Coffee listed..",
      data: finalRecommandation,
    });
  }
});

//! rate coffee
const rateCoffee = asyncHandler(async (req, res) => {
  const { coffee_id, rating } = req.body;

  // check for all the required fields
  const validation_schema = Joi.object({
    coffee_id: Joi.string().alphanum().required(),
    rating: Joi.number().min(1).max(5).required(),
  });

  const result = await validation_schema.validate(req.body);

  if (result.error) {
    return res.status(400).json({
      message: "Invalid Data",
    });
  }

  const ratingCoffee = await Rating.create({
    coffee_id,
    rating,
    user_id: req.user.id,
  });

  if (ratingCoffee) {
    res.status(200).json({
      message: "Coffee rated successfully..",
      data: ratingCoffee,
    });
  }
});

//! fetch all order by userId
const fetchAllOrder = asyncHandler(async (req, res) => {
  var query = { user_id: req.user.id };

  // find all order given by login user
  const allOrder = await CoffeeOrder.find(query);

  if (allOrder) {
    res.status(200).json({
      message: "All order data",
      data: allOrder,
    });
  } else {
    res.status(500);
    throw new Error("Something went wrong");
  }
});

//! Fetch all coffee
const getAllCoffee = asyncHandler(async (req, res) => {
  const allCoffee = await Coffee.aggregate([
    {
      $lookup: {
        from: "ratings",
        let: {
          id: "$_id",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: ["$coffee_id", "$$id"],
                  },
                ],
              },
            },
          },
        ],
        as: "ratings",
      },
    },
    {
      $addFields: {
        avg_ratings: {
          $divide: [
            {
              $reduce: {
                input: "$ratings",
                initialValue: 0,
                in: {
                  $add: ["$$value", "$$this.rating"],
                },
              },
            },
            {
              $cond: [
                {
                  $ne: [
                    {
                      $size: "$ratings",
                    },
                    0,
                  ],
                },
                {
                  $size: "$ratings",
                },
                1,
              ],
            },
          ],
        },
        total_ratings: {
          $size: "$ratings",
        },
      },
    },
    {
      $project: {
        ratings: 0,
      },
    },
  ]);

  res.status(200).json({
    message: "All coffee display",
    data: allCoffee,
  });
});

module.exports = {
  addCoffee,
  getAllCoffee,
  orderCoffee,
  fetchAllOrder,
  coffeeRecommandation,
  rateCoffee,
};
