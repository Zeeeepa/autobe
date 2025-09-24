import { IAgenticaHistoryJson } from "@agentica/core";
import { IAutoBeTypeScriptCompileResult } from "@autobe/interface";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { transformCommonCorrectCastingHistories } from "../../common/histories/transformCommonCorrectCastingHistories";

interface IFailure {
  diagnostics: IAutoBeTypeScriptCompileResult.IDiagnostic[];
  script: string;
}

export const transformRealizeCorrectCastingHistories = (
  failures: IFailure[],
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  const [system, ...diagnostics] =
    transformCommonCorrectCastingHistories(failures);

  return [
    system,
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.REALIZE_CORRECT_CASTING,
    },
    ...diagnostics,
  ];
};
