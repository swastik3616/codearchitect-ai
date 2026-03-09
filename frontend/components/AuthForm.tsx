'use client';

import { useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { Github, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';

export default function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLogin, setIsLogin] = useState(true);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: { username: email.split('@')[0] }
          }
        });
        if (error) throw error;
        setError("Please check your email to verify your account!");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  const signInWithGithub = async () => {
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/`,
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 rounded-2xl bg-white/5 border border-white/10 shadow-2xl backdrop-blur-xl">
      <h2 className="text-2xl font-bold text-white mb-2 text-center">
        {isLogin ? "Welcome Back" : "Create Account"}
      </h2>
      <p className="text-gray-400 text-sm mb-6 text-center">
        {isLogin ? "Sign in to access your analyzed repositories." : "Sign up to start analyzing code architectures."}
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      <button
        onClick={signInWithGithub}
        type="button"
        className="w-full flex items-center justify-center gap-2 bg-[#24292F] hover:bg-[#24292F]/90 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200"
      >
        <Github className="w-5 h-5" />
        Continue with GitHub
      </button>

      <div className="flex items-center my-6">
        <div className="flex-1 border-t border-white/10"></div>
        <span className="px-4 text-xs text-gray-500 uppercase tracking-wider">Or continue with email</span>
        <div className="flex-1 border-t border-white/10"></div>
      </div>

      <form onSubmit={handleEmailAuth} className="space-y-4">
        <div>
          <div className="relative">
            <Mail className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              placeholder="Email address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div>
          <div className="relative">
            <Lock className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/25"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
             <>
               {isLogin ? "Sign In" : "Sign Up"}
               <ArrowRight className="w-4 h-4" />
             </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-400">
        {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
        <button 
          onClick={() => setIsLogin(!isLogin)}
          type="button"
          className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
        >
          {isLogin ? "Sign up" : "Sign in"}
        </button>
      </div>
    </div>
  );
}
