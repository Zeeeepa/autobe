import { AutoBeOpenApi } from "@autobe/interface";
import { OpenApi, OpenApiV3_1 } from "@samchon/openapi";

import { transformOpenApiSchema } from "./transformOpenApiSchema";

export function transformOpenApiDocument(
  document: AutoBeOpenApi.IDocument,
): OpenApi.IDocument {
  const paths: Record<string, OpenApi.IPath> = {};
  for (const op of document.operations) {
    paths[op.path] ??= {};
    paths[op.path][op.method] = {
      summary: op.summary,
      description: op.description,
      parameters: op.parameters.map((p) => ({
        name: p.name,
        in: "path",
        schema: transformOpenApiSchema(p.schema),
        description: p.description,
        required: true,
      })),
      requestBody: op.requestBody
        ? {
            content: {
              "application/json": {
                schema: {
                  $ref: `#/components/schemas/${op.requestBody.typeName}`,
                },
              },
            },
            description: op.requestBody.description,
            required: true,
          }
        : undefined,
      responses: op.responseBody
        ? {
            [op.method === "post" ? 201 : 200]: {
              content: {
                "application/json": {
                  schema: {
                    $ref: `#/components/schemas/${op.responseBody.typeName}`,
                  },
                },
              },
              description: op.responseBody.description,
            },
          }
        : undefined,
    };
  }
  const components: OpenApi.IComponents = {
    schemas: Object.fromEntries(
      document.components.schemas.map((s) => [
        s.key,
        {
          ...transformOpenApiSchema(s.value),
          description: s.description,
        },
      ]),
    ),
  };
  return OpenApi.convert({
    openapi: "3.1.0",
    paths,
    components,
  } as OpenApiV3_1.IDocument);
}
