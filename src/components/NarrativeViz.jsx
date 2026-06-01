import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, TrendingUp, AlertTriangle, Sparkles } from 'lucide-react';

const TEXT = 'Revenue exhibits a moderate right skew (σ=1.42). A small cohort of high-value customers drives disproportionate return. Weekly conversion rate outpaces session growth — a strong product-market fit signal…';

const insights = [
  { Icon: TrendingUp,    color: '#10B981', text: 'Sustained +61.7% revenue trajectory' },
  { Icon: AlertTriangle, color: '#F59E0B', text: '12.3% null rate in score column' },
  { Icon: Sparkles,      color: '#7C3AED', text: 'Churn correlates with session_dur (r=−0.61)' },
];

export default function NarrativeViz() {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    setDisplayed(''); setDone(false);
    const t = setInterval(() => {
      i++;
      setDisplayed(TEXT.slice(0, i));
      if (i >= TEXT.length) { clearInterval(t); setDone(true); }
    }, 22);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      background: 'var(--surf)', border: '1px solid var(--bd)',
      borderRadius: 'var(--r4)', padding: '24px 20px',
      boxShadow: 'var(--sh-lg)', minWidth: 300, maxWidth: 400,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 9,
          background: 'rgba(124,58,237,.1)', border: '1px solid rgba(124,58,237,.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <FileText size={15} color="var(--purple)" strokeWidth={1.8}/>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>AI-Narrative Summary</div>
          <div style={{ fontSize: 11, color: 'var(--t3)', fontFamily: 'var(--fm)' }}>Generative Insight Engine</div>
        </div>
        <motion.div animate={{ opacity: done ? 0 : 1 }} transition={{ duration: .3 }}
          style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: 'var(--green)' }}/>
      </div>

      {/* Gradient rule */}
      <div style={{ height: 2, borderRadius: 2, background: 'var(--grad)', marginBottom: 14 }}/>

      {/* Typing text */}
      <div style={{ fontSize: 13, lineHeight: 1.74, color: 'var(--t2)', minHeight: 85, marginBottom: 16 }}>
        {displayed}
        {!done && (
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: .5, repeat: Infinity }}
            style={{ display: 'inline-block', width: 2, height: 12, background: 'var(--purple)', marginLeft: 2, verticalAlign: 'middle' }}
          />
        )}
      </div>

      {/* Insights — appear when typing finishes */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: done ? 1 : 0 }} transition={{ duration: .4 }}
        style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {insights.map(({ Icon, color, text }, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: done ? 1 : 0, y: done ? 0 : 6 }}
            transition={{ delay: i * .13, duration: .3 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '7px 10px', background: 'var(--surf2)', borderRadius: 'var(--r1)',
            }}
          >
            <Icon size={13} color={color} strokeWidth={2} style={{ flexShrink: 0 }}/>
            <span style={{ fontSize: 12, color: 'var(--t2)' }}>{text}</span>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
