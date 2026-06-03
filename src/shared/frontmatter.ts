import * as vscode from "vscode";

/**
 * Parsed representation of a YAML frontmatter block.
 *
 * Scalar fields are stored as strings. Fields with list values (marked by
 * leading `- ` in the source) are stored as `string[]`. The parser does not
 * handle nested objects — the schemas used by this extension's templates are
 * flat by design.
 */
export interface FrontmatterData {
  [key: string]: string | string[];
}

/**
 * Marker that delimits the start and end of a YAML frontmatter block.
 */
const DELIMITER = "---";

/**
 * Regular expression matching a single array item line.
 *
 * Captures the value inside or outside quotes, e.g.:
 *   `  - "Jane Doe"`   → `Jane Doe`
 *   `  - v0.1.0`       → `v0.1.0`
 */
const ARRAY_ITEM_RE = /^\s*-\s+"(.+)"\s*$|^\s*-\s+(\S.+)$/;

/**
 * Regular expression matching a scalar key-value line.
 *
 * Captures the key and the quoted (or bare) value, e.g.:
 *   `status: "Proposed"`     → key=`status`, value=`Proposed`
 *   `title: Hello World`     → key=`title`, value=`Hello World`
 */
const SCALAR_RE = /^(\w+):\s+"(.+)"\s*$|^(\w+):\s+(\S.+)$/;

/**
 * Parse the YAML frontmatter from a markdown document's full text.
 *
 * **How it works:**
 * 1. Checks for a leading `---` delimiter.
 * 2. Reads lines until the closing `---` delimiter.
 * 3. Classifies each line as a scalar key-value pair or an array item
 *    (indented `- value`).
 * 4. Returns the structured data plus the body text (everything after
 *    the frontmatter block).
 *
 * **Failure modes / edge cases:**
 * - If no frontmatter delimiters are found, returns `null`.
 * - Malformed lines (not matching either pattern) are silently skipped.
 * - Duplicate scalar keys overwrite earlier values (last wins).
 * - Array items are accumulated in insertion order.
 *
 * @returns An object with `data` (the parsed frontmatter fields) and `body`
 *          (the remainder of the document), or `null` if no frontmatter is
 *          present.
 */
export function parseFrontmatter(
  text: string,
): { data: FrontmatterData; body: string } | null {
  const lines = text.split("\n");
  if (lines.length < 2 || lines[0].trim() !== DELIMITER) {
    return null;
  }

  const endIndex = lines.indexOf(DELIMITER, 1);
  if (endIndex === -1) {
    return null;
  }

  const data: FrontmatterData = {};
  let currentKey: string | null = null;

  for (let i = 1; i < endIndex; i++) {
    const line = lines[i];

    // Try scalar match first.
    const scalarMatch = line.match(SCALAR_RE);
    if (scalarMatch) {
      const key = scalarMatch[1] ?? scalarMatch[3];
      const value = scalarMatch[2] ?? scalarMatch[4];
      data[key] = value;
      currentKey = null;
      continue;
    }

    // Try array item match.
    const arrayMatch = line.match(ARRAY_ITEM_RE);
    if (arrayMatch) {
      const value = arrayMatch[1] ?? arrayMatch[2];
      // The key is the last scalar key encountered (the parent field).
      // This requires that the array items come immediately after the key.
      // As a fallback, try to infer the key from the previous non-blank
      // line that looks like a scalar. We track a "pending array key"
      // approach instead.
      if (currentKey) {
        const existing = data[currentKey];
        if (Array.isArray(existing)) {
          existing.push(value);
        } else if (existing === undefined) {
          data[currentKey] = [value];
        }
      }
      continue;
    }

    // Blank line or comment — reset currentKey.
    if (line.trim() === "" || line.trim().startsWith("#")) {
      currentKey = null;
      continue;
    }

    // If the line ends with `:` it may be an array key on the next line.
    const arrayKeyMatch = line.match(/^(\w+):\s*$/);
    if (arrayKeyMatch) {
      currentKey = arrayKeyMatch[1];
      // Ensure it exists as an array.
      if (!(currentKey in data)) {
        data[currentKey] = [];
      }
    }
  }

  const body = lines.slice(endIndex + 1).join("\n");
  return { data, body };
}

/**
 * Serialize a frontmatter data object back into YAML string (without
 * surrounding `---` delimiters).
 *
 * Scalars are written as `key: "value"`. Arrays are written as indented
 * `- "value"` lines. The order of keys follows insertion order of the
 * input object (ES2015+ spec).
 *
 * @param data - The frontmatter fields to serialize.
 * @returns A YAML string without the `---` delimiters.
 */
export function serializeFrontmatter(data: FrontmatterData): string {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      lines.push(`${key}:`);
      for (const item of value) {
        lines.push(`  - "${item}"`);
      }
    } else if (value !== undefined) {
      lines.push(`${key}: "${value}"`);
    }
  }
  return lines.join("\n");
}

/**
 * Reconstruct a full document string after modifying its frontmatter.
 *
 * Parses the existing frontmatter, applies `updates` (a map of key →
 * new-value; set a key to `undefined` to remove it), then re-serialises
 * the frontmatter and prepends it to the body text.
 *
 * **No-op guarantee:** if no frontmatter exists, the original text is
 * returned unchanged.
 *
 * @param text - The full document text.
 * @param updates - A map of field updates. Array values replace the entire
 *                  array; string values replace the scalar. Pass `undefined`
 *                  to remove a field entirely.
 * @returns The updated document text.
 */
export function updateFrontmatter(
  text: string,
  updates: Record<string, string | string[] | undefined>,
): string {
  const parsed = parseFrontmatter(text);
  if (!parsed) {
    return text;
  }

  const { data, body } = parsed;

  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) {
      delete data[key];
    } else {
      data[key] = value;
    }
  }

  const frontmatter = serializeFrontmatter(data);
  return `${DELIMITER}\n${frontmatter}\n${DELIMITER}\n${body}`;
}

/**
 * Shortcut: retrieve the currently active text editor's full text.
 *
 * @returns The document text, or `null` if no editor is visible.
 */
export function getActiveDocumentText(): string | null {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return null;
  }
  return editor.document.getText();
}

/**
 * Replace the entire content of the active editor with `newText`, preserving
 * the undo stack via a single workspace edit.
 *
 * @param newText - The full new document content.
 */
export async function replaceActiveDocumentText(newText: string): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  const doc = editor.document;
  const fullRange = new vscode.Range(
    doc.positionAt(0),
    doc.positionAt(doc.getText().length),
  );

  await editor.edit((builder) => {
    builder.replace(fullRange, newText);
  });
}
