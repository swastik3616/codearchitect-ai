'use client';

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import RepoInput from "@/components/RepoInput";
import AuthForm from "@/components/AuthForm";
import { Github, LogOut, User as UserIcon } from "lucide-react";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center relative overflow-hidden px-4 py-12">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />

      {/* User Header */}
      {user && (
        <div className="absolute top-6 right-6 z-50 flex items-center gap-4 bg-white/5 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md">
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <UserIcon className="w-4 h-4 text-blue-400" />
            <span className="font-medium hidden sm:inline-block">
              {user.email}
            </span>
          </div>
          <div className="w-px h-4 bg-white/20"></div>
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-1 text-sm text-red-400 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      )}

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

        <div className="w-full mt-8 flex justify-center">
          {loadingAuth ? (
             <div className="text-gray-500 animate-pulse mt-12">Checking authentication...</div>
          ) : user ? (
            <RepoInput />
          ) : (
            <div className="w-full mt-4 flex justify-center animate-in fade-in zoom-in-95 duration-500">
              <AuthForm />
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-6 mt-12 text-sm text-gray-500 font-medium pb-8">
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
