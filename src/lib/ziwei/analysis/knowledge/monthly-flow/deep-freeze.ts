/** Recursively freeze an object graph. Used before caching knowledge packs. */
export function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== "object") return value;

  if (!Object.isFrozen(value)) {
    Object.freeze(value);
  }

  if (value instanceof Map) {
    for (const [k, v] of value.entries()) {
      deepFreeze(k);
      deepFreeze(v);
    }
    return value;
  }
  if (value instanceof Set) {
    for (const v of value.values()) deepFreeze(v);
    return value;
  }

  for (const child of Object.values(value as object)) {
    deepFreeze(child);
  }
  return value;
}

/** Structural deep-readonly view of a knowledge pack (compile-time only). */
export type DeepReadonly<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends Map<infer K, infer V>
    ? ReadonlyMap<DeepReadonly<K>, DeepReadonly<V>>
    : T extends Set<infer U>
      ? ReadonlySet<DeepReadonly<U>>
      : T extends readonly (infer U)[]
        ? ReadonlyArray<DeepReadonly<U>>
        : T extends object
          ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
          : T;
