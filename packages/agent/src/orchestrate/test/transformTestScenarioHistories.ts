import { IAgenticaHistoryJson } from "@agentica/core";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../context/AutoBeState";

export const transformTestScenarioHistories = (
  state: AutoBeState,
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  if (state.analyze === null)
    return [
      {
        id: v4(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: [
          "Requirement analysis is not yet completed.",
          "Don't call the any tool function,",
          "but say to process the requirement analysis.",
        ].join(" "),
      },
    ];
  else if (state.prisma === null)
    return [
      {
        id: v4(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: [
          "Prisma DB schema generation is not yet completed.",
          "Don't call the any tool function,",
          "but say to process the Prisma DB schema generation.",
        ].join(" "),
      },
    ];
  else if (state.analyze.step !== state.prisma.step)
    return [
      {
        id: v4(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: [
          "Prisma DB schema generation has not been updated",
          "for the latest requirement analysis.",
          "Don't call the any tool function,",
          "but say to re-process the Prisma DB schema generation.",
        ].join(" "),
      },
    ];
  else if (state.prisma.compiled.type !== "success")
    return [
      {
        id: v4(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: [
          "Prisma DB schema generation has not been updated",
          "for the latest requirement analysis.",
          "Don't call the any tool function,",
          "but say to re-process the Prisma DB schema generation.",
        ].join(" "),
      },
    ];
  else if (state.interface === null)
    return [
      {
        id: v4(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: [
          "Interface generation is not yet completed.",
          "Don't call the any tool function,",
          "but say to process the interface generation.",
        ].join(" "),
      },
    ];

  return [
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.TEST,
    },
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: [
        "# Result of Interfaced Agent",
        "- OpenAPI document generation is ready.",
        "",
        "Call the provided tool function to generate the user scenarios",
        "referencing below OpenAPI document.",
        "",
        `## OpenAPI Document`,
        "```json",
        JSON.stringify(state.interface.document),
        "```",
      ].join("\n"),
    },
  ];
};
