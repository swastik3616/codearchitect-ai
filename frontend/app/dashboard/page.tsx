"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/services/api";
import { supabase } from "@/utils/supabase/client";
import { Loader2, CheckCircle2, AlertCircle, ArrowLeft, LayoutDashboard, Search, ShieldAlert } from "lucide-react";
import StructureViewer from "@/components/StructureViewer";
import ChatInterface from "@/components/ChatInterface";
import SearchPanel from "@/components/SearchPanel";
import CodeQualityPanel from "@/components/CodeQualityPanel";
import { toast } from "sonner";

type TabId = "architecture" | "search" | "quality";

const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: "architecture", label: "Architecture", icon: LayoutDashboard },
  { id: "search", label: "Code Search", icon: Search },
  { id: "quality", label: "Code Quality", icon: ShieldAlert },
];

function StatusBadge({ status, chunks }: { status: string; chunks: any }) {
  const labels: Record<string, string> = {
    pending: "Pending...",
    cloning: "Cloning repository...",
    parsing: "Parsing files...",
    embedding: "Generating embeddings...",
    generating_architecture: "Generating analysis...",
    using_cache: "Loading from cache...",
    completed: `Analysis complete${typeof chunks === "number" ? ` · ${chunks} chunks` : chunks === "cached" ? " · cached" : ""}`,
    failed: "Analysis failed",
  };
  return <span>{labels[status] ?? status.replace("_", " ")}</span>;
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const repoUrl = searchParams.get("repo");
  const router = useRouter();

  const [taskId, setTaskId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("initializing");
  const [error, setError] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabId>("architecture");

  useEffect(() => {
    if (!repoUrl) {
      router.push("/");
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/");
        return;
      }
      startAnalysis();
    });

    const startAnalysis = async () => {
      try {
        const res = await api.analyzeRepo(repoUrl);
        setTaskId(res.task_id);
      } catch (err: any) {
        setError(err.message || "Failed to start analysis");
        setStatus("failed");
      }
    };
  }, [repoUrl, router]);

  useEffect(() => {
    if (!taskId) return;

    const interval = setInterval(async () => {
      try {
        const res = await api.pollStatus(taskId);
        setStatus(res.status);

        if (res.status === "completed") {
          setAnalysisData(res);
          toast.success(res.chunks_processed === "cached" ? "Loaded from cache!" : "Analysis complete!");
          clearInterval(interval);
        } else if (res.status === "failed") {
          setError(res.error || "Analysis failed");
          clearInterval(interval);
        }
      } catch (err: any) {
        if (err.message.includes("404") || err.message.includes("Task not found")) {
          setError("Analysis task not found. The server may have restarted.");
          setStatus("failed");
          clearInterval(interval);
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [taskId]);

  // ── Error state ──────────────────────────────────────────────────────────────
  if (status === "failed") {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none animate-blob" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-600/20 blur-[120px] rounded-full pointer-events-none animate-blob" style={{ animationDelay: "2s" }} />
        <AlertCircle className="w-16 h-16 text-red-500 mb-4 relative z-10" />
        <h1 className="text-2xl font-bold mb-2 relative z-10">Analysis Failed</h1>
        <p className="text-foreground/70 max-w-lg text-center relative z-10">{error}</p>
        <button
          onClick={() => router.push("/")}
          className="mt-8 px-6 py-2 bg-[var(--panel)] border border-[var(--panel-border)] hover:bg-[var(--panel-border)] rounded-xl transition-colors relative z-10"
        >
          Go Back
        </button>
      </div>
    );
  }

  // ── Loading state ─────────────────────────────────────────────────────────────
  if (status !== "completed") {
    const steps = ["cloning", "parsing", "embedding", "generating_architecture", "using_cache"];
    const currentStep = steps.indexOf(status);
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-500/5 blur-[120px] rounded-full animate-pulse" />
        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin relative z-10" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2 capitalize">
              <StatusBadge status={status} chunks={null} />
            </h1>
            <p className="text-foreground/50 text-sm">This may take up to 2 minutes depending on repository size.</p>
          </div>
          {/* Step indicator */}
          <div className="flex items-center gap-2">
            {["Clone", "Parse", "Embed", "Analyze"].map((label, idx) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full transition-colors ${idx <= currentStep ? "bg-blue-500" : "bg-white/10"}`} />
                <span className={`text-xs ${idx <= currentStep ? "text-blue-400" : "text-foreground/30"}`}>{label}</span>
                {idx < 3 && <div className={`w-8 h-px ${idx < currentStep ? "bg-blue-500" : "bg-white/10"}`} />}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Main dashboard ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col p-4 md:p-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Top bar */}
      <div className="relative z-10 w-full max-w-7xl mx-auto mb-5 flex items-center justify-between flex-wrap gap-3">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-foreground/60 hover:text-foreground transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Analyze Another
        </button>
        <div className="flex items-center gap-3">
          <span className="text-xs text-foreground/40 font-mono truncate max-w-[300px]">{repoUrl}</span>
          <div className="flex items-center gap-2 text-green-400 bg-green-400/10 px-3 py-1.5 rounded-full text-xs font-medium border border-green-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <StatusBadge status={status} chunks={analysisData?.chunks_processed} />
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="relative z-10 w-full max-w-7xl mx-auto mb-5">
        <div className="flex items-center gap-1 bg-[var(--panel)] border border-[var(--panel-border)] rounded-xl p-1 w-fit">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-foreground/60 hover:text-foreground hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main grid */}
      <div className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-5 flex-1 min-h-0" style={{ height: "calc(100vh - 180px)" }}>
        {/* Left panel — tab content */}
        <div className="col-span-1 lg:col-span-2 h-full overflow-hidden bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl p-6 shadow-xl backdrop-blur-md overflow-y-auto">
          {activeTab === "architecture" && (
            <StructureViewer summary={analysisData?.summary} graph={analysisData?.graph} />
          )}
          {activeTab === "search" && (
            <SearchPanel repoUrl={repoUrl!} />
          )}
          {activeTab === "quality" && (
            <CodeQualityPanel repoUrl={repoUrl!} />
          )}
        </div>

        {/* Right panel — always AI chat */}
        <div className="col-span-1 h-full flex flex-col shadow-2xl bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl overflow-hidden backdrop-blur-md">
          <ChatInterface repoUrl={repoUrl!} />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-blue-500/5 blur-[120px] rounded-full animate-pulse" />
          <Loader2 className="w-16 h-16 text-blue-500 animate-spin relative z-10" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
