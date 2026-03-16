"use client";
import { useState } from "react";
import { Search, FileCode2, Loader2, Code2 } from "lucide-react";
import { api } from "@/services/api";

interface SearchResult {
  file: string;
  type: string;
  name: string;
  snippet: string;
}

export default function SearchPanel({ repoUrl }: { repoUrl: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await api.searchCode(repoUrl, query.trim());
      setResults(res.results || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const typeColor = (type: string) => {
    switch (type) {
      case "FunctionDef":
      case "AsyncFunctionDef":
      case "function":
        return "bg-blue-500/20 text-blue-300";
      case "ClassDef":
        return "bg-purple-500/20 text-purple-300";
      default:
        return "bg-gray-500/20 text-gray-300";
    }
  };

  const typeLabel = (type: string) => {
    if (type === "FunctionDef" || type === "AsyncFunctionDef" || type === "function") return "fn";
    if (type === "ClassDef") return "class";
    return type;
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      <div>
        <h2 className="text-xl font-bold mb-1 flex items-center gap-2 text-white">
          <Search className="w-5 h-5 text-blue-400" />
          Semantic Code Search
        </h2>
        <p className="text-xs text-foreground/50">
          Search the codebase with natural language. Results are ranked by semantic similarity.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={loading}
          placeholder='e.g. "authentication logic", "database connection", "error handler"'
          className="flex-1 bg-background border border-[var(--panel-border)] rounded-xl py-2.5 pl-4 pr-4 text-sm text-foreground placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
        />
        <button
          type="submit"
          disabled={!query.trim() || loading}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Search
        </button>
      </form>

      {/* Example queries */}
      <div className="flex flex-wrap gap-2">
        {["authentication logic", "database query", "API route handler", "error handling", "user model"].map((q) => (
          <button
            key={q}
            onClick={() => setQuery(q)}
            className="px-2.5 py-1 text-xs rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-foreground/60 hover:text-foreground transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {loading && (
          <div className="flex items-center justify-center py-12 text-foreground/50 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Searching embeddings...</span>
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <div className="text-center py-12 text-foreground/40 text-sm">
            No results found. Try a different query.
          </div>
        )}

        {!loading && results.map((result, i) => (
          <div
            key={i}
            className="rounded-xl border border-[var(--panel-border)] bg-[var(--panel)] p-4 hover:border-blue-500/40 transition-colors"
          >
            <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-xs text-blue-300 font-mono truncate max-w-[280px]">{result.file}</span>
              </div>
              <div className="flex items-center gap-2">
                {result.name && (
                  <span className="text-xs font-mono text-foreground/80 flex items-center gap-1">
                    <Code2 className="w-3 h-3 text-foreground/50" />
                    {result.name}
                  </span>
                )}
                {result.type && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-medium ${typeColor(result.type)}`}>
                    {typeLabel(result.type)}
                  </span>
                )}
              </div>
            </div>
            <pre className="text-xs font-mono text-foreground/70 bg-black/30 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {result.snippet}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}
