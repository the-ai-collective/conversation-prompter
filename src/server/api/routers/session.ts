import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { sessions } from "~/server/db/schema";

export const sessionRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        theme: z.string().optional(),
        customInstructions: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [newSession] = await ctx.db
        .insert(sessions)
        .values({
          theme: input.theme,
          customInstructions: input.customInstructions,
        })
        .returning();

      return newSession;
    }),

  get: publicProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ ctx, input }) => {
      const session = await ctx.db.query.sessions.findFirst({
        where: (sessions, { eq }) => eq(sessions.id, input.sessionId),
      });
      return session;
    }),
});