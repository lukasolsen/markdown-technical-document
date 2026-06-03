import * as vscode from "vscode";
import {
  getActiveDocumentText,
  replaceActiveDocumentText,
  parseFrontmatter,
  updateFrontmatter,
} from "../shared/frontmatter.js";

/**
 * Handle the "Markdown: Add Document Author" command.
 *
 * **Preconditions:**
 * - An active text editor must be visible.
 * - The document must have a YAML frontmatter block.
 *
 * **Behaviour:**
 * 1. Reads the current `authors` array from the frontmatter for context.
 * 2. Prompts the user for an author name/email string.
 * 3. Appends the new author if not already present (case-sensitive).
 * 4. Writes the change back to the editor.
 */
export async function handleAddAuthor(): Promise<void> {
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
  const authors = Array.isArray(current) ? current : [];
  const contextLine = authors.length > 0 ? `Current: ${authors.join(", ")}` : "No authors yet";

  const name = await vscode.window.showInputBox({
    placeHolder: "Jane Doe <jane@example.com>",
    prompt: contextLine,
    title: "Add Author",
  });

  if (!name) {
    return;
  }

  const updatedAuthors = [...authors];

  if (updatedAuthors.includes(name)) {
    vscode.window.showInformationMessage(`Author "${name}" is already listed.`);
    return;
  }

  updatedAuthors.push(name);
  const updated = updateFrontmatter(text, { authors: updatedAuthors });
  await replaceActiveDocumentText(updated);

  vscode.window.showInformationMessage(`Added author "${name}".`);
}
