import { execSync } from "child_process";
import { DocumentType } from "../types.js";
import adrTemplate from "./adr.md";
import securityAdvisoryTemplate from "./securityAdvisory.md";
import rfcTemplate from "./rfc.md";

/**
 * Map from document type to the raw markdown template string.
 *
 * Templates are loaded at build time by esbuild's `text` loader and bundled
 * directly into the extension. This avoids filesystem I/O at runtime and
 * keeps the templates in plain markdown for easy editing.
 */
const TEMPLATES: Record<DocumentType, string> = {
  [DocumentType.ADR]: adrTemplate,
  [DocumentType.SecurityAdvisory]: securityAdvisoryTemplate,
  [DocumentType.RFC]: rfcTemplate,
};

/**
 * Today's date formatted as `YYYY-MM-DD` in the local timezone.
 *
 * Cache is computed once at module load to avoid drift during long-running
 * sessions. In practice this is safe because a single extension activation
 * will only generate documents within a short time window.
 */
const TODAY = (() => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
})();

/**
 * The current calendar year, e.g. `"2026"`.
 */
const CURRENT_YEAR = String(new Date().getFullYear());

/**
 * Attempt to read the git user identity from `git config`.
 *
 * Runs `git config user.name` and `git config user.email` and combines them
 * into the standard `Name <email>` format.
 *
 * **Failure modes / edge cases:**
 * - If `git` is not installed, not on `PATH`, or not inside a repository,
 *   `execSync` throws. The catch block returns a descriptive HTML comment
 *   so the template is still usable — the author just needs to fill it in.
 * - Leading/trailing whitespace from git output is trimmed.
 * - `execSync` is used with a fixed command string (no user input) so there
 *   is no command-injection risk.
 *
 * @returns A string like `"Jane Doe <jane@example.com>"`, or a fallback
 *          HTML comment instructing the user to configure git.
 */
function getGitAuthor(): string {
  try {
    const name = execSync("git config user.name", {
      encoding: "utf-8",
      timeout: 2_000,
    }).trim();
    const email = execSync("git config user.email", {
      encoding: "utf-8",
      timeout: 2_000,
    }).trim();
    return `${name} <${email}>`;
  } catch {
    return "<!-- Set git user.name and user.email to populate author -->";
  }
}

/**
 * Cached git author string, computed once at module load.
 *
 * Computing this lazily on first access rather than eagerly at import time
 * avoids a potential git invocation during test runs where no repo exists.
 * However, since the template module is only imported when a command runs,
 * eager evaluation is equivalent and simpler.
 */
const GIT_AUTHOR = getGitAuthor();

/**
 * Placeholders whose value is supplied per-call rather than at module load.
 *
 * These are excluded from the static `PLACEHOLDERS` map and instead resolved
 * from the `title` parameter passed to `generateTemplate`. `{{TITLE}}`,
 * `{{ADR_ID}}`, and `{{RFC_ID}}` all receive the same caller-supplied title
 * stem so each template can use the naming convention appropriate to its
 * document type.
 */
const DYNAMIC_PLACEHOLDERS = new Set(["{{TITLE}}", "{{ADR_ID}}", "{{RFC_ID}}"]);

/**
 * All supported placeholders and their computed replacements.
 *
 * Extending this map is the single point of change for adding new automatic
 * fields to any template. Each placeholder **must** be a unique string that
 * does not appear as a legitimate content value.
 */
const PLACEHOLDERS: Record<string, string> = {
  "{{DATE}}": TODAY,
  "{{YEAR}}": CURRENT_YEAR,
  "{{AUTHOR}}": GIT_AUTHOR,
  "{{STATUS}}": "Proposed",
  "{{SUPERSEDED_BY}}": "N/A",
  "{{TARGET_VERSION}}": "v0.1.0",
};

/**
 * Generate boilerplate markdown content for the given document type.
 *
 * Loads the raw template from the pre-bundled markdown file, substitutes
 * all known placeholders with their computed values, and returns the
 * result.
 *
 * Placeholder substitution uses `String.prototype.replaceAll` which is
 * safe against special regex characters because the placeholders are
 * plain-text strings containing no regex metacharacters.
 *
 * @param type - The document type to generate a template for.
 * @param title - The title stem to inject (replaces `{{TITLE}}` and
 *                `{{ADR_ID}}`), e.g. `"ADR-001"` or `"CVE-2026-7010"`.
 * @returns Markdown string with placeholder sections for the user to fill in.
 */
export function generateTemplate(type: DocumentType, title: string): string {
  let result = TEMPLATES[type];

  for (const [placeholder, value] of Object.entries(PLACEHOLDERS)) {
    result = result.replaceAll(placeholder, value);
  }

  for (const placeholder of DYNAMIC_PLACEHOLDERS) {
    result = result.replaceAll(placeholder, title);
  }

  return result;
}
