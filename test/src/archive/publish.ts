import {
  AutoBeExampleStorage,
  AutoBeReplayComputer,
  AutoBeReplayStorage,
} from "@autobe/benchmark";
import {
  IAutoBePlaygroundBenchmark,
  IAutoBePlaygroundReplay,
} from "@autobe/interface";
import fs from "fs";

import { TestGlobal } from "../TestGlobal";

const main = async (): Promise<void> => {
  const experiments: IAutoBePlaygroundBenchmark[] = [];
  for (const vendor of await AutoBeExampleStorage.getVendorModels()) {
    const summaries: IAutoBePlaygroundReplay.ISummary[] =
      await AutoBeReplayStorage.getAllSummaries(vendor);
    if (summaries.length === 0) continue;
    experiments.push({
      vendor,
      replays: summaries,
      score: AutoBeReplayComputer.score(summaries),
      emoji: AutoBeReplayComputer.emoji(summaries),
    });
  }
  experiments.sort((a, b) =>
    b.score === a.score
      ? a.vendor.localeCompare(b.vendor)
      : b.score.aggregate - a.score.aggregate,
  );

  await fs.promises.writeFile(
    `${TestGlobal.ROOT}/../website/src/data/benchmark.json`,
    JSON.stringify(experiments),
    "utf8",
  );
};
main().catch((error) => {
  console.error(error);
  process.exit(-1);
});
