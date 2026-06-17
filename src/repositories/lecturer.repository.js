const Lecturer = require("../models/Lecturer.model");

/**
 * Data access layer for Lecturer model.
 * All database queries for lecturers go through this repository.
 */
class LecturerRepository {
  /**
   * Create a new lecturer profile.
   * @param {Object} lecturerData - { user, specialization }
   * @returns {Promise<Object>}
   */
  async create(lecturerData) {
    return await Lecturer.create(lecturerData);
  }

  /**
   * Find all lecturers with populated user data.
   * @returns {Promise<Array>}
   */
  async findAll() {
    return await Lecturer.find().populate("user", "name email isActive createdAt");
  }

  /**
   * Find a lecturer by ID with populated user data.
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    return await Lecturer.findById(id).populate("user", "name email isActive createdAt");
  }

  /**
   * Find a lecturer by user reference.
   * @param {string} userId
   * @returns {Promise<Object|null>}
   */
  async findByUserId(userId) {
    return await Lecturer.findOne({ user: userId }).populate("user", "name email isActive createdAt");
  }

  /**
   * Update a lecturer's profile.
   * @param {string} id
   * @param {Object} updateData
   * @returns {Promise<Object|null>}
   */
  async update(id, updateData) {
    return await Lecturer.findByIdAndUpdate(id, updateData, {
      returnDocument: "after",
      runValidators: true,
    }).populate("user", "name email isActive createdAt");
  }

  /**
   * Delete a lecturer profile.
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async delete(id) {
    return await Lecturer.findByIdAndDelete(id);
  }
}

module.exports = LecturerRepository;
