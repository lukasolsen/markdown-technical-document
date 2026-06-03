import * as path from "path";
import * as fs from "fs";
import { DocumentType, DocumentNamingResult } from "./types.js";
import { getDocsTypePath } from "./settings.js";

/**
 * A regex that matches existing ADR file names.
 *
 * Format: `ADR-001.md`, `ADR-002.md`, etc.
 * Capture group 1 yields the numeric portion as a decimal string.
 */
const ADR_FILE_RE = /^ADR-(\d+)\.md$/;

/**
 * A regex that matches existing RFC file names.
 *
 * Format: `RFC-001.md`, `RFC-002.md`, etc.
 * Capture group 1 yields the numeric portion as a decimal string.
 */
const RFC_FILE_RE = /^RFC-(\d+)\.md$/;

/**
 * A regex that matches existing Security Advisory / CVE file names.
 *
 * Format: `CVE-2026-7009.md`, `CVE-2026-7010.md`, etc.
 * Capture groups: year (group 1), sequential id (group 2).
 */
const CVE_FILE_RE = /^CVE-(\d{4})-(\d+)\.md$/;

/**
 * Format an ADR number as a zero-padded three-digit string.
 *
 * @example
 * formatAdrNumber(1)   // => "001"
 * formatAdrNumber(42)  // => "042"
 * formatAdrNumber(999) // => "999"
 */
export function formatAdrNumber(n: number): string {
  return String(n).padStart(3, "0");
}

/**
 * Format an RFC number as a zero-padded three-digit string.
 *
 * @example
 * formatRfcNumber(1)   // => "001"
 * formatRfcNumber(42)  // => "042"
 */
export const formatRfcNumber = formatAdrNumber;

/**
 * Parse the numeric portion from an ADR file name.
 *
 * @param name - File name stem or full file name (e.g. "ADR-001" or "ADR-001.md").
 * @returns The numeric value, or `null` if the name does not match.
 *
 * @example
 * parseAdrNumber("ADR-001.md") // => 1
 * parseAdrNumber("ADR-042")    // => 42
 */
export function parseAdrNumber(name: string): number | null {
  const clean = name.replace(/\.md$/, "");
  const m = ADR_FILE_RE.exec(clean + ".md");
  return m ? parseInt(m[1], 10) : null;
}

/**
 * Parse the numeric portion from an RFC file name.
 *
 * @param name - File name stem or full file name.
 * @returns The numeric value, or `null` if the name does not match.
 */
export function parseRfcNumber(name: string): number | null {
  const clean = name.replace(/\.md$/, "");
  const m = RFC_FILE_RE.exec(clean + ".md");
  return m ? parseInt(m[1], 10) : null;
}

/**
 * Parse year and sequence from a CVE file name.
 *
 * @param name - File name stem or full file name (e.g. "CVE-2026-7009.md").
 * @returns An object with `year` and `seq`, or `null` if the name does not match.
 *
 * @example
 * parseCveNumber("CVE-2026-7009.md") // => { year: 2026, seq: 7009 }
 * parseCveNumber("CVE-2026-7010")    // => { year: 2026, seq: 7010 }
 */
export function parseCveNumber(name: string): { year: number; seq: number } | null {
  const clean = name.replace(/\.md$/, "");
  const m = CVE_FILE_RE.exec(clean + ".md");
  return m ? { year: parseInt(m[1], 10), seq: parseInt(m[2], 10) } : null;
}

/**
 * Get the next CVE sequence number for the given year by scanning existing files.
 *
 * Scans all `.md` files in the type-specific subdirectory (e.g. `.docs/securityAdvisory/`)
 * matching the CVE pattern for the specified year and returns one greater than the
 * highest found. If no existing files match, returns the base (first) sequence
 * number instead.
 *
 * **How it works:**
 * 1. Resolves the type-specific directory via `getDocsTypePath`.
 * 2. Lists all files in that directory.
 * 3. Filters for files matching the CVE pattern `CVE-<year>-<seq>.md`.
 * 4. Extracts the highest `seq` value among matches.
 * 5. Returns `highestSeq + 1`, or `baseSeq` if none were found.
 *
 * **Failure modes / edge cases:**
 * - If the directory does not exist yet, the function returns `baseSeq`.
 * - Non-CVE files (e.g. `ADR-001.md`, `README.md`) are silently ignored.
 * - Files with malformed sequence numbers that fail `parseInt` are skipped.
 * - The function does **not** validate that the path is a directory; any
 *   `fs.readdirSync` error is propagated to the caller.
 *
 * @param year - The CVE year (e.g. 2026).
 * @param workspaceRoot - Absolute path to the workspace root.
 * @param baseSeq - The sequence number to start at when no files exist (default 1001).
 * @returns The next sequence number to use.
 */
