import { IAgenticaController } from "@agentica/core";
import {
  AutoBeInterfaceSchemasEvent,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { mergeOpenApiComponentSchemas } from "@autobe/utils";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { divideArray } from "../../utils/divideArray";
import { transformInterfaceSchemaHistories } from "./histories/transformInterfaceSchemaHistories";
import { orchestrateInterfaceSchemasReview } from "./orchestrateInterfaceSchemasReview";
import { IAutoBeInterfaceSchemaApplication } from "./structures/IAutoBeInterfaceSchemaApplication";

export async function orchestrateInterfaceSchemas<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  operations: AutoBeOpenApi.IOperation[],
  capacity: number = 12,
): Promise<AutoBeOpenApi.IComponentSchema[]> {
  const typeNames: Set<string> = new Set();
  for (const op of operations) {
    if (op.requestBody !== null) typeNames.add(op.requestBody.typeName);
    if (op.responseBody !== null) typeNames.add(op.responseBody.typeName);
  }
  const matrix: string[][] = divideArray({
    array: Array.from(typeNames),
    capacity,
  });
  const progress: AutoBeProgressEventBase = {
    total: typeNames.size,
    completed: 0,
  };
  const reviewProgress: AutoBeProgressEventBase = {
    total: matrix.length,
    completed: 0,
  };

  const componentSchemas: AutoBeOpenApi.IComponentSchema[][] =
    await Promise.all(
      matrix.map(async (it) => {
        const row: AutoBeOpenApi.IComponentSchema[] = await divideAndConquer(
          ctx,
          operations,
          it,
          3,
          progress,
        );
        const newbie: AutoBeOpenApi.IComponentSchema[] =
          await orchestrateInterfaceSchemasReview(
            ctx,
            operations,
            row,
            reviewProgress,
          );
        return [...row, ...newbie];
      }),
    );
  return mergeOpenApiComponentSchemas(componentSchemas.flat());
}

async function divideAndConquer<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  operations: AutoBeOpenApi.IOperation[],
  typeNames: string[],
  retry: number,
  progress: AutoBeProgressEventBase,
): Promise<AutoBeOpenApi.IComponentSchema[]> {
  const remained: Set<string> = new Set(typeNames);
  const schemas: AutoBeOpenApi.IComponentSchema[] = [];
  for (let i: number = 0; i < retry; ++i) {
    if (remained.size === 0) break;
    const newbie: AutoBeOpenApi.IComponentSchema[] = await process(
      ctx,
      operations,
      schemas,
      remained,
      progress,
    );
    for (const cs of newbie) {
      schemas.push(cs);
      remained.delete(cs.key);
    }
  }
  return schemas;
}

async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  operations: AutoBeOpenApi.IOperation[],
  oldbie: AutoBeOpenApi.IComponentSchema[],
  remained: Set<string>,
  progress: AutoBeProgressEventBase,
): Promise<AutoBeOpenApi.IComponentSchema[]> {
  const already: string[] = Object.keys(oldbie);
  const pointer: IPointer<AutoBeOpenApi.IComponentSchema[] | null> = {
    value: null,
  };
  const { tokenUsage } = await ctx.conversate({
    source: "interfaceSchemas",
    histories: transformInterfaceSchemaHistories(ctx.state(), operations),
    controller: createController({
      model: ctx.model,
      build: async (next) => {
        pointer.value =
          pointer.value === null
            ? next
            : mergeOpenApiComponentSchemas([...pointer.value, ...next]);
      },
    }),
    enforceFunctionCall: true,
    message: [
      "Make type components please.",
      "",
      "Here is the list of request/response bodies' type names from",
      "OpenAPI operations. Make type components of them. If more object",
      "types are required during making the components, please make them",
      "too.",
      "",
      ...Array.from(remained).map((k) => `- \`${k}\``),
      ...(already.length !== 0
        ? [
            "",
            "> By the way, here is the list of components schemas what you've",
            "> already made. So, you don't need to make them again.",
            ">",
            ...already.map((k) => `> - \`${k}\``),
          ]
        : []),
    ].join("\n"),
  });
  if (pointer.value === null) {
    throw new Error("Failed to create components.");
    // return {};
  }

  // const schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
  //   (
  //     OpenApiV3_1Emender.convertComponents({
  //       schemas: pointer.value,
  //     }) as AutoBeOpenApi.IComponents
  //   ).schemas ?? {};
  ctx.dispatch({
    type: "interfaceSchemas",
    schemas: pointer.value,
    tokenUsage,
    completed: (progress.completed += pointer.value.length),
    total: progress.total,
    step: ctx.state().prisma?.step ?? 0,
    created_at: new Date().toISOString(),
  } satisfies AutoBeInterfaceSchemasEvent);
  return pointer.value;
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  build: (next: AutoBeOpenApi.IComponentSchema[]) => Promise<void>;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const application: ILlmApplication<Model> = collection[
    props.model
  ] satisfies ILlmApplication<any> as unknown as ILlmApplication<Model>;
  return {
    protocol: "class",
    name: "interface",
    application,
    execute: {
      makeComponents: async (next) => {
        await props.build(next.schemas);
      },
    } satisfies IAutoBeInterfaceSchemaApplication,
  };
}

const claude = typia.llm.application<
  IAutoBeInterfaceSchemaApplication,
  "claude"
>();
const collection = {
  chatgpt: typia.llm.application<
    IAutoBeInterfaceSchemaApplication,
    "chatgpt"
  >(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
};
