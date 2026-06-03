import * as assert from "assert";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { DocumentType } from "../types.js";
import {
  parseAdrNumber,
  parseRfcNumber,
  parseCveNumber,
  formatAdrNumber,
  getNextAdrNumber,
  getNextRfcNumber,
  getNextCveSeq,
  computeDocumentName,
} from "../naming.js";

/**
 * Subdirectory names matching the default configuration.
 */
const SUBDIR_ADR = "adr";
const SUBDIR_RFC = "rfc";
const SUBDIR_SECURITY_ADVISORY = "securityAdvisory";

/**
 * Create a temporary workspace root with type-specific subdirectories under
 * `.docs/` populated with the given file names. Files are placed into the
 * correct subdirectory based on their prefix:
 * - `ADR-*.md` → `.docs/adr/`
 * - `RFC-*.md` → `.docs/rfc/`
 * - `CVE-*.md` → `.docs/securityAdvisory/`
 * - Everything else → `.docs/` (root)
 *
 * Returns the full path to the workspace root.
 */
function setupDocsDir(files: string[]): string {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "naming-test-"));
  const docsRoot = path.join(tmpDir, ".docs");
  const adrDir = path.join(docsRoot, SUBDIR_ADR);
  const rfcDir = path.join(docsRoot, SUBDIR_RFC);
  const cveDir = path.join(docsRoot, SUBDIR_SECURITY_ADVISORY);

  fs.mkdirSync(adrDir, { recursive: true });
  fs.mkdirSync(rfcDir, { recursive: true });
  fs.mkdirSync(cveDir, { recursive: true });

  for (const f of files) {
    let targetDir: string;
    if (f.startsWith("ADR-")) {
      targetDir = adrDir;
    } else if (f.startsWith("RFC-")) {
      targetDir = rfcDir;
    } else if (f.startsWith("CVE-")) {
      targetDir = cveDir;
    } else {
      targetDir = docsRoot;
    }
    fs.writeFileSync(path.join(targetDir, f), "", "utf-8");
  }
  return tmpDir;
}

/**
 * Remove a temporary workspace root and its contents.
 */
