import { CompressUtil } from "@autobe/filesystem";
import { AutoBeEventSnapshot } from "@autobe/interface";
import fs from "fs";

import { TestGlobal } from "../TestGlobal";

const main = async (): Promise<void> => {
  const snapshots: AutoBeEventSnapshot[] = JSON.parse(
    await CompressUtil.gunzip(
      await fs.promises.readFile(
        `${TestGlobal.ROOT}/assets/histories/openai/gpt-4.1/chat.prisma.snapshots.json.gz`,
      ),
    ),
  );
  const event = snapshots
    .map((s) => s.event)
    .find((e) => e.type === "prismaComponent");
  console.log(
    event?.components
      .map((c) => c.tables)
      .flat()
      .sort(),
  );
};
main().catch(console.error);
