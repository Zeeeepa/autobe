import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeOpenApi } from "@autobe/interface";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";

export const transformRealizeWriteAuthorizationsHistories = (
  operation: AutoBeOpenApi.IOperation,
  payload: Record<string, string>,
): Array<IAgenticaHistoryJson.ISystemMessage> => {
  if (operation.authorizationType === null) return [];
  const history: IAgenticaHistoryJson.ISystemMessage = {
    id: v7(),
    created_at: new Date().toISOString(),
    type: "systemMessage" as const,
    text: PROMPTS[operation.authorizationType].replace(
      "${PAYLOAD}",
      JSON.stringify(payload),
    ),
  };
  return [history];
};

const PROMPTS = {
  login: AutoBeSystemPromptConstant.REALIZE_MEMBERSHIP_LOGIN,
  join: AutoBeSystemPromptConstant.REALIZE_MEMBERSHIP_JOIN,
  refresh: AutoBeSystemPromptConstant.REALIZE_MEMBERSHIP_REFRESH,
};
