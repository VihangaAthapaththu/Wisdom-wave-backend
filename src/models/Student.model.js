const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      unique: true,
    },

    phone: {
      type: String,
      trim: true,
      match: [/^\+?[0-9\s\-]{7,20}$/, "Invalid phone number"],
    },

    address: {
      type: String,
      trim: true,
      maxlength: [250, "Address too long"],
    },

    enrolledCourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
  },
  {
    timestamps: true,
  }
);

studentSchema.index({ user: 1 }, { unique: true });

module.exports = mongoose.model("Student", studentSchema);
