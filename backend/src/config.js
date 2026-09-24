import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/codebase_intelligence',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  geminiEmbeddingModel: process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004',
  
  // text-embedding-004 produces 768-dimensional vectors
  embeddingDimension: parseInt(process.env.EMBEDDING_DIMENSION || '768', 10),
  
  // Directory where repositories will be temporarily cloned
  reposDir: path.resolve(process.cwd(), '.repos'),
  
  // Supported source code file extensions
  supportedExtensions: new Set([
    '.py', '.js', '.jsx', '.ts', '.tsx',
    '.java', '.cpp', '.c', '.h', '.cs',
    '.go', '.rs', '.php', '.html', '.css',
    '.sql', '.md'
  ]),
  
  // Directories to ignore during repository scanning
  ignoredDirectories: new Set([
    '.git', 'node_modules', 'venv', '.venv', 'env', '__pycache__',
    'dist', 'build', '.next', 'coverage', '.cache', 'target', 'bin', 'obj'
  ]),

  // Maximum file size to scan (e.g. 1MB)
  maxFileSize: 1024 * 1024,

  // Chunking parameters (~500-1000 tokens ≈ 2000-3500 chars with overlap)
  chunkSizeChars: 2400,
  chunkOverlapChars: 300
};

export function validateConfig() {
  const missing = [];
  if (!config.geminiApiKey) {
    missing.push('GEMINI_API_KEY');
  }
  if (!config.databaseUrl) {
    missing.push('DATABASE_URL');
  }

  if (missing.length > 0) {
    console.warn(`[WARN] Missing environment variables: ${missing.join(', ')}. Please configure them in your .env file.`);
  }
}
