import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  UploadCloud, ArrowRight, ShieldCheck, CheckCircle2,
  BarChart3, FileText, Sparkles, Zap, MessageSquare,
} from 'lucide-react';
import BarViz from '../components/BarViz';
import NarrativeViz from '../components/NarrativeViz';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

/* ── InView fade helper (features section) ──────────────── */
function FV({ children, delay = 0, x = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-70px' });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 28, x }}
      animate={inView ? { opacity: 1, y: 0, x: 0 } : {}}
      transition={{ duration: .55, delay, ease: [.22, 1, .36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ── Features data ──────────────────────────────────────── */
const featData = [
  {
    icon: BarChart3, color: '#7C3AED', bg: 'rgba(124,58,237,.1)', chipCls: 'ch-p', tag: 'Automated',
    title: 'Statistical Profiling',
    desc: 'Deep-dive statistics on every column — distributions, percentiles, skewness, kurtosis, and missing-value diagnostics generated in milliseconds. No SQL. No setup.',
    bullets: ['Column-level null & unique analysis', 'Outlier detection & flagging', 'Distribution shape classification'],
    viz: <BarViz />, reverse: false,
  },
  {
    icon: FileText, color: '#6366F1', bg: 'rgba(99,102,241,.1)', chipCls: 'ch-i', tag: 'Generative',
    title: 'AI-Narrative Summary',
    desc: "Our Generative Insight Engine reads your data's story and writes it in plain English — executive-ready prose that interprets trends rather than merely charting them.",
    bullets: ['Plain-English anomaly explanations', 'Correlation narrative synthesis', 'Stakeholder-ready report format'],
    viz: <NarrativeViz />, reverse: true,
  },
  {
    icon: Sparkles, color: '#14B8A6', bg: 'rgba(20,184,166,.1)', chipCls: 'ch-t', tag: 'Intelligent',
    title: 'Smart Visualizations',
    desc: 'Charts chosen by context, not convention. Correlation matrices, anomaly maps, and PCA biplots surfaced automatically based on your dataset structure.',
    bullets: ['Context-aware chart selection', 'Exportable production-ready Python', 'Interactive dashboard output'],
    viz: <CorrelationViz />, reverse: false,
  },
];

/* ── Individual action card ─────────────────────────────── */
function ActionCard({ icon: Icon, iconBg, iconBorder, iconColor, title, sub, btn, btnStyle, onClick }) {
  return (
    <motion.div
      whileHover={{ scale: 1.025, transition: { duration: 0.2, ease: 'easeOut' } }}
      style={{
        background: 'var(--as-card-bg)',
        backdropFilter: 'blur(22px)',
        WebkitBackdropFilter: 'blur(22px)',
        borderRadius: 16,
        flex: 1, minWidth: 0,
        padding: '24px 22px',       /* tighter — stays above fold */
        display: 'flex', flexDirection: 'column',
        border: '1px solid var(--as-card-bd)',
        boxShadow: 'var(--as-card-sh)',
        transition: 'box-shadow 0.28s, border-color 0.28s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = 'var(--as-card-sh-h)';
        e.currentTarget.style.borderColor = 'var(--as-card-bd-h)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'var(--as-card-sh)';
        e.currentTarget.style.borderColor = 'var(--as-card-bd)';
      }}
    >
      {/* Icon circle — solid, defined shape */}
      <div style={{
        width: 46, height: 46, borderRadius: '50%',
        background: iconBg,
        border: `1px solid ${iconBorder}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 16, flexShrink: 0,
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
      }}>
        <Icon size={20} color={iconColor} strokeWidth={2} />
      </div>

      {/* Title */}
      <h3 style={{
        fontFamily: 'var(--fh)', fontSize: 17, fontWeight: 800,
        letterSpacing: '-0.4px', color: 'var(--as-head)',
        marginBottom: 8, lineHeight: 1.25,
      }}>{title}</h3>

      {/* Subtext */}
      <p style={{
        fontSize: 13, color: 'var(--as-sub)',
        lineHeight: 1.68, marginBottom: 20, flex: 1,
      }}>{sub}</p>

      {/* CTA button */}
      <button
        onClick={onClick}
        style={btnStyle}
        onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.12)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
        onMouseLeave={e => { e.currentTarget.style.filter = ''; e.currentTarget.style.transform = 'translateY(0)'; }}
      >{btn}</button>
    </motion.div>
  );
}

/* ── Main Home component ────────────────────────────────── */
export default function Home() {
  const navigate = useNavigate();
  const { dark } = useTheme();
  const { isLoggedIn } = useAuth();
  const fileRef = useRef();
  const uploadRef = useRef();       // scroll target for "Start for Free" CTA
  const pendingFile = useRef(null); // holds file while redirecting to sign-in
  const [dragging, setDragging] = useState(false);
  const [proc, setProc] = useState(false);
  const [fileName, setFileName] = useState('');
  const [csvPreview, setCsvPreview] = useState('');
  const [showChoice, setShowChoice] = useState(false);
  const [uploadError, setUploadError] = useState('');

  /* ── Read full CSV text from the raw File ── */
  function parseCsvPreview(file) {
    return new Promise((resolve) => {
      if (!file) return resolve('');
      // Only attempt on CSV/plain-text files; skip binary Excel
      if (!file.name.match(/\.csv$/i)) return resolve('');
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result || '';
        resolve(text.trim());
      };
      reader.onerror = () => resolve('');
      reader.readAsText(file);
    });
  }

  async function start(name, file) {
    setUploadError('');

    // ── Validation ──
    if (!file) {
      setUploadError('No file detected. Please select a valid file.');
      return;
    }
    if (!file.name.match(/\.(csv)$/i)) {
      setUploadError(
        `"${file.name}" is not a CSV file. Please upload a .csv file. ` +
        'Excel files (.xlsx / .xls) are accepted for report generation only.'
      );
      return;
    }
    if (file.size === 0) {
      setUploadError('The selected file is empty. Please upload a file with data.');
      return;
    }

    setFileName(name || 'your-dataset.csv');
    setProc(true);

    const preview = await parseCsvPreview(file);

    if (!preview || preview.split('\n').length < 2) {
      setProc(false);
      setUploadError('Could not read the CSV. Ensure the file has a header row and at least one data row.');
      return;
    }

    setCsvPreview(preview);
    // Auto-dismiss any lingering error
    setTimeout(() => { setProc(false); setShowChoice(true); }, 1800);

    // Auto-dismiss error after 4 s in case it was set before re-try
    setTimeout(() => setUploadError(''), 4000);
  }

  /* Called when user picks / drops a file — intercept if not logged in */
  function handleFileChosen(name, file) {
    if (!file) return;
    if (!isLoggedIn) {
      // Parse CSV first so we can pass the preview through the redirect
      parseCsvPreview(file).then(preview => {
        navigate('/signin', {
          state: {
            redirectTo: '/dashboard',
            pendingState: { fileName: name || 'dataset.csv', csvPreview: preview },
            from: '/',
          },
        });
      });
    } else {
      start(name, file);
    }
  }

  /* "Continue as Guest" — navigate straight to Dashboard with the CSV */
  function continueAsGuest() {
    if (pendingFile.current) {
      parseCsvPreview(pendingFile.current.file).then(preview => {
        navigate('/dashboard', {
          state: { fileName: pendingFile.current.name || 'dataset.csv', csvPreview: preview },
        });
        pendingFile.current = null;
      });
    }
  }

  /* SPA slide: hero exits left, Dashboard enters from right via App.js AnimatePresence */
  function handleGenerate() { navigate('/dashboard', { state: { fileName, csvPreview } }); }
  function handleReset() { setShowChoice(false); setProc(false); }

  /* CTA button — scrolls to upload zone then opens file dialog */
  function ctaClick() {
    if (showChoice) {
      handleReset();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Scroll the upload zone into view, then open the file picker
      uploadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => fileRef.current?.click(), 420); // wait for scroll to finish
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* ── HERO ─────────────────────────────────────────── */}
      <section ref={uploadRef} style={{

        position: 'relative',
        minHeight: '85vh',                /* grows naturally, never clips */
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',    /* flows down from top */
        paddingTop: showChoice ? 48 : 80,
        paddingBottom: 60,
        overflow: 'visible',             /* orbs can bleed out, no clipping */
        transition: 'padding-top 0.3s ease',
      }}>
        {/* Atmospheric orbs — no grids, no dots */}
        {[['-10%','-8%','rgba(124,58,237,.14)',480,'orb1'],['-6%','-5%','rgba(99,102,241,.11)',380,'orb2'],['58%','54%','rgba(20,184,166,.07)',260,'orb3']].map(([l,t,bg,s,k]) => (
          <div key={k} style={{ position:'absolute', borderRadius:'50%', filter:'blur(90px)', width:s, height:s, background:bg, left:l, top:t, animation:`float${k} ${k==='orb1'?14:k==='orb2'?18:24}s ease-in-out infinite` }}/>
        ))}
        <style>{`
          @keyframes floatorb1{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(26px,-16px) scale(1.04)}66%{transform:translate(-12px,12px) scale(.97)}}
          @keyframes floatorb2{0%,100%{transform:translate(0,0)}50%{transform:translate(-18px,16px)}}
          @keyframes floatorb3{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(14px,-10px) scale(1.03)}}
          @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(124,58,237,.55)}50%{box-shadow:0 0 0 16px rgba(124,58,237,0)}}
          @keyframes spin{to{transform:rotate(360deg)}}
        `}</style>

        {/* Always-mounted hidden file input so fileRef is never null */}
        <input
          ref={fileRef} type="file" accept=".csv,.xlsx,.xls"
          style={{ display: 'none' }}
          onChange={e => handleFileChosen(e.target.files?.[0]?.name, e.target.files?.[0])}
        />


        <div className="wrap" style={{ textAlign: 'center', position: 'relative', width: '100%', flex: 1 }}>


          {/* ── Upload Error Alert ── */}
          <AnimatePresence>
            {uploadError && (
              <motion.div
                key="upload-error"
                initial={{ opacity: 0, y: -12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  maxWidth: 600, margin: '0 auto 20px',
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '12px 16px',
                  background: dark ? 'rgba(239,68,68,0.08)' : 'rgba(254,226,226,0.85)',
                  border: dark ? '1px solid rgba(239,68,68,0.28)' : '1px solid rgba(239,68,68,0.30)',
                  borderLeft: '3px solid #ef4444',
                  borderRadius: 10,
                  backdropFilter: 'blur(8px)',
                }}
              >
                <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>⚠️</span>
                <p style={{
                  fontSize: 13, lineHeight: 1.6, textAlign: 'left', flex: 1,
                  color: dark ? 'rgba(252,165,165,0.95)' : '#991b1b',
                  fontFamily: 'var(--fb)',
                }}>
                  {uploadError}
                </p>
                <button
                  onClick={() => setUploadError('')}
                  aria-label="Dismiss"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 18, lineHeight: 1, flexShrink: 0, padding: '0 2px',
                    color: dark ? 'rgba(252,165,165,0.6)' : '#ef4444',
                  }}
                >×</button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hero heading + subtitle — fade out when choice is active */}
          <AnimatePresence>
            {!showChoice && (
              <motion.div
                key="hero-text"
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10, transition: { duration: 0.22 } }}
                transition={{ duration: 0.48 }}
              >
                <h1 style={{
                  fontSize: 'clamp(36px,6vw,72px)', fontFamily: 'var(--fh)',
                  fontWeight: 800, lineHeight: 1.06, letterSpacing: '-2.5px',
                  marginTop: 28, marginBottom: 22,
                }}>
                  Transform Your Data<br/>
                  <span className="gt">into Instant Insights</span>
                </h1>
                <p style={{
                  fontSize: 18, color: 'var(--t2)', maxWidth: 550,
                  margin: '0 auto 48px', lineHeight: 1.74,
                }}>
                  Upload any dataset and let our Autonomous AI Agent produce full EDA reports,
                  interpret trends, and surface the signals that drive decisions — in seconds.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Component swap: Upload Zone ↔ Action Selector ── */}
          <AnimatePresence mode="wait">

            {/* ── UPLOAD ZONE ── */}
            {!showChoice && (
              <motion.div
                key="upload-zone"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -10 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                style={{ maxWidth: 680, margin: '0 auto' }}
              >
                <div className="card card-glow"
                  style={{
                    padding: '50px 36px', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 12,
                    cursor: proc ? 'default' : 'pointer',
                    border: '2px dashed',
                    borderColor: dragging ? 'var(--teal)' : 'var(--purple)',
                    background: dragging ? 'rgba(20,184,166,.04)' : 'var(--surf)',
                    transform: dragging ? 'scale(1.02)' : 'scale(1)',
                    transition: 'transform .3s cubic-bezier(.34,1.56,.64,1),box-shadow .25s,border-color .2s',
                    pointerEvents: proc ? 'none' : 'auto',
                  }}
                  onClick={() => !proc && fileRef.current.click()}
                  onMouseEnter={e => { if(!proc) e.currentTarget.style.transform='scale(1.018)'; }}
                  onMouseLeave={e => { if(!proc) e.currentTarget.style.transform='scale(1)'; }}
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={e => { e.preventDefault(); setDragging(false); handleFileChosen(e.dataTransfer.files?.[0]?.name, e.dataTransfer.files?.[0]); }}
                >
                  {proc ? (
                    /* ── Spinner ── */
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14, width:'100%' }}>
                      <div style={{ width:64, height:64, borderRadius:'50%', background:'var(--grad)', display:'flex', alignItems:'center', justifyContent:'center', animation:'pulse 1.5s ease-in-out infinite' }}>
                        <div style={{ width:28, height:28, border:'2.5px solid rgba(255,255,255,.25)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin .85s linear infinite' }}/>
                      </div>
                      <p style={{ fontFamily:'var(--fh)', fontSize:15, fontWeight:700 }}>Initializing Generative Insight Engine…</p>
                      <p style={{ fontSize:13, color:'var(--t2)' }}>Preparing your options</p>
                      <div style={{ width:'100%', maxWidth:320, display:'flex', flexDirection:'column', gap:8 }}>
                        <div style={{ display:'flex', gap:10 }}><div className="shim" style={{ flex:2 }}/><div className="shim" style={{ flex:1 }}/></div>
                        <div style={{ display:'flex', gap:10 }}><div className="shim" style={{ flex:1 }}/><div className="shim" style={{ flex:3 }}/></div>
                      </div>
                    </div>
                  ) : (
                    /* ── Idle state ── */
                    <>
                      <div style={{ width:58, height:58, borderRadius:14, background:'rgba(147,51,234,0.10)', border:'1px solid rgba(147,51,234,0.28)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:4 }}>
                        <UploadCloud size={26} color="#9333ea" strokeWidth={2} style={{ opacity:1 }}/>
                      </div>
                      <p style={{ fontFamily:'var(--fh)', fontSize:16, fontWeight:700, color:'var(--t1)' }}>Drag &amp; Drop CSV / Excel or Browse Files</p>
                      <p style={{ fontSize:13.5, color:'var(--t2)', textAlign:'center', maxWidth:380, lineHeight:1.6 }}>
                        Auto-detects schema · Supports up to 500 MB · Zero preprocessing needed
                      </p>
                      <div style={{ display:'flex', gap:8 }}>
                        <span className="chip ch-p">.CSV</span>
                        <span className="chip ch-i">.XLSX</span>
                        <span className="chip ch-t">.XLS</span>
                      </div>
                      <button className="btn btn-p" style={{ marginTop:8 }}
                        onClick={e => { e.stopPropagation(); fileRef.current.click(); }}>
                        Browse Files <ArrowRight size={14}/>
                      </button>
                    </>
                  )}
                </div>
                <p style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--t3)', marginTop:14, justifyContent:'center' }}>
                  <ShieldCheck size={13} color="var(--green)"/>
                  No data stored · Encrypted in transit · GDPR compliant
                </p>
              </motion.div>
            )}

            {/* ── ACTION SELECTOR ── */}
            {showChoice && (
              <motion.div
                key="action-selector"
                initial={{ opacity: 0, scale: 0.96, y: 18 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, x: -56, scale: 0.97 }}
                transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
                style={{ maxWidth: 880, margin: '0 auto', width: '100%' }}
              >
                {/* Status tag */}
                <motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 }}
                  style={{ marginBottom: 16 }}
                >
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    fontSize: 10.5, fontWeight: 700, letterSpacing: '2px',
                    textTransform: 'uppercase', color: 'var(--as-tag-color)', fontFamily: 'var(--fb)',
                    background: 'var(--as-tag-bg)',
                    border: '1px solid var(--as-tag-bd)',
                    padding: '4px 12px', borderRadius: 999,
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--as-tag-color)', boxShadow: '0 0 8px rgba(147,51,234,.7)', display: 'inline-block' }}/>
                    File Analysis Ready
                  </span>
                </motion.div>

                {/* Heading */}
                <motion.h2
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.13 }}
                  style={{
                    fontFamily: 'var(--fh)', fontSize: 'clamp(22px,3.5vw,30px)',
                    fontWeight: 800, letterSpacing: '-0.7px',
                    color: 'var(--t1)', marginBottom: 10,
                  }}
                >
                  How would you like to proceed?
                </motion.h2>

                {/* Filename pill */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }}>
                  <span style={{
                    fontSize: 11.5, color: 'var(--as-file-color)', fontFamily: 'var(--fm)',
                    background: 'var(--as-file-bg)', border: '1px solid var(--as-file-bd)',
                    padding: '4px 14px', borderRadius: 999,
                  }}>{fileName}</span>
                </motion.div>

                {/* Thin divider */}
                <div style={{ height: 1, background: 'var(--as-divider)', margin: '22px 0' }}/>

                {/* Two action cards — side by side, equal visual weight */}
                <div style={{ display: 'flex', gap: 20, textAlign: 'left' }}>
                  <ActionCard
                    icon={Sparkles}
                    iconBg={dark ? 'rgba(147,51,234,0.28)' : '#f3e8ff'}
                    iconBorder={dark ? 'rgba(147,51,234,0.55)' : 'rgba(147,51,234,0.35)'}
                    iconColor={dark ? '#c084fc' : '#9333ea'}
                    title="Generate Executive Report"
                    sub="An autonomous agentic workflow that performs full EDA, identifies trends, and surfaces key insights instantly."
                    btn="✦  Start Full Analysis"
                    onClick={handleGenerate}
                    btnStyle={{
                      background: 'linear-gradient(135deg,#9333ea 0%,#6366F1 100%)',
                      border: 'none', color: '#fff',
                      padding: '11px 18px', borderRadius: 9,
                      fontFamily: 'var(--fh)', fontSize: 13, fontWeight: 700,
                      cursor: 'pointer', width: '100%',
                      boxShadow: '0 2px 12px rgba(147,51,234,0.45), 0 1px 3px rgba(0,0,0,0.20)',
                      transition: 'filter .15s, transform .15s',
                    }}
                  />
                  <ActionCard
                    icon={MessageSquare}
                    iconBg={dark ? 'rgba(8,145,178,0.25)' : '#ecfeff'}
                    iconBorder={dark ? 'rgba(8,145,178,0.50)' : 'rgba(8,145,178,0.30)'}
                    iconColor={dark ? '#22d3ee' : '#0e7490'}
                    title="Interactive Exploration"
                    sub="Customize your analysis parameters, ask specific questions, or chat directly with your dataset for targeted insights."
                    btn="↗  Launch Chat Interface"
                    onClick={() => navigate('/interactive', { state: { fileName, csvPreview } })}
                    btnStyle={dark ? {
                      background: 'linear-gradient(135deg,#1e293b 0%,#312e81 100%)',
                      border: '1px solid rgba(99,102,241,0.35)',
                      color: '#e2e8f0',
                      padding: '11px 18px', borderRadius: 9,
                      fontFamily: 'var(--fh)', fontSize: 13, fontWeight: 700,
                      cursor: 'pointer', width: '100%',
                      boxShadow: '0 2px 12px rgba(30,41,59,0.50), 0 1px 3px rgba(0,0,0,0.25)',
                      transition: 'filter .15s, transform .15s',
                    } : {
                      background: '#0f172a',
                      border: 'none',
                      color: '#f8fafc',
                      padding: '11px 18px', borderRadius: 9,
                      fontFamily: 'var(--fh)', fontSize: 13, fontWeight: 700,
                      cursor: 'pointer', width: '100%',
                      boxShadow: '0 2px 12px rgba(15,23,42,0.35), 0 1px 3px rgba(0,0,0,0.20)',
                      transition: 'filter .15s, transform .15s',
                    }}
                  />
                </div>

                {/* Reset link */}
                <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--t3)' }}>
                  Not sure?{' '}
                  <span
                    onClick={handleReset}
                    style={{ color: 'var(--as-tag-color)', cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted' }}
                  >
                    Upload a different file
                  </span>
                </p>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </section>

      {/* ── ALTERNATING FEATURES ─────────────────────────── */}
      <section style={{ padding:'100px 0', background:'var(--surf2)', borderTop:'1px solid var(--bd)', borderBottom:'1px solid var(--bd)', transition:'background .4s' }}>
        <div className="wrap">
          <FV><span className="slabel" style={{ textAlign:'center', display:'block' }}>Core Capabilities</span></FV>
          <FV delay={.08}>
            <h2 className="stitle" style={{ textAlign:'center', marginBottom:14 }}>
              Automated EDA that{' '}<span className="gt">interprets trends</span>,<br/>not just plots them
            </h2>
          </FV>
          <FV delay={.16}>
            <p className="ssub" style={{ textAlign:'center', maxWidth:500, margin:'0 auto 72px' }}>
              Three intelligent layers that turn raw datasets into boardroom-ready decisions.
            </p>
          </FV>

          {featData.map((f, fi) => (
            <div key={f.title} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:80, alignItems:'center', marginBottom: fi < featData.length-1 ? 100 : 0, direction: f.reverse ? 'rtl' : 'ltr' }}>
              <FV x={f.reverse ? 30 : -30}>
                <div style={{ direction:'ltr' }}>
                  <div style={{ width:50, height:50, borderRadius:13, background:f.bg, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14 }}>
                    <f.icon size={22} color={f.color} strokeWidth={1.8}/>
                  </div>
                  <span className={`chip ${f.chipCls}`} style={{ marginBottom:14, display:'inline-flex' }}>{f.tag}</span>
                  <h3 style={{ fontFamily:'var(--fh)', fontSize:28, fontWeight:800, letterSpacing:'-.8px', color:'var(--t1)', marginBottom:14, marginTop:4, lineHeight:1.2 }}>{f.title}</h3>
                  <p style={{ fontSize:15, color:'var(--t2)', lineHeight:1.74, marginBottom:22 }}>{f.desc}</p>
                  <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:10 }}>
                    {f.bullets.map((b,i) => (
                      <li key={i} style={{ display:'flex', alignItems:'center', gap:9, fontSize:14, color:'var(--t2)' }}>
                        <CheckCircle2 size={14} color="var(--green)" strokeWidth={2} style={{ flexShrink:0 }}/>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </FV>
              <FV delay={.15}>
                <div style={{ display:'flex', justifyContent:'center', direction:'ltr' }}>{f.viz}</div>
              </FV>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section style={{ padding:'60px 0', borderTop:'1px solid var(--bd)', transition:'border-color .4s' }}>
        <FV>
          <div className="wrap">
            <div className="card" style={{ display:'flex', alignItems:'center', gap:24, padding:'32px 36px', maxWidth:860, margin:'0 auto' }}>
              <Zap size={28} color="var(--purple)" strokeWidth={1.6}/>
              <div>
                <h3 style={{ fontFamily:'var(--fh)', fontSize:20, fontWeight:700, letterSpacing:'-.4px', marginBottom:4 }}>Ready to analyse your first dataset?</h3>
                <p style={{ fontSize:14, color:'var(--t2)' }}>No sign-up required for the first three reports.</p>
              </div>
              <button className="btn btn-p" style={{ marginLeft:'auto', flexShrink:0, display:'flex', alignItems:'center', gap:8 }}
                onClick={ctaClick}>
                Start for Free <ArrowRight size={15}/>
              </button>
            </div>
          </div>
        </FV>
      </section>

      <footer className="footer">© 2025 <b>PromptInsights</b> — Generative Insight Engine</footer>
    </motion.div>
  );
}

/* ── Correlation Viz (unchanged) ────────────────────────── */
function CorrelationViz() {
  const labels = ['rev','dur','age','churn'];
  const vals = [['1.00','0.71','0.38','-0.22'],['0.71','1.00','0.55','-0.61'],['0.38','0.55','1.00','0.18'],['-0.22','-0.61','0.18','1.00']];
  const bg = v => {
    const n = parseFloat(v);
    if(n>=.8) return '#7C3AED'; if(n>=.5) return '#6366F1'; if(n>=.2) return '#14B8A6';
    if(n>=0)  return 'var(--surf3)'; return '#EF4444';
  };
  return (
    <div style={{ background:'var(--surf)', border:'1px solid var(--bd)', borderRadius:'var(--r4)', padding:'24px 22px', boxShadow:'var(--sh-lg)', minWidth:300 }}>
      <div style={{ fontSize:11, fontWeight:600, color:'var(--t3)', marginBottom:16, fontFamily:'var(--fm)', letterSpacing:'1px', textTransform:'uppercase' }}>Correlation Matrix</div>
      <div style={{ display:'grid', gridTemplateColumns:'auto repeat(4,1fr)', gap:4 }}>
        <div/>
        {labels.map(l => <div key={l} style={{ textAlign:'center', fontSize:10, fontFamily:'var(--fm)', color:'var(--t3)', paddingBottom:4 }}>{l}</div>)}
        {vals.map((row, ri) => [
          <div key={`l${ri}`} style={{ fontSize:10, fontFamily:'var(--fm)', color:'var(--t3)', display:'flex', alignItems:'center', paddingRight:6 }}>{labels[ri]}</div>,
          ...row.map((v, ci) => (
            <motion.div key={`${ri}-${ci}`}
              initial={{ opacity:0, scale:.7 }} animate={{ opacity:1, scale:1 }}
              transition={{ delay:(ri*4+ci)*.035, duration:.28 }}
              style={{ aspectRatio:'1', borderRadius:5, background:bg(v), display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontFamily:'var(--fm)', color: Math.abs(parseFloat(v))>.3 ? '#fff' : 'var(--t3)', fontWeight:600, padding:'10px 4px' }}>
              {v}
            </motion.div>
          ))
        ])}
      </div>
    </div>
  );
}
