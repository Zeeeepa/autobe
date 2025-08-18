import { AutoBeOpenApi } from "@autobe/interface";

export const mergeOpenApiComponentSchemas = (
  schemas: AutoBeOpenApi.IComponentSchema[],
): AutoBeOpenApi.IComponentSchema[] =>
  Array.from(new Map(schemas.map((s) => [s.key, s])).values());
