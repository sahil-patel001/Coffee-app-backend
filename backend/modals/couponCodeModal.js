const mongoose = require("mongoose");

const couponCodeSchema = mongoose.Schema(
  {
    couponCode: {
      type: String,
      require: true,
    },
    userCount: {
      type: Number,
      require: true,
    },
    percentage: {
      type: Number,
      require: true,
    },
    expireDate: {
      type: Date,
      require: true,
    },
    isActive: {
      type: Boolean,
      require: true,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CouponCode", couponCodeSchema);
