import {
  AutoBeProgressEventBase,
  AutoBeRealizeAuthorization,
  AutoBeRealizeFunction,
  AutoBeRealizeValidateEvent,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { ILlmApplication, ILlmController, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { transformCommonCorrectDateHistories } from "../common/histories/transformCommonCorrectDateHistories";
import { IAutoBeCommonCorrectDateApplication } from "../common/structures/IAutoBeCommonCorrectDateApplication";
import { compileRealizeFiles } from "./internal/compileRealizeFiles";

/** Result of attempting to correct a single function */
type CorrectionResult = {
  result: "success" | "ignore" | "exception";
  func: AutoBeRealizeFunction;
};

export const orchestrateRealizeCorrectDate = async <
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  authorizations: AutoBeRealizeAuthorization[],
  functions: AutoBeRealizeFunction[],
  progress: AutoBeProgressEventBase,
  life: number = ctx.retry,
): Promise<AutoBeRealizeFunction[]> => {
  const validateEvent: AutoBeRealizeValidateEvent = await compileRealizeFiles(
    ctx,
    {
      authorizations,
      functions,
    },
  );

  return predicate(
    ctx,
    authorizations,
    functions,
    [],
    progress,
    validateEvent,
    life,
  );
};

const predicate = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  authorizations: AutoBeRealizeAuthorization[],
  functions: AutoBeRealizeFunction[],
  failures: IAutoBeTypeScriptCompileResult.IDiagnostic[],
  progress: AutoBeProgressEventBase,
  event: AutoBeRealizeValidateEvent,
  life: number,
): Promise<AutoBeRealizeFunction[]> => {
  if (event.result.type === "failure") {
    ctx.dispatch(event);

    return await correct(
      ctx,
      authorizations,
      functions,
      [...failures, ...event.result.diagnostics],
      progress,
      event,
      life,
    );
  }
  return functions;
};

const correct = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  authorizations: AutoBeRealizeAuthorization[],
  functions: AutoBeRealizeFunction[],
  failures: IAutoBeTypeScriptCompileResult.IDiagnostic[],
  progress: AutoBeProgressEventBase,
  event: AutoBeRealizeValidateEvent,
  life: number,
): Promise<AutoBeRealizeFunction[]> => {
  // Early returns for non-correctable cases
  if (event.result.type !== "failure" || life < 0) {
    return functions;
  }

  // Filter only Date-related errors
  const dateErrors = filterDateErrors(failures);
  const locations: string[] = diagnose(event).filter(
    (l) =>
      functions.map((f) => f.location).includes(l) &&
      dateErrors.some((e) => e.file === l),
  );

  // If no date errors found, return original functions
  if (locations.length === 0) {
    return functions;
  }

  progress.total += locations.length;

  const converted: CorrectionResult[] = await executeCachedBatch(
    locations.map((location) => async (): Promise<CorrectionResult> => {
      const func: AutoBeRealizeFunction = functions.find(
        (f) => f.location === location,
      )!;

      const pointer: IPointer<
        IAutoBeCommonCorrectDateApplication.IProps | false | null
      > = {
        value: null,
      };

      const { tokenUsage } = await ctx.conversate({
        source: "realizeCorrect",
        histories: transformCommonCorrectDateHistories([
          {
            script: func.content,
            diagnostics: dateErrors.filter((d) => d.file === location),
          },
        ]),
        controller: createController({
          model: ctx.model,
          then: (next) => {
            pointer.value = next;
          },
          reject: () => {
            pointer.value = false;
          },
        }),
        enforceFunctionCall: true,
        message: StringUtil.trim`
          Fix Date type problems in TypeScript code.

          CRITICAL RULES:
          1. When Prisma returns Date type, convert to string for API response
          2. Use toISOStringSafe() OR .toISOString() to convert Date to string
          3. Handle nullable dates: date ? date.toISOString() : null
          4. For return types, match the API interface exactly
          
          COMMON PATTERNS:
          // Prisma returns Date, API expects string
          return {
            created_at: result.created_at.toISOString(),
            updated_at: result.updated_at.toISOString(),
            deleted_at: result.deleted_at ? result.deleted_at.toISOString() : null
          };
          
          // For nullable fields in return
          expires_at: data.expires_at ? data.expires_at.toISOString() : null
          
          // Cast when needed
          created_at: result.created_at.toISOString() as string & tags.Format<"date-time">
          
          Fix Date to string conversion issues. Do not explain, just fix the code.
        `,
      });
      ++progress.completed;
      if (pointer.value === null)
        return { result: "exception" as const, func: func };
      else if (pointer.value === false)
        return { result: "ignore" as const, func: func };

      ctx.dispatch({
        id: v7(),
        type: "realizeCorrect",
        content: pointer.value.revise.final,
        created_at: new Date().toISOString(),
        location: func.location,
        step: ctx.state().analyze?.step ?? 0,
        tokenUsage,
        completed: progress.completed,
        total: progress.total,
      });

      return {
        result: "success" as const,
        func: { ...func, content: pointer.value.revise.final },
      };
    }),
  );

  const newValidate: AutoBeRealizeValidateEvent = await compileRealizeFiles(
    ctx,
    { authorizations, functions: converted.map((c) => c.func) },
  );

  const newResult: IAutoBeTypeScriptCompileResult = newValidate.result;
  if (newResult.type === "success") {
    return converted.map((c) => c.func);
  } else if (newResult.type === "exception") {
    // Compilation exception, return current functions. because retrying won't help.
    return functions;
  }

  if (
    newResult.diagnostics.every((d) => !d.file?.startsWith("src/providers"))
  ) {
    // No diagnostics related to provider functions, stop correcting
    return converted.map((c) => c.func);
  }

  const newLocations: string[] = diagnose(newValidate);

  // Separate successful, failed, and ignored corrections
  const { success, failed, ignored } = separateCorrectionResults(
    converted,
    newLocations,
  );

  // If no failures to retry, return success and ignored functions
  if (failed.length === 0) {
    return [...success, ...ignored];
  }

  // Collect diagnostics relevant to failed functions
  const failedLocations: string[] = failed.map((f) => f.location);
  const allDiagnostics: IAutoBeTypeScriptCompileResult.IDiagnostic[] = [
    ...failures,
    ...(newValidate.result.type === "failure"
      ? newValidate.result.diagnostics
      : []),
  ];
  const relevantDiagnostics: IAutoBeTypeScriptCompileResult.IDiagnostic[] =
    filterRelevantDiagnostics(allDiagnostics, failedLocations);

  // Recursively retry failed functions
  const retriedFunctions: AutoBeRealizeFunction[] = await predicate(
    ctx,
    authorizations,
    failed,
    relevantDiagnostics,
    progress,
    newValidate,
    life - 1,
  );

  return [...success, ...ignored, ...retriedFunctions];
};

