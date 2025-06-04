import { IAgenticaController, MicroAgentica } from "@agentica/core";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";

import { AutoBeSystemPromptConstant } from "../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../context/AutoBeContext";
import { assertSchemaModel } from "../context/assertSchemaModel";
import {
  AutoBeAnalyzeFileSystem,
  IAutoBeAnalyzeFileSystem,
} from "./AutoBeAnalyzeFileSystem";
import { AutoBeAnalyzeReviewer } from "./AutoBeAnalyzeReviewer";

type Filename = string;
type FileContent = string;

export class AutoBeAnalyzeAgent<Model extends ILlmSchema.Model> {
  private readonly createAnalyzeAgent: () => MicroAgentica<Model>;
  private readonly fileMap: Record<Filename, FileContent> = {};

  constructor(
    private readonly createReviewerAgentFn: typeof AutoBeAnalyzeReviewer,
    private readonly ctx: AutoBeContext<Model>,
    private readonly pointer: IPointer<{
      files: Record<Filename, FileContent>;
    } | null>,
    filenames: string[],
  ) {
    assertSchemaModel(ctx.model);

    const controller = createController<Model>({
      model: ctx.model,
      execute: new AutoBeAnalyzeFileSystem(this.fileMap),
      build: async (files: Record<Filename, FileContent>) => {
        this.pointer.value = { files };
      },
    });

    this.createAnalyzeAgent = (): MicroAgentica<Model> => {
      const agent = new MicroAgentica({
        controllers: [controller],
        model: ctx.model,
        vendor: ctx.vendor,
        config: {
          locale: ctx.config?.locale,
          systemPrompt: {
            describe: () => {
              return "Answer only 'completion' or 'failure'.";
            },
          },
        },
        tokenUsage: ctx.usage(),
        histories: [
          {
            type: "systemMessage",
            text: AutoBeSystemPromptConstant.ANALYZE.replace(
              "{% User Locale %}",
              ctx.config?.locale ?? "en-US",
            ),
          },
          {
            type: "systemMessage",
            text: [
              "# Guidelines",
              "If the user specifies the exact number of pages, please follow it precisely.",
              AutoBeSystemPromptConstant.ANALYZE_GUIDELINE,
            ].join("\n"),
          },
          {
            type: "systemMessage",
            text: [
              "The following is the name of the entire file.",
              "Use it to build a table of contents.",
              filenames.map((filename) => `- ${filename}`),
              "",
              "However, do not touch other than the file you have to create.",
            ].join("\n"),
          },
        ],
      });

      agent.on("request", (event) => {
        if (event.body.tools) {
          event.body.tool_choice = "required";
        }
      });

      return agent;
    };
  }

  /**
   * Conversate with planner agent
   *
   * @param content Conversation from user in this time.
   * @returns
   */
  async conversate(content: string, retry = 3): Promise<string> {
    if (retry === 0) {
      return "Abort due to excess retry count";
    }

    const response = await this.createAnalyzeAgent().conversate(content);
    const lastMessage = response[response.length - 1]!;

    if ("text" in lastMessage) {
      this.ctx.dispatch({
        type: "analyzeWriteDocument",
        files: this.fileMap,
        created_at: new Date().toISOString(),
        step: this.ctx.state().analyze?.step ?? 0,
      });

      const aborted =
        lastMessage.type === "describe" &&
        lastMessage.executes.some((el) => {
          if (
            el.protocol === "class" &&
            el.operation.function.name === "abort"
          ) {
            el.arguments;
            return true;
          }
        });

      if (aborted === true) {
        return lastMessage.text;
      }

      const reviewer = this.createReviewerAgentFn(this.ctx, {
        query: content,
        files: JSON.stringify(this.fileMap),
      });

      const filenames = Object.keys(this.fileMap).join(",");
      const command = `Request for review of these files.: ${filenames}`;
      const [review] = await reviewer.conversate(command);

      if (review) {
        if (review.type === "assistantMessage") {
          this.ctx.dispatch({
            type: "analyzeReview",
            review: review.text,
            created_at: new Date().toISOString(),
            step: this.ctx.state().analyze?.step ?? 0,
          });

          return this.conversate(
            JSON.stringify({
              user_query: content,
              message: `THIS IS ANSWER OF REVIEW AGENT. FOLLOW THIS INSTRUCTIONS. AND DON\'T REQUEST ANYTHING.`,
              review: review.text,
            }),
            retry--,
          );
        }
      }

      return `COMPLETE WITHOUT REVIEW`;
    }

    return "COMPLETE";
  }
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  execute: AutoBeAnalyzeFileSystem;
  build: (input: Record<Filename, FileContent>) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);
  const application: ILlmApplication<Model> = collection[
    props.model
  ] as unknown as ILlmApplication<Model>;
  return {
    protocol: "class",
    name: "Planning",
    application,
    // execute: props.execute,
    execute: {
      removeFile: (input) => {
        const response = props.execute.removeFile(input);
        props.build(props.execute.allFiles());
        return response;
      },
      abort: (input) => {
        const response = props.execute.abort(input);
        props.build(props.execute.allFiles());
        return response;
      },
      createOrUpdateFiles: (input) => {
        const response = props.execute.createOrUpdateFiles(input);
        props.build(props.execute.allFiles());
        return response;
      },
    } satisfies IAutoBeAnalyzeFileSystem,
  };
}

const claude = typia.llm.application<
  AutoBeAnalyzeFileSystem,
  "claude",
  { reference: true }
>();
const collection = {
  chatgpt: typia.llm.application<
    AutoBeAnalyzeFileSystem,
    "chatgpt",
    { reference: true }
  >(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
  "3.0": typia.llm.application<AutoBeAnalyzeFileSystem, "3.0">(),
};
