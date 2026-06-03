import * as vscode from "vscode";
import {
  COMMAND_ID_CREATE,
  COMMAND_ID_INSERT,
  COMMAND_ID_CHANGE_STATUS,
  COMMAND_ID_ADD_AUTHOR,
  COMMAND_ID_REMOVE_AUTHOR,
  COMMAND_ID_ADD_TICKET,
  COMMAND_ID_ADD_RFC,
  COMMAND_ID_SUPERSEDE,
} from "./constants.js";
import { handleCreateDocumentTemplate } from "./commands/createDocument.js";
import { handleInsertDocumentTemplate } from "./commands/insertDocument.js";
import { handleChangeStatus } from "./commands/changeStatus.js";
import { handleAddAuthor } from "./commands/addAuthor.js";
import { handleRemoveAuthor } from "./commands/removeAuthor.js";
import { handleAddTicket } from "./commands/addTicket.js";
import { handleAddRfc } from "./commands/addRfc.js";
import { handleSupersedeDocument } from "./commands/supersedeDocument.js";

/**
 * Activate the extension.
 *
 * Registers all commands contributed to the VS Code command palette:
 *
 * **Creation & insertion:**
 * - `createDocumentTemplate` — creates a new document file in `.docs/`
 * - `insertDocumentTemplate` — inserts boilerplate into the active file
 *
 * **Metadata management** (operate on the active document's frontmatter):
 * - `changeStatus` — type-aware status picker
 * - `addAuthor` — append an author to the frontmatter
 * - `removeAuthor` — remove an author via quick-pick
 * - `addTicket` — append a ticket reference
 * - `addRfc` — append a related RFC reference
 * - `supersedeDocument` — set superseded_by and (for ADRs) flip status
 *
 * @param context - The VS Code extension context provided at activation time.
 */
export function activate(context: vscode.ExtensionContext): void {
  const registrations = [
    vscode.commands.registerCommand(COMMAND_ID_CREATE, handleCreateDocumentTemplate),
    vscode.commands.registerCommand(COMMAND_ID_INSERT, handleInsertDocumentTemplate),
    vscode.commands.registerCommand(COMMAND_ID_CHANGE_STATUS, handleChangeStatus),
    vscode.commands.registerCommand(COMMAND_ID_ADD_AUTHOR, handleAddAuthor),
    vscode.commands.registerCommand(COMMAND_ID_REMOVE_AUTHOR, handleRemoveAuthor),
    vscode.commands.registerCommand(COMMAND_ID_ADD_TICKET, handleAddTicket),
    vscode.commands.registerCommand(COMMAND_ID_ADD_RFC, handleAddRfc),
    vscode.commands.registerCommand(COMMAND_ID_SUPERSEDE, handleSupersedeDocument),
  ];

  context.subscriptions.push(...registrations);
}

/**
 * Deactivate the extension.
 *
 * Cleanup hook called by VS Code when the extension is deactivated.
 * Currently a no-op since all resources are managed via `context.subscriptions`.
 */
export function deactivate(): void {
  // No-op
}
