## CodeArchitect AI

CodeArchitect AI is an intelligent developer assistant that automatically clones, parses, and analyzes GitHub repositories. By combining local vector embeddings with an LLM, it lets you paste a repo URL and immediately:

- **See a high-level architecture summary**
- **Explore a dependency graph**
- **Chat with an AI that is grounded in the repository’s code**

---

## Features

- **Repository cloning & caching**: Clones a GitHub URL once, caches it using a SHA‑256 hash, and enforces file/size limits to avoid huge repositories.
- **Smart code parsing**: Splits code into meaningful chunks (functions, classes, blocks) for multiple languages, ignoring heavy folders like `node_modules`, `dist`, and build artifacts.
- **Vector embeddings & RAG**: Uses `sentence-transformers` (`all-MiniLM-L6-v2`) with **ChromaDB** to build a searchable vector index and answer questions via Retrieval‑Augmented Generation.
- **AI architecture assistant**: Uses an LLM to generate an abstract, technology stack, and architecture overview of the project.
- **Dependency graph visualization**: Builds a graph of files and directories (via `networkx`) that the UI can render into a visual structure.
- **Authentication & user profiles**: Supabase‑backed auth (GitHub OAuth + email/password) with basic profile storage.
- **Modern dashboard UI**: Next.js + Tailwind CSS UI with glassmorphism, status indicators, and a side‑by‑side architecture + chat experience.
- **Mermaid diagram generation**: Ask the assistant for UML / architecture diagrams and see them rendered as Mermaid charts in the chat.

---

## Architecture

- **Frontend (`frontend/`)**
  - Next.js (App Router) + TypeScript
  - Tailwind CSS for styling and theming
  - Supabase client for authentication
  - Key screens/components:
    - Landing page with GitHub repo input
    - Dashboard showing architecture summary and dependency nodes (`StructureViewer`)
    - Repository‑aware chat (`ChatInterface`) with Mermaid diagram rendering

- **Backend (`backend/`)**
  - FastAPI service exposing:
    - `POST /analyze-repo`: clone + parse + embed + summarize
    - `GET /analyze-status/{task_id}`: poll long‑running analysis
    - `POST /ask-question`: RAG‑style Q&A over the stored embeddings
  - Services:
    - `repo_service.py`: cloning, caching, and basic repo sanity checks
    - `code_parser.py`: file discovery and chunking
    - `graph_service.py`: dependency graph generation
    - `embeddings/embedder.py`: embedding + ChromaDB storage
    - `agents/qa_agent.py`: prompts for summaries and question answering

---
## Tech Stack

**Frontend**
- [Next.js](https://nextjs.org/) (React, TypeScript)
- [Tailwind CSS](https://tailwindcss.com/)
- [`lucide-react`](https://lucide.dev/) (icons)
- [Supabase JS client](https://supabase.com/) (auth & user data)

**Backend**
- [FastAPI](https://fastapi.tiangolo.com/) (Python)
- [`openai`](https://github.com/openai/openai-python) (or compatible Gemini endpoint) for LLM calls
- [`chromadb`](https://www.trychroma.com/) (vector database)
- [`sentence-transformers`](https://www.sbert.net/) for embeddings
- [`GitPython`](https://gitpython.readthedocs.io/) for repository cloning
- [`networkx`](https://networkx.org/) for dependency mapping

---

## Prerequisites

- **Node.js** v18+
- **Python** v3.10+
- **Git**
- An **LLM API key**:
  - `GEMINI_API_KEY` **or**
  - `OPENAI_API_KEY`

---

## Backend Setup

From the project root:

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file in `backend/`:

```env
GEMINI_API_KEY=your_gemini_api_key_here   # optional, preferred if set
OPENAI_API_KEY=your_openai_api_key_here  # fallback if GEMINI_API_KEY is not set
CHROMA_DB_PATH=./vector_db
REPO_STORAGE_PATH=./repos
```

Run the FastAPI server:

```bash
uvicorn main:app --reload
```

Backend will be available at `http://localhost:8000`.

---

## Frontend Setup

From the project root:

```bash
cd frontend
npm install
```

Create `.env.local` in `frontend/` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_public_key_here
```

Start the Next.js dev server:

```bash
npm run dev
```

Frontend will be available at `http://localhost:3000`.

---

## Usage Flow

1. Visit `http://localhost:3000` in your browser.
2. Sign in (GitHub OAuth or email/password via Supabase).
3. Paste a public GitHub repository URL into the input field and click **Analyze**.
4. Watch the dashboard update as the backend:
   - Clones and parses the repository,
   - Generates embeddings and stores them in Chroma,
   - Produces an architecture summary and dependency graph.
5. Once analysis is complete:
   - Review the **Architecture Overview** in the left pane.
   - Explore the **Dependency Map** nodes.
   - Use the **chat** on the right to ask repository‑specific questions (implementation details, file presence, flows, etc.).

---

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
