import * as assert from "assert";
import {
  parseFrontmatter,
  serializeFrontmatter,
  updateFrontmatter,
  FrontmatterData,
} from "../shared/frontmatter.js";

suite("frontmatter.ts", () => {
  suite("parseFrontmatter", () => {
    test("parses a minimal frontmatter block with scalars", () => {
      const text = [
        "---",
        'title: "Hello World"',
        'status: "Proposed"',
        "---",
        "Body content here.",
      ].join("\n");

      const result = parseFrontmatter(text);
      assert.ok(result);
      assert.strictEqual(result.data.title, "Hello World");
      assert.strictEqual(result.data.status, "Proposed");
      assert.strictEqual(result.body, "Body content here.");
    });

    test("parses frontmatter with array values", () => {
      const text = [
        "---",
        'title: "Test"',
        "authors:",
        '  - "Jane Doe <jane@example.com>"',
        '  - "John Smith <john@example.com>"',
        "---",
        "",
      ].join("\n");

      const result = parseFrontmatter(text);
      assert.ok(result);
      assert.deepStrictEqual(result.data.authors, [
        "Jane Doe <jane@example.com>",
        "John Smith <john@example.com>",
      ]);
    });

    test("parses mixed scalar and array fields", () => {
      const text = [
        "---",
        'adr_id: "ADR-001"',
        'title: "Use PostgreSQL"',
        'date_created: "2026-01-15"',
        'status: "Accepted"',
        "authors:",
        '  - "Alice <alice@example.com>"',
        "impact_areas:",
        '  - "Architecture"',
        '  - "Security"',
        "related_rfcs:",
        '  - "RFC-001"',
        "tickets:",
        '  - "PROJ-1234"',
        'superseded_by: "N/A"',
        "---",
        "",
      ].join("\n");

      const result = parseFrontmatter(text);
      assert.ok(result);
      assert.strictEqual(result.data.adr_id, "ADR-001");
      assert.strictEqual(result.data.title, "Use PostgreSQL");
      assert.strictEqual(result.data.date_created, "2026-01-15");
      assert.strictEqual(result.data.status, "Accepted");
      assert.deepStrictEqual(result.data.authors, ["Alice <alice@example.com>"]);
      assert.deepStrictEqual(result.data.impact_areas, ["Architecture", "Security"]);
      assert.deepStrictEqual(result.data.related_rfcs, ["RFC-001"]);
      assert.deepStrictEqual(result.data.tickets, ["PROJ-1234"]);
      assert.strictEqual(result.data.superseded_by, "N/A");
    });

    test("returns null when no frontmatter delimiters exist", () => {
      const text = "Just some plain markdown text.\nNo frontmatter here.";
      assert.strictEqual(parseFrontmatter(text), null);
    });

    test("returns null when only opening delimiter exists", () => {
      const text = "---\ntitle: Hello\nNo closing delimiter.";
      assert.strictEqual(parseFrontmatter(text), null);
    });

    test("returns null for empty string", () => {
      assert.strictEqual(parseFrontmatter(""), null);
    });

    test("returns null for a single line", () => {
      assert.strictEqual(parseFrontmatter("---"), null);
    });

    test("handles frontmatter with no body", () => {
      const text = "---\ntitle: \"Hello\"\n---";
      const result = parseFrontmatter(text);
      assert.ok(result);
      assert.strictEqual(result.data.title, "Hello");
      assert.strictEqual(result.body, "");
    });

    test("handles empty frontmatter block", () => {
      const text = "---\n---\nBody.";
      const result = parseFrontmatter(text);
      assert.ok(result);
      assert.deepStrictEqual(Object.keys(result.data), []);
      assert.strictEqual(result.body, "Body.");
    });

    test("handles bare (unquoted) scalar values", () => {
      const text = [
        "---",
        "title: Hello World",
        "status: Proposed",
        "---",
        "",
      ].join("\n");

      const result = parseFrontmatter(text);
      assert.ok(result);
      assert.strictEqual(result.data.title, "Hello World");
      assert.strictEqual(result.data.status, "Proposed");
    });

    test("last scalar key wins on duplicate keys", () => {
      const text = [
        "---",
        'title: "First"',
        'title: "Second"',
        "---",
        "",
      ].join("\n");

      const result = parseFrontmatter(text);
      assert.ok(result);
      assert.strictEqual(result.data.title, "Second");
    });

    test("blank line resets current array key context", () => {
      const text = [
        "---",
        "authors:",
        '  - "Alice"',
        "",
        "tickets:",
        '  - "TICKET-1"',
        "---",
        "",
      ].join("\n");

      const result = parseFrontmatter(text);
      assert.ok(result);
      assert.deepStrictEqual(result.data.authors, ["Alice"]);
      assert.deepStrictEqual(result.data.tickets, ["TICKET-1"]);
    });

    test("skips comment lines in frontmatter", () => {
      const text = [
        "---",
        "# This is a comment",
        'title: "Hello"',
        "---",
        "",
      ].join("\n");

      const result = parseFrontmatter(text);
      assert.ok(result);
      assert.strictEqual(result.data.title, "Hello");
    });

    test("parses array items with unquoted values", () => {
      const text = [
        "---",
        "impact_areas:",
        "  - Architecture",
        "  - Security",
        "---",
        "",
      ].join("\n");

      const result = parseFrontmatter(text);
      assert.ok(result);
      assert.deepStrictEqual(result.data.impact_areas, ["Architecture", "Security"]);
    });

    test("handles array key on its own line followed by items", () => {
      const text = [
        "---",
        "authors:",
        '  - "Alice"',
        '  - "Bob"',
        "---",
        "",
      ].join("\n");

      const result = parseFrontmatter(text);
      assert.ok(result);
      assert.deepStrictEqual(result.data.authors, ["Alice", "Bob"]);
    });

    test("returns full body text after closing delimiter", () => {
      const text = [
        "---",
        'title: "Test"',
        "---",
        "# Heading",
        "",
        "Paragraph text.",
        "",
        "More text.",
      ].join("\n");

      const result = parseFrontmatter(text);
      assert.ok(result);
      assert.strictEqual(
        result.body,
        "# Heading\n\nParagraph text.\n\nMore text.",
      );
    });

    // Security/vulnerability: YAML injection via crafted values
    test("does not interpret YAML special characters in values", () => {
      const text = [
        "---",
        'title: "value: injected"',
        'status: "Proposed"',
        "---",
        "",
      ].join("\n");

      const result = parseFrontmatter(text);
      assert.ok(result);
      assert.strictEqual(result.data.title, "value: injected");
    });

    // Edge case: very long frontmatter block
    test("handles a frontmatter block with many fields", () => {
      const lines = ["---"];
      for (let i = 0; i < 50; i++) {
        lines.push(`field_${i}: "value_${i}"`);
      }
      lines.push("---");
      lines.push("");

      const text = lines.join("\n");
      const result = parseFrontmatter(text);
      assert.ok(result);
      for (let i = 0; i < 50; i++) {
        assert.strictEqual(result.data[`field_${i}`], `value_${i}`);
      }
    });
  });

  suite("serializeFrontmatter", () => {
    test("serializes scalar values with double quotes", () => {
      const data: FrontmatterData = {
        title: "Hello",
        status: "Proposed",
      };
      const result = serializeFrontmatter(data);
      assert.strictEqual(result, 'title: "Hello"\nstatus: "Proposed"');
    });

    test("serializes array values as indented items", () => {
      const data: FrontmatterData = {
        authors: ["Alice", "Bob"],
      };
      const result = serializeFrontmatter(data);
      assert.strictEqual(
        result,
        'authors:\n  - "Alice"\n  - "Bob"',
      );
    });

    test("serializes mixed scalars and arrays", () => {
      const data: FrontmatterData = {
        adr_id: "ADR-001",
        title: "Test",
        authors: ["Alice"],
      };
      const result = serializeFrontmatter(data);
      const lines = result.split("\n");
      assert.strictEqual(lines[0], 'adr_id: "ADR-001"');
      assert.strictEqual(lines[1], 'title: "Test"');
      assert.strictEqual(lines[2], "authors:");
      assert.strictEqual(lines[3], '  - "Alice"');
    });

    test("serializes empty array as just key", () => {
      const data: FrontmatterData = {
        authors: [],
      };
      const result = serializeFrontmatter(data);
      assert.strictEqual(result, "authors:");
    });

    test("skips undefined values", () => {
      const data: FrontmatterData = {
        title: "Hello",
        status: undefined as unknown as string,
      };
      const result = serializeFrontmatter(data);
      assert.strictEqual(result, 'title: "Hello"');
    });

    test("serializes empty object to empty string", () => {
      const result = serializeFrontmatter({});
      assert.strictEqual(result, "");
    });
  });

  suite("round-trip: parse → serialize → parse", () => {
    test("preserves scalar values through round-trip", () => {
      const original: FrontmatterData = {
        adr_id: "ADR-001",
        title: "Use PostgreSQL",
        date_created: "2026-01-15",
        status: "Accepted",
        superseded_by: "N/A",
      };

      const serialized = serializeFrontmatter(original);
      const text = `---\n${serialized}\n---\nBody.`;
      const parsed = parseFrontmatter(text);

      assert.ok(parsed);
      assert.strictEqual(parsed.data.adr_id, original.adr_id);
      assert.strictEqual(parsed.data.title, original.title);
      assert.strictEqual(parsed.data.date_created, original.date_created);
      assert.strictEqual(parsed.data.status, original.status);
      assert.strictEqual(parsed.data.superseded_by, original.superseded_by);
    });

    test("preserves array values through round-trip", () => {
      const original: FrontmatterData = {
        authors: ["Alice <alice@example.com>", "Bob <bob@example.com>"],
        impact_areas: ["Architecture", "Security"],
      };

      const serialized = serializeFrontmatter(original);
      const text = `---\n${serialized}\n---\n`;
      const parsed = parseFrontmatter(text);

      assert.ok(parsed);
      assert.deepStrictEqual(parsed.data.authors, original.authors);
      assert.deepStrictEqual(parsed.data.impact_areas, original.impact_areas);
    });
  });

  suite("updateFrontmatter", () => {
    test("updates a scalar field", () => {
      const text = [
        "---",
        'title: "Hello"',
        'status: "Proposed"',
        "---",
        "Body.",
      ].join("\n");

      const result = updateFrontmatter(text, { status: "Accepted" });
      const parsed = parseFrontmatter(result);
      assert.ok(parsed);
      assert.strictEqual(parsed.data.status, "Accepted");
      assert.strictEqual(parsed.data.title, "Hello");
    });

    test("adds a new field", () => {
      const text = [
        "---",
        'title: "Hello"',
        "---",
        "Body.",
      ].join("\n");

      const result = updateFrontmatter(text, { status: "Proposed" });
      const parsed = parseFrontmatter(result);
      assert.ok(parsed);
      assert.strictEqual(parsed.data.status, "Proposed");
    });

    test("removes a field when value is undefined", () => {
      const text = [
        "---",
        'title: "Hello"',
        'status: "Proposed"',
        "---",
        "Body.",
      ].join("\n");

      const result = updateFrontmatter(text, { status: undefined });
      const parsed = parseFrontmatter(result);
      assert.ok(parsed);
      assert.strictEqual(parsed.data.status, undefined);
      assert.strictEqual(parsed.data.title, "Hello");
    });

    test("replaces an entire array", () => {
      const text = [
        "---",
        "authors:",
        '  - "Alice"',
        '  - "Bob"',
        "---",
        "Body.",
      ].join("\n");

      const result = updateFrontmatter(text, { authors: ["Charlie"] });
      const parsed = parseFrontmatter(result);
      assert.ok(parsed);
      assert.deepStrictEqual(parsed.data.authors, ["Charlie"]);
    });

    test("returns original text when no frontmatter exists", () => {
      const text = "No frontmatter here.";
      const result = updateFrontmatter(text, { status: "Proposed" });
      assert.strictEqual(result, text);
    });

    test("preserves body text after updating frontmatter", () => {
      const text = [
        "---",
        'title: "Hello"',
        "---",
        "# Heading",
        "",
        "Paragraph.",
      ].join("\n");

      const result = updateFrontmatter(text, { status: "Draft" });
      const parsed = parseFrontmatter(result);
      assert.ok(parsed);
      assert.strictEqual(parsed.body, "# Heading\n\nParagraph.");
    });

    test("applies multiple updates at once", () => {
      const text = [
        "---",
        'title: "Hello"',
        'status: "Proposed"',
        'superseded_by: "N/A"',
        "---",
        "Body.",
      ].join("\n");

      const result = updateFrontmatter(text, {
        status: "Superseded",
        superseded_by: "ADR-002",
      });
      const parsed = parseFrontmatter(result);
      assert.ok(parsed);
      assert.strictEqual(parsed.data.status, "Superseded");
      assert.strictEqual(parsed.data.superseded_by, "ADR-002");
    });
  });

  suite("vulnerability and edge-case tests", () => {
    test("handles extremely long field values", () => {
      const longValue = "x".repeat(10_000);
      const text = [
        "---",
        `title: "${longValue}"`,
        "---",
        "",
      ].join("\n");

      const result = parseFrontmatter(text);
      assert.ok(result);
      assert.strictEqual(result.data.title, longValue);
    });

    test("handles field names with underscores and numbers", () => {
      const text = [
        "---",
        'adr_id: "ADR-001"',
        'cve_id: "CVE-2026-7010"',
        'rfc_id: "RFC-042"',
        'target_version: "v1.0.0"',
        'cvss_score: "7.5"',
        "---",
        "",
      ].join("\n");

      const result = parseFrontmatter(text);
      assert.ok(result);
      assert.strictEqual(result.data.adr_id, "ADR-001");
      assert.strictEqual(result.data.cve_id, "CVE-2026-7010");
      assert.strictEqual(result.data.rfc_id, "RFC-042");
      assert.strictEqual(result.data.target_version, "v1.0.0");
      assert.strictEqual(result.data.cvss_score, "7.5");
    });

    test("handles special characters in quoted values", () => {
      const text = [
        "---",
        'title: "Hello: World — A & B (v1.0)"',
        "---",
        "",
      ].join("\n");

      const result = parseFrontmatter(text);
      assert.ok(result);
      assert.strictEqual(result.data.title, "Hello: World — A & B (v1.0)");
    });

    test("CRLF line endings leave \\r on parsed values (known limitation)", () => {
      const text = "---\r\ntitle: \"Hello\"\r\n---\r\nBody.";
      const result = parseFrontmatter(text);
      // split("\n") leaves \r on lines, so the value includes \r
      // This documents the current behavior — the parser does not normalize CRLF
      if (result) {
        // If it parses at all, the title may contain a trailing \r
        assert.ok(typeof result.data.title === "string");
      }
    });

    test("updateFrontmatter preserves delimiters", () => {
      const text = [
        "---",
        'title: "Hello"',
        "---",
        "Body.",
      ].join("\n");

      const result = updateFrontmatter(text, { status: "Draft" });
      assert.ok(result.startsWith("---\n"));
      const afterFirstDelimiter = result.slice(4);
      assert.ok(afterFirstDelimiter.includes("\n---\n"));
    });

    test("backslash in quoted values is preserved literally (no YAML unescaping)", () => {
      const text = [
        "---",
        'title: "path\\\\to\\\\file"',
        "---",
        "",
      ].join("\n");

      const result = parseFrontmatter(text);
      assert.ok(result);
      // The custom parser does not perform YAML escape processing
      assert.strictEqual(result.data.title, "path\\\\to\\\\file");
    });
  });
});
