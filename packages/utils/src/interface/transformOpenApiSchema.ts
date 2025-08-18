import { AutoBeOpenApi } from "@autobe/interface";
import { OpenApi } from "@samchon/openapi";

import { AutoBeOpenApiTypeChecker } from "./AutoBeOpenApiTypeChecker";

export const transformOpenApiSchema = (
  schema: AutoBeOpenApi.IJsonSchema,
): OpenApi.IJsonSchema => {
  if (AutoBeOpenApiTypeChecker.isArray(schema))
    return {
      ...schema,
      items: transformOpenApiSchema(schema.items),
    };
  else if (AutoBeOpenApiTypeChecker.isObject(schema))
    return {
      ...schema,
      properties: Object.fromEntries(
        schema.properties.map((p) => [
          p.key,
          {
            ...transformOpenApiSchema(p.value),
            description: p.description,
          },
        ]),
      ),
      additionalProperties:
        typeof schema.additionalProperties === "object" &&
        schema.additionalProperties !== null
          ? transformOpenApiSchema(schema.additionalProperties)
          : (schema.additionalProperties ?? undefined),
      required: schema.properties.filter((p) => p.required).map((p) => p.key),
    };
  else if (AutoBeOpenApiTypeChecker.isOneOf(schema))
    return {
      ...schema,
      oneOf: schema.oneOf.map(transformOpenApiSchema),
    };
  return schema;
};
