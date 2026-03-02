const nodemailer = require('nodemailer');

const sendOTPEmail = async (toEmail, otp) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: `"SecurePay" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Your Payment OTP',
    html: `
      <h2>Payment Verification</h2>
      <p>Your OTP is:</p>
      <h1>${otp}</h1>
      <p>This OTP will expire in 5 minutes.</p>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOTPEmail };