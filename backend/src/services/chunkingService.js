import { config } from '../config.js';

/**
 * Map file extension to a human-readable language name.
 */
function extensionToLanguage(ext) {
  const map = {
    '.py': 'python',
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.java': 'java',
    '.cpp': 'cpp',
    '.c': 'c',
    '.h': 'c',
    '.cs': 'csharp',
    '.go': 'go',
    '.rs': 'rust',
    '.php': 'php',
    '.html': 'html',
    '.css': 'css',
    '.sql': 'sql',
    '.md': 'markdown'
  };
  return map[ext] || 'text';
}

/**
 * Split a file's content into overlapping chunks of approximately
 * `chunkSizeChars` characters, with `chunkOverlapChars` overlap.
 *
 * Each chunk retains its file path and language metadata.
 *
 * Returns an array of chunk objects:
 * { file_path, language, chunk_index, content }
 */
export function chunkFile(content, filePath, extension) {
  const language = extensionToLanguage(extension);
  const { chunkSizeChars, chunkOverlapChars } = config;
  const chunks = [];

  // For small files, return as a single chunk
  if (content.length <= chunkSizeChars) {
    chunks.push({
      file_path: filePath,
      language,
      chunk_index: 0,
      content: content.trim()
    });
    return chunks;
  }

  // Sliding window chunking
  let start = 0;
  let chunkIndex = 0;

  while (start < content.length) {
    let end = start + chunkSizeChars;

    // If we're not at the very end, try to break on a newline
    // to avoid splitting mid-line
    if (end < content.length) {
      const newlinePos = content.lastIndexOf('\n', end);
      if (newlinePos > start + chunkSizeChars * 0.5) {
        end = newlinePos + 1;
      }
    } else {
      end = content.length;
    }

    const chunkContent = content.slice(start, end).trim();

    if (chunkContent.length > 0) {
      chunks.push({
        file_path: filePath,
        language,
        chunk_index: chunkIndex,
        content: chunkContent
      });
      chunkIndex++;
    }

    // Advance by chunk size minus overlap
    start = end - chunkOverlapChars;

    // Safety: ensure we always advance
    if (start <= (end - chunkSizeChars) + chunkOverlapChars && end >= content.length) {
      break;
    }
  }

  return chunks;
}

/**
 * Chunk multiple files at once.
 * files: array of { relativePath, content, extension }
 * Returns flat array of all chunks.
 */
export function chunkFiles(files) {
  const allChunks = [];

  for (const file of files) {
    if (!file.content || file.content.trim().length === 0) continue;

    const chunks = chunkFile(file.content, file.relativePath, file.extension);
    allChunks.push(...chunks);
  }

  return allChunks;
}
