import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, FileText } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import ChatMessage from '../components/ChatMessage';

/* ─── CONSTANTS ─── */
const NAVBAR_HEIGHT = 64;

const SUGGESTIONS = [
  'Show outliers',
  'Correlation matrix',
  'Summarize trends',
];

/* ─── ATMOSPHERIC BLURS ─── */
function AtmosphericBlurs({ dark }) {
  return (
    <>
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: 560, height: 560, borderRadius: '50%', background: dark ? 'rgba(124,58,237,.13)' : 'rgba(124,58,237,.05)', filter: 'blur(120px)', left: '-6%', top: '-8%', animation: 'ie-orb1 16s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', width: 360, height: 360, borderRadius: '50%', background: dark ? 'rgba(99,102,241,.09)' : 'rgba(99,102,241,.03)', filter: 'blur(90px)', left: '30%', top: '20%', animation: 'ie-orb2 22s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: dark ? 'rgba(20,184,166,.07)' : 'rgba(20,184,166,.02)', filter: 'blur(80px)', right: '4%', bottom: '8%', animation: 'ie-orb3 19s ease-in-out infinite' }} />
      </div>
      <style>{`
        @keyframes ie-orb1 { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(22px,-16px) scale(1.05)} 70%{transform:translate(-10px,12px) scale(.97)}}
        @keyframes ie-orb2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-18px,16px)}}
        @keyframes ie-orb3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(14px,-10px) scale(1.04)}}
      `}</style>
    </>
  );
}

