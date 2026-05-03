const nodemailer = require('nodemailer');
const dotenv= require('dotenv')

dotenv.config();

// ─── Transporter ──────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  port: process.env.EMAIL_PORT,
  secure: true, // Use true for port 465, false for 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Your 16-character App Password
  },
  pool: true,
  maxConnections: 3,
  maxMessages: 50,

  connectionTimeout: 15000,
  greetingTimeout: 10000,
  socketTimeout: 20000,

  logger: true,
  debug: false,
  tls: {
    // This helps if Render's network has trouble verifying the certificate
    rejectUnauthorized: false
  }
});
// ─── Generate 6-digit OTP ─────────────────────────────────────────────────────
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ─── Send OTP email ───────────────────────────────────────────────────────────
const sendOTPEmail = async (toEmail, otp, name = 'User') => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || `MedAI <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'MedAI — Your Email Verification Code',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      </head>
      <body style="margin:0;padding:0;background:#080f0d;font-family:'Helvetica Neue',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#080f0d;padding:40px 20px;">
          <tr>
            <td align="center">
              <table width="520" cellpadding="0" cellspacing="0" style="background:#0d1a16;border:1px solid #1e3d2c;border-radius:16px;overflow:hidden;">
                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#0a2018,#0d2a1f);padding:32px 40px;text-align:center;border-bottom:1px solid #1e3d2c;">
                    <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;color:#4d7a61;font-weight:600;">Medical AI Platform</p>
                    <h1 style="margin:0;font-size:28px;color:#e8f5ef;font-weight:400;letter-spacing:-0.5px;">Med<span style="color:#22c55e;">AI</span></h1>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding:36px 40px;">
                    <p style="margin:0 0 8px;font-size:14px;color:#8aad9b;">Hello, ${name} 👋</p>
                    <h2 style="margin:0 0 16px;font-size:22px;color:#e8f5ef;font-weight:500;">Verify your email address</h2>
                    <p style="margin:0 0 28px;font-size:14px;color:#8aad9b;line-height:1.7;">
                      Use the verification code below to complete your MedAI registration.
                      This code expires in <strong style="color:#e8f5ef;">10 minutes</strong>.
                    </p>

                    <!-- OTP Box -->
                    <div style="background:#112218;border:1px solid #264d37;border-radius:12px;padding:28px;text-align:center;margin-bottom:28px;">
                      <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#4d7a61;font-weight:600;">Verification Code</p>
                      <p style="margin:0;font-size:42px;font-weight:700;letter-spacing:10px;color:#22c55e;font-family:'Courier New',monospace;">${otp}</p>
                    </div>

                    <div style="background:#0a1a0f;border:1px solid #1e3d2c;border-radius:8px;padding:14px 16px;margin-bottom:24px;">
                      <p style="margin:0;font-size:12px;color:#4d7a61;line-height:1.6;">
                        ⚠️ Never share this code with anyone. MedAI staff will never ask for your OTP.
                        If you didn't create an account, you can safely ignore this email.
                      </p>
                    </div>

                    <p style="margin:0;font-size:13px;color:#4d7a61;">
                      This code will expire at <strong style="color:#8aad9b;">${new Date(Date.now() + 10 * 60000).toLocaleTimeString()}</strong>.
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="padding:20px 40px;border-top:1px solid #1e3d2c;text-align:center;">
                    <p style="margin:0;font-size:11px;color:#4d7a61;">
                      © ${new Date().getFullYear()} MedAI · For educational purposes only · Not a substitute for medical advice
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// ─── Verify transporter on startup ───────────────────────────────────────────
const verifyMailer = async () => {
  console.log('Connecting to host:', process.env.EMAIL_HOST || 'gmail');
  try {
    await transporter.verify();
    console.log('✅ Nodemailer ready');
  } catch (err) {
    console.warn('⚠️ Nodemailer error details:', err);
  }
};
module.exports = { generateOTP, sendOTPEmail, verifyMailer };