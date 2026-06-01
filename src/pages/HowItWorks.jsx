import { useRef, useState, useEffect } from 'react';
import { motion, useInView, useMotionValue, animate } from 'framer-motion';
import { HardDriveUpload, Layers, Cpu, FileBarChart2, ArrowRight, ChevronDown } from 'lucide-react';

function FV({ children, delay=0, x=0, className='' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once:true, margin:'-60px' });
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity:0, y:28, x }}
      animate={inView ? { opacity:1, y:0, x:0 } : {}}
      transition={{ duration:.55, delay, ease:[.22,1,.36,1] }}>
      {children}
    </motion.div>
  );
}

const STEPS = [
  {
    num:'01', Icon:HardDriveUpload, color:'#7C3AED', bg:'rgba(124,58,237,.1)',
    sub:'Any format, zero friction',
    title:'Data Ingestion',
    body:'Upload CSV, Excel, or JSON directly via the drop-zone. Our ingestion pipeline parses raw bytes, detects encoding, infers delimiters, and streams the data into an in-memory DataFrame — without ever persisting your file to permanent storage.',
    detail:'Supports up to 500 MB · UTF-8, Latin-1 auto-detected · Streaming parse',
    Viz: IngestionViz,
  },
  {
    num:'02', Icon:Layers, color:'#6366F1', bg:'rgba(99,102,241,.1)',
    sub:'Schema-aware profiling',
    title:'Metadata Extraction',
    body:'The agent walks every column, classifying types (numeric, categorical, boolean, datetime), measuring null rates, computing cardinality, and flagging potential key columns. This metadata becomes the LLM\'s map of your data before a single analysis runs.',
    detail:'Type inference · Null detection · Cardinality scoring · Key-column heuristics',
    Viz: MetadataViz,
  },
  {
    num:'03', Icon:Cpu, color:'#14B8A6', bg:'rgba(20,184,166,.1)',
    sub:'LLM as Orchestrator',
    title:'Agentic Execution',
    body:'Our Autonomous AI Agent uses an LLM as an Orchestrator: it reads the metadata, selects appropriate statistical methods, writes Python scripts (pandas, scipy, statsmodels), executes them in an isolated sandbox, verifies the outputs, and retries on failure — automatically.',
    detail:'LLM Orchestrator · Isolated Python sandbox · Self-verifying · Auto-retry on failure',
    Viz: AgentViz,
  },
  {
    num:'04', Icon:FileBarChart2, color:'#10B981', bg:'rgba(16,185,129,.1)',
    sub:'Narrative + visual output',
    title:'Report Generation',
    body:'Execution results feed back into the LLM, which synthesises findings into a structured narrative: distribution insights, correlation summaries, anomaly explanations, and ranked recommendations — all exported as interactive charts, a readable document, and the Python source code.',
    detail:'Narrative summary · Interactive charts · Python code export · PDF download',
    Viz: ReportViz,
  },
];

