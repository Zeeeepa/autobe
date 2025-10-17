import {
  AutoBeAssistantMessageHistory,
  AutoBeOpenApi,
  AutoBeTestHistory,
  AutoBeTestScenario,
  AutoBeTestValidateEvent,
  IAutoBeCompiler,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { IAutoBeFacadeApplicationProps } from "../../context/IAutoBeFacadeApplicationProps";
import { predicateStateMessage } from "../../utils/predicateStateMessage";
import { orchestrateTestCorrect } from "./orchestrateTestCorrect";
import { orchestrateTestScenario } from "./orchestrateTestScenario";
import { orchestrateTestWrite } from "./orchestrateTestWrite";
import { IAutoBeTestWriteResult } from "./structures/IAutoBeTestWriteResult";

export const orchestrateTest =
  <Model extends ILlmSchema.Model>(ctx: AutoBeContext<Model>) =>
  async (
    props: IAutoBeFacadeApplicationProps,
  ): Promise<AutoBeAssistantMessageHistory | AutoBeTestHistory> => {
    // PREDICATION
    const start: Date = new Date();
    const predicate: string | null = predicateStateMessage(ctx.state(), "test");
    if (predicate !== null)
      return ctx.assistantMessage({
        type: "assistantMessage",
        id: v7(),
        created_at: start.toISOString(),
        text: predicate,
        completed_at: new Date().toISOString(),
      });
    ctx.dispatch({
      type: "testStart",
      id: v7(),
      created_at: start.toISOString(),
      reason: props.instruction,
      step: ctx.state().analyze?.step ?? 0,
    });

    // CHECK OPERATIONS
    const operations: AutoBeOpenApi.IOperation[] =
      ctx.state().interface?.document.operations ?? [];
    if (operations.length === 0)
      return ctx.assistantMessage({
        id: v7(),
        type: "assistantMessage",
        created_at: start.toISOString(),
        completed_at: new Date().toISOString(),
        text:
          "Unable to write test code because there are no Operations, " +
          "please check if the Interface agent is called.",
      });

    // PLAN
    const scenarios: AutoBeTestScenario[] = await orchestrateTestScenario(
      ctx,
      props.instruction,
    );
    if (scenarios.length === 0)
      throw new Error("No scenarios generated. Please check the logs.");

    // TEST CODE
    const written: IAutoBeTestWriteResult[] = await orchestrateTestWrite(ctx, {
      instruction: props.instruction,
      scenarios,
    });
    if (written.length === 0)
      throw new Error("No test code written. Please check the logs.");

    const corrects: AutoBeTestValidateEvent[] = await orchestrateTestCorrect(
      ctx,
      {
        instruction: props.instruction,
        functions: written.map((w) => ({
          scenario: w.scenario,
          artifacts: w.artifacts,
          location: w.event.location,
          script: w.event.final ?? w.event.draft,
        })),
      },
    );

    // DO COMPILE
    const compiler: IAutoBeCompiler = await ctx.compiler();
    const compileResult: IAutoBeTypeScriptCompileResult =
      await compiler.typescript.compile({
        files: Object.fromEntries([
          ...Object.entries(
            await ctx.files({
              dbms: "sqlite",
            }),
          ).filter(([key]) => key.endsWith(".ts")),
          ...corrects.map((s) => [s.file.location, s.file.content]),
        ]),
      });
    return ctx.dispatch({
      type: "testComplete",
      id: v7(),
      created_at: new Date().toISOString(),
      files: corrects.map((s) => s.file),
      compiled: compileResult,
      step: ctx.state().interface?.step ?? 0,
      elapsed: new Date().getTime() - start.getTime(),
    });
  };
