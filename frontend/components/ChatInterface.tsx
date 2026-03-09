import { useState, useRef, useEffect } from "react";
import { Send, UserCircle, Bot, Loader2 } from "lucide-react";
import { api } from "@/services/api";

export default function ChatInterface({ repoUrl }: { repoUrl: string }) {
  const [messages, setMessages] = useState<{role: 'user' | 'ai', content: string}[]>([
    { role: 'ai', content: "Hi! I've analyzed the repository. What would you like to know about it?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.askQuestion(repoUrl, userMessage);
      setMessages(prev => [...prev, { role: 'ai', content: res.answer }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I encountered an error answering that question." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black/20">
      <div className="p-4 border-b border-white/10 bg-black/40">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Bot className="text-blue-400 w-5 h-5"/> Repository Assistant
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-600/20' : 'bg-purple-600/20 text-purple-400'}`}>
               {msg.role === 'user' ? <UserCircle className="w-5 h-5 text-blue-400" /> : <Bot className="w-5 h-5" />}
            </div>
            <div className={`px-4 py-3 rounded-2xl max-w-[85%] text-sm leading-relaxed ${
              msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white/10 text-gray-200 border border-white/5 rounded-tl-sm'
            }`}>
              {msg.content.split("\\n").map((line, idx) => (
                <span key={idx}>
                  {line}
                  <br />
                </span>
              ))}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-600/20 text-purple-400 flex items-center justify-center shrink-0">
               <Bot className="w-5 h-5" />
            </div>
            <div className="px-4 py-3 rounded-2xl bg-white/10 border border-white/5 rounded-tl-sm text-gray-400 flex items-center">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="p-4 bg-black/40 border-t border-white/10">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Ask about architecture, functions, flow..."
            className="w-full bg-white/5 border border-gray-700 rounded-xl py-3 pl-4 pr-12 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || loading}
            className="absolute right-2 top-2 p-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
