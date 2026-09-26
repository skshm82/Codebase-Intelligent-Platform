export default function Header() {
  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: 'rgba(7, 7, 13, 0.75)',
        backdropFilter: 'blur(20px) saturate(1.3)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.3)',
        borderBottom: '1px solid var(--border-default)',
      }}
    >
      <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center gap-3.5">
          <div
            className="relative flex items-center justify-center w-10 h-10 rounded-xl overflow-hidden"
            style={{
              background: 'var(--accent-gradient)',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.2)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
              <line x1="14" y1="4" x2="10" y2="20" />
            </svg>
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 50%)',
                borderRadius: 'inherit',
              }}
            />
          </div>
          <div>
            <h1
              className="text-lg font-semibold tracking-tight"
              style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
            >
              Codebase Intelligence
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '1px' }}>
              AI-powered repository analysis
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full"
          style={{
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.15)',
          }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: 'var(--accent-primary)',
              boxShadow: '0 0 6px rgba(99, 102, 241, 0.5)',
              animation: 'pulse-glow 2s ease-in-out infinite',
            }}
          />
          <span style={{ color: 'var(--text-accent)', fontSize: '12px', fontWeight: 500 }}>
            RAG Engine
          </span>
        </div>
      </div>
    </header>
  );
}
