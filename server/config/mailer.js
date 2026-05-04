const nodemailer = require('nodemailer');
const dns = require('dns');

// ─── CRITICAL FIX: Force IPv4 DNS resolution ──────────────────────────────────
// Cloud platforms (Render, Railway, Fly.io) resolve smtp.gmail.com to an IPv6
// address (2607:f8b0:...) but their outbound network only supports IPv4.
// This causes: ENETUNREACH <ipv6_address>:587
// Fix: Tell Node.js to always prefer IPv4 when resolving hostnames.
dns.setDefaultResultOrder('ipv4first');

// ─── Transporter ──────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,           // false = STARTTLS on port 587
  family: 4,               // Force IPv4 socket (belt-and-suspenders with dns fix above)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // 16-char Gmail App Password, NO spaces
  },
  pool: true,
  maxConnections: 3,
  maxMessages: 50,
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 20000,
  tls: {
    rejectUnauthorized: false, // Needed on some cloud platforms with strict TLS
    minVersion: 'TLSv1.2',
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

                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#0a2018,#0d2a1f);padding:32px 40px;text-align:center;border-bottom:1px solid #1e3d2c;">
                    <p style="margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:0.14em;color:#4d7a61;font-weight:600;">
                      Medical AI Platform
                    </p>
                    <h1 style="margin:0;font-size:30px;color:#e8f5ef;font-weight:400;letter-spacing:-0.5px;">
                      Med<span style="color:#22c55e;">AI</span>
                    </h1>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:36px 40px;">
                    <p style="margin:0 0 6px;font-size:15px;color:#8aad9b;">
                      Hello, <strong style="color:#e8f5ef;">${name}</strong> 👋
                    </p>
                    <h2 style="margin:0 0 14px;font-size:22px;color:#e8f5ef;font-weight:500;">
                      Verify your email address
                    </h2>
                    <p style="margin:0 0 28px;font-size:14px;color:#8aad9b;line-height:1.7;">
                      Use the 6-digit code below to complete your MedAI registration.
                      This code expires in <strong style="color:#e8f5ef;">10 minutes</strong>.
                    </p>

                    <!-- OTP Box -->
                    <div style="background:#112218;border:2px solid #264d37;border-radius:14px;padding:30px;text-align:center;margin-bottom:28px;">
                      <p style="margin:0 0 10px;font-size:11px;text-transform:uppercase;letter-spacing:0.14em;color:#4d7a61;font-weight:600;">
                        Your Verification Code
                      </p>
                      <p style="margin:0;font-size:44px;font-weight:700;letter-spacing:12px;color:#22c55e;font-family:'Courier New',Courier,monospace;">
                        ${otp}
                      </p>
                      <p style="margin:12px 0 0;font-size:12px;color:#4d7a61;">
                        Expires at <strong style="color:#8aad9b;">${expiryTime}</strong>
                      </p>
                    </div>

                    <!-- Warning -->
                    <div style="background:#0a1a0f;border:1px solid #1e3d2c;border-radius:8px;padding:14px 16px;">
                      <p style="margin:0;font-size:12px;color:#4d7a61;line-height:1.7;">
                        🔒 <strong style="color:#8aad9b;">Security notice:</strong>
                        Never share this code with anyone. MedAI will never ask for your OTP
                        via phone or chat. If you did not create an account, ignore this email.
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
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
  console.log(`📧  Mailer → smtp.gmail.com:587 (IPv4) as ${process.env.EMAIL_USER}`);
  try {
    await transporter.verify();
    console.log('✅  Nodemailer ready — Gmail SMTP connected via IPv4');
  } catch (err) {
    console.error('⚠️  Nodemailer connection failed:');
    console.error(`    Code   : ${err.code}`);
    console.error(`    Message: ${err.message}`);
    console.error('    Check  : EMAIL_USER set correctly in env vars?');
    console.error('    Check  : EMAIL_PASS is 16 chars with NO spaces?');
    console.error('    Check  : Gmail App Password enabled (not 2FA login password)?');
    // Do not crash the server — emails may still work at send time
  }
};

module.exports = { generateOTP, sendOTPEmail, verifyMailer };