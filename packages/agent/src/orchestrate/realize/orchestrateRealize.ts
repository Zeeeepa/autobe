import {
  AutoBeAssistantMessageHistory,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeRealizeAuthorization,
  AutoBeRealizeFunction,
  AutoBeRealizeHistory,
  AutoBeRealizeWriteEvent,
  IAutoBeCompiler,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { IAutoBeApplicationProps } from "../../context/IAutoBeApplicationProps";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { predicateStateMessage } from "../../utils/predicateStateMessage";
import { compileRealizeFiles } from "./internal/compileRealizeFiles";
import { orchestrateRealizeCorrectCasting } from "./orchestRateRealizeCorrectCasting";
import { orchestrateRealizeAuthorization } from "./orchestrateRealizeAuthorization";
import { orchestrateRealizeCorrect } from "./orchestrateRealizeCorrect";
import { orchestrateRealizeWrite } from "./orchestrateRealizeWrite";
import { IAutoBeRealizeScenarioResult } from "./structures/IAutoBeRealizeScenarioResult";
import { generateRealizeScenario } from "./utils/generateRealizeScenario";

export const orchestrateRealize =
  <Model extends ILlmSchema.Model>(ctx: AutoBeContext<Model>) =>
  async (
    props: IAutoBeApplicationProps,
  ): Promise<AutoBeAssistantMessageHistory | AutoBeRealizeHistory> => {
    // PREDICATION
    const document: AutoBeOpenApi.IDocument | undefined =
      ctx.state().interface?.document;
    if (document === undefined)
      throw new Error("Can't do realize agent because operations are nothing.");

    const start: Date = new Date();
    const predicate: string | null = predicateStateMessage(
      ctx.state(),
      "realize",
    );
    if (predicate !== null)
      return ctx.assistantMessage({
        type: "assistantMessage",
        id: v7(),
        created_at: start.toISOString(),
        text: predicate,
        completed_at: new Date().toISOString(),
      });
    ctx.dispatch({
      type: "realizeStart",
      id: v7(),
      created_at: start.toISOString(),
      reason: props.instruction,
      step: ctx.state().test?.step ?? 0,
    });

    // AUTHORIZATIONS
    const authorizations: AutoBeRealizeAuthorization[] =
      await orchestrateRealizeAuthorization(ctx);

    // SCENARIOS
    const scenarios: IAutoBeRealizeScenarioResult[] = document.operations.map(
      (operation) => generateRealizeScenario(ctx, operation, authorizations),
    );

    const writeProgress: AutoBeProgressEventBase = {
      total: scenarios.length,
      completed: 0,
    };
    const writeEvents: (AutoBeRealizeWriteEvent | null)[] =
      await executeCachedBatch(
        scenarios.map((scenario) => async (promptCacheKey) => {
          const props = {
            totalAuthorizations: authorizations,
            authorization: scenario.decoratorEvent ?? null,
            scenario,
            document,
            progress: writeProgress,
            promptCacheKey,
          };
          const event: AutoBeRealizeWriteEvent | null =
            await orchestrateRealizeWrite(ctx, props).catch(() => {
              return orchestrateRealizeWrite(ctx, props).catch(() => null);
            });
          return event;
        }),
      );

    const functions: AutoBeRealizeFunction[] = Object.entries(
      Object.fromEntries(
        writeEvents
          .filter((w) => w !== null)
          .map((event) => [event.location, event.content]),
      ),
    ).map(([location, content]) => {
      const scenario = scenarios.find((el) => el.location === location)!;
      return {
        location,
        content,
        endpoint: {
          method: scenario.operation.method,
          path: scenario.operation.path,
        },
        name: scenario.functionName,
      };
    });

    const reviewProgress: AutoBeProgressEventBase = {
      total: writeEvents.length,
      completed: writeEvents.length,
    };

    const totalCorrected: AutoBeRealizeFunction[] =
      await orchestrateRealizeCorrectCasting(
        ctx,
        scenarios,
        authorizations,
        functions,
        reviewProgress,
      ).then(async (res) => {
        return orchestrateRealizeCorrect(
          ctx,
          scenarios,
          authorizations,
          res,
          [],
          reviewProgress,
        );
      });

    const compiler: IAutoBeCompiler = await ctx.compiler();
    const controllers: Record<string, string> =
      await compiler.realize.controller({
        document: ctx.state().interface!.document,
        functions: totalCorrected,
        authorizations,
      });

    const { result } = await compileRealizeFiles(ctx, {
      authorizations,
      functions: totalCorrected,
    });

    return ctx.dispatch({
      type: "realizeComplete",
      id: v7(),
      created_at: new Date().toISOString(),
      functions: totalCorrected,
      authorizations,
      controllers,
      compiled: result,
      step: ctx.state().analyze?.step ?? 0,
      elapsed: new Date().getTime() - start.getTime(),
    });
  };
