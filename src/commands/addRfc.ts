import * as vscode from "vscode";
import {
  getActiveDocumentText,
  replaceActiveDocumentText,
  parseFrontmatter,
  updateFrontmatter,
} from "../shared/frontmatter.js";

/**
 * Handle the "Markdown: Add Related RFC" command.
 *
 * **Preconditions:**
 * - An active text editor must be visible.
 * - The document must have a YAML frontmatter block.
 *
 * **Behaviour:**
 * 1. Reads the current `related_rfcs` array from the frontmatter for context.
 * 2. Prompts the user for an RFC identifier (e.g. `RFC-0042`).
 * 3. Appends the new RFC if not already present (case-sensitive).
 * 4. Writes the change back to the editor.
 */
export async function handleAddRfc(): Promise<void> {
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

  const current = parsed.data.related_rfcs;
  const rfcs = Array.isArray(current) ? current : [];
  const contextLine = rfcs.length > 0 ? `Current: ${rfcs.join(", ")}` : "No RFCs yet";

  const rfc = await vscode.window.showInputBox({
    placeHolder: "RFC-0042",
    prompt: contextLine,
    title: "Add Related RFC",
  });

  if (!rfc) {
    return;
  }

  const updatedRfcs = [...rfcs];

  if (updatedRfcs.includes(rfc)) {
    vscode.window.showInformationMessage(`RFC "${rfc}" is already listed.`);
    return;
  }

  updatedRfcs.push(rfc);
  const updated = updateFrontmatter(text, { related_rfcs: updatedRfcs });
  await replaceActiveDocumentText(updated);

  vscode.window.showInformationMessage(`Added related RFC "${rfc}".`);
}
