import * as vscode from "vscode";
import { DocumentType } from "../types.js";
import {
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_TYPE_DETAILS,
  QUICK_PICK_PLACEHOLDER,
} from "../constants.js";

/**
 * Present a quick-pick menu to let the user choose a document type.
 *
 * Items are built from the `DocumentType` enum; the label and description
 * come from `DOCUMENT_TYPE_LABELS` and `DOCUMENT_TYPE_DETAILS` respectively.
 *
 * @returns The selected `DocumentType`, or `undefined` if the user cancelled.
 */
export async function pickDocumentType(): Promise<DocumentType | undefined> {
  const items: vscode.QuickPickItem[] = Object.values(DocumentType).map((type) => ({
    label: DOCUMENT_TYPE_LABELS[type],
    description: DOCUMENT_TYPE_DETAILS[type],
  }));

  const picked = await vscode.window.showQuickPick(items, {
    placeHolder: QUICK_PICK_PLACEHOLDER,
    title: "Create Document Template",
  });

  if (!picked) {
    return undefined;
  }

  const entry = Object.entries(DOCUMENT_TYPE_LABELS).find(
    ([_, label]) => label === picked.label,
  );
  return entry ? (entry[0] as DocumentType) : undefined;
}
