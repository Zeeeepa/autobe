import {
  AutoBeEvent,
  AutoBeEventSnapshot,
  AutoBeHistory,
} from "@autobe/interface";
import { AutoBeModifyStartEvent } from "@autobe/interface/src/events/AutoBeModifyStartEvent";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { TestProject } from "../../../structures/TestProject";
import { prepare_agent_modify } from "./prepare_agent_modify";

export const validate_agent_modify_main = async (
  factory: TestFactory,
  project: TestProject,
) => {
  if (TestGlobal.env.CHATGPT_API_KEY === undefined) return false;

  const { agent } = await prepare_agent_modify(factory, project);
  const snapshots: AutoBeEventSnapshot[] = [];
  const listen = (event: AutoBeEvent) => {
    snapshots.push({
      event,
      tokenUsage: agent.getTokenUsage().toJSON(),
    });
  };

  agent.on("modifyStart", listen);

  let start: AutoBeModifyStartEvent | null = null;
  agent.on("modifyStart", (event) => {
    start = event;
  });

  // GENERATE MODIFY EVENT
  const go = (message: string) => agent.conversate(message);
  let results: AutoBeHistory[] = await go("You should use soft-delete");
  if (start === null) {
    results = await go("Don't ask me to do that, and just do it right now.");
    if (start === null) {
      throw new Error("Some history type must be modify.");
    }
  }

  results;
};
