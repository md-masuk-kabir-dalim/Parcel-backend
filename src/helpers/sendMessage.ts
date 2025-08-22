// import twilio from "twilio";
// import config from "../config";
// const client = twilio(config.twilio.twilio_id, config.twilio.twilio_token);

// export const sendMessage = async (phoneNumber: string, message: string) => {
//   try {
//     const response = await client.messages.create({
//       body: message,
//       from: config.twilio.twilio_number,
//       to: phoneNumber,
//     });
//     return {
//       success: true,
//       message: "Message sent successfully.",
//       sid: response.sid,
//     };
//   } catch (error: any) {
//     return {
//       success: false,
//       message: "Failed to send message.",
//       error: error.message,
//     };
//   }
// };
