import { AutoBeOpenApi } from "@autobe/interface";
import { IValidation } from "typia";

/**
 * Validates that schema names are unique in a case-insensitive manner. Detects
 * duplicates like "IUser.IRequest" vs "Iuser.IRequest" which should not
 * coexist.
 *
 * @param props - Validation properties
 * @param props.errors - Array to collect validation errors
 * @param props.schemas - Schema definitions to validate
 * @param props.path - Path context for error reporting
 */
export const validateDuplicatedSchemaName = (props: {
  errors: IValidation.IError[];
  schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
  path: string;
}) => {
  // First, determine canonical forms for base namespaces
  const namespaceCanonicals = new Map<string, string>();
  const namespaceCounts = new Map<string, Map<string, number>>();

  // Count namespace occurrences
  for (const key of Object.keys(props.schemas)) {
    const parts = key.split(".");
    const namespace = parts[0];
    const lowerNamespace = namespace.toLowerCase();

    if (!namespaceCounts.has(lowerNamespace)) {
      namespaceCounts.set(lowerNamespace, new Map());
    }

    const variants = namespaceCounts.get(lowerNamespace)!;
    variants.set(namespace, (variants.get(namespace) || 0) + 1);
  }

  // Determine canonical form for each namespace
  for (const [lowerNamespace, variants] of namespaceCounts) {
    let canonical = "";
    let maxCount = 0;

    for (const [variant, count] of variants) {
      if (
        count > maxCount ||
        (count === maxCount && shouldPrefer(variant, canonical))
      ) {
        canonical = variant;
        maxCount = count;
      }
    }

    namespaceCanonicals.set(lowerNamespace, canonical);
  }

  // Now check for duplicates and normalize using canonical namespaces
  const normalizedGroups = new Map<string, Set<string>>();

  for (const key of Object.keys(props.schemas)) {
    const parts = key.split(".");
    const namespace = parts[0];
    const lowerNamespace = namespace.toLowerCase();
    const canonicalNamespace =
      namespaceCanonicals.get(lowerNamespace) || namespace;

    // Build normalized key with canonical namespace
    const normalizedKey =
      parts.length > 1
        ? `${canonicalNamespace}.${parts.slice(1).join(".")}`
        : canonicalNamespace;

    const lowerNormalizedKey = normalizedKey.toLowerCase();

    if (!normalizedGroups.has(lowerNormalizedKey)) {
      normalizedGroups.set(lowerNormalizedKey, new Set());
    }

    normalizedGroups.get(lowerNormalizedKey)!.add(key);
  }

  // Report all groups with duplicates
  for (const [, originalKeys] of normalizedGroups) {
    if (originalKeys.size > 1) {
      const keyArray = Array.from(originalKeys);

      // Determine the canonical form for this group
      // First, find the best original key, then normalize it
      let bestOriginalKey = "";
      for (const key of keyArray) {
        if (bestOriginalKey === "" || shouldPrefer(key, bestOriginalKey)) {
          bestOriginalKey = key;
        }
      }

      // Now normalize the best key with canonical namespace
      const parts = bestOriginalKey.split(".");
      const namespace = parts[0];
      const lowerNamespace = namespace.toLowerCase();
      const canonicalNamespace =
        namespaceCanonicals.get(lowerNamespace) || namespace;

      const canonical =
        parts.length > 1
          ? `${canonicalNamespace}.${parts.slice(1).join(".")}`
          : canonicalNamespace;

      const nonCanonical = keyArray.filter((k) => {
        // Compare the original key against the canonical form directly
        // Don't normalize before comparing
        return k !== canonical;
      });

      if (nonCanonical.length > 0) {
        // Create an error for each non-canonical variant
        for (const variant of nonCanonical) {
          props.errors.push({
            path: `${props.path}.${variant}`,
            expected: `"${canonical}" (canonical form)`,
            value: variant,
            message: `Case-insensitive duplicate schema name detected. Use "${canonical}" instead of "${variant}"`,
          } as IValidation.IError);
        }
      }
    }
  }

  return props.errors;
};

/**
 * When frequency is tied, determines which key should be preferred. Prefers
 * PascalCase names (e.g., IRequest over irequest, ISummary over ISUMMARY).
 */
function shouldPrefer(newName: string, currentCanonical: string): boolean {
  // Empty string loses to anything
  if (currentCanonical === "") return true;

  // Check if names follow PascalCase pattern (starts with uppercase, has lowercase)
  const newIsPascal = /^[A-Z]/.test(newName) && /[a-z]/.test(newName);
  const currentIsPascal =
    /^[A-Z]/.test(currentCanonical) && /[a-z]/.test(currentCanonical);

  // Prefer PascalCase over all-uppercase or all-lowercase
  if (newIsPascal && !currentIsPascal) return true;
  if (!newIsPascal && currentIsPascal) return false;

  // If both are PascalCase or both are not, prefer names starting with uppercase
  const newStartsUpper = /^[A-Z]/.test(newName);
  const currentStartsUpper = /^[A-Z]/.test(currentCanonical);

  if (newStartsUpper && !currentStartsUpper) return true;
  if (!newStartsUpper && currentStartsUpper) return false;

  // As a last resort, prefer the one with more uppercase letters (but not all uppercase)
  const newUpperCount = (newName.match(/[A-Z]/g) || []).length;
  const currentUpperCount = (currentCanonical.match(/[A-Z]/g) || []).length;

  // Avoid all-uppercase by checking ratio
  const newAllUpper = newName === newName.toUpperCase();
  const currentAllUpper = currentCanonical === currentCanonical.toUpperCase();

  if (!newAllUpper && currentAllUpper) return true;
  if (newAllUpper && !currentAllUpper) return false;

  return newUpperCount > currentUpperCount;
}
