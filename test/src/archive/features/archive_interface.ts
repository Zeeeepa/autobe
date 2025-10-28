import { AutoBeTokenUsage } from "@autobe/agent";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeEventOfSerializable,
  AutoBeEventSnapshot,
  AutoBeHistory,
  AutoBeInterfaceHistory,
  AutoBeUserMessageContent,
  AutoBeUserMessageHistory,
} from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import { TestFactory } from "../../TestFactory";
import { TestGlobal } from "../../TestGlobal";
import { prepare_agent_interface } from "../../features/interface/internal/prepare_agent_interface";
import { TestHistory } from "../../internal/TestHistory";
import { TestLogger } from "../../internal/TestLogger";
import { TestProject } from "../../structures/TestProject";

export const archive_interface = async (
  factory: TestFactory,
  project: TestProject,
) => {
  if (TestGlobal.env.OPENAI_API_KEY === undefined) return false;

  // PREPARE AGENT
  const { agent, zero } = await prepare_agent_interface(factory, project);
  const snapshots: AutoBeEventSnapshot[] = [];
  const start: Date = new Date();

  const listen = (event: AutoBeEventOfSerializable) => {
    if (TestGlobal.archive) TestLogger.event(start, event);
    snapshots.push({
      event,
      tokenUsage: agent.getTokenUsage().toJSON(),
    });
  };
  for (const type of typia.misc.literals<AutoBeEventOfSerializable.Type>())
    agent.on(type, listen);

  const userMessage: AutoBeUserMessageHistory =
    await TestHistory.getUserMessage(project, "interface");
  const go = (
    c: string | AutoBeUserMessageContent | AutoBeUserMessageContent[],
  ) => agent.conversate(c);

  // REQUEST INTERFACE GENERATION
  let histories: AutoBeHistory[] = await go(userMessage.contents);
  if (histories.every((h) => h.type !== "interface")) {
    histories = await go("Don't ask me to do that, and just do it right now.");
    if (histories.every((h) => h.type !== "interface")) {
      console.log(histories.map((h) => h.type));
      throw new Error("History type must be interface.");
    }
  }
  const result: AutoBeInterfaceHistory = histories.find(
    (h) => h.type === "interface",
  )!;

  // REPORT RESULT
  const model: string = TestGlobal.vendorModel;
  try {
    await FileSystemIterator.save({
      root: `${TestGlobal.ROOT}/results/${TestHistory.slugModel(model, false)}/${project}/interface`,
      files: {
        ...(await agent.getFiles()),
        "pnpm-workspace.yaml": "",
        "autobe/instruction.md": result.instruction,
      },
    });
  } catch {}
  await TestHistory.save({
    [`${project}.interface.json`]: JSON.stringify(agent.getHistories()),
    [`${project}.interface.snapshots.json`]: JSON.stringify(
      snapshots.map((s) => ({
        event: s.event,
        tokenUsage: new AutoBeTokenUsage(s.tokenUsage).increment(zero).toJSON(),
      })),
    ),
  });
  TestValidator.equals("missed", result.missed, []);
};
