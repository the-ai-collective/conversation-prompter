"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

interface ThemeInputProps {
  onSessionCreated: (sessionId: number) => void;
}

export const ThemeInput = ({ onSessionCreated }: ThemeInputProps) => {
  const [theme, setTheme] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");

  const { mutate: createSession, isPending } = api.session.create.useMutation({
    onSuccess: (session) => {
      if (session?.id) {
        onSessionCreated(session.id);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSession({
      theme: theme.trim() || undefined,
      customInstructions: customInstructions.trim() || undefined,
    });
  };

  const canSubmit = theme.trim().length > 0 || customInstructions.trim().length > 0;

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">
          Conversation Prompter
        </h1>
        <p className="text-white/80">
          Set your theme and custom instructions to get started with personalized questions
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="theme" className="text-white font-medium">
            Theme (optional)
          </label>
          <input
            id="theme"
            type="text"
            placeholder="e.g., Technology, Philosophy, Business, Personal Growth..."
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="w-full rounded-md border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/60 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="customInstructions" className="text-white font-medium">
            Custom Instructions (optional)
          </label>
          <textarea
            id="customInstructions"
            placeholder="Any specific instructions for the AI about what kind of questions you'd like, your background, interests, or conversation style preferences..."
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/60 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 resize-vertical"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={!canSubmit || isPending}
            className="flex-1 cursor-pointer rounded-md bg-blue-500/80 px-6 py-3 text-white font-medium hover:bg-blue-500 focus:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isPending ? "Creating Session..." : "Start Conversation"}
          </button>
          
          <button
            type="button"
            onClick={() => createSession({})}
            disabled={isPending}
            className="cursor-pointer rounded-md bg-white/10 px-6 py-3 text-white font-medium hover:bg-white/20 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50 disabled:pointer-events-none"
          >
            Skip
          </button>
        </div>
      </form>
    </div>
  );
};