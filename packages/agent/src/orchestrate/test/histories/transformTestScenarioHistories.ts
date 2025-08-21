import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeOpenApi } from "@autobe/interface";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";

export const transformTestScenarioHistories = (
  entire: AutoBeOpenApi.IOperation[],
  include: AutoBeOpenApi.IOperation[],
  exclude: Pick<AutoBeOpenApi.IOperation, "method" | "path">[],
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  // Extract authentication operations grouped by role and type
  const authOperationsByRole = new Map<string, Map<string, AutoBeOpenApi.IOperation[]>>();
  
  entire.forEach((op) => {
    if (op.authorizationType && op.authorizationRole) {
      if (!authOperationsByRole.has(op.authorizationRole)) {
        authOperationsByRole.set(op.authorizationRole, new Map());
      }
      const roleMap = authOperationsByRole.get(op.authorizationRole)!;
      if (!roleMap.has(op.authorizationType)) {
        roleMap.set(op.authorizationType, []);
      }
      roleMap.get(op.authorizationType)!.push(op);
    }
  });

  // Find unique roles in included operations
  const rolesInInclude = new Set<string>();
  include.forEach((op) => {
    if (op.authorizationRole) {
      rolesInInclude.add(op.authorizationRole);
    }
  });

  return [
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.TEST_SCENARIO,
    } satisfies IAgenticaHistoryJson.ISystemMessage,
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: [
        "# Operations",
        "Below are the full operations. Please refer to this.",
        "Your role is to draft all test cases for each given Operation.",
        "It is also permissible to write multiple test codes on a single endpoint.",
        "However, rather than meaningless tests, business logic tests should be written and an E2E test situation should be assumed.",
        "",
        "Please carefully analyze each operation to identify all dependencies required for testing.",
        "For example, if you want to test liking and then deleting a post,",
        "you might think to test post creation, liking, and unlike operations.",
        "However, even if not explicitly mentioned, user registration and login are essential prerequisites.",
        "Pay close attention to IDs and related values in the API,",
        "and ensure you identify all dependencies between endpoints.",
        "",
        "```json",
        JSON.stringify(
          entire.map((el) => ({
            ...el,
            specification: undefined,
          })),
        ),
        "```",
      ].join("\n"),
    } satisfies IAgenticaHistoryJson.ISystemMessage,
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: [
        "# Available Authentication Operations by Role",
        "",
        "The following authentication operations are available in the system:",
        ...(authOperationsByRole.size > 0 ? 
          Array.from(authOperationsByRole.entries()).flatMap(([role, typeMap]) => [
            `## ${role.charAt(0).toUpperCase() + role.slice(1)} Role:`,
            ...Array.from(typeMap.entries()).flatMap(([authType, operations]) => [
              `- **${authType}** operations:`,
              ...operations.map(op => `  - ${op.method.toUpperCase()}: ${op.path}`)
            ]),
            ""
          ]) : ["No authentication operations found in the system.", ""]
        ),
        "**CRITICAL AUTHENTICATION REQUIREMENTS:**",
        "When generating test scenarios, you MUST ensure proper authentication dependencies:",
        "1. Any operation requiring a specific role MUST include the corresponding 'join' operation in dependencies",
        "2. If multiple actors are involved in a scenario, include 'login' operations for user role switching",
        "3. Authentication operations must be ordered correctly: join → login → target operation",
        "",
        rolesInInclude.size > 0 ? 
          `**Roles Required in Current Test Plan:** ${Array.from(rolesInInclude).join(", ")}` :
          "**No roles required in current test plan (all operations are public)**"
      ].join("\n"),
    } satisfies IAgenticaHistoryJson.ISystemMessage,
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: [
        "# Included in Test Plan",
        include
          .map(
            (el) =>
              `- ${el.method.toUpperCase()}: ${el.path} ${el.authorizationRole ? `(Role: ${el.authorizationRole})` : ""}${el.authorizationType ? ` [AUTH: ${el.authorizationType}]` : ""}`,
          )
          .join("\n"),
        "",
        "# Excluded from Test Plan",
        "These are the endpoints that have already been used in test codes generated as part of a plan group.",
        "These endpoints do not need to be tested again.",
        "However, it is allowed to reference or depend on these endpoints when writing test codes for other purposes.",
        exclude
          .map((el) => `- ${el.method.toUpperCase()}: ${el.path}`)
          .join("\n"),
      ].join("\n"),
    } satisfies IAgenticaHistoryJson.ISystemMessage,
  ];
};
