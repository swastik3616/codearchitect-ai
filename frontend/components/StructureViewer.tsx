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
    <div className="flex flex-col gap-6 h-full text-gray-200">
      
      {/* Architecture Summary */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md flex-1 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
          <FileCode2 className="text-blue-400" />
          Architecture Overview
        </h2>
        <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed space-y-4">
           {summary ? (
             summary.split("\\n").map((line, i) => (
                <p key={i}>{line}</p>
             ))
           ) : (
             <p className="text-gray-500 italic">No summary available from LLM.</p>
           )}
        </div>
      </div>

      {/* Dependency Structure */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md h-[40%] overflow-y-auto">
         <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
          <Network className="text-purple-400" />
          Dependency Map (Nodes)
        </h2>
        
        <div className="flex items-start flex-wrap gap-3">
          {graph?.nodes?.slice(0, 100).map((node, i) => (
            <div key={i} className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 text-sm">
               {node.type === 'dir' ? (
                 <Folder className="w-4 h-4 text-yellow-500" />
               ) : (
                 <FileCode2 className="w-4 h-4 text-blue-400" />
               )}
               <span className="truncate max-w-[200px]" title={node.id}>
                 {node.id.split('/').pop()}
               </span>
            </div>
          ))}
          {graph?.nodes?.length > 100 && (
             <div className="px-3 py-1.5 text-sm text-gray-500">
               + {graph.nodes.length - 100} more files
             </div>
          )}
        </div>
      </div>

    </div>
  );
}
