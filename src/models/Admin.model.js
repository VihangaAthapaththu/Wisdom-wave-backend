const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

adminSchema.index({ user: 1 }, { unique: true });

module.exports = mongoose.model("Admin", adminSchema);
