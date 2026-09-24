import { useState } from 'react';
import { askQuestion } from '../services/api';

export default function ChatSection({ repo }) {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([]);

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!question.trim() || !repo) return;

    const userQuestion = question.trim();
    setQuestion('');
    setLoading(true);
    setError('');

    // Add user message
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
    }
  };

  if (!repo || repo.status !== 'completed') {
    return (
      <section className="rounded-xl border border-gray-800 bg-gray-900/60 p-6">
        <h2 className="text-sm font-medium text-gray-300 uppercase tracking-wider mb-4">
          Chat
        </h2>
        <p className="text-sm text-gray-500">
          Index a repository first to start asking questions.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-gray-800 bg-gray-900/60 p-6">
      <h2 className="text-sm font-medium text-gray-300 uppercase tracking-wider mb-4">
        Chat with <span className="text-indigo-400">{repo.name}</span>
      </h2>

      {/* Messages */}
      <div className="space-y-4 mb-4 max-h-[500px] overflow-y-auto">
        {messages.map((msg, i) => (
          <div key={i}>
            {msg.role === 'user' ? (
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-lg bg-indigo-600/20 border border-indigo-700/50 px-4 py-3 text-sm text-indigo-100">
                  {msg.content}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="rounded-lg bg-gray-800/70 border border-gray-700 px-4 py-3 text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </div>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="px-1">
                    <p className="text-xs font-medium text-gray-500 mb-1.5">Sources</p>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.sources.map((src, j) => (
                        <span
                          key={j}
                          className="inline-flex items-center rounded-md bg-gray-800 border border-gray-700 px-2.5 py-1 text-xs text-gray-300 font-mono"
                        >
                          {src.file}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Thinking...
          </div>
        )}
      </div>

      {error && (
        <div className="mb-3 rounded-lg bg-red-900/30 border border-red-800 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleAsk} className="flex gap-3">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask something about the codebase..."
          className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
        >
          Ask
        </button>
      </form>
    </section>
  );
}