export default function HowItWorks() {
  const cardsContainer = {
    initial: {},
    animate: { transition: { staggerChildren: 0.2 } },
  };

  const cardEntry = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
  };

  const stepChild = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
  };

  return (
    <div className="pe">
      <section style={{ position:'relative', overflow:'hidden', padding:'100px 0 96px', minHeight:'68vh', display:'flex', alignItems:'center', justifyContent:'center', textAlign:'center', background:'transparent', transition:'background .4s' }}>
        <div style={{ position:'absolute', inset:0, pointerEvents:'none', zIndex:0 }}>
          <div style={{ position:'absolute', top:'5%', left:'5%', width:520, height:520, borderRadius:'50%', background:'rgba(147,51,234,.06)', filter:'blur(120px)' }} />
          <div style={{ position:'absolute', bottom:'10%', right:'10%', width:560, height:560, borderRadius:'50%', background:'rgba(59,130,246,.055)', filter:'blur(120px)' }} />
        </div>
        <div className="wrap" style={{ position:'relative', zIndex:1 }}>
          <motion.span className="slabel" style={{ display:'block', textAlign:'center' }}
            initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ duration:.5 }}>
            The Process
          </motion.span>
          <motion.h1 className="stitle" style={{ maxWidth:700, margin:'12px auto 18px', textAlign:'center' }}
            initial={{ opacity:0,y:22 }} animate={{ opacity:1,y:0 }} transition={{ duration:.55,delay:.08 }}>
            From raw file to{' '}<span className="gt">boardroom-ready report</span>
          </motion.h1>
          <motion.p className="ssub" style={{ maxWidth:500, margin:'20px auto 0', textAlign:'center' }}
            initial={{ opacity:0,y:18 }} animate={{ opacity:1,y:0 }} transition={{ duration:.5,delay:.16 }}>
            Four agentic stages powered by LLM orchestration and isolated Python execution — transparent, auditable, reproducible.
          </motion.p>
        </div>
        <motion.div style={{ position:'absolute', left:'50%', bottom:20, transform:'translateX(-50%)', display:'flex', flexDirection:'column', alignItems:'center', gap:6, color:'var(--t3)', zIndex:1 }}
          animate={{ y:[0,8,0] }} transition={{ duration:1.5, repeat:Infinity, ease:'easeInOut' }}>
          <ChevronDown size={20} />
        </motion.div>
      </section>

      <section style={{ padding:'80px 0 100px' }}>
        <motion.div className="wrap" style={{ display:'flex', flexDirection:'column', gap:0 }}
          initial="initial" animate="animate"
          variants={cardsContainer}>
          {STEPS.map((step, i) => {
            const flip = i%2===1;
            const visualDelay = i < 2 ? 0.15 : 0;
            return (
              <motion.div key={step.num} style={{ position:'relative' }}
                variants={cardEntry} whileHover={{ y:-5, transition:{ duration:0.2 } }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:80, alignItems:'center', padding:'60px 0', borderBottom: i<STEPS.length-1 ? '1px solid var(--bd)' : 'none', direction: flip ? 'rtl':'ltr' }}>
                  {/* Connector */}
                  {i < STEPS.length-1 && (
                    <div style={{ position:'absolute', left:'50%', bottom:-1, transform:'translateX(-50%)', display:'flex', flexDirection:'column', alignItems:'center', zIndex:2, color:'var(--bd2)' }}>
                      <motion.div initial={{ scaleY:0 }} whileInView={{ scaleY:1 }} viewport={{ once:true }} transition={{ duration:.7, delay:.4 }}
                        style={{ width:2, height:38, background:'var(--grad)', borderRadius:1, opacity:.45, transformOrigin:'top' }}/>
                      <ChevronDown size={16}/>
                    </div>
                  )}

                  {/* Content */}
                  <motion.div variants={stepChild} style={{ direction:'ltr' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
                      <span style={{ fontFamily:'var(--fm)', fontSize:11, fontWeight:600, letterSpacing:2, color:'var(--t3)' }}>{step.num}</span>
                      <div style={{ width:48, height:48, borderRadius:13, background:step.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <step.Icon size={22} color={step.color} strokeWidth={1.8}/>
                      </div>
                    </div>
                    <motion.p variants={stepChild} style={{ fontSize:11, fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:step.color, fontFamily:'var(--fm)', marginBottom:10 }}>{step.sub}</motion.p>
                    <motion.h2 variants={stepChild} style={{ fontFamily:'var(--fh)', fontSize:'clamp(22px,3vw,32px)', fontWeight:800, letterSpacing:'-.7px', color:'var(--t1)', marginBottom:16, lineHeight:1.18 }}>{step.title}</motion.h2>
                    <motion.p variants={stepChild} style={{ fontSize:15, color:'var(--t2)', lineHeight:1.74, marginBottom:14 }}>{step.body}</motion.p>
                    <motion.div variants={stepChild} style={{ fontSize:12, color:'var(--t3)', fontFamily:'var(--fm)', lineHeight:1.7, padding:'10px 14px', background:'var(--surf2)', borderRadius:'var(--r1)', borderLeft:`3px solid ${step.color}` }}>
                      {step.detail}
                    </motion.div>
                  </motion.div>

                  {/* Visual */}
                  <motion.div variants={stepChild} transition={{ duration:0.8, ease:'easeOut', delay:visualDelay }} style={{ display:'flex', justifyContent:'center', direction:'ltr' }}>
                    <step.Viz color={step.color}/>
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      <footer className="footer">© 2025 <b>PromptInsights</b> — Generative Insight Engine</footer>
    </div>
  );
}

/* ── STEP VISUALS ── */
function VizCard({ label, color, children }) {
  const accentGlow = color === '#7C3AED'
    ? 'rgba(124,58,237,.24)'
    : color === '#6366F1'
      ? 'rgba(99,102,241,.24)'
      : color === '#14B8A6'
        ? 'rgba(20,184,166,.2)'
        : color === '#10B981'
          ? 'rgba(16,185,129,.2)'
          : 'rgba(124,58,237,.2)';

  return (
    <motion.div className="viz-card" whileHover={{ y:-5, transition:{ duration:0.2 } }}
      style={{ '--accent-glow': accentGlow, background:'var(--surf)', border:'1px solid var(--bd)', borderRadius:'var(--r4)', padding:'24px 22px', boxShadow:'var(--sh-sm)', width:'100%', maxWidth:400 }}>
      <div style={{ fontSize:11, fontWeight:600, letterSpacing:'1.5px', textTransform:'uppercase', color:'var(--t3)', marginBottom:16, fontFamily:'var(--fm)' }}>{label}</div>
      {children}
    </motion.div>
  );
}

function AnimatedPercent({ target, inView }) {
  const motionValue = useMotionValue(0);
  const [display, setDisplay] = useState('0%');

  useEffect(() => {
    if (!inView) return;
    const controls = animate(motionValue, target, {
      duration: 1.1,
      ease: 'easeOut',
      onUpdate(latest) {
        const value = Number.isInteger(target) ? Math.round(latest) : Math.round(latest * 10) / 10;
        setDisplay(`${value}%`);
      },
    });
    return () => controls.stop();
  }, [target, inView, motionValue]);

  return <span>{display}</span>;
}

function IngestionViz({ color }) {
  const files = [
    { name:'sales_q3.csv', size:'12.4 MB', color:'#7C3AED' },
    { name:'customers.xlsx', size:'8.1 MB', color:'#6366F1' },
    { name:'transactions.csv', size:'45.2 MB', color:'#14B8A6' },
  ];
  return (
    <VizCard label="Ingestion Pipeline" color={color}>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {files.map((f,i) => (
          <motion.div key={f.name}
            initial={{ opacity:0, x:-18 }} animate={{ opacity:1, x:0 }}
            transition={{ delay:i*.18, duration:.45, ease:[.22,1,.36,1] }}
            style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px', background:'var(--surf2)', borderRadius:'var(--r2)' }}>
            <HardDriveUpload size={15} color={f.color} strokeWidth={1.8} style={{ flexShrink:0 }}/>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight:600, color:'var(--t1)', fontFamily:'var(--fm)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.name}</div>
              <div style={{ fontSize:10, color:'var(--t3)' }}>{f.size}</div>
            </div>
            <motion.div animate={{ backgroundPosition:['-200% 0%','200% 0%'] }} transition={{ delay:i*.18+.3, duration:1.5, repeat:Infinity, ease:'linear' }}
              style={{ height:4, width:56, borderRadius:2, background:`linear-gradient(90deg, rgba(255,255,255,.15), rgba(255,255,255,.55), rgba(255,255,255,.15)), ${f.color}`, backgroundSize:'200% 100%', transformOrigin:'left', opacity:.85 }}/>
          </motion.div>
        ))}
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:.9 }}
          style={{ marginTop:4, padding:'8px 12px', background:'rgba(16,185,129,.1)', borderRadius:'var(--r1)', fontSize:12, color:'var(--green)', display:'flex', alignItems:'center', gap:6 }}>
          <ArrowRight size={11}/> 3 files parsed · 65.7 MB · Encoding: UTF-8
        </motion.div>
      </div>
    </VizCard>
  );
}

function MetadataViz({ color }) {
  const cols = [
    { name:'user_id', type:'INT', nulls:'0%', c:'#7C3AED' },
    { name:'revenue', type:'FLOAT', nulls:'0%', c:'#6366F1' },
    { name:'country', type:'OBJECT', nulls:'3.4%', c:'#14B8A6' },
    { name:'last_login', type:'DATETIME', nulls:'5.1%', c:'#F59E0B' },
    { name:'score', type:'FLOAT', nulls:'12.3%', c:'#EF4444' },
  ];
  const ref = useRef(null);
  const inView = useInView(ref, { once:true, amount:0.2 });

  return (
    <motion.div ref={ref} initial={{ opacity:0, y:10 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true, amount:0.2 }}>
      <VizCard label="Schema Extraction" color={color}>
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {cols.map((col,i) => (
            <motion.div key={col.name}
              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
              transition={{ delay:i*.1, duration:.35 }}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', background:'var(--surf2)', borderRadius:'var(--r1)' }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:col.c, flexShrink:0 }}/>
              <span style={{ fontSize:11, fontFamily:'var(--fm)', color:'var(--t1)', flex:1 }}>{col.name}</span>
              <span style={{ fontSize:10, background:`${col.c}18`, color:col.c, padding:'2px 6px', borderRadius:4, fontFamily:'var(--fm)', fontWeight:700 }}>{col.type}</span>
              <span style={{ fontSize:10, color: parseFloat(col.nulls)>5?'#EF4444':parseFloat(col.nulls)>0?'#F59E0B':'var(--green)', fontFamily:'var(--fm)' }}>
                <AnimatedPercent target={Number(col.nulls.replace('%',''))} inView={inView} />
              </span>
            </motion.div>
          ))}
        </div>
      </VizCard>
    </motion.div>
  );
}

function AgentViz({ color }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once:true, amount:0.2 });
  const steps = [
    { label:'Read metadata', done:true },
    { label:'Select methods', done:true },
    { label:'Write Python script', done:true },
    { label:'Execute sandbox', done:false, active:true },
    { label:'Verify outputs', done:false },
  ];
  return (
    <motion.div ref={ref} initial={{ opacity:0, y:10 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true, amount:0.2 }}>
      <VizCard label="Agent Execution Log" color={color}>
        <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
          {steps.map((s,i) => (
            <motion.div key={s.label}
              initial={{ opacity:0, x:-12 }} animate={inView ? { opacity:1, x:0 } : {}}
              transition={{ delay:i*.18, duration:.4, ease:'easeOut' }}
              style={{ display:'flex', alignItems:'center', gap:10, opacity: !s.done && !s.active ? .35 : 1 }}>
              {s.done ? (
                <motion.span initial={{ scale:.8, opacity:0 }} animate={{ scale:1, opacity:1 }} transition={{ duration:.25 }}
                  style={{ width:18, height:18, borderRadius:'50%', background:'var(--green)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <svg width="10" height="10" viewBox="0 0 10 10"><polyline points="1.5,5 3.5,7.5 8.5,2.5" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round"/></svg>
                </motion.span>
              ) : s.active ? (
                <motion.span animate={{ scale:[1,1.2,1], opacity:[1,.6,1] }} transition={{ duration:1.2, repeat:Infinity }}
                  style={{ width:18, height:18, borderRadius:'50%', background:'var(--teal)', flexShrink:0 }}/>
              ) : (
                <span style={{ width:18, height:18, borderRadius:'50%', border:'1.5px solid var(--bd2)', flexShrink:0 }}/>
              )}
              <span style={{ fontSize:12, fontFamily:'var(--fm)', color: s.active?'var(--teal)':s.done?'var(--t1)':'var(--t3)' }}>
                {s.label}{s.active && <motion.span animate={{ opacity:[1,0] }} transition={{ duration:.6, repeat:Infinity }}>_</motion.span>}
              </span>
            </motion.div>
          ))}
        </div>
      </VizCard>
    </motion.div>
  );
}

function ReportViz({ color }) {
  return (
    <VizCard label="Report Output" color={color}>
      <motion.div animate={{ scaleX:[1,1.06,1] }} transition={{ duration:1.8, repeat:Infinity, ease:'easeIn' }}
        style={{ height:2, borderRadius:2, background:'var(--grad)', marginBottom:14, transformOrigin:'center' }}/>
      <p style={{ fontSize:13, color:'var(--t2)', lineHeight:1.72, marginBottom:14 }}>
        Revenue exhibits a <strong style={{ color:'var(--t1)' }}>moderate right skew</strong> (σ=1.42). Churn correlates with session duration at <strong style={{ color:'var(--purple)' }}>r=−0.61</strong>…
      </p>
      <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
        {['narrative.md','charts.html','analysis.py','report.pdf'].map((f) => (
          <span key={f}
            style={{ fontSize:10, fontFamily:'var(--fm)', padding:'3px 8px', background:'var(--surf2)', border:'1px solid var(--bd)', borderRadius:'var(--r1)', color:'var(--t2)' }}>
            {f}
          </span>
        ))}
      </div>
    </VizCard>
  );
}
