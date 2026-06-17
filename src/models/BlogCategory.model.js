const mongoose = require("mongoose");

const blogCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      unique: true,
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [60, "Name must be at most 60 characters"],
    },

    slug: {
      type: String,
      required: [true, "Slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: [300, "Description must be at most 300 characters"],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// slug field already declares unique: true — no separate schema.index() needed

module.exports = mongoose.model("BlogCategory", blogCategorySchema);
