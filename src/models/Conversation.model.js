const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    lecturer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lecturer",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
  },
  { timestamps: true }
);

// One conversation per student–lecturer–course triple
conversationSchema.index({ student: 1, lecturer: 1, course: 1 }, { unique: true });
conversationSchema.index({ student: 1, updatedAt: -1 });
conversationSchema.index({ lecturer: 1, updatedAt: -1 });

module.exports = mongoose.model("Conversation", conversationSchema);
