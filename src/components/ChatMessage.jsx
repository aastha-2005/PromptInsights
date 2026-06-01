import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, PieChart as PieIcon, ScatterChart as ScatterIcon } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts';

/* ─── Palette ─── */
const PASTEL = [
  '#a78bfa','#818cf8','#67e8f9','#6ee7b7',
  '#fbbf24','#f9a8d4','#c084fc','#93c5fd',
  '#fca5a5','#86efac',
];

/* ─── Custom tooltip ─── */
function Tip({ active, payload, label, dark }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: dark ? 'rgba(15,23,42,.92)' : 'rgba(255,255,255,.95)',
      border: dark ? '1px solid rgba(124,58,237,.3)' : '1px solid rgba(168,85,247,.2)',
      borderRadius: 10, padding: '10px 14px',
      backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,.18)',
    }}>
      {label && <p style={{ fontSize: 11, fontWeight: 700, color: dark ? '#e2e8f0' : '#1e293b', margin: 0, fontFamily: 'var(--fh)' }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ fontSize: 12, color: PASTEL[i % PASTEL.length], margin: '3px 0 0', fontFamily: 'var(--fm)', fontWeight: 600 }}>
          {p.name ?? 'value'}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
}

/* ─── Chart type icon ─── */
const chartIcon = (t) => {
  const m = { bar: BarChart3, line: TrendingUp, pie: PieIcon, scatter: ScatterIcon };
  return m[t] || BarChart3;
};

