const BlogTemplate = require("../models/BlogTemplate.model");

class BlogTemplateRepository {
  async findAll() {
    return await BlogTemplate.find()
      .sort({ createdAt: -1 })
      .populate("category", "name slug")
      .populate("createdBy", "name");
  }

  async findById(id) {
    return await BlogTemplate.findById(id)
      .populate("category", "name slug")
      .populate("createdBy", "name");
  }

  async create(data) {
    return await BlogTemplate.create(data);
  }

  async update(id, data) {
    return await BlogTemplate.findByIdAndUpdate(id, data, { returnDocument: "after", runValidators: true });
  }

  async delete(id) {
    return await BlogTemplate.findByIdAndDelete(id);
  }
}

module.exports = BlogTemplateRepository;
