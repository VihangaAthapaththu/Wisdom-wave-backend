const CourseMaterial = require("../models/CourseMaterial.model");

class MaterialRepository {
  async create(data) {
    return await CourseMaterial.create(data);
  }

  async findByCourse(courseId) {
    return await CourseMaterial.find({ course: courseId }).sort({ createdAt: -1 });
  }

  async findById(id) {
    return await CourseMaterial.findById(id);
  }

  async delete(id) {
    return await CourseMaterial.findByIdAndDelete(id);
  }
}

module.exports = MaterialRepository;
