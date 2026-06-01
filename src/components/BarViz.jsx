import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';

const bars = [
  { h: 48, color: '#7C3AED', label: 'age',   delay: 0 },
  { h: 76, color: '#6366F1', label: 'rev',   delay: .1 },
  { h: 60, color: '#14B8A6', label: 'dur',   delay: .2 },
  { h: 90, color: '#7C3AED', label: 'score', delay: .3 },
  { h: 38, color: '#6366F1', label: 'churn', delay: .4 },
  { h: 65, color: '#14B8A6', label: 'conv',  delay: .5 },
];

const statRows = [
  { label: 'Mean',    val: '47.3',  color: '#7C3AED' },
  { label: 'Median',  val: '44.1',  color: '#6366F1' },
  { label: 'Std Dev', val: '12.8',  color: '#14B8A6' },
  { label: 'Skew',    val: '+0.42', color: '#10B981' },
];

export default function BarViz() {
  return (
    <div style={{
      background: 'var(--surf)', border: '1px solid var(--bd)',
      borderRadius: 'var(--r4)', padding: '26px 22px',
      boxShadow: 'var(--sh-lg)', minWidth: 300, maxWidth: 380,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <BarChart3 size={15} color="var(--purple)" strokeWidth={2}/>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', fontFamily: 'var(--fm)', letterSpacing: '.8px', textTransform: 'uppercase' }}>
          statistical_profile
        </span>
      </div>

      {/* Animated bars */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 9, height: 100, marginBottom: 22 }}>
        {bars.map((b, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <motion.div
              initial={{ scaleY: 0, originY: 1 }}
              animate={{ scaleY: 1 }}
              transition={{
                duration: .65, delay: b.delay, ease: [.22,1,.36,1],
                repeat: Infinity, repeatType: 'reverse',
                repeatDelay: 1.8 + i * .25,
              }}
              style={{
                width: '100%', height: b.h, background: b.color,
                borderRadius: '4px 4px 2px 2px', originY: 1, opacity: .82,
              }}
            />
            <span style={{ fontSize: 9, color: 'var(--t3)', fontFamily: 'var(--fm)' }}>{b.label}</span>
          </div>
        ))}
      </div>

      {/* Stat rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {statRows.map((r, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: .6 + i * .08, duration: .35 }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '6px 10px', background: 'var(--surf2)', borderRadius: 'var(--r1)',
            }}
          >
            <span style={{ fontSize: 12, color: 'var(--t2)', fontFamily: 'var(--fm)' }}>{r.label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: r.color, fontFamily: 'var(--fm)' }}>{r.val}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
