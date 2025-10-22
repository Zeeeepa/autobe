import { IAgenticaController } from "@agentica/core";
import { AutoBeOpenApi, AutoBeProgressEventBase } from "@autobe/interface";
import { AutoBeInterfacePrerequisite } from "@autobe/interface/src/histories/contents/AutoBeInterfacePrerequisite";
import { AutoBeOpenApiEndpointComparator } from "@autobe/utils";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { HashMap, IPointer, Pair } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeConfigConstant } from "../../constants/AutoBeConfigConstant";
import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { divideArray } from "../../utils/divideArray";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { transformInterfacePrerequisitesHistories } from "./histories/transformInterfacePrerequisitesHistories";
import { IAutoBeInterfacePrerequisitesApplication } from "./structures/IAutoBeInterfacePrerequisitesApplication";

export async function orchestrateInterfacePrerequisites<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  document: AutoBeOpenApi.IDocument,
  capacity: number = AutoBeConfigConstant.INTERFACE_CAPACITY,
): Promise<AutoBeInterfacePrerequisite[]> {
  const operations: AutoBeOpenApi.IOperation[] =
    document.operations.filter((op) => op.authorizationType === null) ?? [];
  const progress: AutoBeProgressEventBase = {
    total: operations.length,
    completed: 0,
  };
  const prerequisiteOperations: AutoBeOpenApi.IOperation[] =
    document.operations.filter(
      (op) => op.authorizationType === null && op.method === "post",
    );

  const dict: HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation> =
    new HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation>(
      prerequisiteOperations.map(
        (op) => new Pair({ path: op.path, method: op.method }, op),
      ),
      AutoBeOpenApiEndpointComparator.hashCode,
      AutoBeOpenApiEndpointComparator.equals,
    );

  const prerequisitesNotFound: string = [
    `You have to select one of the endpoints below`,
    "",
    " method | path ",
    "--------|------",
    ...prerequisiteOperations
      .map((op) => `\`${op.method}\` | \`${op.path}\``)
      .join("\n"),
  ].join("\n");

  const exclude: AutoBeInterfacePrerequisite[] = [];
  let include: AutoBeOpenApi.IOperation[] = [...operations];
  let trial: number = 0;

  do {
    const matrix: AutoBeOpenApi.IOperation[][] = divideArray({
      array: include,
      capacity: capacity ?? AutoBeConfigConstant.INTERFACE_CAPACITY,
    });

    await executeCachedBatch(
      matrix.map((ops) => async (promptCacheKey) => {
        const row: AutoBeInterfacePrerequisite[] = await divideAndConquer(ctx, {
          dict: dict,
          document,
          includes: ops,
          progress,
          promptCacheKey,
          prerequisitesNotFound,
        });
        exclude.push(...row);
        return row;
      }),
    );
    include = include.filter((op) => {
      if (
        exclude.some(
          (el) =>
            el.endpoint.method === op.method && el.endpoint.path === op.path,
        )
      ) {
        return false;
      }
      return true;
    });
  } while (include.length > 0 && ++trial < ctx.retry);
  return exclude;
}

