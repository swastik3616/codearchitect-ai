"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";

export default function RepoInput() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    setLoading(true);
    // Since dashboard uses the query parameter to poll, we redirect straight to dashboard
    router.push(`/dashboard?repo=${encodeURIComponent(url)}`);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
        </div>
        <input
          type="url"
          required
          placeholder="Paste GitHub Repository URL (e.g. https://github.com/facebook/react)"
          className="block w-full pl-12 pr-32 py-4 bg-white/5 border border-gray-700 rounded-2xl text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-xl backdrop-blur-sm"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={loading}
        />
        <div className="absolute inset-y-2 right-2 flex items-center">
          <button
            type="submit"
            disabled={loading || !url}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-400 text-white font-medium rounded-xl transition-all shadow-lg shadow-blue-500/25 flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Analyze"
            )}
          </button>
        </div>
      </form>
      <p className="text-center text-sm text-gray-500 mt-4">
        We'll clone, parse, and embed the repository so you can chat with it instantly.
      </p>
    </div>
  );
}
