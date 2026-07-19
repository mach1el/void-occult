/**
 * Recursively freeze an object graph. Used before caching the school
 * policy catalog so downstream code can never mutate the loaded knowledge.
 */
export function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== "object") return value;
  if (Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value as object)) {
    deepFreeze(child);
  }
  return value;
}
