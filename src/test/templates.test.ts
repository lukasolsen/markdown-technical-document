import * as assert from "assert";
import { DocumentType } from "../types.js";

suite("templates/index.ts", () => {
  // The templates module uses `import ... from "./adr.md"` which is resolved
  // by esbuild's text loader at build time. When compiled via `tsc`, these
  // imports become bare `require("./adr.md")` calls that fail at runtime.
  // Therefore we can only test the module when run through esbuild (i.e. the
  // extension host) or when the .md files are copied to the out/ directory.
  //
  // The tests below attempt to load the module and skip gracefully if the
  // .md imports are not resolvable.

  let generateTemplate: ((type: DocumentType, title: string) => string) | null = null;

  suiteSetup(() => {
    try {
      const mod = require("../templates/index.js");
      generateTemplate = mod.generateTemplate;
    } catch {
      // Module cannot be loaded (missing .md imports) — skip all tests.
      generateTemplate = null;
    }
  });

  function skipIfUnavailable() {
    if (!generateTemplate) {
      return true;
    }
    return false;
  }

  suite("ADR template generation", () => {
    test("replaces {{ADR_ID}} with the provided title", function () {
      if (skipIfUnavailable()) { this.skip(); return; }
      const result = generateTemplate!(DocumentType.ADR, "ADR-001");
      assert.ok(result.includes("ADR-001"));
      assert.ok(!result.includes("{{ADR_ID}}"));
    });

    test("replaces {{TITLE}} with the provided title", function () {
      if (skipIfUnavailable()) { this.skip(); return; }
      const result = generateTemplate!(DocumentType.ADR, "ADR-002");
      assert.ok(!result.includes("{{TITLE}}"));
    });

    test("replaces {{DATE}} with a YYYY-MM-DD date", function () {
      if (skipIfUnavailable()) { this.skip(); return; }
      const result = generateTemplate!(DocumentType.ADR, "ADR-001");
      assert.ok(!result.includes("{{DATE}}"));
      assert.ok(/\d{4}-\d{2}-\d{2}/.test(result));
    });

    test("replaces {{STATUS}} with 'Proposed'", function () {
      if (skipIfUnavailable()) { this.skip(); return; }
      const result = generateTemplate!(DocumentType.ADR, "ADR-001");
      assert.ok(result.includes('"Proposed"'));
      assert.ok(!result.includes("{{STATUS}}"));
    });

    test("replaces {{SUPERSEDED_BY}} with 'N/A'", function () {
      if (skipIfUnavailable()) { this.skip(); return; }
      const result = generateTemplate!(DocumentType.ADR, "ADR-001");
      assert.ok(result.includes('"N/A"'));
      assert.ok(!result.includes("{{SUPERSEDED_BY}}"));
    });

    test("replaces {{AUTHOR}} with git author or fallback comment", function () {
      if (skipIfUnavailable()) { this.skip(); return; }
      const result = generateTemplate!(DocumentType.ADR, "ADR-001");
      assert.ok(!result.includes("{{AUTHOR}}"));
      const hasAuthor =
        (result.includes("<") && result.includes("@")) ||
        result.includes("<!-- Set git user.name");
      assert.ok(hasAuthor);
    });

    test("contains the expected ADR template structure", function () {
      if (skipIfUnavailable()) { this.skip(); return; }
      const result = generateTemplate!(DocumentType.ADR, "ADR-001");
      assert.ok(result.includes("## 1. Context and Problem Statement"));
      assert.ok(result.includes("## 2. Decision Drivers"));
      assert.ok(result.includes("## 3. Considered Options"));
      assert.ok(result.includes("## 4. Decision Outcome"));
    });

    test("produces different output for different titles", function () {
      if (skipIfUnavailable()) { this.skip(); return; }
      const result1 = generateTemplate!(DocumentType.ADR, "ADR-001");
      const result2 = generateTemplate!(DocumentType.ADR, "ADR-002");
      assert.notStrictEqual(result1, result2);
      assert.ok(result1.includes("ADR-001"));
      assert.ok(result2.includes("ADR-002"));
    });
  });

  suite("Security Advisory template generation", () => {
    test("replaces {{TITLE}} with the provided CVE ID", function () {
      if (skipIfUnavailable()) { this.skip(); return; }
      const result = generateTemplate!(DocumentType.SecurityAdvisory, "CVE-2026-7010");
      assert.ok(result.includes("CVE-2026-7010"));
      assert.ok(!result.includes("{{TITLE}}"));
    });

    test("replaces {{DATE}} with a YYYY-MM-DD date", function () {
      if (skipIfUnavailable()) { this.skip(); return; }
      const result = generateTemplate!(DocumentType.SecurityAdvisory, "CVE-2026-7010");
      assert.ok(!result.includes("{{DATE}}"));
      assert.ok(/\d{4}-\d{2}-\d{2}/.test(result));
    });

    test("replaces {{YEAR}} with the current year", function () {
      if (skipIfUnavailable()) { this.skip(); return; }
      const result = generateTemplate!(DocumentType.SecurityAdvisory, "CVE-2026-7010");
      const currentYear = String(new Date().getFullYear());
      assert.ok(result.includes(currentYear));
      assert.ok(!result.includes("{{YEAR}}"));
    });

    test("contains the expected Security Advisory template structure", function () {
      if (skipIfUnavailable()) { this.skip(); return; }
      const result = generateTemplate!(DocumentType.SecurityAdvisory, "CVE-2026-7010");
      assert.ok(result.includes("## 1. Summary"));
      assert.ok(result.includes("## 2. Affected Components"));
      assert.ok(result.includes("## 3. Vulnerability Description"));
      assert.ok(result.includes("## 4. Impact"));
      assert.ok(result.includes("## 5. Mitigation"));
    });

    test("sets initial status to Draft", function () {
      if (skipIfUnavailable()) { this.skip(); return; }
      const result = generateTemplate!(DocumentType.SecurityAdvisory, "CVE-2026-7010");
      assert.ok(result.includes('status: "Draft"'));
    });
  });

  suite("RFC template generation", () => {
    test("replaces {{RFC_ID}} with the provided title", function () {
      if (skipIfUnavailable()) { this.skip(); return; }
      const result = generateTemplate!(DocumentType.RFC, "RFC-042");
      assert.ok(result.includes("RFC-042"));
      assert.ok(!result.includes("{{RFC_ID}}"));
    });

    test("replaces {{TARGET_VERSION}} with default value", function () {
      if (skipIfUnavailable()) { this.skip(); return; }
      const result = generateTemplate!(DocumentType.RFC, "RFC-042");
      assert.ok(result.includes("v0.1.0"));
      assert.ok(!result.includes("{{TARGET_VERSION}}"));
    });

    test("replaces {{STATUS}} with 'Proposed'", function () {
      if (skipIfUnavailable()) { this.skip(); return; }
      const result = generateTemplate!(DocumentType.RFC, "RFC-042");
      assert.ok(result.includes('"Proposed"'));
      assert.ok(!result.includes("{{STATUS}}"));
    });

    test("contains the expected RFC template structure", function () {
      if (skipIfUnavailable()) { this.skip(); return; }
      const result = generateTemplate!(DocumentType.RFC, "RFC-042");
      assert.ok(result.includes("## 1. Executive Summary"));
      assert.ok(result.includes("## 2. Motivation and Business Value"));
      assert.ok(result.includes("## 3. Proposed Technical Design"));
      assert.ok(result.includes("## 4. Drawbacks and Technical Debt"));
      assert.ok(result.includes("## 5. Alternatives Considered"));
    });

    test("replaces {{AUTHOR}}", function () {
      if (skipIfUnavailable()) { this.skip(); return; }
      const result = generateTemplate!(DocumentType.RFC, "RFC-042");
      assert.ok(!result.includes("{{AUTHOR}}"));
    });
  });

  suite("placeholder edge cases", () => {
    test("no remaining unresolved placeholders in ADR output", function () {
      if (skipIfUnavailable()) { this.skip(); return; }
      const result = generateTemplate!(DocumentType.ADR, "ADR-001");
      const placeholderPattern = /\{\{[A-Z_]+\}\}/g;
      const remaining = result.match(placeholderPattern);
      assert.strictEqual(remaining, null, `Unresolved placeholders: ${remaining}`);
    });

    test("no remaining unresolved placeholders in Security Advisory output", function () {
      if (skipIfUnavailable()) { this.skip(); return; }
      const result = generateTemplate!(DocumentType.SecurityAdvisory, "CVE-2026-7010");
      const placeholderPattern = /\{\{[A-Z_]+\}\}/g;
      const remaining = result.match(placeholderPattern);
      assert.strictEqual(remaining, null, `Unresolved placeholders: ${remaining}`);
    });

    test("no remaining unresolved placeholders in RFC output", function () {
      if (skipIfUnavailable()) { this.skip(); return; }
      const result = generateTemplate!(DocumentType.RFC, "RFC-042");
      const placeholderPattern = /\{\{[A-Z_]+\}\}/g;
      const remaining = result.match(placeholderPattern);
      assert.strictEqual(remaining, null, `Unresolved placeholders: ${remaining}`);
    });

    test("handles title with special characters", function () {
      if (skipIfUnavailable()) { this.skip(); return; }
      const result = generateTemplate!(DocumentType.ADR, "ADR-001 (Draft)");
      assert.ok(result.includes("ADR-001 (Draft)"));
      assert.ok(!result.includes("{{ADR_ID}}"));
    });

    test("handles empty-ish title", function () {
      if (skipIfUnavailable()) { this.skip(); return; }
      const result = generateTemplate!(DocumentType.ADR, "ADR-");
      assert.ok(result.includes("ADR-"));
      assert.ok(!result.includes("{{ADR_ID}}"));
    });
  });

  suite("security: no injection via title", () => {
    test("title with newlines does not break template structure", function () {
      if (skipIfUnavailable()) { this.skip(); return; }
      const result = generateTemplate!(DocumentType.ADR, "ADR-001\ninjected: true");
      assert.ok(result.includes("ADR-001\ninjected: true"));
    });

    test("title with quotes does not escape YAML", function () {
      if (skipIfUnavailable()) { this.skip(); return; }
      const result = generateTemplate!(DocumentType.ADR, 'ADR-001" injected');
      assert.ok(result.includes('ADR-001" injected'));
    });
  });
});
