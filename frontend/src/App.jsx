import { useState } from 'react';
import Header from './components/Header';
import RepoSection from './components/RepoSection';
import ChatSection from './components/ChatSection';

export default function App() {
  const [repo, setRepo] = useState(null);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Header />

      <main className="mx-auto max-w-4xl px-6 py-8 space-y-6">
        <RepoSection onRepoIndexed={(data) => setRepo(data)} />
        <ChatSection repo={repo} />
      </main>

      <footer className="border-t border-gray-800 mt-12">
        <div className="mx-auto max-w-4xl px-6 py-4 text-center text-xs text-gray-600">
          Codebase Intelligence Platform MVP &mdash; RAG powered by Gemini + pgvector
        </div>
      </footer>
    </div>
  );
}
