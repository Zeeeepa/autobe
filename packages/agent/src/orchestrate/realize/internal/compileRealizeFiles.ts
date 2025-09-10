import {
  AutoBeRealizeAuthorization,
  AutoBeRealizeFunction,
  AutoBeRealizeValidateEvent,
  IAutoBeCompiler,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import { v7 } from "uuid";

import { AutoBeContext } from "../../../context/AutoBeContext";

export async function compileRealizeFiles<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    authorizations: AutoBeRealizeAuthorization[];
    function: AutoBeRealizeFunction;
  },
): Promise<AutoBeRealizeValidateEvent> {
  const prisma = ctx.state().prisma?.compiled;
  const payloads: Record<string, string> = Object.fromEntries(
    props.authorizations.map((el) => [el.payload.location, el.payload.content]),
  );
  const compiler: IAutoBeCompiler = await ctx.compiler();
  const templateFiles: Record<string, string> =
    await compiler.realize.getTemplate();
  const nodeModules: Record<string, string> =
    prisma?.type === "success" ? prisma.nodeModules : {};

  // src/api/structures
  // src/providers -> only one file
  // src/ -> 1st depth files
  const filterTsFiles = (location: string) => {
    if (!location.endsWith(".ts")) return false;
    
    // src/api/structures 폴더의 파일들
    if (location.startsWith("src/api/structures/")) return true;
    
    // src/ 바로 아래의 .ts 파일들 (하위 폴더 제외)
    if (location.startsWith("src/") && !location.slice(4).includes("/")) return true;
    
    return false;
  };

  const files: Record<string, string> = {
    ...nodeModules,
    ...payloads,
    ...Object.fromEntries(
      Object.entries(await ctx.files({ dbms: "sqlite" })).filter(([key]) =>
        filterTsFiles(key),
      ),
    ),
    ...Object.fromEntries(
      Object.entries(templateFiles).filter(([key]) => filterTsFiles(key)),
    ),

    [props.function.location]: props.function.content,
  };

  const compiled: IAutoBeTypeScriptCompileResult =
    await compiler.typescript.compile({
      files: files,
    });

  const event: AutoBeRealizeValidateEvent = {
    type: "realizeValidate",
    id: v7(),
    function: props.function,
    result: compiled,
    step: ctx.state().analyze?.step ?? 0,
    created_at: new Date().toISOString(),
  };

  return event;
}
