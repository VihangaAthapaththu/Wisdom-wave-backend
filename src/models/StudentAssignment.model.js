const mongoose = require("mongoose");
const ASSIGNMENT_STATUS = require("../enums/assignmentStatus");

const studentAssignmentSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: [true, "Assignment is required"],
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student is required"],
    },

    submissionFileUrl: {
      type: String,
      trim: true,
    },

    submittedAt: {
      type: Date,
    },

    marks: {
      type: Number,
      min: [0, "Marks must be a positive number"],
    },

    status: {
      type: String,
      enum: ASSIGNMENT_STATUS.values,
      default: ASSIGNMENT_STATUS.PENDING,
    }
  },
  {
    timestamps: true,
  }
);

// Unique per student + assignment (one submission record per student per assignment)
studentAssignmentSchema.index({ assignment: 1, student: 1 }, { unique: true });

// Compute and set status on save based on assignment.dueDate
studentAssignmentSchema.pre("save", async function (next) {
  if (!this.isModified("submittedAt") && !this.isModified("assignment") && !this.isModified("status")) return next();

  if (!this.submittedAt) return next();

  try {
    const Assignment = mongoose.model("Assignment");
    const assignmentDoc = await Assignment.findById(this.assignment).select("dueDate");
    if (!assignmentDoc) return next();

    if (assignmentDoc.dueDate && this.submittedAt > assignmentDoc.dueDate) {
      this.status = ASSIGNMENT_STATUS.LATE_SUBMISSION;
    } else {
      this.status = ASSIGNMENT_STATUS.SUBMITTED;
    }

    next();
  } catch (err) {
    next(err);
  }
});

// Handle updates via findOneAndUpdate / findByIdAndUpdate
studentAssignmentSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();
  if (!update) return next();

  const submittedAt = update.submittedAt || (update.$set && update.$set.submittedAt);
  let assignmentId = update.assignment || (update.$set && update.$set.assignment);

  if (!submittedAt && !assignmentId) return next();

  try {
    const Assignment = mongoose.model("Assignment");

    if (!assignmentId) {
      const doc = await this.model.findOne(this.getQuery()).select("assignment");
      assignmentId = doc && doc.assignment;
    }

    if (!assignmentId) return next();

    const assignmentDoc = await Assignment.findById(assignmentId).select("dueDate");
    if (!assignmentDoc) return next();

    const date = submittedAt ? new Date(submittedAt) : null;
    if (!date) return next();

    const isLate = assignmentDoc.dueDate && date > assignmentDoc.dueDate;
    const newStatus = isLate ? ASSIGNMENT_STATUS.LATE_SUBMISSION : ASSIGNMENT_STATUS.SUBMITTED;

    if (update.$set) update.$set.status = newStatus; else update.status = newStatus;
    if (typeof this.setUpdate === "function") this.setUpdate(update);

    next();
  } catch (err) {
    next(err);
  }
});

// Virtual: isLate (available when assignment is populated)
studentAssignmentSchema.virtual("isLate").get(function () {
  if (this.assignment && this.assignment.dueDate) {
    return this.submittedAt && this.submittedAt > this.assignment.dueDate;
  }
  return undefined;
});

studentAssignmentSchema.set("toObject", { virtuals: true });
studentAssignmentSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("StudentAssignment", studentAssignmentSchema);
