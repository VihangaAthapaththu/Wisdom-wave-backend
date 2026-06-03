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

    submissionFileExt: {
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

    feedback: {
      type: String,
      trim: true,
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
studentAssignmentSchema.pre("save", async function () {
  if (!this.isModified("submittedAt") && !this.isModified("assignment") && !this.isModified("status")) return;
  if (!this.submittedAt) return;

  const Assignment = mongoose.model("Assignment");
  const assignmentDoc = await Assignment.findById(this.assignment).select("dueDate");
  if (!assignmentDoc) return;

  this.status = assignmentDoc.dueDate && this.submittedAt > assignmentDoc.dueDate
    ? ASSIGNMENT_STATUS.LATE_SUBMISSION
    : ASSIGNMENT_STATUS.SUBMITTED;
});

// Handle updates via findOneAndUpdate / findByIdAndUpdate
studentAssignmentSchema.pre("findOneAndUpdate", async function () {
  const update = this.getUpdate();
  if (!update) return;

  const submittedAt = update.submittedAt || (update.$set && update.$set.submittedAt);
  let assignmentId = update.assignment || (update.$set && update.$set.assignment);

  if (!submittedAt && !assignmentId) return;

  const Assignment = mongoose.model("Assignment");

  if (!assignmentId) {
    const doc = await this.model.findOne(this.getQuery()).select("assignment");
    assignmentId = doc && doc.assignment;
  }

  if (!assignmentId) return;

  const assignmentDoc = await Assignment.findById(assignmentId).select("dueDate");
  if (!assignmentDoc) return;

  const date = submittedAt ? new Date(submittedAt) : null;
  if (!date) return;

  const isLate = assignmentDoc.dueDate && date > assignmentDoc.dueDate;
  const newStatus = isLate ? ASSIGNMENT_STATUS.LATE_SUBMISSION : ASSIGNMENT_STATUS.SUBMITTED;

  if (update.$set) update.$set.status = newStatus; else update.status = newStatus;
  if (typeof this.setUpdate === "function") this.setUpdate(update);
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
