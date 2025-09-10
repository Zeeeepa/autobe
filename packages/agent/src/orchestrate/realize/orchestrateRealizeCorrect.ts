import {
  AutoBeRealizeAuthorization,
  AutoBeRealizeCorrectEvent,
  AutoBeRealizeFunction,
  AutoBeRealizeValidateEvent,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { ILlmApplication, ILlmController, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { orchestrateCommonCorrectCasting } from "../common/orchestrateCommonCorrectCasting";
import { transformRealizeCorrectHistories } from "./histories/transformRealizeCorrectHistories";
import { compileRealizeFiles } from "./internal/compileRealizeFiles";
import { IAutoBeRealizeCorrectApplication } from "./structures/IAutoBeRealizeCorrectApplication";
import { IAutoBeRealizeFunctionFailure } from "./structures/IAutoBeRealizeFunctionFailure";
import { IAutoBeRealizeScenarioResult } from "./structures/IAutoBeRealizeScenarioResult";
import { getRealizeWriteDto } from "./utils/getRealizeWriteDto";
import { replaceImportStatements } from "./utils/replaceImportStatements";

export async function orchestrateRealizeCorrect<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  scenarios: IAutoBeRealizeScenarioResult[],
  authorizations: AutoBeRealizeAuthorization[],
  functions: AutoBeRealizeFunction[],
): Promise<AutoBeRealizeValidateEvent[]> {
  const result = await executeCachedBatch(
    functions.map((f) => async (promptCacheKey) => {
      try {
        const compile = async (script: string) => {
          return await compileRealizeFiles(ctx, {
            authorizations,
            function: {
              ...f,
              content: script,
            },
          });
        };

        const scenario = scenarios.find((el) => el.location === f.location);
        if (scenario === undefined) return null;

        const x: AutoBeRealizeValidateEvent =
          await orchestrateCommonCorrectCasting(
            ctx,
            {
              source: "realizeCorrect",
              validate: compile,
              correct: (next) => ({
                id: v7(),
                type: "realizeCorrect",
                created_at: new Date().toISOString(),
                location: f.location,
                content: next.final ?? next.draft,
                step: ctx.state().analyze?.step ?? 0,
                tokenUsage: next.tokenUsage,
              }),
              script: (event) => event.function.content,
            },
            f.content,
          );

        f.content = x.function.content;
        return predicate(
          ctx,
          scenario,
          authorizations,
          f,
          [],
          promptCacheKey,
          ctx.retry,
        );
      } catch (err) {
        console.debug(
          "failed to correct provider code, no function calling happened.",
          f.location,
        );
        return null;
      }
    }),
  );

  return result.filter((r) => r !== null);
}

async function predicate<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  scenario: IAutoBeRealizeScenarioResult,
  authorizations: AutoBeRealizeAuthorization[],
  func: AutoBeRealizeFunction,
  failures: IAutoBeRealizeFunctionFailure[],
  promptCacheKey: string,
  life: number,
): Promise<AutoBeRealizeValidateEvent | null> {
  if (life < 0) return null;
  const event = await compileRealizeFiles(ctx, {
    authorizations,
    function: func,
  });

  if (event.result.type === "failure") ctx.dispatch(event);

  return event.result.type === "failure"
    ? await correct(
        ctx,
        {
          totalAuthorizations: authorizations,
          authorization: null,
          scenario: scenario,
          function: func,
          failures: [
            ...failures,
            {
              function: func,
              diagnostics: event.result.diagnostics,
            },
          ],
          promptCacheKey,
        },
        life - 1,
      )
    : event;
}

async function correct<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    authorization: AutoBeRealizeAuthorization | null;
    totalAuthorizations: AutoBeRealizeAuthorization[];
    scenario: IAutoBeRealizeScenarioResult;
    function: AutoBeRealizeFunction;
    failures: IAutoBeRealizeFunctionFailure[];
    promptCacheKey: string;
  },
  life: number,
): Promise<AutoBeRealizeValidateEvent | null> {
  const pointer: IPointer<IAutoBeRealizeCorrectApplication.IProps | null> = {
    value: null,
  };

  const dto = await getRealizeWriteDto(ctx, props.scenario.operation);
  const { tokenUsage } = await ctx.conversate({
    source: "realizeCorrect",
    controller: createController({
      model: ctx.model,
      build: (next) => {
        pointer.value = next;
      },
    }),
    histories: transformRealizeCorrectHistories({
      state: ctx.state(),
      scenario: props.scenario,
      authorization: props.authorization,
      code: props.function.content,
      dto,
      failures: props.failures.filter(
        (f) => f.function.location === props.function.location,
      ),
      totalAuthorizations: props.totalAuthorizations,
    }),
    enforceFunctionCall: true,
    message: StringUtil.trim`
      Correct the TypeScript code implementation.
    `,
    promptCacheKey: props.promptCacheKey,
  });

  if (pointer.value === null)
    throw new Error("Failed to correct implementation code.");

  pointer.value.revise.implementationCode = await replaceImportStatements(ctx, {
    operation: props.scenario.operation,
    code: pointer.value.revise.implementationCode,
    decoratorType: props.authorization?.payload.name,
  });

  const event: AutoBeRealizeCorrectEvent = {
    type: "realizeCorrect",
    id: v7(),
    location: props.scenario.location,
    content: pointer.value.revise.implementationCode,
    tokenUsage,
    step: ctx.state().analyze?.step ?? 0,
    created_at: new Date().toISOString(),
  };
  ctx.dispatch(event);

  return predicate(
    ctx,
    props.scenario,
    props.totalAuthorizations,
    props.function,
    props.failures,
    props.promptCacheKey,
    life - 1,
  );
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  build: (next: IAutoBeRealizeCorrectApplication.IProps) => void;
}): ILlmController<Model> {
  assertSchemaModel(props.model);
  const application: ILlmApplication<Model> = collection[
    props.model
  ] satisfies ILlmApplication<any> as unknown as ILlmApplication<Model>;

  return {
    protocol: "class",
    name: "Write code",
    application,
    execute: {
      review: (next) => {
        props.build(next);
      },
    } satisfies IAutoBeRealizeCorrectApplication,
  };
}

const claude = typia.llm.application<
  IAutoBeRealizeCorrectApplication,
  "claude"
>();
const collection = {
  chatgpt: typia.llm.application<IAutoBeRealizeCorrectApplication, "chatgpt">(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
};
