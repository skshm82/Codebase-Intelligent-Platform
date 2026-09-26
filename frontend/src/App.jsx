import { useState } from 'react';
import Header from './components/Header';
import RepoSection from './components/RepoSection';
import ChatSection from './components/ChatSection';

export default function App() {
  const [repo, setRepo] = useState(null);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      <Header />

      <main className="flex-1 mx-auto w-full max-w-5xl px-6 py-10 space-y-8">
        <RepoSection onRepoIndexed={(data) => setRepo(data)} />
        <ChatSection repo={repo} />
      </main>

      <footer style={{ borderTop: '1px solid var(--border-default)' }}>
        <div className="mx-auto max-w-5xl px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: 'var(--success)', boxShadow: '0 0 8px rgba(52, 211, 153, 0.4)' }}
            />
            <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 500 }}>
              System Online
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', letterSpacing: '0.02em' }}>
            Codebase Intelligence Platform &mdash; RAG powered by Gemini + pgvector
          </p>
        </div>
      </footer>
    </div>
  );
}
