import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config.js';

let genAI = null;

function getGenAI() {
  if (!genAI) {
    if (!config.geminiApiKey) {
      throw new Error('GEMINI_API_KEY is not set.');
    }
    genAI = new GoogleGenerativeAI(config.geminiApiKey);
  }
  return genAI;
}

/**
 * Generate an embedding vector for a single text string.
 * Returns a float array of dimension `config.embeddingDimension`.
 */
export async function embedText(text) {
  const ai = getGenAI();
  const model = ai.getGenerativeModel({ model: config.geminiEmbeddingModel });

  const result = await model.embedContent(text);
  return result.embedding.values;
}

/**
 * Generate embeddings for an array of text chunks.
 * Processes in batches to avoid API limits.
 *
 * Returns an array of float arrays (same order as input).
 */
export async function embedChunks(chunks, batchSize = 20) {
  const ai = getGenAI();
  const model = ai.getGenerativeModel({ model: config.geminiEmbeddingModel });

  const embeddings = [];

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);

    // Process batch using batchEmbedContents
    const requests = batch.map(chunk => ({
      content: { parts: [{ text: chunk.content }] }
    }));

    try {
      const result = await model.batchEmbedContents({ requests });
      for (const emb of result.embeddings) {
        embeddings.push(emb.values);
      }
    } catch (err) {
      // Fallback: embed one by one if batch fails
      console.warn(`[EMBED] Batch embed failed, falling back to individual: ${err.message}`);
      for (const chunk of batch) {
        try {
          const single = await model.embedContent(chunk.content);
          embeddings.push(single.embedding.values);
        } catch (singleErr) {
          console.error(`[EMBED] Failed to embed chunk: ${singleErr.message}`);
          // Push a zero vector to maintain alignment
          embeddings.push(new Array(config.embeddingDimension).fill(0));
        }
      }
    }

    // Small delay between batches to be respectful of rate limits
    if (i + batchSize < chunks.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  return embeddings;
}