/* ─── Render one chart inside a glassmorphic card ─── */
function InlineChart({ chart, dark }) {
  const { chart_type = 'bar', data = [], title = '' } = chart;
  const Icon = chartIcon(chart_type);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      style={{
        marginTop: 12,
        background: dark ? 'rgba(30,41,59,.55)' : 'rgba(255,255,255,.65)',
        backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
        border: dark ? '1px solid rgba(124,58,237,.18)' : '1px solid rgba(168,85,247,.14)',
        borderRadius: 14, overflow: 'hidden',
        boxShadow: dark
          ? '0 4px 24px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,255,255,.04)'
          : '0 2px 12px rgba(168,85,247,.08), inset 0 1px 0 rgba(255,255,255,.6)',
      }}
    >
      {/* Card header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '12px 16px 8px',
        borderBottom: dark ? '1px solid rgba(255,255,255,.04)' : '1px solid rgba(168,85,247,.06)',
      }}>
        <div style={{
          width: 26, height: 26, borderRadius: 7,
          background: dark ? 'rgba(124,58,237,.12)' : 'rgba(168,85,247,.08)',
          border: dark ? '1px solid rgba(124,58,237,.25)' : '1px solid rgba(168,85,247,.16)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={13} color={dark ? '#a78bfa' : '#8b5cf6'} strokeWidth={2.2} />
        </div>
        <span style={{
          fontSize: 12, fontWeight: 700, color: dark ? '#e2e8f0' : '#1e293b',
          fontFamily: 'var(--fh)', letterSpacing: '-0.2px',
        }}>
          {title || `${chart_type.charAt(0).toUpperCase() + chart_type.slice(1)} Chart`}
        </span>
        <span style={{
          marginLeft: 'auto', fontSize: 10, fontWeight: 600,
          color: dark ? 'rgba(148,163,184,.5)' : 'rgba(100,116,139,.5)',
          fontFamily: 'var(--fm)',
        }}>
          {data.length} pts
        </span>
      </div>

      {/* Chart body */}
      <div style={{ padding: '8px 10px 12px', height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          {chart_type === 'line' ? (
            <LineChart data={data} margin={{ top: 8, right: 16, left: -8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={dark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)'} />
              <XAxis dataKey="name" tick={{ fill: dark ? 'rgba(148,163,184,.6)' : '#64748b', fontSize: 10, fontFamily: 'var(--fb)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: dark ? 'rgba(148,163,184,.6)' : '#64748b', fontSize: 10, fontFamily: 'var(--fm)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<Tip dark={dark} />} />
              <Line type="monotone" dataKey="value" stroke="#a78bfa" strokeWidth={2.5}
                dot={{ r: 3.5, fill: dark ? '#1e293b' : '#fff', stroke: '#a78bfa', strokeWidth: 2 }}
                activeDot={{ r: 5.5, stroke: '#7c3aed', strokeWidth: 2, fill: '#a78bfa' }} />
            </LineChart>
          ) : chart_type === 'pie' ? (
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={36}
                paddingAngle={3} strokeWidth={0} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={{ stroke: dark ? 'rgba(148,163,184,.3)' : 'rgba(100,116,139,.3)' }}>
                {data.map((_, i) => <Cell key={i} fill={PASTEL[i % PASTEL.length]} />)}
              </Pie>
              <Tooltip content={<Tip dark={dark} />} />
              <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'var(--fb)' }} />
            </PieChart>
          ) : chart_type === 'scatter' ? (
            <ScatterChart margin={{ top: 8, right: 16, left: -8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={dark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)'} />
              <XAxis dataKey="x" name={data[0]?.xLabel || 'X'} tick={{ fill: dark ? 'rgba(148,163,184,.6)' : '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="y" name={data[0]?.yLabel || 'Y'} tick={{ fill: dark ? 'rgba(148,163,184,.6)' : '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<Tip dark={dark} />} cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={data} fill="#a78bfa">
                {data.map((_, i) => <Cell key={i} fill={PASTEL[i % PASTEL.length]} />)}
              </Scatter>
            </ScatterChart>
          ) : (
            /* default = bar */
            <BarChart data={data} margin={{ top: 8, right: 16, left: -8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={dark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)'} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: dark ? 'rgba(148,163,184,.6)' : '#64748b', fontSize: 10, fontFamily: 'var(--fb)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: dark ? 'rgba(148,163,184,.6)' : '#64748b', fontSize: 10, fontFamily: 'var(--fm)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<Tip dark={dark} />} cursor={{ fill: dark ? 'rgba(124,58,237,.08)' : 'rgba(168,85,247,.06)' }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={42}>
                {data.map((_, i) => <Cell key={i} fill={PASTEL[i % PASTEL.length]} fillOpacity={0.85} />)}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   parseContent — split AI text into segments:
   { type: 'text', value: '...' }
   { type: 'chart', chart_type, data, title }
   ───────────────────────────────────────────── */
function parseContent(raw) {
  const segments = [];
  // Match JSON objects that have "type":"chart"
  const re = /\{[^{}]*"type"\s*:\s*"chart"[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
  let last = 0;
  let match;

  while ((match = re.exec(raw)) !== null) {
    // text before this JSON block
    if (match.index > last) {
      const txt = raw.slice(last, match.index).trim();
      if (txt) segments.push({ type: 'text', value: txt });
    }
    try {
      const obj = JSON.parse(match[0]);
      if (obj.type === 'chart' && Array.isArray(obj.data)) {
        segments.push({ type: 'chart', ...obj });
      } else {
        segments.push({ type: 'text', value: match[0] });
      }
    } catch {
      segments.push({ type: 'text', value: match[0] });
    }
    last = match.index + match[0].length;
  }

  // remaining text
  if (last < raw.length) {
    const txt = raw.slice(last).trim();
    if (txt) segments.push({ type: 'text', value: txt });
  }

  // fallback: if no segments extracted, return the whole thing as text
  if (segments.length === 0) segments.push({ type: 'text', value: raw });

  return segments;
}

/* ═══════════════════════════════════════
   ChatMessage — smart message component
   ═══════════════════════════════════════ */
export default function ChatMessage({ content, dark }) {
  const segments = useMemo(() => parseContent(content), [content]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {segments.map((seg, i) =>
        seg.type === 'chart' ? (
          <InlineChart key={i} chart={seg} dark={dark} />
        ) : (
          <div key={i} className="ie-md" style={{
            fontSize: 14, lineHeight: 1.76,
            color: dark ? 'rgba(203,213,225,.88)' : '#334155',
            fontFamily: 'var(--fb)',
          }}>
            <ReactMarkdown>{seg.value}</ReactMarkdown>
          </div>
        )
      )}
    </div>
  );
}
