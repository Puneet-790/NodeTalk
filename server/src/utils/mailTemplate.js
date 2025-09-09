
const firstTime = (otp) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Verify Your Account</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f9fafb;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: auto;
      background: #ffffff;
      padding: 20px 30px;
      border-radius: 12px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.05);
    }
    h1 {
      color: #111827;
      font-size: 22px;
    }
    p {
      color: #374151;
      font-size: 15px;
    }
    .otp-box {
      font-size: 28px;
      font-weight: bold;
      color: #2563eb;
      text-align: center;
      background: #f3f4f6;
      padding: 14px 0;
      border-radius: 8px;
      margin: 20px 0;
      letter-spacing: 4px;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #9ca3af;
      margin-top: 25px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Welcome to NodeTalk 🎉</h1>
    <p>Hi there,</p>
    <p>Thank you for registering with <strong>NodeTalk</strong>. To complete your sign-up, please verify your account using the OTP below:</p>
    <div class="otp-box">${otp}</div>
    <p>This OTP will expire in 10 minutes. Please do not share it with anyone.</p>
    <p>Cheers,<br/>The NodeTalk Team</p>
    <div class="footer">© 2025 NodeTalk. All rights reserved.</div>
  </div>
</body>
</html>

`;

module.exports = { firstTime };