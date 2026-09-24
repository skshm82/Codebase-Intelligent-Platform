import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config.js';
import { db } from '../db.js';
import { embedText } from './embeddingService.js';

let genAI = null;

function getGenAI() {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(config.geminiApiKey);
  }
  return genAI;
}

const SYSTEM_PROMPT = `You are a codebase assistant.

Answer the user's question using only the provided repository context.

If the provided context does not contain enough information to answer the question, say that you do not have enough information. Do not invent files, functions, classes, or behavior.

When referring to code, always mention the relevant file path.

Explain the answer clearly and concisely.`;

/**
 * Build the context prompt from retrieved chunks.
 */
function buildContextPrompt(question, chunks) {
  let context = 'Repository Context:\n\n';

  for (const chunk of chunks) {
    context += `--- File: ${chunk.file_path} (chunk ${chunk.chunk_index}) ---\n`;
    context += chunk.content;
    context += '\n\n';
  }

  context += `---\n\nUser Question: ${question}`;

  return context;
}

/**
 * Main RAG pipeline:
 * 1. Embed the user's question
 * 2. Search for similar chunks in pgvector
 * 3. Build a grounded prompt
 * 4. Send to Gemini for answer generation
 * 5. Return answer + source references
 */
export async function askQuestion(repositoryId, question) {
  // 1. Generate embedding for the question
  const questionEmbedding = await embedText(question);

  // 2. Search for similar code chunks (top 6)
  const chunks = await db.searchSimilarChunks(repositoryId, questionEmbedding, 6);

  if (!chunks || chunks.length === 0) {
    return {
      answer: 'I could not find any relevant code in the indexed repository to answer your question.',
      sources: []
    };
  }

  // 3. Build prompt with retrieved context
  const contextPrompt = buildContextPrompt(question, chunks);

  // 4. Call Gemini LLM
  const ai = getGenAI();
  const model = ai.getGenerativeModel({
    model: config.geminiModel,
    systemInstruction: SYSTEM_PROMPT
  });

  const result = await model.generateContent(contextPrompt);
  const answer = result.response.text();

  // 5. Extract unique source file references
  const seenFiles = new Set();
  const sources = [];
  for (const chunk of chunks) {
    const key = `${chunk.file_path}:${chunk.chunk_index}`;
    if (!seenFiles.has(key)) {
      seenFiles.add(key);
      sources.push({
        file: chunk.file_path,
        chunk: chunk.chunk_index,
        similarity: parseFloat(parseFloat(chunk.similarity).toFixed(4))
      });
    }
  }

  return { answer, sources };
}
