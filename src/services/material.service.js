const MaterialRepository = require("../repositories/material.repository");
const StudentRepository = require("../repositories/student.repository");
const LecturerRepository = require("../repositories/lecturer.repository");
const Course = require("../models/Course.model");
const AppError = require("../utils/AppError");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

const materialRepository = new MaterialRepository();
const studentRepository = new StudentRepository();
const lecturerRepository = new LecturerRepository();

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_MIMES = [
  "application/pdf",
];

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
      // Decision: require enrollment to view materials (even for published courses)
      if (!enrolled) throw new AppError("You must be enrolled to access course materials.", 403);
      return course;
    }

    throw new AppError("Forbidden.", 403);
  }

  async getMaterials(courseId, user) {
    await this._assertCourseAccess(courseId, user);
    return await materialRepository.findByCourse(courseId);
  }

  async _validateFile(file) {
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) throw new AppError("File is too large. Maximum allowed size is 50MB.", 400);
    const mimetype = file.mimetype || "";
    const allowed = mimetype.startsWith("image/") || mimetype.startsWith("video/") || mimetype.startsWith("audio/") || ALLOWED_MIMES.includes(mimetype);
    if (!allowed) throw new AppError("Unsupported file type.", 400);
  }

  async _uploadToCloudinary(file, courseId) {
    if (!file || !file.buffer) throw new AppError("Invalid file.", 400);

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    console.log(`[Cloudinary] upload — file: ${file.originalname} (${file.size}B, ${file.mimetype}) | cloud_name: ${cloudName || "MISSING"} | api_key: ${apiKey ? "✓" : "MISSING"} | api_secret: ${apiSecret ? "✓" : "MISSING"}`);

    if (!cloudName || !apiKey || !apiSecret) {
      throw new AppError("Cloudinary is not configured. Check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env.", 500);
    }

    // Build a public_id WITHOUT extension — Cloudinary appends the detected format automatically,
    // so including the extension in public_id produces double extensions like .pdf.pdf
    const timestamp = Date.now();
    const nameNoExt = (file.originalname || "file").replace(/\.[^/.]+$/, "");
    const safeName = nameNoExt.replace(/[^a-zA-Z0-9._-]/g, "_");
    const publicId = `course_materials/${courseId}/${timestamp}-${safeName}`;

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream({ resource_type: "auto", public_id: publicId }, (error, result) => {
        if (error) {
          console.error("[Cloudinary] upload error:", error.message || error);
          return reject(error);
        }
        console.log("[Cloudinary] upload success:", result.secure_url);
        resolve(result);
      });

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  async addMaterial(courseId, { title, fileUrl }, user, file) {
    if (user.role === "STUDENT") throw new AppError("Forbidden.", 403);
    await this._assertCourseAccess(courseId, user);

    if (!title || !title.toString().trim()) throw new AppError("Title is required.", 400);

    let finalUrl = fileUrl;

    if (file) {
      await this._validateFile(file);
      try {
        const uploadResult = await this._uploadToCloudinary(file, courseId);
        finalUrl = uploadResult.secure_url;
      } catch (err) {
        const msg = err.message || "Unknown Cloudinary error";
        console.error("[Material] upload failed:", msg);
        throw new AppError(`Upload failed: ${msg}`, 500);
      }
    } else {
      if (!fileUrl || !fileUrl.toString().trim()) throw new AppError("Either a file upload or fileUrl is required.", 400);
      try {
        new URL(fileUrl);
      } catch (err) {
        throw new AppError("Invalid fileUrl.", 400);
      }
    }

    return await materialRepository.create({ course: courseId, title, fileUrl: finalUrl });
  }

  async deleteMaterial(courseId, materialId, user) {
    if (user.role === "STUDENT") throw new AppError("Forbidden.", 403);
    await this._assertCourseAccess(courseId, user);

    const material = await materialRepository.findById(materialId);
    if (!material) throw new AppError("Material not found.", 404);
    if (material.course.toString() !== courseId.toString())
      throw new AppError("Material does not belong to this course.", 400);

    // Decision: do not delete remote Cloudinary file; only remove DB record
    await materialRepository.delete(materialId);
  }
}

module.exports = new MaterialService();
