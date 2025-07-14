import { IAgenticaController, MicroAgentica } from "@agentica/core";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import typia from "typia";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { enforceToolCall } from "../../utils/enforceToolCall";
import { IFile } from "./AutoBeAnalyzeFileSystem";
import { AutoBeAnalyzeRole } from "./AutoBeAnalyzeRole";

export interface IComposeInput {
  /** Reason for the analysis and composition of the project structure. */
  reason: string;

  /**
   * Prefix for file names and all prisma schema files, table, interface, and
   * variable names.
   */
  prefix: string;

  /** Roles to be assigned for the project */
  roles: AutoBeAnalyzeRole[];

  /**
   * If the user has requested a specific number of pages, enter that number.
   * Otherwise, provide an appropriate number of documents necessary to meet the
   * user's requirements. This number must always match the length of the files
   * property.
   */
  page: number;

  /**
   * # Document files to be generated
   *
   * File name must be English and it must contain the numbering and prefix.
   *
   * These files represent business documentation that may include:
   *
   * - Business requirements and functional specifications
   * - User journey mapping and use case scenarios
   * - Business rules and workflow definitions
   * - Service architecture and system design overview
   * - Data flow and integration requirements
   * - User roles and permission matrix
   * - API endpoint specifications and contracts
   * - Business logic and validation rules
   *
   * Generate files based on actual requirements gathered from conversation. Do
   * not create unnecessary documentation - only generate what is needed to
   * properly define the business requirements and system specifications.
   *
   * # Page Length Rules
   *
   * The number of documents must match the user's request, excluding the table
   * of contents. For example, if the user requests 3 pages, a total of 4
   * documents should be generated, including the table of contents. If the user
   * does not specify a number, generate a sufficient number of documents to
   * adequately support the service.
   */
  files: Array<Pick<IFile, "filename" | "reason">>;
}

export const orchestrateAnalyzeComposer = <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
) => {
  const controller = createController<Model>({
    model: ctx.model,
    execute: new AutoBeAnalyzeComposerApplication(),
  });

  const agent = new MicroAgentica({
    model: ctx.model,
    vendor: ctx.vendor,
    controllers: [controller],
    config: {
      locale: ctx.config?.locale,
      executor: {
        describe: null,
      },
    },
    histories: [
      ...ctx
        .histories()
        .filter(
          (h) => h.type === "userMessage" || h.type === "assistantMessage",
        ),
      {
        id: v4(),
        type: "systemMessage",
        text: AutoBeSystemPromptConstant.ANALYZE_PLANNER,
        created_at: new Date().toISOString(),
      },
    ],
  });

  return enforceToolCall(agent);
};

export interface IAutoBeAnalyzeComposerApplication {
  /**
   * Compose project structure with roles and files.
   *
   * Design a list of roles and initial documents that you need to create for
   * that requirement. Roles define team member responsibilities, while files
   * define the documentation structure. These are managed separately. If you
   * determine from the conversation that the user's requirements have not been
   * fully gathered, you must stop the analysis and continue collecting the
   * remaining requirements. In this case, you do not need to generate any files
   * or roles. Simply pass an empty array to `input.files` and `input.roles`.
   *
   * @param input Prefix, roles, and files
   * @returns
   */
  compose(input: IComposeInput): IComposeInput;
}

class AutoBeAnalyzeComposerApplication
  implements IAutoBeAnalyzeComposerApplication
{
  /**
   * Compose project structure with roles and files.
   *
   * Design a list of roles and initial documents that you need to create for
   * that requirement. Roles define team member responsibilities, while files
   * define the documentation structure. These are managed separately. If you
   * determine from the conversation that the user's requirements have not been
   * fully gathered, you must stop the analysis and continue collecting the
   * remaining requirements. In this case, you do not need to generate any files
   * or roles. Simply pass an empty array to `input.files` and `input.roles`.
   *
   * @param input Prefix, roles, and files
   * @returns
   */
  compose(input: IComposeInput): IComposeInput {
    return input;
  }
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  execute: AutoBeAnalyzeComposerApplication;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);
  const application: ILlmApplication<Model> = collection[
    props.model
  ] as unknown as ILlmApplication<Model>;
  return {
    protocol: "class",
    name: "Compose",
    application,
    execute: {
      compose: (input) => {
        return props.execute.compose(input);
      },
    } satisfies IAutoBeAnalyzeComposerApplication,
  };
}

const claude = typia.llm.application<
  AutoBeAnalyzeComposerApplication,
  "claude",
  { reference: true }
>();
const collection = {
  chatgpt: typia.llm.application<
    AutoBeAnalyzeComposerApplication,
    "chatgpt",
    { reference: true }
  >(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
};
