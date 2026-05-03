import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Stethoscope, AlertCircle, CheckCircle2, Mail, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

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

// ─── OTP Input Component ──────────────────────────────────────────────────────
function OtpInput({ value, onChange }) {
  const inputs = useRef([]);
  const digits = value.split('');

  const handleKey = (e, idx) => {
    if (e.key === 'Backspace') {
      const next = [...digits];
      if (next[idx]) { next[idx] = ''; onChange(next.join('')); }
      else if (idx > 0) { next[idx - 1] = ''; onChange(next.join('')); inputs.current[idx - 1]?.focus(); }
      return;
    }
    if (!/^\d$/.test(e.key)) return;
    const next = [...digits];
    next[idx] = e.key;
    onChange(next.join(''));
    if (idx < 5) inputs.current[idx + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(text.padEnd(6, '').slice(0, 6));
    const focusIdx = Math.min(text.length, 5);
    inputs.current[focusIdx]?.focus();
  };

  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
      {[0,1,2,3,4,5].map((i) => (
        <input
          key={i}
          ref={(el) => (inputs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i] || ''}
          onKeyDown={(e) => handleKey(e, i)}
          onPaste={handlePaste}
          onChange={() => {}}
          onClick={() => inputs.current[i]?.select()}
          style={{
            width: 48, height: 56,
            textAlign: 'center',
            fontSize: 22, fontWeight: 700,
            background: digits[i] ? 'rgba(34,197,94,0.08)' : 'var(--surface2)',
            border: `2px solid ${digits[i] ? 'var(--green)' : 'var(--border)'}`,
            borderRadius: 10,
            color: 'var(--text)',
            outline: 'none',
            transition: 'all 0.15s',
            fontFamily: 'monospace',
          }}
        />
      ))}
    </div>
  );
}

