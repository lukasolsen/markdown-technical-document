import * as assert from "assert";
import * as vscode from "vscode";
import { listDocsDir, ensureDocsDir, ensureDocsTypeDir, getDocsDirUri } from "../docsManager.js";
import { DocumentType } from "../types.js";

suite("docsManager.ts", () => {
  const hasWorkspace = !!vscode.workspace.workspaceFolders?.length;

  suite("getDocsDirUri", () => {
    test("returns null or a Uri", () => {
      const uri = getDocsDirUri();
      assert.ok(uri === null || uri instanceof vscode.Uri);
    });
  });

  suite("ensureDocsDir", () => {
    test("returns null when no workspace folder is open", async function () {
      if (hasWorkspace) {
        this.skip();
        return;
      }
      const uri = await ensureDocsDir();
      assert.strictEqual(uri, null);
    });

    test("returns a Uri when workspace is open", async function () {
      if (!hasWorkspace) {
        this.skip();
        return;
      }
      const uri = await ensureDocsDir();
      assert.ok(uri !== null);
      assert.ok(uri instanceof vscode.Uri);
    });

    test("caches the uri for subsequent calls when workspace is open", async function () {
      if (!hasWorkspace) {
        this.skip();
        return;
      }
      const uri1 = await ensureDocsDir();
      const uri2 = await ensureDocsDir();
      assert.ok(uri1);
      assert.ok(uri2);
      assert.strictEqual(uri1!.fsPath, uri2!.fsPath);
    });

    test("getDocsDirUri returns the cached uri after ensureDocsDir", async function () {
      if (!hasWorkspace) {
        this.skip();
        return;
      }
      await ensureDocsDir();
      const cached = getDocsDirUri();
      assert.ok(cached);
    });
  });

  suite("ensureDocsTypeDir", () => {
    test("returns null when no workspace folder is open", async function () {
      if (hasWorkspace) {
        this.skip();
        return;
      }
      const uri = await ensureDocsTypeDir(DocumentType.ADR);
      assert.strictEqual(uri, null);
    });

    test("returns a Uri for ADR type", async function () {
      if (!hasWorkspace) {
        this.skip();
        return;
      }
      const uri = await ensureDocsTypeDir(DocumentType.ADR);
      assert.ok(uri !== null);
      assert.ok(uri instanceof vscode.Uri);
    });

    test("returns a Uri for RFC type", async function () {
      if (!hasWorkspace) {
        this.skip();
        return;
      }
      const uri = await ensureDocsTypeDir(DocumentType.RFC);
      assert.ok(uri !== null);
    });

    test("returns a Uri for SecurityAdvisory type", async function () {
      if (!hasWorkspace) {
        this.skip();
        return;
      }
      const uri = await ensureDocsTypeDir(DocumentType.SecurityAdvisory);
      assert.ok(uri !== null);
    });
  });

  suite("listDocsDir", () => {
    test("returns an array", async () => {
      const entries = await listDocsDir();
      assert.ok(Array.isArray(entries));
    });

    test("returns objects with fileName and stem properties", async () => {
      const entries = await listDocsDir();
      for (const entry of entries) {
        assert.ok(typeof entry.fileName === "string");
        assert.ok(typeof entry.stem === "string");
      }
    });

    test("stem is fileName without .md extension", async () => {
      const entries = await listDocsDir();
      for (const entry of entries) {
        if (entry.fileName.endsWith(".md")) {
          assert.strictEqual(
            entry.stem,
            entry.fileName.replace(/\.md$/, ""),
          );
        }
      }
    });

    test("results are sorted by fileName alphabetically", async () => {
      const entries = await listDocsDir();
      for (let i = 1; i < entries.length; i++) {
        assert.ok(
          entries[i - 1].fileName <= entries[i].fileName,
          `Expected "${entries[i - 1].fileName}" <= "${entries[i].fileName}"`,
        );
      }
    });

    test("only includes .md files", async () => {
      const entries = await listDocsDir();
      for (const entry of entries) {
        assert.ok(
          entry.fileName.endsWith(".md"),
          `Non-.md file included: ${entry.fileName}`,
        );
      }
    });

    test("returns empty array when no workspace folder is open", async function () {
      if (hasWorkspace) {
        this.skip();
        return;
      }
      const entries = await listDocsDir();
      assert.deepStrictEqual(entries, []);
    });
  });

  suite("error handling", () => {
    test("listDocsDir does not throw", async () => {
      try {
        await listDocsDir();
      } catch (err) {
        assert.fail(`listDocsDir threw: ${err}`);
      }
    });

    test("ensureDocsDir does not throw", async () => {
      try {
        await ensureDocsDir();
      } catch (err) {
        assert.fail(`ensureDocsDir threw: ${err}`);
      }
    });

    test("ensureDocsTypeDir does not throw", async () => {
      try {
        await ensureDocsTypeDir(DocumentType.ADR);
      } catch (err) {
        assert.fail(`ensureDocsTypeDir threw: ${err}`);
      }
    });
  });
});
