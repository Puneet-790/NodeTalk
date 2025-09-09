const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, html) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail", // or use host/port if using SMTP
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"NodeTalk" <${process.env.EMAIL_USER}>`,
      to: to,   // 👈 make sure this is set
      subject: subject,
      html: html,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Email sent to", to);
  } catch (error) {
    console.error("❌ Email error:", error);
  }
};

module.exports = sendEmail;
