# Codebase Intelligence Platform

A simple RAG (Retrieval-Augmented Generation) application that lets you index public GitHub repositories and ask questions about the codebase using natural language.

## Features

- **Repository Indexing** — Provide a GitHub URL and the system clones, scans, chunks, and embeds the source code
- **Intelligent Q&A** — Ask questions about any indexed codebase and get grounded answers with file path citations
- **Vector Search** — Uses PostgreSQL + pgvector for fast semantic similarity search
- **Gemini Powered** — Uses Google Gemini for both embeddings and answer generation

## Architecture

```
User (React Frontend)
    │
    ▼
Express.js Backend API
    │
    ├── POST /api/repositories → Clone → Scan → Chunk → Embed → Store
    │
    ├── POST /api/chat → Embed Question → Vector Search → LLM Answer
    │
    └── PostgreSQL + pgvector (embeddings storage & similarity search)
```

### RAG Pipeline

```
GitHub Repository URL
        │
        ▼
  Clone (simple-git, shallow)
        │
        ▼
  Scan source files (filter by extension, ignore node_modules, .git, etc.)
        │
        ▼
  Chunk code (~2400 chars/chunk with 300 char overlap)
        │
        ▼
  Generate embeddings (Gemini text-embedding-004, 768 dimensions)
        │
        ▼
  Store chunks + vectors in PostgreSQL/pgvector
        │
        ▼
  User asks a question
        │
        ▼
  Embed the question (same Gemini model)
        │
        ▼
  Cosine similarity search (pgvector <=> operator)
        │
        ▼
  Retrieve top 6 relevant code chunks
        │
        ▼
  Send question + retrieved context to Gemini LLM
        │
        ▼
  Return answer + source file paths
```

## Tech Stack

| Layer      | Technology                    |
|------------|-------------------------------|
| Frontend   | React, JavaScript, Vite, Tailwind CSS v4 |
| Backend    | Node.js, Express.js, ES modules |
| Database   | PostgreSQL + pgvector         |
| Embeddings | Gemini text-embedding-004     |
| LLM        | Gemini 1.5 Flash (configurable) |
| Git        | simple-git                    |

## Prerequisites

- **Node.js** v18 or higher
- **PostgreSQL** v14+ with the **pgvector** extension installed
- **Google Gemini API key** — [Get one here](https://aistudio.google.com/app/apikey)

## Setup

### 1. PostgreSQL + pgvector

Make sure PostgreSQL is running and pgvector is installed:

```sql
-- Connect to your database and enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;
```

If pgvector is not installed, follow the [pgvector installation guide](https://github.com/pgvector/pgvector#installation).

Create the database:

```sql
CREATE DATABASE codebase_intelligence;
```

> The backend will automatically create the required tables (`repositories`, `documents`) on startup.

### 2. Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create an API key
3. Copy it for the next step

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create your .env file from the example
cp .env.example .env

# Edit .env and set your values:
# DATABASE_URL=postgresql://postgres:your_password@localhost:5432/codebase_intelligence
# GEMINI_API_KEY=your_actual_api_key
```

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install
```

## Running the Application

### Start the backend (port 5000)

```bash
cd backend
npm run dev
```

You should see:

```
[DB] PostgreSQL & pgvector schema initialized successfully.
[SERVER] Codebase Intelligence backend running on http://localhost:5000
```

### Start the frontend (port 5173)

```bash
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

> The frontend Vite dev server proxies `/api/*` requests to the backend at `localhost:5000`, so no CORS issues during development.

## Usage

1. **Enter a GitHub URL** — e.g., `https://github.com/expressjs/express`
2. **Click "Index Repository"** — wait for cloning, processing, and embedding to complete
3. **Ask questions** — type a question about the codebase and click "Ask"

## Example Questions

Once a repository is indexed, try:

- "Where is the entry point of the application?"
- "How does routing work?"
- "Where is authentication implemented?"
- "What are the main API endpoints?"
- "Where is the database connection configured?"
- "Explain how middleware is used."
- "What does the main function do?"

## API Endpoints

| Method | Endpoint                   | Description                          |
|--------|----------------------------|--------------------------------------|
| GET    | `/api/health`              | Health check + DB connectivity       |
| POST   | `/api/repositories`        | Index a GitHub repository            |
| GET    | `/api/repositories/:id`    | Get repository status and info       |
| POST   | `/api/chat`                | Ask a question about a repository    |

### POST /api/repositories

```json
{
  "url": "https://github.com/owner/repo"
}
```

### POST /api/chat

```json
{
  "repository_id": "uuid-of-indexed-repo",
  "question": "Where is authentication implemented?"
}
```

Response:

```json
{
  "repository_id": "...",
  "question": "Where is authentication implemented?",
  "answer": "Authentication is handled in...",
  "sources": [
    { "file": "src/auth/auth.service.ts", "chunk": 2, "similarity": 0.8432 },
    { "file": "src/middleware/auth.ts", "chunk": 1, "similarity": 0.8109 }
  ]
}
```

## Environment Variables

### Backend (`backend/.env`)

| Variable                | Description                    | Default                 |
|-------------------------|--------------------------------|-------------------------|
| `PORT`                  | Server port                    | `5000`                  |
| `DATABASE_URL`          | PostgreSQL connection string   | _(required)_            |
| `GEMINI_API_KEY`        | Google Gemini API key          | _(required)_            |
| `GEMINI_MODEL`          | LLM model for generation      | `gemini-1.5-flash`      |
| `GEMINI_EMBEDDING_MODEL`| Embedding model                | `text-embedding-004`    |
| `EMBEDDING_DIMENSION`   | Vector dimension               | `768`                   |

### Frontend (`frontend/.env`)

| Variable       | Description         | Default                   |
|----------------|---------------------|---------------------------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:5000`   |

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── server.js              # Express app & startup
│   │   ├── config.js              # Environment config
│   │   ├── db.js                  # PostgreSQL pool & schema
│   │   ├── routes/
│   │   │   ├── repositories.js    # Repository ingestion endpoints
│   │   │   └── chat.js            # RAG chat endpoint
│   │   └── services/
│   │       ├── repositoryService.js  # Git clone & file scanning
│   │       ├── chunkingService.js    # Code chunking
│   │       ├── embeddingService.js   # Gemini embeddings
│   │       └── ragService.js         # Vector search + LLM answers
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── RepoSection.jsx
│   │   │   └── ChatSection.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── README.md
└── .gitignore
```

## License

MIT
