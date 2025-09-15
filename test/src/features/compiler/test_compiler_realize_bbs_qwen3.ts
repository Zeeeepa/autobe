import { AutoBeAgent } from "@autobe/agent";
import { AutoBeCompiler } from "@autobe/compiler";
import { TestValidator } from "@nestia/e2e";
import { promises } from "fs";
import path from "path";
import typia from "typia";

import { TestGlobal } from "../../TestGlobal";
import { TestHistory } from "../../internal/TestHistory";

export const test_compiler_realize_bbs_qwen3 = async () => {
  if (TestHistory.has("todo", "interface") === false) return false;

  const agent: AutoBeAgent<"chatgpt"> = new AutoBeAgent({
    model: "chatgpt",
    vendor: TestGlobal.getVendorConfig(),
    histories: [],
    compiler: (listener) => new AutoBeCompiler(listener),
  });

  const histories = JSON.parse(
    await promises.readFile(
      path.join(__dirname, "../../../assets/compile_stop_case.json"),
      "utf-8",
    ),
  );

  typia.assertGuard<Record<string, string>>(histories);

  const compiler = await agent.getContext().compiler();
  const result = await compiler.typescript.compile({
    files: histories,
  });

  TestValidator.equals("compiled", result.type, "success");
};
