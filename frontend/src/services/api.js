const API_BASE = '/api';

/**
 * Index a GitHub repository.
 */
export async function indexRepository(url) {
  const res = await fetch(`${API_BASE}/repositories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || data.message || 'Failed to index repository.');
  }
  return data;
}

/**
 * Get repository info by ID.
 */
export async function getRepository(id) {
  const res = await fetch(`${API_BASE}/repositories/${id}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch repository.');
  }
  return data;
}

/**
 * Ask a question about an indexed repository.
 */
export async function askQuestion(repositoryId, question) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repository_id: repositoryId, question }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || data.message || 'Failed to get answer.');
  }
  return data;
}

/**
 * Health check.
 */
export async function healthCheck() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}
