import config from "../config";
import nodemailer from "nodemailer";
const sendEmail = async (
  to: string,
  subject: string,
  html: string,
  text?: string
) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.hostinger.com",
      secure: true,
      port: 465,
      auth: {
        user: config.emailSender.email,
        pass: config.emailSender.app_pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: `"Spotless Kleen" <${config.emailSender.email}>`,
      to,
      subject,
      html,
      text,
    };

    const res = await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log("❌ Failed to send email:", error);
  }
};

export default sendEmail;
