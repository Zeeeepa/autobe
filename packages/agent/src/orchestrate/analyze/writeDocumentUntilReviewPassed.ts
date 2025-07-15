import { MicroAgenticaHistory } from "@agentica/core";
import { ILlmSchema } from "@samchon/openapi";

import { AutoBeContext } from "../../context/AutoBeContext";
import { IFile } from "./AutoBeAnalyzeFileSystem";
import { AutoBeAnalyzePointer } from "./AutoBeAnalyzePointer";
import { AutoBeAnalyzeRole } from "./AutoBeAnalyzeRole";
import { orchestrateAnalyzeReviewer } from "./orchestrateAnalyzeReviewer";
import { orchestrateAnalyzeWrite } from "./orchestrateAnalyzeWrite";

export async function writeDocumentUntilReviewPassed<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  pointer: AutoBeAnalyzePointer,
  totalFiles: Pick<IFile, "filename" | "reason">[],
  filename: string,
  roles: AutoBeAnalyzeRole[],
  retry = 3,
): Promise<AutoBeAnalyzePointer> {
  let review: string | null = null;
  for (let i = 0; i < retry; i++) {
    const write = "Wirte Document OR Abort." as const;
    const writer = orchestrateAnalyzeWrite(
      ctx,
      {
        totalFiles: totalFiles,
        roles: roles,
        targetFile: filename,
        review,
      },
      pointer,
    );

    const histories = await writer.conversate(review ?? write);
    if (pointer.value === null) {
      throw new Error("Failed to write document by unknown reason.");
    }

    if (isAborted(histories)) {
      return pointer;
    }

    review = await orchestrateAnalyzeReviewer(ctx, pointer.value);
  }

  return pointer;
}

function isAborted<Model extends ILlmSchema.Model>(
  histories: MicroAgenticaHistory<Model>[],
) {
  const lastMessage = histories[histories.length - 1]!;
  if (!lastMessage) {
    throw new Error("No last message found in histories");
  }

  const aborted =
    lastMessage.type === "describe" &&
    lastMessage.executes.some((e) => {
      if (e.protocol === "class" && e.operation.function.name === "abort") {
        return true;
      }
    });

  return aborted;
}
