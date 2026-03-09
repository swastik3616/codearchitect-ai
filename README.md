# CodeArchitect AI

CodeArchitect AI is an intelligent developer assistant that automatically clones, parses, and analyzes GitHub repositories. By leveraging vector embeddings and a modern AI layer, developers can ask natural language questions about complex codebases and instantly get architectural summaries and code-level answers.



## Features

- 🔍 **Repository Cloning & Caching**: Instantly clones a given GitHub URL and caches it locally (using SHA-256 caching) for faster repeated analysis. Safety triggers prevent oversized repositories from exhausting storage.
- 🧩 **Smart Code Parsing**: Intelligently chunks source code by functions/classes for languages like Python, filtering out irrelevant dependencies (`node_modules`, `dist`, etc.) and non-code files.
- 🧠 **Vector Embeddings**: Uses `sentence-transformers` (`all-MiniLM-L6-v2`) and **ChromaDB** to create and store semantic embeddings of code chunks for rapid information retrieval.
- 🤖 **AI Code Assistant**: Integrated with **OpenAI GPT-3.5** to instantly generate high-level architectural summaries and answer specific questions about the codebase context using RAG (Retrieval-Augmented Generation).
- 📊 **Dependency Graph Generation**: Automatically maps out the structural layout of the source files using `networkx`.
- ⚡ **Modern UI**: A responsive Next.js frontend built with TailwindCSS, featuring real-time polling updates, a visual component viewer, and a sleek glassmorphic chat interface.

## Tech Stack

**Frontend:**
- [Next.js](https://nextjs.org/) (React, TypeScript)
- [Tailwind CSS](https://tailwindcss.com/)
- `lucide-react` (Icons)

**Backend:**
- [FastAPI](https://fastapi.tiangolo.com/) (Python)
- `openai` (For OpenAI LLM integration)
- `chromadb` (Vector Database)
- `sentence-transformers` (Embeddings)
- `GitPython` (Repository Cloning)
- `networkx` (Dependency Mapping)

## Prerequisites

- **Node.js** (v18+)
- **Python** (v3.10+)
- **Git**
- An **OpenAI API Key**

## Local Setup

### 1. Clone the project
```bash
git clone https://github.com/yourusername/codearchitect-ai.git
cd codearchitect-ai
```

### 2. Backend Setup
Navigate to the `backend` directory, set up a virtual environment, and install the dependencies:
```bash
cd backend
python -m venv venv

# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file inside the `backend` directory:
```env
OPENAI_API_KEY=your_openai_api_key_here
CHROMA_DB_PATH=./vector_db
REPO_STORAGE_PATH=./repos
```

Start the FastAPI server:
```bash
uvicorn main:app --reload
```
The backend will run on `http://localhost:8000`.

### 3. Frontend Setup
Open a new terminal, navigate to the `frontend` directory, and install the dependencies:
```bash
cd frontend
npm install
```

Start the Next.js development server:
```bash
npm run dev
```
The frontend will run on `http://localhost:3000` (or `3001` if port 3000 is occupied).

## Usage

1. Open your browser and go to `http://localhost:3000`.
2. Paste any public GitHub repository URL into the central input field and click **Analyze**.
3. Wait as the backend clones the repo, generates embeddings, and maps the architecture.
4. Once completed, explore the high-level **Architecture Overview** and interact with the **AI Assistant Chat** to ask specific technical questions about the codebase.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
