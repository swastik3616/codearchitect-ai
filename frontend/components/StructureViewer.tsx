import { Folder, FileCode2, Network } from "lucide-react";

interface StructureViewerProps {
  summary: string;
  graph: {
    nodes: any[];
    edges: any[];
  }
}

export default function StructureViewer({ summary, graph }: StructureViewerProps) {
  return (
    <div className="flex flex-col gap-4 h-full text-gray-200">
      {/* Architecture Summary */}
      <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl p-6 shadow-xl backdrop-blur-md flex-1 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
          <FileCode2 className="text-blue-400" />
          Architecture Overview
        </h2>
        <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed space-y-3 text-sm">
          {summary ? (
            summary.split("\\n").map((line, i) => (
              <p key={i}>{line}</p>
            ))
          ) : (
            <p className="text-gray-500 italic">
              No summary available yet. Once the analysis completes, you will see an overview of the
              project&apos;s abstract, technology stack, and architecture here.
            </p>
          )}
        </div>
      </div>

      {/* Dependency Structure */}
      <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl p-6 shadow-xl backdrop-blur-md h-[40%] overflow-y-auto">
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2 text-white">
          <Network className="text-purple-400" />
          Dependency Map (Nodes)
        </h2>
        <p className="text-xs text-foreground/60 mb-4">
          Showing up to 100 nodes detected in the repository. Each node represents either a folder or
          a file discovered during analysis.
        </p>

        <div className="flex items-start flex-wrap gap-3">
          {graph?.nodes?.length ? (
            <>
              {graph.nodes.slice(0, 100).map((node, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 text-xs md:text-sm"
                >
                  {node.type === "dir" ? (
                    <Folder className="w-4 h-4 text-yellow-500" />
                  ) : (
                    <FileCode2 className="w-4 h-4 text-blue-400" />
                  )}
                  <span className="truncate max-w-[220px]" title={node.id}>
                    {node.id.split("/").pop()}
                  </span>
                </div>
              ))}
              {graph.nodes.length > 100 && (
                <div className="px-3 py-1.5 text-xs md:text-sm text-gray-500">
                  + {graph.nodes.length - 100} more entries
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-foreground/60 italic">
              Dependency nodes will appear here once analysis has generated the graph.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
