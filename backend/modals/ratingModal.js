const mongoose = require("mongoose");

const ratingModal = mongoose.Schema(
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
    rating: {
        type: Number,
        require: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Rating", ratingModal)