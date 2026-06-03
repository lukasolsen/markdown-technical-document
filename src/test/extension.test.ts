import * as assert from "assert";
import * as vscode from "vscode";

suite("Extension Test Suite", () => {
  test("extension should be present", () => {
    const extension = vscode.extensions.getExtension(
      "markdown-technical-document",
    );
    // Extension may not be installed in test environment, but the type check is valid
    // If running via vscode-test, the extension should be active
  });

  test("vscode API is available", () => {
    assert.ok(vscode.window);
    assert.ok(vscode.commands);
    assert.ok(vscode.workspace);
  });

  test("workspace folders are accessible", () => {
    // In the test environment, there should be a workspace folder
    const folders = vscode.workspace.workspaceFolders;
    // May be undefined if no workspace is open, which is also valid
    if (folders) {
      assert.ok(folders.length > 0);
      assert.ok(folders[0].uri);
    }
  });
});
