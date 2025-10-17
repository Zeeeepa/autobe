import { IAgenticaController } from "@agentica/core";
import {
  AutoBeAnalyzeScenarioEvent,
  AutoBeAnalyzeWriteEvent,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { AutoBeAnalyzeFile } from "@autobe/interface/src/histories/contents/AutoBeAnalyzeFile";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { transformAnalyzeWriteHistories } from "./histories/transformAnalyzeWriteHistories";
import { IAutoBeAnalyzeWriteApplication } from "./structures/IAutoBeAnalyzeWriteApplication";

export const orchestrateAnalyzeWrite = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    file: AutoBeAnalyzeFile.Scenario;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
  },
): Promise<AutoBeAnalyzeWriteEvent> => {
  const { file, progress, promptCacheKey } = props;
  const pointer: IPointer<IAutoBeAnalyzeWriteApplication.IProps | null> = {
    value: null,
  };
  const { tokenUsage } = await ctx.conversate({
    source: "analyzeWrite",
    controller: createController<Model>({
      model: ctx.model,
      pointer,
    }),
    histories: transformAnalyzeWriteHistories(ctx, props),
    enforceFunctionCall: true,
    promptCacheKey,
    message: "Write requirement analysis report.",
  });
  if (pointer.value === null)
    throw new Error("The Analyze Agent failed to create the document.");

  const event: AutoBeAnalyzeWriteEvent = {
    type: "analyzeWrite",
    id: v7(),
    file: {
      ...file,
      content: pointer.value.content,
    },
    tokenUsage: tokenUsage,
    step: (ctx.state().analyze?.step ?? -1) + 1,
    total: progress.total,
    completed: ++progress.completed,
    created_at: new Date().toISOString(),
  };
  ctx.dispatch(event);
  return event;
};

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  pointer: IPointer<IAutoBeAnalyzeWriteApplication.IProps | null>;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);
  const application: ILlmApplication<Model> = collection[
    props.model
  ] satisfies ILlmApplication<any> as unknown as ILlmApplication<Model>;
  return {
    protocol: "class",
    name: "Planning",
    application,
    execute: {
      write: async (input) => {
        props.pointer.value = input;
      },
    } satisfies IAutoBeAnalyzeWriteApplication,
  };
}

const claude = typia.llm.application<
  IAutoBeAnalyzeWriteApplication,
  "claude"
>();
const collection = {
  chatgpt: typia.llm.application<IAutoBeAnalyzeWriteApplication, "chatgpt">(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
};
