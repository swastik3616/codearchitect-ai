"use client";

import { useState, useRef, useEffect } from "react";
import { Send, UserCircle, Bot, Loader2 } from "lucide-react";
import { api } from "@/services/api";
import MermaidDiagram from "./MermaidDiagram";

// ─────────────────────────────────────────────────────────────────────────────
// Lightweight markdown renderer for AI messages
// Supports: # headings, **bold**, `code`, ```blocks```, - lists, numbered lists
// ─────────────────────────────────────────────────────────────────────────────
function renderMarkdown(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const lines = text.split("\n");
  let i = 0;
  let keyCounter = 0;
  const key = () => keyCounter++;

  while (i < lines.length) {
    const line = lines[i];

    // Heading
    const headingMatch = line.match(/^(#{1,3})\s+(.*)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const content = headingMatch[2];
      const cls =
        level === 1
          ? "text-base font-bold text-white mt-3 mb-1"
          : level === 2
          ? "text-sm font-semibold text-blue-300 mt-2 mb-1"
          : "text-xs font-semibold text-purple-300 mt-2 mb-1";
      nodes.push(
        <p key={key()} className={cls}>
          {renderInline(content)}
        </p>
      );
      i++;
      continue;
    }

    // Unordered list item
    if (line.match(/^\s*[-*]\s+/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\s*[-*]\s+/)) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i++;
      }
      nodes.push(
        <ul key={key()} className="list-disc list-inside space-y-0.5 my-1 pl-2">
          {items.map((item, idx) => (
            <li key={idx} className="text-sm text-foreground/90">
              {renderInline(item)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered list
    if (line.match(/^\s*\d+\.\s+/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\s*\d+\.\s+/)) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      nodes.push(
        <ol key={key()} className="list-decimal list-inside space-y-0.5 my-1 pl-2">
          {items.map((item, idx) => (
            <li key={idx} className="text-sm text-foreground/90">
              {renderInline(item)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Fenced code block (non-mermaid)
    if (line.startsWith("```") && !line.startsWith("```mermaid")) {
      const lang = line.replace("```", "").trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // consume closing ```
      nodes.push(
        <pre
          key={key()}
          className="my-2 p-3 rounded-lg bg-black/40 border border-white/10 overflow-x-auto text-xs font-mono text-green-300 leading-relaxed"
        >
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      nodes.push(<div key={key()} className="h-1" />);
      i++;
      continue;
    }

    // Regular paragraph line
    nodes.push(
      <p key={key()} className="text-sm leading-relaxed text-foreground/90">
        {renderInline(line)}
      </p>
    );
    i++;
  }

  return nodes;
}

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="px-1 py-0.5 rounded bg-white/10 text-blue-300 text-xs font-mono">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Split AI response into text + mermaid diagram segments
// ─────────────────────────────────────────────────────────────────────────────
function renderAiMessage(content: string): React.ReactNode[] {
  const segments = content.split(/(```mermaid[\s\S]*?```)/g);
  return segments.map((segment, idx) => {
    if (segment.startsWith("```mermaid") && segment.endsWith("```")) {
      const chartCode = segment.replace(/```mermaid\n?/, "").replace(/```$/, "").trim();
      return <MermaidDiagram key={idx} chart={chartCode} />;
    }
    return (
      <div key={idx} className="space-y-1">
        {renderMarkdown(segment)}
      </div>
    );
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ChatInterface
// ─────────────────────────────────────────────────────────────────────────────
export default function ChatInterface({ repoUrl }: { repoUrl: string }) {
  const [messages, setMessages] = useState<{ role: "user" | "ai"; content: string }[]>([
    {
      role: "ai",
      content:
        "Hi! I've analyzed the repository. You can ask me anything about it.\n\n**Try asking:**\n- Is there a `package.json` file?\n- Explain the authentication logic\n- Show me the system architecture diagram\n- Find the database configuration\n- What framework does this use?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.askQuestion(repoUrl, userMessage);
      setMessages((prev) => [...prev, { role: "ai", content: res.answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: "Sorry, I encountered an error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background/50">
      <div className="p-4 border-b border-[var(--panel-border)] bg-[var(--panel)]">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Bot className="text-blue-500 w-5 h-5" /> Repository Assistant
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === "user" ? "bg-blue-600/20" : "bg-purple-600/20 text-purple-400"
              }`}
            >
              {msg.role === "user" ? (
                <UserCircle className="w-5 h-5 text-blue-400" />
              ) : (
                <Bot className="w-5 h-5" />
              )}
            </div>
            <div
              className={`px-4 py-3 rounded-2xl max-w-[88%] text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-tr-sm"
                  : "bg-[var(--panel)] text-foreground border border-[var(--panel-border)] rounded-tl-sm w-full overflow-hidden"
              }`}
            >
              {msg.role === "user" ? (
                msg.content.split("\n").map((line, idx) => <span key={idx}>{line}<br /></span>)
              ) : (
                <div className="space-y-1">{renderAiMessage(msg.content)}</div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-600/20 text-purple-500 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div className="px-4 py-3 rounded-2xl bg-[var(--panel)] border border-[var(--panel-border)] rounded-tl-sm text-foreground/70 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs text-foreground/50 animate-pulse">Analyzing...</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="p-4 bg-[var(--panel)] border-t border-[var(--panel-border)]">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Ask about architecture, files, flows, diagrams..."
            className="w-full bg-background border border-[var(--panel-border)] rounded-xl py-3 pl-4 pr-12 text-sm text-foreground placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
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
