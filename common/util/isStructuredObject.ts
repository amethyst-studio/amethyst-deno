
export function isStructuredObject<T>(schema: Record<keyof T, string>, input: Record<string, unknown>): boolean | string[] {
  const missing = Object.keys(schema)
    .filter((k) => input[k] === undefined)
    .map((k) => k as keyof T)
    .map((k) => `Property '${String(k)}' missing from the structure.`);

  return (missing.length === 0) ? true : missing;
}
