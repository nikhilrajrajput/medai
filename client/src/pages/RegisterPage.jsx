import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye, EyeOff, Stethoscope, AlertCircle,
  CheckCircle2, Mail, RefreshCw, ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

/* ─── Responsive styles ────────────────────────────────────────────────────── */
const css = `
  .reg-root {
    min-height: 100vh;
    display: flex;
    background: var(--bg);
  }

  /* Left decorative panel — hidden on mobile, visible on large screens */
  .reg-left {
    display: none;
  }

  /* Right form panel */
  .reg-right {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px 16px;
    min-height: 100vh;
  }

  .reg-form-wrap {
    width: 100%;
    max-width: 420px;
  }

  /* OTP boxes — responsive sizing */
  .otp-box {
    width: 44px;
    height: 52px;
    font-size: 20px;
  }

  /* OTP card padding on mobile */
  .otp-card {
    padding: 24px 20px;
  }

  /* Feature cards — stack on mobile */
  .feature-cards {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  /* Tablet: 640px+ */
  @media (min-width: 640px) {
    .reg-right {
      padding: 40px 32px;
    }
    .reg-form-wrap {
      max-width: 460px;
    }
    .otp-box {
      width: 52px;
      height: 60px;
      font-size: 24px;
    }
    .otp-card {
      padding: 36px 32px;
    }
  }

  /* Desktop: 1024px+ — show left panel */
  @media (min-width: 1024px) {
    .reg-left {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      width: 400px;
      flex-shrink: 0;
      background: var(--surface);
      border-right: 1px solid var(--border);
      padding: 44px 36px;
      position: relative;
      overflow: hidden;
    }
    .reg-right {
      padding: 48px 40px;
    }
    .reg-logo-mobile {
      display: none !important;
    }
  }

  /* Large desktop: 1280px+ */
  @media (min-width: 1280px) {
    .reg-left {
      width: 460px;
      padding: 48px 44px;
    }
  }

  /* Input focus ring */
  .reg-input:focus {
    border-color: var(--green-dim) !important;
    box-shadow: 0 0 0 3px var(--green-glow) !important;
    outline: none;
  }

  /* OTP box focus */
  .otp-digit:focus {
    border-color: var(--green) !important;
    box-shadow: 0 0 0 3px var(--green-glow) !important;
    outline: none;
  }

  /* Submit button loading state */
  .btn-spin {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(0,0,0,0.2);
    border-top-color: #000;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    display: inline-block;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Fade in animation */
  .fade-in {
    animation: fadeUp 0.35s ease forwards;
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* Error banner */
  .err-banner {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 11px 14px;
    border-radius: 10px;
    background: var(--red-dim);
    border: 1px solid rgba(239,68,68,0.3);
    color: var(--red);
    font-size: 13px;
    margin-bottom: 18px;
    line-height: 1.5;
  }

  /* Strength bar */
  .strength-bar {
    height: 3px;
    flex: 1;
    border-radius: 2px;
    transition: background 0.3s;
  }
`;

/* ─── Helpers ───────────────────────────────────────────────────────────────── */
const strengthScore = (pw) => {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
};
const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const strengthColor = ['', '#ef4444', '#f59e0b', '#3b82f6', '#22c55e'];

