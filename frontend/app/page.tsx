import RepoInput from "@/components/RepoInput";
import { Github } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center relative overflow-hidden px-4">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full point-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full point-events-none" />

      <div className="z-10 w-full max-w-4xl flex flex-col items-center gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl shadow-xl backdrop-blur-md">
           <Github className="w-12 h-12 text-white" />
        </div>
        
        <div className="text-center space-y-4">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-purple-400 drop-shadow-sm">
            Understand Code. <br/> Instantly.
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto font-light">
            Paste any GitHub repository and get instant AI-powered architectural insights, dependency graphs, and a chat interface to ask questions about the codebase.
          </p>
        </div>

        <div className="w-full mt-8">
          <RepoInput />
        </div>
        
        <div className="flex items-center gap-6 mt-12 text-sm text-gray-500 font-medium">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            FastAPI Backend
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse delay-100" />
            Next.js Interface
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse delay-200" />
            Vector Search Q&A
          </div>
        </div>

      </div>
    </main>
  );
}
