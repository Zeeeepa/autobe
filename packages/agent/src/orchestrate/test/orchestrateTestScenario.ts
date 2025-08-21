import { IAgenticaController } from "@agentica/core";
import {
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeTestScenario,
} from "@autobe/interface";
import { AutoBeEndpointComparator } from "@autobe/utils";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { HashMap, IPointer, Pair } from "tstl";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { divideArray } from "../../utils/divideArray";
import { transformTestScenarioHistories } from "./histories/transformTestScenarioHistories";
import { IAutoBeTestScenarioApplication } from "./structures/IAutoBeTestScenarioApplication";

export async function orchestrateTestScenario<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
): Promise<AutoBeTestScenario[]> {
  const operations: AutoBeOpenApi.IOperation[] =
    ctx.state().interface?.document.operations ?? [];
  if (operations.length === 0) {
    throw new Error(
      "Cannot write test scenarios because these are no operations.",
    );
  }

  const dict: HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation> =
    new HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation>(
      operations.map(
        (op) =>
          new Pair(
            {
              path: op.path,
              method: op.method,
            },
            op,
          ),
      ),
      AutoBeEndpointComparator.hashCode,
      AutoBeEndpointComparator.equals,
    );
  const endpointNotFound: string = [
    `You have to select one of the endpoints below`,
    "",
    " method | path ",
    "--------|------",
    ...operations.map((op) => `\`${op.method}\` | \`${op.path}\``).join("\n"),
  ].join("\n");

  const progress: AutoBeProgressEventBase = {
    total: operations.length,
    completed: 0,
  };
  const exclude: IAutoBeTestScenarioApplication.IScenarioGroup[] = [];
  let include: AutoBeOpenApi.IOperation[] = Array.from(operations);

  do {
    const matrix: AutoBeOpenApi.IOperation[][] = divideArray({
      array: include,
      capacity: 5,
    });
    await Promise.all(
      matrix.map(async (include) => {
        exclude.push(
          ...(await divideAndConquer(
            ctx,
            dict,
            endpointNotFound,
            operations,
            include,
            exclude.map((x) => x.endpoint),
            progress,
          )),
        );
      }),
    );
    include = include.filter((op) => {
      if (
        exclude.some(
          (pg) =>
            pg.endpoint.method === op.method && pg.endpoint.path === op.path,
        )
      ) {
        return false;
      }
      return true;
    });
  } while (include.length > 0);

  return exclude.flatMap((pg) => {
    return pg.scenarios.map((plan) => {
      return {
        endpoint: pg.endpoint,
        draft: plan.draft,
        functionName: plan.functionName,
        dependencies: plan.dependencies,
      } satisfies AutoBeTestScenario;
    });
  });
}

