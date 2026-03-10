import { useState } from "react";
import { X, Calendar, Clock, Filter } from "lucide-react";

interface HistoryItem {
  id: string;
  repoName: string;
  date: string;
  status: "completed" | "failed";
}

// Mock data
const mockHistory: HistoryItem[] = [
  { id: "1", repoName: "facebook/react", date: new Date().toISOString(), status: "completed" },
  { id: "2", repoName: "vercel/next.js", date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), status: "completed" },
  { id: "3", repoName: "tailwindlabs/tailwindcss", date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), status: "failed" },
  { id: "4", repoName: "supabse/supabase", date: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(), status: "completed" },
  { id: "5", repoName: "microsoft/typescript", date: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(), status: "completed" },
];

export default function HistoryModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [filter, setFilter] = useState<"all" | "10days" | "1month" | "3months" | "custom">("all");

  if (!isOpen) return null;

  const getFilteredHistory = () => {
    const now = new Date();
    return mockHistory.filter((item) => {
      const itemDate = new Date(item.date);
      const diffTime = Math.abs(now.getTime() - itemDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (filter === "10days") return diffDays <= 10;
      if (filter === "1month") return diffDays <= 30;
      if (filter === "3months") return diffDays <= 90;
      return true; // all & custom fallback
    });
  };

  const filteredHistory = getFilteredHistory();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-background border border-[var(--panel-border)] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--panel-border)] bg-[var(--panel)]">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-500" />
            <h2 className="text-xl font-semibold text-foreground">Extraction History</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-foreground/50 hover:text-foreground hover:bg-foreground/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-[var(--panel-border)] bg-background flex items-center gap-4 overflow-x-auto">
          <div className="flex items-center gap-2 text-sm text-foreground/70 font-medium mr-2 shrink-0">
            <Filter className="w-4 h-4" /> Filter by:
          </div>
          {(["all", "10days", "1month", "3months", "custom"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filter === f 
                ? "bg-purple-600 text-white" 
                : "bg-[var(--panel)] text-foreground/70 hover:bg-foreground/10 hover:text-foreground"
              }`}
            >
              {f === "all" ? "All Time" :
               f === "10days" ? "0-10 Days" :
               f === "1month" ? "1 Month" :
               f === "3months" ? "3 Months" : "Custom Date"}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="p-2 max-h-[60vh] overflow-y-auto">
          {filteredHistory.length > 0 ? (
            <div className="space-y-2">
              {filteredHistory.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 rounded-xl bg-[var(--panel)] hover:bg-foreground/5 transition-colors border border-transparent hover:border-[var(--panel-border)] group">
                  <div>
                    <h3 className="text-foreground font-medium group-hover:text-purple-500 transition-colors uppercase tracking-wider text-sm">{item.repoName}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-foreground/50">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      item.status === 'completed' 
                      ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-gray-500">
              <Clock className="w-12 h-12 mb-4 opacity-20" />
              <p>No extractions found for this period.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
