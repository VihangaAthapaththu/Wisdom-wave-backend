const mongoose = require("mongoose");
const PAYMENT_METHODS = require("../enums/paymentMethods");
const PAYMENT_STATUS = require("../enums/paymentStatus");

const paymentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student is required"],
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course is required"],
    },

    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount must be positive"],
    },

    method: {
      type: String,
      enum: PAYMENT_METHODS.values,
      required: [true, "Payment method is required"],
    },

    status: {
      type: String,
      enum: PAYMENT_STATUS.values,
      default: PAYMENT_STATUS.PENDING,
    },

    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Payment", paymentSchema);
