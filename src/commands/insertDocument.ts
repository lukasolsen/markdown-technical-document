import * as vscode from "vscode";
import { pickDocumentType } from "../shared/documentPicker.js";
import { generateTemplate } from "../templates/index.js";

/**
 * Handle the "Markdown: Insert Document Template" command.
 *
 * **Preconditions:**
 * - An active text editor must be visible.
 * - The active document must be a Markdown file (language ID `markdown`).
 *
 * **Behaviour:**
 * 1. Checks the preconditions above; shows an error message if unmet.
 * 2. If the document already has non-whitespace content, prompts the user
 *    with a warning confirmation dialog before proceeding.
 * 3. Shows the document-type quick-pick.
 * 4. Generates the boilerplate with a generic title line since there is no
 *    associated file name in this flow.
 * 5. Inserts the generated text at the current cursor position (or at the
 *    very top of the document if the cursor is at the start of an empty
 *    buffer or the selection is empty).
 *
 * The insertion uses a TextEdit applied via the WorkspaceEdit API so that it
 * respects undo history.
 */
export async function handleInsertDocumentTemplate(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage(
      "No active editor. Open a Markdown file and try again.",
    );
    return;
  }

  if (editor.document.languageId !== "markdown") {
    vscode.window.showErrorMessage(
      "This command can only be used in Markdown files (.md).",
    );
    return;
  }

  const text = editor.document.getText();
  if (text.trim().length > 0) {
    const choice = await vscode.window.showWarningMessage(
      "The current file already has content. The template will be inserted at your cursor position. Continue?",
      { modal: true },
      "Insert",
      "Cancel",
    );
    if (choice !== "Insert") {
      return;
    }
  }

  const docType = await pickDocumentType();
  if (!docType) {
    return;
  }

  const template = generateTemplate(docType, "Untitled Document");

  const position =
    editor.selection.active ??
    new vscode.Position(0, 0);

  editor.edit((editBuilder) => {
    editBuilder.insert(position, template + "\n");
  });
}
