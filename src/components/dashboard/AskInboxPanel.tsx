"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageSquareText, Send, Sparkles } from "lucide-react";

interface AskResult {
  answer: string;
  sources: { emailId: string; subject: string; sender: string; accountEmail: string }[];
}

interface Turn {
  question: string;
  result: AskResult | null;
  loading: boolean;
  error: string | null;
}

const SUGGESTIONS = [
  "Show me all scholarship emails",
  "What opportunities did I miss last month?",
  "Find emails from investors",
  "Did anyone mention internships recently?",
];

export function AskInboxPanel() {
  const [question, setQuestion] = React.useState("");
  const [turns, setTurns] = React.useState<Turn[]>([]);

  async function ask(q: string) {
    const text = q.trim();
    if (!text) return;
    setQuestion("");
    setTurns((t) => [...t, { question: text, result: null, loading: true, error: null }]);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Something went wrong.");
      const result: AskResult = await res.json();
      setTurns((t) => t.map((turn, i) => (i === t.length - 1 ? { ...turn, result, loading: false } : turn)));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setTurns((t) => t.map((turn, i) => (i === t.length - 1 ? { ...turn, error: message, loading: false } : turn)));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquareText className="h-4 w-4 text-scope" />
          Ask Inbox
          <Badge variant="default" className="ml-1">
            Premium
          </Badge>
        </CardTitle>
        <CardDescription>ChatGPT for your email — ask in plain English</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {turns.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => ask(s)}
                className="rounded-full border border-ink-line px-3 py-1.5 text-xs text-paper/60 transition-colors hover:border-scope/50 hover:text-scope"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="max-h-[420px] space-y-4 overflow-y-auto pr-1">
          {turns.map((turn, i) => (
            <div key={i} className="space-y-2">
              <p className="rounded-md bg-ink px-3 py-2 text-sm text-paper/80">{turn.question}</p>
              {turn.loading && (
                <p className="flex items-center gap-2 text-xs text-paper/40">
                  <Sparkles className="h-3 w-3 animate-pulse" /> Searching your inboxes…
                </p>
              )}
              {turn.error && <p className="text-xs text-alert">{turn.error}</p>}
              {turn.result && (
                <div className="rounded-md border border-scope/20 bg-scope/5 px-3 py-3">
                  <p className="text-sm text-paper/90">{turn.result.answer}</p>
                  {turn.result.sources.length > 0 && (
                    <ul className="mt-3 space-y-1 border-t border-ink-line/60 pt-2">
                      {turn.result.sources.map((s) => (
                        <li key={s.emailId} className="truncate text-xs text-paper/40">
                          <span className="text-scope">{s.sender}</span> — {s.subject}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(question);
          }}
          className="flex items-end gap-2"
        >
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask anything about your inboxes…"
            className="min-h-[44px] resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                ask(question);
              }
            }}
          />
          <Button type="submit" size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
