/**
 * Minimal, dependency-free JSON-Schema-subset validator.
 *
 * Covers exactly the draft-2020 features used by the supplied Huyền Khí
 * schemas: `type`, `required`, `enum`, `pattern`, `minLength`, `minItems`,
 * `uniqueItems`, `properties`, nested object `required`/`properties`, `items`,
 * and `additionalProperties: false`. Deterministic and transparent — chosen
 * over ajv so the governance validator is fully reviewable and produces
 * structured, ordered issue paths.
 */

export interface JsonSchema {
  readonly type?: string;
  readonly required?: readonly string[];
  readonly enum?: readonly unknown[];
  readonly pattern?: string;
  readonly minLength?: number;
  readonly minItems?: number;
  readonly uniqueItems?: boolean;
  readonly properties?: Readonly<Record<string, JsonSchema>>;
  readonly items?: JsonSchema;
  readonly additionalProperties?: boolean | JsonSchema;
  readonly [key: string]: unknown;
}

export interface SchemaViolation {
  readonly path: string;
  readonly message: string;
}

function typeOf(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function matchesType(value: unknown, type: string): boolean {
  switch (type) {
    case "object":
      return typeOf(value) === "object";
    case "array":
      return Array.isArray(value);
    case "string":
      return typeof value === "string";
    case "number":
      return typeof value === "number";
    case "integer":
      return typeof value === "number" && Number.isInteger(value);
    case "boolean":
      return typeof value === "boolean";
    case "null":
      return value === null;
    default:
      return true;
  }
}

/**
 * Validate `value` against `schema`. Returns an ordered list of violations
 * (empty === valid). `basePath` roots the reported JSON pointer-ish paths.
 */
export function validateAgainstSchema(
  value: unknown,
  schema: JsonSchema,
  basePath = "$",
): SchemaViolation[] {
  const out: SchemaViolation[] = [];

  if (schema.enum) {
    const ok = schema.enum.some((candidate) => candidate === value);
    if (!ok) {
      out.push({
        path: basePath,
        message: `value ${JSON.stringify(value)} not in enum [${schema.enum
          .map((e) => JSON.stringify(e))
          .join(", ")}]`,
      });
      return out;
    }
  }

  if (schema.type && !matchesType(value, schema.type)) {
    out.push({
      path: basePath,
      message: `expected type ${schema.type}, got ${typeOf(value)}`,
    });
    return out;
  }

  if (typeof value === "string") {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      out.push({
        path: basePath,
        message: `string shorter than minLength ${schema.minLength}`,
      });
    }
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
      out.push({
        path: basePath,
        message: `string does not match pattern /${schema.pattern}/`,
      });
    }
  }

  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      out.push({
        path: basePath,
        message: `array shorter than minItems ${schema.minItems}`,
      });
    }
    if (schema.uniqueItems === true) {
      const seen = new Set<string>();
      value.forEach((item, index) => {
        const key = JSON.stringify(item);
        if (seen.has(key)) {
          out.push({
            path: `${basePath}[${index}]`,
            message: `duplicate array item ${key} (uniqueItems)`,
          });
        }
        seen.add(key);
      });
    }
    if (schema.items) {
      value.forEach((item, index) => {
        out.push(
          ...validateAgainstSchema(item, schema.items!, `${basePath}[${index}]`),
        );
      });
    }
  }

  if (typeOf(value) === "object" && value !== null) {
    const obj = value as Record<string, unknown>;

    for (const key of schema.required ?? []) {
      if (!(key in obj)) {
        out.push({ path: basePath, message: `missing required property '${key}'` });
      }
    }

    if (schema.additionalProperties === false && schema.properties) {
      const allowed = new Set(Object.keys(schema.properties));
      for (const key of Object.keys(obj)) {
        if (!allowed.has(key)) {
          out.push({
            path: `${basePath}.${key}`,
            message: `additional property '${key}' not permitted`,
          });
        }
      }
    }

    if (schema.properties) {
      for (const [key, subSchema] of Object.entries(schema.properties)) {
        if (key in obj) {
          out.push(
            ...validateAgainstSchema(obj[key], subSchema, `${basePath}.${key}`),
          );
        }
      }
    }
  }

  return out;
}
