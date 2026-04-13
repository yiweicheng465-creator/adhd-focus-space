import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { notifyOwner } from "../_core/notification";

export const feedbackRouter = router({
  submit: publicProcedure
    .input(
      z.object({
        type: z.enum(["bug", "feature"]),
        title: z.string().min(1).max(200),
        details: z.string().max(2000).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const prefix = input.type === "bug" ? "[BUG]" : "[Feature Request]";
      const title = `${prefix} ${input.title}`;
      const content = input.details
        ? `${input.title}\n\n${input.details}`
        : input.title;

      const sent = await notifyOwner({ title, content });
      return { success: sent };
    }),
});
