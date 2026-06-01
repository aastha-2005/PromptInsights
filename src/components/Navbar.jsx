import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sun, Moon, Menu, X, LogOut, PlusCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from './Logo';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const LINKS = [
  { label: 'Home',         to: '/' },
  { label: 'How it Works', to: '/how-it-works' },
  { label: 'About Us',     to: '/about' },
];

const S = {
  nav: {
    position: 'sticky', top: 0, zIndex: 300,
    background: 'var(--nav-bg)',
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    borderBottom: '1px solid var(--bd)',
    transition: 'background .4s, border-color .4s',
  },
  inner: {
    maxWidth: 1160, margin: '0 auto', padding: '0 2rem',
    height: 64, display: 'flex', alignItems: 'center', gap: '2rem',
  },
  brand:     { display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 },
  brandText: {
    fontFamily: 'var(--fh)', fontSize: 17, fontWeight: 800,
    background: 'linear-gradient(120deg,#a78bfa 0%,#818cf8 50%,#6366f1 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    backgroundClip: 'text', letterSpacing: '-.5px',
  },
  navLinks: { display: 'flex', alignItems: 'center', gap: 4, flex: 1 },
  link: (active) => ({
    fontFamily: 'var(--fb)', fontSize: 14, fontWeight: active ? 600 : 500,
    color: active ? 'var(--nav-active-color, var(--purple))' : 'var(--t2)',
    padding: '6px 14px', borderRadius: 'var(--rfull)',
    background: active ? 'var(--nav-active-bg, rgba(124,58,237,.1))' : 'transparent',
    boxShadow: active ? '0 0 12px rgba(168,85,247,0.12)' : 'none',
    transition: 'color .18s, background .18s, box-shadow .18s',
    textDecoration: 'none', whiteSpace: 'nowrap',
  }),
  right: { display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto', flexShrink: 0 },
  toggle: {
    background: 'var(--surf)', border: '1px solid var(--bd)',
    color: 'var(--t2)', width: 36, height: 36,
    borderRadius: 'var(--r2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', transition: 'border-color .2s, color .2s',
  },
  mobileTrigger: {
    background: 'var(--surf)', border: '1px solid var(--bd)',
    color: 'var(--t1)', width: 36, height: 36,
    borderRadius: 'var(--r2)', display: 'none', alignItems: 'center', justifyContent: 'center',
  },
};

/* ── User avatar chip shown when logged in ── */
function UserChip({ user, onLogout }) {
  const [hover, setHover] = useState(false);
  const initials = (user.name || user.email || '?')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {/* Avatar — Google photo or gradient initials */}
      {user.picture ? (
        <img
          src={user.picture}
          alt={user.name || 'User'}
          referrerPolicy="no-referrer"
          style={{
            width: 32, height: 32, borderRadius: '50%',
            objectFit: 'cover',
            boxShadow: '0 0 0 2px rgba(147,51,234,0.35)',
            flexShrink: 0,
          }}
        />
      ) : (
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'linear-gradient(135deg,#a855f7 0%,#7c3aed 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, color: '#fff',
          boxShadow: '0 0 0 2px rgba(147,51,234,0.35)',
          flexShrink: 0,
          fontFamily: 'var(--fh)',
        }}>
          {initials}
        </div>
      )}

      {/* Name (hidden on small screens) */}
      <span style={{
        fontSize: 13, fontWeight: 600, color: 'var(--t1)',
        fontFamily: 'var(--fb)', maxWidth: 120,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }} className="nav-username">
        {user.name || user.email}
      </span>

      {/* Sign out button */}
      <button
        onClick={onLogout}
        aria-label="Sign out"
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 12px', borderRadius: 'var(--rfull)',
          background: hover ? 'rgba(239,68,68,0.08)' : 'transparent',
          border: `1px solid ${hover ? 'rgba(239,68,68,0.3)' : 'var(--bd)'}`,
          color: hover ? '#ef4444' : 'var(--t2)',
          fontSize: 13, fontWeight: 600, fontFamily: 'var(--fb)',
          cursor: 'pointer', transition: 'all .18s',
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <LogOut size={13} strokeWidth={2.2} />
        Sign out
      </button>
    </div>
  );
}

