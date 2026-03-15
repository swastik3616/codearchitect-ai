'use client';

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import RepoInput from "@/components/RepoInput";
import AuthForm from "@/components/AuthForm";
import UserMenu from "@/components/UserMenu";
import { Github } from "lucide-react";

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
    <main className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4 py-12 bg-gradient-to-b from-background via-background/95 to-black">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none animate-blob" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none animate-blob" style={{ animationDelay: "2s" }} />

      {/* User Header */}
      {user && (
        <div className="absolute top-6 right-6 z-50">
          <UserMenu user={user} onSignOut={handleSignOut} />
        </div>
      )}

      <div className="z-10 w-full max-w-4xl flex flex-col items-center gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl shadow-xl backdrop-blur-md">
           <Github className="w-12 h-12 text-white" />
        </div>
        
        <div className="text-center space-y-4">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 drop-shadow-sm">
            Understand Code. <br/> Instantly.
          </h1>
          <p className="text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto font-light">
            Paste any GitHub repository and get instant AI-powered architectural insights, dependency graphs, and a chat interface that actually understands the codebase.
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

        {/* Quick feature highlights */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl text-sm text-gray-300 pb-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur-md">
            <p className="font-semibold text-foreground mb-1">1. Paste a GitHub URL</p>
            <p className="text-foreground/70">
              CodeArchitect clones and parses the repo with language-aware chunking, skipping heavy folders automatically.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur-md">
            <p className="font-semibold text-foreground mb-1">2. See architecture instantly</p>
            <p className="text-foreground/70">
              Get an LLM-generated abstract, technology stack, and dependency overview tailored to the project.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur-md">
            <p className="font-semibold text-foreground mb-1">3. Chat with the code</p>
            <p className="text-foreground/70">
              Ask questions grounded in vector search over the codebase, with optional Mermaid diagrams for flows.
            </p>
          </div>
        </div>

      </div>
    </main>
  );
}
