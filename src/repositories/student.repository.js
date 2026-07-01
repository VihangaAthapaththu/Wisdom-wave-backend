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
   * Find a student by user reference, creating the profile if it is missing.
   * Self-heals orphaned STUDENT users (e.g. seeded/legacy accounts created
   * before registration atomically created a Student document), which is the
   * root cause of the "Student profile not found" enrollment error.
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async findOrCreateByUserId(userId) {
    let student = await this.findByUserId(userId);
    if (!student) {
      // upsert-style create; guard against a race creating a duplicate
      try {
        await Student.create({ user: userId });
      } catch (err) {
        // ignore duplicate-key races — another request created it first
        if (err?.code !== 11000) throw err;
      }
      student = await this.findByUserId(userId);
    }
    return student;
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