const divideAndConquer = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  dict: HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation>,
  endpointNotFound: string,
  entire: AutoBeOpenApi.IOperation[],
  include: AutoBeOpenApi.IOperation[],
  exclude: AutoBeOpenApi.IEndpoint[],
  progress: AutoBeProgressEventBase,
) => {
  const pointer: IPointer<IAutoBeTestScenarioApplication.IScenarioGroup[]> = {
    value: [],
  };
  const { tokenUsage } = await ctx.conversate({
    source: "testScenarios",
    histories: transformTestScenarioHistories(entire, include, exclude),
    controller: createController({
      model: ctx.model,
      endpointNotFound,
      dict,
      operations: entire,
      build: (next) => {
        pointer.value ??= [];
        pointer.value.push(...next.scenarioGroups);
      },
    }),
    enforceFunctionCall: true,
    message: `Create e2e test scenarios.`,
  });
  if (pointer.value.length === 0) return [];
  ctx.dispatch({
    type: "testScenarios",
    tokenUsage,
    scenarios: pointer.value
      .map((v) =>
        v.scenarios.map(
          (s) =>
            ({
              endpoint: v.endpoint,
              draft: s.draft,
              functionName: s.functionName,
              dependencies: s.dependencies,
            }) satisfies AutoBeTestScenario,
        ),
      )
      .flat(),
    completed: ++progress.completed,
    total: progress.total,
    step: ctx.state().interface?.step ?? 0,
    created_at: new Date().toISOString(),
  });
  return pointer.value;
};

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  endpointNotFound: string;
  dict: HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation>;
  operations: AutoBeOpenApi.IOperation[];
  build: (next: IAutoBeTestScenarioApplication.IProps) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const validate = (
    next: unknown,
  ): IValidation<IAutoBeTestScenarioApplication.IProps> => {
    const result: IValidation<IAutoBeTestScenarioApplication.IProps> =
      typia.validate<IAutoBeTestScenarioApplication.IProps>(next);
    if (result.success === false) return result;

    // merge to unique scenario groups
    const scenarioGroups: IAutoBeTestScenarioApplication.IScenarioGroup[] = [];
    result.data.scenarioGroups.forEach((sg) => {
      const created = scenarioGroups.find(
        (el) =>
          el.endpoint.method === sg.endpoint.method &&
          el.endpoint.path === sg.endpoint.path,
      );
      if (created) {
        created.scenarios.push(...sg.scenarios);
      } else {
        scenarioGroups.push(sg);
      }
    });

    // validate endpoints
    const errors: IValidation.IError[] = [];
    scenarioGroups.forEach((group, i) => {
      if (props.dict.has(group.endpoint) === false)
        errors.push({
          value: group.endpoint,
          path: `$input.scenarioGroups[${i}].endpoint`,
          expected: "AutoBeOpenApi.IEndpoint",
          description: props.endpointNotFound,
        });
      group.scenarios.forEach((s, j) => {
        s.dependencies.forEach((dep, k) => {
          if (props.dict.has(dep.endpoint) === false)
            errors.push({
              value: dep.endpoint,
              path: `$input.scenarioGroups[${i}].scenarios[${j}].dependencies[${k}].endpoint`,
              expected: "AutoBeOpenApi.IEndpoint",
              description: props.endpointNotFound,
            });
        });
      });
    });

    // automatically fill authentication dependencies
    scenarioGroups.forEach((group) => {
      const targetOperation = props.dict.get(group.endpoint);
      if (targetOperation && targetOperation.authorizationRole) {
        group.scenarios.forEach((scenario) => {
          // Check if scenario includes "join" operation for the required role
          const hasJoinDependency = scenario.dependencies.some((dep) => {
            const depOperation = props.dict.get(dep.endpoint);
            return (
              depOperation &&
              depOperation.authorizationType === "join" &&
              depOperation.authorizationRole === targetOperation.authorizationRole
            );
          });

          // Automatically add missing join dependency
          if (!hasJoinDependency) {
            // Find the appropriate join operation for this role
            const joinOperation = props.operations.find(
              (op: AutoBeOpenApi.IOperation) =>
                op.authorizationType === "join" &&
                op.authorizationRole === targetOperation.authorizationRole,
            );
            
            if (joinOperation) {
              scenario.dependencies.unshift({
                endpoint: {
                  method: joinOperation.method as any,
                  path: joinOperation.path,
                },
                purpose: `Register as ${targetOperation.authorizationRole} to access this operation`,
              });
            }
          }

          // Check for multiple roles in dependencies (indicating user switching)
          const rolesInDependencies = new Set<string>();
          scenario.dependencies.forEach((dep) => {
            const depOperation = props.dict.get(dep.endpoint);
            if (depOperation && depOperation.authorizationRole) {
              rolesInDependencies.add(depOperation.authorizationRole);
            }
          });

          // Add target operation role to the set as well
          if (targetOperation.authorizationRole) {
            rolesInDependencies.add(targetOperation.authorizationRole);
          }

          // If there are multiple roles involved, automatically add login operations
          if (rolesInDependencies.size > 1) {
            rolesInDependencies.forEach((role) => {
              const hasLoginDependency = scenario.dependencies.some((dep) => {
                const depOperation = props.dict.get(dep.endpoint);
                return (
                  depOperation &&
                  depOperation.authorizationType === "login" &&
                  depOperation.authorizationRole === role
                );
              });

              // Automatically add missing login dependency
              if (!hasLoginDependency) {
                const loginOperation = props.operations.find(
                  (op: AutoBeOpenApi.IOperation) =>
                    op.authorizationType === "login" &&
                    op.authorizationRole === role,
                );
                
                if (loginOperation) {
                  // Find the position to insert login after join for the same role
                  let insertIndex = scenario.dependencies.length;
                  for (let i = 0; i < scenario.dependencies.length; i++) {
                    const dep = scenario.dependencies[i];
                    const depOperation = props.dict.get(dep.endpoint);
                    if (
                      depOperation &&
                      depOperation.authorizationType === "join" &&
                      depOperation.authorizationRole === role
                    ) {
                      insertIndex = i + 1;
                      break;
                    }
                  }
                  
                  scenario.dependencies.splice(insertIndex, 0, {
                    endpoint: {
                      method: loginOperation.method as any,
                      path: loginOperation.path,
                    },
                    purpose: `Login as ${role} for role switching in this scenario`,
                  });
                }
              }
            });
          }
        });
      }
    });
    return errors.length === 0
      ? {
          success: true,
          data: {
            scenarioGroups,
          },
        }
      : {
          success: false,
          data: {
            scenarioGroups,
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
    name: "Make test plans",
    application,
    execute: {
      makeScenario: (next) => {
        props.build(next);
      },
    } satisfies IAutoBeTestScenarioApplication,
  };
}

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<IAutoBeTestScenarioApplication, "chatgpt">({
      validate: {
        makeScenario: validate,
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<IAutoBeTestScenarioApplication, "claude">({
      validate: {
        makeScenario: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeTestScenarioApplication.IProps>;
