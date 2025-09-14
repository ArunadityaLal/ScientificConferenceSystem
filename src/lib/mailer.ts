import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

interface MailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function sendMail(options: MailOptions) {
  try {
    const info = await transporter.sendMail({
      from: `"Scientific Portal" <${
        process.env.SMTP_FROM || process.env.SMTP_USER
      }>`,
      ...options,
    });
    console.log("Email sent: ", info.messageId);
    return { ok: true, message: info.messageId };
  } catch (error) {
    console.error("Email send error:", error);
    return { ok: false, error: (error as Error).message || "Unknown error" };
  }
}
