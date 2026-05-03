import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Stethoscope, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setError('');
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      {/* ── Left panel ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[480px] flex-shrink-0 p-12 relative overflow-hidden"
        style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}
      >
        {/* Decorative grid */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        {/* Glow blob */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl"
          style={{ background: 'rgba(34,197,94,0.06)' }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}
            >
              <Stethoscope size={18} color="var(--green)" />
            </div>
            <span className="font-display text-xl" style={{ color: 'var(--text)' }}>
              MedAI
            </span>
          </div>

          <h1 className="font-display text-5xl leading-tight mb-6" style={{ color: 'var(--text)' }}>
            Intelligent
            <br />
            <em style={{ color: 'var(--green)' }}>Medical</em>
            <br />
            Platform
          </h1>
          <p style={{ color: 'var(--text2)', lineHeight: 1.8 }}>
            AI-powered medication insights and medical report analysis, all in one place.
          </p>
        </div>

        <div className="relative z-10 space-y-4">
          {[
            { icon: '💊', title: 'Medication Database', desc: 'Dosage, interactions & precautions' },
            { icon: '🧬', title: 'Report Analysis', desc: 'Gemini AI reads your medical reports' },
            { icon: '🔒', title: 'Secure & Private', desc: 'JWT-protected, encrypted data' },
          ].map((f) => (
            <div
              key={f.title}
              className="flex items-start gap-3 p-3 rounded-xl"
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
            >
              <span className="text-lg mt-0.5">{f.icon}</span>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{f.title}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <Stethoscope size={20} color="var(--green)" />
            <span className="font-display text-xl">MedAI</span>
          </div>

          <h2 className="font-display text-3xl mb-1" style={{ color: 'var(--text)' }}>
            Sign in
          </h2>
          <p className="mb-8 text-sm" style={{ color: 'var(--text2)' }}>
            New here?{' '}
            <Link to="/register" className="font-medium" style={{ color: 'var(--green)' }}>
              Create an account →
            </Link>
          </p>

          {/* Error banner */}
          {error && (
            <div
              className="flex items-center gap-3 p-3 rounded-xl mb-6 text-sm"
              style={{ background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--red)' }}
            >
              <AlertCircle size={16} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="section-label block mb-2">Email address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="doctor@hospital.com"
                className="input-field"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="section-label block mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min. 8 characters"
                  className="input-field pr-12"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
              {loading ? (
                <>
                  <div className="spinner" style={{ width: 16, height: 16, borderTopColor: '#000' }} />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div className="mt-8 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="text-xs text-center" style={{ color: 'var(--text3)' }}>
              For informational purposes only. Not a substitute for professional medical advice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}