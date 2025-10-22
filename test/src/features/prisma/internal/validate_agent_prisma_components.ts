import { orchestratePrismaComponents } from "@autobe/agent/src/orchestrate/prisma/orchestratePrismaComponent";
import {
  AutoBeAssistantMessageHistory,
  AutoBePrismaComponentEvent,
} from "@autobe/interface";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { TestHistory } from "../../../internal/TestHistory";
import { TestProject } from "../../../structures/TestProject";
import { prepare_agent_prisma } from "./prepare_agent_prisma";

export const validate_agent_prisma_components = async (
  factory: TestFactory,
  project: TestProject,
) => {
  if (TestGlobal.env.OPENAI_API_KEY === undefined) return false;

  const { agent } = await prepare_agent_prisma(factory, project);
  const result: AutoBePrismaComponentEvent | AutoBeAssistantMessageHistory =
    await orchestratePrismaComponents(
      agent.getContext(),
      "Design database without violation of normalization and integrity rules.",
    );
  if (result.type !== "prismaComponent")
    throw new Error("Failed to orchestrate prisma components");
  else if (TestGlobal.archive)
    await TestHistory.save({
      [`${project}.prisma.components.json`]: JSON.stringify(result),
    });
};
