import type { ZiweiSchool } from "../../../facts";
import { namPhaiDomainResolver } from "./nam-phai-domain-resolver";
import { trungChauDomainResolver } from "./trung-chau-domain-resolver";
import type { AnnualAxisDomainResolver } from "./types";

/** Pick the school-specific domain-anchor resolver. Unknown schools throw
 * — the analyzer only ever calls this with an already-validated
 * `ZiweiSchool`, so an unknown value here indicates a caller bug. */
export function selectResolver(school: ZiweiSchool): AnnualAxisDomainResolver {
  switch (school) {
    case "nam-phai":
      return namPhaiDomainResolver;
    case "trung-chau":
      return trungChauDomainResolver;
    default: {
      const exhaustive: never = school;
      throw new Error(`unknown school: ${String(exhaustive)}`);
    }
  }
}

export { namPhaiDomainResolver } from "./nam-phai-domain-resolver";
export { trungChauDomainResolver } from "./trung-chau-domain-resolver";
export { resolveAnnualFocus } from "./resolve-annual-focus";
export type * from "./types";
