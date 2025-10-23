import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeState } from "../../../context/AutoBeState";
import { transformInterfaceAssetHistories } from "./transformInterfaceAssetHistories";

export const transformInterfaceSchemaReviewHistories = (props: {
  state: AutoBeState;
  systemPrompt: string;
  instruction: string;
  operations: AutoBeOpenApi.IOperation[];
  everySchemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
  reviewSchemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
}): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  return [
    {
      type: "systemMessage",
      id: v7(),
      created_at: new Date().toISOString(),
      text: props.systemPrompt,
    },
    ...transformInterfaceAssetHistories(props.state),
    {
      type: "assistantMessage",
      id: v7(),
      created_at: new Date().toISOString(),
      text: StringUtil.trim`
        ## API Design Instructions

        The following API-specific instructions were extracted from
        the user's requirements. These focus on API interface design aspects
        relevant to the review task.

        Follow these instructions when reviewing and fixing schemas.
        Carefully distinguish between:
        - Suggestions or recommendations (consider these as guidance)
        - Direct specifications or explicit commands (these must be followed exactly)

        When instructions contain direct specifications or explicit design decisions,
        follow them precisely even if you believe you have better alternatives.

        ${props.instruction}

        ## Schemas (Complete Set for Reference)

        Here is the COMPLETE set of all schemas in the system for
        reference context:

        \`\`\`json
        ${JSON.stringify(props.everySchemas)}
        \`\`\`
      `,
    },
    {
      id: v7(),
      type: "assistantMessage",
      created_at: new Date().toISOString(),
      text: StringUtil.trim`
        ## Schemas Needing Review

        From the complete schema set above, here are the SPECIFIC schemas that need review:

        \`\`\`json
        ${JSON.stringify(props.reviewSchemas)}
        \`\`\`

        IMPORTANT: Only these ${Object.keys(props.reviewSchemas).length} schemas
        need review and potential modification. The other schemas in
        the full set are provided for reference only.

        ## Operations (Filtered for Target Schemas)

        Here are the API operations that directly use the schemas under review.
        These operations reference at least one of the target schemas via
        requestBody.typeName or responseBody.typeName.

        This FILTERED list helps you understand the exact usage context for
        the schemas you're reviewing:

        \`\`\`json
        ${JSON.stringify(props.operations)}
        \`\`\`
      `,
    },
  ];
};
