const Course = require("../models/Course.model");
const Student = require("../models/Student.model");

const LECTURER_POPULATE = { path: "lecturer", populate: { path: "user", select: "name email" } };

/**
 * Data access layer for Course model.
 */
class CourseRepository {
  // Attaches enrollmentCount to each course document by counting how many students
  // have it in their enrolledCourses array. Accepts a single doc or array.
  async _withEnrollmentCounts(courses) {
    const isArray = Array.isArray(courses);
    const list = isArray ? courses : [courses];
    if (!list.length) return isArray ? list : list[0];

    const ids = list.map((c) => c._id);
    const counts = await Student.aggregate([
      { $match: { enrolledCourses: { $in: ids } } },
      { $unwind: "$enrolledCourses" },
      { $match: { enrolledCourses: { $in: ids } } },
      { $group: { _id: "$enrolledCourses", count: { $sum: 1 } } },
    ]);
    const countMap = {};
    counts.forEach((e) => { countMap[String(e._id)] = e.count; });

    const withCounts = list.map((c) => {
      const obj = c.toObject ? c.toObject() : { ...c };
      obj.enrollmentCount = countMap[String(c._id)] || 0;
      return obj;
    });

    return isArray ? withCounts : withCounts[0];
  }

  async create(courseData) {
    return await Course.create(courseData);
  }

  async findAll() {
    const courses = await Course.find().populate(LECTURER_POPULATE);
    return this._withEnrollmentCounts(courses);
  }

  async findAllPublished() {
    const courses = await Course.find({ isPublished: true }).populate(LECTURER_POPULATE);
    return this._withEnrollmentCounts(courses);
  }

  async findById(id) {
    const course = await Course.findById(id).populate(LECTURER_POPULATE);
    if (!course) return null;
    return this._withEnrollmentCounts(course);
  }

  async findByLecturerId(lecturerId) {
    const courses = await Course.find({ lecturer: lecturerId }).populate(LECTURER_POPULATE);
    return this._withEnrollmentCounts(courses);
  }

  async update(id, updateData) {
    const course = await Course.findByIdAndUpdate(id, updateData, {
      returnDocument: "after",
      runValidators: true,
    }).populate(LECTURER_POPULATE);
    if (!course) return null;
    return this._withEnrollmentCounts(course);
  }

  async delete(id) {
    return await Course.findByIdAndDelete(id);
  }
}

module.exports = CourseRepository;
