import { AutoBeOpenApi } from "@autobe/interface";

export namespace AutoBeOpenApiTypeChecker {
  export const isArray = (
    schema: AutoBeOpenApi.IJsonSchema,
  ): schema is AutoBeOpenApi.IJsonSchema.IArray =>
    (schema as AutoBeOpenApi.IJsonSchema.IArray).type === "array";

  export const isObject = (
    schema: AutoBeOpenApi.IJsonSchema,
  ): schema is AutoBeOpenApi.IJsonSchema.IObject =>
    (schema as AutoBeOpenApi.IJsonSchema.IObject).type === "object";

  export const isOneOf = (
    schema: AutoBeOpenApi.IJsonSchema,
  ): schema is AutoBeOpenApi.IJsonSchema.IOneOf =>
    typeof (schema as AutoBeOpenApi.IJsonSchema.IOneOf).oneOf === "object" &&
    (schema as AutoBeOpenApi.IJsonSchema.IOneOf).oneOf !== null;

  export const isReference = (
    schema: AutoBeOpenApi.IJsonSchema,
  ): schema is AutoBeOpenApi.IJsonSchema.IReference =>
    (schema as AutoBeOpenApi.IJsonSchema.IReference).$ref !== undefined;

  export const visit = (props: {
    components: AutoBeOpenApi.IComponents;
    schema: AutoBeOpenApi.IJsonSchema;
    closure: (schema: AutoBeOpenApi.IJsonSchema) => void;
  }) => {
    props.closure(props.schema);
    if (isArray(props.schema)) props.closure(props.schema.items);
    else if (isObject(props.schema)) {
      for (const p of props.schema.properties) props.closure(p.value);
      if (
        typeof props.schema.additionalProperties === "object" &&
        props.schema.additionalProperties !== null
      )
        props.closure(props.schema.additionalProperties);
    } else if (isOneOf(props.schema))
      for (const s of props.schema.oneOf) props.closure(s);
    else if (isReference(props.schema)) {
      const key = props.schema.$ref.split("/").pop()!;
      const found = props.components.schemas.find((n) => n.key === key);
      if (found) props.closure(found.value);
    }
  };
}
