const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Course title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [200, "Title must be at most 200 characters"],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description too long"],
    },

    duration: {
      type: Number, //hours
      min: [0, "Duration must be a positive number"],
      trim: true,
    },

    fee: {
      type: Number,
      min: [0, "Fee must be a positive number"],
      default: 0,
    },

    lecturer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lecturer",
    },

    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Course", courseSchema);
