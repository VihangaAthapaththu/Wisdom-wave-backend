const MaterialRepository = require("../repositories/material.repository");
const StudentRepository = require("../repositories/student.repository");
const LecturerRepository = require("../repositories/lecturer.repository");
const Course = require("../models/Course.model");
const AppError = require("../utils/AppError");

const materialRepository = new MaterialRepository();
const studentRepository = new StudentRepository();
const lecturerRepository = new LecturerRepository();

class MaterialService {
  async _assertCourseAccess(courseId, user) {
    const course = await Course.findById(courseId);
    if (!course) throw new AppError("Course not found.", 404);

    if (user.role === "ADMIN") return course;

    if (user.role === "LECTURER") {
      const lecturer = await lecturerRepository.findByUserId(user._id);
      const owns = lecturer?.courses.some((id) => id.toString() === courseId.toString());
      if (!owns) throw new AppError("You are not assigned to this course.", 403);
      return course;
    }

    if (user.role === "STUDENT") {
      const student = await studentRepository.findByUserId(user._id);
      const enrolled = student?.enrolledCourses.some((id) => id.toString() === courseId.toString());
      if (!enrolled) throw new AppError("You must be enrolled to access course materials.", 403);
      return course;
    }

    throw new AppError("Forbidden.", 403);
  }

  async getMaterials(courseId, user) {
    await this._assertCourseAccess(courseId, user);
    return await materialRepository.findByCourse(courseId);
  }

  async addMaterial(courseId, { title, fileUrl }, user) {
    if (user.role === "STUDENT") throw new AppError("Forbidden.", 403);
    await this._assertCourseAccess(courseId, user);

    if (!title || !fileUrl) throw new AppError("Title and fileUrl are required.", 400);

    return await materialRepository.create({ course: courseId, title, fileUrl });
  }

  async deleteMaterial(courseId, materialId, user) {
    if (user.role === "STUDENT") throw new AppError("Forbidden.", 403);
    await this._assertCourseAccess(courseId, user);

    const material = await materialRepository.findById(materialId);
    if (!material) throw new AppError("Material not found.", 404);
    if (material.course.toString() !== courseId.toString())
      throw new AppError("Material does not belong to this course.", 400);

    await materialRepository.delete(materialId);
  }
}

module.exports = new MaterialService();
