import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import {
  History, GitCompare, FileText, Shield, ArrowRight,
  Eye, EyeOff, Sparkles, X,
} from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

/* ─── Brand benefits shown on the left panel ─── */
const BENEFITS = [
  {
    icon: History,
    color: '#a855f7',
    bg: 'rgba(168,85,247,0.12)',
    title: 'Save Your History',
    desc: 'Every report you generate is stored and accessible anytime.',
  },
  {
    icon: GitCompare,
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.12)',
    title: 'Compare Datasets',
    desc: 'Run AI-powered side-by-side comparisons across multiple uploads.',
  },
  {
    icon: FileText,
    color: '#14b8a6',
    bg: 'rgba(20,184,166,0.12)',
    title: 'Expert Reports',
    desc: 'Get boardroom-ready PDF exports with full EDA narratives.',
  },
  {
    icon: Shield,
    color: '#10b981',
    bg: 'rgba(16,185,129,0.12)',
    title: 'Your Data is Safe',
    desc: 'Encrypted in transit. Never stored on our servers.',
  },
];

/* ─── Small animated orb ─── */
function Orb({ style }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute', borderRadius: '50%',
        filter: 'blur(80px)', pointerEvents: 'none', ...style,
      }}
    />
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════ */
export default function SignIn() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { login }  = useAuth();
  const { dark }   = useTheme();

  /* Where to go after auth (passed via navigate state from Home) */
  const redirectTo   = location.state?.redirectTo || '/';
  const pendingState = location.state?.pendingState || null;

  /* Form state */
  const [mode, setMode]     = useState('signin'); // 'signin' | 'signup'
  const [name, setName]     = useState('');
  const [email, setEmail]   = useState('');
  const [pw, setPw]         = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [toast, setToast]   = useState({ msg: '', type: 'success' });

  /* ── Toast helper ── */
  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3200);
  }

  /* ── localStorage user registry helpers ── */
  const DB_KEY = 'pi_users_db';
  function getUsersDb() {
    try { return JSON.parse(localStorage.getItem(DB_KEY) || '[]'); }
    catch { return []; }
  }
  function saveUsersDb(users) {
    localStorage.setItem(DB_KEY, JSON.stringify(users));
  }

  /* ── Mode toggle — clears fields & error ── */
  function switchMode(next) {
    setMode(next);
    setFormError('');
    setName('');
    setEmail('');
    setPw('');
  }

  /* ── Google OAuth success (always allowed, bypasses local DB) ── */
  function handleGoogleSuccess(credentialResponse) {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      login({ name: decoded.name, email: decoded.email, picture: decoded.picture });
      showToast(`Welcome, ${decoded.name?.split(' ')[0] || 'back'}! 🎉`);
      setTimeout(() => navigate(redirectTo, { state: pendingState, replace: true }), 900);
    } catch (err) {
      console.error('Google sign-in failed:', err);
      showToast('Google sign-in failed. Please try again.', 'error');
    }
  }

  /* ── Email/password submit — real local verification ── */
  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;
    setFormError('');
    setLoading(true);

    // Tiny artificial delay so the spinner renders
    await new Promise(r => setTimeout(r, 500));

    const users = getUsersDb();
    const normalizedEmail = email.trim().toLowerCase();

    if (mode === 'signup') {
      /* ── SIGN UP ── */
      const exists = users.some(u => u.email.toLowerCase() === normalizedEmail);
      if (exists) {
        setFormError('An account with this email already exists. Please sign in.');
        setLoading(false);
        return;
      }
      // Save new user
      const newUser = { email: normalizedEmail, password: pw, name: name.trim() || normalizedEmail.split('@')[0] };
      saveUsersDb([...users, newUser]);
      setLoading(false);
      showToast('Account created! Please sign in. 🎉');
      switchMode('signin');
      return;
    }

    /* ── SIGN IN ── */
    const match = users.find(u => u.email.toLowerCase() === normalizedEmail);
    if (!match || match.password !== pw) {
      setFormError('Invalid email or password.');
      setLoading(false);
      return;
    }

    // Credentials verified — log in
    login({ email: match.email, name: match.name });
    showToast(`Welcome back, ${match.name?.split(' ')[0] || 'there'}! 🎉`);
    setTimeout(() => navigate(redirectTo, { state: pendingState, replace: true }), 900);
  }

  /* ── Guest shortcut ── */
  function continueAsGuest() {
    navigate(redirectTo, { state: pendingState, replace: true });
  }

  /* ── Dismiss (go back or home) ── */
  function handleDismiss() {
    navigate(location.state?.from || '/', { replace: true });
  }

  /* ─── Color tokens ─── */
  const T = {
    pageBg:      dark ? '#020617' : 'linear-gradient(145deg,#f8fafc 0%,#f3e8ff 40%,#ede9fe 70%,#f8fafc 100%)',
    cardBg:      dark ? 'rgba(15,23,42,0.92)' : 'rgba(255,255,255,0.95)',
    cardBd:      dark ? 'rgba(147,51,234,0.22)' : 'rgba(168,85,247,0.20)',
    cardSh:      dark
      ? '0 0 0 1px rgba(147,51,234,0.12), 0 32px 80px rgba(0,0,0,0.60)'
      : '0 0 0 1px rgba(168,85,247,0.10), 0 24px 64px rgba(147,51,234,0.14)',
    heading:     dark ? '#ffffff' : '#0f172a',
    sub:         dark ? '#94a3b8' : '#64748b',
    label:       dark ? '#94a3b8' : '#475569',
    inputBg:     dark ? 'rgba(2,6,23,0.60)' : '#f8fafc',
    inputBd:     dark ? 'rgba(147,51,234,0.25)' : 'rgba(168,85,247,0.28)',
    inputColor:  dark ? '#f1f5f9' : '#0f172a',
    inputPh:     dark ? 'rgba(100,116,139,0.65)' : 'rgba(100,116,139,0.6)',
    divLine:     dark ? 'rgba(147,51,234,0.20)' : 'rgba(168,85,247,0.18)',
    divText:     dark ? 'rgba(100,116,139,0.7)' : 'rgba(100,116,139,0.65)',
    guestColor:  dark ? '#94a3b8' : '#64748b',
    guestBd:     dark ? 'rgba(255,255,255,0.10)' : 'rgba(203,213,225,0.80)',
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: dark ? '#020617' : undefined,
      backgroundImage: dark ? undefined : 'linear-gradient(145deg,#f8fafc 0%,#f3e8ff 40%,#ede9fe 70%,#f8fafc 100%)',
      fontFamily: 'var(--fb)', overflow: 'hidden', position: 'relative',
    }}>

      {/* ── TOAST ── */}
      <AnimatePresence>
        {toast.msg && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
              zIndex: 500, display: 'flex', alignItems: 'center', gap: 8,
              background: toast.type === 'error'
                ? 'linear-gradient(135deg,rgba(239,68,68,0.92),rgba(220,38,38,0.92))'
                : 'linear-gradient(135deg,rgba(126,34,206,0.92),rgba(99,102,241,0.92))',
              border: '1px solid rgba(168,85,247,0.35)',
              backdropFilter: 'blur(16px)', borderRadius: 14,
              padding: '12px 20px', color: '#fff',
              fontSize: 14, fontWeight: 600, fontFamily: 'var(--fb)',
              boxShadow: '0 8px 32px rgba(147,51,234,0.35)',
              whiteSpace: 'nowrap',
            }}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── LEFT PANEL — brand hero ── */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        style={{
          flex: '1 1 50%',
          background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
          display: 'flex', flexDirection: 'column',
          justifyContent: 'center', padding: '60px 64px',
          position: 'relative', overflow: 'hidden',
        }}
        className="sign-in-hero"
      >
        <Orb style={{ width: 520, height: 520, background: 'rgba(147,51,234,0.18)', top: '-15%', left: '-10%' }} />
        <Orb style={{ width: 380, height: 380, background: 'rgba(99,102,241,0.14)', bottom: '-12%', right: '-8%' }} />
        <Orb style={{ width: 260, height: 260, background: 'rgba(20,184,166,0.08)', top: '45%', left: '55%' }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 56, position: 'relative', zIndex: 1 }}>
          <Logo size={36} />
          <span style={{
            fontFamily: 'var(--fh)', fontSize: 20, fontWeight: 800,
            background: 'linear-gradient(120deg,#c084fc 0%,#a78bfa 50%,#818cf8 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text', letterSpacing: '-.5px',
          }}>PromptInsights</span>
        </div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.55 }}
          style={{ position: 'relative', zIndex: 1 }}
        >
          {/* Badge */}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            fontSize: 11, fontWeight: 700, letterSpacing: '2.5px',
            textTransform: 'uppercase', color: '#c084fc',
            background: 'rgba(192,132,252,0.12)',
            border: '1px solid rgba(192,132,252,0.25)',
            padding: '4px 12px', borderRadius: 999, marginBottom: 22,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#c084fc', boxShadow: '0 0 8px #c084fc' }} />
            Professional AI Analysis
          </span>

          <h1 style={{
            fontSize: 'clamp(30px,3.5vw,46px)', fontFamily: 'var(--fh)',
            fontWeight: 800, lineHeight: 1.12, letterSpacing: '-1.8px',
            color: '#fff', marginBottom: 14,
          }}>
            Join PromptInsights
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.58)', lineHeight: 1.72, maxWidth: 380, marginBottom: 48 }}>
            Upload any CSV, get a full AI analysis in seconds. Sign in to unlock your history, comparisons, and exports.
          </p>

          {/* Benefits */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {BENEFITS.map(({ icon: Icon, color, bg, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.08, duration: 0.45 }}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}
              >
                <div style={{
                  width: 38, height: 38, borderRadius: 10, background: bg,
                  border: `1px solid ${color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Icon size={17} color={color} strokeWidth={2} />
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{title}</div>
                  <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.52)', lineHeight: 1.55 }}>{desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* ── RIGHT PANEL — auth card ── */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        style={{
          flex: '1 1 50%', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          padding: '48px 40px', position: 'relative',
        }}
        className="sign-in-right"
      >
        {/* Soft orb */}
        <div aria-hidden="true" style={{
          position: 'absolute', width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168,85,247,0.10) 0%, transparent 70%)',
          top: '8%', right: '5%', pointerEvents: 'none',
        }} />

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          aria-label="Close"
          style={{
            position: 'absolute', top: 20, right: 20,
            background: T.cardBg, border: `1px solid ${T.cardBd}`,
            borderRadius: 8, width: 34, height: 34,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: T.sub, zIndex: 10,
            transition: 'border-color .18s, color .18s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#a855f7'; e.currentTarget.style.color = '#a855f7'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.cardBd; e.currentTarget.style.color = T.sub; }}
        >
          <X size={15} />
        </button>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.22, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          style={{
            width: '100%', maxWidth: 420,
            background: T.cardBg,
            border: `1px solid ${T.cardBd}`,
            borderRadius: 22, padding: '44px 40px',
            backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
            boxShadow: T.cardSh,
            position: 'relative', zIndex: 1,
            transition: 'background .4s, border-color .3s',
          }}
        >
          {/* Card logo */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 26 }}>
            <div style={{
              width: 54, height: 54, borderRadius: 14,
              background: 'linear-gradient(135deg,#a855f7 0%,#7c3aed 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 0 6px rgba(168,85,247,0.12), 0 8px 24px rgba(147,51,234,0.30)',
            }}>
              <Sparkles size={24} color="#fff" strokeWidth={2} />
            </div>
          </div>

          {/* Heading */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <h2 style={{
              fontFamily: 'var(--fh)', fontSize: 22, fontWeight: 800,
              color: T.heading, letterSpacing: '-0.55px', marginBottom: 8,
              transition: 'color .3s',
            }}>
              {mode === 'signup' ? 'Create your account' : 'Sign in to your account'}
            </h2>
            <p style={{ fontSize: 13.5, color: T.sub, lineHeight: 1.6, transition: 'color .3s' }}>
              {mode === 'signup' ? 'Free for your first three reports.' : 'Welcome back — your data awaits.'}
            </p>
          </div>

          {/* ── FORM ── */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 13, marginBottom: 16 }}>

            {/* Name field — signup only */}
            <AnimatePresence>
              {mode === 'signup' && (
                <motion.div
                  key="name-field"
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 6, overflow: 'hidden' }}
                >
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: T.label }}>
                    Full name
                  </label>
                  <input
                    type="text"
                    placeholder="Jane Smith"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    style={{
                      width: '100%', padding: '11px 14px',
                      background: T.inputBg, border: `1.5px solid ${T.inputBd}`,
                      borderRadius: 9, fontSize: 13.5, color: T.inputColor,
                      outline: 'none', fontFamily: 'var(--fb)',
                      transition: 'border-color .2s, background .3s', boxSizing: 'border-box',
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#a855f7'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(168,85,247,0.12)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = T.inputBd; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: T.label, transition: 'color .3s' }}>
                Email address
              </label>
              <input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setFormError(''); }}
                required
                style={{
                  width: '100%', padding: '11px 14px',
                  background: T.inputBg,
                  border: `1.5px solid ${formError ? '#ef4444' : T.inputBd}`,
                  borderRadius: 9, fontSize: 13.5, color: T.inputColor,
                  outline: 'none', fontFamily: 'var(--fb)',
                  transition: 'border-color .2s, background .3s', boxSizing: 'border-box',
                }}
                onFocus={e => { if (!formError) { e.currentTarget.style.borderColor = '#a855f7'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(168,85,247,0.12)'; } }}
                onBlur={e => { e.currentTarget.style.borderColor = formError ? '#ef4444' : T.inputBd; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>

            {/* Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: T.label, transition: 'color .3s' }}>
                  Password
                </label>
                {mode === 'signin' && (
                  <button type="button" style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 12, color: '#a855f7', fontWeight: 500, fontFamily: 'inherit',
                  }}>
                    Forgot password?
                  </button>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder={mode === 'signup' ? 'Min. 6 characters' : '••••••••'}
                  value={pw}
                  onChange={e => { setPw(e.target.value); setFormError(''); }}
                  required
                  minLength={mode === 'signup' ? 6 : undefined}
                  style={{
                    width: '100%', padding: '11px 42px 11px 14px',
                    background: T.inputBg,
                    border: `1.5px solid ${formError ? '#ef4444' : T.inputBd}`,
                    borderRadius: 9, fontSize: 13.5, color: T.inputColor,
                    outline: 'none', fontFamily: 'var(--fb)',
                    transition: 'border-color .2s, background .3s', boxSizing: 'border-box',
                  }}
                  onFocus={e => { if (!formError) { e.currentTarget.style.borderColor = '#a855f7'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(168,85,247,0.12)'; } }}
                  onBlur={e => { e.currentTarget.style.borderColor = formError ? '#ef4444' : T.inputBd; e.currentTarget.style.boxShadow = 'none'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(s => !s)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: T.sub, display: 'flex', alignItems: 'center', padding: 2,
                    transition: 'color .15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = dark ? '#fff' : '#0f172a'}
                  onMouseLeave={e => e.currentTarget.style.color = T.sub}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* ── Inline error message ── */}
            <AnimatePresence>
              {formError && (
                <motion.div
                  key="form-error"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 13px',
                    background: dark ? 'rgba(239,68,68,0.10)' : 'rgba(254,226,226,0.85)',
                    border: '1px solid rgba(239,68,68,0.30)',
                    borderLeft: '3px solid #ef4444',
                    borderRadius: 8, fontSize: 13,
                    color: dark ? '#fca5a5' : '#991b1b',
                    fontFamily: 'var(--fb)',
                  }}
                >
                  <span style={{ fontSize: 15, flexShrink: 0 }}>⚠️</span>
                  {formError}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '12px 20px', marginTop: 2,
                background: loading
                  ? 'rgba(168,85,247,0.5)'
                  : 'linear-gradient(135deg,#a855f7 0%,#7c3aed 100%)',
                border: 'none', borderRadius: 9, cursor: loading ? 'not-allowed' : 'pointer',
                color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'var(--fh)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: loading ? 'none' : '0 0 0 4px rgba(147,51,234,0.22), 0 4px 18px rgba(147,51,234,0.35)',
                transition: 'background .2s, box-shadow .2s, transform .12s',
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(147,51,234,0.35), 0 6px 24px rgba(147,51,234,0.48)'; } }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(147,51,234,0.22), 0 4px 18px rgba(147,51,234,0.35)'; }}
            >
              {loading ? (
                <span style={{
                  width: 16, height: 16, border: '2px solid rgba(255,255,255,.3)',
                  borderTopColor: '#fff', borderRadius: '50%',
                  animation: 'spin .75s linear infinite', display: 'inline-block',
                }} />
              ) : (
                <>{mode === 'signup' ? 'Create Account' : 'Sign In'} <ArrowRight size={15} /></>
              )}
            </button>

            {/* Mode toggle link */}
            <p style={{ textAlign: 'center', fontSize: 13, color: T.sub, margin: 0 }}>
              {mode === 'signup' ? 'Already have an account? ' : "Don't have an account? "}
              <button
                type="button"
                onClick={() => switchMode(mode === 'signup' ? 'signin' : 'signup')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#a855f7', fontWeight: 700, fontSize: 13, fontFamily: 'inherit',
                }}
              >
                {mode === 'signup' ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </form>

          {/* ── SOCIAL DIVIDER ── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            color: T.divText, fontSize: 12, margin: '4px 0 16px',
          }}>
            <div style={{ flex: 1, height: 1, background: T.divLine }} />
            <span>or continue with</span>
            <div style={{ flex: 1, height: 1, background: T.divLine }} />
          </div>

          {/* ── GOOGLE LOGIN ── */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => showToast('Google sign-in failed. Try again.', 'error')}
              useOneTap={false}
              theme={dark ? 'filled_black' : 'outline'}
              size="large"
              width="340"
              text="signin_with"
              shape="rectangular"
            />
          </div>

          {/* ── GUEST ESCAPE HATCH ── */}
          <button
            onClick={continueAsGuest}
            style={{
              width: '100%', padding: '10px 20px',
              background: 'transparent',
              border: `1px solid ${T.guestBd}`,
              borderRadius: 9, cursor: 'pointer',
              fontSize: 13, fontWeight: 500, fontFamily: 'var(--fb)',
              color: T.guestColor,
              transition: 'background .18s, border-color .18s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.025)';
              e.currentTarget.style.borderColor = dark ? 'rgba(255,255,255,0.20)' : '#94a3b8';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = T.guestBd;
            }}
          >
            Continue as Guest
            <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.6 }}>(history won't be saved)</span>
          </button>

          {/* Trust note */}
          <p style={{
            textAlign: 'center', fontSize: 11.5, color: T.sub,
            marginTop: 20, lineHeight: 1.65, transition: 'color .3s',
          }}>
            🔒 Secured by Google OAuth 2.0 · Your data never leaves your browser.
          </p>
        </motion.div>
      </motion.div>

      {/* Spin keyframe + responsive */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .sign-in-hero { display: none !important; }
          .sign-in-right { flex: 1 1 100% !important; padding: 32px 20px !important; }
        }
      `}</style>
    </div>
  );
}
