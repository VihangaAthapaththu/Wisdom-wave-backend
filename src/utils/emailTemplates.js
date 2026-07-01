const BASE_STYLE = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #f8f9fa; margin: 0; padding: 0;
`;

const card = (content) => `
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;
    overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#FFA500,#f59e0b);padding:28px 32px;">
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">Wisdom Wave</h1>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Learning Management System</p>
    </div>
    <div style="padding:32px;">
      ${content}
    </div>
    <div style="background:#f8f9fa;padding:16px 32px;text-align:center;border-top:1px solid #eee;">
      <p style="margin:0;font-size:12px;color:#999;">© 2026 Wisdom Wave. All rights reserved.</p>
    </div>
  </div>
`;

const cta = (url, label) => `
  <a href="${url}" style="display:inline-block;margin-top:24px;padding:12px 28px;
    background:linear-gradient(135deg,#FFA500,#f59e0b);color:#fff;text-decoration:none;
    border-radius:8px;font-weight:600;font-size:14px;">${label}</a>
`;

function assignmentPublishedEmail({ studentName, courseName, assignmentTitle, dueDate, lecturerName, ctaUrl }) {
  const formatted = dueDate ? new Date(dueDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "No due date";
  return {
    subject: `New Assignment: ${assignmentTitle}`,
    html: `<body style="${BASE_STYLE}">${card(`
      <p style="margin:0 0 8px;color:#374151;font-size:15px;">Hi <strong>${studentName}</strong>,</p>
      <p style="color:#6b7280;font-size:14px;margin:0 0 24px;">A new assignment has been published in <strong>${courseName}</strong>.</p>
      <div style="background:#fff8ed;border:1px solid #fde68a;border-radius:8px;padding:16px 20px;margin-bottom:8px;">
        <p style="margin:0 0 6px;font-size:13px;color:#92400e;font-weight:600;text-transform:uppercase;letter-spacing:.5px;">Assignment</p>
        <p style="margin:0;font-size:18px;font-weight:700;color:#1f2937;">${assignmentTitle}</p>
      </div>
      <table style="width:100%;margin-top:16px;font-size:13px;color:#4b5563;">
        <tr><td style="padding:6px 0;"><strong>Course:</strong></td><td>${courseName}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Instructor:</strong></td><td>${lecturerName || "—"}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Due Date:</strong></td><td style="color:#dc2626;font-weight:600;">${formatted}</td></tr>
      </table>
      ${cta(ctaUrl, "View Assignment")}
    `)}</body>`,
  };
}

function deadlineReminderEmail({ studentName, courseName, assignmentTitle, dueDate, daysLeft, ctaUrl }) {
  const formatted = dueDate ? new Date(dueDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "—";
  const urgency = daysLeft <= 1 ? "#dc2626" : daysLeft <= 3 ? "#d97706" : "#2563eb";
  const urgencyText = daysLeft === 0 ? "Due TODAY" : daysLeft === 1 ? "Due TOMORROW" : `Due in ${daysLeft} days`;
  return {
    subject: `⏰ Deadline Reminder: ${assignmentTitle} — ${urgencyText}`,
    html: `<body style="${BASE_STYLE}">${card(`
      <p style="margin:0 0 8px;color:#374151;font-size:15px;">Hi <strong>${studentName}</strong>,</p>
      <p style="color:#6b7280;font-size:14px;margin:0 0 24px;">This is a reminder about an upcoming deadline in <strong>${courseName}</strong>.</p>
      <div style="background:#fff8ed;border:2px solid ${urgency};border-radius:8px;padding:16px 20px;margin-bottom:8px;">
        <p style="margin:0 0 4px;font-size:13px;color:#92400e;font-weight:600;text-transform:uppercase;">Assignment</p>
        <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#1f2937;">${assignmentTitle}</p>
        <span style="background:${urgency};color:#fff;font-size:12px;font-weight:700;padding:4px 10px;border-radius:20px;">${urgencyText}</span>
      </div>
      <table style="width:100%;margin-top:16px;font-size:13px;color:#4b5563;">
        <tr><td style="padding:6px 0;"><strong>Course:</strong></td><td>${courseName}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Due Date:</strong></td><td style="color:${urgency};font-weight:600;">${formatted}</td></tr>
      </table>
      ${cta(ctaUrl, "Submit Assignment")}
    `)}</body>`,
  };
}

function assignmentUpdatedEmail({ studentName, courseName, assignmentTitle, dueDate, changeDescription, ctaUrl }) {
  const formatted = dueDate ? new Date(dueDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "—";
  return {
    subject: `Assignment Updated: ${assignmentTitle}`,
    html: `<body style="${BASE_STYLE}">${card(`
      <p style="margin:0 0 8px;color:#374151;font-size:15px;">Hi <strong>${studentName}</strong>,</p>
      <p style="color:#6b7280;font-size:14px;margin:0 0 24px;">An assignment in <strong>${courseName}</strong> has been updated.</p>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px 20px;margin-bottom:8px;">
        <p style="margin:0 0 6px;font-size:13px;color:#1e40af;font-weight:600;text-transform:uppercase;">Assignment</p>
        <p style="margin:0;font-size:18px;font-weight:700;color:#1f2937;">${assignmentTitle}</p>
      </div>
      ${changeDescription ? `<p style="margin:16px 0 0;font-size:14px;color:#374151;"><strong>What changed:</strong> ${changeDescription}</p>` : ""}
      <table style="width:100%;margin-top:16px;font-size:13px;color:#4b5563;">
        <tr><td style="padding:6px 0;"><strong>Course:</strong></td><td>${courseName}</td></tr>
        <tr><td style="padding:6px 0;"><strong>New Due Date:</strong></td><td style="color:#dc2626;font-weight:600;">${formatted}</td></tr>
      </table>
      ${cta(ctaUrl, "View Assignment")}
    `)}</body>`,
  };
}

function passwordResetEmail({ name, ctaUrl }) {
  return {
    subject: "Reset your Wisdom Wave password",
    html: `<body style="${BASE_STYLE}">${card(`
      <p style="margin:0 0 8px;color:#374151;font-size:15px;">Hi <strong>${name || "there"}</strong>,</p>
      <p style="color:#6b7280;font-size:14px;margin:0 0 8px;">We received a request to reset your password. Click the button below to choose a new one.</p>
      <p style="color:#6b7280;font-size:13px;margin:0 0 4px;">This link expires in 30 minutes. If you didn't request this, you can safely ignore this email — your password won't change.</p>
      ${cta(ctaUrl, "Reset Password")}
      <p style="color:#9ca3af;font-size:12px;margin:24px 0 0;word-break:break-all;">Or paste this link into your browser:<br/>${ctaUrl}</p>
    `)}</body>`,
  };
}

module.exports = { assignmentPublishedEmail, deadlineReminderEmail, assignmentUpdatedEmail, passwordResetEmail };
