const mongoose = require("mongoose");

const orderSchema = mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    coffee_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    coupon_id: {
      type: mongoose.Schema.Types.ObjectId,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    discountedAmount: {
      type: Number,
    },
    paidAmount: {
      type: Number,
      require: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CoffeeOrder", orderSchema);
