import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { questions, feedback, sessions } from "~/server/db/schema";
import { eq, sql } from "drizzle-orm";
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

export const generateRouter = createTRPCRouter({
  retrieveExamplesAndGenerateNewQuestion: publicProcedure
    .input(
      z.object({
        sessionId: z.number(),
        limit: z.number().default(25),
        temperature: z.number().min(0).max(1).default(0.5),
      }),
    )
    .mutation(async ({ ctx, input: { sessionId, limit, temperature } }) => {
      // Get session details for theme and custom instructions
      const session = await ctx.db.query.sessions.findFirst({
        where: (sessions, { eq }) => eq(sessions.id, sessionId),
      });

      // Get previous questions and feedback from this session
      const sessionHistory = await ctx.db
        .select({
          question: questions.question,
          rating: feedback.rating,
          feedbackText: feedback.feedback,
        })
        .from(questions)
        .leftJoin(feedback, eq(feedback.questionId, questions.id))
        .where(eq(questions.sessionId, sessionId))
        .orderBy(questions.createdAt);

      // Get examples from all sessions for general inspiration
      const subquery = ctx.db
        .select({
          id: questions.id,
          text: questions.question,
          avgRanking: sql<number>`COALESCE(AVG(${feedback.rating}), 0)`.as(
            "avg_ranking",
          ),
          randomFactor: sql<number>`(${temperature} * (RANDOM() - 0.5))`.as(
            "random_factor",
          ),
        })
        .from(questions)
        .leftJoin(feedback, eq(feedback.questionId, questions.id))
        .groupBy(questions.id, questions.question)
        .as("subquery");

      const examples = await ctx.db
        .select({
          id: subquery.id,
          text: subquery.text,
          avgRanking: subquery.avgRanking,
          randomFactor: subquery.randomFactor,
        })
        .from(subquery)
        .orderBy(sql`(${subquery.avgRanking} + ${subquery.randomFactor}) DESC`)
        .limit(limit);

      // Build the AI prompt with session context
      let systemPrompt = "You are facilitating exciting questions for a discussion.";
      
      if (session?.theme) {
        systemPrompt += ` The conversation theme is: ${session.theme}.`;
      }
      
      if (session?.customInstructions) {
        systemPrompt += ` Additional instructions: ${session.customInstructions}.`;
      }

      let userPrompt = `Generate a new question`;
      
      if (examples.length > 0) {
        userPrompt += ` that is similar to these well-rated examples: ${examples.map((example) => example.text).join("\n")}`;
      }

      if (sessionHistory.length > 0) {
        userPrompt += `\n\nPrevious questions in this session and their feedback:`;
        sessionHistory.forEach((item, index) => {
          userPrompt += `\n${index + 1}. "${item.question}"`;
          if (item.rating) {
            userPrompt += ` (Rating: ${item.rating > 0 ? 'positive' : 'negative'})`;
          }
          if (item.feedbackText) {
            userPrompt += ` - Feedback: "${item.feedbackText}"`;
          }
        });
        userPrompt += `\n\nConsider this conversation history when generating the next question. Build on previous topics or pivot based on the feedback received.`;
      }

      userPrompt += ` Output only the question, no other text.`;

      const { text } = await generateText({
        model: anthropic("claude-4-sonnet-20250514"),
        system: systemPrompt,
        prompt: userPrompt,
      });

      const [newQuestion] = await ctx.db
        .insert(questions)
        .values({
          sessionId,
          question: text,
        })
        .returning();

      return newQuestion;
    }),
});
