import * as vscode from "vscode";
import {
  getActiveDocumentText,
  replaceActiveDocumentText,
  parseFrontmatter,
  updateFrontmatter,
} from "../shared/frontmatter.js";
import { listDocsDir } from "../docsManager.js";

/**
 * Handle the "Markdown: Supersede Document" command.
 *
 * **Preconditions:**
 * - An active text editor must be visible.
 * - The document must have a frontmatter block with `superseded_by` field
 *   (ADR documents) or an equivalent mechanism.
 *
 * **Behaviour:**
 * 1. Reads the current `superseded_by` and `status` from the frontmatter.
 * 2. Scans the `.docs/` directory for candidate documents to reference.
 * 3. Presents a quick-pick with existing documents (user can also type a
 *    free-form ID such as `ADR-0042`).
 * 4. Sets `superseded_by` to the selected value.
 * 5. For ADR documents also flips `status` to `"Superseded"`.
 * 6. Writes the changes back to the editor.
 */
export async function handleSupersedeDocument(): Promise<void> {
  const text = getActiveDocumentText();
  if (!text) {
    vscode.window.showErrorMessage("No active editor.");
    return;
  }

  const parsed = parseFrontmatter(text);
  if (!parsed) {
    vscode.window.showErrorMessage("No frontmatter block found in this document.");
    return;
  }

  // Show context about the current document.
  const currentSupersededBy = parsed.data.superseded_by ?? "—";
  const currentStatus = parsed.data.status ?? "—";
  const contextDetail = `Status: ${currentStatus}  ·  Superseded by: ${currentSupersededBy}`;

  // Collect candidates from the .docs/ directory.
  const docs = await listDocsDir();
  const items: vscode.QuickPickItem[] = docs
    .filter(
      (d) =>
        d.stem !== parsed.data.adr_id &&
        d.stem !== parsed.data.rfc_id &&
        d.stem !== parsed.data.cve_id,
    )
    .map((d) => ({
      label: d.stem,
      description: d.fileName,
    }));

  const picked = await vscode.window.showQuickPick(items, {
    placeHolder: "Type an ID (e.g. ADR-0042) or pick from existing documents",
    title: "Supersede Document",
    ignoreFocusOut: true,
  });

  const superseder = picked?.label ?? (
    await vscode.window.showInputBox({
      placeHolder: "ADR-0042",
      prompt: contextDetail,
      title: "Supersede Document",
    })
  );

  if (!superseder) {
    return;
  }

  const updates: Record<string, string | string[] | undefined> = {
    superseded_by: superseder,
  };

  // For ADR documents also flip the status to "Superseded".
  if (parsed.data.adr_id !== undefined) {
    updates.status = "Superseded";
  }

  const updated = updateFrontmatter(text, updates);
  await replaceActiveDocumentText(updated);

  vscode.window.showInformationMessage(
    `Document marked as superseded by "${superseder}".`,
  );
}
