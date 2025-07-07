"use client";

import { QuestionPrompt } from "./QuestionPrompt";
import { ThemeInput } from "./ThemeInput";
import { useState } from "react";

export const ConversationFlow = () => {
  const [sessionId, setSessionId] = useState<number | null>(null);

  return (
    <>
      {sessionId ? (
        <QuestionPrompt sessionId={sessionId} />
      ) : (
        <ThemeInput onSessionCreated={setSessionId} />
      )}
    </>
  );
};