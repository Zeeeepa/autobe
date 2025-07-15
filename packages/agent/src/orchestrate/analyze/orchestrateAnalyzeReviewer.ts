import { MicroAgentica } from "@agentica/core";
import { ILlmSchema } from "@samchon/openapi";

import { AutoBeContext } from "../../context/AutoBeContext";
import { enforceToolCall } from "../../utils/enforceToolCall";
import { transformAnalyzeReviewerHistories } from "./transformAnalyzeReviewerHistories";

export const orchestrateAnalyzeReviewer = async <
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  input: {
    /** Total file names */
    files: Record<string, string>;
  },
): Promise<string | null> => {
  const agent = new MicroAgentica({
    model: ctx.model,
    vendor: ctx.vendor,
    controllers: [],
    config: {
      executor: {
        describe: null,
      },
      locale: ctx.config?.locale,
    },
    histories: [...transformAnalyzeReviewerHistories(input)],
  });
  enforceToolCall(agent);

  const command = `proceed with the review of these files only.` as const;
  const histories = await agent.conversate(command);

  return histories.find((h) => h.type === "assistantMessage")?.text ?? null;
};
