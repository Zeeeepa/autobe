import { AutoBeTokenUsage } from "@autobe/agent";
import { CompressUtil } from "@autobe/filesystem";
import {
  AutoBeEventSnapshot,
  AutoBeHistory,
  AutoBePhase,
  AutoBeUserMessageHistory,
  IAutoBeTokenUsageJson,
} from "@autobe/interface";
import fs from "fs";
import { v7 } from "uuid";

import { TestGlobal } from "../TestGlobal";
import { TestProject } from "../structures/TestProject";
import { TestFileSystem } from "./TestFileSystem";

export namespace TestHistory {
  export const save = async (files: Record<string, string>): Promise<void> => {
    await TestFileSystem.save({
      root: `${TestGlobal.ROOT}/assets/histories/${slugModel(TestGlobal.vendorModel, false)}`,
      overwrite: true,
      files,
    });
  };

  export const getUserMessage = async (
    project: TestProject,
    phase: AutoBePhase,
  ): Promise<AutoBeUserMessageHistory> => {
    const full: string = `${TestGlobal.ROOT}/scripts/${project}/${phase}`;
    if (fs.existsSync(`${full}.md`) === false) {
      const text: string =
        phase === "analyze"
          ? await fs.promises.readFile(
              `${TestGlobal.ROOT}/scripts/${project}.md`,
              "utf8",
            )
          : PROMPT_TEMPLATE[phase];
      return {
        type: "userMessage",
        id: v7(),
        created_at: new Date().toISOString(),
        contents: [
          {
            type: "text",
            text,
          },
        ],
      };
    }
    const text: string = await fs.promises.readFile(`${full}.md`, "utf8");
    return {
      type: "userMessage",
      id: v7(),
      created_at: new Date().toISOString(),
      contents: [
        {
          type: "text",
          text: text,
        },
      ],
    };
  };

  export const getVendorModels = async (): Promise<string[]> => {
    const result: string[] = [];
    for (const vendor of await fs.promises.readdir(
      `${TestGlobal.ROOT}/assets/histories`,
    ))
      for (const model of await fs.promises.readdir(
        `${TestGlobal.ROOT}/assets/histories/${vendor}`,
      )) {
        const stat: fs.Stats = await fs.promises.lstat(
          `${TestGlobal.ROOT}/assets/histories/${vendor}/${model}`,
        );
        if (stat.isDirectory() === true) result.push(`${vendor}/${model}`);
      }
    return result.sort();
  };

  export const getHistories = async (
    project: TestProject,
    phase: AutoBePhase,
  ): Promise<AutoBeHistory[]> => {
    const location: string = `${TestGlobal.ROOT}/assets/histories/${slugModel(TestGlobal.vendorModel, false)}/${project}.${phase}.json.gz`;
    const content: string = await CompressUtil.gunzip(
      await fs.promises.readFile(location),
    );
    return JSON.parse(content);
  };

  export const getTokenUsage = async (
    project: TestProject,
    phase: AutoBePhase,
  ): Promise<IAutoBeTokenUsageJson> => {
    const snapshots: AutoBeEventSnapshot[] = JSON.parse(
      await CompressUtil.gunzip(
        await fs.promises.readFile(
          `${TestGlobal.ROOT}/assets/histories/${slugModel(TestGlobal.vendorModel, false)}/${project}.${phase}.snapshots.json.gz`,
        ),
      ),
    );
    return snapshots.at(-1)?.tokenUsage ?? new AutoBeTokenUsage().toJSON();
  };

  export const has = (project: TestProject, type: AutoBePhase): boolean =>
    fs.existsSync(
      `${TestGlobal.ROOT}/assets/histories/${slugModel(TestGlobal.vendorModel, false)}/${project}.${type}.json.gz`,
    );

  export const slugModel = (model: string, replaceSlash: boolean): string => {
    model = model.replaceAll(":", "-");
    if (replaceSlash) model = model.replaceAll("/", "-");
    return model;
  };
}

const PROMPT_TEMPLATE = {
  prisma: "Design the database schema.",
  interface: "Create the API interface specification.",
  test: "Make the e2e test functions.",
  realize: "Implement API functions.",
};
