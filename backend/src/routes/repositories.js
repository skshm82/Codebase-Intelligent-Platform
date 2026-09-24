import { Router } from 'express';
import crypto from 'crypto';
import { db } from '../db.js';
import {
  validateGitHubUrl,
  extractRepoName,
  cloneRepository,
  scanRepository,
  readFileContent,
  cleanupClone
} from '../services/repositoryService.js';
import { chunkFiles } from '../services/chunkingService.js';
import { embedChunks } from '../services/embeddingService.js';

const router = Router();

/**
 * POST /api/repositories
 * Clone a public GitHub repo, chunk its code, embed, and store in pgvector.
 * This runs synchronously for the MVP.
 */
router.post('/', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'Repository URL is required.' });
  }

  if (!validateGitHubUrl(url)) {
    return res.status(400).json({ error: 'Invalid GitHub repository URL. Expected format: https://github.com/owner/repo' });
  }

  const repoId = crypto.randomUUID();
  const repoName = extractRepoName(url);
  let clonePath = null;

  try {
    // Create repository record as pending
    await db.createRepository({ id: repoId, url, name: repoName, status: 'pending' });

    // --- Step 1: Clone ---
    await db.updateRepositoryStatus(repoId, { status: 'cloning' });
    console.log(`[REPO] Cloning ${url}...`);
    clonePath = await cloneRepository(url, repoId);
    console.log(`[REPO] Cloned to ${clonePath}`);

    // --- Step 2: Scan & Chunk ---
    await db.updateRepositoryStatus(repoId, { status: 'processing' });
    const sourceFiles = scanRepository(clonePath);
    console.log(`[REPO] Found ${sourceFiles.length} source files.`);

    if (sourceFiles.length === 0) {
      await db.updateRepositoryStatus(repoId, {
        status: 'failed',
        errorMessage: 'No supported source files found in the repository.'
      });
      return res.status(400).json({
        error: 'No supported source files found in the repository.',
        repository_id: repoId
      });
    }

    // Read file contents
    const filesWithContent = sourceFiles
      .map(f => ({
        relativePath: f.relativePath,
        extension: f.extension,
        content: readFileContent(f.absolutePath)
      }))
      .filter(f => f.content !== null);

    // Chunk all files
    const chunks = chunkFiles(filesWithContent);
    console.log(`[REPO] Generated ${chunks.length} chunks from ${filesWithContent.length} files.`);

    if (chunks.length === 0) {
      await db.updateRepositoryStatus(repoId, {
        status: 'failed',
        errorMessage: 'Could not generate any code chunks from the repository.'
      });
      return res.status(400).json({
        error: 'Could not generate any code chunks.',
        repository_id: repoId
      });
    }

    // --- Step 3: Embed ---
    await db.updateRepositoryStatus(repoId, { status: 'embedding' });
    console.log(`[REPO] Generating embeddings for ${chunks.length} chunks...`);
    const embeddings = await embedChunks(chunks);

    // Attach IDs and embeddings to chunks for DB insertion
    const documentsToInsert = chunks.map((chunk, i) => ({
      id: crypto.randomUUID(),
      repository_id: repoId,
      file_path: chunk.file_path,
      language: chunk.language,
      chunk_index: chunk.chunk_index,
      content: chunk.content,
      embedding: embeddings[i]
    }));

    // --- Step 4: Store in pgvector ---
    await db.insertDocumentChunks(documentsToInsert);
    console.log(`[REPO] Stored ${documentsToInsert.length} chunks in database.`);

    // Mark as completed
    await db.updateRepositoryStatus(repoId, {
      status: 'completed',
      totalFiles: filesWithContent.length,
      totalChunks: documentsToInsert.length
    });

    // Cleanup cloned files
    cleanupClone(clonePath);

    return res.status(201).json({
      id: repoId,
      name: repoName,
      url,
      status: 'completed',
      total_files: filesWithContent.length,
      total_chunks: documentsToInsert.length
    });

  } catch (err) {
    console.error(`[REPO] Ingestion failed for ${url}:`, err.message);

    // Attempt to mark as failed
    try {
      await db.updateRepositoryStatus(repoId, {
        status: 'failed',
        errorMessage: err.message
      });
    } catch {
      // ignore DB update failure
    }

    // Cleanup
    if (clonePath) cleanupClone(clonePath);

    return res.status(500).json({
      error: 'Repository ingestion failed.',
      message: err.message,
      repository_id: repoId
    });
  }
});

/**
 * GET /api/repositories/:id
 * Get repository information and indexing status.
 */
router.get('/:id', async (req, res) => {
  try {
    const repo = await db.getRepositoryById(req.params.id);
    if (!repo) {
      return res.status(404).json({ error: 'Repository not found.' });
    }
    return res.json(repo);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch repository.', message: err.message });
  }
});

export default router;