// ─── Main Register Page ───────────────────────────────────────────────────────
export default function RegisterPage() {
  const { register, verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();

  // Step: 'form' | 'otp'
  const [step, setStep]   = useState('form');
  const [email, setEmail] = useState('');

  // Form state
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // OTP state
  const [otp,         setOtp]         = useState('');
  const [otpLoading,  setOtpLoading]  = useState(false);
  const [otpError,    setOtpError]    = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend,   setCanResend]   = useState(false);

  const pwStrength = strengthScore(form.password);

  // Countdown timer for resend
  useEffect(() => {
    if (step !== 'otp') return;
    setResendTimer(60);
    setCanResend(false);
    const interval = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) { clearInterval(interval); setCanResend(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  const handleChange = (e) => {
    setError('');
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  // Step 1 — Submit registration form
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

  // Step 2 — Verify OTP
  const handleVerify = async () => {
    if (otp.length < 6) { setOtpError('Please enter all 6 digits.'); return; }
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

  // Resend OTP
  const handleResend = async () => {
    if (!canResend) return;
    try {
      await resendOtp(email);
      toast.success('New OTP sent!');
      setResendTimer(60);
      setCanResend(false);
      setOtp('');
      setOtpError('');
      const interval = setInterval(() => {
        setResendTimer((t) => {
          if (t <= 1) { clearInterval(interval); setCanResend(true); return 0; }
          return t - 1;
        });
      }, 1000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP.');
    }
  };

  // ── OTP Step ────────────────────────────────────────────────────────────────
  if (step === 'otp') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg)' }}>
        <div className="w-full max-w-md animate-fade-in">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Stethoscope size={16} color="var(--green)" />
            </div>
            <span style={{ fontFamily: 'serif', fontSize: 20, color: 'var(--text)' }}>MedAI</span>
          </div>

          <div className="p-8 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            {/* Email icon */}
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <Mail size={24} color="var(--green)" />
            </div>

            <h2 style={{ fontFamily: 'serif', fontSize: 26, color: 'var(--text)', marginBottom: 6 }}>Check your email</h2>
            <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 6 }}>
              We sent a 6-digit code to
            </p>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--green)', marginBottom: 28 }}>
              {email}
            </p>

            {/* OTP boxes */}
            <OtpInput value={otp} onChange={(v) => { setOtp(v); setOtpError(''); }} />

            {/* Error */}
            {otpError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--red)', fontSize: 13, marginTop: 16 }}>
                <AlertCircle size={14} style={{ flexShrink: 0 }} />
                {otpError}
              </div>
            )}

            {/* Verify button */}
            <button
              className="btn-primary w-full"
              style={{ marginTop: 24 }}
              onClick={handleVerify}
              disabled={otpLoading || otp.length < 6}
            >
              {otpLoading ? (
                <><div className="spinner" style={{ width: 16, height: 16, borderTopColor: '#000' }} /> Verifying…</>
              ) : 'Verify Email'}
            </button>

            {/* Resend */}
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              {canResend ? (
                <button
                  onClick={handleResend}
                  style={{ background: 'none', border: 'none', color: 'var(--green)', cursor: 'pointer', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <RefreshCw size={13} /> Resend OTP
                </button>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--text3)' }}>
                  Resend available in <strong style={{ color: 'var(--text2)' }}>{resendTimer}s</strong>
                </p>
              )}
            </div>

            {/* Change email */}
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <button
                onClick={() => { setStep('form'); setOtp(''); setOtpError(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 13 }}
              >
                ← Change email
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Registration Form Step ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      {/* Left panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 p-10 relative overflow-hidden"
        style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}
      >
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px)', backgroundSize: '36px 36px', opacity: 0.2 }} />
        <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%,-50%)', width: 200, height: 200, borderRadius: '50%', background: 'rgba(34,197,94,0.06)', filter: 'blur(40px)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Stethoscope size={15} color="var(--green)" />
            </div>
            <span style={{ fontFamily: 'serif', fontSize: 20, color: 'var(--text)' }}>MedAI</span>
          </div>
          <h1 style={{ fontFamily: 'serif', fontSize: 40, color: 'var(--text)', lineHeight: 1.2, marginBottom: 16 }}>
            Join<br /><em style={{ color: 'var(--green)' }}>MedAI</em><br />today
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.8 }}>
            Create your account and unlock AI-powered medication insights and report analysis.
          </p>
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          {[
            { icon: '✉️', t: 'Email verification', d: 'OTP sent to your inbox' },
            { icon: '💊', t: 'Medication database', d: 'Dosage, interactions & more' },
            { icon: '🧬', t: 'Report analysis', d: 'Gemini AI reads your reports' },
          ].map((f) => (
            <div key={f.t} style={{ display: 'flex', gap: 12, padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 16 }}>{f.icon}</span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', margin: 0 }}>{f.t}</p>
                <p style={{ fontSize: 12, color: 'var(--text3)', margin: '2px 0 0' }}>{f.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-fade-in">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <Stethoscope size={18} color="var(--green)" />
            <span style={{ fontFamily: 'serif', fontSize: 20 }}>MedAI</span>
          </div>

          <h2 style={{ fontFamily: 'serif', fontSize: 28, color: 'var(--text)', marginBottom: 4 }}>Create account</h2>
          <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 28 }}>
            Already have one?{' '}
            <Link to="/login" style={{ color: 'var(--green)', fontWeight: 500 }}>Sign in →</Link>
          </p>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--red)', fontSize: 13, marginBottom: 20 }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="section-label block mb-2">Full name</label>
              <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Dr. Jane Smith" className="input-field" autoComplete="name" />
            </div>
            <div>
              <label className="section-label block mb-2">Email address</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="jane@hospital.com" className="input-field" autoComplete="email" />
            </div>
            <div>
              <label className="section-label block mb-2">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} placeholder="Min. 8 characters" className="input-field pr-12" autoComplete="new-password" />
                <button type="button" onClick={() => setShowPw(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)' }}>
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {form.password && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                    {[1,2,3,4].map((i) => (
                      <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= pwStrength ? strengthColor[pwStrength] : 'var(--border2)', transition: 'background 0.3s' }} />
                    ))}
                  </div>
                  <p style={{ fontSize: 11, color: strengthColor[pwStrength] }}>{strengthLabel[pwStrength]}</p>
                </div>
              )}
            </div>
            <div>
              <label className="section-label block mb-2">Confirm password</label>
              <div className="relative">
                <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Re-enter password" className="input-field pr-10" autoComplete="new-password" />
                {form.confirmPassword && form.password === form.confirmPassword && (
                  <CheckCircle2 size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }} color="var(--green)" />
                )}
              </div>
            </div>
            <button type="submit" className="btn-primary w-full" style={{ marginTop: 8 }} disabled={loading}>
              {loading ? (
                <><div className="spinner" style={{ width: 16, height: 16, borderTopColor: '#000' }} /> Sending OTP…</>
              ) : 'Create account & verify email'}
            </button>
          </form>

          <p style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', marginTop: 20 }}>
            By registering you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}