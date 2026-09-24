import pg from 'pg';
import pgvector from 'pgvector/pg';
import { config } from './config.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false
});

/**
 * Initialize PostgreSQL database and tables with pgvector
 */
export async function initDb() {
  const client = await pool.connect();
  try {
    // 1. Enable pgvector extension
    await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
    
    // Register pgvector types
    await pgvector.registerType(client);

    // 2. Create repositories table
    await client.query(`
      CREATE TABLE IF NOT EXISTS repositories (
        id UUID PRIMARY KEY,
        url TEXT NOT NULL,
        name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        total_files INT DEFAULT 0,
        total_chunks INT DEFAULT 0,
        error_message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 3. Create documents table with vector embedding column
    await client.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id UUID PRIMARY KEY,
        repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
        file_path TEXT NOT NULL,
        language TEXT,
        chunk_index INT NOT NULL,
        content TEXT NOT NULL,
        embedding vector(${config.embeddingDimension}),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 4. Create index on repository_id for fast filtering
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_documents_repository_id 
      ON documents (repository_id);
    `);

    console.log('[DB] PostgreSQL & pgvector schema initialized successfully.');
  } catch (error) {
    console.error('[DB] Database initialization error:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Database helper operations
 */
export const db = {
  async query(text, params) {
    return pool.query(text, params);
  },

  async createRepository({ id, url, name, status = 'pending' }) {
    const query = `
      INSERT INTO repositories (id, url, name, status)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const res = await pool.query(query, [id, url, name, status]);
    return res.rows[0];
  },

  async updateRepositoryStatus(id, { status, totalFiles, totalChunks, errorMessage = null }) {
    const fields = ['status = $2'];
    const values = [id, status];
    let idx = 3;

    if (totalFiles !== undefined) {
      fields.push(`total_files = $${idx++}`);
      values.push(totalFiles);
    }
    if (totalChunks !== undefined) {
      fields.push(`total_chunks = $${idx++}`);
      values.push(totalChunks);
    }
    if (errorMessage !== undefined) {
      fields.push(`error_message = $${idx++}`);
      values.push(errorMessage);
    }

    const query = `
      UPDATE repositories
      SET ${fields.join(', ')}
      WHERE id = $1
      RETURNING *;
    `;
    const res = await pool.query(query, values);
    return res.rows[0];
  },

  async getRepositoryById(id) {
    const res = await pool.query('SELECT * FROM repositories WHERE id = $1;', [id]);
    return res.rows[0] || null;
  },

  async deleteRepository(id) {
    await pool.query('DELETE FROM repositories WHERE id = $1;', [id]);
  },

  async insertDocumentChunks(chunks) {
    if (!chunks || chunks.length === 0) return;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const insertQuery = `
        INSERT INTO documents (id, repository_id, file_path, language, chunk_index, content, embedding)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;

      for (const chunk of chunks) {
        await client.query(insertQuery, [
          chunk.id,
          chunk.repository_id,
          chunk.file_path,
          chunk.language,
          chunk.chunk_index,
          chunk.content,
          pgvector.toSql(chunk.embedding)
        ]);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Search for top K similar chunks in a specific repository using cosine distance
   */
  async searchSimilarChunks(repositoryId, queryEmbedding, limit = 6) {
    const query = `
      SELECT 
        id,
        repository_id,
        file_path,
        language,
        chunk_index,
        content,
        1 - (embedding <=> $1) AS similarity
      FROM documents
      WHERE repository_id = $2
      ORDER BY embedding <=> $1
      LIMIT $3;
    `;

    const res = await pool.query(query, [
      pgvector.toSql(queryEmbedding),
      repositoryId,
      limit
    ]);

    return res.rows;
  }
};
