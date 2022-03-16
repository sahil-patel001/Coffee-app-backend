const mongoose = require("mongoose");

const coffeeSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    subType: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      description: "Number is required"
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Coffee", coffeeSchema)
