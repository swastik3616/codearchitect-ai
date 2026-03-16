# CodeArchitect AI

**CodeArchitect AI** is an AI-powered repository intelligence platform that clones, indexes, and understands any GitHub repository — giving you instant architecture analysis, semantic code search, interactive diagrams, and code quality insights.

---

## ✨ Features

| Feature | Description |
|---|---|
| **Intelligent Architecture Analysis** | Generates a structured overview: Abstract, Core Technologies, Main Components, and Architecture Style |
| **Repository Structure Awareness** | Chat always has the full directory tree — ask if any file or folder exists |
| **Explain Any File** | Ask the AI to explain any file's purpose, functions, dependencies, and architectural role |
| **Mermaid Diagram Generation** | Ask for architecture / flow / component diagrams and get rendered Mermaid charts |
| **Diagram Export** | Download diagrams as SVG, PNG (2× retina), or `.mermaid` source |
| **Semantic Code Search** | Natural language search over vector-indexed code chunks |
| **Intelligent Indexing** | Skips `node_modules`, `.venv`, `__pycache__`, `.next`, etc. Caps at 1500 files / 200 KB per file |
| **Repository Caching** | Re-uses existing ChromaDB embeddings for previously analyzed repos (instant load) |
| **AI Code Quality Insights** | Scans for security risks, bugs, code smells, and performance issues |
| **Markdown Chat** | AI responses render headings, bold, inline code, code blocks, and lists |

---

## 🏗 Architecture

```
frontend/          (Next.js + TypeScript + Tailwind)
  app/
    page.tsx           ← Landing & auth
    dashboard/page.tsx ← 3-tab dashboard (Architecture, Code Search, Code Quality)
  components/
    ChatInterface.tsx      ← Markdown-aware RAG chat
    StructureViewer.tsx    ← Structured architecture sections + dependency map
    MermaidDiagram.tsx     ← Diagram renderer + SVG/PNG/.mermaid export
    SearchPanel.tsx        ← Semantic code search UI
    CodeQualityPanel.tsx   ← AI code quality report
  services/api.ts          ← All backend API calls

backend/           (FastAPI + Python)
  main.py               ← FastAPI app entry point
  api/routes.py         ← All HTTP endpoints
  parsers/code_parser.py    ← Multi-language chunking (function/class/block level)
  services/
    repo_service.py     ← Clone, cache, tree generation, file access
    graph_service.py    ← Dependency graph (networkx)
  agents/qa_agent.py    ← LLM prompts: summary, QA, explain, search, quality
  embeddings/embedder.py ← sentence-transformers + ChromaDB
```

### API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/analyze-repo` | Clone + parse + embed + summarize (async) |
| `GET` | `/analyze-status/{task_id}` | Poll analysis progress |
| `POST` | `/ask-question` | RAG chat with full repo tree context |
| `POST` | `/explain-file` | Deep explanation of a specific file |
| `POST` | `/search` | Semantic code search |
| `POST` | `/code-quality` | AI code quality audit |

---

## 🛠 Tech Stack

**Frontend**
- [Next.js](https://nextjs.org/) (App Router, TypeScript)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Mermaid](https://mermaid.js.org/) for diagram rendering
- [Supabase JS](https://supabase.com/) for auth
- [Lucide React](https://lucide.dev/) for icons

**Backend**
- [FastAPI](https://fastapi.tiangolo.com/) (Python)
- [`openai`](https://github.com/openai/openai-python) SDK (Gemini or OpenAI-compatible)
- [ChromaDB](https://www.trychroma.com/) — persistent vector database
- [`sentence-transformers`](https://www.sbert.net/) — `all-MiniLM-L6-v2` local embeddings
- [GitPython](https://gitpython.readthedocs.io/) — repository cloning
- [NetworkX](https://networkx.org/) — dependency graph

---

## ⚙️ Prerequisites

- **Node.js** v18+
- **Python** v3.10+
- **Git**
- An LLM API key: `GEMINI_API_KEY` *(preferred)* **or** `OPENAI_API_KEY`
- A [Supabase](https://supabase.com/) project (for authentication)

---

## 🚀 Backend Setup

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create `backend/.env`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here   # fallback if GEMINI_API_KEY not set
CHROMA_DB_PATH=./vector_db
REPO_STORAGE_PATH=./repos
```

Start the server:

```bash
uvicorn main:app --reload
# → http://localhost:8000
```

---

## 🖥 Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Start the dev server:

```bash
npm run dev
# → http://localhost:3000
```

---

## 📖 Usage

1. Visit `http://localhost:3000` and sign in.
2. Paste any public GitHub repository URL and click **Analyze**.
3. Watch the progress indicator (Clone → Parse → Embed → Analyze).
4. Once complete, explore the three tabs:

   | Tab | What you can do |
   |---|---|
   | **Architecture** | Read the AI-generated Abstract, Tech Stack, Components, and Architecture Style. Browse the Dependency Map. |
   | **Code Search** | Type a natural language query (e.g. *"authentication logic"*) and get semantically ranked code results. |
   | **Code Quality** | Run an AI audit for security risks, bugs, code smells, and performance issues. |

5. Use the **chat** (always visible on the right) to ask any question:
   - *"Is there a `package.json`?"*
   - *"Explain `repo_service.py`"*
   - *"Show me the system architecture diagram"*
   - *"Where is user authentication handled?"*

---

## License

MIT — see `LICENSE` for details.