async function divideAndConquer<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    dict: HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation>;
    document: AutoBeOpenApi.IDocument;
    includes: AutoBeOpenApi.IOperation[];
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
    prerequisitesNotFound: string;
  },
): Promise<AutoBeInterfacePrerequisite[]> {
  const pointer: IPointer<AutoBeInterfacePrerequisite[] | null> = {
    value: null,
  };

  try {
    const { tokenUsage } = await ctx.conversate({
      source: "interfacePrerequisite",
      controller: createController({
        model: ctx.model,
        document: props.document,
        dict: props.dict,
        includes: props.includes,
        prerequisitesNotFound: props.prerequisitesNotFound,
        build: (next) => {
          pointer.value = next;
        },
      }),
      histories: transformInterfacePrerequisitesHistories(
        props.document,
        props.includes,
      ),
      enforceFunctionCall: true,
      promptCacheKey: props.promptCacheKey,
      message: "Create prerequisite for the given operations",
    });
    if (pointer.value === null) return [];

    props.progress.completed += pointer.value.length;
    ctx.dispatch({
      type: "interfacePrerequisite",
      id: v7(),
      created_at: new Date().toISOString(),
      tokenUsage,
      operations: pointer.value,
      total: props.progress.total,
      completed: props.progress.completed,
      step: ctx.state().prisma?.step ?? 0,
    });
    return pointer.value;
  } catch {
    props.progress.completed += props.includes.length;
    return [];
  }
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  document: AutoBeOpenApi.IDocument;
  dict: HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation>;
  includes: AutoBeOpenApi.IOperation[];
  prerequisitesNotFound: string;
  build: (next: AutoBeInterfacePrerequisite[]) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const validate = (
    next: unknown,
  ): IValidation<IAutoBeInterfacePrerequisitesApplication.IProps> => {
    const result: IValidation<IAutoBeInterfacePrerequisitesApplication.IProps> =
      typia.validate<IAutoBeInterfacePrerequisitesApplication.IProps>(next);
    if (result.success === false) return result;

    const operations: AutoBeInterfacePrerequisite[] = result.data.operations;
    const filteredOperations: AutoBeInterfacePrerequisite[] = [];
    const errors: IValidation.IError[] = [];

    props.includes.forEach((el) => {
      // Find the matched operation in the includes
      const matched: AutoBeInterfacePrerequisite | undefined = operations.find(
        (op) =>
          op.endpoint.method === el.method && op.endpoint.path === el.path,
      );

      // Remove duplicate operations in Prerequisites
      if (matched) {
        const prerequisites: Map<string, AutoBeOpenApi.IPrerequisite> =
          new Map();
        matched.prerequisites.forEach((op) => {
          if (
            prerequisites.get(op.endpoint.method + op.endpoint.path) !==
            undefined
          ) {
            return;
          }
          prerequisites.set(op.endpoint.method + op.endpoint.path, op);
        });
        matched.prerequisites = Array.from(prerequisites.values());
        filteredOperations.push(matched);
      }
    });

    filteredOperations.forEach((op, i) => {
      op.prerequisites.forEach((p, j) => {
        if (props.dict.has(p.endpoint) === false) {
          errors.push({
            value: p.endpoint,
            path: `$input.operations[${i}].prerequisites[${j}].endpoint`,
            expected: "AutoBeOpenApi.IEndpoint",
            description: props.prerequisitesNotFound,
          });
        }

        if (
          p.endpoint.method === op.endpoint.method &&
          p.endpoint.path === op.endpoint.path
        ) {
          errors.push({
            value: p.endpoint,
            path: `$input.operations[${i}].prerequisites[${j}].endpoint`,
            expected: "AutoBeOpenApi.IEndpoint",
            description: "Self-reference is not allowed.",
          });
        }
      });
    });

    return errors.length === 0
      ? {
          ...result,
          data: {
            ...result.data,
            operations: filteredOperations,
          },
        }
      : {
          success: false,
          data: {
            ...result.data,
            operations: filteredOperations,
          },
          errors,
        };
  };

  const application: ILlmApplication<Model> = collection[
    props.model === "chatgpt" ? "chatgpt" : "claude"
  ](
    validate,
  ) satisfies ILlmApplication<any> as unknown as ILlmApplication<Model>;

  return {
    protocol: "class",
    name: "interface",
    application,
    execute: {
      makePrerequisite: (next) => {
        props.build(next.operations);
      },
    } satisfies IAutoBeInterfacePrerequisitesApplication,
  };
}

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<IAutoBeInterfacePrerequisitesApplication, "chatgpt">({
      validate: {
        makePrerequisite: validate,
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<IAutoBeInterfacePrerequisitesApplication, "claude">({
      validate: {
        makePrerequisite: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeInterfacePrerequisitesApplication.IProps>;
