const mongoose = require("mongoose");
const BLOG_STATUS = require("../enums/blogStatus");

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [5, "Title must be at least 5 characters"],
      maxlength: [200, "Title must be at most 200 characters"],
    },

    slug: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      default: null,
    },

    contentHtml: {
      type: String,
      required: [true, "Content is required"],
    },

    excerpt: {
      type: String,
      trim: true,
      maxlength: [500, "Excerpt must be at most 500 characters"],
      default: null,
    },

    featuredImageUrl: {
      type: String,
      default: null,
    },

    featuredImagePublicId: {
      type: String,
      default: null,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BlogCategory",
      default: null,
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author is required"],
    },

    template: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BlogTemplate",
      default: null,
    },

    status: {
      type: String,
      enum: BLOG_STATUS.values,
      default: BLOG_STATUS.DRAFT,
    },

    readTime: {
      type: Number,
      default: 0,
    },

    viewCount: {
      type: Number,
      default: 0,
    },

    moderationNote: {
      type: String,
      default: null,
    },

    publishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

blogSchema.index({ status: 1, publishedAt: -1 });
blogSchema.index({ author: 1, status: 1 });
blogSchema.index({ category: 1, status: 1 });
// slug field already declares unique+sparse — no separate schema.index() needed

// Compute readTime from word count before every save
blogSchema.pre("save", async function () {
  if (this.isModified("contentHtml")) {
    const text = this.contentHtml.replace(/<[^>]+>/g, " ");
    const wordCount = text
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0).length;
    this.readTime = Math.max(1, Math.ceil(wordCount / 200));
  }
});

module.exports = mongoose.model("Blog", blogSchema);
