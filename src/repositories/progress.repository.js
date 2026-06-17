const LearningProgress = require("../models/LearningProgress.model");

class ProgressRepository {
  async findByStudentAndCourse(studentId, courseId) {
    return await LearningProgress.findOne({ student: studentId, course: courseId });
  }

  async findAllByStudent(studentId) {
    return await LearningProgress.find({ student: studentId });
  }

  async upsertMaterialCompletion(studentId, courseId, materialId) {
    return await LearningProgress.findOneAndUpdate(
      { student: studentId, course: courseId },
      {
        $addToSet: { materialCompletions: { material: materialId, completedAt: new Date() } },
        $set: { lastAccessedAt: new Date() },
      },
      { upsert: true, returnDocument: "after" }
    );
  }

  async removeMaterialCompletion(studentId, courseId, materialId) {
    return await LearningProgress.findOneAndUpdate(
      { student: studentId, course: courseId },
      {
        $pull: { materialCompletions: { material: materialId } },
        $set: { lastAccessedAt: new Date() },
      },
      { returnDocument: "after" }
    );
  }

  async touchLastAccessed(studentId, courseId) {
    return await LearningProgress.findOneAndUpdate(
      { student: studentId, course: courseId },
      { $set: { lastAccessedAt: new Date() } },
      { upsert: true, returnDocument: "after" }
    );
  }
}

module.exports = ProgressRepository;
