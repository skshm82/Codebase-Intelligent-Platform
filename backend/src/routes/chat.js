import { Router } from 'express';
import { db } from '../db.js';
import { askQuestion } from '../services/ragService.js';

const router = Router();

/**
 * POST /api/chat
 * Ask a question about an indexed repository.
 * Body: { repository_id, question }
 */
router.post('/', async (req, res) => {
  const { repository_id, question } = req.body;

  // Validate inputs
  if (!repository_id) {
    return res.status(400).json({ error: 'repository_id is required.' });
  }
  if (!question || question.trim().length === 0) {
    return res.status(400).json({ error: 'question is required.' });
  }

  try {
    // Check that the repository exists
    const repo = await db.getRepositoryById(repository_id);
    if (!repo) {
      return res.status(404).json({ error: 'Repository not found.' });
    }

    // Check that indexing is complete
    if (repo.status !== 'completed') {
      return res.status(400).json({
        error: `Repository is not ready for queries. Current status: ${repo.status}`,
        status: repo.status
      });
    }

    // Run RAG pipeline
    const result = await askQuestion(repository_id, question.trim());

    return res.json({
      repository_id,
      question: question.trim(),
      answer: result.answer,
      sources: result.sources
    });

  } catch (err) {
    console.error('[CHAT] Error:', err.message);
    return res.status(500).json({
      error: 'Failed to generate answer.',
      message: err.message
    });
  }
});

export default router;
