/**
 * Tiny frontmatter + markdown renderer for blog posts. Supports paragraphs,
 * headings, links, **bold**, *italic*, `inline code`, fenced code blocks,
 * - / 1. lists, > blockquotes and --- rules. Everything else is plain text,
 * and all text is HTML-escaped, so a post can never inject markup.
 */

export type Frontmatter = Record<string, string>;

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Normalizes line endings and drops a leading BOM. */
function normalize(source: string): string {
  return source.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
}

/** Splits `---`-fenced `key: value` lines off the top of a file. */
export function parseFrontmatter(source: string): {
  data: Frontmatter;
  body: string;
} {
  const text = normalize(source);
  const match = /^---\n([\s\S]*?)\n---[ \t]*(?:\n|$)/.exec(text);
  if (!match) return { data: {}, body: text };

  const data: Frontmatter = {};
  for (const line of match[1].split("\n")) {
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    const colon = line.indexOf(":");
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    let value = line.slice(colon + 1).trim();
    if (
      value.length >= 2 &&
      (value[0] === '"' || value[0] === "'") &&
      value.at(-1) === value[0]
    ) {
      value = value.slice(1, -1);
    }
    if (key) data[key] = value;
  }
  return { data, body: text.slice(match[0].length) };
}

/** Only web, mail and same-site links survive; `javascript:` etc. do not. */
function safeHref(raw: string): string | null {
  // Strip whitespace/control chars browsers ignore inside a scheme.
  const url = raw.replace(/[\u0000- ]/g, "");
  if (/^(https?:|mailto:)/i.test(url)) return url;
  // Relative or anchor links: no scheme before the first / ? #.
  const firstDelim = url.search(/[/?#]/);
  const colon = url.indexOf(":");
  if (colon === -1 || (firstDelim !== -1 && firstDelim < colon)) return url;
  return null;
}

/** Placeholder delimiters; stripped from input so they can't be forged. */
const PH_OPEN = "\u0000";
const PH_CLOSE = "\u0001";

/** Renders one line/paragraph of inline markdown to escaped HTML. */
export function renderInline(text: string): string {
  const stash: string[] = [];
  const hold = (html: string) => `${PH_OPEN}${stash.push(html) - 1}${PH_CLOSE}`;

  let out = text.replace(/[\u0000\u0001]/g, "");

  // Code spans first: their contents are literal, never formatted.
  out = out.replace(/(`+)([\s\S]*?[^`])\1(?!`)/g, (_, _ticks, code: string) =>
    hold(`<code>${escapeHtml(code)}</code>`)
  );

  out = escapeHtml(out);

  // [text](url) — url was escaped above, which is what an attribute needs.
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (whole, label: string, href: string) => {
    const decoded = href
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&");
    const safe = safeHref(decoded);
    if (safe === null) return formatEmphasis(label);
    const external = /^https?:/i.test(safe);
    const attrs = external ? ' target="_blank" rel="noreferrer"' : "";
    return hold(`<a href="${escapeHtml(safe)}"${attrs}>${formatEmphasis(label)}</a>`);
  });

  out = formatEmphasis(out);

  return out.replace(
    new RegExp(`${PH_OPEN}(\\d+)${PH_CLOSE}`, "g"),
    (_, i: string) => stash[Number(i)]
  );
}

function formatEmphasis(html: string): string {
  return html
    .replace(/\*\*(?=\S)([\s\S]*?\S)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^\w])__(?=\S)([\s\S]*?\S)__(?!\w)/g, "$1<strong>$2</strong>")
    .replace(/\*(?=\S)([^*]*?\S)\*/g, "<em>$1</em>")
    .replace(/(^|[^\w])_(?=\S)([^_]*?\S)_(?!\w)/g, "$1<em>$2</em>");
}

const FENCE = /^\s*(```+|~~~+)\s*([\w+-]*)\s*$/;
const HEADING = /^(#{1,6})\s+(.*?)(?:\s+#+)?\s*$/;
const RULE = /^\s*([-*_])(\s*\1){2,}\s*$/;
const BULLET = /^\s*[-*+]\s+(.*)$/;
const ORDERED = /^\s*(\d+)[.)]\s+(.*)$/;
const QUOTE = /^\s*>\s?(.*)$/;

/**
 * Renders a markdown body to HTML. Headings shift down one level (`#` → h2)
 * because the post title is the page's only h1.
 */
export function renderMarkdown(source: string): string {
  const lines = normalize(source).split("\n");
  const html: string[] = [];
  let i = 0;

  const isBlockStart = (line: string) =>
    FENCE.test(line) ||
    HEADING.test(line) ||
    RULE.test(line) ||
    BULLET.test(line) ||
    ORDERED.test(line) ||
    QUOTE.test(line);

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    const fence = FENCE.exec(line);
    if (fence) {
      const marker = fence[1];
      const lang = fence[2];
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(marker)) {
        code.push(lines[i]);
        i++;
      }
      i++; // closing fence (or end of file)
      const cls = lang ? ` class="language-${escapeHtml(lang)}"` : "";
      html.push(`<pre><code${cls}>${escapeHtml(code.join("\n"))}</code></pre>`);
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      const level = Math.min(heading[1].length + 1, 6);
      html.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      i++;
      continue;
    }

    if (RULE.test(line)) {
      html.push("<hr />");
      i++;
      continue;
    }

    if (QUOTE.test(line)) {
      const inner: string[] = [];
      while (i < lines.length && QUOTE.test(lines[i])) {
        inner.push(QUOTE.exec(lines[i])![1]);
        i++;
      }
      html.push(`<blockquote>${renderMarkdown(inner.join("\n"))}</blockquote>`);
      continue;
    }

    const ordered = ORDERED.test(line);
    if (ordered || BULLET.test(line)) {
      const pattern = ordered ? ORDERED : BULLET;
      const items: string[] = [];
      const start = ordered ? Number(ORDERED.exec(line)![1]) : 1;
      while (i < lines.length) {
        const m = pattern.exec(lines[i]);
        if (m) {
          items.push(ordered ? m[2] : m[1]);
        } else if (/^\s+\S/.test(lines[i]) && items.length) {
          // indented continuation of the previous item
          items[items.length - 1] += ` ${lines[i].trim()}`;
        } else {
          break;
        }
        i++;
      }
      const tag = ordered ? "ol" : "ul";
      const startAttr = ordered && start !== 1 ? ` start="${start}"` : "";
      const lis = items.map((item) => `<li>${renderInline(item)}</li>`).join("");
      html.push(`<${tag}${startAttr}>${lis}</${tag}>`);
      continue;
    }

    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !(para.length && isBlockStart(lines[i]))) {
      para.push(lines[i].trim());
      i++;
    }
    html.push(`<p>${renderInline(para.join("\n"))}</p>`);
  }

  return html.join("\n");
}

/** Markdown → plain text, for previews and meta descriptions. */
export function toPlainText(source: string): string {
  return renderMarkdown(source)
    .replace(/<\/?(?:p|h\d|li|ul|ol|blockquote|pre|hr)\b[^>]*>/g, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}
