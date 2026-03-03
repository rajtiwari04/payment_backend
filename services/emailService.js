const sgMail = require("@sendgrid/mail");

if (!process.env.SENDGRID_API_KEY) {
  console.error("SENDGRID_API_KEY is missing");
} else {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const sendOtpEmail = async (toEmail, rawOtp, orderId) => {
  console.log("sendOtpEmail called");
  console.log("Sending OTP to:", toEmail);

  if (!toEmail || !rawOtp) {
    throw new Error("sendOtpEmail: toEmail and rawOtp are required.");
  }

  const msg = {
    to: toEmail,
    from: {
      email: process.env.SENDER_EMAIL,
      name: "Payment Security"
    },
    subject: "Your Payment OTP – Do Not Share",
    text: `
Your One-Time Password (OTP) for payment verification is:

${rawOtp}

Order Reference: ${orderId || "N/A"}

This OTP is valid for 5 minutes.
Do NOT share this code with anyone.

If you did not initiate this payment, contact support immediately.
    `.trim(),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 32px;">
        <h2>Payment OTP Verification</h2>
        <p>Use the OTP below to complete your payment.</p>
        <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 24px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px;">
            ${rawOtp}
          </span>
        </div>
        <p><strong>Order Ref:</strong> ${orderId || "N/A"}</p>
        <p><strong>Valid for:</strong> 5 minutes</p>
        <hr/>
        <p style="font-size: 12px;">
          Do NOT share this OTP with anyone.
        </p>
      </div>
    `
  };

  try {
    const response = await sgMail.send(msg);
    console.log("SendGrid SUCCESS:", response[0].statusCode);
    return true;
  } catch (error) {
    console.error("SendGrid ERROR STATUS:", error.code);
    console.error("SendGrid ERROR BODY:", error.response?.body);
    console.error("SendGrid FULL ERROR:", error);
    throw new Error("Failed to send OTP email");
  }
};

module.exports = { sendOtpEmail };
