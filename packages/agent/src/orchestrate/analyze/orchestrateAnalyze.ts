import {
  AutoBeAnalyzeHistory,
  AutoBeAssistantMessageHistory,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import typia from "typia";
import { v4 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { IAutoBeApplicationProps } from "../../context/IAutoBeApplicationProps";
import { AutoBeAnalyzeAgent } from "./AutoBeAnalyzeAgent";
import { AutoBeAnalyzePointer } from "./AutoBeAnalyzePointer";
import { AutoBeAnalyzeReviewer } from "./AutoBeAnalyzeReviewer";
import {
  IComposeInput,
  orchestrateAnalyzeComposer,
} from "./orchestrateAnalyzeComposer";

/** @todo Kakasoo */
export const orchestrateAnalyze =
  <Model extends ILlmSchema.Model>(ctx: AutoBeContext<Model>) =>
  async (
    props: IAutoBeApplicationProps,
  ): Promise<AutoBeAssistantMessageHistory | AutoBeAnalyzeHistory> => {
    const step = ctx.state().analyze?.step ?? 0;
    const created_at = new Date().toISOString();
    ctx.dispatch({
      type: "analyzeStart",
      reason: props.reason,
      step,
      created_at,
    });

    const agentica = orchestrateAnalyzeComposer(ctx);

    const determined = await agentica
      .conversate(
        "Design a complete list of documents and user roles for this project. Define user roles that can authenticate via API and create appropriate documentation files.",
      )
      .finally(() => {
        const tokenUsage = agentica.getTokenUsage();
        ctx.usage().record(tokenUsage, ["analyze"]);
      });

    const lastMessage = determined[determined.length - 1]!;
    if (lastMessage.type === "assistantMessage") {
      const history: AutoBeAssistantMessageHistory = {
        id: v4(),
        type: "assistantMessage",
        text: lastMessage.text,
        created_at,
        completed_at: new Date().toISOString(),
      };
      ctx.dispatch({
        type: "assistantMessage",
        text: lastMessage.text,
        created_at,
      });
      return history;
    }

    const described = determined.find((el) => el.type === "describe");
    const determinedOutput = described?.executes.find(
      (el) => el.protocol === "class" && typia.is<IComposeInput>(el.value),
    )?.value as IComposeInput;

    console.log(JSON.stringify(determinedOutput, null, 2));

    const prefix = determinedOutput.prefix;
    const describedRoles = determinedOutput.roles;
    const describedFiles = determinedOutput.files;

    if (describedFiles.length === 0) {
      const history: AutoBeAssistantMessageHistory = {
        id: v4(),
        type: "assistantMessage",
        text: "The current requirements are insufficient, so file generation will be suspended. It would be better to continue the conversation.",
        created_at,
        completed_at: new Date().toISOString(),
      };
      ctx.dispatch({
        type: "assistantMessage",
        text: "The current requirements are insufficient, so file generation will be suspended. It would be better to continue the conversation.",
        created_at,
      });
      return history;
    }

    const pointers = await Promise.all(
      describedFiles.map(async ({ filename, reason }) => {
        const pointer: AutoBeAnalyzePointer = { value: null };

        const agent = new AutoBeAnalyzeAgent(
          AutoBeAnalyzeReviewer,
          ctx,
          pointer,
          describedFiles.map((el) => el.filename),
        );

        await agent.conversate(
          [
            `# Instruction`,
            `The names of all the files are as follows: ${describedFiles.map((f) => f.filename).join(",")}`,
            "Assume that all files are in the same folder. Also, when pointing to the location of a file, go to the relative path.",
            "",
            `The following user roles have been defined for this system:`,
            ...describedRoles.map(
              (role) => `- ${role.name}: ${role.description}`,
            ),
            "These roles will be used for API authentication and should be considered when creating documentation.",
            "",
            `Document Length Specification:`,
            `- You are responsible for writing ONLY ONE document: ${filename}`,
            `- Each page should contain approximately 2,000 characters`,
            `- DO NOT write content for other documents - focus only on ${filename}`,
            "",
            `Among the various documents, the part you decided to take care of is as follows.: ${filename}`,
            `Only write this document named '${filename}'.`,
            "Never write other documents.",
            "",
            "The reason why this document needs to be written is as follows.",
            `- reason: ${reason}`,
          ].join("\n"),
        );

        return pointer;
      }),
    );

    const files = pointers
      .map((pointer) => {
        return pointer.value?.files ?? {};
      })
      .reduce((acc, cur) => Object.assign(acc, cur));

    if (Object.keys(files).length) {
      const history: AutoBeAnalyzeHistory = {
        id: v4(),
        type: "analyze",
        reason: props.reason,
        prefix,
        roles: describedRoles,
        files: files,
        step,
        created_at,
        completed_at: new Date().toISOString(),
      };
      ctx.state().analyze = history;
      ctx.histories().push(history);
      ctx.dispatch({
        type: "analyzeComplete",
        prefix,
        files: files,
        step,
        created_at,
      });
      return history;
    }

    const history: AutoBeAssistantMessageHistory = {
      id: v4(),
      type: "assistantMessage",
      text: determined.find((el) => el.type === "assistantMessage")?.text ?? "",
      created_at,
      completed_at: new Date().toISOString(),
    };
    ctx.dispatch({
      type: "assistantMessage",
      text: determined.find((el) => el.type === "assistantMessage")?.text ?? "",
      created_at,
    });
    return history;
  };
