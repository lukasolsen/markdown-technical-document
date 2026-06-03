import * as vscode from "vscode";
import { getDocsDirConfig, getDocsRootUri, getDocsTypeUri } from "./settings.js";
import { DocumentType } from "./types.js";

/**
 * URI of the root docs directory within the workspace.
 *
 * **Note:** This property is set by `ensureDocsDir` and is `null` until that
 * function succeeds. All consumers should check for `null` before using it.
 */
let _docsUri: vscode.Uri | null = null;

/**
 * Get the cached root docs directory URI.
 *
 * @returns The URI for the root docs directory, or `null` if `ensureDocsDir`
 *          has not been called yet or has not completed successfully.
 */
export function getDocsDirUri(): vscode.Uri | null {
  return _docsUri;
}

/**
 * A lightweight descriptor for a document found in the docs directory tree.
 */
export interface DocsDirEntry {
  /** The file name (e.g. `"ADR-003.md"`). */
  fileName: string;
  /** The name stem without extension (e.g. `"ADR-003"`). */
  stem: string;
}

/**
 * Ensure the root docs directory and all type-specific subdirectories exist
 * at the workspace root.
 *
 * **How it works:**
 * 1. Reads the configured root directory name from settings.
 * 2. Creates the root directory via `vscode.workspace.fs.createDirectory`.
 * 3. Creates one subdirectory per document type (adr, rfc, securityAdvisory).
 * 4. Caches the resulting root URI in the module-level `_docsUri` variable.
 *
 * **Failure modes / edge cases:**
 * - If no workspace folder is open, the function returns `null` silently.
 * - If `vscode.workspace.fs.createDirectory` fails (e.g. permissions), the
 *   error is propagated as-is to the caller.
 * - Calling this function multiple times is safe; it is idempotent.
 *
 * @returns The URI of the root docs directory, or `null` if no workspace
 *          folder is available.
 */
export async function ensureDocsDir(): Promise<vscode.Uri | null> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    return null;
  }

  const rootUri = getDocsRootUri(workspaceFolder.uri);
  await vscode.workspace.fs.createDirectory(rootUri);

  // Create type-specific subdirectories.
  const cfg = getDocsDirConfig();
  const subdirs = [cfg.adr, cfg.rfc, cfg.securityAdvisory];
  for (const subdir of subdirs) {
    const subdirUri = vscode.Uri.joinPath(rootUri, subdir);
    await vscode.workspace.fs.createDirectory(subdirUri);
  }

  _docsUri = rootUri;
  return _docsUri;
}

/**
 * Ensure the type-specific subdirectory exists for the given document type.
 *
 * Creates both the root docs directory and the type-specific child directory
 * if they do not already exist.
 *
 * @param type - The document type whose subdirectory should exist.
 * @returns The URI of the type-specific directory, or `null` if no workspace
 *          folder is available.
 */
export async function ensureDocsTypeDir(type: DocumentType): Promise<vscode.Uri | null> {
  const rootUri = await ensureDocsDir();
  if (!rootUri) {
    return null;
  }

  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    return null;
  }

  const typeUri = getDocsTypeUri(type, workspaceFolder.uri);
  await vscode.workspace.fs.createDirectory(typeUri);
  return typeUri;
}

/**
 * Recursively collect all `.md` files under a given directory URI.
 *
 * @param dirUri - The directory to scan.
 * @returns An array of `DocsDirEntry` objects.
 */
async function listDirRecursive(dirUri: vscode.Uri): Promise<DocsDirEntry[]> {
  const result: DocsDirEntry[] = [];

  let entries: [string, vscode.FileType][];
  try {
    entries = await vscode.workspace.fs.readDirectory(dirUri);
  } catch {
    return [];
  }

  for (const [name, fileType] of entries) {
    if (fileType === vscode.FileType.File && name.endsWith(".md")) {
      result.push({ fileName: name, stem: name.replace(/\.md$/, "") });
    } else if (fileType === vscode.FileType.Directory) {
      const childUri = vscode.Uri.joinPath(dirUri, name);
      const children = await listDirRecursive(childUri);
      result.push(...children);
    }
  }

  return result;
}

/**
 * List all `.md` files currently present in the docs directory tree.
 *
 * Scans the root docs directory and all type-specific subdirectories
 * recursively. This is used by commands like "Supersede Document" that need
 * to find candidates across all document types.
 *
 * **Failure modes / edge cases:**
 * - If the workspace folder is not set, returns an empty array.
 * - If the docs directory does not exist, returns an empty array.
 * - Non-`.md` files and non-document subdirectories are silently ignored.
 *
 * @returns A sorted array of `DocsDirEntry` objects ordered alphabetically by
 *          file name.
 */
export async function listDocsDir(): Promise<DocsDirEntry[]> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    return [];
  }

  const rootUri = getDocsRootUri(workspaceFolder.uri);
  const result = await listDirRecursive(rootUri);
  result.sort((a, b) => a.fileName.localeCompare(b.fileName));
  return result;
}
