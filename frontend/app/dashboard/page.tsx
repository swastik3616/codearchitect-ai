"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/services/api";
import { supabase } from "@/utils/supabase/client";
import { Loader2, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import StructureViewer from "@/components/StructureViewer";
import ChatInterface from "@/components/ChatInterface";

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const repoUrl = searchParams.get("repo");
  const router = useRouter();

  const [taskId, setTaskId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("initializing");
  const [error, setError] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<any>(null);

  useEffect(() => {
    if (!repoUrl) {
      router.push("/");
      return;
    }

    // Check Authentication
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
          clearInterval(interval);
        } else if (res.status === "failed") {
          setError(res.error || "Analysis failed");
          clearInterval(interval);
        }
      } catch (err: any) {
         // If it's a 404, the server probably restarted and lost the task.
         if (err.message.includes("404") || err.message.includes("Task not found")) {
            setError("Analysis task not found. The server may have restarted.");
            setStatus("failed");
            clearInterval(interval);
         }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [taskId]);

  if (status === "failed") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Analysis Failed</h1>
        <p className="text-gray-400 max-w-lg text-center">{error}</p>
        <button onClick={() => router.push("/")} className="mt-8 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
          Go Back
        </button>
      </div>
    );
  }

  if (status !== "completed") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-4">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
          <Loader2 className="w-16 h-16 text-blue-500 animate-spin relative z-10" />
        </div>
        <h1 className="text-2xl font-bold mt-8 mb-2 capitalize">
          {status.replace("_", " ")}
        </h1>
        <p className="text-gray-400">
          This could take up to 2 minutes depending on repository size.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center p-4 md:p-8">
      <div className="w-full max-w-7xl mb-8 flex items-center justify-between">
         <button onClick={() => router.push("/")} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Analyze Another
         </button>
         <div className="flex items-center gap-2 text-green-400 bg-green-400/10 px-4 py-1.5 rounded-full text-sm font-medium border border-green-500/20">
            <CheckCircle2 className="w-4 h-4" /> Analysis Complete ({analysisData?.chunks_processed} chunks)
         </div>
      </div>
      
      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-3 gap-8 h-[80vh]">
        {/* Left Column: Flow & Architecture */}
        <div className="col-span-1 lg:col-span-2 flex flex-col gap-8 h-full overflow-hidden">
           <StructureViewer 
              summary={analysisData?.summary} 
              graph={analysisData?.graph} 
           />
        </div>

        {/* Right Column: AI Chat */}
        <div className="col-span-1 h-full bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md flex flex-col shadow-2xl">
           <ChatInterface repoUrl={repoUrl!} />
        </div>
      </div>
    </div>
  );
}
