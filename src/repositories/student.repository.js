const Student = require("../models/Student.model");

/**
 * Data access layer for Student model.
 * All database queries for students go through this repository.
 */
class StudentRepository {
  /**
   * Create a new student profile.
   * @param {Object} studentData - { user, phone?, address?, enrolledCourses? }
   * @returns {Promise<Object>}
   */
  async create(studentData) {
    return await Student.create(studentData);
  }

  /**
   * Find all students with populated user data.
   * @returns {Promise<Array>}
   */
  async findAll() {
    return await Student.find().populate("user", "name email isActive createdAt role");
  }

  /**
   * Find a student by ID with populated user data.
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    return await Student.findById(id).populate("user", "name email isActive createdAt role");
  }

  /**
   * Find a student by user reference.
   * @param {string} userId
   * @returns {Promise<Object|null>}
   */
  async findByUserId(userId) {
    return await Student.findOne({ user: userId })
      .populate("user", "name email isActive createdAt role")
      .populate({
        path: "enrolledCourses",
        populate: {
          path: "lecturer",
          populate: { path: "user", select: "name email" },
        },
      });
  }

  /**
   * Update a student profile.
   * @param {string} id
   * @param {Object} updateData
   * @returns {Promise<Object|null>}
   */
  async update(id, updateData) {
    return await Student.findByIdAndUpdate(id, updateData, {
      returnDocument: "after",
      runValidators: true,
    }).populate("user", "name email isActive createdAt role");
  }

  /**
   * Delete a student profile.
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async delete(id) {
    return await Student.findByIdAndDelete(id);
  }
}

module.exports = StudentRepository;
