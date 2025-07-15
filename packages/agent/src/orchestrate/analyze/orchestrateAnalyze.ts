import {
  AutoBeAnalyzeHistory,
  AutoBeAssistantMessageHistory,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import typia from "typia";
import { v4 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { IAutoBeApplicationProps } from "../../context/IAutoBeApplicationProps";
import { AutoBeAnalyzePointer } from "./AutoBeAnalyzePointer";
import {
  IComposeInput,
  orchestrateAnalyzeComposer,
} from "./orchestrateAnalyzeComposer";
import { writeDocumentUntilReviewPassed } from "./writeDocumentUntilReviewPassed";

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
        [
          `Design a complete list of documents and user roles for this project.`,
          `Define user roles that can authenticate via API and create appropriate documentation files.`,
          `You must respect the number of documents specified by the user.`,
        ].join("\n"),
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
      describedFiles.map(async ({ filename }) => {
        const pointer: AutoBeAnalyzePointer = { value: { files: {} } };
        await writeDocumentUntilReviewPassed(
          ctx,
          pointer,
          describedFiles,
          filename,
          describedRoles,
          3,
        );
        return pointer;
      }),
    );

    console.log(JSON.stringify(pointers, null, 2));

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
