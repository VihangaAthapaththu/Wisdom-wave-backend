const asyncHandler = require("../middlewares/asyncHandler");
const { sendEmail } = require("../services/email.service");

/**
 * Escape user-supplied text before embedding it in an HTML email.
 */
const escapeHtml = (str = "") =>
  String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/**
 * Handle a public "Contact us" submission.
 * Emails the message to the site admin. Input is validated by validateContact.
 */
const submitContact = asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body;
  const to = process.env.CONTACT_EMAIL || process.env.EMAIL_USER;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#f59e0b;">New Contact Message</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#374151;">
        <tr><td style="padding:6px 0;"><strong>Name:</strong></td><td>${escapeHtml(name)}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Email:</strong></td><td>${escapeHtml(email)}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Subject:</strong></td><td>${escapeHtml(subject)}</td></tr>
      </table>
      <p style="margin-top:16px;font-size:14px;color:#374151;"><strong>Message:</strong></p>
      <p style="white-space:pre-wrap;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px;font-size:14px;color:#1f2937;">${escapeHtml(message)}</p>
    </div>
  `;

  await sendEmail({
    to,
    subject: `[Contact] ${subject}`,
    html,
    replyTo: email,
  });

  res.status(200).json({
    status: "success",
    message: "Thanks for reaching out! Your message has been sent.",
  });
});

module.exports = { submitContact };
