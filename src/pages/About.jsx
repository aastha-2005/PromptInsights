import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Target, Cpu, GitMerge, ShieldCheck, Code2, Database, ArrowRight } from 'lucide-react';

function FV({ children, delay=0, className='' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once:true, margin:'-60px' });
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity:0, y:28 }}
      animate={inView ? { opacity:1, y:0 } : {}}
      transition={{ duration:.55, delay, ease:[.22,1,.36,1] }}>
      {children}
    </motion.div>
  );
}

export default function About() {
  const pillars = [
    { Icon:Target, color:'#7C3AED', bg:'rgba(124,58,237,.1)', label:'What It Is', title:'An Intelligent Bridge',
      body:'PromptInsights is the intelligent bridge between raw datasets and confident decision-making. Where traditional BI tools demand SQL fluency and manual chart-building, we remove that friction entirely. Upload once. Understand immediately. Act decisively.' },
    { Icon:Cpu, color:'#6366F1', bg:'rgba(99,102,241,.1)', label:'What We Provide', title:'Automated EDA That Interprets',
      body:"Automated Exploratory Data Analysis that doesn't stop at describing what's in your dataset — it interprets the trends, surfaces the anomalies, and prioritises the signals that matter. Narrative-first. Numbers second. Always actionable." },
    { Icon:GitMerge, color:'#14B8A6', bg:'rgba(20,184,166,.1)', label:'How We Do It', title:'LLMs as Orchestrators',
      body:'We use Large Language Models as Orchestrators: they write Python-based analysis scripts, execute them locally in isolated sandboxes, verify the outputs, and synthesise results into coherent narratives — without a human in the loop. No black-box AI.' },
  ];

  const values = [
    { Icon:ShieldCheck, color:'#7C3AED', bg:'rgba(124,58,237,.1)', title:'Reliability',
      desc:'Every report is deterministic and reproducible. Our agentic execution layer verifies outputs before surfacing them. If a script fails, the agent retries with a corrected approach — automatically.' },
    { Icon:Code2, color:'#6366F1', bg:'rgba(99,102,241,.1)', title:'Code Transparency',
      desc:"No black-box AI. Every insight ships with the Python source code that produced it. You can read it, run it, modify it, and trust it. Auditability is not an add-on — it is the foundation." },
    { Icon:Database, color:'#14B8A6', bg:'rgba(20,184,166,.1)', title:'Data Sovereignty',
      desc:'Your data never leaves your session. Files are processed in isolated, ephemeral sandboxes. Nothing is persisted, indexed, or used for model training. Your dataset belongs entirely to you.' },
  ];

  const team = [
    { i:'KB', name:'Kajal Bhatiya',   role:'Frontend Developer',            c:'#F87171' },
    { i:'PP', name:'Parth Patel',     role:'UI/UX Developer',               c:'#60A5FA' },
    { i:'AB', name:'Aastha Bhavsar', role:'Backend Engineer',              c:'#A78BFA' },
    { i:'PJ', name:'Prayag Joshi',   role:'Data Pipeline & LLM',           c:'#2DD4BF' },
    { i:'MK', name:'Manish Khairnar',role:'Data Analyst & Insights Engineer', c:'#6EE7B7' },
  ];

  return (
    <div className="pe">
      {/* Hero */}
      <section style={{ position:'relative', minHeight:'90vh', padding:'120px 0', display:'flex', flexDirection:'column', justifyContent:'center', textAlign:'center', background:'var(--surf2)', borderBottom:'1px solid var(--bd)', transition:'background .4s' }}>
        <div style={{ position:'absolute', inset:0, pointerEvents:'none', zIndex:0 }}>
          <div style={{ position:'absolute', top:'8%', left:'6%', width:320, height:320, borderRadius:'50%', background:'radial-gradient(circle, rgba(147,51,234,.12) 0%, transparent 58%)', filter:'blur(30px)' }} />
          <div style={{ position:'absolute', bottom:'6%', right:'10%', width:360, height:360, borderRadius:'50%', background:'radial-gradient(circle, rgba(99,102,241,.08) 0%, transparent 60%)', filter:'blur(28px)' }} />
          <motion.div style={{ position:'absolute', top:'24%', right:'18%', width:60, height:60, borderRadius:'50%', background:'rgba(147,51,234,.14)', filter:'blur(12px)' }} animate={{ y:[0,12,0] }} transition={{ duration:14, repeat:Infinity, ease:'easeInOut' }} />
        </div>
        <div className="wrap" style={{ position:'relative', zIndex:1 }}>
          <motion.span className="slabel" style={{ display:'block', textAlign:'center', marginBottom:24 }}
            initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ duration:.5 }}>
            About PromptInsights
          </motion.span>
          <motion.h1 className="stitle" style={{ maxWidth:820, margin:'0 auto 18px', textAlign:'center' }}
            initial={{ opacity:0,y:22 }} animate={{ opacity:1,y:0 }} transition={{ duration:.55,delay:.08 }}>
            Empowering data-driven organizations to move from raw data to{' '}
            <span className="gt">executive insight</span> in seconds
          </motion.h1>
          <motion.p className="ssub" style={{ maxWidth:500, margin:'0 auto', textAlign:'center' }}
            initial={{ opacity:0,y:18 }} animate={{ opacity:1,y:0 }} transition={{ duration:.5,delay:.16 }}>
            We are not a dashboard tool. We are the intelligence layer between your data and the decisions that move your organization forward.
          </motion.p>
        </div>
      </section>

      {/* What / What / How */}
      <section style={{ padding:'90px 0', borderBottom:'1px solid var(--bd)' }}>
        <div className="wrap">
          <FV><span className="slabel" style={{ display:'block', textAlign:'center' }}>What we are</span></FV>
          <FV delay={.08}>
            <h2 className="stitle" style={{ textAlign:'center', marginBottom:14 }}>
              The intelligence layer<br/><span className="gt">between your data and your decisions</span>
            </h2>
          </FV>
          <FV delay={.16}><p className="ssub" style={{ textAlign:'center', maxWidth:500, margin:'0 auto 52px' }}>Three pillars that define how PromptInsights works and why it's different.</p></FV>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(290px,1fr))', gap:20 }}>
            {pillars.map((p,i) => (
              <FV key={p.title} delay={i*.1}>
                <div className="card card-glow" style={{ padding:'30px 28px', height:'100%' }}>
                  <div style={{ width:50, height:50, borderRadius:13, background:p.bg, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14 }}>
                    <p.Icon size={22} color={p.color} strokeWidth={1.8}/>
                  </div>
                  <span style={{ fontSize:11, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', color:p.color, fontFamily:'var(--fm)', marginBottom:8, display:'block' }}>{p.label}</span>
                  <h3 style={{ fontFamily:'var(--fh)', fontSize:18, fontWeight:700, letterSpacing:'-.3px', color:'var(--t1)', marginBottom:10 }}>{p.title}</h3>
                  <p style={{ fontSize:14, color:'var(--t2)', lineHeight:1.72 }}>{p.body}</p>
                </div>
              </FV>
            ))}
          </div>
        </div>
      </section>

      {/* Agentic Architecture */}
      <section style={{ position:'relative', padding:'90px 0', background:'var(--surf2)', borderBottom:'1px solid var(--bd)', transition:'background .4s' }}>
        <div style={{ position:'absolute', inset:'15% 0 0 55%', pointerEvents:'none', zIndex:0 }}>
          <div style={{ width:120, height:120, borderRadius:'50%', background:'rgba(99,102,241,.1)', filter:'blur(18px)' }} />
        </div>
        <div className="wrap" style={{ position:'relative', zIndex:1 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:80, alignItems:'center' }}>
            <FV>
              <span className="slabel">Our Technology</span>
              <h2 className="stitle" style={{ marginBottom:20, marginTop:8 }}>
                Agentic Architecture —<br/><span className="gt">LLMs that Write and Verify Code</span>
              </h2>
              {[
                'Most AI analytics tools pass your question to an LLM and return a paragraph. PromptInsights goes further: our LLM acts as an Orchestrator.',
                'It reads your dataset\'s schema, selects statistically appropriate methods, writes Python scripts using pandas, scipy, and statsmodels, executes them in an isolated sandbox, checks the results for consistency, and retries automatically on failure.',
                'The result: every insight is backed by auditable, reproducible code. No black-box AI. No unexplained conclusions.',
              ].map((t,i) => (
                <p key={i} style={{ fontSize:15, color:'var(--t2)', lineHeight:1.74, marginBottom:16 }}>
                  {t.includes('Orchestrator') ? <>{t.split('Orchestrator')[0]}<strong style={{ color:'var(--t1)' }}>Orchestrator</strong>{t.split('Orchestrator')[1]}</> :
                   t.includes('No black-box') ? <>{t.split('No black-box')[0]}<strong style={{ color:'var(--purple)' }}>No black-box AI.</strong>{t.split('No black-box AI.')[1]}</> : t}
                </p>
              ))}
            </FV>
            <FV delay={.15}>
              <ArchDiagram/>
            </FV>
          </div>
        </div>
      </section>

      {/* Values */}
      <section style={{ padding:'90px 0', borderBottom:'1px solid var(--bd)' }}>
        <div className="wrap">
          <FV><span className="slabel" style={{ display:'block', textAlign:'center' }}>Our Values</span></FV>
          <FV delay={.08}><h2 className="stitle" style={{ textAlign:'center', marginBottom:48, marginTop:10 }}>Three principles we never compromise</h2></FV>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:20 }}>
            {values.map((v,i) => (
              <FV key={v.title} delay={i*.1}>
                <div className="card card-glow" style={{ padding:'30px 28px', height:'100%' }}>
                  <div style={{ width:48, height:48, borderRadius:13, background:v.bg, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
                    <v.Icon size={22} color={v.color} strokeWidth={1.8}/>
                  </div>
                  <h3 style={{ fontFamily:'var(--fh)', fontSize:18, fontWeight:700, letterSpacing:'-.3px', color:'var(--t1)', marginBottom:10 }}>{v.title}</h3>
                  <p style={{ fontSize:14, color:'var(--t2)', lineHeight:1.72 }}>{v.desc}</p>
                </div>
              </FV>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section style={{ padding:'90px 0', background:'var(--surf2)', transition:'background .4s' }}>
        <div className="wrap">
          <FV><span className="slabel" style={{ display:'block', textAlign:'center' }}>The team</span></FV>
          <FV delay={.08}><h2 className="stitle" style={{ textAlign:'center', marginBottom:48, marginTop:10 }}>Engineered to <span className="gt">simplify</span> data complexity</h2></FV>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))', gridAutoRows:'1fr', gap:16, maxWidth:1100, margin:'0 auto', alignItems:'stretch' }}>
            {team.map((m,i) => (
              /* height:100% wrapper ensures FV's motion.div stretches to fill the grid row */
              <div key={m.name} style={{ height:'100%' }}>
                <FV delay={i*.09}>
                  <div className="card" style={{ padding:'28px 22px', textAlign:'center', height:'100%', minHeight:200, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', boxSizing:'border-box' }}>
                    <div style={{ width:56, height:56, borderRadius:'50%', background:`${m.c}22`, color:m.c, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700, fontFamily:'var(--fh)', marginBottom:16, flexShrink:0 }}>{m.i}</div>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flex:1 }}>
                      <h4 style={{ fontFamily:'var(--fh)', fontSize:15, fontWeight:700, marginBottom:6, lineHeight:1.3 }}>{m.name}</h4>
                      <p style={{ fontSize:12.5, color:'var(--t2)', lineHeight:1.45, minHeight:36, display:'flex', alignItems:'center', textAlign:'center', padding:'0 4px' }}>{m.role}</p>
                    </div>
                  </div>
                </FV>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="footer">© 2025 <b>PromptInsights</b> — Generative Insight Engine</footer>
    </div>
  );
}

function ArchDiagram() {
  const nodes = [
    { label:'Your Dataset',       color:'#9333ea' },
    { label:'LLM Orchestrator',   color:'#6366F1' },
    { label:'Python Sandbox',     color:'#14B8A6' },
    { label:'Verified Outputs',   color:'#10B981' },
    { label:'Insight Report',     color:'#F59E0B' },
  ];
  return (
    <div style={{ background:'var(--surf)', border:'1px solid var(--bd)', borderRadius:'var(--r3)', padding:'28px 24px', boxShadow:'var(--sh-sm)' }}>
      <div style={{ fontSize:11, fontWeight:600, letterSpacing:'1.5px', textTransform:'uppercase', color:'var(--t3)', marginBottom:20, fontFamily:'var(--fm)' }}>Agentic Pipeline</div>
      <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
        {nodes.map((n,i) => (
          <div key={n.label}>
            <motion.div
              initial={{ opacity:0, x:-14 }} animate={{ opacity:1, x:0 }}
              transition={{ delay:i*.18, duration:.4 }}
              style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 14px', background:'transparent', borderRadius:'var(--r2)', border:`1px solid ${n.color}33` }}>
              <div style={{ width:10, height:10, borderRadius:'50%', background:n.color, flexShrink:0 }}/>
              <span style={{ fontSize:13, fontWeight:600, color:'var(--t1)' }}>{n.label}</span>
              {i===2 && <span style={{ marginLeft:'auto', fontSize:11, color:n.color, fontFamily:'var(--fm)', fontWeight:600 }}>isolated</span>}
            </motion.div>
            {i < nodes.length-1 && (
              <motion.div initial={{ scaleY:0 }} animate={{ scaleY:1 }} transition={{ delay:i*.18+.3, duration:.28 }}
                style={{ width:2, height:18, background:`${n.color}55`, margin:'0 18px', transformOrigin:'top' }}/>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