export default function Navbar() {
  const { dark, toggle } = useTheme();
  const { isLoggedIn, user, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/');
    setOpen(false);
  }

  return (
    <header style={S.nav}>
      <div style={S.inner}>
        {/* Brand — always navigates home and resets state */}
        <button
          onClick={() => { navigate('/'); setOpen(false); }}
          style={{ ...S.brand, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          aria-label="Go to Home"
        >
          <Logo size={34} />
          <span style={S.brandText}>PromptInsights</span>
        </button>

        {/* Nav links */}
        <nav style={S.navLinks}>
          {LINKS.map(({ label, to }) => {
            const active = pathname === to;
            return (
              <Link key={to} to={to} style={S.link(active)}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.color = 'var(--t1)'; e.currentTarget.style.background = 'var(--surf2)'; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.color = 'var(--t2)'; e.currentTarget.style.background = 'transparent'; } }}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div style={S.right}>
          {/* Conditional: New Analysis button on Dashboard */}
          {pathname === '/dashboard' && (
            <motion.button
              key="new-analysis"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              onClick={() => navigate('/')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontFamily: 'var(--fb)', fontSize: 13, fontWeight: 700,
                color: '#fff', padding: '7px 14px',
                borderRadius: 'var(--rfull)', border: 'none',
                background: 'linear-gradient(135deg,#a855f7 0%,#7c3aed 100%)',
                boxShadow: '0 2px 10px rgba(147,51,234,0.35)',
                cursor: 'pointer', transition: 'transform .15s, box-shadow .15s',
                flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(147,51,234,0.50)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 10px rgba(147,51,234,0.35)'; }}
            >
              <PlusCircle size={14} />
              New Analysis
            </motion.button>
          )}

          <AnimatePresence mode="wait">
            {isLoggedIn ? (
              <motion.div key="user"
                initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.22 }}
                style={{ display: 'flex', alignItems: 'center' }}
              >
                <UserChip user={user} onLogout={handleLogout} />
              </motion.div>
            ) : (
              <motion.div key="auth"
                initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.22 }}
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <Link
                  to="/signin"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontFamily: 'var(--fb)', fontSize: 13, fontWeight: 600,
                    color: 'var(--t2)', padding: '6px 14px',
                    borderRadius: 'var(--rfull)',
                    border: '1px solid var(--bd)',
                    background: 'transparent',
                    textDecoration: 'none',
                    transition: 'color .18s, border-color .18s, background .18s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = '#a855f7';
                    e.currentTarget.style.borderColor = 'rgba(168,85,247,0.45)';
                    e.currentTarget.style.background = 'rgba(168,85,247,0.06)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = 'var(--t2)';
                    e.currentTarget.style.borderColor = 'var(--bd)';
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  Sign In
                </Link>
                <Link
                  to="/signin"
                  className="btn btn-p btn-sm"
                >
                  Get Started
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Theme toggle */}
          <button style={S.toggle} onClick={toggle} aria-label="Toggle theme"
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--purple)'; e.currentTarget.style.color = 'var(--purple)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bd)'; e.currentTarget.style.color = 'var(--t2)'; }}
          >
            <AnimatePresence mode="wait">
              <motion.span key={dark ? 's' : 'm'}
                initial={{ rotate: -80, opacity: 0, scale: .6 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 80, opacity: 0, scale: .6 }}
                transition={{ duration: .2 }}
                style={{ display: 'flex', alignItems: 'center' }}
              >
                {dark ? <Sun size={16} /> : <Moon size={16} />}
              </motion.span>
            </AnimatePresence>
          </button>

          {/* Mobile hamburger */}
          <button style={{ ...S.mobileTrigger, display: 'flex' }}
            className="mobile-only" onClick={() => setOpen(o => !o)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: .22 }}
            style={{ overflow: 'hidden', borderTop: '1px solid var(--bd)', background: 'var(--nav-bg)', padding: '8px 2rem' }}
          >
            {LINKS.map(({ label, to }) => (
              <Link key={to} to={to} onClick={() => setOpen(false)}
                style={{ display: 'block', padding: '12px 0', color: 'var(--t2)', fontSize: 15, fontWeight: 500, borderBottom: '1px solid var(--bd)', textDecoration: 'none' }}>
                {label}
              </Link>
            ))}
            {/* Conditional mobile: New Analysis on Dashboard */}
            {pathname === '/dashboard' && (
              <button
                onClick={() => { navigate('/'); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '10px 0', color: '#a855f7',
                  background: 'none', border: 'none',
                  fontSize: 14, fontWeight: 700, fontFamily: 'var(--fb)',
                  cursor: 'pointer', borderBottom: '1px solid var(--bd)', width: '100%',
                }}
              >
                <PlusCircle size={15} /> New Analysis
              </button>
            )}
            <div style={{ display: 'flex', gap: 10, padding: '12px 0' }}>
              {isLoggedIn ? (
                <button onClick={handleLogout}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 'var(--rfull)', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', fontSize: 13, fontWeight: 600, fontFamily: 'var(--fb)', cursor: 'pointer' }}>
                  <LogOut size={13} /> Sign out
                </button>
              ) : (
                <>
                  <Link
                    to="/signin"
                    className="btn btn-g btn-sm"
                    onClick={() => setOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signin"
                    className="btn btn-p btn-sm"
                    onClick={() => setOpen(false)}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media(max-width:768px){
          .mobile-only{display:flex!important}
          nav{display:none!important}
          .nav-username{display:none!important}
        }
      `}</style>
    </header>
  );
}
