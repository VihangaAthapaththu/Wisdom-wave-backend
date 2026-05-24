const mongoose = require("mongoose");

const courseMaterialSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course is required"],
    },

    title: {
      type: String,
      trim: true,
      required: [true, "Title is required"],
    },

    fileUrl: {
      type: String,
      required: [true, "File URL is required"],
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CourseMaterial", courseMaterialSchema);
