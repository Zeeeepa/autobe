import { AutoBeOpenApi } from "@autobe/interface";
import { OpenApi, OpenApiTypeChecker } from "@samchon/openapi";

export const invertOpenApiSchema = (
  schema: OpenApi.IJsonSchema,
): AutoBeOpenApi.IJsonSchema => {
  if (OpenApiTypeChecker.isArray(schema))
    return {
      ...schema,
      items: invertOpenApiSchema(schema.items),
    };
  else if (OpenApiTypeChecker.isObject(schema))
    return {
      ...schema,
      properties: Object.entries(schema.properties ?? []).map(
        ([key, value]) => ({
          key,
          value: invertOpenApiSchema({
            ...value,
            description: undefined,
          }),
          description:
            value.description ??
            `Describe ${key} as much as possible with clear and concise words.`,
          required: schema.required?.includes(key) ?? false,
        }),
      ),
      additionalProperties:
        typeof schema.additionalProperties === "object" &&
        schema.additionalProperties !== null
          ? invertOpenApiSchema(schema.additionalProperties)
          : (schema.additionalProperties as any),
    } satisfies AutoBeOpenApi.IJsonSchema.IObject;
  else if (OpenApiTypeChecker.isOneOf(schema))
    return {
      ...schema,
      oneOf: schema.oneOf.map(invertOpenApiSchema) as any,
    };
  else if (OpenApiTypeChecker.isTuple(schema))
    return {
      type: "array",
      items: {
        oneOf: schema.prefixItems.map(invertOpenApiSchema) as Exclude<
          AutoBeOpenApi.IJsonSchema,
          AutoBeOpenApi.IJsonSchema.IOneOf
        >[],
      } satisfies AutoBeOpenApi.IJsonSchema.IOneOf,
    };
  return schema as AutoBeOpenApi.IJsonSchema;
};
