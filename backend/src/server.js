import express from 'express';
import cors from 'cors';
import { config, validateConfig } from './config.js';
import { initDb, pool } from './db.js';
import repositoriesRouter from './routes/repositories.js';
import chatRouter from './routes/chat.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', database: 'disconnected', message: err.message });
  }
});

// Routes
app.use('/api/repositories', repositoriesRouter);
app.use('/api/chat', chatRouter);

// Global error handler
app.use((err, req, res, _next) => {
  console.error('[SERVER] Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

// Start server
async function start() {
  validateConfig();

  try {
    await initDb();
    console.log('[SERVER] Database initialized.');
  } catch (err) {
    console.error('[SERVER] Failed to initialize database:', err.message);
    process.exit(1);
  }

  app.listen(config.port, () => {
    console.log(`[SERVER] Codebase Intelligence backend running on http://localhost:${config.port}`);
  });
}

start();