/* ─── OTP Input ─────────────────────────────────────────────────────────────── */
function OtpInput({ value, onChange, disabled }) {
  const refs = useRef([]);
  const digits = (value + '      ').slice(0, 6).split('');

  const handleKey = (e, idx) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const arr = [...digits.map(d => d.trim())];
      if (arr[idx]) {
        arr[idx] = '';
        onChange(arr.join('').trimEnd());
      } else if (idx > 0) {
        arr[idx - 1] = '';
        onChange(arr.join('').trimEnd());
        refs.current[idx - 1]?.focus();
      }
      return;
    }
    if (!/^\d$/.test(e.key)) return;
    e.preventDefault();
    const arr = [...digits.map(d => d.trim())];
    arr[idx] = e.key;
    onChange(arr.join('').trimEnd());
    if (idx < 5) refs.current[idx + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted);
    refs.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '10px 0' }}>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const filled = digits[i]?.trim();
        return (
          <input
            key={i}
            ref={el => (refs.current[i] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digits[i]?.trim() || ''}
            onKeyDown={e => handleKey(e, i)}
            onPaste={handlePaste}
            onChange={() => {}}
            onClick={() => refs.current[i]?.select()}
            disabled={disabled}
            className="otp-digit otp-box"
            style={{
              textAlign: 'center',
              fontWeight: 700,
              background: filled ? 'rgba(34,197,94,0.08)' : 'var(--surface2)',
              border: `2px solid ${filled ? 'var(--green)' : 'var(--border)'}`,
              borderRadius: 12,
              color: 'var(--text)',
              fontFamily: 'monospace',
              transition: 'border-color 0.15s, background 0.15s',
              opacity: disabled ? 0.5 : 1,
              cursor: disabled ? 'not-allowed' : 'text',
            }}
          />
        );
      })}
    </div>
  );
}

/* ─── Feature card list (left panel) ───────────────────────────────────────── */
const FEATURES = [
  { icon: '💊', t: 'Medication database',    d: 'Dosage, interactions & precautions' },
  { icon: '🧬', t: 'Report analysis',        d: 'Gemini AI reads your medical reports' },
];

