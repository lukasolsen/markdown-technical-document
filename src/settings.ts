import * as vscode from "vscode";
import { DocumentType } from "./types.js";
import {
  DOCS_DIR_ROOT,
  DOCS_DIR_ADR,
  DOCS_DIR_RFC,
  DOCS_DIR_SECURITY_ADVISORY,
} from "./constants.js";

/**
 * Raw shape of the `markdownTechnicalDocument.docsDir` configuration object
 * as declared in `package.json`.
 */
interface DocsDirConfig {
  root: string;
  adr: string;
  rfc: string;
  securityAdvisory: string;
}

const SECTION = "markdownTechnicalDocument";

/**
 * Read the docs directory configuration from workspace settings.
 *
 * Falls back to the built-in defaults when the setting is absent or partially
 * configured. Each property is validated to be a non-empty string; invalid
 * values are replaced with the corresponding default.
 */
export function getDocsDirConfig(): DocsDirConfig {
  const cfg = vscode.workspace.getConfiguration(SECTION);
  const raw = cfg.get<DocsDirConfig>("docsDir");

  return {
    root: raw?.root || DOCS_DIR_ROOT,
    adr: raw?.adr || DOCS_DIR_ADR,
    rfc: raw?.rfc || DOCS_DIR_RFC,
    securityAdvisory: raw?.securityAdvisory || DOCS_DIR_SECURITY_ADVISORY,
  };
}

/**
 * Get the subdirectory name for a specific document type from the
 * configuration.
 *
 * @param type - The document type to resolve.
 * @returns The subdirectory name (e.g. `"adr"`, `"rfc"`, `"securityAdvisory"`).
 */
export function getDocsTypeSubdir(type: DocumentType): string {
  const cfg = getDocsDirConfig();
  switch (type) {
    case DocumentType.ADR:
      return cfg.adr;
    case DocumentType.RFC:
      return cfg.rfc;
    case DocumentType.SecurityAdvisory:
      return cfg.securityAdvisory;
  }
}

/**
 * Get the absolute filesystem path for a type-specific documents directory.
 *
 * Combines the workspace root, the configured root docs directory, and the
 * type-specific subdirectory.
 *
 * @param type - The document type.
 * @param workspaceRoot - Absolute path to the workspace root.
 * @returns The full path, e.g. `"/workspace/.docs/adr"`.
 */
export function getDocsTypePath(type: DocumentType, workspaceRoot: string): string {
  const cfg = getDocsDirConfig();
  const parts = [workspaceRoot, cfg.root];
  switch (type) {
    case DocumentType.ADR:
      parts.push(cfg.adr);
      break;
    case DocumentType.RFC:
      parts.push(cfg.rfc);
      break;
    case DocumentType.SecurityAdvisory:
      parts.push(cfg.securityAdvisory);
      break;
  }
  return parts.join("/");
}

/**
 * Get the URI for the root docs directory relative to the given workspace
 * folder.
 *
 * @param workspaceFolder - The workspace folder URI.
 * @returns A `vscode.Uri` pointing to the configured root docs directory.
 */
export function getDocsRootUri(workspaceFolder: vscode.Uri): vscode.Uri {
  const cfg = getDocsDirConfig();
  return vscode.Uri.joinPath(workspaceFolder, cfg.root);
}

/**
 * Get the URI for a type-specific documents directory relative to the given
 * workspace folder.
 *
 * @param type - The document type.
 * @param workspaceFolder - The workspace folder URI.
 * @returns A `vscode.Uri` pointing to the type-specific subdirectory.
 */
export function getDocsTypeUri(
  type: DocumentType,
  workspaceFolder: vscode.Uri,
): vscode.Uri {
  const cfg = getDocsDirConfig();
  const subdir = getDocsTypeSubdir(type);
  return vscode.Uri.joinPath(workspaceFolder, cfg.root, subdir);
}
