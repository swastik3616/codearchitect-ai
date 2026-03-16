"use client";
import { Folder, FileCode2, Network, Cpu, Layers, Box } from "lucide-react";

interface StructureViewerProps {
  summary: string;
  graph: {
    nodes: any[];
    edges: any[];
  };
}

const SECTION_CONFIG: Record<string, { icon: any; color: string; borderColor: string }> = {
  "Abstract": { icon: Box, color: "text-blue-400", borderColor: "border-blue-500/30" },
  "Core Technologies": { icon: Cpu, color: "text-purple-400", borderColor: "border-purple-500/30" },
  "Main System Components": { icon: Layers, color: "text-green-400", borderColor: "border-green-500/30" },
  "Architecture Style": { icon: Network, color: "text-orange-400", borderColor: "border-orange-500/30" },
};

function parseSections(summary: string): { title: string; content: string }[] {
  const sections: { title: string; content: string }[] = [];
  const lines = summary.split("\n");
  let currentTitle = "";
  let currentContent: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(.*)/);
    if (headingMatch) {
      if (currentTitle || currentContent.length) {
        sections.push({ title: currentTitle, content: currentContent.join("\n").trim() });
      }
      currentTitle = headingMatch[1].replace(/[🔒🐛⚡✅🏗️]/g, "").trim();
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }
  if (currentTitle || currentContent.length) {
    sections.push({ title: currentTitle, content: currentContent.join("\n").trim() });
  }
  return sections.filter((s) => s.content.length > 0);
}

function renderContent(content: string) {
  const lines = content.split("\n");
  return lines.map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return null;

    const isBullet = trimmed.startsWith("-") || trimmed.startsWith("*");
    const text = isBullet ? trimmed.replace(/^[-*]\s+/, "") : trimmed;

    // Render inline code
    const parts = text.split(/(`[^`]+`)/g);
    const inlined = parts.map((p, j) =>
      p.startsWith("`") && p.endsWith("`") ? (
        <code key={j} className="px-1 rounded bg-white/10 text-blue-300 text-xs font-mono">
          {p.slice(1, -1)}
        </code>
      ) : (
        <span key={j}>{p}</span>
      )
    );

    if (isBullet) {
      return (
        <li key={i} className="flex gap-2 text-sm text-gray-300 leading-relaxed">
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-current shrink-0 opacity-60" />
          <span>{inlined}</span>
        </li>
      );
    }
    return (
      <p key={i} className="text-sm text-gray-300 leading-relaxed">
        {inlined}
      </p>
    );
  }).filter(Boolean);
}

function SummarySection({ title, content }: { title: string; content: string }) {
  const config = SECTION_CONFIG[title] || { icon: Box, color: "text-gray-400", borderColor: "border-gray-500/30" };
  const Icon = config.icon;
  const lines = renderContent(content);
  const hasBullets = content.split("\n").some((l) => l.trim().startsWith("-") || l.trim().startsWith("*"));

  return (
    <div className={`rounded-xl border ${config.borderColor} bg-black/20 p-4`}>
      <div className={`flex items-center gap-2 mb-3`}>
        <Icon className={`w-4 h-4 ${config.color}`} />
        <h3 className={`font-semibold text-sm ${config.color}`}>{title}</h3>
      </div>
      {hasBullets ? (
        <ul className="space-y-1.5 pl-1">{lines}</ul>
      ) : (
        <div className="space-y-1">{lines}</div>
      )}
    </div>
  );
}

export default function StructureViewer({ summary, graph }: StructureViewerProps) {
  const sections = summary ? parseSections(summary) : [];

  return (
    <div className="flex flex-col gap-4 h-full text-gray-200">
      {/* Architecture Summary */}
      <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl p-6 shadow-xl backdrop-blur-md flex-1 overflow-y-auto">
        <h2 className="text-xl font-bold mb-5 flex items-center gap-2 text-white">
          <FileCode2 className="text-blue-400 w-5 h-5" />
          Architecture Overview
        </h2>

        {sections.length > 0 ? (
          <div className="space-y-4">
            {sections.map((s) => (
              <SummarySection key={s.title} title={s.title} content={s.content} />
            ))}
          </div>
        ) : summary ? (
          // Fallback: render plain text if LLM didn't use headings
          <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed space-y-2 text-sm">
            {summary.split("\n").map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic text-sm">
            No summary available yet. Once analysis completes, you will see the architecture overview here.
          </p>
        )}
      </div>

      {/* Dependency Structure */}
      <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl p-6 shadow-xl backdrop-blur-md h-[36%] overflow-y-auto">
        <h2 className="text-xl font-bold mb-1 flex items-center gap-2 text-white">
          <Network className="text-purple-400 w-5 h-5" />
          Dependency Map
        </h2>
        <p className="text-xs text-foreground/50 mb-4">
          Showing up to 100 nodes detected during analysis (files & folders).
        </p>

        <div className="flex items-start flex-wrap gap-2">
          {graph?.nodes?.length ? (
            <>
              {graph.nodes.slice(0, 100).map((node, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1.5 rounded-lg border border-white/5 text-xs hover:border-white/20 transition-colors"
                >
                  {node.type === "dir" ? (
                    <Folder className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                  ) : (
                    <FileCode2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  )}
                  <span className="truncate max-w-[200px] text-foreground/80" title={node.id}>
                    {node.id.split("/").pop()}
                  </span>
                </div>
              ))}
              {graph.nodes.length > 100 && (
                <div className="px-3 py-1.5 text-xs text-gray-500">
                  +{graph.nodes.length - 100} more
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-foreground/50 italic">
              Nodes will appear here once the dependency graph is generated.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