/* ─── EMPTY STATE ─── */
function EmptyState({ fileName, onSuggestion, dark }) {
  return (
    <motion.div
      key="empty"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
      style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 0, padding: '40px 24px',
        position: 'relative', zIndex: 1,
      }}
    >
      {/* Mode label */}
      <span style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '2.5px',
        textTransform: 'uppercase', color: 'var(--purple)',
        fontFamily: 'var(--fb)', marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 7,
      }}>
        <span style={{
          width: 5, height: 5, borderRadius: '50%',
          background: 'var(--purple)', display: 'inline-block',
          boxShadow: '0 0 6px var(--purple)',
        }} />
        Interactive Mode
      </span>

      {/* Heading */}
      <h1 style={{
        fontFamily: 'var(--fh)',
        fontSize: 'clamp(26px, 4vw, 42px)',
        fontWeight: 800, letterSpacing: '-1.2px',
        color: dark ? '#f8fafc' : '#0f172a', textAlign: 'center',
        lineHeight: 1.12, marginBottom: 14,
      }}>
        Chat with{' '}
        <span style={{
          background: 'var(--grad)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          {fileName}
        </span>
      </h1>

      <p style={{
        fontSize: 15, color: dark ? 'rgba(148,163,184,.75)' : 'rgba(51,65,85,.65)',
        textAlign: 'center', maxWidth: 420,
        lineHeight: 1.72, marginBottom: 36,
      }}>
        Ask anything about your dataset — distributions, trends, anomalies, or correlations.
      </p>

      {/* Suggestion chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
        {SUGGESTIONS.map((s, i) => (
          <motion.button
            key={s}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 + i * 0.08, duration: 0.38 }}
            onClick={() => onSuggestion(s)}
            id={`suggestion-chip-${i}`}
            style={{
              background: dark ? 'rgba(124,58,237,.08)' : 'rgba(167,139,250,.08)',
              border: dark ? '1px solid rgba(124,58,237,.28)' : '1px solid rgb(229,215,189)',
              color: dark ? 'rgba(167,139,250,.9)' : '#6b21a8',
              borderRadius: 999, padding: '7px 18px',
              fontSize: 13, fontWeight: 600,
              fontFamily: 'var(--fb)', cursor: 'pointer',
              transition: 'background .2s, border-color .2s, color .2s, transform .15s',
            }}
            onMouseEnter={e => {
              if (dark) {
                e.currentTarget.style.background = 'rgba(124,58,237,.18)';
                e.currentTarget.style.borderColor = 'rgba(124,58,237,.55)';
                e.currentTarget.style.color = '#c4b5fd';
              } else {
                e.currentTarget.style.background = 'rgba(168,85,247,.08)';
                e.currentTarget.style.borderColor = 'rgba(168,85,247,.4)';
                e.currentTarget.style.color = '#7e22ce';
              }
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              if (dark) {
                e.currentTarget.style.background = 'rgba(124,58,237,.08)';
                e.currentTarget.style.borderColor = 'rgba(124,58,237,.28)';
                e.currentTarget.style.color = 'rgba(167,139,250,.9)';
              } else {
                e.currentTarget.style.background = 'rgba(167,139,250,.08)';
                e.currentTarget.style.borderColor = 'rgb(229,215,189)';
                e.currentTarget.style.color = '#6b21a8';
              }
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {s}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── CHAT BUBBLE ─── */
function ChatBubble({ msg, index, dark }) {
  const isUser = msg.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1], delay: index === 0 ? 0 : 0 }}
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        padding: '2px 0',
      }}
    >
      {/* AI accent dot */}
      {!isUser && (
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: dark ? 'rgba(124,58,237,.12)' : 'rgba(168,85,247,.1)',
          border: dark ? '1px solid rgba(124,58,237,.22)' : '1px solid rgba(168,85,247,.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, marginRight: 10, marginTop: 2,
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: 'var(--grad)', display: 'block',
          }} />
        </div>
      )}

      <div style={{
        maxWidth: isUser ? '68%' : '82%',
        background: isUser
          ? (dark ? 'rgba(30,41,59,.72)' : '#ffffff')
          : (dark ? 'transparent' : 'rgba(243,232,255,.5)'),
        border: isUser
          ? (dark ? '1px solid rgba(255,255,255,.08)' : '1px solid rgba(168,85,247,.15)')
          : '0px solid transparent',
        borderLeft: isUser ? undefined : (dark ? '2.5px solid rgba(124,58,237,.5)' : '2.5px solid rgba(168,85,247,.6)'),
        borderRadius: isUser ? 16 : 0,
        borderTopRightRadius: isUser ? 4 : undefined,
        padding: isUser ? '11px 16px' : '8px 16px',
        backdropFilter: isUser ? (dark ? 'blur(8px)' : 'none') : undefined,
        WebkitBackdropFilter: isUser ? (dark ? 'blur(8px)' : 'none') : undefined,
        boxShadow: isUser && !dark ? '0 1px 2px rgba(0,0,0,.05)' : undefined,
      }}>
        {isUser ? (
          <p style={{
            fontSize: 14, lineHeight: 1.76,
            color: dark ? 'rgba(226,232,240,.92)' : '#1e293b',
            margin: 0, fontFamily: 'var(--fb)',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}>
            {msg.content}
          </p>
        ) : (
          <ChatMessage content={msg.content} dark={dark} />
        )}
      </div>
    </motion.div>
  );
}

/* ─── TYPING INDICATOR ─── */
function TypingIndicator({ dark }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.24 }}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}
    >
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: dark ? 'rgba(124,58,237,.12)' : 'rgba(168,85,247,.1)',
        border: dark ? '1px solid rgba(124,58,237,.22)' : '1px solid rgba(168,85,247,.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--grad)', display: 'block' }} />
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4,
        borderLeft: dark ? '2.5px solid rgba(124,58,237,.5)' : '2.5px solid rgba(168,85,247,.6)',
        paddingLeft: 14,
      }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            width: 5, height: 5, borderRadius: '50%',
            background: dark ? 'rgba(124,58,237,.55)' : 'rgba(168,85,247,.55)',
            display: 'inline-block',
            animation: `ie-dot 1.2s ${i * 0.2}s ease-in-out infinite`,
          }} />
        ))}
      </div>
      <style>{`
        @keyframes ie-dot {
          0%,80%,100% { transform: scale(0.7); opacity: 0.4; }
          40% { transform: scale(1.1); opacity: 1; }
        }
      `}</style>
    </motion.div>
  );
}