/* ─── Main Component ────────────────────────────────────────────────────────── */
export default function RegisterPage() {
  const { register, verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();

  const [step,  setStep]  = useState('form');
  const [email, setEmail] = useState('');

  const [form,    setForm]    = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const [otp,        setOtp]        = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError,   setOtpError]   = useState('');
  const [timer,      setTimer]      = useState(60);
  const [canResend,  setCanResend]  = useState(false);

  const pwStr = strengthScore(form.password);

  useEffect(() => {
    if (step !== 'otp') return;
    setTimer(60);
    setCanResend(false);
    const iv = setInterval(() => setTimer(t => {
      if (t <= 1) { clearInterval(iv); setCanResend(true); return 0; }
      return t - 1;
    }), 1000);
    return () => clearInterval(iv);
  }, [step]);

  const handleChange = e => {
    setError('');
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      setError('Please fill in all fields.'); return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.'); return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.'); return;
    }
    setLoading(true);
    try {
      const result = await register(form.name, form.email, form.password, form.confirmPassword);
      if (result.success) {
        setEmail(form.email);
        setStep('otp');
        toast.success('OTP sent! Check your email inbox.');
      } else {
        setError(result.message || 'Registration failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (otp.trim().length < 6) { setOtpError('Please enter all 6 digits.'); return; }
    setOtpError('');
    setOtpLoading(true);
    try {
      const result = await verifyOtp(email, otp);
      if (result.success) {
        toast.success('Email verified! Welcome to MedAI 🎉');
        navigate('/dashboard');
      } else {
        setOtpError(result.message || 'Invalid OTP.');
        setOtp('');
      }
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Verification failed.');
      setOtp('');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    try {
      await resendOtp(email);
      toast.success('New OTP sent!');
      setTimer(60);
      setCanResend(false);
      setOtp('');
      setOtpError('');
      const iv = setInterval(() => setTimer(t => {
        if (t <= 1) { clearInterval(iv); setCanResend(true); return 0; }
        return t - 1;
      }), 1000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP.');
    }
  };

  /* ── Shared logo ── */
  const Logo = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 34, height: 34, borderRadius: 9,
        background: 'rgba(34,197,94,0.15)',
        border: '1px solid rgba(34,197,94,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Stethoscope size={15} color="var(--green)" />
      </div>
      <span style={{ fontFamily: 'serif', fontSize: 20, color: 'var(--text)' }}>MedAI</span>
    </div>
  );

  /* ── OTP Step ── */
  if (step === 'otp') {
    return (
      <>
        <style>{css}</style>
        <div style={{
          minHeight: '100vh', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          padding: '24px 16px', background: 'var(--bg)',
        }}>
          <div style={{ width: '100%', maxWidth: 420 }} className="fade-in">
            <div style={{ marginBottom: 24 }}><Logo /></div>

            <div
              className="otp-card"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 20,
              }}
            >
              {/* Shield icon */}
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: 'rgba(34,197,94,0.1)',
                border: '1px solid rgba(34,197,94,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 18,
              }}>
                <ShieldCheck size={26} color="var(--green)" />
              </div>

              <h2 style={{ fontFamily: 'serif', fontSize: 24, color: 'var(--text)', margin: '0 0 8px' }}>
                Verify your email
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text2)', margin: '0 0 4px' }}>
                We sent a 6-digit code to
              </p>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--green)', margin: '0 0 24px', wordBreak: 'break-all' }}>
                {email}
              </p>

              <OtpInput
                value={otp}
                onChange={v => { setOtp(v); setOtpError(''); }}
                disabled={otpLoading}
              />

              <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text3)', marginTop: 6 }}>
                Check your inbox and spam folder
              </p>

              {otpError && (
                <div className="err-banner" style={{ marginTop: 14, marginBottom: 0 }}>
                  <AlertCircle size={14} style={{ flexShrink: 0 }} />
                  {otpError}
                </div>
              )}

              <button
                onClick={handleVerify}
                disabled={otpLoading || otp.trim().length < 6}
                style={{
                  marginTop: 18, width: '100%', padding: '13px 20px',
                  background: 'var(--green)', color: '#000',
                  border: 'none', borderRadius: 10, cursor: otpLoading || otp.trim().length < 6 ? 'not-allowed' : 'pointer',
                  fontWeight: 600, fontSize: 14, fontFamily: 'var(--font, inherit)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  opacity: otp.trim().length < 6 ? 0.4 : 1,
                  transition: 'opacity 0.15s',
                }}
              >
                {otpLoading
                  ? <><span className="btn-spin" /> Verifying…</>
                  : <><Mail size={15} /> Verify Email</>}
              </button>

              {/* Resend */}
              <div style={{ textAlign: 'center', marginTop: 18 }}>
                {canResend ? (
                  <button
                    onClick={handleResend}
                    style={{
                      background: 'none', border: 'none',
                      color: 'var(--green)', cursor: 'pointer',
                      fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    <RefreshCw size={13} /> Resend OTP
                  </button>
                ) : (
                  <p style={{ fontSize: 13, color: 'var(--text3)', margin: 0 }}>
                    Resend in{' '}
                    <strong style={{ color: 'var(--text2)' }}>{timer}s</strong>
                  </p>
                )}
              </div>

              {/* Back */}
              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <button
                  onClick={() => { setStep('form'); setOtp(''); setOtpError(''); }}
                  style={{
                    background: 'none', border: 'none',
                    color: 'var(--text3)', cursor: 'pointer', fontSize: 12,
                  }}
                >
                  ← Change email address
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  /* ── Registration Form ── */
  return (
    <>
      <style>{css}</style>

      <div className="reg-root">

        {/* ── Left panel (desktop only) ── */}
        <div className="reg-left">
          {/* Grid texture */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px)',
            backgroundSize: '36px 36px', opacity: 0.18,
          }} />
          {/* Glow blob */}
          <div style={{
            position: 'absolute', top: '38%', left: '50%',
            transform: 'translate(-50%,-50%)',
            width: 240, height: 240, borderRadius: '50%',
            background: 'rgba(34,197,94,0.05)', filter: 'blur(55px)',
          }} />

          {/* Top: logo + hero text */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ marginBottom: 44 }}><Logo /></div>
            <h1 style={{
              fontFamily: 'serif', fontSize: 40,
              color: 'var(--text)', lineHeight: 1.15, margin: '0 0 16px',
            }}>
              Join<br />
              <em style={{ color: 'var(--green)' }}>MedAI</em><br />
              today
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.8, margin: 0 }}>
              Create your account and get instant access to AI-powered
              medication insights and medical report analysis.
            </p>
          </div>

          {/* Bottom: feature cards */}
          <div className="feature-cards" style={{ position: 'relative', zIndex: 1 }}>
            {FEATURES.map(f => (
              <div
                key={f.t}
                style={{
                  display: 'flex', gap: 12, padding: '10px 14px',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                }}
              >
                <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>{f.icon}</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', margin: 0 }}>{f.t}</p>
                  <p style={{ fontSize: 12, color: 'var(--text3)', margin: '2px 0 0' }}>{f.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right panel: form ── */}
        <div className="reg-right">
          <div className="reg-form-wrap fade-in">

            {/* Mobile-only logo */}
            <div className="reg-logo-mobile" style={{ marginBottom: 28 }}>
              <Logo />
            </div>

            <h2 style={{ fontFamily: 'serif', fontSize: 28, color: 'var(--text)', margin: '0 0 6px' }}>
              Create account
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text2)', margin: '0 0 28px' }}>
              Already have one?{' '}
              <Link to="/login" style={{ color: 'var(--green)', fontWeight: 500 }}>
                Sign in →
              </Link>
            </p>

            {/* Error */}
            {error && (
              <div className="err-banner">
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Full name */}
              <div>
                <label className="section-label" style={{ display: 'block', marginBottom: 6 }}>
                  Full name
                </label>
                <input
                  type="text" name="name" value={form.name}
                  onChange={handleChange} placeholder="Dr. Jane Smith"
                  className="input-field reg-input"
                  autoComplete="name"
                  style={{ width: '100%' }}
                />
              </div>

              {/* Email */}
              <div>
                <label className="section-label" style={{ display: 'block', marginBottom: 6 }}>
                  Email address
                </label>
                <input
                  type="email" name="email" value={form.email}
                  onChange={handleChange} placeholder="jane@hospital.com"
                  className="input-field reg-input"
                  autoComplete="email"
                  style={{ width: '100%' }}
                />
              </div>

              {/* Password */}
              <div>
                <label className="section-label" style={{ display: 'block', marginBottom: 6 }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPw ? 'text' : 'password'}
                    name="password" value={form.password}
                    onChange={handleChange} placeholder="Min. 8 characters"
                    className="input-field reg-input"
                    autoComplete="new-password"
                    style={{ width: '100%', paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(p => !p)}
                    style={{
                      position: 'absolute', right: 12,
                      top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none',
                      cursor: 'pointer', color: 'var(--text3)',
                      display: 'flex', alignItems: 'center',
                      padding: 4,
                    }}
                  >
                    {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {/* Strength meter */}
                {form.password && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                      {[1, 2, 3, 4].map(i => (
                        <div
                          key={i}
                          className="strength-bar"
                          style={{ background: i <= pwStr ? strengthColor[pwStr] : 'var(--border2)' }}
                        />
                      ))}
                    </div>
                    <p style={{ fontSize: 11, color: strengthColor[pwStr], margin: 0 }}>
                      {strengthLabel[pwStr]}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label className="section-label" style={{ display: 'block', marginBottom: 6 }}>
                  Confirm password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    name="confirmPassword" value={form.confirmPassword}
                    onChange={handleChange} placeholder="Re-enter password"
                    className="input-field reg-input"
                    autoComplete="new-password"
                    style={{ width: '100%', paddingRight: 40 }}
                  />
                  {form.confirmPassword && form.password === form.confirmPassword && (
                    <CheckCircle2
                      size={16}
                      color="var(--green)"
                      style={{
                        position: 'absolute', right: 12,
                        top: '50%', transform: 'translateY(-50%)',
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: 4, width: '100%',
                  padding: '13px 20px',
                  background: loading ? 'var(--green-dim)' : 'var(--green)',
                  color: '#000', border: 'none', borderRadius: 10,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: 600, fontSize: 14,
                  fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: 8,
                  transition: 'background 0.15s',
                }}
              >
                {loading
                  ? <><span className="btn-spin" /> Sending OTP…</>
                  : 'Create account & verify email'}
              </button>
            </form>

            <p style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', marginTop: 20 }}>
              By registering you agree to our{' '}
              <span style={{ color: 'var(--text2)' }}>Terms of Service</span>
              {' '}and{' '}
              <span style={{ color: 'var(--text2)' }}>Privacy Policy</span>.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}