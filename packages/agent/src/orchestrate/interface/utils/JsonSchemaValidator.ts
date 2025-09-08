import { AutoBeOpenApi, AutoBePrisma } from "@autobe/interface";
import { AutoBeOpenApiTypeChecker, StringUtil } from "@autobe/utils";
import { IValidation } from "typia";
import { Escaper } from "typia/lib/utils/Escaper";

export namespace JsonSchemaValidator {
  export interface IProps {
    errors: IValidation.IError[];
    schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
    path: string;
    prismaModels: AutoBePrisma.IModel[];
  }

  export const validate = (props: IProps): void => {
    authorization(props);
    validateKey(props);
    validatePrismaModel(props);
  };

  const authorization = (props: IProps): void => {
    for (const [key, value] of Object.entries(props.schemas)) {
      if (!key.endsWith(".IAuthorized")) continue;

      // Check if it's an object type
      if (AutoBeOpenApiTypeChecker.isObject(value) === false) {
        props.errors.push({
          path: `${props.path}.${key}`,
          expected: `AutoBeOpenApi.IJsonSchemaDescriptive<AutoBeOpenApi.IJsonSchema.IObject>`,
          value: value,
          description: `${key} must be an object type for authorization responses`,
        });
        continue;
      }

      // Check if token property exists
      value.properties ??= {};
      value.properties["token"] = {
        $ref: "#/components/schemas/IAuthorizationToken",
        description: "JWT token information for authentication",
      } as AutoBeOpenApi.IJsonSchemaDescriptive.IReference;

      value.required ??= [];
      if (value.required.includes("token") === false)
        value.required.push("token");
    }
  };

  const validateKey = (props: IProps): void => {
    for (const key of Object.keys(props.schemas)) {
      const variable: boolean = key.split(".").every(Escaper.variable);
      if (variable === false)
        props.errors.push({
          path: `${props.path}[${JSON.stringify(key)}]`,
          expected: "Valid variable name",
          value: key,
          description: StringUtil.trim`
            JSON schema type name must be a valid variable name.

            Even though JSON schema type name allows dot(.) character, but
            each segment separated by dot(.) must be a valid variable name.

            Current key name ${JSON.stringify(key)} is not valid. Change
            it to a valid variable name at the next time.
          `,
        });
    }
  };

  const toSingular = (word: string): string => {
    // Handle common plural patterns
    if (word.endsWith("ies")) {
      return word.slice(0, -3) + "y";
    } else if (
      word.endsWith("ses") ||
      word.endsWith("xes") ||
      word.endsWith("zes") ||
      word.endsWith("ches") ||
      word.endsWith("shes")
    ) {
      return word.slice(0, -2);
    } else if (word.endsWith("s") && !word.endsWith("ss")) {
      return word.slice(0, -1);
    }
    return word;
  };

  const toPlural = (word: string): string => {
    // Handle common singular to plural patterns
    if (word.endsWith("y") && !/[aeiou]y$/.test(word)) {
      return word.slice(0, -1) + "ies";
    } else if (
      word.endsWith("s") ||
      word.endsWith("x") ||
      word.endsWith("z") ||
      word.endsWith("ch") ||
      word.endsWith("sh")
    ) {
      return word + "es";
    } else if (!word.endsWith("s")) {
      return word + "s";
    }
    return word;
  };

  const validatePrismaModel = (props: IProps): void => {
    for (const [key, value] of Object.entries(props.schemas)) {
      // Skip special types that don't map to Prisma models
      if (key === "IAuthorizationToken" || 
          key.startsWith("IPage") || 
          key === "IPage.IPagination" || 
          key === "IPage.IRequest") {
        continue;
      }

      if (key.includes(".") === false && key.startsWith("I")) {
        // Try multiple matching strategies to handle AI inconsistencies
        let model = props.prismaModels.find((m) => {
          const parts = m.name.split("_");
          const lastWord = parts[parts.length - 1];
          
          // Generate all possible variations
          const variations = new Set<string>();
          
          // 1. Original name (keep plural as is)
          variations.add("I" + toPascalCase(m.name));
          
          // 2. Singular form (plural to singular conversion)
          const singularLastWord = toSingular(lastWord);
          if (singularLastWord !== lastWord) {
            const singularParts = [...parts];
            singularParts[singularParts.length - 1] = singularLastWord;
            variations.add("I" + toPascalCase(singularParts.join("_")));
          }
          
          // 3. Plural form (singular to plural conversion, rare but possible)
          const pluralLastWord = toPlural(lastWord);
          if (pluralLastWord !== lastWord) {
            const pluralParts = [...parts];
            pluralParts[pluralParts.length - 1] = pluralLastWord;
            variations.add("I" + toPascalCase(pluralParts.join("_")));
          }
          
          // Check all variations with exact and case-insensitive matching
          for (const variation of variations) {
            if (variation === key) return true; // Exact match
            if (variation.toLowerCase() === key.toLowerCase()) return true; // Case-insensitive
            
            // Handle compound words like "registeredusers" vs "RegisteredUsers"
            const normalizedVariation = variation.replace(/[A-Z]/g, (char, index) => 
              index === 0 ? char : char.toLowerCase()
            );
            const normalizedKey = key.replace(/[A-Z]/g, (char, index) => 
              index === 0 ? char : char.toLowerCase()
            );
            if (normalizedVariation === normalizedKey) return true;
          }
          
          return false;
        });

        if (!model) {
          // Only log unmatched schemas that look like entity types
          if (!key.includes(".")) {
            props.errors.push({
              expected: `Matching Prisma model`,
              value: key,
              description: `Schema ${JSON.stringify(key)} does not match any Prisma model. ` +
                `This might be an AI-generated schema that doesn't follow naming conventions, ` +
                `or it could be a utility type that doesn't correspond to a database table.`,
              path: `${props.path}[${JSON.stringify(key)}]`,
            });
          }
        }

        if (model) {
          const plainFields: string[] = model.plainFields.map((f) => f.name);
          const foreignFields: string[] = model.foreignFields.map(
            (f) => f.name,
          );
          if (AutoBeOpenApiTypeChecker.isObject(value)) {
            const properties: string[] = Object.keys(value.properties);

            properties.forEach((p) => {
              // Check if property exists in the Prisma model
              const isPlainField: boolean = plainFields.includes(p);
              const isForeignField: boolean = foreignFields.includes(p);
              const isPrimaryField: boolean = p === model.primaryField.name;

              if (!isPlainField && !isForeignField && !isPrimaryField) {
                // Property doesn't exist in the Prisma model at all
                props.errors.push({
                  expected: `Valid field from Prisma model`,
                  value: p,
                  description: StringUtil.trim`
                    Property ${JSON.stringify(p)} does not exist in the
                    Prisma model ${JSON.stringify(model.name)}. This field must
                    be one of the following:
                    - Plain fields: ${plainFields.join(", ")}
                    - Foreign fields: ${foreignFields.join(", ")}
                    - Primary field: ${model.primaryField.name}
                  `,
                  path: `${props.path}[${JSON.stringify(key)}].properties.${p}`,
                });
              }
            });
          }
        }
      }
    }
  };

  const toPascalCase = (str: string): string => {
    return str
      .split("_")
      .map((word) => {
        // Capitalize first letter and keep the rest as lowercase
        // This handles most cases correctly
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join("");
  };
}