/* ─── SMART BAR ─── */
function SmartBar({ fileName, value, onChange, onSend, disabled, dark }) {
  const textareaRef = useRef(null);

  /* Auto-grow textarea */
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 140) + 'px';
  }, [value]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div style={{
      flexShrink: 0,
      padding: '16px 20px 20px',
      background: 'transparent',
      position: 'relative', zIndex: 10,
    }}>
      {/* Glassmorphic pill container */}
      <div
        style={{
          maxWidth: 768, margin: '0 auto',
          background: dark ? 'rgba(15,23,42,.62)' : 'rgba(255,255,255,.7)',
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
          border: dark ? '1px solid rgba(255,255,255,.10)' : '1px solid rgba(168,85,247,.15)',
          borderRadius: 20,
          display: 'flex', alignItems: 'flex-end', gap: 10,
          padding: '10px 12px 10px 14px',
          boxShadow: dark ? '0 8px 40px rgba(0,0,0,.35), 0 0 0 1px rgba(124,58,237,.06)' : '0 1px 3px rgba(0,0,0,.1)',
          transition: 'border-color .2s, box-shadow .3s',
        }}
        onFocusCapture={e => {
          if (dark) {
            e.currentTarget.style.borderColor = 'rgba(124,58,237,.38)';
            e.currentTarget.style.boxShadow = '0 8px 40px rgba(0,0,0,.4), 0 0 0 3px rgba(124,58,237,.08)';
          } else {
            e.currentTarget.style.borderColor = 'rgba(168,85,247,.35)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,.1), 0 0 0 2px rgba(168,85,247,.1)';
          }
        }}
        onBlurCapture={e => {
          if (dark) {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,.10)';
            e.currentTarget.style.boxShadow = '0 8px 40px rgba(0,0,0,.35), 0 0 0 1px rgba(124,58,237,.06)';
          } else {
            e.currentTarget.style.borderColor = 'rgba(168,85,247,.15)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,.1)';
          }
        }}
      >
        {/* Context tag */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: dark ? 'rgba(124,58,237,.12)' : 'rgb(243,232,255)',
          border: dark ? '1px solid rgba(124,58,237,.24)' : '1px solid rgba(168,85,247,.3)',
          borderRadius: 8, padding: '4px 9px',
          flexShrink: 0, alignSelf: 'flex-end', marginBottom: 2,
          userSelect: 'none',
        }}>
          <FileText size={11} color={dark ? 'rgba(167,139,250,.85)' : '#a855f7'} strokeWidth={2} />
          <span style={{
            fontSize: 11, fontWeight: 700,
            color: dark ? 'rgba(167,139,250,.85)' : '#7e22ce',
            fontFamily: 'var(--fm)',
            maxWidth: 140, overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {fileName}
          </span>
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          id="ie-chat-input"
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask a question about your data…"
          rows={1}
          disabled={disabled}
          style={{
            flex: 1, resize: 'none', border: 'none', outline: 'none',
            background: 'transparent', color: dark ? 'rgba(226,232,240,.92)' : '#0f172a',
            fontSize: 14, lineHeight: 1.65, fontFamily: 'var(--fb)',
            padding: '4px 0', minHeight: 26,
            maxHeight: 140, overflowY: 'auto',
            caretColor: 'var(--purple)',
          }}
        />

        {/* Send button */}
        <button
          id="ie-send-btn"
          onClick={onSend}
          disabled={disabled || !value.trim()}
          aria-label="Send message"
          style={{
            flexShrink: 0, width: 36, height: 36,
            borderRadius: 11,
            background: value.trim() && !disabled
              ? 'linear-gradient(135deg,#9333ea 0%,#6366F1 100%)'
              : (dark ? 'rgba(255,255,255,.06)' : 'rgba(168,85,247,.08)'),
            border: '1px solid',
            borderColor: value.trim() && !disabled
              ? 'transparent'
              : (dark ? 'rgba(255,255,255,.08)' : 'rgba(168,85,247,.15)'),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: value.trim() && !disabled ? 'pointer' : 'default',
            alignSelf: 'flex-end',
            transition: 'background .22s, box-shadow .28s, border-color .22s, transform .15s',
            boxShadow: value.trim() && !disabled
              ? '0 0 18px rgba(147,51,234,.35)'
              : 'none',
          }}
          onMouseEnter={e => {
            if (value.trim() && !disabled) {
              e.currentTarget.style.boxShadow = '0 0 28px rgba(147,51,234,.55)';
              e.currentTarget.style.transform = 'scale(1.06)';
            }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.boxShadow = value.trim() && !disabled ? '0 0 18px rgba(147,51,234,.35)' : 'none';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <Send size={15} color={value.trim() && !disabled ? '#fff' : (dark ? 'rgba(255,255,255,.3)' : 'rgba(168,85,247,.4)')} strokeWidth={2.2} />
        </button>
      </div>

      {/* Hint */}
      <p style={{
        textAlign: 'center', fontSize: 11,
        color: dark ? 'rgba(100,116,139,.6)' : 'rgba(71,85,105,.6)',
        marginTop: 8, fontFamily: 'var(--fb)',
      }}>
        Press <kbd style={{ background: dark ? 'rgba(255,255,255,.06)' : 'rgba(168,85,247,.08)', border: dark ? '1px solid rgba(255,255,255,.08)' : '1px solid rgba(168,85,247,.15)', borderRadius: 4, padding: '1px 5px', fontFamily: 'var(--fm)', fontSize: 10, color: dark ? 'rgba(148,163,184,.7)' : '#7e22ce' }}>Enter</kbd> to send &nbsp;·&nbsp; <kbd style={{ background: dark ? 'rgba(255,255,255,.06)' : 'rgba(168,85,247,.08)', border: dark ? '1px solid rgba(255,255,255,.08)' : '1px solid rgba(168,85,247,.15)', borderRadius: 4, padding: '1px 5px', fontFamily: 'var(--fm)', fontSize: 10, color: dark ? 'rgba(148,163,184,.7)' : '#7e22ce' }}>Shift+Enter</kbd> for new line
      </p>
    </div>
  );
}

/* ─── BACKEND API URL ─── */
const API_URL = 'http://127.0.0.1:8000/api/chat';

/* ─── PLACEHOLDER STYLE ─── */
const PLACEHOLDER_STYLE = `
  #ie-chat-input::placeholder { color: rgba(100,116,139,.55); }
  #ie-chat-input::-webkit-scrollbar { width: 3px; }
  #ie-chat-input::-webkit-scrollbar-thumb { background: rgba(124,58,237,.3); border-radius: 3px; }

  /* ── Markdown container ── */
  .ie-md { word-break: break-word; }
  .ie-md p  { margin: 0 0 .55em; line-height: 1.76; }
  .ie-md p:last-child { margin-bottom: 0; }
  .ie-md strong { font-weight: 700; color: inherit; }
  .ie-md em    { font-style: italic; }
  .ie-md ul, .ie-md ol { margin: .4em 0 .55em 1.4em; padding: 0; }
  .ie-md li    { margin-bottom: .2em; line-height: 1.68; }
  .ie-md code  {
    font-family: var(--fm, 'JetBrains Mono', monospace);
    font-size: .82em;
    background: rgba(124,58,237,.1);
    border: 1px solid rgba(124,58,237,.18);
    border-radius: 4px;
    padding: 1px 5px;
  }
  .ie-md pre   {
    background: rgba(15,23,42,.55);
    border: 1px solid rgba(124,58,237,.18);
    border-radius: 8px;
    padding: 12px 14px;
    overflow-x: auto;
    margin: .55em 0;
  }
  .ie-md pre code { background: none; border: none; padding: 0; font-size: .82em; }
  .ie-md h1,.ie-md h2,.ie-md h3,.ie-md h4 {
    font-family: var(--fh);
    font-weight: 700;
    line-height: 1.28;
    margin: .8em 0 .35em;
    color: inherit;
  }
  .ie-md h1 { font-size: 1.25em; }
  .ie-md h2 { font-size: 1.1em; }
  .ie-md h3 { font-size: 1em; }
  .ie-md blockquote {
    border-left: 3px solid rgba(124,58,237,.45);
    margin: .5em 0;
    padding: .2em 0 .2em .85em;
    color: inherit;
    opacity: .8;
  }
  .ie-md a {
    color: #a855f7;
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .ie-md hr {
    border: none;
    border-top: 1px solid rgba(124,58,237,.18);
    margin: .75em 0;
  }
`;

/* ════════════════════════════════════════════
   MAIN PAGE COMPONENT
════════════════════════════════════════════ */
export default function InteractiveExploration() {
  const { dark }     = useTheme();
  const location     = useLocation();
  const fileName     = location.state?.fileName   || 'No file selected';
  const csvPreview   = location.state?.csvPreview || '';
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [thinking, setThinking] = useState(false);
  const [error, setError]       = useState('');

  const stageRef  = useRef(null);
  const bottomRef = useRef(null);

  /* Auto-scroll to bottom on new messages / thinking state */
  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, thinking, scrollToBottom]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || thinking) return;

    const userMsg = { role: 'user', content: text, id: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setThinking(true);
    setError('');

    try {
      console.log('Sending to backend:', text);
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          csv_data: csvPreview || undefined,  // full CSV → Pandas statistical summary
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Server error ${res.status}`);
      }

      const data = await res.json();
      const aiMsg = { role: 'assistant', content: data.reply, id: Date.now() + 1 };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setError(err.message || 'Unable to reach the AI service. Is the backend running?');
    } finally {
      setThinking(false);
    }
  }, [input, thinking]);

  const handleSuggestion = useCallback((text) => {
    setInput(text);
  }, []);

  const hasMessages = messages.length > 0;

  return (
    <>
      <style>{PLACEHOLDER_STYLE}</style>

      {/* Page wrapper: fills viewport below Navbar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.38 }}
        style={{
          height: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
          display: 'flex',
          flexDirection: 'column',
          background: dark ? '#0f172a' : '#f8fafc',
          position: 'relative', overflow: 'hidden',
        }}
      >
        <AtmosphericBlurs dark={dark} />

        {/* ── STAGE (scrollable chat area) ── */}
        <div
          ref={stageRef}
          style={{
            flex: 1, overflowY: 'auto',
            display: 'flex', flexDirection: 'column',
            position: 'relative', zIndex: 1,
          }}
        >
          <AnimatePresence mode="wait">
            {!hasMessages ? (
              <EmptyState
                key="empty"
                fileName={fileName}
                onSuggestion={handleSuggestion}
                dark={dark}
              />
            ) : (
              <motion.div
                key="chat"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.28 }}
                style={{
                  flex: 1,
                  maxWidth: 820, width: '100%',
                  margin: '0 auto',
                  padding: '32px 20px 16px',
                  display: 'flex', flexDirection: 'column', gap: 18,
                }}
              >
                {messages.map((msg, i) => (
                  <ChatBubble key={msg.id} msg={msg} index={i} dark={dark} />
                ))}

                <AnimatePresence>
                  {thinking && <TypingIndicator key="typing" dark={dark} />}
                  {error && (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.24 }}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 10,
                        padding: '10px 14px',
                        background: dark ? 'rgba(239,68,68,0.08)' : 'rgba(254,226,226,0.7)',
                        border: dark ? '1px solid rgba(239,68,68,0.22)' : '1px solid rgba(239,68,68,0.20)',
                        borderLeft: '3px solid rgba(239,68,68,0.7)',
                        borderRadius: 8,
                      }}
                    >
                      <span style={{ fontSize: 13, color: dark ? 'rgba(252,165,165,.9)' : '#b91c1c', fontFamily: 'var(--fb)', lineHeight: 1.6 }}>
                        ⚠ {error}
                      </span>
                      <button
                        onClick={() => setError('')}
                        style={{ marginLeft: 'auto', background: 'none', border: 'none', color: dark ? 'rgba(252,165,165,.6)' : '#ef4444', cursor: 'pointer', fontSize: 16, lineHeight: 1, flexShrink: 0, padding: '0 2px' }}
                        aria-label="Dismiss error"
                      >×</button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Scroll anchor */}
                <div ref={bottomRef} style={{ height: 1 }} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scroll anchor for empty state */}
          {!hasMessages && <div ref={bottomRef} style={{ height: 1 }} />}
        </div>

        {/* ── SMART BAR (bottom-aligned, always visible) ── */}
        <SmartBar
          fileName={fileName}
          value={input}
          onChange={setInput}
          dark={dark}
          onSend={sendMessage}
          disabled={thinking}
        />
      </motion.div>
    </>
  );
}
