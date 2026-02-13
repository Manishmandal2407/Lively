import { resendClient, sender } from "../lib/resend.js";
import { createWelcomeEmailTemplate } from "../emails/emailTemplates.js";

export const sendWelcomeEmail = async (email, name, clientURL) => {
  try {
    if (!email || !name) {
      throw new Error("Email and name are required");
    }

    const response = await resendClient.emails.send({
      from: `${sender.name} <${sender.email}>`,
      to: email,
      subject: "Welcome to Lively!",
      html: createWelcomeEmailTemplate(name, clientURL),
    });

    if (response.error) {
      console.error("Resend API Error:", response.error);
      throw new Error(response.error.message || "Email sending failed");
    }

    console.log("Welcome email sent successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error in sendWelcomeEmail:", error.message);
    throw error;
  }
};
