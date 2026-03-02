const nodemailer = require("nodemailer");

/**
 * Creates a reusable Nodemailer transporter using Gmail SMTP.
 * Credentials are pulled from environment variables — never hardcoded.
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Use Gmail App Password, NOT your account password
    },
  });
};

/**
 * Sends a payment OTP to the user's registered email address.
 *
 * @param {string} toEmail   - Recipient email (from User model)
 * @param {string} rawOtp    - The plain (un-hashed) OTP to send
 * @param {string} orderId   - Order reference for context in the email
 * @returns {Promise<void>}
 */
const sendOtpEmail = async (toEmail, rawOtp, orderId) => {
  if (!toEmail || !rawOtp) {
    throw new Error("sendOtpEmail: toEmail and rawOtp are required.");
  }

  const transporter = createTransporter();

  const mailOptions = {
    from: `"Payment Security" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Your Payment OTP – Do Not Share",
    text: `
Your One-Time Password (OTP) for payment verification is:

  ${rawOtp}

Order Reference: ${orderId || "N/A"}

This OTP is valid for 5 minutes.
Do NOT share this code with anyone — our team will never ask for it.

If you did not initiate this payment, please contact support immediately.
    `.trim(),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 32px;">
        <h2 style="color: #1a1a1a; margin-bottom: 4px;">Payment OTP Verification</h2>
        <p style="color: #555; font-size: 14px; margin-top: 0;">Use the OTP below to complete your payment.</p>

        <div style="background: #f5f5f5; border-radius: 6px; padding: 20px; text-align: center; margin: 24px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1a1a1a;">${rawOtp}</span>
        </div>

        <table style="width: 100%; font-size: 13px; color: #666;">
          <tr>
            <td><strong>Order Ref:</strong></td>
            <td>${orderId || "N/A"}</td>
          </tr>
          <tr>
            <td><strong>Valid for:</strong></td>
            <td>5 minutes</td>
          </tr>
        </table>

        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #999;">
          ⚠️ Do <strong>NOT</strong> share this OTP with anyone. Our team will never ask for it.<br/>
          If you did not initiate this payment, contact support immediately.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOtpEmail };