import fs from "fs";
import typia from "typia";

import { TestGlobal } from "../../TestGlobal";
import { prepare_agent_test } from "./internal/prepare_agent_test";

const ROOT = `${__dirname}/../../..`;

export const test_agent_test_correct_files = async () => {
  if (TestGlobal.env.CHATGPT_API_KEY === undefined) return false;

  const files = JSON.parse(
    await fs.promises.readFile(
      `${ROOT}/assets/error-histories/shopping-backend-test-response.json`,
      "utf8",
    ),
  );

  const state = await prepare_agent_test("shopping-backend");
  const response = await state.agent.getContext().compiler.typescript({
    files,
  });

  console.log(JSON.stringify(response, null, 2));
  typia.assert<true>(response.type !== "exception");
};
