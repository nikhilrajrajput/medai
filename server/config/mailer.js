const { Resend } = require('resend');
require('dotenv').config();

// ─── Init Resend ─────────────────────────────
const resend = new Resend(process.env.RESEND_API_KEY);

// ─── Verify Resend Setup ─────────────────────
const verifyMailer = async () => {
  console.log('🔌 Checking Resend configuration...');

  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('Missing RESEND_API_KEY');
    }

    console.log('✅ Resend API key loaded');
  } catch (err) {
    console.error('❌ Resend setup error:', err.message);
  }
};

// ─── Generate OTP ────────────────────────────
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// ─── Send OTP Email ──────────────────────────
const sendOTPEmail = async (toEmail, otp, name = 'User') => {
  try {
    console.log(`📤 Sending email to ${toEmail}...`);

    const response = await resend.emails.send({
      from: process.env.EMAIL_FROM,
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
                    <p style="margin:0 0 8px;font-size:12px;color:#4d7a61;">Medical AI Platform</p>
                    <h1 style="margin:0;font-size:28px;color:#e8f5ef;">
                      Med<span style="color:#22c55e;">AI</span>
                    </h1>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:36px 40px;">
                    <p style="color:#8aad9b;">Hello, ${name} 👋</p>

                    <h2 style="color:#e8f5ef;">Verify your email address</h2>

                    <p style="color:#8aad9b;">
                      Use the verification code below to complete your registration.
                      This code expires in <strong>10 minutes</strong>.
                    </p>

                    <!-- OTP -->
                    <div style="background:#112218;border:1px solid #264d37;border-radius:12px;padding:28px;text-align:center;margin:20px 0;">
                      <p style="font-size:11px;color:#4d7a61;">Verification Code</p>
                      <p style="font-size:42px;letter-spacing:10px;color:#22c55e;">
                        ${otp}
                      </p>
                    </div>

                    <p style="font-size:12px;color:#4d7a61;">
                      ⚠️ Never share this code with anyone.
                    </p>

                    <p style="font-size:13px;color:#4d7a61;">
                      Expires at:
                      <strong>
                        ${new Date(Date.now() + 10 * 60000).toLocaleTimeString()}
                      </strong>
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding:20px;text-align:center;border-top:1px solid #1e3d2c;">
                    <p style="font-size:11px;color:#4d7a61;">
                      © ${new Date().getFullYear()} MedAI
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
    });

    console.log('✅ Email sent successfully');
    console.log('📧 Message ID:', response.id);

    return true;
  } catch (err) {
    console.error('❌ Email send failed:', err);
    return false;
  }
};

module.exports = {
  verifyMailer,
  generateOTP,
  sendOTPEmail,
};