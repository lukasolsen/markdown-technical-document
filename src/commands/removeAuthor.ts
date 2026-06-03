import * as vscode from "vscode";
import {
  getActiveDocumentText,
  replaceActiveDocumentText,
  parseFrontmatter,
  updateFrontmatter,
} from "../shared/frontmatter.js";

/**
 * Handle the "Markdown: Remove Document Author" command.
 *
 * **Preconditions:**
 * - An active text editor must be visible.
 * - The document must have a frontmatter block with an `authors` array.
 *
 * **Behaviour:**
 * 1. Reads the `authors` array from the frontmatter.
 * 2. If the array is empty or missing, shows an error.
 * 3. Presents a quick-pick of current authors to remove.
 * 4. Removes the selected author and writes the change back.
 */
export async function handleRemoveAuthor(): Promise<void> {
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

  const current = parsed.data.authors;
  const authors = Array.isArray(current) ? [...current] : [];

  if (authors.length === 0) {
    vscode.window.showErrorMessage("No authors to remove.");
    return;
  }

  const picked = await vscode.window.showQuickPick(authors, {
    placeHolder: "Select an author to remove",
    title: "Remove Author",
  });

  if (!picked) {
    return;
  }

  const filtered = authors.filter((a) => a !== picked);
  const updated = updateFrontmatter(text, { authors: filtered });
  await replaceActiveDocumentText(updated);

  vscode.window.showInformationMessage(`Removed author "${picked}".`);
}
