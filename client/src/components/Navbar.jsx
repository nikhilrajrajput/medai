import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Stethoscope, Pill, FileText, History, LogOut, ChevronDown, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/dashboard', label: 'Medication', icon: Pill },
  { path: '/report', label: 'Reports', icon: FileText },
  { path: '/history', label: 'History', icon: History },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out successfully.');
    navigate('/login');
  };

  return (
    <nav
      className="sticky top-0 z-50 flex items-center justify-between px-6 h-[60px]"
      style={{ background: 'rgba(8,15,13,0.85)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(12px)' }}
    >
      {/* Logo */}
      <Link to="/dashboard" className="flex items-center gap-2.5 no-underline">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.25)' }}
        >
          <Stethoscope size={15} color="var(--green)" />
        </div>
        <span className="font-display text-lg" style={{ color: 'var(--text)' }}>MedAI</span>
        <span
          className="text-xs px-2 py-0.5 rounded-full hidden sm:block"
          style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--green)', border: '1px solid rgba(34,197,94,0.2)' }}
        >
          Gemini
        </span>
      </Link>

      {/* Nav items */}
      <div className="flex items-center gap-1">
        {navItems.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium no-underline transition-all duration-150"
              style={{
                color: active ? 'var(--green)' : 'var(--text2)',
                background: active ? 'rgba(34,197,94,0.08)' : 'transparent',
              }}
            >
              <Icon size={15} />
              <span className="hidden sm:block">{label}</span>
            </Link>
          );
        })}
      </div>

      {/* User menu */}
      <div className="relative">
        <button
          onClick={() => setMenuOpen((p) => !p)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all"
          style={{
            background: menuOpen ? 'var(--surface2)' : 'transparent',
            border: '1px solid transparent',
            borderColor: menuOpen ? 'var(--border2)' : 'transparent',
            color: 'var(--text2)',
            cursor: 'pointer',
          }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
            style={{ background: 'rgba(34,197,94,0.2)', color: 'var(--green)' }}
          >
            {user?.name?.[0]?.toUpperCase() || <User size={12} />}
          </div>
          <span className="text-sm hidden sm:block" style={{ color: 'var(--text)' }}>
            {user?.name?.split(' ')[0]}
          </span>
          <ChevronDown size={14} />
        </button>

        {menuOpen && (
          <div
            className="absolute right-0 top-full mt-2 w-52 rounded-xl overflow-hidden"
            style={{ background: 'var(--surface)', border: '1px solid var(--border2)', boxShadow: '0 16px 40px rgba(0,0,0,0.4)' }}
          >
            <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{user?.name}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors"
              style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', textAlign: 'left' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--red-dim)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            >
              <LogOut size={15} />
              Sign out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}