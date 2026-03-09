import nodemailer from 'nodemailer';

let transporterPromise = null;

async function getTransporter() {
  if (transporterPromise) return transporterPromise;

  transporterPromise = (async () => {
    if (process.env.SMTP_HOST) {
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
    }
    // Dev fallback: Ethereal test inbox — preview URL is logged, nothing is really sent.
    const test = await nodemailer.createTestAccount();
    console.warn('⚠️  SMTP not configured — using Ethereal test inbox for emails.');
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: { user: test.user, pass: test.pass },
    });
  })();

  return transporterPromise;
}

export async function sendEmail({ to, subject, html }) {
  const transporter = await getTransporter();
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'StorePilot <no-reply@storepilot.app>',
    to,
    subject,
    html,
  });
  const preview = nodemailer.getTestMessageUrl(info);
  if (preview) console.log(`📧 Email preview: ${preview}`);
  return { messageId: info.messageId, preview };
}
