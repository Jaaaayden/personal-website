import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  formatDate,
  getAllPosts,
  getPost,
  parsePost,
  POSTS_DIR,
} from "../posts";

const post = (title: string, date: string, body = "body", extra = "") =>
  `---\ntitle: ${title}\ndate: ${date}\n${extra}---\n${body}\n`;

describe("parsePost", () => {
  it("builds a post with rendered html and a preview from the first text", () => {
    const p = parsePost("first", post("first", "2026-01-02", "hello **there**"));
    expect(p).toEqual({
      slug: "first",
      title: "first",
      date: "2026-01-02",
      preview: "hello there",
      html: "<p>hello <strong>there</strong></p>",
    });
  });

  it("prefers the summary for the preview", () => {
    const p = parsePost("s", post("s", "2026-01-02", "body", "summary: short one\n"));
    expect(p.preview).toBe("short one");
  });

  it("clips long previews at a word boundary", () => {
    const p = parsePost("long", post("long", "2026-01-02", "word ".repeat(80)));
    expect(p.preview.length).toBeLessThanOrEqual(140);
    expect(p.preview).toMatch(/word…$/);
  });

  it("rejects missing titles, bad dates and bad slugs", () => {
    expect(() => parsePost("a", "---\ndate: 2026-01-02\n---\n")).toThrow(/title/);
    expect(() => parsePost("a", post("a", "jan 2"))).toThrow(/YYYY-MM-DD/);
    expect(() => parsePost("a", post("a", "2026-02-30"))).toThrow(/YYYY-MM-DD/);
    expect(() => parsePost("Bad_Slug", post("a", "2026-01-02"))).toThrow(/filename/);
  });
});

describe("getAllPosts / getPost", () => {
  let dir: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "blog-test-"));
    fs.writeFileSync(path.join(dir, "old.md"), post("old", "2025-06-01"));
    fs.writeFileSync(path.join(dir, "new.md"), post("new", "2026-03-01"));
    fs.writeFileSync(path.join(dir, "b-same-day.md"), post("b same day", "2026-01-01"));
    fs.writeFileSync(path.join(dir, "a-same-day.md"), post("a same day", "2026-01-01"));
    fs.writeFileSync(path.join(dir, "notes.txt"), "not a post");
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("loads only .md files, newest first, ties by title", () => {
    expect(getAllPosts(dir).map((p) => p.slug)).toEqual([
      "new",
      "a-same-day",
      "b-same-day",
      "old",
    ]);
  });

  it("finds a post by slug, or null", () => {
    expect(getPost("old", dir)?.title).toBe("old");
    expect(getPost("missing", dir)).toBeNull();
  });

  it("returns no posts when the folder doesn't exist", () => {
    expect(getAllPosts(path.join(dir, "nope"))).toEqual([]);
  });

  it("parses every real post in the repo", () => {
    const posts = getAllPosts(POSTS_DIR);
    expect(posts.length).toBeGreaterThan(0);
    expect(posts.map((p) => p.slug)).toContain("hello-world");
  });
});

describe("formatDate", () => {
  it("formats in lowercase without timezone drift", () => {
    expect(formatDate("2026-01-01")).toBe("jan 1, 2026");
    expect(formatDate("2026-12-31")).toBe("dec 31, 2026");
  });
});
