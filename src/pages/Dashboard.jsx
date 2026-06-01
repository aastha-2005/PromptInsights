import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

import {
  Hash, Columns, CheckCircle2, AlertTriangle, Download,
  ChevronRight, Brain, Clock, Table2, Loader2, BarChart3, Activity, TrendingUp,
  History, GitCompare, Send, MessageSquare, X,
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, LineChart, Line, AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend, ZAxis
} from 'recharts';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const API = 'http://127.0.0.1:8000/api/generate-report';
const SECTION_API = 'http://127.0.0.1:8000/analyze/section';
const STEPS = [0, 8, 18, 32, 48, 62, 75, 85, 92, 96];
const SECTION_TYPES = ['executive_summary', 'trends', 'risks', 'roadmap'];
const dotColor = { ok: '#10B981', warn: '#F59E0B', err: '#EF4444' };

/* ── Color scheme palettes ── */
import chroma from 'chroma-js';
const COLOR_SCHEMES = {
  ocean:   ['#0EA5E9','#06B6D4','#14B8A6','#2DD4BF','#22D3EE','#38BDF8','#67E8F9','#5EEAD4'],
  sunset:  ['#F97316','#FB923C','#FBBF24','#F59E0B','#EF4444','#F43F5E','#E11D48','#DC2626'],
  berry:   ['#A855F7','#8B5CF6','#7C3AED','#6366F1','#EC4899','#D946EF','#C084FC','#818CF8'],
  earth:   ['#84CC16','#22C55E','#10B981','#14B8A6','#65A30D','#16A34A','#059669','#0D9488'],
  default: ['#7C3AED','#6366F1','#14B8A6','#F59E0B','#EF4444','#EC4899','#06B6D4','#8B5CF6'],
};

/* ── Custom tooltip ── */
const Tip = ({ active, payload, label, textColor }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--surf)', border: '1px solid var(--bd)', borderRadius: 10, padding: '10px 14px', fontSize: 12, boxShadow: 'var(--sh-md)' }}>
      {label && <p style={{ color: textColor || 'var(--t2)', marginBottom: 4 }}>{label}</p>}
      {payload.map(p => <p key={p.name} style={{ color: p.color || p.stroke, fontWeight: 600 }}>{p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</p>)}
    </div>
  );
};

/* ── Chart card wrapper ── */
const ChartCard = ({ title, icon: Icon, iconColor, children, delay = 0 }) => (
  <motion.div className="card chart-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.45 }}
    style={{ padding: '20px 22px', overflow: 'hidden' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: `${iconColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={15} color={iconColor} strokeWidth={2} />
      </div>
      <h3 style={{ fontFamily: 'var(--fh)', fontSize: 13.5, fontWeight: 700, color: 'var(--t1)' }}>{title}</h3>
    </div>
    {children}
  </motion.div>
);

/* ── SmartChart — renders the correct Recharts type ── */
const SmartChart = ({ config, textColor, delay = 0, dark }) => {
  const { type, title, data } = config;
  
  // Unique color scale for each chart type
  const getPalette = (chartType) => {
    const scales = {
      bar: ['#c084fc', '#7e22ce'], // Purples
      line: ['#2dd4bf', '#0f766e'], // Teals
      pie: ['#fb923c', '#ea580c'],
      area: ['#60a5fa', '#1d4ed8'],
      scatter: ['#f472b6', '#db2777']
    };
    const base = scales[chartType] || ['#94a3b8', '#475569'];
    return chroma.scale(base).colors(Math.max(data.length, 5));
  };

  const colors = getPalette(type);
  const iconMap = { bar: BarChart3, pie: BarChart3, line: Activity, area: TrendingUp, scatter: Activity };
  const Icon = iconMap[type] || BarChart3;
  const accent = colors[0];
  const gridColor = dark ? '#d1d5db' : 'rgba(0,0,0,0.05)';
  const labelColor = dark ? '#d1d5db' : '#64748b';

  const renderChart = () => {
    switch (type) {
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" nameKey="name">
                {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
              </Pie>
              <Tooltip content={<Tip textColor={textColor} />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: labelColor, paddingTop: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: labelColor }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: labelColor }} axisLine={false} tickLine={false} />
              <Tooltip content={<Tip textColor={textColor} />} />
              <Line type="monotone" dataKey="value" stroke={colors[0]} strokeWidth={3} dot={{ r: 4, fill: colors[0], strokeWidth: 2, stroke: 'var(--surf)' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors[0]} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={colors[0]} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: labelColor }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: labelColor }} axisLine={false} tickLine={false} />
              <Tooltip content={<Tip textColor={textColor} />} />
              <Area type="monotone" dataKey="value" stroke={colors[0]} strokeWidth={2.5} fill={`url(#grad-${title.replace(/\s+/g, '')})`} />
            </AreaChart>
          </ResponsiveContainer>
        );
      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={220}>
            <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis type="number" dataKey="x" name="X" tick={{ fontSize: 10, fill: labelColor }} axisLine={false} tickLine={false} />
              <YAxis type="number" dataKey="y" name="Y" tick={{ fontSize: 10, fill: labelColor }} axisLine={false} tickLine={false} />
              <ZAxis type="category" dataKey="name" name="Label" />
              <Tooltip content={<Tip textColor={textColor} />} />
              <Scatter name={title} data={data} fill={colors[0]}>
                {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        );
      case 'bar':
      default:
        return (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: labelColor }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: labelColor }} axisLine={false} tickLine={false} />
              <Tooltip content={<Tip textColor={textColor} />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={24}>
                {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <ChartCard title={title} icon={Icon} iconColor={accent} delay={delay}>
      {renderChart()}
    </ChartCard>
  );
};



/* ── Skeleton loader for narrative sections ── */
const SkeletonSection = ({ lines = 5 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '20px 0' }}>
    {[...Array(lines)].map((_, i) => (
      <div key={i} className="shim" style={{ height: 14, borderRadius: 6, width: `${70 + (i * 7) % 30}%` }} />
    ))}
  </div>
);

