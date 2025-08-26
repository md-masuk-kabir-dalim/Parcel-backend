import axios from "axios";
import config from "../config";

const sendEmail = async (
  to: string,
  subject: string,
  html: string,
  text?: string
) => {
  try {
    const payload = {
      sender: {
        name: "Hi! Your Parcel App",
        email: "masukkabir.dev@gmail.com",
      },
      to: [
        {
          email: to,
        },
      ],
      subject,
      htmlContent: html,
      textContent: text || "This is the plain text version of the email.",
    };
    await axios.post("https://api.brevo.com/v3/smtp/email", payload, {
      headers: {
        "api-key": config.emailSender.app_pass,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.log(error);
  }
};

export default sendEmail;
