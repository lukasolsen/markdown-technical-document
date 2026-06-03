/**
 * Enumerates the supported technical document classifications.
 *
 * Each variant maps to a distinct naming convention and boilerplate template.
 * - `ADR`: Architecture Decision Record — sequentially numbered (ADR-NNN).
 * - `SecurityAdvisory`: Security Advisory / CVE — CVE-YYYY-SEQ identifier.
 * - `RFC`: Request for Comments — sequentially numbered (RFC-NNN).
 */
export enum DocumentType {
  ADR = "ADR",
  SecurityAdvisory = "Security Advisory",
  RFC = "RFC",
}

/**
 * Result descriptor returned after computing the next available file name for
 * a given document type.
 *
 * Consumers use `fileName` to construct the on-disk path and `label` for
 * user-facing messages. The `type` field allows callers to dispatch template
 * generation without re-parsing the name.
 */
export interface DocumentNamingResult {
  /** The document classification that drove name generation */
  type: DocumentType;

  /**
   * Computed file name stem (without `.md` extension).
   *
   * Examples: `"ADR-001"`, `"CVE-2026-7010"`, `"RFC-042"`.
   */
  fileName: string;

  /**
   * Human-readable label for display in notifications and quick-pick menus.
   * Currently identical to `fileName` but kept separate so display formatting
   * can evolve without affecting filesystem naming.
   */
  label: string;
}
