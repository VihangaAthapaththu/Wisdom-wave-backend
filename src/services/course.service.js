const CourseRepository = require("../repositories/course.repository");
const LecturerRepository = require("../repositories/lecturer.repository");
const AppError = require("../utils/AppError");

const courseRepository = new CourseRepository();
const lecturerRepository = new LecturerRepository();

class CourseService {
  /**
   * Create a new course. Only admins can create courses and may optionally assign a lecturer.
   */
  async createCourse(courseData, user) {
    const { title, description, duration, fee, lecturer: lecturerId, isPublished } = courseData;

    if (user.role !== "ADMIN") {
      throw new AppError("You do not have permission to create courses.", 403);
    }

    let assignedLecturerId = lecturerId || null;

    if (assignedLecturerId) {
      const lecturerExists = await lecturerRepository.findById(assignedLecturerId);
      if (!lecturerExists) {
        throw new AppError("Lecturer not found.", 404);
      }
    }

    const course = await courseRepository.create({
      title,
      description,
      duration,
      fee,
      lecturer: assignedLecturerId,
      isPublished: !!isPublished,
    });

    if (assignedLecturerId) {
      // Add course reference to lecturer
      await lecturerRepository.update(assignedLecturerId, { $push: { courses: course._id } });
    }

    return course;
  }

  async getAllCourses() {
    return await courseRepository.findAll();
  }

  async getAllPublishedCourses() {
    return await courseRepository.findAllPublished();
  }

  async getCourseById(courseId) {
    const course = await courseRepository.findById(courseId);
    if (!course) throw new AppError("Course not found.", 404);
    return course;
  }

  async getCoursesForLecturerUser(userId) {
    const lecturer = await lecturerRepository.findByUserId(userId);
    if (!lecturer) throw new AppError("Lecturer profile not found.", 404);

    return await courseRepository.findByLecturerId(lecturer._id);
  }

  async updateCourse(courseId, updateData, user) {
    const course = await courseRepository.findById(courseId);
    if (!course) throw new AppError("Course not found.", 404);

    // Permission check
    if (user.role === "LECTURER") {
      const lecturer = await lecturerRepository.findByUserId(user._id);
      if (!lecturer) throw new AppError("Lecturer profile not found.", 404);

      const courseLecturerId = course.lecturer ? (course.lecturer._id || course.lecturer) : null;
      if (!courseLecturerId || String(courseLecturerId) !== String(lecturer._id)) {
        throw new AppError("You do not have permission to update this course.", 403);
      }
    } else if (user.role !== "ADMIN") {
      throw new AppError("You do not have permission to update this course.", 403);
    }

    // Handle lecturer assignment or reassignment
    if (Object.prototype.hasOwnProperty.call(updateData, "lecturer")) {
      const newLecturerId = updateData.lecturer || null;
      const currentLecturerId = course.lecturer ? (course.lecturer._id ? course.lecturer._id : course.lecturer) : null;

      if (!newLecturerId && currentLecturerId) {
        await lecturerRepository.update(currentLecturerId, { $pull: { courses: course._id } });
      } else if (newLecturerId && String(newLecturerId) !== String(currentLecturerId)) {
        const newLecturer = await lecturerRepository.findById(newLecturerId);
        if (!newLecturer) throw new AppError("New lecturer not found.", 404);

        // Remove from old lecturer
        if (currentLecturerId) {
          await lecturerRepository.update(currentLecturerId, { $pull: { courses: course._id } });
        }

        // Add to new lecturer
        await lecturerRepository.update(newLecturerId, { $push: { courses: course._id } });
      }

      updateData.lecturer = newLecturerId;
    }

    const updated = await courseRepository.update(courseId, updateData);
    return updated;
  }

  async deleteCourse(courseId, user) {
    const course = await courseRepository.findById(courseId);
    if (!course) throw new AppError("Course not found.", 404);

    // Permission check
    if (user.role === "LECTURER") {
      const lecturer = await lecturerRepository.findByUserId(user._id);
      if (!lecturer) throw new AppError("Lecturer profile not found.", 404);

      const courseLecturerId = course.lecturer ? (course.lecturer._id || course.lecturer) : null;
      if (!courseLecturerId || String(courseLecturerId) !== String(lecturer._id)) {
        throw new AppError("You do not have permission to delete this course.", 403);
      }
    } else if (user.role !== "ADMIN") {
      throw new AppError("You do not have permission to delete this course.", 403);
    }

    // Remove reference from lecturer if exists
    if (course.lecturer) {
      const lecturerId = course.lecturer._id ? course.lecturer._id : course.lecturer;
      if (lecturerId) {
        await lecturerRepository.update(lecturerId, { $pull: { courses: course._id } });
      }
    }

    const deleted = await courseRepository.delete(courseId);
    return deleted;
  }
}

module.exports = new CourseService();
