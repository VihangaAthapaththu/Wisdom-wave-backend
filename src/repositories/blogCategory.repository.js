const BlogCategory = require("../models/BlogCategory.model");

class BlogCategoryRepository {
  async findAll() {
    return await BlogCategory.find().sort({ name: 1 });
  }

  async findById(id) {
    return await BlogCategory.findById(id);
  }

  async findBySlug(slug) {
    return await BlogCategory.findOne({ slug });
  }

  async create(data) {
    return await BlogCategory.create(data);
  }

  async update(id, data) {
    return await BlogCategory.findByIdAndUpdate(id, data, { returnDocument: "after", runValidators: true });
  }

  async delete(id) {
    return await BlogCategory.findByIdAndDelete(id);
  }
}

module.exports = BlogCategoryRepository;
