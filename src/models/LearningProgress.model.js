const mongoose = require("mongoose");

const learningProgressSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student reference is required"],
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course reference is required"],
    },

    materialCompletions: [
      {
        material: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "CourseMaterial",
        },
        completedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    lastAccessedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// One progress record per student per course
learningProgressSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model("LearningProgress", learningProgressSchema);
