const Payment = require("../models/Payment.model");

class PaymentRepository {
  async create(paymentData) {
    return await Payment.create(paymentData);
  }

  async findById(id) {
    return await Payment.findById(id)
      .populate("student", "user")
      .populate("course", "title fee");
  }

  async findAll() {
    return await Payment.find()
      .populate({ path: "student", populate: { path: "user", select: "name email" } })
      .populate("course", "title fee")
      .sort({ date: -1 });
  }

  async findByStudent(studentId) {
    return await Payment.find({ student: studentId })
      .populate("course", "title fee")
      .sort({ date: -1 });
  }

  async update(id, updateData) {
    return await Payment.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .populate({ path: "student", populate: { path: "user", select: "name email" } })
      .populate("course", "title fee");
  }
}

module.exports = PaymentRepository;
