import { useState } from 'react';
import { indexRepository } from '../services/api';

const STATUS_CONFIG = {
  pending:    { text: 'Pending',                      color: 'var(--text-muted)',   bg: 'rgba(90, 90, 120, 0.12)', dot: 'var(--text-muted)' },
  cloning:    { text: 'Cloning repository…',          color: 'var(--warning)',      bg: 'rgba(251, 191, 36, 0.08)', dot: 'var(--warning)' },
  processing: { text: 'Scanning & chunking files…',   color: 'var(--warning)',      bg: 'rgba(251, 191, 36, 0.08)', dot: 'var(--warning)' },
  embedding:  { text: 'Generating embeddings…',       color: 'var(--info)',         bg: 'rgba(96, 165, 250, 0.08)', dot: 'var(--info)' },
  completed:  { text: 'Ready',                        color: 'var(--success)',      bg: 'rgba(52, 211, 153, 0.08)', dot: 'var(--success)' },
  failed:     { text: 'Failed',                       color: 'var(--error)',        bg: 'rgba(248, 113, 113, 0.08)', dot: 'var(--error)' },
};

export default function RepoSection({ onRepoIndexed }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [repo, setRepo] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError('');
    setRepo(null);

    try {
      const data = await indexRepository(url.trim());
      setRepo(data);
      onRepoIndexed(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const statusInfo = repo ? STATUS_CONFIG[repo.status] || STATUS_CONFIG.pending : null;

  return (
    <section className="glass animate-fade-in-up" style={{ padding: '28px' }}>
      {/* Section Header */}
      <div className="flex items-center gap-2.5 mb-5">
        <div
          className="flex items-center justify-center w-8 h-8 rounded-lg"
          style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.15)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
            <path d="M9 18c-4.51 2-5-2-7-2" />
          </svg>
        </div>
        <div>
          <h2
            style={{
              color: 'var(--text-primary)',
              fontSize: '14px',
              fontWeight: 600,
              letterSpacing: '-0.01em',
            }}
          >
            Repository
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '1px' }}>
            Paste a public GitHub URL to index
          </p>
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="relative flex-1">
          <div
            className="absolute left-3.5 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-muted)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </div>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/owner/repo"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 14px 12px 40px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              fontFamily: "'JetBrains Mono', monospace",
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
          disabled={loading || !url.trim()}
          style={{
            padding: '12px 24px',
            background: loading || !url.trim() ? 'rgba(99, 102, 241, 0.3)' : 'var(--accent-gradient)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 600,
            fontFamily: "'Inter', sans-serif",
            cursor: loading || !url.trim() ? 'not-allowed' : 'pointer',
            opacity: loading || !url.trim() ? 0.5 : 1,
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: loading || !url.trim() ? 'none' : '0 2px 12px rgba(99, 102, 241, 0.25)',
          }}
          onMouseEnter={(e) => {
            if (!loading && url.trim()) {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(99, 102, 241, 0.35)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = loading || !url.trim() ? 'none' : '0 2px 12px rgba(99, 102, 241, 0.25)';
          }}
        >
          {loading ? (
            <>
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none"
                style={{ animation: 'spin 1s linear infinite' }}
              >
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
              </svg>
              Indexing…
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Index Repository
            </>
          )}
        </button>
      </form>

      {/* Error State */}
      {error && (
        <div
          className="animate-fade-in"
          style={{
            marginTop: '16px',
            padding: '14px 16px',
            background: 'rgba(248, 113, 113, 0.06)',
            border: '1px solid rgba(248, 113, 113, 0.15)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--error)',
            fontSize: '13px',
            lineHeight: 1.5,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginTop: '1px', flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {/* Repo Result Card */}
      {repo && (
        <div
          className="animate-fade-in-up"
          style={{
            marginTop: '16px',
            padding: '16px 18px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center w-9 h-9 rounded-lg"
                style={{
                  background: 'rgba(99, 102, 241, 0.08)',
                  border: '1px solid rgba(99, 102, 241, 0.12)',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <div>
                <p style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600 }}>
                  {repo.name}
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px', fontFamily: "'JetBrains Mono', monospace" }}>
                  {repo.url}
                </p>
              </div>
            </div>
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: statusInfo.bg, border: `1px solid ${statusInfo.color}20` }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: statusInfo.dot,
                  boxShadow: `0 0 6px ${statusInfo.dot}50`,
                  animation: repo.status !== 'completed' && repo.status !== 'failed' ? 'pulse-glow 1.5s ease-in-out infinite' : 'none',
                }}
              />
              <span style={{ color: statusInfo.color, fontSize: '12px', fontWeight: 500 }}>
                {statusInfo.text}
              </span>
            </div>
          </div>

          {repo.status === 'completed' && (
            <div
              className="flex gap-5 mt-4 pt-3"
              style={{ borderTop: '1px solid var(--border-default)' }}
            >
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                  <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{repo.total_files}</strong> files
                </span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                  <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{repo.total_chunks}</strong> chunks
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