function teardown(tmpDir: string): void {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

suite("naming.ts", () => {
  suite("parseAdrNumber", () => {
    test("parses a well-formed ADR file name with .md extension", () => {
      assert.strictEqual(parseAdrNumber("ADR-001.md"), 1);
    });

    test("parses a well-formed ADR file name without extension", () => {
      assert.strictEqual(parseAdrNumber("ADR-042"), 42);
    });

    test("parses a three-digit ADR with leading zeros", () => {
      assert.strictEqual(parseAdrNumber("ADR-999.md"), 999);
    });

    test("returns null for a non-ADR file name", () => {
      assert.strictEqual(parseAdrNumber("README.md"), null);
    });

    test("returns null for a CVE file name", () => {
      assert.strictEqual(parseAdrNumber("CVE-2026-7009.md"), null);
    });

    test("returns null for an empty string", () => {
      assert.strictEqual(parseAdrNumber(""), null);
    });

    test("returns null for a file name missing the numeric part", () => {
      assert.strictEqual(parseAdrNumber("ADR-.md"), null);
    });

    test("returns null for a file name with non-numeric suffix", () => {
      assert.strictEqual(parseAdrNumber("ADR-abc.md"), null);
    });
  });

  suite("parseRfcNumber", () => {
    test("parses a well-formed RFC file name", () => {
      assert.strictEqual(parseRfcNumber("RFC-001.md"), 1);
    });

    test("parses an RFC without extension", () => {
      assert.strictEqual(parseRfcNumber("RFC-100"), 100);
    });

    test("returns null for a non-RFC file", () => {
      assert.strictEqual(parseRfcNumber("ADR-001.md"), null);
    });

    test("returns null for empty string", () => {
      assert.strictEqual(parseRfcNumber(""), null);
    });
  });

  suite("parseCveNumber", () => {
    test("parses a well-formed CVE file name with .md extension", () => {
      const result = parseCveNumber("CVE-2026-7009.md");
      assert.deepStrictEqual(result, { year: 2026, seq: 7009 });
    });

    test("parses a CVE file name without extension", () => {
      const result = parseCveNumber("CVE-2026-7010");
      assert.deepStrictEqual(result, { year: 2026, seq: 7010 });
    });

    test("parses CVE with larger sequence numbers", () => {
      const result = parseCveNumber("CVE-2025-123456.md");
      assert.deepStrictEqual(result, { year: 2025, seq: 123456 });
    });

    test("parses CVE with single-digit sequence", () => {
      const result = parseCveNumber("CVE-2024-1.md");
      assert.deepStrictEqual(result, { year: 2024, seq: 1 });
    });

    test("returns null for a file that is not CVE format", () => {
      assert.strictEqual(parseCveNumber("ADR-001.md"), null);
    });

    test("returns null when CVE prefix is lowercase", () => {
      assert.strictEqual(parseCveNumber("cve-2026-7009.md"), null);
    });

    test("returns null for empty string", () => {
      assert.strictEqual(parseCveNumber(""), null);
    });

    test("returns null when year is missing", () => {
      assert.strictEqual(parseCveNumber("CVE-abc-7009.md"), null);
    });

    test("returns null when sequence is missing", () => {
      assert.strictEqual(parseCveNumber("CVE-2026-.md"), null);
    });
  });

  suite("formatAdrNumber", () => {
    test("formats 1 as 001", () => {
      assert.strictEqual(formatAdrNumber(1), "001");
    });

    test("formats 42 as 042", () => {
      assert.strictEqual(formatAdrNumber(42), "042");
    });

    test("formats 999 as 999", () => {
      assert.strictEqual(formatAdrNumber(999), "999");
    });

    test("formats 1000 as 1000 (no truncation)", () => {
      assert.strictEqual(formatAdrNumber(1000), "1000");
    });
  });

  suite("getNextAdrNumber", () => {
    test("returns 1 when .docs/adr does not exist", () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "naming-test-"));
      try {
        const result = getNextAdrNumber(tmpDir);
        assert.strictEqual(result, 1);
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    test("returns 1 when .docs/adr is empty", () => {
      const tmpDir = setupDocsDir([]);
      try {
        assert.strictEqual(getNextAdrNumber(tmpDir), 1);
      } finally {
        teardown(tmpDir);
      }
    });

    test("returns next number after existing ADRs", () => {
      const tmpDir = setupDocsDir(["ADR-001.md", "ADR-002.md", "ADR-003.md"]);
      try {
        assert.strictEqual(getNextAdrNumber(tmpDir), 4);
      } finally {
        teardown(tmpDir);
      }
    });

    test("ignores non-ADR files in other subdirectories", () => {
      const tmpDir = setupDocsDir([
        "ADR-005.md",
        "CVE-2026-7009.md",
        "RFC-001.md",
      ]);
      try {
        assert.strictEqual(getNextAdrNumber(tmpDir), 6);
      } finally {
        teardown(tmpDir);
      }
    });

    test("handles gaps in numbering (returns max + 1)", () => {
      const tmpDir = setupDocsDir(["ADR-001.md", "ADR-010.md", "ADR-100.md"]);
      try {
        assert.strictEqual(getNextAdrNumber(tmpDir), 101);
      } finally {
        teardown(tmpDir);
      }
    });

    test("returns 1 when only non-ADR files exist", () => {
      const tmpDir = setupDocsDir(["CVE-2026-7009.md", "RFC-001.md"]);
      try {
        assert.strictEqual(getNextAdrNumber(tmpDir), 1);
      } finally {
        teardown(tmpDir);
      }
    });
  });

  suite("getNextRfcNumber", () => {
    test("returns 1 when .docs/rfc does not exist", () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "naming-test-"));
      try {
        assert.strictEqual(getNextRfcNumber(tmpDir), 1);
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    test("returns next number after existing RFCs", () => {
      const tmpDir = setupDocsDir(["RFC-001.md", "RFC-002.md"]);
      try {
        assert.strictEqual(getNextRfcNumber(tmpDir), 3);
      } finally {
        teardown(tmpDir);
      }
    });
  });

  suite("getNextCveSeq", () => {
    test("returns baseSeq when .docs/securityAdvisory does not exist", () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "naming-test-"));
      try {
        assert.strictEqual(getNextCveSeq(2026, tmpDir), 1001);
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    test("returns baseSeq when .docs/securityAdvisory is empty", () => {
      const tmpDir = setupDocsDir([]);
      try {
        assert.strictEqual(getNextCveSeq(2026, tmpDir), 1001);
      } finally {
        teardown(tmpDir);
      }
    });

    test("returns baseSeq when no CVE files for the given year exist", () => {
      const tmpDir = setupDocsDir(["CVE-2025-7001.md", "CVE-2025-7002.md"]);
      try {
        assert.strictEqual(getNextCveSeq(2026, tmpDir), 1001);
      } finally {
        teardown(tmpDir);
      }
    });

    test("returns next seq after existing CVEs for the same year", () => {
      const tmpDir = setupDocsDir([
        "CVE-2026-7009.md",
        "CVE-2026-7010.md",
        "CVE-2026-7011.md",
      ]);
      try {
        assert.strictEqual(getNextCveSeq(2026, tmpDir), 7012);
      } finally {
        teardown(tmpDir);
      }
    });

    test("ignores CVEs from other years", () => {
      const tmpDir = setupDocsDir([
        "CVE-2025-9999.md",
        "CVE-2026-7009.md",
        "CVE-2027-0001.md",
      ]);
      try {
        assert.strictEqual(getNextCveSeq(2026, tmpDir), 7010);
      } finally {
        teardown(tmpDir);
      }
    });

    test("ignores non-CVE files in other subdirectories", () => {
      const tmpDir = setupDocsDir([
        "CVE-2026-7009.md",
        "ADR-001.md",
        "RFC-001.md",
      ]);
      try {
        assert.strictEqual(getNextCveSeq(2026, tmpDir), 7010);
      } finally {
        teardown(tmpDir);
      }
    });

    test("handles large gaps in sequence numbers", () => {
      const tmpDir = setupDocsDir(["CVE-2026-0001.md", "CVE-2026-9999.md"]);
      try {
        assert.strictEqual(getNextCveSeq(2026, tmpDir), 10000);
      } finally {
        teardown(tmpDir);
      }
    });

    test("accepts custom baseSeq via parameter", () => {
      const tmpDir = setupDocsDir([]);
      try {
        assert.strictEqual(getNextCveSeq(2026, tmpDir, 5000), 5000);
      } finally {
        teardown(tmpDir);
      }
    });

    test("custom baseSeq does not affect existing CVE scan", () => {
      const tmpDir = setupDocsDir(["CVE-2026-7009.md"]);
      try {
        assert.strictEqual(getNextCveSeq(2026, tmpDir, 1), 7010);
      } finally {
        teardown(tmpDir);
      }
    });
  });

  suite("computeDocumentName (integration)", () => {
    test("ADR produces ADR-001 from empty .docs/adr", () => {
      const tmpDir = setupDocsDir([]);
      try {
        const result = computeDocumentName(DocumentType.ADR, tmpDir);
        assert.strictEqual(result.type, DocumentType.ADR);
        assert.strictEqual(result.fileName, "ADR-001");
        assert.strictEqual(result.label, "ADR-001");
      } finally {
        teardown(tmpDir);
      }
    });

    test("ADR increments from existing files in .docs/adr", () => {
      const tmpDir = setupDocsDir(["ADR-001.md", "ADR-002.md"]);
      try {
        const result = computeDocumentName(DocumentType.ADR, tmpDir);
        assert.strictEqual(result.fileName, "ADR-003");
      } finally {
        teardown(tmpDir);
      }
    });

    test("RFC produces RFC-001 from empty .docs/rfc", () => {
      const tmpDir = setupDocsDir([]);
      try {
        const result = computeDocumentName(DocumentType.RFC, tmpDir);
        assert.strictEqual(result.fileName, "RFC-001");
      } finally {
        teardown(tmpDir);
      }
    });

    test("RFC increments from existing files in .docs/rfc", () => {
      const tmpDir = setupDocsDir(["RFC-001.md", "RFC-005.md"]);
      try {
        const result = computeDocumentName(DocumentType.RFC, tmpDir);
        assert.strictEqual(result.fileName, "RFC-006");
      } finally {
        teardown(tmpDir);
      }
    });

    test("Security Advisory produces CVE-<currentYear>-1001 from empty .docs/securityAdvisory", () => {
      const tmpDir = setupDocsDir([]);
      try {
        const year = new Date().getFullYear();
        const result = computeDocumentName(DocumentType.SecurityAdvisory, tmpDir);
        assert.strictEqual(result.type, DocumentType.SecurityAdvisory);
        assert.strictEqual(result.fileName, `CVE-${year}-1001`);
      } finally {
        teardown(tmpDir);
      }
    });

    test("Security Advisory increments sequence for the same year", () => {
      const year = new Date().getFullYear();
      const tmpDir = setupDocsDir([`CVE-${year}-7009.md`, `CVE-${year}-7010.md`]);
      try {
        const result = computeDocumentName(DocumentType.SecurityAdvisory, tmpDir);
        assert.strictEqual(result.fileName, `CVE-${year}-7011`);
      } finally {
        teardown(tmpDir);
      }
    });

    test("ADR numbering is independent of files in other type subdirectories", () => {
      const tmpDir = setupDocsDir(["RFC-001.md", "RFC-002.md", "CVE-2026-7009.md"]);
      try {
        const result = computeDocumentName(DocumentType.ADR, tmpDir);
        assert.strictEqual(result.fileName, "ADR-001");
      } finally {
        teardown(tmpDir);
      }
    });

    test("RFC numbering is independent of files in other type subdirectories", () => {
      const tmpDir = setupDocsDir(["ADR-001.md", "ADR-002.md", "CVE-2026-7009.md"]);
      try {
        const result = computeDocumentName(DocumentType.RFC, tmpDir);
        assert.strictEqual(result.fileName, "RFC-001");
      } finally {
        teardown(tmpDir);
      }
    });

    test("CVE numbering is independent of files in other type subdirectories", () => {
      const year = new Date().getFullYear();
      const tmpDir = setupDocsDir(["ADR-001.md", "RFC-001.md"]);
      try {
        const result = computeDocumentName(DocumentType.SecurityAdvisory, tmpDir);
        assert.strictEqual(result.fileName, `CVE-${year}-1001`);
      } finally {
        teardown(tmpDir);
      }
    });
  });
});
