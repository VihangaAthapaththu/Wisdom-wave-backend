const nodemailer = require("nodemailer");

let transporter;

function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host:   process.env.EMAIL_HOST  || "smtp.ethereal.email",
    port:   Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_PORT === "465",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  return transporter;
}

async function sendEmail({ to, subject, html, replyTo }) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    if (process.env.NODE_ENV !== "production") return; // silently skip in dev if not configured
    throw new Error("Email credentials not configured.");
  }
  try {
    await getTransporter().sendMail({
      from: `"Wisdom Wave" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      ...(replyTo && { replyTo }),
    });
  } catch (err) {
    // Never let email failure crash the main request
    console.error("[Email] Failed to send:", err.message);
  }
}

module.exports = { sendEmail };
