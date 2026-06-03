# Roadmap

## Overview

8 commands implemented, 1 shared utility tested, 3 templates finalized. The custom YAML
frontmatter parser is the primary technical risk -- it has zero test coverage and handles
a narrow subset of the YAML spec. Bug fixes come first, then test coverage, then the
surface features that make the extension feel complete (context menus, settings, keybindings).

---

## Phase 1 — Fix bugs

High-confidence defects that should be resolved before any new work.

- **Self-supersede for Security Advisories** (`src/commands/supersedeDocument.ts:48`).
  The candidate filter excludes the current document by checking `adr_id` and `rfc_id`,
  but Security Advisories carry `cve_id`. A Security Advisory can appear as a candidate
  to supersede itself.

- **Unhandled write-file rejection** (`src/commands/createDocument.ts:23`).
  `vscode.workspace.fs.writeFile` throws on permissions errors, disk full, or existing
  file conflicts. No try/catch exists -- the error propagates as an unhandled promise
  rejection.

- **Unused import** (`src/commands/changeStatus.ts:3`).
  `getActiveDocumentText` is imported but never referenced. The module uses
  `editor.document.getText()` directly. Won't cause runtime issues, but it indicates
  stale code and ties into the lint gap.

- **Stale build artifacts** (`out/command.js`, `out/templates.js`).
  Leftover from the `src/command.ts` → `src/commands/` restructuring. Won't affect
  runtime (esbuild outputs to `dist/`) but clutters the tree.

---

## Phase 2 — Test coverage

The frontmatter parser handles the core data flow for every command. A regression there
silently corrupts document metadata. Other gaps are listed by risk.

- **`src/shared/frontmatter.ts`** — Custom YAML parser with no tests.
  Must cover: parse round-trip, array values, missing keys, multi-line frontmatter,
  edge cases (no trailing `---`, empty frontmatter, whitespace-only values).

- **`src/commands/*.ts` (8 files)** — All command handlers are untested.
  Feasible approach: unit-test the logic branches (parse/cancel/duplicate/update)
  by extracting pure helpers from the VS Code API calls. Integration tests with
  a fake `vscode` environment are disproportionate for this project's scale.

- **`src/templates/index.ts`** — Template substitution and placeholder engine.
  Test each placeholder: `{{TITLE}}`, `{{ADR_ID}}`, `{{DATE}}`, the git author
  fallback path, and static-vs-dynamic placeholder distinction.

- **`src/docsManager.ts`** — Directory creation, caching semantics, and the new
  `listDocsDir` function. Mock `vscode.workspace.fs` for deterministic tests.

---

## Phase 3 — Lint and tooling

A minimal ruleset keeps code consistent and catches the class of bugs found in Phase 1.

- Add `@typescript-eslint/no-unused-imports` and `@typescript-eslint/no-unused-vars`
  to `eslint.config.mjs`.
- Add `no-console` (warn level) to catch debug logging in production code.
- Tighten `curly` from warn to error.
- Clean stale artifacts from `out/`.
- Verify `.docs/` appears in `.gitignore` so generated documents are never committed
  to the extension repo.

---

## Phase 4 — Context menus, settings, keybindings

The extension currently relies entirely on the command palette. Each of these additions
lowers friction.

- **`contributes.menus`** in `package.json`:
  - `editor/context` — "Insert Document Template", "Change Status", "Add Author",
    "Add Ticket", "Add Related RFC", "Supersede Document" when the active file has
    a `.md` extension.
  - `explorer/context` — "Create Document Template" in the explorer.

- **`contributes.configuration`** in `package.json`:
  - `markdownTechnicalDocument.cveBaseSeq` (number, default 1001) — starting value
    for CVE sequence numbering.
  - `markdownTechnicalDocument.defaultAuthor` (string, optional) — override for the
    git-derived author in templates.
  - `markdownTechnicalDocument.docsDirName` (string, default ".docs") — allows
    projects that already use `.docs/` for something else to pick a different name.

- **`contributes.keybindings`**:
  - One or two high-use shortcuts. For example `Ctrl+Shift+D C` for create document,
    `Ctrl+Shift+D S` for change status. The `D` chord namespace gives room to grow.

---

## Phase 5 — Completeness features

- **Browse / list documents** — A quick-pick command that scans `.docs/`, parses
  the frontmatter of each file, and shows a navigable list with title, type, status,
  and author. Selecting an entry opens that file.

- **Document rename** — Renames an ADR, RFC, or Security Advisory file and updates
  all cross-references in other documents' `superseded_by` and `related_rfcs` fields.

- **Impact areas management** — The ADR template declares `impact_areas` in its
  frontmatter. No command exists to add or remove entries. Same gap exists for
  `epics` (RFC) and `affected_versions` (Security Advisory).

- **Document diagnostics** — Register a `vscode.DocumentDiagnosticProvider` for
  markdown files in `.docs/` that validates required frontmatter fields, checks
  that referenced documents exist (`superseded_by`, `related_rfcs`), and warns
  about missing status transitions (e.g., RFC going from "Draft" directly to
  "Implemented" without "Review").

- **Document links provider** — Make references like `ADR-001` or `RFC-0042`
  clickable in the editor, navigating to the target file.

---

## Phase 6 — Publishing

- **README** — Replace the `yo code` placeholder with a description, command table,
  animated GIF of the create-document flow, and a quick-start.

- **LICENSE** — MIT. Single file, no further decision required.

- **`package.json` metadata** — Fill in `description`, add `repository`, `bugs`,
  `homepage`, `license`, and `keywords`.

- **CI** — GitHub Actions workflow:
  - On PR: `pnpm install`, `pnpm run check-types`, `pnpm run lint`, `pnpm test`.
  - On tag push: build `.vsix`, optionally publish to the VS Code marketplace.

- **CHANGELOG.md** — Adopt keepachangelog format. Populate the unreleased section
  with the work done so far.

---

## Phase 7 — Polish

- **Async filesystem I/O** — `naming.ts` uses `fs.existsSync` and `fs.readdirSync`.
  These block the event loop. With `.docs/` on a network mount or a slow disk this
  becomes visible. Replace with `fs.promises` equivalents.

- **Lazy git author** — `templates/index.ts` calls `execSync` with a 2-second timeout
  at module load time. Worst-case: 4 seconds blocked before any command runs. Defer
  the git call until template generation actually needs the value.

- **Frontmatter parser robustness** — The custom parser discards YAML comments,
  reformats indentation, double-quotes values, and cannot handle multi-line strings.
  If the project grows, replace it with a proper YAML library (`yaml` npm package).
  For now the flat schema makes the custom parser acceptable, but the round-trip
  fidelity loss is a known constraint.

- **Progress indication** — Wrap long operations (document creation, diagnostics scan)
  in `vscode.window.withProgress` so the user gets visual feedback.
