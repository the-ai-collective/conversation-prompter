import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { feedback } from "~/server/db/schema";

export const feedbackRouter = createTRPCRouter({
  submit: publicProcedure
    .input(
      z.object({
        questionId: z.number(),
        sessionId: z.number(),
        rating: z.number().optional(),
        feedback: z.string().optional(),
      }),
    )
    .mutation(
      async ({ ctx, input }) => await ctx.db.insert(feedback).values(input),
    ),
});
