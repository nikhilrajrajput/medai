const https = require('https');

// ─── Send email via Resend API (HTTPS port 443 — never blocked) ───────────────
// Resend is used instead of Gmail SMTP because cloud platforms (Render free tier,
// Railway, etc.) block outbound ports 465 and 587, causing ETIMEDOUT errors.
// Resend sends over HTTPS which is always open.

const sendEmail = (to, subject, html) => {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      from: process.env.EMAIL_FROM || 'MedAI <onboarding@resend.dev>',
      to,
      subject,
      html,
    });

    const options = {
      hostname: 'api.resend.com',
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Resend API error ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy(new Error('Resend API request timed out'));
    });

    req.write(body);
    req.end();
  });
};

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

  const html = `
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
                    &copy; ${new Date().getFullYear()} MedAI &nbsp;&middot;&nbsp; For educational purposes only<br/>
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
  `;

  await sendEmail(toEmail, 'MedAI — Your Email Verification Code', html);
};

// ─── Verify Resend API key on startup ─────────────────────────────────────────
const verifyMailer = async () => {
  if (!process.env.RESEND_API_KEY) {
    console.error('⚠️  RESEND_API_KEY is not set in environment variables');
    return;
  }

  // Verify by calling Resend's /domains endpoint (lightweight check)
  try {
    await new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.resend.com',
        path: '/domains',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          if (res.statusCode === 200 || res.statusCode === 403) {
            // 200 = valid key with domain access
            // 403 = valid key but no domains configured (still works for sending)
            resolve();
          } else if (res.statusCode === 401) {
            reject(new Error('Invalid RESEND_API_KEY'));
          } else {
            resolve(); // other codes - don't block startup
          }
        });
      });
      req.on('error', reject);
      req.setTimeout(10000, () => req.destroy(new Error('Timeout')));
      req.end();
    });

    console.log('✅  Resend API ready — emails will be sent over HTTPS');
  } catch (err) {
    console.error('⚠️  Resend API check failed:', err.message);
    console.error('    → Make sure RESEND_API_KEY is correct in your env vars');
  }
};

module.exports = { generateOTP, sendOTPEmail, verifyMailer };