"use client";

import { useEffect, useRef, useState } from "react";
import { BrainCircuit, Loader2, Send, User } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SuggestedChips } from "@/components/dashboard/SuggestedChips";
import { api } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function ChatPanel({ datasetId, filename }: { datasetId: string; filename: string }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `I've analyzed "${filename}". Ask me anything about it — trends, top performers, outliers, or a forecast.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(question: string) {
    if (!question.trim() || loading) return;
    setMessages((m) => [...m, { role: "user", content: question }]);
    setInput("");
    setLoading(true);
    try {
      const { answer } = await api.chat(datasetId, question);
      setMessages((m) => [...m, { role: "assistant", content: answer }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Something went wrong reaching the analysis engine. Try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="flex h-full flex-col p-0">
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-signal-violet/10 text-signal-violet">
          <BrainCircuit size={16} />
        </span>
        <div>
          <p className="font-display text-sm font-semibold text-ink">Ask DataSage</p>
          <p className="text-xs text-ink-muted">Grounded in your uploaded data</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <span
              className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${
                m.role === "user" ? "bg-signal-violet/15 text-signal-violet" : "bg-sage/15 text-sage"
              }`}
            >
              {m.role === "user" ? <User size={13} /> : <BrainCircuit size={13} />}
            </span>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "user" ? "bg-signal-violet/10 text-ink" : "bg-white/[0.04] text-ink-soft"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 pl-10 text-sm text-ink-muted">
            <Loader2 size={13} className="animate-spin" /> Thinking…
          </div>
        )}
      </div>

      <div className="border-t border-border p-4">
        <div className="mb-3">
          <SuggestedChips onPick={send} />
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your data…"
          />
          <Button type="submit" disabled={loading} size="md">
            <Send size={15} />
          </Button>
        </form>
      </div>
    </Card>
  );
}
