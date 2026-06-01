const Course = require("../models/Course.model");

/**
 * Data access layer for Course model.
 */
class CourseRepository {
  async create(courseData) {
    return await Course.create(courseData);
  }

  async findAll() {
    return await Course.find().populate({ path: "lecturer", populate: { path: "user", select: "name email" } });
  }

  async findAllPublished() {
    return await Course.find({ isPublished: true }).populate({ path: "lecturer", populate: { path: "user", select: "name email" } });
  }

  async findById(id) {
    return await Course.findById(id).populate({ path: "lecturer", populate: { path: "user", select: "name email" } });
  }

  async findByLecturerId(lecturerId) {
    return await Course.find({ lecturer: lecturerId }).populate({ path: "lecturer", populate: { path: "user", select: "name email" } });
  }

  async update(id, updateData) {
    return await Course.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate({ path: "lecturer", populate: { path: "user", select: "name email" } });
  }

  async delete(id) {
    return await Course.findByIdAndDelete(id);
  }
}

module.exports = CourseRepository;
