"use client";

import { useState, useRef, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { LogOut, History, ChevronDown, User as UserIcon, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import HistoryModal from "./HistoryModal";

export default function UserMenu({ user, onSignOut }: { user: User; onSignOut: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 bg-[var(--panel)] border border-[var(--panel-border)] hover:border-purple-500/50 px-4 py-2 rounded-full backdrop-blur-md transition-all duration-300"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center p-0.5">
            <div className="w-full h-full bg-black/50 rounded-full flex items-center justify-center">
               <UserIcon className="w-4 h-4 text-white" />
            </div>
          </div>
          <span className="text-sm font-medium text-foreground/80 hidden sm:block">
            {user.email?.split("@")[0]}
          </span>
          <ChevronDown className={`w-4 h-4 text-foreground/50 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-background border border-[var(--panel-border)] shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 rounded-2xl">
            <div className="p-4 border-b border-[var(--panel-border)] bg-[var(--panel)]">
              <p className="text-xs text-foreground/50 uppercase font-semibold tracking-wider">Signed in as</p>
              <p className="text-sm text-foreground mt-1 truncate">{user.email}</p>
            </div>
            <div className="p-2 flex flex-col gap-1">
              {mounted && (
                <button
                  onClick={() => {
                    setTheme(theme === 'dark' ? 'light' : 'dark');
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-foreground/80 hover:text-foreground hover:bg-[var(--panel)] rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {theme === 'dark' ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4 text-blue-500" />}
                    {theme === 'dark' ? "Light Mode" : "Dark Mode"}
                  </div>
                </button>
              )}
              
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowHistory(true);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground/80 hover:text-foreground hover:bg-[var(--panel)] rounded-xl transition-colors"
              >
                <History className="w-4 h-4 text-purple-400" />
                History
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  onSignOut();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>

      <HistoryModal isOpen={showHistory} onClose={() => setShowHistory(false)} />
    </>
  );
}
