const paymentService = require("../services/payment.service");
const StudentRepository = require("../repositories/student.repository");
const asyncHandler = require("../middlewares/asyncHandler");
const AppError = require("../utils/AppError");

const studentRepository = new StudentRepository();

// Lazy Stripe initializer — reads the env var at call time so dotenv ordering can't break it
let _stripe = null;
function getStripe() {
  if (!_stripe && process.env.STRIPE_SECRET_KEY) {
    const Stripe = require("stripe");
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    console.log("[Stripe] Initialized with key:", process.env.STRIPE_SECRET_KEY.slice(0, 14) + "...");
  }
  if (!_stripe) console.warn("[Stripe] STRIPE_SECRET_KEY is not set — Stripe payments disabled.");
  return _stripe;
}

/**
 * @desc    Create a payment for a paid course
 * @route   POST /api/payments
 * @access  Student only
 */
const createPayment = asyncHandler(async (req, res) => {
  const { courseId, method } = req.body;

  const payment = await paymentService.createPayment(courseId, req.user._id, method);

  // If Stripe is configured and card payments are requested, ensure there is a valid Checkout Session
  const stripe = getStripe();
  if (stripe && (method === "CARD" || method === "STRIPE")) {
    const frontendUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || "http://localhost:5173";
    const successUrl = `${frontendUrl}/payments/success?paymentId=${payment._id}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${frontendUrl}/payments/cancel?paymentId=${payment._id}`;

    let sessionUrl = null;
    let sessionId = payment.stripeSessionId || null;

    // Try to reuse existing open Stripe session (student may be retrying after cancel)
    if (sessionId) {
      try {
        const existing = await stripe.checkout.sessions.retrieve(sessionId);
        if (existing.status === "open") {
          sessionUrl = existing.url;
          console.log(`[Stripe] Reusing existing open session ${sessionId} for payment ${payment._id}`);
        } else {
          console.log(`[Stripe] Existing session ${sessionId} is ${existing.status} — creating new one`);
          sessionId = null;
        }
      } catch (e) {
        console.warn(`[Stripe] Could not retrieve session ${sessionId}:`, e.message);
        sessionId = null;
      }
    }

    // Create a fresh session if needed
    if (!sessionUrl) {
      const currency = process.env.STRIPE_CURRENCY || "usd";
      const unitAmount = Math.round((payment.amount || 0) * 100);
      console.log(`[Stripe] Creating new checkout session for payment ${payment._id}, amount: ${unitAmount} ${currency.toUpperCase()}`);

      let session;
      try {
        session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          mode: "payment",
          line_items: [
            {
              price_data: {
                currency,
                product_data: {
                  name: payment.course?.title || "Course Payment",
                  description: payment.course?.description || undefined,
                },
                unit_amount: unitAmount,
              },
              quantity: 1,
            },
          ],
          metadata: { paymentId: String(payment._id) },
          success_url: successUrl,
          cancel_url: cancelUrl,
        });
      } catch (stripeErr) {
        console.error("[Stripe] Session creation failed:", {
          type: stripeErr.type,
          code: stripeErr.code,
          message: stripeErr.message,
          statusCode: stripeErr.statusCode,
        });
        throw new AppError(
          `Payment gateway error: ${stripeErr.message || "Could not create checkout session."}`,
          502
        );
      }

      try {
        await paymentService.attachStripeSession(payment._id, session.id);
      } catch (err) {
        console.warn("[Stripe] Failed to attach session id:", err.message || err);
      }

      sessionUrl = session.url;
      sessionId = session.id;
      console.log(`[Stripe] Session created: ${sessionId} → ${sessionUrl}`);
    }

    return res.status(200).json({
      status: "success",
      message: "Redirect to payment gateway.",
      data: { payment, sessionUrl, sessionId },
    });
  }

  res.status(201).json({
    status: "success",
    message: "Payment submitted successfully.",
    data: { payment },
  });
});


/**
 * @desc Get a single payment by id. Admins can fetch any payment; students can fetch their own.
 * @route GET /api/payments/:id
 * @access Student | Admin
 */
