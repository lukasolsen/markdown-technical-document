import * as vscode from "vscode";
import { DocumentType } from "../types.js";
import { replaceActiveDocumentText, updateFrontmatter } from "../shared/frontmatter.js";

/**
 * Valid status transitions for each document type.
 *
 * The first entry in each array is the default status assigned when a
 * document is first created. The full list represents the allowed values
 * shown in the quick-pick when the user invokes the change-status command.
 */
const STATUS_OPTIONS: Record<DocumentType, string[]> = {
  [DocumentType.ADR]: ["Proposed", "Accepted", "Deprecated", "Superseded"],
  [DocumentType.SecurityAdvisory]: ["Draft", "Published", "Resolved"],
  [DocumentType.RFC]: ["Draft", "Review", "Accepted", "Rejected", "Implemented"],
};

/**
 * Infer the document type from the frontmatter keys present in the active
 * document.
 *
 * Heuristic: an ADR document has `adr_id`, a Security Advisory has `cve_id`,
 * and an RFC has `rfc_id`. If none match, returns `null`.
 */
function detectDocumentType(text: string): DocumentType | null {
  if (/^adr_id:/m.test(text)) {
    return DocumentType.ADR;
  }
  if (/^cve_id:/m.test(text)) {
    return DocumentType.SecurityAdvisory;
  }
  if (/^rfc_id:/m.test(text)) {
    return DocumentType.RFC;
  }
  return null;
}

/**
 * Handle the "Markdown: Change Document Status" command.
 *
 * **Preconditions:**
 * - An active text editor must be visible.
 * - The document must contain a YAML frontmatter block with a detectable
 *   document type (adr_id / cve_id / rfc_id).
 *
 * **Behaviour:**
 * 1. Detects the document type from the frontmatter.
 * 2. Reads the current status for display context.
 * 3. Presents a quick-pick listing the valid statuses for that type.
 * 4. Updates the `status` field in the frontmatter.
 * 5. Writes the change back to the editor.
 */
export async function handleChangeStatus(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("No active editor.");
    return;
  }

  const text = editor.document.getText();
  const docType = detectDocumentType(text);
  if (!docType) {
    vscode.window.showErrorMessage(
      "Could not detect document type. Make sure the file has a frontmatter block with adr_id, cve_id, or rfc_id.",
    );
    return;
  }

  // Extract current status so the user can see where they are.
  const currentStatusMatch = text.match(/^status:\s*(.+)/m);
  const currentStatus = currentStatusMatch ? currentStatusMatch[1].trim() : null;

  const options = STATUS_OPTIONS[docType];
  const items: vscode.QuickPickItem[] = options.map((s) => ({
    label: s,
    description: s === currentStatus ? "current" : undefined,
  }));

  const picked = await vscode.window.showQuickPick(items, {
    placeHolder: currentStatus
      ? `Current: ${currentStatus} — select new status`
      : `Select status for ${docType}`,
    title: "Change Document Status",
  });

  if (!picked) {
    return;
  }

  const updated = updateFrontmatter(text, { status: picked.label });
  await replaceActiveDocumentText(updated);

  vscode.window.showInformationMessage(`Status updated to "${picked.label}".`);
}
