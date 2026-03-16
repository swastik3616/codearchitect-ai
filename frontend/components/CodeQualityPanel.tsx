"use client";
import { useState } from "react";
import { ShieldAlert, Bug, AlertTriangle, Zap, CheckCircle2, Loader2, ChevronRight } from "lucide-react";
import { api } from "@/services/api";

function parseReport(report: string) {
  const sections = [
    { key: "Security Risks", icon: ShieldAlert, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
    { key: "Potential Bugs", icon: Bug, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
    { key: "Code Smells", icon: AlertTriangle, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
    { key: "Performance Issues", icon: Zap, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
    { key: "Recommendations", icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
  ];

  const result: { key: string; icon: any; color: string; bg: string; content: string }[] = [];

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    // Match section by emoji+name or ##
    const regex = new RegExp(
      `##[^#]*${section.key}[\\s\\S]*?(?=##|$)`,
      "i"
    );
    const match = report.match(regex);
    if (match) {
      const content = match[0]
        .replace(/^##[^\n]*\n/, "") // remove header line
        .trim();
      result.push({ ...section, content });
    }
  }

  return result;
}

function SectionCard({
  icon: Icon,
  title,
  color,
  bg,
  content,
}: {
  icon: any;
  title: string;
  color: string;
  bg: string;
  content: string;
}) {
  const [open, setOpen] = useState(true);
  const lines = content.split("\n").filter((l) => l.trim());

  return (
    <div className={`rounded-xl border p-4 ${bg}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 text-left"
      >
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${color}`} />
          <span className={`font-semibold text-sm ${color}`}>{title}</span>
        </div>
        <ChevronRight className={`w-4 h-4 text-foreground/40 transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      {open && (
        <div className="mt-3 space-y-1.5 pl-6">
          {lines.map((line, i) => {
            const clean = line.replace(/^[-*]\s+/, "").trim();
            if (!clean) return null;
            return (
              <p key={i} className="text-xs text-foreground/80 leading-relaxed">
                {line.startsWith("-") || line.startsWith("*") ? (
                  <span className="flex gap-2">
                    <span className="text-foreground/30 shrink-0">•</span>
                    {clean}
                  </span>
                ) : (
                  clean
                )}
              </p>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CodeQualityPanel({ repoUrl }: { repoUrl: string }) {
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getCodeQuality(repoUrl);
      setReport(res.report);
    } catch {
      setError("Failed to generate code quality report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const sections = report ? parseReport(report) : [];
  const showRaw = report && sections.length === 0;

  return (
    <div className="flex flex-col gap-6 h-full">
      <div>
        <h2 className="text-xl font-bold mb-1 flex items-center gap-2 text-white">
          <ShieldAlert className="w-5 h-5 text-red-400" />
          Code Quality Insights
        </h2>
        <p className="text-xs text-foreground/50">
          AI-powered analysis of security risks, bugs, code smells, and performance issues.
        </p>
      </div>

      {!report && !loading && (
        <div className="flex flex-col items-center justify-center flex-1 gap-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/20 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-sm text-foreground/60 max-w-sm">
              Run a comprehensive AI code audit to identify security vulnerabilities, potential bugs,
              code smells, and performance bottlenecks.
            </p>
          </div>
          <button
            onClick={handleAnalyze}
            className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-red-500/25 text-sm"
          >
            Run Code Quality Analysis
          </button>
          {error && <p className="text-red-400 text-xs">{error}</p>}
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center flex-1 gap-4 text-foreground/50">
          <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
          <p className="text-sm">Analyzing code quality...</p>
          <p className="text-xs text-foreground/30">This may take 20–30 seconds</p>
        </div>
      )}

      {report && !loading && (
        <div className="flex-1 overflow-y-auto space-y-3">
          {sections.length > 0 ? (
            sections.map((s) => (
              <SectionCard
                key={s.key}
                icon={s.icon}
                title={s.key}
                color={s.color}
                bg={s.bg}
                content={s.content}
              />
            ))
          ) : showRaw ? (
            <pre className="text-xs font-mono text-foreground/70 bg-black/30 rounded-xl p-4 whitespace-pre-wrap">
              {report}
            </pre>
          ) : null}

          <button
            onClick={handleAnalyze}
            className="w-full mt-2 px-4 py-2.5 border border-[var(--panel-border)] hover:bg-white/5 text-foreground/60 hover:text-foreground rounded-xl text-sm transition-colors"
          >
            Re-run Analysis
          </button>
        </div>
      )}
    </div>
  );
}
