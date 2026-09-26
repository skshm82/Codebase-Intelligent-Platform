import { useState, useRef, useEffect } from 'react';
import { askQuestion } from '../services/api';

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2" style={{ padding: '8px 0' }}>
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'var(--accent-primary)',
              animation: `typing-bounce 1.4s ease-in-out ${i * 0.16}s infinite`,
            }}
          />
        ))}
      </div>
      <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
        Analyzing codebase…
      </span>
    </div>
  );
}

function MessageBubble({ msg, index }) {
  const isUser = msg.role === 'user';

  return (
    <div
      className={isUser ? 'animate-slide-right' : 'animate-slide-left'}
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        animationDelay: `${index * 0.05}s`,
      }}
    >
      <div style={{ maxWidth: '85%' }}>
        {/* Avatar + Label */}
        <div
          className="flex items-center gap-2 mb-2"
          style={{
            flexDirection: isUser ? 'row-reverse' : 'row',
          }}
        >
          <div
            className="flex items-center justify-center w-6 h-6 rounded-full"
            style={{
              background: isUser
                ? 'var(--accent-gradient)'
                : 'rgba(52, 211, 153, 0.1)',
              border: isUser ? 'none' : '1px solid rgba(52, 211, 153, 0.2)',
              fontSize: '11px',
              fontWeight: 700,
              color: isUser ? '#fff' : 'var(--success)',
            }}
          >
            {isUser ? 'U' : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            )}
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {isUser ? 'You' : 'AI Assistant'}
          </span>
        </div>

        {/* Bubble */}
        <div
          style={{
            padding: '14px 18px',
            borderRadius: isUser
              ? 'var(--radius-lg) var(--radius-lg) var(--radius-sm) var(--radius-lg)'
              : 'var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm)',
            background: isUser
              ? 'rgba(99, 102, 241, 0.1)'
              : 'var(--bg-elevated)',
            border: `1px solid ${isUser ? 'rgba(99, 102, 241, 0.18)' : 'var(--border-default)'}`,
            color: 'var(--text-primary)',
            fontSize: '14px',
            lineHeight: 1.7,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {msg.content}
        </div>

        {/* Sources */}
        {!isUser && msg.sources && msg.sources.length > 0 && (
          <div style={{ marginTop: '10px', paddingLeft: '4px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
              Referenced Files
            </p>
            <div className="flex flex-wrap gap-2">
              {msg.sources.map((src, j) => (
                <div
                  key={j}
                  className="flex items-center gap-1.5"
                  style={{
                    padding: '5px 10px',
                    background: 'rgba(99, 102, 241, 0.06)',
                    border: '1px solid rgba(99, 102, 241, 0.12)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    fontFamily: "'JetBrains Mono', monospace",
                    color: 'var(--text-accent)',
                    transition: 'all 0.15s ease',
                    cursor: 'default',
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  {src.file}
                  {src.similarity !== undefined && (
                    <span style={{ color: 'var(--text-muted)', fontSize: '10px', marginLeft: '4px' }}>
                      {Math.round(src.similarity * 100)}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatSection({ repo }) {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!question.trim() || !repo) return;

    const userQuestion = question.trim();
    setQuestion('');
    setLoading(true);
    setError('');

    setMessages((prev) => [...prev, { role: 'user', content: userQuestion }]);

    try {
      const data = await askQuestion(repo.id, userQuestion);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer,
          sources: data.sources || [],
        },
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  // Empty / disabled state
  if (!repo || repo.status !== 'completed') {
    return (
      <section
        className="glass animate-fade-in-up"
        style={{ padding: '28px', animationDelay: '0.1s' }}
      >
        <div className="flex items-center gap-2.5 mb-4">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.15)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600 }}>
            Chat
          </h2>
        </div>
        <div
          className="flex flex-col items-center justify-center py-12"
          style={{ color: 'var(--text-muted)' }}
        >
          <div
            className="flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: 'rgba(99, 102, 241, 0.06)', border: '1px solid rgba(99, 102, 241, 0.1)' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>
            No repository indexed yet
          </p>
          <p style={{ fontSize: '12px', marginTop: '4px' }}>
            Index a repository above to start asking questions
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      className="glass animate-fade-in-up"
      style={{ padding: '28px', animationDelay: '0.1s' }}
    >
      {/* Section Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.15)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600 }}>
              Chat
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '1px' }}>
              Querying <span style={{ color: 'var(--text-accent)', fontWeight: 500 }}>{repo.name}</span>
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            style={{
              padding: '6px 12px',
              background: 'transparent',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-muted)',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              fontFamily: "'Inter', sans-serif",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-hover)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-default)';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            Clear chat
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div
        style={{
          maxHeight: '520px',
          overflowY: 'auto',
          marginBottom: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          paddingRight: '4px',
        }}
      >
        {messages.length === 0 && (
          <div
            className="flex flex-col items-center justify-center py-10"
            style={{ color: 'var(--text-muted)' }}
          >
            <p style={{ fontSize: '13px' }}>Ask a question about the codebase to get started</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} index={i} />
        ))}

        {loading && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div
          className="animate-fade-in"
          style={{
            marginBottom: '16px',
            padding: '12px 16px',
            background: 'rgba(248, 113, 113, 0.06)',
            border: '1px solid rgba(248, 113, 113, 0.15)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--error)',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleAsk} className="flex gap-3">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask something about the codebase…"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px 18px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              fontFamily: "'Inter', sans-serif",
              outline: 'none',
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--border-active)';
              e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border-default)';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !question.trim()}
          style={{
            padding: '14px 20px',
            background: loading || !question.trim() ? 'rgba(99, 102, 241, 0.2)' : 'var(--accent-gradient)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 600,
            fontFamily: "'Inter', sans-serif",
            cursor: loading || !question.trim() ? 'not-allowed' : 'pointer',
            opacity: loading || !question.trim() ? 0.5 : 1,
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: loading || !question.trim() ? 'none' : '0 2px 12px rgba(99, 102, 241, 0.25)',
          }}
          onMouseEnter={(e) => {
            if (!loading && question.trim()) {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(99, 102, 241, 0.35)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = loading || !question.trim() ? 'none' : '0 2px 12px rgba(99, 102, 241, 0.25)';
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
          Ask
        </button>
      </form>
    </section>
  );
}
