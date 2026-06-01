import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import Logo from '../components/Logo';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

/* ─── INJECTED KEYFRAMES ─── */
const KEYFRAMES = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes auth-glow-pulse { 0%,100%{ opacity:.7 } 50%{ opacity:1 } }
`;

/* ═══════════════════════════════════════════════════════
   THEME TOKENS
   Returns style values keyed to dark/light mode.
═══════════════════════════════════════════════════════ */
function tok(dark) {
  return {
    /* page */
    pageBg:         dark ? '#020617'                        : '#f8fafc',
    pageGlow1:      dark ? 'rgba(147,51,234,0.10)'          : 'rgba(168,85,247,0.07)',
    pageGlow2:      dark ? 'rgba(99,102,241,0.07)'          : 'rgba(99,102,241,0.05)',
    pageGlow3:      dark ? 'rgba(168,85,247,0.05)'          : 'rgba(147,51,234,0.04)',
    /* card */
    cardBg:         dark ? 'rgba(15,23,42,0.70)'            : 'rgba(255,255,255,0.82)',
    cardBorder:     dark ? 'rgba(255,255,255,0.08)'         : 'rgba(168,85,247,0.18)',
    cardShadow:     dark ? '0 0 0 1px rgba(147,51,234,0.08),0 24px 64px rgba(0,0,0,0.55)'
                         : '0 0 0 1px rgba(168,85,247,0.10),0 20px 60px rgba(147,51,234,0.10)',
    cardBlur:       'blur(24px)',
    /* header */
    logoText:       dark ? '#ffffff'                        : '#0f172a',
    backColor:      dark ? 'rgba(148,163,184,0.85)'         : 'rgba(71,85,105,0.85)',
    backBorder:     dark ? 'rgba(255,255,255,0.10)'         : 'rgba(71,85,105,0.18)',
    backHoverBg:    dark ? 'rgba(255,255,255,0.05)'         : 'rgba(71,85,105,0.06)',
    backHoverColor: dark ? '#ffffff'                        : '#0f172a',
    backHoverBd:    dark ? 'rgba(255,255,255,0.18)'         : 'rgba(71,85,105,0.32)',
    /* typography */
    heading:        dark ? '#ffffff'                        : '#0f172a',
    sub:            dark ? '#94a3b8'                        : '#64748b',
    label:          dark ? 'rgba(148,163,184,0.9)'          : '#475569',
    /* badge */
    badgeBg:        dark ? 'rgba(147,51,234,0.12)'          : 'rgba(168,85,247,0.08)',
    badgeBorder:    dark ? 'rgba(147,51,234,0.28)'          : 'rgba(168,85,247,0.30)',
    badgeColor:     '#a855f7',
    /* inputs */
    inputBg:        dark ? 'rgba(2,6,23,0.55)'              : 'rgba(248,250,252,0.9)',
    inputBorder:    dark ? 'rgba(147,51,234,0.22)'          : 'rgba(168,85,247,0.25)',
    inputColor:     dark ? '#f1f5f9'                        : '#0f172a',
    inputPlaceholder: dark ? 'rgba(100,116,139,0.7)'        : 'rgba(100,116,139,0.6)',
    eyeColor:       dark ? 'rgba(148,163,184,0.6)'          : 'rgba(100,116,139,0.6)',
    eyeHover:       dark ? '#ffffff'                        : '#0f172a',
    /* cross-link */
    crossText:      dark ? '#94a3b8'                        : '#64748b',
    crossLink:      '#a855f7',
    /* divider */
    dividerLine:    dark ? 'rgba(147,51,234,0.18)'          : 'rgba(168,85,247,0.15)',
    dividerText:    dark ? 'rgba(100,116,139,0.7)'          : 'rgba(100,116,139,0.65)',
    /* google btn */
    googleBg:       dark ? 'rgba(255,255,255,0.04)'         : 'rgba(255,255,255,0.85)',
    googleBorder:   dark ? 'rgba(255,255,255,0.10)'         : 'rgba(203,213,225,0.80)',
    googleColor:    dark ? 'rgba(226,232,240,0.9)'          : '#334155',
    googleHoverBg:  dark ? 'rgba(255,255,255,0.08)'         : '#ffffff',
    googleHoverBd:  dark ? 'rgba(255,255,255,0.18)'         : 'rgba(168,85,247,0.30)',
    /* terms */
    termsColor:     dark ? 'rgba(100,116,139,0.8)'          : 'rgba(71,85,105,0.75)',
  };
}

/* ═══════════════════════════════════════════════════════
   SUCCESS TOAST
═══════════════════════════════════════════════════════ */
function SuccessToast({ message, visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0,   scale: 1    }}
          exit={{    opacity: 0, y: -16, scale: 0.97  }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
            zIndex: 1000,
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'linear-gradient(135deg,rgba(126,34,206,0.92) 0%,rgba(99,102,241,0.92) 100%)',
            backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(168,85,247,0.40)',
            borderRadius: 14, padding: '12px 20px',
            boxShadow: '0 0 0 1px rgba(147,51,234,0.15), 0 8px 32px rgba(147,51,234,0.35)',
            color: '#fff', fontSize: 14, fontWeight: 600, fontFamily: 'var(--fb)',
            whiteSpace: 'nowrap',
          }}
        >
          <CheckCircle2 size={17} strokeWidth={2.5} style={{ flexShrink: 0, color: '#86efac' }} />
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════
   AUTH PAGE WRAPPER
═══════════════════════════════════════════════════════ */
function AuthPage({ dark, toast, children }) {
  const t = tok(dark);
  return (
    <div style={{
      minHeight: '100vh',
      background: dark
        ? '#020617'
        : 'linear-gradient(145deg,#f8fafc 0%,#f3e8ff 40%,#ede9fe 70%,#f8fafc 100%)',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      transition: 'background .45s',
    }}>
      <style>{KEYFRAMES}</style>

      {/* ── Toast ── */}
      <SuccessToast message={toast.message} visible={toast.visible} />

      {/* ── Background Glows ── */}
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          position: 'absolute', width: 700, height: 700, borderRadius: '50%',
          background: `radial-gradient(circle, ${t.pageGlow1} 0%, transparent 70%)`,
          top: '-18%', left: '-12%',
          animation: 'auth-glow-pulse 8s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', width: 560, height: 560, borderRadius: '50%',
          background: `radial-gradient(circle, ${t.pageGlow2} 0%, transparent 70%)`,
          bottom: '-14%', right: '-8%',
          animation: 'auth-glow-pulse 11s ease-in-out infinite reverse',
        }} />
        <div style={{
          position: 'absolute', width: 400, height: 400, borderRadius: '50%',
          background: `radial-gradient(circle, ${t.pageGlow3} 0%, transparent 70%)`,
          top: '40%', left: '50%', transform: 'translateX(-50%)',
        }} />
      </div>

      {/* ── Floating Header ── */}
      <header style={{
        position: 'relative', zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '24px 32px',
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <Logo size={34} />
          <span style={{
            fontFamily: 'var(--fh)', fontSize: 17, fontWeight: 800,
            background: 'linear-gradient(120deg,#a78bfa 0%,#818cf8 50%,#6366f1 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text', letterSpacing: '-.5px',
          }}>PromptInsights</span>
        </Link>

        {/* Back to Home ghost button */}
        <Link
          to="/"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            fontSize: 13, fontWeight: 600, fontFamily: 'var(--fb)',
            color: t.backColor,
            padding: '8px 16px', borderRadius: 'var(--rfull)',
            border: `1px solid ${t.backBorder}`,
            background: 'transparent',
            textDecoration: 'none',
            transition: 'background .18s, color .18s, border-color .18s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = t.backHoverBg;
            e.currentTarget.style.color = t.backHoverColor;
            e.currentTarget.style.borderColor = t.backHoverBd;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = t.backColor;
            e.currentTarget.style.borderColor = t.backBorder;
          }}
        >
          <ArrowLeft size={13} strokeWidth={2.2} />
          Back to Home
        </Link>
      </header>

      {/* ── Centered Card Area ── */}
      <div style={{
        flex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '80vh',
        padding: '24px 20px 48px',
        position: 'relative', zIndex: 1,
      }}>
        {children}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   CARD
═══════════════════════════════════════════════════════ */
function AuthCard({ dark, children }) {
  const t = tok(dark);
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{
        width: '100%', maxWidth: 440,
        background: t.cardBg,
        border: `1px solid ${t.cardBorder}`,
        borderRadius: 20,
        padding: '40px 36px',
        backdropFilter: t.cardBlur,
        WebkitBackdropFilter: t.cardBlur,
        boxShadow: t.cardShadow,
        transition: 'background .4s, border-color .3s, box-shadow .4s',
      }}
    >
      {children}
    </motion.div>
  );
}

/* ── Badge label ── */
function Badge({ dark, children }) {
  const t = tok(dark);
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 7,
      background: t.badgeBg, border: `1px solid ${t.badgeBorder}`,
      borderRadius: 'var(--rfull)', padding: '4px 12px',
      fontSize: 11, fontWeight: 700, letterSpacing: '2px',
      textTransform: 'uppercase', color: t.badgeColor,
      fontFamily: 'var(--fb)', marginBottom: 16,
      transition: 'background .3s',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#a855f7', boxShadow: '0 0 6px #a855f7', display: 'inline-block' }} />
      {children}
    </div>
  );
}

/* ── Form group ── */
function FormGroup({ dark, label, children }) {
  const t = tok(dark);
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <label className="fl" style={{ color: t.label, transition: 'color .3s' }}>{label}</label>
      {children}
    </div>
  );
}

/* ── Text / email input ── */
function FieldInput({ dark, type = 'text', placeholder, value, onChange }) {
  const t = tok(dark);
  return (
    <input
      className="fi"
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required
      style={{
        background: t.inputBg,
        border: `1px solid ${t.inputBorder}`,
        color: t.inputColor,
        transition: 'background .3s, border-color .3s, color .3s',
      }}
    />
  );
}

/* ── Password input ── */
function PasswordInput({ dark, value, onChange, placeholder = '••••••••' }) {
  const [show, setShow] = useState(false);
  const t = tok(dark);
  return (
    <div style={{ position: 'relative' }}>
      <input
        className="fi"
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required
        style={{
          paddingRight: 44,
          background: t.inputBg,
          border: `1px solid ${t.inputBorder}`,
          color: t.inputColor,
          transition: 'background .3s, border-color .3s, color .3s',
        }}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        style={{
          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', color: t.eyeColor,
          display: 'flex', alignItems: 'center', cursor: 'pointer', padding: 4,
          transition: 'color .15s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = t.eyeHover}
        onMouseLeave={e => e.currentTarget.style.color = t.eyeColor}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

/* ── Primary submit button ── */
function PrimaryBtn({ loading, redirecting, children }) {
  const isLocked = loading || redirecting;

  let content;
  if (redirecting) {
    content = (
      <>
        <CheckCircle2 size={16} strokeWidth={2.5} style={{ flexShrink: 0 }} />
        Redirecting to dashboard…
      </>
    );
  } else if (loading) {
    content = (
      <>
        <span style={{
          width: 16, height: 16,
          border: '2px solid rgba(255,255,255,.35)',
          borderTopColor: '#fff',
          borderRadius: '50%',
          animation: 'spin .75s linear infinite',
          display: 'inline-block', flexShrink: 0,
        }} />
        Authenticating…
      </>
    );
  } else {
    content = children;
  }

  return (
    <button
      type="submit"
      disabled={isLocked}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: '13px 20px', fontSize: 15, fontWeight: 700,
        fontFamily: 'var(--fh)', borderRadius: 'var(--r2)',
        background: redirecting
          ? 'linear-gradient(135deg,#22c55e 0%,#16a34a 100%)'
          : 'linear-gradient(135deg,#a855f7 0%,#7c3aed 100%)',
        color: '#fff', border: 'none',
        cursor: isLocked ? 'default' : 'pointer',
        opacity: isLocked ? 0.88 : 1,
        boxShadow: redirecting
          ? '0 0 0 4px rgba(34,197,94,0.28), 0 4px 18px rgba(34,197,94,0.35)'
          : '0 0 0 4px rgba(147,51,234,0.28), 0 4px 18px rgba(147,51,234,0.35)',
        transition: 'background .3s, box-shadow .22s, opacity .2s, transform .15s',
      }}
      onMouseEnter={e => {
        if (!isLocked) {
          e.currentTarget.style.boxShadow = '0 0 0 4px rgba(147,51,234,0.45), 0 6px 28px rgba(147,51,234,0.55)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = redirecting
          ? '0 0 0 4px rgba(34,197,94,0.28), 0 4px 18px rgba(34,197,94,0.35)'
          : '0 0 0 4px rgba(147,51,234,0.28), 0 4px 18px rgba(147,51,234,0.35)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={redirecting ? 'redirecting' : loading ? 'loading' : 'idle'}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          {content}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

/* ── Google button (real OAuth) ── */
function GoogleBtn({ dark }) {
  const { login } = useAuth();
  const navigate = useNavigate();

  function handleSuccess(credentialResponse) {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      login({ name: decoded.name, email: decoded.email, picture: decoded.picture });
      navigate('/');
    } catch (err) {
      console.error('Google auth error:', err);
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => console.error('Google sign-in failed')}
        useOneTap={false}
        theme={dark ? 'filled_black' : 'outline'}
        size="large"
        width="320"
        text="continue_with"
        shape="rectangular"
      />
    </div>
  );
}

/* ── Divider ── */
function Divider({ dark, text }) {
  const t = tok(dark);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: t.dividerText, fontSize: 12, margin: '20px 0 16px' }}>
      <div style={{ flex: 1, height: 1, background: t.dividerLine }} />
      {text}
      <div style={{ flex: 1, height: 1, background: t.dividerLine }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   LOGIN PAGE
═══════════════════════════════════════════════════════ */
export function Login() {
  const navigate    = useNavigate();
  const { dark }    = useTheme();
  const { login }   = useAuth();
  const t           = tok(dark);

  const [email, setEmail]           = useState('');
  const [pw, setPw]                 = useState('');
  const [loading, setLoading]       = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [toast, setToast]           = useState({ visible: false, message: '' });

  async function submit(e) {
    e.preventDefault();
    if (loading || redirecting) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1100));
    setLoading(false);
    // Persist session
    login({ email });
    // Show success toast
    setToast({ visible: true, message: 'Welcome back! Redirecting to your dashboard…' });
    setRedirecting(true);
    // 1.2 s so user reads the toast
    await new Promise(r => setTimeout(r, 1200));
    navigate('/');
  }

  return (
    <AuthPage dark={dark} toast={toast}>
      <AuthCard dark={dark}>

        {/* Badge */}
        <Badge dark={dark}>Welcome Back</Badge>

        {/* Heading */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'var(--fh)', fontSize: 26, fontWeight: 800, letterSpacing: '-.7px', marginBottom: 7, color: t.heading, transition: 'color .3s' }}>
            Sign in to your account
          </h1>
          <p style={{ fontSize: 14, color: t.sub, lineHeight: 1.6, transition: 'color .3s' }}>
            Pick up right where you left off.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
          <FormGroup dark={dark} label="Email address">
            <FieldInput dark={dark} type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} />
          </FormGroup>

          <FormGroup dark={dark} label={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Password</span>
              <button type="button" style={{ background: 'none', border: 'none', color: '#a855f7', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                Forgot password?
              </button>
            </div>
          }>
            <PasswordInput dark={dark} value={pw} onChange={e => setPw(e.target.value)} />
          </FormGroup>

          <div style={{ marginTop: 4 }}>
            <PrimaryBtn loading={loading} redirecting={redirecting}>
              Sign in <ArrowRight size={15} />
            </PrimaryBtn>
          </div>
        </form>

        {/* Cross-link */}
        <p style={{ textAlign: 'center', fontSize: 14, color: t.crossText, marginBottom: 20, transition: 'color .3s' }}>
          New to PromptInsights?{' '}
          <Link to="/signup" style={{ color: t.crossLink, fontWeight: 700, textDecoration: 'none' }}>
            Sign Up
          </Link>
        </p>

        <Divider dark={dark} text="or continue with" />
        <GoogleBtn dark={dark} />
      </AuthCard>
    </AuthPage>
  );
}

/* ═══════════════════════════════════════════════════════
   SIGNUP PAGE
═══════════════════════════════════════════════════════ */
export function Signup() {
  const navigate    = useNavigate();
  const { dark }    = useTheme();
  const { login }   = useAuth();
  const t           = tok(dark);

  const [name, setName]             = useState('');
  const [email, setEmail]           = useState('');
  const [pw, setPw]                 = useState('');
  const [loading, setLoading]       = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [toast, setToast]           = useState({ visible: false, message: '' });

  async function submit(e) {
    e.preventDefault();
    if (loading || redirecting) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1100));
    setLoading(false);
    login({ name, email });
    setToast({ visible: true, message: "Account created! Redirecting to your dashboard…" });
    setRedirecting(true);
    await new Promise(r => setTimeout(r, 1200));
    navigate('/');
  }

  return (
    <AuthPage dark={dark} toast={toast}>
      <AuthCard dark={dark}>

        {/* Badge */}
        <Badge dark={dark}>Get Started — Free</Badge>

        {/* Heading */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'var(--fh)', fontSize: 26, fontWeight: 800, letterSpacing: '-.7px', marginBottom: 7, color: t.heading, transition: 'color .3s' }}>
            Create your account
          </h1>
          <p style={{ fontSize: 14, color: t.sub, lineHeight: 1.6, transition: 'color .3s' }}>
            Free for your first three reports. No credit card required.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
          <FormGroup dark={dark} label="Full name">
            <FieldInput dark={dark} type="text" placeholder="Jane Smith" value={name} onChange={e => setName(e.target.value)} />
          </FormGroup>
          <FormGroup dark={dark} label="Work email">
            <FieldInput dark={dark} type="email" placeholder="jane@company.com" value={email} onChange={e => setEmail(e.target.value)} />
          </FormGroup>
          <FormGroup dark={dark} label="Password">
            <PasswordInput dark={dark} value={pw} onChange={e => setPw(e.target.value)} placeholder="Min. 8 characters" />
          </FormGroup>

          <p style={{ fontSize: 12, color: t.termsColor, lineHeight: 1.6, marginTop: -2, transition: 'color .3s' }}>
            By creating an account you agree to our{' '}
            <button type="button" style={{ background: 'none', border: 'none', color: '#a855f7', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}>Terms</button>
            {' '}and{' '}
            <button type="button" style={{ background: 'none', border: 'none', color: '#a855f7', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}>Privacy Policy</button>.
          </p>

          <div style={{ marginTop: 4 }}>
            <PrimaryBtn loading={loading} redirecting={redirecting}>
              Create account <ArrowRight size={15} />
            </PrimaryBtn>
          </div>
        </form>

        {/* Cross-link */}
        <p style={{ textAlign: 'center', fontSize: 14, color: t.crossText, marginBottom: 20, transition: 'color .3s' }}>
          Already a member?{' '}
          <Link to="/login" style={{ color: t.crossLink, fontWeight: 700, textDecoration: 'none' }}>
            Log In
          </Link>
        </p>

        <Divider dark={dark} text="or sign up with" />
        <GoogleBtn dark={dark} />
      </AuthCard>
    </AuthPage>
  );
}