/* ── Section heading ── */
const SectionHeading = ({ icon: Icon, color, label, badge }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
    <div style={{ width: 34, height: 34, borderRadius: 10, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={16} color={color} strokeWidth={2} />
    </div>
    <h2 style={{ fontFamily: 'var(--fh)', fontSize: 15, fontWeight: 800, color: 'var(--t1)', margin: 0 }}>{label}</h2>
    {badge && <span className="chip ch-p" style={{ marginLeft: 'auto', fontSize: 10 }}>{badge}</span>}
  </div>
);

/* ── Stat mini-card ── */
const StatMini = ({ label, value, sub, color }) => (
  <div style={{ padding: '14px 16px', background: `${color}08`, border: `1px solid ${color}22`, borderRadius: 10 }}>
    <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>{label}</p>
    <p style={{ fontFamily: 'var(--fh)', fontSize: 22, fontWeight: 800, color, letterSpacing: '-0.8px' }}>{value}</p>
    {sub && <p style={{ fontSize: 11, color: 'var(--t3)', marginTop: 3 }}>{sub}</p>}
  </div>
);

/* ════════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const { dark } = useTheme();
  const { isLoggedIn } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const fileName = location.state?.fileName || 'dataset.csv';
  const csvPreview = location.state?.csvPreview || '';

  /* ── If no CSV was passed, redirect to Home so user can upload ── */
  useEffect(() => {
    if (!csvPreview) {
      navigate('/', { replace: true });
    }
  }, []); // runs once on mount — intentional

  const [collapsed, setCollapsed] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState(null);
  const [elapsed, setElapsed] = useState('0.0');

  /* ── Sectioned narrative report state ── */
  const [narrativeReport, setNarrativeReport] = useState({
    summary: '', trends: '', risks: '', roadmap: '',
  });
  const [narrativeLoading, setNarrativeLoading] = useState({
    summary: false, trends: false, risks: false, roadmap: false,
  });
  const [narrativeReady, setNarrativeReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const stepRef = useRef(0);
  const exportingRef = useRef(false);
  const [pdfLoading, setPdfLoading] = useState(false);   // ← legacy, kept for compat
  const [isExporting, setIsExporting] = useState(false);  // drives button UI
  const [printToast, setPrintToast] = useState(false);
  const [exportError, setExportError] = useState('');      // shown as inline error
  const printRef = useRef(null);

  /* ── Native print-to-PDF export ─────────────────────────────────────
     Uses window.print() with a dynamically injected @media print block.
     Zero library dependencies — completely side-steps jsPDF/html2canvas
     version errors. Print CSS hides nav/sidebar/buttons, enforces A4
     margins, forces white background, and prevents chart cards from
     splitting awkwardly across page boundaries.                        */

  const PRINT_STYLES = `
    @media print {
      /* Hide UI chrome: navbar, sidebar, action buttons */
      nav, footer, aside, .sidebar, .print-hide,
      button, [role="navigation"] {
        display: none !important;
      }

      /* Force report area to full-width white canvas */
      body, .main-content, .report-page, #report-content {
        background: #ffffff !important;
        color: #000000 !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
      }

      /* A4 page with clean professional margins — strips browser URL/date headers */
      @page {
        size: A4 portrait;
        margin: 15mm 15mm 15mm 15mm;
      }

      /* Prevent charts and metric cards from breaking across pages */
      .chart-card, .chart-container, .card,
      .report-section, .executive-summary-card {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
    }
  `;

  const handleExport = () => {
    try {
      setIsExporting(true);
      setExportError('');

      // Inject print styles right before execution
      const styleEl = document.createElement('style');
      styleEl.id = 'pi-print-styles';
      styleEl.innerHTML = PRINT_STYLES;
      document.head.appendChild(styleEl);

      // Trigger browser native print/save-as-PDF dialog
      window.print();

      // Clean up injected styles after print dialog closes
      setTimeout(() => {
        document.getElementById('pi-print-styles')?.remove();
        setIsExporting(false);
        setPrintToast(true);
        setTimeout(() => setPrintToast(false), 3500);
      }, 1000);
    } catch (err) {
      console.error('Native print execution failed:', err);
      setExportError('Print failed. Check browser console for details.');
      setIsExporting(false);
    }
  };

  /* ── History ── */
  const [reportHistory, setReportHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('reportHistory') || '[]'); } catch { return []; }
  });

  const saveToHistory = useCallback((data, name) => {
    const entry = {
      id: Date.now(),
      fileName: name,
      report: data.report,
      fact_sheet: data.fact_sheet || '',   // ← save for comparison context
      visuals: data.visuals,
      row_count: data.row_count,
      column_count: data.column_count,
      column_names: data.column_names,
      null_percentage: data.null_percentage,
      timestamp: Date.now(),
    };
    setReportHistory(prev => {
      const updated = [entry, ...prev].slice(0, 10);
      localStorage.setItem('reportHistory', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const loadFromHistory = useCallback((entry) => {
    setReport({
      report: entry.report,
      visuals: entry.visuals,
      row_count: entry.row_count,
      column_count: entry.column_count,
      column_names: entry.column_names,
      null_percentage: entry.null_percentage,
    });
    setElapsed('cached');
    setError('');
    setLoading(false);
  }, []);

  /* ── Inline Chat ── */
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  /* sendMessage — generic chat with optional extra context string injected as csv_data */
  const sendMessage = useCallback(async (overrideText, extraContext) => {
    const text = (overrideText ?? chatInput).trim();
    if (!text || chatLoading) return;
    setChatInput('');
    const userMsg = { role: 'user', text, id: Date.now() };
    setChatMessages(prev => [...prev, userMsg]);
    setChatLoading(true);
    try {
      const body = extraContext
        ? { message: text, csv_data: extraContext }          // comparison: full fact-sheet context
        : { message: text, csv_data: report?.fact_sheet || report?.report?.slice(0, 800) || '' };
      const res = await fetch('http://127.0.0.1:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      setChatMessages(prev => [...prev, { role: 'assistant', text: data.reply || data.message || JSON.stringify(data), id: Date.now() + 1 }]);
    } catch (e) {
      setChatMessages(prev => [...prev, { role: 'assistant', text: `⚠️ ${e.message}`, id: Date.now() + 1 }]);
    } finally {
      setChatLoading(false);
    }
  }, [chatInput, chatLoading, report]);

  /* sendCompare — sends both fact-sheets as context so the AI can actually see both datasets */
  const sendCompare = useCallback(() => {
    const prevEntry = reportHistory.find(r => r.fileName !== fileName) || reportHistory[1];
    if (!prevEntry) return;
    const currentSummary = report?.fact_sheet || report?.report?.slice(0, 1000) || 'No summary available.';
    const previousSummary = prevEntry.fact_sheet || prevEntry.report?.slice(0, 1000) || 'No summary available.';
    const combinedContext = `=== DATASET A — CURRENT (${fileName}) ===\n${currentSummary}\n\n=== DATASET B — PREVIOUS (${prevEntry.fileName}) ===\n${previousSummary}`;
    const compareMsg = `Compare these two datasets and highlight the 3 biggest differences in structure and statistics.\n\nDataset A (Current): ${fileName}\nDataset B (Previous): ${prevEntry.fileName}`;
    sendMessage(compareMsg, combinedContext);
  }, [reportHistory, fileName, report, sendMessage]);

  /* Timer */
  useEffect(() => {
    if (!loading) return;
    const t0 = Date.now();
    const id = setInterval(() => setElapsed(((Date.now() - t0) / 1000).toFixed(1)), 100);
    return () => clearInterval(id);
  }, [loading]);

  /* Progressive loader */
  useEffect(() => {
    if (!loading) { stepRef.current = 0; return; }
    // Reset to 0 instantly (no transition) before starting
    setProgress(0);
    stepRef.current = 0;
    // Delay first tick so the 0-reset renders before animating forward
    const startId = setTimeout(() => {
      const id = setInterval(() => {
        if (stepRef.current < STEPS.length - 1) {
          stepRef.current++;
          setProgress(STEPS[stepRef.current]);
        }
      }, 1200 + Math.random() * 800);
      // Store interval id on the ref so cleanup can reach it
      stepRef._intervalId = id;
    }, 50);
    return () => {
      clearTimeout(startId);
      if (stepRef._intervalId) clearInterval(stepRef._intervalId);
    };
  }, [loading]);

  const generate = useCallback(async () => {
    if (!csvPreview) { setError('No CSV data. Upload a file first.'); return; }
    setLoading(true); setError(''); setReport(null);
    setNarrativeReady(false);
    setNarrativeReport({ summary: '', trends: '', risks: '', roadmap: '' });
    try {
      const res = await fetch(API, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv_data: csvPreview }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || `Error ${res.status}`); }
      const data = await res.json();
      setProgress(100);
      await new Promise(r => setTimeout(r, 600));
      setReport(data);
      if (isLoggedIn) saveToHistory(data, fileName);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [csvPreview]);

  /* ── Sequential section fetcher ── calls /analyze/section one by one ── */
  const generateFullReport = useCallback(async (factSheet) => {
    if (!factSheet) return;
    setNarrativeReady(false);
    setNarrativeReport({ summary: '', trends: '', risks: '', roadmap: '' });
    const keyMap = { executive_summary: 'summary', trends: 'trends', risks: 'risks', roadmap: 'roadmap' };
    for (const stype of SECTION_TYPES) {
      const key = keyMap[stype];
      setNarrativeLoading(prev => ({ ...prev, [key]: true }));
      try {
        const res = await fetch(SECTION_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ section_type: stype, data_summary: factSheet }),
        });
        if (!res.ok) throw new Error(`Section API error ${res.status}`);
        const data = await res.json();
        setNarrativeReport(prev => ({ ...prev, [key]: data.content || '' }));
      } catch (e) {
        setNarrativeReport(prev => ({ ...prev, [key]: `⚠️ Failed to load this section: ${e.message}` }));
      } finally {
        setNarrativeLoading(prev => ({ ...prev, [key]: false }));
      }
    }
    setNarrativeReady(true);
  }, []);

  /* Auto-trigger narrative report once main report is ready */
  useEffect(() => {
    if (report?.fact_sheet) generateFullReport(report.fact_sheet);
  }, [report?.fact_sheet]);

  useEffect(() => { if (csvPreview) generate(); }, []); // auto-run on mount

  const parsedCols = useMemo(() => {
    if (!csvPreview) return [];
    const lines = csvPreview.split('\n').filter(l => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    
    // Scan up to 10 rows to guess types
    const types = new Array(headers.length).fill('Number');

    for (let r = 1; r < Math.min(lines.length, 10); r++) {
      const values = lines[r].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      for (let c = 0; c < headers.length; c++) {
        const val = values[c];
        if (!val) continue;
        // Date detection: common date patterns
        if (/^\d{4}[-\/]\d{1,2}[-\/]\d{1,2}/.test(val) || /^\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}/.test(val)) {
          types[c] = 'Date';
        } else if (isNaN(Number(val))) {
          types[c] = 'String';
        } else if (types[c] !== 'String' && types[c] !== 'Date') {
          types[c] = 'Number';
        }
      }
    }
    return headers.map((h, i) => ({ name: h, type: types[i] }));
  }, [csvPreview]);

  /* Derived */
  const rowCount = report?.row_count ?? '—';
  const colCount = report?.column_count ?? '—';
  const colNames = report?.column_names ?? [];
  const nullPct = report?.null_percentage ?? 0;
  const completePct = report ? (100 - nullPct).toFixed(1) : '—';
  const vis = report?.visuals ?? {};
  const charts = vis.charts ?? [];
  const scheme = vis.color_scheme || 'default';
  
  // Theme logic for colors
  const vibrantScale = chroma.scale(['#818cf8', '#34d399']).colors(8);
  const pastelScale = chroma.scale(['#a5b4fc', '#6ee7b7']).colors(8);
  const palette = dark ? vibrantScale : pastelScale;
  const textColor = dark ? '#ffffff' : '#000000';

  const descStats = vis.descriptive ?? [];
  const topStats = descStats.slice(0, 4);

  const STATS = [
    { label: 'Total Rows', value: rowCount.toLocaleString?.() || rowCount, Icon: Hash, color: palette[0], delta: fileName },
    { label: 'Columns', value: String(colCount), Icon: Columns, color: palette[1] || palette[0], delta: `${colNames.length} detected` },
    { label: 'Complete', value: `${completePct}%`, Icon: CheckCircle2, color: palette[2] || '#14B8A6', delta: `${nullPct}% null` },
    { label: 'Status', value: report ? 'Ready' : 'Pending', Icon: AlertTriangle, color: palette[3] || '#F59E0B', delta: report ? `${elapsed}s` : '—' },
  ];

  return (
    <>
      {/* ── SUCCESS TOAST ── */}
      {printToast && (
        <div style={{
          position: 'fixed', top: 80, right: 24, zIndex: 9999,
          display: 'flex', alignItems: 'center', gap: 10,
          background: dark ? '#1e293b' : '#f0fdf4',
          border: `1px solid ${dark ? 'rgba(34,197,94,0.3)' : 'rgba(34,197,94,0.4)'}`,
          borderLeft: '3px solid #22c55e',
          borderRadius: 10, padding: '12px 18px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.14)',
          fontFamily: 'var(--fb)', fontSize: 13, fontWeight: 600,
          color: dark ? '#86efac' : '#15803d',
          animation: 'slideInRight .28s cubic-bezier(.22,1,.36,1)',
        }}>
          <span style={{ fontSize: 16 }}>✓</span>
          Report exported successfully!
          <button
            onClick={() => setPrintToast(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, lineHeight: 1, color: 'inherit', opacity: 0.6, marginLeft: 4 }}
          >×</button>
        </div>
      )}
      <style>{`@keyframes slideInRight{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}`}</style>

      <motion.div initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
      style={{ display: 'flex', minHeight: 'calc(100vh - 64px)', background: 'var(--bg)', transition: 'background .4s' }}>

      {/* ── SIDEBAR ── */}
      <aside className="print-hide" style={{
        width: collapsed ? 54 : 258, flexShrink: 0, background: 'var(--surf)', borderRight: '1px solid var(--bd)',
        transition: 'width .28s ease, background .4s', display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 64, height: 'calc(100vh - 64px)', overflow: 'hidden',
      }}>
        <div style={{ padding: '14px 12px', borderBottom: '1px solid var(--bd)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(124,58,237,.1)', border: '1px solid rgba(124,58,237,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Table2 size={15} color="var(--purple)" strokeWidth={1.8} />
            </div>
            {!collapsed && <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fileName}</div>
              <div style={{ fontSize: 10, color: 'var(--t3)' }}>{report ? `${rowCount.toLocaleString?.() || rowCount} rows · ${colCount} cols` : 'Loading…'}</div>
            </div>}
          </div>
          <button onClick={() => setCollapsed(c => !c)}
            style={{ background: 'var(--surf2)', border: '1px solid var(--bd)', color: 'var(--t2)', width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}>
            <ChevronRight size={13} style={{ transform: collapsed ? 'rotate(0)' : 'rotate(180deg)', transition: 'transform .25s' }} />
          </button>
        </div>
        {!collapsed && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            {/* ── COLUMNS — full sidebar, clean ── */}
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--t3)', padding: '14px 14px 8px', fontFamily: 'var(--fm)', flexShrink: 0 }}>Columns</p>
            <div style={{ overflowY: 'auto', overflowX: 'hidden', padding: '0 14px 14px', flex: 1 }}>
              {report && !loading ? parsedCols.map(c => (
                <div key={c.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 6px', borderBottom: '1px solid var(--bd)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor.ok, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontWeight: 500, fontFamily: 'var(--fm)', color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, flexShrink: 0,
                    padding: '2px 7px', borderRadius: 4,
                    color: c.type === 'Number' ? '#0891b2' : c.type === 'Date' ? '#059669' : '#7c3aed',
                    background: c.type === 'Number' ? 'rgba(8,145,178,0.1)' : c.type === 'Date' ? 'rgba(5,150,105,0.1)' : 'rgba(124,58,237,0.1)',
                    border: `1px solid ${c.type === 'Number' ? 'rgba(8,145,178,0.25)' : c.type === 'Date' ? 'rgba(5,150,105,0.25)' : 'rgba(124,58,237,0.25)'}`,
                  }}>{c.type}</span>
                </div>
              )) : (
                <div style={{ padding: '8px 6px' }}>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--bd)' }}>
                      <div className="shim" style={{ width: `${55 + (i * 13) % 30}%`, height: 10, borderRadius: 5 }} />
                      <div className="shim" style={{ width: 42, height: 18, borderRadius: 4 }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </aside>

      {/* ── MAIN ── */}
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* ── REPORT HEADER ── */}
        <div
          className="flex flex-row justify-between items-center w-full mb-8 border-b pb-4"
          style={{
            display: 'flex', flexDirection: 'row', justifyContent: 'space-between',
            alignItems: 'center', width: '100%', marginBottom: 32,
            borderBottom: '1px solid var(--bd)', paddingBottom: 16,
            padding: '16px 28px 16px', background: 'var(--surf)',
          }}
        >
          {/* Left: Title + subtitle */}
          <div>
            <h1
              className="text-2xl font-bold text-gray-800 dark:text-white"
              style={{ fontFamily: 'var(--fh)', fontSize: 20, fontWeight: 800, letterSpacing: '-.5px', color: 'var(--t1)', margin: 0 }}
            >
              Analysis Report
            </h1>
            <p style={{ fontSize: 12, color: 'var(--t3)', display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
              <Clock size={12} />
              {loading ? `Generating… ${elapsed}s` : (report ? `Generated in ${elapsed}s` : 'Pending')}
              &nbsp;·&nbsp; {fileName}
            </p>
          </div>

          {/* Right: Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              id="btn-export-pdf"
              onClick={handleExport}
              disabled={loading || !report || isExporting}
              title={isExporting ? 'PDF is being generated on the server…' : 'Download a professional PDF of this report'}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: (loading || !report || isExporting) ? '#818cf8' : '#4f46e5',
                color: '#fff', border: 'none', borderRadius: 8,
                padding: '9px 18px', fontSize: 13, fontWeight: 600,
                fontFamily: 'var(--fb)',
                cursor: (loading || !report || isExporting) ? 'not-allowed' : 'pointer',
                opacity: (loading || !report || isExporting) ? 0.75 : 1,
                boxShadow: '0 2px 8px rgba(79,70,229,0.4)',
                transition: 'background .2s, opacity .2s, transform .1s',
                minWidth: 155,
              }}
            >
              {isExporting ? (
                <>
                  <span style={{
                    width: 14, height: 14, border: '2px solid rgba(255,255,255,.35)',
                    borderTopColor: '#fff', borderRadius: '50%',
                    animation: 'spin .75s linear infinite', display: 'inline-block', flexShrink: 0,
                  }} />
                  <span>Please wait…</span>
                </>
              ) : (
                <>
                  <Download size={15} />
                  <span>Export PDF</span>
                </>
              )}
            </button>
            <button
              onClick={generate}
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'var(--surf2)', border: '1px solid var(--bd)',
                color: 'var(--t1)', padding: '9px 16px', borderRadius: 8,
                fontSize: 13, fontWeight: 600, fontFamily: 'var(--fb)',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1, transition: 'opacity .2s',
              }}
            >
              ↺ Re-run
            </button>
          </div>
        </div>

        {/* ── PDF EXPORT ERROR BANNER ── */}
        {exportError && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 28px', background: 'rgba(239,68,68,0.08)',
            borderBottom: '1px solid rgba(239,68,68,0.2)',
            borderLeft: '3px solid #ef4444',
          }}>
            <AlertTriangle size={14} color="#ef4444" />
            <span style={{ fontSize: 12, color: '#ef4444', flex: 1, fontFamily: 'var(--fb)' }}>
              <strong>Export failed:</strong> {exportError}
            </span>
            <button
              onClick={() => setExportError('')}
              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 16, opacity: 0.7 }}
            >×</button>
          </div>
        )}

        {/* ── QUICK ACTION: COMPARE (visible when history has any previous report) ── */}
        {report && reportHistory.length > 0 && (() => {
          const prevEntry = reportHistory.find(r => r.fileName !== fileName) || reportHistory[0];
          return (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 28px', borderBottom: '1px solid var(--bd)', background: dark ? 'rgba(99,102,241,0.06)' : 'rgba(99,102,241,0.04)' }}>
              <GitCompare size={13} color="#6366F1" strokeWidth={2} />
              <span style={{ fontSize: 12, color: 'var(--t2)', flex: 1, fontStyle: 'italic', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                Compare <strong style={{ fontStyle: 'normal' }}>{fileName}</strong> vs <strong style={{ fontStyle: 'normal' }}>{prevEntry?.fileName}</strong> — highlight 3 biggest differences
              </span>
              <button
                onClick={sendCompare}
                disabled={chatLoading}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#6366F1', color: '#fff', border: 'none', borderRadius: 7, padding: '6px 14px', fontSize: 11, fontWeight: 700, cursor: chatLoading ? 'not-allowed' : 'pointer', opacity: chatLoading ? 0.6 : 1, fontFamily: 'var(--fb)', flexShrink: 0, transition: 'opacity .2s' }}
              >
                <Send size={11} />
                Run Comparison
              </button>
            </motion.div>
          );
        })()}

        <div id="report-content" ref={printRef} className="report-content" style={{ padding: '22px 28px 48px', display: 'flex', flexDirection: 'column', gap: 18, overflowY: 'auto' }}>
          {/* ── PRINT-ONLY PROFESSIONAL HEADER (hidden on screen, visible in PDF) ── */}
          <div className="print-header print-only" style={{ marginBottom: 24 }}>
            {/* Accent bar */}
            <div style={{ height: 4, background: 'linear-gradient(90deg,#7c3aed,#6366f1,#14b8a6)', borderRadius: 2, marginBottom: 20 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {/* Brand */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Brain size={22} color="#fff" strokeWidth={2} />
                </div>
                <div>
                  <h1 style={{ fontFamily: 'var(--fh)', fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>PromptInsights</h1>
                  <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>AI-Powered Data Analysis Platform</p>
                </div>
              </div>
              {/* Meta */}
              <div style={{ textAlign: 'right', fontSize: 12, color: '#64748b', lineHeight: 1.8 }}>
                <div><strong style={{ color: '#334155' }}>Dataset:</strong> {fileName}</div>
                <div><strong style={{ color: '#334155' }}>Generated:</strong> {new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}</div>
                <div style={{ marginTop: 4, fontSize: 10, background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 4, padding: '2px 8px', display: 'inline-block', color: '#475569' }}>
                  Confidential · AI Generated Report
                </div>
              </div>
            </div>
            <div style={{ height: 1, background: '#e2e8f0', marginTop: 16 }} />
          </div>



          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div key="err" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ padding: '14px 18px', borderRadius: 10, background: dark ? 'rgba(239,68,68,0.08)' : 'rgba(254,226,226,0.8)', border: '1px solid rgba(239,68,68,0.25)', borderLeft: '3px solid #ef4444', display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertTriangle size={16} color="#ef4444" />
                <span style={{ fontSize: 13, color: dark ? '#fca5a5' : '#991b1b', flex: 1 }}>{error}</span>
                <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 18 }}>×</button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── PROGRESSIVE LOADER ── */}
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: '70px 0' }}>
              {/* Spinner */}
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(147,51,234,0.35)' }}>
                <Loader2 size={26} color="#fff" strokeWidth={2.5} style={{ animation: 'spin .9s linear infinite' }} />
              </div>
              <p style={{ fontFamily: 'var(--fh)', fontSize: 18, fontWeight: 700 }}>Generating Deep Analysis Report…</p>
              {/* Progress bar */}
              <div style={{ width: '100%', maxWidth: 420 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--t3)' }}>
                    {progress < 30 ? 'Scanning dataset…' : progress < 60 ? 'Computing statistics…' : progress < 90 ? 'Generating AI report…' : 'Finalizing…'}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--purple)' }}>{progress}%</span>
                </div>
                <div style={{ width: '100%', height: 6, borderRadius: 999, background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
                  <motion.div
                    animate={{ width: `${progress}%` }}
                    transition={progress === 0 ? { duration: 0 } : { duration: 0.6, ease: 'easeOut' }}
                    style={{ height: '100%', borderRadius: 999, background: 'var(--grad)' }}
                  />
                </div>
              </div>
              <p style={{ fontSize: 12, color: 'var(--t3)' }}>Pandas scan + Groq AI inference · {elapsed}s</p>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </motion.div>
          )}

          {/* ── REPORT CONTENT ── */}
          {report && !loading && (() => {
            const charts = report?.visuals?.charts ?? [];

            return (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

                {/* ──────────────────────────────────────────────────
                    PRINT-ONLY COVER PAGE (hidden on screen)
                ────────────────────────────────────────────────── */}
                <div id="cover-page" className="report-page" style={{ display: 'none' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '290mm', textAlign: 'center', padding: '40mm 20mm' }}>
                    <div style={{ width: 80, height: 80, borderRadius: 20, background: 'linear-gradient(135deg,#7c3aed,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
                      <Brain size={44} color="#fff" strokeWidth={1.8} />
                    </div>
                    <h1 style={{ fontFamily: 'var(--fh)', fontSize: 36, fontWeight: 900, color: '#0f172a', marginBottom: 12 }}>PromptInsights</h1>
                    <p style={{ fontSize: 16, color: '#64748b', marginBottom: 32 }}>AI-Powered Data Analysis Platform</p>
                    <div style={{ width: 60, height: 3, background: 'linear-gradient(90deg,#7c3aed,#14b8a6)', borderRadius: 2, marginBottom: 40 }} />
                    <p style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>{fileName.replace(/\.[^.]+$/, '')}</p>
                    <p style={{ fontSize: 14, color: '#64748b', marginBottom: 32 }}>Dataset Analysis Report</p>
                    <div style={{ padding: '8px 20px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, color: '#94a3b8', background: '#f8fafc' }}>Confidential Analysis — 2026</div>
                  </div>
                </div>

                {/* ──────────────────────────────────────────────────
                    PAGE 1: Stat Cards + Executive Summary
                ────────────────────────────────────────────────── */}
                <div className="report-page" style={{ marginBottom: 32 }}>
                  {/* Stat cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 24 }}>
                    {STATS.map((s, i) => (
                      <motion.div key={s.label} className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                        style={{ padding: '18px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.6px' }}>{s.label}</span>
                          <div style={{ width: 28, height: 28, borderRadius: 8, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <s.Icon size={14} color={s.color} strokeWidth={2} />
                          </div>
                        </div>
                        <p style={{ fontFamily: 'var(--fh)', fontSize: 26, fontWeight: 800, letterSpacing: '-1px', color: s.color }}>{s.value}</p>
                        <p style={{ fontSize: 12, color: 'var(--t3)', marginTop: 4 }}>{s.delta}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Executive Summary */}
                  <div className="card chart-card" style={{ padding: '24px 28px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#7c3aed,#6366f1)' }} />
                    <SectionHeading icon={Brain} color="#7c3aed" label="Executive Summary" badge="Senior Consultant" />
                    {narrativeLoading.summary
                      ? <SkeletonSection lines={6} />
                      : narrativeReport.summary
                        ? <div className="ie-md" style={{ fontSize: 14, lineHeight: 1.78, color: 'var(--t2)' }}><ReactMarkdown>{narrativeReport.summary}</ReactMarkdown></div>
                        : <SkeletonSection lines={4} />
                    }
                  </div>
                </div>

                {/* ──────────────────────────────────────────────────
                    PAGE 2: Charts 1 & 2 + Trends Analysis
                ────────────────────────────────────────────────── */}
                <div className="report-page" style={{ marginBottom: 32 }}>
                  <div className="chart-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16, marginBottom: 20 }}>
                    {charts.slice(0, 2).map((c, i) => (
                      <SmartChart key={i} config={c} textColor={textColor} delay={0.1 + i * 0.08} dark={dark} />
                    ))}
                  </div>
                  <div className="card chart-card" style={{ padding: '24px 28px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#06b6d4,#14b8a6)' }} />
                    <SectionHeading icon={TrendingUp} color="#14b8a6" label="Key Statistical Trends" badge="Stakeholder Insight" />
                    {narrativeLoading.trends
                      ? <SkeletonSection lines={5} />
                      : narrativeReport.trends
                        ? <div className="ie-md" style={{ fontSize: 14, lineHeight: 1.78, color: 'var(--t2)' }}><ReactMarkdown>{narrativeReport.trends}</ReactMarkdown></div>
                        : <SkeletonSection lines={4} />
                    }
                  </div>
                </div>

                {/* ──────────────────────────────────────────────────
                    PAGE 3: Charts 3 & 4 + Risk Analysis
                ────────────────────────────────────────────────── */}
                <div className="report-page" style={{ marginBottom: 32 }}>
                  <div className="chart-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16, marginBottom: 20 }}>
                    {charts.slice(2, 4).map((c, i) => (
                      <SmartChart key={i} config={c} textColor={textColor} delay={0.1 + i * 0.08} dark={dark} />
                    ))}
                    {/* Outlier card if available */}
                    {report?.visuals?.outliers?.length > 0 && (
                      <ChartCard title="Outlier Detection" icon={AlertTriangle} iconColor="#F59E0B" delay={0.3}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {report.visuals.outliers.map(o => (
                            <div key={o.column} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 12px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 8 }}>
                              <span style={{ fontSize: 12, fontFamily: 'var(--fm)', fontWeight: 600, color: 'var(--t1)' }}>{o.column}</span>
                              <span style={{ fontSize: 12, fontWeight: 700, color: '#F59E0B' }}>{o.count} outlier{o.count > 1 ? 's' : ''}</span>
                            </div>
                          ))}
                        </div>
                      </ChartCard>
                    )}
                  </div>
                  <div className="card chart-card" style={{ padding: '24px 28px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#f59e0b,#ef4444)' }} />
                    <SectionHeading icon={AlertTriangle} color="#ef4444" label="Critical Risk Factors" badge="Data Quality" />
                    {narrativeLoading.risks
                      ? <SkeletonSection lines={5} />
                      : narrativeReport.risks
                        ? <div className="ie-md" style={{ fontSize: 14, lineHeight: 1.78, color: 'var(--t2)' }}><ReactMarkdown>{narrativeReport.risks}</ReactMarkdown></div>
                        : <SkeletonSection lines={4} />
                    }
                  </div>
                </div>

                {/* ──────────────────────────────────────────────────
                    PAGE 4: Strategic Roadmap
                ────────────────────────────────────────────────── */}
                <div className="report-page" style={{ marginBottom: 32 }}>
                  <div className="card chart-card" style={{ padding: '24px 28px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#6366f1,#ec4899)' }} />
                    <SectionHeading icon={Activity} color="#6366f1" label="Strategic Roadmap" badge="5-Step Action Plan" />
                    {narrativeLoading.roadmap
                      ? <SkeletonSection lines={8} />
                      : narrativeReport.roadmap
                        ? <div className="ie-md" style={{ fontSize: 14, lineHeight: 1.78, color: 'var(--t2)' }}><ReactMarkdown>{narrativeReport.roadmap}</ReactMarkdown></div>
                        : <SkeletonSection lines={6} />
                    }
                  </div>
                </div>

                {/* ──────────────────────────────────────────────────
                    PAGE 5: Legacy full AI report (scrollable context)
                ────────────────────────────────────────────────── */}
                <div className="report-page" style={{ marginBottom: 32 }}>
                  <div className="card chart-card" style={{ padding: '24px 28px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2.5, background: 'var(--grad)' }} />
                    <SectionHeading icon={Brain} color="var(--purple)" label="Full AI Analysis" badge="Generative Insight Engine" />
                    <div className="ie-md" style={{ fontSize: 14, lineHeight: 1.78, color: 'var(--t2)' }}>
                      <ReactMarkdown>{report.report}</ReactMarkdown>
                    </div>
                  </div>
                </div>

                {/* Inline Chat */}
                {chatMessages.length > 0 && (
                  <div className="card" style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                      <MessageSquare size={15} color="#6366F1" strokeWidth={2} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>AI Chat</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 360, overflowY: 'auto', paddingRight: 4 }}>
                      {chatMessages.map(msg => (
                        <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                          <div style={{ maxWidth: '80%', padding: '10px 14px', borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px', background: msg.role === 'user' ? '#6366F1' : 'var(--surf2)', color: msg.role === 'user' ? '#fff' : 'var(--t1)', fontSize: 13, lineHeight: 1.6, border: msg.role === 'user' ? 'none' : '1px solid var(--bd)' }}>
                            <ReactMarkdown>{msg.text}</ReactMarkdown>
                          </div>
                        </div>
                      ))}
                      {chatLoading && (
                        <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '8px 14px' }}>
                          {[0,1,2].map(i => <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#6366F1', opacity: 0.6, animation: `bounce .9s ${i * 0.2}s infinite` }} />)}
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                    <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}`}</style>
                  </div>
                )}
              </motion.div>
            );
          })()}

          {/* Empty */}
          {!report && !loading && !error && (
            <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--t3)' }}>
              <p style={{ fontSize: 15, fontWeight: 600 }}>No report generated yet.</p>
              <p style={{ fontSize: 13, marginTop: 8 }}>Click "Re-run" or upload a CSV from the home page.</p>
            </div>
          )}

          {/* ── ENTERPRISE PRINT FOOTER (fixed at bottom of every printed page) ── */}
          <div className="print-footer" style={{ display: 'none' }}>
            <span>Generated by <strong>PromptInsights</strong> &nbsp;·&nbsp; {fileName}</span>
            <span style={{ color: '#94a3b8' }}>Confidential Analysis — 2026</span>
          </div>

          {/* ── CHAT INPUT BAR (excluded from PDF capture via no-print) ── */}
          {report && (
            <div className="print-hide no-print" style={{ position: 'sticky', bottom: 0, background: 'var(--surf)', borderTop: '1px solid var(--bd)', padding: '10px 28px', display: 'flex', gap: 10, alignItems: 'center' }}>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Ask a question about this dataset…"
                style={{ flex: 1, background: 'var(--surf2)', border: '1px solid var(--bd)', borderRadius: 10, padding: '9px 14px', fontSize: 13, color: 'var(--t1)', outline: 'none', fontFamily: 'var(--fb)' }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!chatInput.trim() || chatLoading}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#6366F1', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: (!chatInput.trim() || chatLoading) ? 'not-allowed' : 'pointer', opacity: (!chatInput.trim() || chatLoading) ? 0.5 : 1, fontFamily: 'var(--fb)', transition: 'opacity .2s' }}
              >
                <Send size={14} />
                Send
              </button>
            </div>
          )}
        </div>
      </main>
    </motion.div>

    {/* ── FLOATING HISTORY BUTTON (logged-in users only, bottom-right) ── */}
    {isLoggedIn && reportHistory.length > 0 && (
      <button
        onClick={() => setHistoryOpen(true)}
        title="Recent Reports"
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 50,
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--grad)', color: '#fff', border: 'none',
          borderRadius: 12, padding: '10px 16px', fontSize: 12, fontWeight: 700,
          cursor: 'pointer', boxShadow: '0 4px 20px rgba(99,102,241,0.45)',
          fontFamily: 'var(--fb)', transition: 'transform .15s, box-shadow .15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 26px rgba(99,102,241,0.55)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,102,241,0.45)'; }}
      >
        <History size={14} />
        History · {reportHistory.length}
      </button>
    )}

    {/* ── HISTORY SLIDE-OVER DRAWER (logged-in users only) ── */}
    <AnimatePresence>
      {isLoggedIn && historyOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setHistoryOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 60 }}
          />
          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ x: -320 }} animate={{ x: 0 }} exit={{ x: -320 }}
            transition={{ type: 'spring', stiffness: 340, damping: 34 }}
            style={{
              position: 'fixed', top: 64, left: 0, bottom: 0, width: 310, zIndex: 70,
              background: 'var(--surf)', borderRight: '1px solid var(--bd)',
              display: 'flex', flexDirection: 'column', boxShadow: '4px 0 32px rgba(0,0,0,0.18)',
            }}
          >
            {/* Drawer header */}
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--bd)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <History size={14} color="#6366F1" strokeWidth={2} />
                </div>
                <span style={{ fontFamily: 'var(--fh)', fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>Recent Reports</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', background: 'var(--surf2)', border: '1px solid var(--bd)', borderRadius: 5, padding: '1px 7px' }}>{reportHistory.length}</span>
              </div>
              <button onClick={() => setHistoryOpen(false)}
                style={{ background: 'var(--surf2)', border: '1px solid var(--bd)', borderRadius: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--t2)' }}>
                <X size={13} />
              </button>
            </div>
            {/* Drawer list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {reportHistory.map((entry, i) => (
                <div
                  key={entry.id || i}
                  onClick={() => { loadFromHistory(entry); setHistoryOpen(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, cursor: 'pointer', border: '1px solid var(--bd)', background: 'var(--bg)', transition: 'background .15s, border-color .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--surf2)'; e.currentTarget.style.borderColor = '#6366F1'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.borderColor = 'var(--bd)'; }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#6366F1' }}>#{i + 1}</span>
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.fileName}</div>
                    <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 2 }}>{entry.row_count?.toLocaleString?.() || '—'} rows · {entry.column_count || '—'} cols</div>
                    <div style={{ fontSize: 10, color: 'var(--t3)' }}>{new Date(entry.timestamp).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
            {/* Drawer footer hint */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--bd)', fontSize: 11, color: 'var(--t3)', textAlign: 'center' }}>
              Click any report to load it instantly
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </>
  );
}
