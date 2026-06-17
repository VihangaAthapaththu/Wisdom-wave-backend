const mongoose = require("mongoose");

const blogTemplateSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Template title is required"],
      trim: true,
      maxlength: [120, "Title must be at most 120 characters"],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [300, "Description must be at most 300 characters"],
      default: null,
    },

    contentHtml: {
      type: String,
      required: [true, "Template content is required"],
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BlogCategory",
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator is required"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("BlogTemplate", blogTemplateSchema);
