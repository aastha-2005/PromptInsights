import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, MessageSquare } from 'lucide-react';

/* ── atmospheric orbs (mirrors the Hero background) ── */
function Orbs() {
  return (
    <>
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', width: 520, height: 520, borderRadius: '50%', background: 'rgba(124,58,237,.18)', filter: 'blur(110px)', left: '-8%', top: '-10%', animation: 'cs-orb1 14s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', width: 380, height: 380, borderRadius: '50%', background: 'rgba(99,102,241,.12)', filter: 'blur(90px)', left: '-4%', top: '-5%', animation: 'cs-orb2 18s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', width: 280, height: 280, borderRadius: '50%', background: 'rgba(20,184,166,.08)', filter: 'blur(70px)', right: '6%', bottom: '10%', animation: 'cs-orb3 22s ease-in-out infinite' }} />
      </div>
      <style>{`
        @keyframes cs-orb1{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(24px,-14px) scale(1.04)}66%{transform:translate(-10px,10px) scale(.97)}}
        @keyframes cs-orb2{0%,100%{transform:translate(0,0)}50%{transform:translate(-16px,14px)}}
        @keyframes cs-orb3{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(12px,-8px) scale(1.03)}}
      `}</style>
    </>
  );
}

/* ── glassmorphic card wrapper ── */
const glassCard = {
  background: 'rgba(15,23,42,0.42)',
  backdropFilter: 'blur(22px)',
  WebkitBackdropFilter: 'blur(22px)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: 20,
};

/* ── single action card ── */
function ActionCard({ icon: Icon, iconBg, title, subtext, btn, btnStyle, onClick, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.52, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.025, transition: { duration: 0.22, ease: 'easeOut' } }}
      style={{
        ...glassCard,
        padding: '36px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        flex: 1,
        minWidth: 0,
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
        transition: 'box-shadow 0.3s, border-color 0.3s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 0 36px rgba(147,51,234,0.22), 0 8px 32px rgba(0,0,0,0.35)';
        e.currentTarget.style.borderColor = 'rgba(147,51,234,0.40)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)';
      }}
    >
      {/* Icon circle */}
      <div style={{
        width: 54, height: 54, borderRadius: '50%',
        background: iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 22, flexShrink: 0,
      }}>
        <Icon size={24} color="#fff" strokeWidth={1.7} />
      </div>

      {/* Title */}
      <h3 style={{
        fontFamily: 'var(--fh)', fontSize: 20, fontWeight: 800,
        letterSpacing: '-0.5px', color: '#f8fafc', marginBottom: 12, lineHeight: 1.2,
      }}>{title}</h3>

      {/* Subtext */}
      <p style={{
        fontSize: 14, color: 'rgba(203,213,225,0.75)', lineHeight: 1.72,
        marginBottom: 30, flex: 1,
      }}>{subtext}</p>

      {/* CTA */}
      <button
        onClick={onClick}
        style={btnStyle}
        onMouseEnter={e => { e.currentTarget.style.opacity = '.85'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
      >
        {btn}
      </button>
    </motion.div>
  );
}

/* ── main component ── */
export default function ChoiceScreen({ fileName, csvPreview, onClose }) {
  const navigate = useNavigate();

  const solidBtn = {
    background: 'linear-gradient(135deg,#9333ea 0%,#6366F1 100%)',
    border: 'none', color: '#fff',
    padding: '13px 22px', borderRadius: 10,
    fontFamily: 'var(--fh)', fontSize: 14, fontWeight: 700,
    cursor: 'pointer', width: '100%',
    boxShadow: '0 4px 18px rgba(147,51,234,0.35)',
    transition: 'opacity .2s, transform .2s',
  };

  const outlineBtn = {
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.22)',
    color: '#f8fafc',
    padding: '13px 22px', borderRadius: 10,
    fontFamily: 'var(--fh)', fontSize: 14, fontWeight: 700,
    cursor: 'pointer', width: '100%',
    transition: 'opacity .2s, transform .2s, border-color .2s',
  };

  return (
    <AnimatePresence>
      <motion.div
        key="choice-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: 'rgba(10,14,28,0.92)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px 16px',
        }}
      >
        <Orbs />

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94 }}
          transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
          style={{
            ...glassCard,
            padding: '48px 44px 44px',
            maxWidth: 820, width: '100%',
            position: 'relative', zIndex: 1,
          }}
        >
          {/* Header tag */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            style={{ textAlign: 'center', marginBottom: 18 }}
          >
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 11, fontWeight: 700, letterSpacing: '2.2px',
              textTransform: 'uppercase', color: '#9333ea',
              fontFamily: 'var(--fb)',
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#9333ea', display: 'inline-block', boxShadow: '0 0 6px #9333ea' }} />
              File Analysis Ready
            </span>
          </motion.div>

          {/* Main title */}
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.16 }}
            style={{
              fontFamily: 'var(--fh)', fontSize: 'clamp(22px,3.5vw,30px)',
              fontWeight: 800, letterSpacing: '-0.8px',
              color: '#f8fafc', textAlign: 'center', marginBottom: 8, lineHeight: 1.15,
            }}
          >
            How would you like to proceed?
          </motion.h2>

          {/* Filename pill */}
          {fileName && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.22 }}
              style={{ textAlign: 'center', marginBottom: 36 }}
            >
              <span style={{
                fontSize: 12, color: 'rgba(148,163,184,0.8)',
                fontFamily: 'var(--fm)', background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                padding: '4px 14px', borderRadius: 999,
              }}>
                {fileName}
              </span>
            </motion.div>
          )}

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 28 }} />

          {/* Two action cards */}
          <div style={{
            display: 'flex', gap: 18,
            flexWrap: 'wrap',
          }}>
            <ActionCard
              icon={Sparkles}
              iconBg="linear-gradient(135deg,#9333ea,#7c3aed)"
              title="Generate Executive Report"
              subtext="An autonomous agentic workflow that performs full EDA, identifies trends, and surfaces key insights instantly."
              btn="✦ Start Full Analysis"
              btnStyle={solidBtn}
              onClick={() => navigate('/dashboard', { state: { fileName, csvPreview } })}
              delay={0.26}
            />

            <ActionCard
              icon={MessageSquare}
              iconBg="linear-gradient(135deg,#334155,#1e3a52)"
              title="Interactive Exploration"
              subtext="Customize your analysis parameters, ask specific questions, or chat directly with your dataset for targeted insights."
              btn="↗ Launch Chat Interface"
              btnStyle={outlineBtn}
              onClick={() => navigate('/interactive', { state: { fileName, csvPreview } })}
              delay={0.34}
            />
          </div>

          {/* Skip link */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{ textAlign: 'center', marginTop: 28, fontSize: 12.5, color: 'rgba(148,163,184,0.55)' }}
          >
            Not sure?{' '}
            <span
              onClick={onClose}
              style={{ color: 'rgba(147,51,234,0.7)', cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted' }}
            >
              Go back to upload
            </span>
          </motion.p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
