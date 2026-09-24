import { useState } from 'react';
import { indexRepository } from '../services/api';

const STATUS_LABELS = {
  pending: { text: 'Pending', color: 'text-gray-400' },
  cloning: { text: 'Cloning repository...', color: 'text-yellow-400' },
  processing: { text: 'Scanning & chunking files...', color: 'text-yellow-400' },
  embedding: { text: 'Generating embeddings...', color: 'text-blue-400' },
  completed: { text: 'Ready', color: 'text-emerald-400' },
  failed: { text: 'Failed', color: 'text-red-400' },
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

  const statusInfo = repo ? STATUS_LABELS[repo.status] || { text: repo.status, color: 'text-gray-400' } : null;

  return (
    <section className="rounded-xl border border-gray-800 bg-gray-900/60 p-6">
      <h2 className="text-sm font-medium text-gray-300 uppercase tracking-wider mb-4">
        Repository
      </h2>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://github.com/owner/repo"
          className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Indexing...
            </span>
          ) : (
            'Index Repository'
          )}
        </button>
      </form>

      {error && (
        <div className="mt-4 rounded-lg bg-red-900/30 border border-red-800 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {repo && (
        <div className="mt-4 rounded-lg bg-gray-800/50 border border-gray-700 px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">{repo.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{repo.url}</p>
            </div>
            <span className={`text-xs font-medium ${statusInfo.color}`}>
              {statusInfo.text}
            </span>
          </div>
          {repo.status === 'completed' && (
            <div className="mt-3 flex gap-4 text-xs text-gray-400">
              <span>{repo.total_files} files</span>
              <span>{repo.total_chunks} chunks</span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
