const UserRepository = require("../repositories/user.repository");
const StudentRepository = require("../repositories/student.repository");
const AppError = require("../utils/AppError");
const USER_ROLES = require("../enums/userRoles");

const userRepository = new UserRepository();
const studentRepository = new StudentRepository();

class StudentService {
  /**
   * Register a new student profile (admin-only).
   * Creates a User with STUDENT role and a linked Student profile.
   * @param {Object} param0 - { name, email, password, phone?, address? }
   * @returns {Promise<Object>} Student with populated user
   */
  async registerStudent({ name, email, password, phone, address }) {
    const emailExists = await userRepository.existsByEmail(email);

    if (emailExists) {
      throw new AppError("An account with this email already exists.", 409);
    }

    const user = await userRepository.create({
      name,
      email,
      password,
      role: USER_ROLES.STUDENT,
    });

    const student = await studentRepository.create({
      user: user._id,
      phone: phone || "",
      address: address || "",
    });

    return await studentRepository.findById(student._id);
  }

  /**
   * Get all students with populated user data.
   * @returns {Promise<Array>}
   */
  async getAllStudents() {
    return await studentRepository.findAll();
  }

  /**
   * Get a student by ID.
   * @param {string} studentId
   * @returns {Promise<Object>}
   */
  async getStudentById(studentId) {
    const student = await studentRepository.findById(studentId);

    if (!student) {
      throw new AppError("Student not found.", 404);
    }

    return student;
  }

  /**
   * Get student profile by user ID.
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async getStudentByUserId(userId) {
    const student = await studentRepository.findByUserId(userId);

    if (!student) {
      throw new AppError("Student profile not found.", 404);
    }

    return student;
  }

  /**
   * Update a student profile and/or user name.
   * @param {string} studentId
   * @param {Object} updateData - { name?, phone?, address? }
   * @returns {Promise<Object>}
   */
  async updateStudent(studentId, updateData) {
    const student = await studentRepository.findById(studentId);

    if (!student) {
      throw new AppError("Student not found.", 404);
    }

    if (updateData.name) {
      await userRepository.findById(student.user._id);
      const User = require("../models/User.model");
      await User.findByIdAndUpdate(student.user._id, { name: updateData.name });
    }

    const studentUpdate = {};

    if (updateData.phone !== undefined) {
      studentUpdate.phone = updateData.phone;
    }

    if (updateData.address !== undefined) {
      studentUpdate.address = updateData.address;
    }

    if (Object.keys(studentUpdate).length > 0) {
      return await studentRepository.update(studentId, studentUpdate);
    }

    return await studentRepository.findById(studentId);
  }

  /**
   * Deactivate a student account.
   * @param {string} studentId
   * @returns {Promise<Object>}
   */
  async deactivateStudent(studentId) {
    const student = await studentRepository.findById(studentId);

    if (!student) {
      throw new AppError("Student not found.", 404);
    }

    const User = require("../models/User.model");
    await User.findByIdAndUpdate(student.user._id, { isActive: false });

    return await studentRepository.findById(studentId);
  }
}

module.exports = new StudentService();
