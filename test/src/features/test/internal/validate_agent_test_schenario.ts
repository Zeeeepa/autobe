import { orchestrateTestScenario } from "@autobe/agent/src/orchestrate/test/orchestrateTestScenario";
import { AutoBeEvent } from "@autobe/interface";
import { IAutoBeTestPlan } from "@autobe/interface/src/test/AutoBeTestPlan";
import typia from "typia";

import { TestGlobal } from "../../../TestGlobal";
import { prepare_agent_test } from "./prepare_agent_test";

export const validate_agent_test_scenario = async (
  _owner: string,
  project: "bbs-backend",
) => {
  if (TestGlobal.env.CHATGPT_API_KEY === undefined) return false;

  const { agent } = await prepare_agent_test(project);

  const events: AutoBeEvent[] = [];
  agent.on("testStart", (event) => {
    events.push(event);
  });
  agent.on("testScenario", (event) => {
    events.push(event);
  });
  agent.on("testComplete", (event) => {
    events.push(event);
  });

  const result = await orchestrateTestScenario(
    agent.getContext(),
    getTestPlanGroups(project),
  );
  typia.assert(result);
  return result;
};

const getTestPlanGroups = (
  project: "bbs-backend",
): IAutoBeTestPlan.IPlanGroup[] =>
  project === "bbs-backend"
    ? [
        {
          method: "delete",
          path: "/votes/votes/{id}",
          plans: [
            {
              functionName: "test_api_remove_voting",
              draft:
                "Delete a vote as the owner or admin and confirm it is removed from vote listings and content tallies are updated. Attempt deletion as non-owner/non-admin, or delete a non-existent vote, and check for errors. Confirm audit logging if implemented.",
              dependsOn: [
                {
                  method: "post",
                  path: "/core/users",
                  purpose: "Create a user to cast the vote.",
                },
                {
                  method: "post",
                  path: "/core/categories",
                  purpose: "Create a category for reference.",
                },
                {
                  method: "post",
                  path: "/posts/posts",
                  purpose: "Create a post for voting target.",
                },
                {
                  method: "post",
                  path: "/votes/votes",
                  purpose: "Create a vote to be deleted.",
                },
              ],
            },
          ],
        },
      ]
    : [];
