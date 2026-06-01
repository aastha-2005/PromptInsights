import { useEffect, useRef } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { motion } from 'framer-motion';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';

/* ── Floating orb ── */
function Orb({ style }) {
  return <div aria-hidden="true" style={{ position: 'absolute', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none', ...style }} />;
}

/* ── Stat pill ── */
function Stat({ value, label }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--fh)', letterSpacing: '-0.5px', color: '#fff' }}>{value}</div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{label}</div>
    </div>
  );
}

/* ── Feature row ── */
function Feature({ emoji, text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{
        width: 30, height: 30, borderRadius: 8,
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, flexShrink: 0,
      }}>{emoji}</span>
      <span style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.72)', lineHeight: 1.45 }}>{text}</span>
    </div>
  );
}

export default function LandingPage() {
  const { login } = useAuth();

  function handleSuccess(credentialResponse) {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      login({
        name:    decoded.name,
        email:   decoded.email,
        picture: decoded.picture,
      });
    } catch (err) {
      console.error('JWT decode failed:', err);
    }
  }

  function handleError() {
    console.error('Google Sign-In failed');
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      fontFamily: 'var(--fb)',
      overflow: 'hidden',
      position: 'relative',
    }}>

      {/* ── LEFT PANEL — brand / hero ─────────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        style={{
          flex: '1 1 55%',
          background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '60px 64px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Atmospheric orbs */}
        <Orb style={{ width: 500, height: 500, background: 'rgba(147,51,234,0.18)', top: '-15%', left: '-10%' }} />
        <Orb style={{ width: 380, height: 380, background: 'rgba(99,102,241,0.14)', bottom: '-12%', right: '-8%' }} />
        <Orb style={{ width: 260, height: 260, background: 'rgba(20,184,166,0.09)', top: '45%', left: '55%' }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 64, position: 'relative', zIndex: 1 }}>
          <Logo size={38} />
          <span style={{
            fontFamily: 'var(--fh)', fontSize: 20, fontWeight: 800,
            background: 'linear-gradient(120deg,#c084fc 0%,#a78bfa 50%,#818cf8 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text', letterSpacing: '-.5px',
          }}>PromptInsights</span>
        </div>

        {/* Headline */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.55 }}
          >
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              fontSize: 11, fontWeight: 700, letterSpacing: '2.5px',
              textTransform: 'uppercase', color: '#c084fc',
              background: 'rgba(192,132,252,0.12)',
              border: '1px solid rgba(192,132,252,0.25)',
              padding: '4px 12px', borderRadius: 999, marginBottom: 24,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#c084fc', boxShadow: '0 0 8px #c084fc' }} />
              Professional AI Data Analysis
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.6 }}
            style={{
              fontSize: 'clamp(32px, 3.8vw, 52px)', fontFamily: 'var(--fh)',
              fontWeight: 800, lineHeight: 1.1, letterSpacing: '-2px',
              color: '#fff', marginBottom: 20,
            }}
          >
            Transform raw data<br />
            into{' '}
            <span style={{
              background: 'linear-gradient(90deg,#c084fc 0%,#818cf8 50%,#34d399 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              instant clarity
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.32, duration: 0.55 }}
            style={{ fontSize: 16, color: 'rgba(255,255,255,0.60)', lineHeight: 1.75, maxWidth: 420, marginBottom: 44 }}
          >
            Upload any CSV, get a full EDA report, AI-generated narrative, dynamic charts, and an
            interactive chat interface — in under 30 seconds.
          </motion.p>

          {/* Feature list */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 52 }}
          >
            <Feature emoji="📊" text="Autonomous EDA with statistical profiling & outlier detection" />
            <Feature emoji="🤖" text="Gemini-powered AI narrative summaries in plain English" />
            <Feature emoji="💬" text="Chat directly with your dataset for targeted Q&A insights" />
            <Feature emoji="📄" text="One-click PDF export of boardroom-ready reports" />
          </motion.div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            style={{
              display: 'flex', gap: 32, paddingTop: 28,
              borderTop: '1px solid rgba(255,255,255,0.10)',
            }}
          >
            <Stat value="< 30s" label="Report generation" />
            <div style={{ width: 1, background: 'rgba(255,255,255,0.10)' }} />
            <Stat value="500MB" label="Max file size" />
            <div style={{ width: 1, background: 'rgba(255,255,255,0.10)' }} />
            <Stat value="100%" label="Client-side secure" />
          </motion.div>
        </div>
      </motion.div>

      {/* ── RIGHT PANEL — sign-in card (Tailwind-styled) ──── */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex flex-1 basis-5/12 items-center justify-center px-10 py-12"
        style={{ background: 'linear-gradient(160deg,#f8fafc 0%,#f3e8ff 45%,#ede9fe 100%)' }}
      >
        {/* Soft orb behind card */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-[10%] top-[10%] h-96 w-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)' }}
        />

        {/* Glass card */}
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.25, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-full max-w-sm rounded-[22px] p-10"
          style={{
            background: 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(168,85,247,0.18)',
            boxShadow: '0 0 0 1px rgba(168,85,247,0.08), 0 24px 64px rgba(147,51,234,0.14)',
          }}
        >
          {/* Logo icon */}
          <div className="mb-7 flex justify-center">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-[14px]"
              style={{
                background: 'linear-gradient(135deg,#a855f7 0%,#7c3aed 100%)',
                boxShadow: '0 0 0 6px rgba(168,85,247,0.12), 0 8px 24px rgba(147,51,234,0.30)',
              }}
            >
              <Logo size={30} mono />
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8 text-center">
            <h1
              className="mb-2 text-2xl font-extrabold tracking-tight"
              style={{ fontFamily: 'var(--fh)', color: '#0f172a', letterSpacing: '-0.6px' }}
            >
              Welcome to PromptInsights
            </h1>
            <p className="text-sm leading-relaxed text-slate-500">
              Professional AI Data Analysis —<br />
              sign in with Google to get started.
            </p>
          </div>

          {/* Divider */}
          <div className="mb-5 flex items-center gap-3 text-xs text-slate-400">
            <div className="h-px flex-1" style={{ background: 'rgba(168,85,247,0.18)' }} />
            <span>Continue with</span>
            <div className="h-px flex-1" style={{ background: 'rgba(168,85,247,0.18)' }} />
          </div>

          {/* Google Login button — centred */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={handleError}
              useOneTap
              theme="outline"
              size="large"
              width="300"
              text="signin_with"
              shape="rectangular"
            />
          </div>

          {/* Trust note */}
          <p className="mt-7 text-center text-xs leading-relaxed text-slate-400">
            🔒 Secured by Google OAuth 2.0<br />
            Your data never leaves your browser.
          </p>

          {/* Feature chips */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {['Free to start', 'No credit card', 'Instant access'].map(tag => (
              <span
                key={tag}
                className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                style={{
                  color: '#7c3aed',
                  background: 'rgba(124,58,237,0.07)',
                  border: '1px solid rgba(124,58,237,0.18)',
                }}
              >
                ✓ {tag}
              </span>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Responsive: hide hero on small screens */}
      <style>{`
        @media (max-width: 768px) {
          div[style*="flex: 1 1 55%"] { display: none !important; }
          div[style*="basis-5\\/12"]   { flex: 1 1 100% !important; padding: 32px 20px !important; }
        }
      `}</style>
    </div>
  );
}
