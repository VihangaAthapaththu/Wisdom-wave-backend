const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: [true, "Assignment is required"],
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student is required"],
    },

    fileUrl: {
      type: String,
      required: [true, "Submission file URL is required"],
    },

    submittedAt: {
      type: Date,
      default: Date.now,
    },

    grade: {
      type: Number,
      min: [0, "Grade must be positive"],
    },

    feedback: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Submission", submissionSchema);
