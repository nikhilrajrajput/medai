import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Stethoscope, AlertCircle, CheckCircle2, Mail, RefreshCw, ShieldCheck } from 'lucide-react';
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

// ─── 6-box OTP input ─────────────────────────────────────────────────────────
function OtpInput({ value, onChange, disabled }) {
  const refs = useRef([]);
  const digits = (value + '      ').slice(0, 6).split('');

  const handleKey = (e, idx) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const arr = [...digits.map(d => d.trim())];
      if (arr[idx]) { arr[idx] = ''; onChange(arr.join('').trimEnd()); }
      else if (idx > 0) { arr[idx - 1] = ''; onChange(arr.join('').trimEnd()); refs.current[idx - 1]?.focus(); }
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
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', margin: '8px 0' }}>
      {[0,1,2,3,4,5].map((i) => {
        const filled = digits[i] && digits[i].trim();
        return (
          <input
            key={i}
            ref={el => refs.current[i] = el}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digits[i]?.trim() || ''}
            onKeyDown={e => handleKey(e, i)}
            onPaste={handlePaste}
            onChange={() => {}}
            onClick={() => refs.current[i]?.select()}
            disabled={disabled}
            style={{
              width: 52, height: 60,
              textAlign: 'center',
              fontSize: 24, fontWeight: 700,
              background: filled ? 'rgba(34,197,94,0.08)' : 'var(--surface2)',
              border: `2px solid ${filled ? 'var(--green)' : 'var(--border)'}`,
              borderRadius: 12, color: 'var(--text)',
              outline: 'none', fontFamily: 'monospace',
              transition: 'all 0.15s',
              opacity: disabled ? 0.5 : 1,
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RegisterPage() {
  const { register, verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();

  const [step,  setStep]  = useState('form'); // 'form' | 'otp'
  const [email, setEmail] = useState('');

  // Form
  const [form,    setForm]    = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // OTP
  const [otp,        setOtp]        = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError,   setOtpError]   = useState('');
  const [timer,      setTimer]      = useState(60);
  const [canResend,  setCanResend]  = useState(false);

  const pwStr = strengthScore(form.password);

  // Countdown when OTP step is shown
  useEffect(() => {
    if (step !== 'otp') return;
    setTimer(60); setCanResend(false);
    const iv = setInterval(() => setTimer(t => {
      if (t <= 1) { clearInterval(iv); setCanResend(true); return 0; }
      return t - 1;
    }), 1000);
    return () => clearInterval(iv);
  }, [step]);

  const handleChange = e => { setError(''); setForm(p => ({ ...p, [e.target.name]: e.target.value })); };

  // Step 1: submit form
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.password || !form.confirmPassword) { setError('Please fill in all fields.'); return; }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
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

  // Step 2: verify OTP
  const handleVerify = async () => {
    if (otp.length < 6) { setOtpError('Please enter all 6 digits.'); return; }
    setOtpError(''); setOtpLoading(true);
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
      setTimer(60); setCanResend(false); setOtp(''); setOtpError('');
      const iv = setInterval(() => setTimer(t => { if (t <= 1) { clearInterval(iv); setCanResend(true); return 0; } return t - 1; }), 1000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP.');
    }
  };

  // ── OTP Step ─────────────────────────────────────────────────────────────────
  if (step === 'otp') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--bg)' }}>
        <div style={{ width: '100%', maxWidth: 420 }} className="animate-fade-in">
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Stethoscope size={15} color="var(--green)" />
            </div>
            <span style={{ fontFamily: 'serif', fontSize: 20, color: 'var(--text)' }}>MedAI</span>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 36 }}>
            {/* Icon */}
            <div style={{ width: 60, height: 60, borderRadius: 18, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <ShieldCheck size={28} color="var(--green)" />
            </div>

            <h2 style={{ fontFamily: 'serif', fontSize: 26, color: 'var(--text)', margin: '0 0 8px' }}>Verify your email</h2>
            <p style={{ fontSize: 14, color: 'var(--text2)', margin: '0 0 4px' }}>We sent a 6-digit code to</p>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--green)', margin: '0 0 28px' }}>{email}</p>

            {/* OTP boxes */}
            <OtpInput value={otp} onChange={v => { setOtp(v); setOtpError(''); }} disabled={otpLoading} />

            {/* OTP hint */}
            <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text3)', marginTop: 8 }}>
              Check your inbox and spam folder · Sent via Supabase
            </p>

            {/* Error */}
            {otpError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--red)', fontSize: 13, marginTop: 16 }}>
                <AlertCircle size={14} style={{ flexShrink: 0 }} /> {otpError}
              </div>
            )}

            {/* Verify button */}
            <button className="btn-primary w-full" style={{ marginTop: 20 }} onClick={handleVerify} disabled={otpLoading || otp.trim().length < 6}>
              {otpLoading
                ? <><div className="spinner" style={{ width: 16, height: 16, borderTopColor: '#000' }} /> Verifying…</>
                : <><Mail size={15} /> Verify Email</>}
            </button>

            {/* Resend */}
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              {canResend
                ? <button onClick={handleResend} style={{ background: 'none', border: 'none', color: 'var(--green)', cursor: 'pointer', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <RefreshCw size={13} /> Resend OTP
                  </button>
                : <p style={{ fontSize: 13, color: 'var(--text3)', margin: 0 }}>
                    Resend in <strong style={{ color: 'var(--text2)' }}>{timer}s</strong>
                  </p>}
            </div>

            {/* Back */}
            <div style={{ textAlign: 'center', marginTop: 14 }}>
              <button onClick={() => { setStep('form'); setOtp(''); setOtpError(''); }} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 13 }}>
                ← Change email address
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Registration Form ─────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg)' }}>
      {/* Left panel */}
      <div style={{ width: 400, flexShrink: 0, background: 'var(--surface)', borderRight: '1px solid var(--border)', padding: '40px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }} className="hidden lg:flex">
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px)', backgroundSize: '36px 36px', opacity: 0.2 }} />
        <div style={{ position: 'absolute', top: '35%', left: '50%', transform: 'translate(-50%,-50%)', width: 220, height: 220, borderRadius: '50%', background: 'rgba(34,197,94,0.05)', filter: 'blur(50px)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 44 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Stethoscope size={15} color="var(--green)" />
            </div>
            <span style={{ fontFamily: 'serif', fontSize: 20, color: 'var(--text)' }}>MedAI</span>
          </div>
          <h1 style={{ fontFamily: 'serif', fontSize: 38, color: 'var(--text)', lineHeight: 1.2, margin: '0 0 14px' }}>
            Join<br /><em style={{ color: 'var(--green)' }}>MedAI</em><br />today
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.8, margin: 0 }}>
            Create your account and get instant access to AI-powered medication insights and medical report analysis.
          </p>
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          {[
            { icon: '✉️', t: 'Email verification via Supabase', d: 'OTP sent instantly to your inbox' },
            { icon: '💊', t: 'Medication database', d: 'Dosage, interactions & precautions' },
            { icon: '🧬', t: 'Report analysis', d: 'Gemini AI reads your medical reports' },
          ].map(f => (
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
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 440 }} className="animate-fade-in">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <Stethoscope size={18} color="var(--green)" />
            <span style={{ fontFamily: 'serif', fontSize: 20 }}>MedAI</span>
          </div>

          <h2 style={{ fontFamily: 'serif', fontSize: 28, color: 'var(--text)', margin: '0 0 4px' }}>Create account</h2>
          <p style={{ fontSize: 14, color: 'var(--text2)', margin: '0 0 28px' }}>
            Already have one?{' '}
            <Link to="/login" style={{ color: 'var(--green)', fontWeight: 500 }}>Sign in →</Link>
          </p>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--red)', fontSize: 13, marginBottom: 20 }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} /> {error}
            </div>
          )}

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="section-label" style={{ display: 'block', marginBottom: 6 }}>Full name</label>
              <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Dr. Jane Smith" className="input-field" autoComplete="name" />
            </div>
            <div>
              <label className="section-label" style={{ display: 'block', marginBottom: 6 }}>Email address</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="jane@hospital.com" className="input-field" autoComplete="email" />
            </div>
            <div>
              <label className="section-label" style={{ display: 'block', marginBottom: 6 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} placeholder="Min. 8 characters" className="input-field" style={{ paddingRight: 44 }} autoComplete="new-password" />
                <button type="button" onClick={() => setShowPw(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)' }}>
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {form.password && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                    {[1,2,3,4].map(i => <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= pwStr ? strengthColor[pwStr] : 'var(--border2)', transition: 'background 0.3s' }} />)}
                  </div>
                  <p style={{ fontSize: 11, color: strengthColor[pwStr], margin: 0 }}>{strengthLabel[pwStr]}</p>
                </div>
              )}
            </div>
            <div>
              <label className="section-label" style={{ display: 'block', marginBottom: 6 }}>Confirm password</label>
              <div style={{ position: 'relative' }}>
                <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Re-enter password" className="input-field" style={{ paddingRight: 40 }} autoComplete="new-password" />
                {form.confirmPassword && form.password === form.confirmPassword && (
                  <CheckCircle2 size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }} color="var(--green)" />
                )}
              </div>
            </div>

            <button type="submit" className="btn-primary w-full" disabled={loading} style={{ marginTop: 4 }}>
              {loading
                ? <><div className="spinner" style={{ width: 16, height: 16, borderTopColor: '#000' }} /> Sending OTP…</>
                : 'Create account & verify email'}
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