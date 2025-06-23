import { AutoBeTypeScriptCompiler } from "@autobe/compiler";
import fs from "fs";
import typia from "typia";

import { TestGlobal } from "../../TestGlobal";

const ROOT = `${__dirname}/../../..`;

export const test_agent_test_correct_files = async () => {
  if (TestGlobal.env.CHATGPT_API_KEY === undefined) return false;

  const files = JSON.parse(
    await fs.promises.readFile(
      `${ROOT}/assets/error-histories/shopping-backend-test-response.json`,
      "utf8",
    ),
  );

  const compiler: AutoBeTypeScriptCompiler = new AutoBeTypeScriptCompiler();
  const response = await compiler.compile({ files });

  console.log(JSON.stringify(response, null, 2));
  typia.assert<true>(response.type !== "exception");
};
