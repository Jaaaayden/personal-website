/**
 * New post: add src/content/blog/<slug>.md, then redeploy. The filename is the URL.
 *
 *   src/content/blog/late-night-ramen.md  ->  /blog/late-night-ramen
 *
 *   ---
 *   title: late night ramen
 *   date: 2026-11-13
 *   summary: optional one-liner for the /blog list
 *   ---
 *   the body is **markdown**: paragraphs, ## headings, [links](https://x.com),
 *   `code`, ``` blocks, - lists, > quotes.
 *
 * Skipped: README.md and files starting with "_" (drafts), e.g. _ideas.md.
 */

import fs from "node:fs";
import path from "node:path";
import { cache } from "react";
import { parseFrontmatter, renderMarkdown, toPlainText } from "./markdown";

export const POSTS_DIR = path.join(process.cwd(), "src", "content", "blog");

export type Post = {
  slug: string;
  title: string;
  /** YYYY-MM-DD */
  date: string;
  /** One line for the index page and the meta description. */
  preview: string;
  html: string;
};

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const PREVIEW_MAX = 140;

function isRealDate(date: string): boolean {
  if (!DATE.test(date)) return false;
  const d = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(date);
}

function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max / 2 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/** Parses one post file. Throws (failing the build) on bad frontmatter. */
export function parsePost(slug: string, source: string): Post {
  const where = `blog post "${slug}.md"`;
  if (!SLUG.test(slug)) {
    throw new Error(`${where}: filename must be lowercase-words-with-dashes`);
  }
  const { data, body } = parseFrontmatter(source);
  const title = data.title?.trim();
  const date = data.date?.trim();
  if (!title) throw new Error(`${where}: missing "title:" in frontmatter`);
  if (!date || !isRealDate(date)) {
    throw new Error(`${where}: "date:" must be YYYY-MM-DD, got "${date ?? ""}"`);
  }
  const summary = data.summary?.trim();
  return {
    slug,
    title,
    date,
    preview: clip(summary || toPlainText(body), PREVIEW_MAX),
    html: renderMarkdown(body),
  };
}

/** Newest first; same-day posts fall back to title order. */
export function sortPosts(posts: Post[]): Post[] {
  return [...posts].sort(
    (a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title)
  );
}

const isPostFile = (file: string) =>
  /\.md$/i.test(file) && !file.startsWith("_") && file.toLowerCase() !== "readme.md";

/** Memoized per render pass, so a post page's metadata + body parse once. */
const loadPosts = cache((dir: string): Post[] => {
  if (!fs.existsSync(dir)) return [];
  const posts = fs
    .readdirSync(dir)
    .filter(isPostFile)
    .map((file) =>
      parsePost(file.slice(0, -3), fs.readFileSync(path.join(dir, file), "utf8"))
    );
  return sortPosts(posts);
});

export function getAllPosts(dir: string = POSTS_DIR): Post[] {
  return loadPosts(dir);
}

export function getPost(slug: string, dir: string = POSTS_DIR): Post | null {
  return getAllPosts(dir).find((post) => post.slug === slug) ?? null;
}

/** "2026-11-13" -> "nov 13, 2026", without timezone drift. */
export function formatDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const month = [
    "jan", "feb", "mar", "apr", "may", "jun",
    "jul", "aug", "sep", "oct", "nov", "dec",
  ][m - 1];
  return `${month} ${d}, ${y}`;
}
