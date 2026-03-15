## CodeArchitect AI – Frontend

This directory contains the **Next.js + TypeScript** frontend for CodeArchitect AI.  
It provides the landing page, authenticated dashboard, architecture viewer, and chat UI that talks to the FastAPI backend.

For a full project overview, see the root `README.md`. This file focuses on the frontend only.

---

## Main Screens

- **Landing page (`app/page.tsx`)**
  - Hero section explaining the product
  - Authentication via Supabase (GitHub OAuth or email/password)
  - GitHub repository URL input (`RepoInput`) for authenticated users

- **Dashboard (`app/dashboard/page.tsx`)**
  - Starts repository analysis and polls the backend for status
  - Shows architecture summary and dependency nodes (`StructureViewer`)
  - Hosts the repository‑aware chat panel (`ChatInterface`)

---

## Important Components

- `components/RepoInput.tsx` – URL input and redirect to the dashboard.
- `components/AuthForm.tsx` – Supabase‑powered auth form (GitHub + email/password).
- `components/UserMenu.tsx` – Current user display and sign‑out button.
- `components/StructureViewer.tsx` – Layout and styling for architecture summary + dependency nodes.
- `components/ChatInterface.tsx` – Chat between the user and the repo‑aware AI assistant.
- `components/MermaidDiagram.tsx` – Renders Mermaid.js diagrams returned from the backend.

---

## Environment Variables

Create a `.env.local` file in `frontend/`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_public_key_here
```

These variables are required for authentication to work.

---

## Running the Frontend

From the `frontend/` directory:

```bash
npm install
npm run dev
```

The app runs at `http://localhost:3000` in development.  
Make sure the **backend** is also running so that repo analysis and chat work correctly.
