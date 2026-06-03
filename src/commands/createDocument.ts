import * as vscode from "vscode";
import { DocumentNamingResult } from "../types.js";
import { pickDocumentType } from "../shared/documentPicker.js";
import { ensureDocsTypeDir } from "../docsManager.js";
import { computeDocumentName } from "../naming.js";
import { generateTemplate } from "../templates/index.js";

/**
 * Write the boilerplate to a new `.md` file in the type-specific subdirectory
 * and open it in the editor.
 *
 * @param naming - The resolved naming result from `computeDocumentName`.
 * @param docsDir - The URI of the type-specific directory (e.g. `.docs/adr`).
 */
async function createDocumentFile(
  naming: DocumentNamingResult,
  docsDir: vscode.Uri,
): Promise<void> {
  const fileUri = vscode.Uri.joinPath(docsDir, `${naming.fileName}.md`);

  const content = generateTemplate(naming.type, naming.fileName);

  try {
    await vscode.workspace.fs.writeFile(fileUri, Buffer.from(content, "utf-8"));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    vscode.window.showErrorMessage(
      `Failed to create ${naming.fileName}.md: ${message}`,
    );
    return;
  }

  const document = await vscode.workspace.openTextDocument(fileUri);
  await vscode.window.showTextDocument(document);

  vscode.window.showInformationMessage(
    `Created ${naming.type}: ${naming.fileName}`,
  );
}

/**
 * Handle the "Markdown: Create Document Template" command.
 *
 * **Flow:**
 * 1. Ensure the docs directory and type-specific subdirectory exist.
 * 2. Show a quick-pick for the document type (ADR / Security Advisory / RFC).
 * 3. Compute the next available file name based on existing documents in the
 *    type-specific subdirectory.
 * 4. Write the boilerplate template to disk.
 * 5. Open the new file in the editor.
 */
export async function handleCreateDocumentTemplate(): Promise<void> {
  const docType = await pickDocumentType();
  if (!docType) {
    return;
  }

  const typeDir = await ensureDocsTypeDir(docType);
  if (!typeDir) {
    vscode.window.showErrorMessage(
      "No workspace folder is open. Please open a folder first.",
    );
    return;
  }

  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    vscode.window.showErrorMessage("Workspace folder unexpectedly missing.");
    return;
  }

  const naming = computeDocumentName(docType, workspaceFolder.uri.fsPath);

  await createDocumentFile(naming, typeDir);
}