/**
 * Extract unique file locations from validation event diagnostics
 *
 * @param event - Validation event containing compilation results
 * @returns Array of unique file paths that have errors
 */
const diagnose = (event: AutoBeRealizeValidateEvent): string[] => {
  if (event.result.type !== "failure") {
    return [];
  }

  const diagnostics = event.result.diagnostics;
  const locations = diagnostics
    .map((d) => d.file)
    .filter((f): f is string => f !== null)
    .filter((f) => f.startsWith("src/providers"));

  return Array.from(new Set(locations));
};

/**
 * Filter diagnostics to only include Date-related errors
 *
 * @param diagnostics - All diagnostics
 * @returns Date-related diagnostics only
 */
const filterDateErrors = (
  diagnostics: IAutoBeTypeScriptCompileResult.IDiagnostic[],
): IAutoBeTypeScriptCompileResult.IDiagnostic[] => {
  return diagnostics.filter((d) => {
    const messageText = d.messageText?.toLowerCase() || "";
    return (
      messageText.includes("date") ||
      messageText.includes("date-time") ||
      messageText.includes("toisostring") ||
      messageText.includes("cannot read property") ||
      messageText.includes("type 'date'") ||
      messageText.includes("tags.format<'date-time'>") ||
      messageText.includes('tags.format<"date-time">')
    );
  });
};

/**
 * Separate correction results into successful, failed, and ignored functions
 *
 * @param corrections - Array of correction results
 * @param errorLocations - File paths that still have errors
 * @returns Object with success, failed, and ignored function arrays
 */
const separateCorrectionResults = (
  corrections: CorrectionResult[],
  errorLocations: string[],
): {
  success: AutoBeRealizeFunction[];
  failed: AutoBeRealizeFunction[];
  ignored: AutoBeRealizeFunction[];
} => {
  const success = corrections
    .filter(
      (c) =>
        c.result === "success" && !errorLocations.includes(c.func.location),
    )
    .map((c) => c.func);

  const failed = corrections
    .filter(
      (c) => c.result === "success" && errorLocations.includes(c.func.location),
    )
    .map((c) => c.func);

  const ignored = corrections
    .filter((c) => c.result === "ignore" || c.result === "exception")
    .map((c) => c.func);

  return { success, failed, ignored };
};

/**
 * Filter diagnostics to only include those relevant to specific functions
 *
 * @param diagnostics - All diagnostics
 * @param functionLocations - Locations of functions to filter for
 * @returns Filtered diagnostics
 */
const filterRelevantDiagnostics = (
  diagnostics: IAutoBeTypeScriptCompileResult.IDiagnostic[],
  functionLocations: string[],
): IAutoBeTypeScriptCompileResult.IDiagnostic[] => {
  return diagnostics.filter(
    (d) => d.file && functionLocations.includes(d.file),
  );
};

const createController = <Model extends ILlmSchema.Model>(props: {
  model: Model;
  then: (next: IAutoBeCommonCorrectDateApplication.IProps) => void;
  reject: () => void;
}): ILlmController<Model> => {
  assertSchemaModel(props.model);
  const application = collection[
    props.model === "chatgpt" ? "chatgpt" : "claude"
  ] satisfies ILlmApplication<any> as any as ILlmApplication<Model>;
  return {
    protocol: "class",
    name: "correctDateInvalidRequest",
    application,
    execute: {
      rewrite: (next) => {
        props.then(next);
      },
      reject: () => {
        props.reject();
      },
    } satisfies IAutoBeCommonCorrectDateApplication,
  };
};

const collection = {
  chatgpt: typia.llm.application<
    IAutoBeCommonCorrectDateApplication,
    "chatgpt"
  >(),
  claude: typia.llm.application<
    IAutoBeCommonCorrectDateApplication,
    "claude"
  >(),
};