export function getNextCveSeq(
  year: number,
  workspaceRoot: string,
  baseSeq = 1001,
): number {
  const docsDir = getDocsTypePath(DocumentType.SecurityAdvisory, workspaceRoot);

  if (!fs.existsSync(docsDir)) {
    return baseSeq;
  }

  let maxSeq = -1;
  const entries = fs.readdirSync(docsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }
    const parsed = parseCveNumber(entry.name);
    if (parsed && parsed.year === year && parsed.seq > maxSeq) {
      maxSeq = parsed.seq;
    }
  }

  return maxSeq === -1 ? baseSeq : maxSeq + 1;
}

/**
 * Get the next ADR sequence number by scanning existing ADR files.
 *
 * Scans all `.md` files in the type-specific subdirectory (e.g. `.docs/adr/`)
 * matching the ADR pattern and returns one greater than the highest found,
 * or `1` if none exist.
 *
 * @param workspaceRoot - Absolute path to the workspace root.
 * @returns The next ADR number.
 */
export function getNextAdrNumber(workspaceRoot: string): number {
  const docsDir = getDocsTypePath(DocumentType.ADR, workspaceRoot);

  if (!fs.existsSync(docsDir)) {
    return 1;
  }

  let maxNum = 0;
  const entries = fs.readdirSync(docsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }
    const num = parseAdrNumber(entry.name);
    if (num !== null && num > maxNum) {
      maxNum = num;
    }
  }

  return maxNum + 1;
}

/**
 * Get the next RFC sequence number by scanning existing RFC files.
 *
 * Scans all `.md` files in the type-specific subdirectory (e.g. `.docs/rfc/`)
 * matching the RFC pattern and returns one greater than the highest found,
 * or `1` if none exist.
 *
 * @param workspaceRoot - Absolute path to the workspace root.
 * @returns The next RFC number.
 */
export function getNextRfcNumber(workspaceRoot: string): number {
  const docsDir = getDocsTypePath(DocumentType.RFC, workspaceRoot);

  if (!fs.existsSync(docsDir)) {
    return 1;
  }

  let maxNum = 0;
  const entries = fs.readdirSync(docsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }
    const num = parseRfcNumber(entry.name);
    if (num !== null && num > maxNum) {
      maxNum = num;
    }
  }

  return maxNum + 1;
}

/**
 * Compute the file name and label for a new document of the given type.
 *
 * For **ADR** and **RFC** types, existing documents in the type-specific
 * subdirectory are scanned to find the next sequential number, formatted as
 * a zero-padded three-digit string.
 *
 * For **Security Advisory**, existing CVE files for the current year in the
 * type-specific subdirectory are scanned to produce the next sequential
 * identifier (e.g. CVE-2026-7010).
 *
 * **Failure modes / edge cases:**
 * - If the type-specific subdirectory does not exist, ADR/RFC start at `001`
 *   and CVEs start at `CVE-<currentYear>-1001`.
 * - `fs.readdirSync` errors (permissions, non-directory) propagate to the caller.
 * - The returned label is human-readable and includes the file name.
 *
 * @param type - The document type to generate a name for.
 * @param workspaceRoot - Absolute path to the workspace root.
 * @returns A `DocumentNamingResult` containing the type, file name, and label.
 */
export function computeDocumentName(
  type: DocumentType,
  workspaceRoot: string,
): DocumentNamingResult {
  switch (type) {
    case DocumentType.ADR: {
      const num = getNextAdrNumber(workspaceRoot);
      const fileName = `ADR-${formatAdrNumber(num)}`;
      return { type, fileName, label: fileName };
    }

    case DocumentType.SecurityAdvisory: {
      const year = new Date().getFullYear();
      const seq = getNextCveSeq(year, workspaceRoot);
      const fileName = `CVE-${year}-${seq}`;
      return { type, fileName, label: fileName };
    }

    case DocumentType.RFC: {
      const num = getNextRfcNumber(workspaceRoot);
      const fileName = `RFC-${formatRfcNumber(num)}`;
      return { type, fileName, label: fileName };
    }
  }
}