const getPayment = asyncHandler(async (req, res) => {
  const payment = await paymentService.getPaymentById(req.params.id);
  if (!payment) {
    return res.status(404).json({ status: "fail", message: "Payment not found" });
  }

  // Admins can access everything
  if (req.user.role === "ADMIN") {
    return res.status(200).json({ status: "success", data: { payment } });
  }

  // Students may only access their own payments
  if (req.user.role === "STUDENT") {
    const payerId = payment.student?.user || payment.student;
    const userId = req.user._id || req.user;
    if (String(payerId) !== String(userId)) {
      return res.status(403).json({ status: "fail", message: "Forbidden" });
    }
    return res.status(200).json({ status: "success", data: { payment } });
  }

  return res.status(403).json({ status: "fail", message: "Forbidden" });
});


/**
 * Stripe webhook handler — receives events from Stripe and confirms payments.
 * IMPORTANT: This endpoint must be mounted with express.raw middleware so the
 * raw request body is available for signature verification.
 */
const stripeWebhook = asyncHandler(async (req, res) => {
  const stripe = getStripe();
  if (!stripe) return res.status(400).send("Stripe not configured");

  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the checkout.session.completed event to mark payments as PAID
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const paymentId = session.metadata?.paymentId;
    if (paymentId) {
      try {
        await paymentService.confirmPayment(paymentId);
        console.log(`Payment ${paymentId} confirmed via Stripe webhook`);
      } catch (err) {
        console.error("Failed to confirm payment from webhook:", err);
      }
    }
  }

  res.json({ received: true });
});

/**
 * @desc    Get all payments
 * @route   GET /api/payments
 * @access  Admin only
 */
const getAllPayments = asyncHandler(async (req, res) => {
  const payments = await paymentService.getAllPayments();

  res.status(200).json({
    status: "success",
    results: payments.length,
    data: { payments },
  });
});

/**
 * @desc    Get current student's payments
 * @route   GET /api/payments/mine
 * @access  Student only
 */
const getMyPayments = asyncHandler(async (req, res) => {
  const payments = await paymentService.getStudentPayments(req.user._id);

  res.status(200).json({
    status: "success",
    results: payments.length,
    data: { payments },
  });
});

/**
 * @desc    Confirm a payment (triggers enrollment)
 * @route   PUT /api/payments/:id/confirm
 * @access  Admin only
 */
const confirmPayment = asyncHandler(async (req, res) => {
  const payment = await paymentService.confirmPayment(req.params.id);

  res.status(200).json({
    status: "success",
    message: "Payment confirmed and student enrolled.",
    data: { payment },
  });
});

/**
 * @desc    Mark a payment as failed
 * @route   PUT /api/payments/:id/fail
 * @access  Admin only
 */
const failPayment = asyncHandler(async (req, res) => {
  const payment = await paymentService.failPayment(req.params.id);

  res.status(200).json({
    status: "success",
    message: "Payment marked as failed.",
    data: { payment },
  });
});

/**
 * @desc    Verify a Stripe checkout session and auto-confirm payment (enroll student).
 *          Called by the frontend success page — works without a webhook.
 * @route   POST /api/payments/:id/verify-session
 * @access  Student (own payment) | Admin
 */
const verifySession = asyncHandler(async (req, res) => {
  const stripe = getStripe();
  if (!stripe) return res.status(400).json({ status: "fail", message: "Stripe not configured." });

  const { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ status: "fail", message: "sessionId is required." });

  const paymentId = req.params.id;
  const payment = await paymentService.getPaymentById(paymentId);
  if (!payment) return res.status(404).json({ status: "fail", message: "Payment not found." });

  // Students may only verify their own payments
  if (req.user.role === "STUDENT") {
    const student = await studentRepository.findByUserId(req.user._id);
    if (!student || String(payment.student?._id || payment.student) !== String(student._id)) {
      return res.status(403).json({ status: "fail", message: "Forbidden." });
    }
  }

  // Already confirmed — just return success
  if (payment.status === "PAID") {
    return res.status(200).json({ status: "success", confirmed: true, data: { payment } });
  }

  // Ask Stripe whether the session is paid
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== "paid") {
    return res.status(200).json({ status: "success", confirmed: false, message: "Payment not yet confirmed by Stripe." });
  }

  // Confirm and enroll
  const updated = await paymentService.confirmPayment(paymentId);
  return res.status(200).json({ status: "success", confirmed: true, data: { payment: updated } });
});

module.exports = {
  createPayment,
  getAllPayments,
  getMyPayments,
  getPayment,
  confirmPayment,
  failPayment,
  stripeWebhook,
  verifySession,
};
