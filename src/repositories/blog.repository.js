const Blog = require("../models/Blog.model");

class BlogRepository {
  async create(data) {
    return await Blog.create(data);
  }

  async findById(id) {
    return await Blog.findById(id)
      .populate("author", "name role createdAt")
      .populate("category", "name slug")
      .populate("template", "title");
  }

  async findBySlug(slug) {
    return await Blog.findOne({ slug, status: "PUBLISHED" })
      .populate("author", "name role createdAt")
      .populate("category", "name slug");
  }

  async findPublished({ page = 1, limit = 12, category, search } = {}) {
    const filter = { status: "PUBLISHED" };
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
      ];
    }

    return await Blog.find(filter)
      .sort({ publishedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("author", "name role")
      .populate("category", "name slug");
  }

  async countPublished({ category, search } = {}) {
    const filter = { status: "PUBLISHED" };
    if (category) filter.category = category;
    if (search) {
      filter.$or = [{ title: { $regex: search, $options: "i" } }];
    }
    return await Blog.countDocuments(filter);
  }

  async findByAuthor(userId) {
    return await Blog.find({ author: userId })
      .sort({ createdAt: -1 })
      .populate("category", "name slug");
  }

  async findPending() {
    return await Blog.find({ status: "PENDING" })
      .sort({ updatedAt: -1 })
      .populate("author", "name email role")
      .populate("category", "name slug");
  }

  async findAll({ page = 1, limit = 20 } = {}) {
    return await Blog.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("author", "name role")
      .populate("category", "name slug");
  }

  async update(id, data) {
    return await Blog.findByIdAndUpdate(id, data, { returnDocument: "after", runValidators: true });
  }

  async delete(id) {
    return await Blog.findByIdAndDelete(id);
  }

  async incrementViewCount(id) {
    return await Blog.findByIdAndUpdate(id, { $inc: { viewCount: 1 } }, { returnDocument: "after" });
  }

  async findRelated(blogId, categoryId, limit = 3) {
    return await Blog.find({
      status: "PUBLISHED",
      category: categoryId,
      _id: { $ne: blogId },
    })
      .limit(limit)
      .select("title slug excerpt readTime publishedAt featuredImageUrl")
      .populate("author", "name")
      .populate("category", "name slug");
  }
}

module.exports = BlogRepository;
