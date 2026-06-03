# Markdown Technical Document

A VS Code extension for managing architecture decision records (ADRs), RFCs, and security advisories as markdown files with YAML frontmatter.

## Why

Teams need a structured way to record decisions, proposals, and security findings. This extension creates well-formatted markdown documents with consistent frontmatter metadata, so you can track status, authors, and cross-references without fiddling with templates manually.

## What it does

Three document types, each with its own template and numbering:

- **ADR** (Architecture Decision Record) — numbered `ADR-001`, `ADR-002`, ...
- **RFC** (Request for Comments) — numbered `RFC-001`, `RFC-002`, ...
- **Security Advisory** — numbered `CVE-YYYY-NNNN`, based on the current year.

Documents are stored in a `.docs/` directory with type-specific subdirectories:

```
.docs/
├── adr/
│   ├── ADR-001.md
│   └── ADR-002.md
├── rfc/
│   └── RFC-001.md
└── securityAdvisory/
    └── CVE-2026-1001.md
```

## Commands

Open the command palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and type "Docs:":

| Command | What it does |
|---|---|
| **Docs: Create Document Template** | Creates a new `.md` file in the correct subdirectory |
| **Docs: Insert Document Template** | Inserts boilerplate into the currently open file |
| **Docs: Change Status** | Updates the `status` field in frontmatter |
| **Docs: Add Author** | Appends an author to the `authors` array |
| **Docs: Remove Author** | Removes an author from the `authors` array |
| **Docs: Add Ticket** | Adds a ticket reference (e.g. `PROJ-1234`) |
| **Docs: Add Related RFC** | Links an RFC reference to the current document |
| **Docs: Supersede Document** | Marks the current document as superseded by another |

## Settings

Configure where documents are stored via `markdownTechnicalDocument.docsDir` in your workspace settings:

```json
{
  "markdownTechnicalDocument.docsDir": {
    "root": ".docs",
    "adr": "adr",
    "rfc": "rfc",
    "securityAdvisory": "securityAdvisory"
  }
}
```

All paths are relative to your workspace root. Change `root` to use a different top-level directory, or change individual subdirectory names to match your project's conventions.

## Installation

### From source

```bash
git clone <repo-url>
cd markdown-technical-document
pnpm install
pnpm run package
```

Then in VS Code: **Extensions > ... > Install from VSIX** and pick the generated `.vsix` file from the project root.

### From marketplace

Search for "Markdown Technical Document" in the VS Code extensions panel and click Install.

## Publishing to the VS Code Marketplace

To publish this extension and install it from any machine:

1. **Create a publisher account** at [https://marketplace.visualstudio.com/manage/createpublisher](https://marketplace.visualstudio.com/manage/createpublisher). You need a name (e.g. `your-publisher-id`) and a PAT (Personal Access Token) with **Marketplace > Manage** scope.

2. **Set the publisher in `package.json`** — add a top-level field:

   ```json
   "publisher": "your-publisher-id"
   ```

3. **Install vsce** (the publishing CLI):

   ```bash
   npm install -g @vscode/vsce
   ```

4. **Package the extension**:

   ```bash
   pnpm run package
   vsce package
   ```

   This produces a `.vsix` file.

5. **Publish**:

   ```bash
   vsce publish
   ```

   You'll be prompted for your PAT (or set it via `VSCE_PAT` environment variable).

6. **Install on your work computer** — once published, open VS Code, go to Extensions, search for "Markdown Technical Document", and click Install. It pulls directly from the marketplace.

If you only need it on machines you control and don't want it public, you can skip the marketplace and instead:

- Share the `.vsix` file directly, then install with: **Extensions > ... > Install from VSIX**
- Or use a private feed (Azure Artifacts, GitHub Packages) with `vsce publish --source <feed-url>`
