import { DocumentType } from "./types.js";

/**
 * Default name of the hidden directory that serves as the workspace-level root
 * for all generated technical documents. Created automatically on first use.
 * Configurable via `markdownTechnicalDocument.docsDir.root`.
 */
export const DOCS_DIR_ROOT = ".docs";

/** Default subdirectory for Architecture Decision Records. */
export const DOCS_DIR_ADR = "adr";

/** Default subdirectory for Request for Comments documents. */
export const DOCS_DIR_RFC = "rfc";

/** Default subdirectory for Security Advisory / CVE documents. */
export const DOCS_DIR_SECURITY_ADVISORY = "securityAdvisory";

/**
 * Fully-qualified VS Code command identifier for the "create document file"
 * workflow. Bound to the `Markdown: Create Document Template` command title.
 */
export const COMMAND_ID_CREATE = "markdown-technical-document.createDocumentTemplate";

/**
 * Fully-qualified VS Code command identifier for the "insert into active file"
 * workflow. Bound to the `Markdown: Insert Document Template` command title.
 */
export const COMMAND_ID_INSERT = "markdown-technical-document.insertDocumentTemplate";

/**
 * Public-facing title for the create-document-file command contributed to the
 * VS Code command palette.
 */
export const COMMAND_TITLE_CREATE = "Docs: Create Document Template";

/**
 * Public-facing title for the insert-into-active-file command contributed to
 * the VS Code command palette.
 */
export const COMMAND_TITLE_INSERT = "Docs: Insert Document Template";

// ---- Document metadata management commands ---- //

export const COMMAND_ID_CHANGE_STATUS = "markdown-technical-document.changeStatus";
export const COMMAND_TITLE_CHANGE_STATUS = "Docs: Change Status";

export const COMMAND_ID_ADD_AUTHOR = "markdown-technical-document.addAuthor";
export const COMMAND_TITLE_ADD_AUTHOR = "Docs: Add Author";

export const COMMAND_ID_REMOVE_AUTHOR = "markdown-technical-document.removeAuthor";
export const COMMAND_TITLE_REMOVE_AUTHOR = "Docs: Remove Author";

export const COMMAND_ID_ADD_TICKET = "markdown-technical-document.addTicket";
export const COMMAND_TITLE_ADD_TICKET = "Docs: Add Ticket";

export const COMMAND_ID_ADD_RFC = "markdown-technical-document.addRfc";
export const COMMAND_TITLE_ADD_RFC = "Docs: Add Related RFC";

export const COMMAND_ID_SUPERSEDE = "markdown-technical-document.supersedeDocument";
export const COMMAND_TITLE_SUPERSEDE = "Docs: Supersede Document";

/**
 * Maps each document type variant to the short label presented in the
 * quick-pick dialog. These labels mirror the enum string values.
 */
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  [DocumentType.ADR]: "ADR",
  [DocumentType.SecurityAdvisory]: "Security Advisory",
  [DocumentType.RFC]: "RFC",
};

/**
 * Maps each document type variant to a detailed description displayed as
 * secondary text in the quick-pick dialog. The detail clarifies the
 * document's purpose and identifier format.
 */
export const DOCUMENT_TYPE_DETAILS: Record<DocumentType, string> = {
  [DocumentType.ADR]: "Architecture Decision Record",
  [DocumentType.SecurityAdvisory]: "Security Advisory / CVE",
  [DocumentType.RFC]: "Request for Comments",
};

/**
 * Placeholder text shown in the quick-pick input box before the user makes
 * a selection.
 */
export const QUICK_PICK_PLACEHOLDER = "Select a document type...";
