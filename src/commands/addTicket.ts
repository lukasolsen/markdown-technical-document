import * as vscode from "vscode";
import {
  getActiveDocumentText,
  replaceActiveDocumentText,
  parseFrontmatter,
  updateFrontmatter,
} from "../shared/frontmatter.js";

/**
 * Handle the "Markdown: Add Document Ticket" command.
 *
 * **Preconditions:**
 * - An active text editor must be visible.
 * - The document must have a YAML frontmatter block.
 *
 * **Behaviour:**
 * 1. Reads the current `tickets` array from the frontmatter for context.
 * 2. Prompts the user for a ticket identifier (e.g. `PROJ-1234`).
 * 3. Appends the new ticket if not already present (case-sensitive).
 * 4. Writes the change back to the editor.
 */
export async function handleAddTicket(): Promise<void> {
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

  const current = parsed.data.tickets;
  const tickets = Array.isArray(current) ? current : [];
  const contextLine = tickets.length > 0 ? `Current: ${tickets.join(", ")}` : "No tickets yet";

  const ticket = await vscode.window.showInputBox({
    placeHolder: "PROJ-1234",
    prompt: contextLine,
    title: "Add Ticket",
  });

  if (!ticket) {
    return;
  }

  const updatedTickets = [...tickets];

  if (updatedTickets.includes(ticket)) {
    vscode.window.showInformationMessage(`Ticket "${ticket}" is already listed.`);
    return;
  }

  updatedTickets.push(ticket);
  const updated = updateFrontmatter(text, { tickets: updatedTickets });
  await replaceActiveDocumentText(updated);

  vscode.window.showInformationMessage(`Added ticket "${ticket}".`);
}
