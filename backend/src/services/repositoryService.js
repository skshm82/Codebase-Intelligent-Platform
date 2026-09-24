import simpleGit from 'simple-git';
import fs from 'fs';
import path from 'path';
import { config } from '../config.js';

/**
 * Validate that a URL looks like a public GitHub repository URL.
 */
export function validateGitHubUrl(url) {
  const pattern = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+(\.git)?$/;
  return pattern.test(url);
}

/**
 * Extract the repository name from a GitHub URL.
 * e.g. "https://github.com/user/my-repo" => "user/my-repo"
 */
export function extractRepoName(url) {
  const cleaned = url.replace(/\.git$/, '');
  const parts = cleaned.split('/');
  return `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
}

/**
 * Clone a GitHub repository into a local directory.
 * Returns the local clone path.
 */
export async function cloneRepository(url, repoId) {
  const clonePath = path.join(config.reposDir, repoId);

  // Ensure parent directory exists
  if (!fs.existsSync(config.reposDir)) {
    fs.mkdirSync(config.reposDir, { recursive: true });
  }

  // Remove existing clone if present
  if (fs.existsSync(clonePath)) {
    fs.rmSync(clonePath, { recursive: true, force: true });
  }

  const git = simpleGit();
  await git.clone(url, clonePath, ['--depth', '1']); // shallow clone for speed

  return clonePath;
}

/**
 * Recursively scan a cloned repository for supported source files.
 * Returns an array of { absolutePath, relativePath, extension }.
 */
export function scanRepository(clonePath) {
  const files = [];

  function walk(dir, relativeBase) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return; // skip unreadable directories
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.join(relativeBase, entry.name).replace(/\\/g, '/');

      if (entry.isDirectory()) {
        // Skip ignored directories
        if (config.ignoredDirectories.has(entry.name)) continue;
        walk(fullPath, relativePath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();

        // Skip unsupported file types
        if (!config.supportedExtensions.has(ext)) continue;

        // Skip lockfiles and other known noise
        const ignoredFiles = new Set([
          'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
          'composer.lock', 'Gemfile.lock', 'Cargo.lock',
          'go.sum', 'poetry.lock'
        ]);
        if (ignoredFiles.has(entry.name)) continue;

        // Skip files exceeding size limit
        try {
          const stats = fs.statSync(fullPath);
          if (stats.size > config.maxFileSize) continue;
          if (stats.size === 0) continue;
        } catch {
          continue;
        }

        files.push({
          absolutePath: fullPath,
          relativePath,
          extension: ext
        });
      }
    }
  }

  walk(clonePath, '');
  return files;
}

/**
 * Read the content of a source file as UTF-8 text.
 * Returns null if the file can't be read or appears binary.
 */
export function readFileContent(absolutePath) {
  try {
    const content = fs.readFileSync(absolutePath, 'utf-8');

    // Basic binary detection: if content contains null bytes, skip it
    if (content.includes('\0')) return null;

    return content;
  } catch {
    return null;
  }
}

/**
 * Clean up a cloned repository directory after processing.
 */
export function cleanupClone(clonePath) {
  try {
    if (fs.existsSync(clonePath)) {
      fs.rmSync(clonePath, { recursive: true, force: true });
    }
  } catch (err) {
    console.warn(`[REPO] Failed to clean up clone at ${clonePath}:`, err.message);
  }
}
