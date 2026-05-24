const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course is required"],
    },

    title: {
      type: String,
      required: [true, "Assignment title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [255, "Title too long"],
    },

    description: {
      type: String,
      trim: true,
    },

    dueDate: {
      type: Date,
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Assignment", assignmentSchema);
