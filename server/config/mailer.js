const nodemailer = require('nodemailer');

// ─── Transporter ──────────────────────────────────────────────────────────────
// FIX: Do NOT mix `service` with `host`/`port` — use explicit host/port/secure.
// FIX: Use port 587 + secure:false (STARTTLS) — works on all cloud platforms.
//      Port 465 + secure:true (SSL) fails on Render/Railway because they
//      resolve the host as localhost when `service` is also set.
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',  // Always hardcoded — do not read from env
  port: 587,               // STARTTLS — most reliable on cloud platforms
  secure: false,           // Must be false for port 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // 16-char Gmail App Password (remove spaces)
  },
  pool: true,
  maxConnections: 3,
  maxMessages: 50,
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
  tls: {
    rejectUnauthorized: true,
  },
});

// ─── Generate 6-digit OTP ─────────────────────────────────────────────────────
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ─── Send OTP email ───────────────────────────────────────────────────────────
const sendOTPEmail = async (toEmail, otp, name = 'User') => {
  const expiryTime = new Date(Date.now() + 10 * 60000).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const mailOptions = {
    from: `MedAI <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'MedAI — Your Email Verification Code',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      </head>
      <body style="margin:0;padding:0;background:#f4f4f4;font-family:'Helvetica Neue',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 20px;">
          <tr>
            <td align="center">
              <table width="520" cellpadding="0" cellspacing="0" style="background:#0d1a16;border-radius:16px;overflow:hidden;">
                <tr>
                  <td style="background:linear-gradient(135deg,#0a2018,#0d2a1f);padding:32px 40px;text-align:center;border-bottom:1px solid #1e3d2c;">
                    <p style="margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:0.14em;color:#4d7a61;font-weight:600;">Medical AI Platform</p>
                    <h1 style="margin:0;font-size:30px;color:#e8f5ef;font-weight:400;letter-spacing:-0.5px;">Med<span style="color:#22c55e;">AI</span></h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:36px 40px;">
                    <p style="margin:0 0 6px;font-size:15px;color:#8aad9b;">Hello, <strong style="color:#e8f5ef;">${name}</strong> 👋</p>
                    <h2 style="margin:0 0 14px;font-size:22px;color:#e8f5ef;font-weight:500;">Verify your email address</h2>
                    <p style="margin:0 0 28px;font-size:14px;color:#8aad9b;line-height:1.7;">
                      Use the 6-digit code below to complete your MedAI registration.
                      This code expires in <strong style="color:#e8f5ef;">10 minutes</strong>.
                    </p>
                    <div style="background:#112218;border:2px solid #264d37;border-radius:14px;padding:30px;text-align:center;margin-bottom:28px;">
                      <p style="margin:0 0 10px;font-size:11px;text-transform:uppercase;letter-spacing:0.14em;color:#4d7a61;font-weight:600;">Your Verification Code</p>
                      <p style="margin:0;font-size:44px;font-weight:700;letter-spacing:12px;color:#22c55e;font-family:'Courier New',Courier,monospace;">${otp}</p>
                      <p style="margin:12px 0 0;font-size:12px;color:#4d7a61;">Expires at <strong style="color:#8aad9b;">${expiryTime}</strong></p>
                    </div>
                    <div style="background:#0a1a0f;border:1px solid #1e3d2c;border-radius:8px;padding:14px 16px;">
                      <p style="margin:0;font-size:12px;color:#4d7a61;line-height:1.7;">
                        🔒 <strong style="color:#8aad9b;">Security notice:</strong> Never share this code with anyone.
                        MedAI will never ask for your OTP via phone or chat.
                        If you did not create an account, please ignore this email.
                      </p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 40px;border-top:1px solid #1e3d2c;text-align:center;">
                    <p style="margin:0;font-size:11px;color:#4d7a61;line-height:1.6;">
                      © ${new Date().getFullYear()} MedAI &nbsp;·&nbsp; For educational purposes only<br/>
                      Not a substitute for professional medical advice
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
  console.log(`📧  Mailer → smtp.gmail.com:587 as ${process.env.EMAIL_USER}`);
  try {
    await transporter.verify();
    console.log('✅  Nodemailer ready — Gmail SMTP connected');
  } catch (err) {
    console.error('⚠️  Nodemailer connection failed:');
    console.error(`    Code   : ${err.code}`);
    console.error(`    Message: ${err.message}`);
    console.error('    Fixes  : Check EMAIL_USER and EMAIL_PASS env vars');
    console.error('             App Password must be 16 chars with NO spaces');
  }
};

module.exports = { generateOTP, sendOTPEmail, verifyMailer };