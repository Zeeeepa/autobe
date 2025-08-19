import { AutoBeOpenApi } from "@autobe/interface";
import { OpenApi } from "@samchon/openapi";
import { OpenApiV3_1Emender } from "@samchon/openapi/lib/converters/OpenApiV3_1Emender";

import { invertOpenApiSchema } from "./invertOpenApiSchema";
import { transformOpenApiSchema } from "./transformOpenApiSchema";

export const emendOpenApiSchema = (
  x: AutoBeOpenApi.IJsonSchema,
): AutoBeOpenApi.IJsonSchema => {
  const y: OpenApi.IJsonSchema = transformOpenApiSchema(x);
  const z: OpenApi.IJsonSchema = OpenApiV3_1Emender.convertSchema({})(y);
  return invertOpenApiSchema(z);
};
