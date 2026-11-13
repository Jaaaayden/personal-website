import { describe, expect, it } from "vitest";
import {
  escapeHtml,
  parseFrontmatter,
  renderInline,
  renderMarkdown,
  toPlainText,
} from "../markdown";

describe("parseFrontmatter", () => {
  it("splits key: value lines from the body", () => {
    const { data, body } = parseFrontmatter(
      "---\ntitle: hello world\ndate: 2026-11-13\n---\nbody text\n"
    );
    expect(data).toEqual({ title: "hello world", date: "2026-11-13" });
    expect(body).toBe("body text\n");
  });

  it("handles CRLF, a BOM, quotes, and colons inside values", () => {
    const { data, body } = parseFrontmatter(
      '﻿---\r\ntitle: "ramen: a review"\r\nsummary: \'it was good\'\r\n---\r\nhi'
    );
    expect(data).toEqual({ title: "ramen: a review", summary: "it was good" });
    expect(body).toBe("hi");
  });

  it("returns the whole file as body when there is no frontmatter", () => {
    expect(parseFrontmatter("just text")).toEqual({ data: {}, body: "just text" });
  });
});

describe("escapeHtml", () => {
  it("escapes the five HTML-significant characters", () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;"
    );
  });
});

describe("renderInline", () => {
  it("renders bold, italic and inline code", () => {
    expect(renderInline("**bold** and *it* and _also_ and `x < y`")).toBe(
      "<strong>bold</strong> and <em>it</em> and <em>also</em> and <code>x &lt; y</code>"
    );
  });

  it("leaves snake_case and lone asterisks alone", () => {
    expect(renderInline("my_var_name is 2 * 3 * 4")).toBe(
      "my_var_name is 2 * 3 * 4"
    );
  });

  it("does not format inside code spans", () => {
    expect(renderInline("`**not bold**`")).toBe("<code>**not bold**</code>");
  });

  it("renders external links in a new tab and internal links in place", () => {
    expect(renderInline("[gh](https://github.com/x?a=1&b=2)")).toBe(
      '<a href="https://github.com/x?a=1&amp;b=2" target="_blank" rel="noreferrer">gh</a>'
    );
    expect(renderInline("[**home**](/)")).toBe(
      '<a href="/"><strong>home</strong></a>'
    );
  });

  it("drops dangerous link schemes but keeps the text", () => {
    expect(renderInline("[click](javascript:alert(1))")).not.toContain("href");
    expect(renderInline("[click](java\tscript:alert(1))")).not.toContain("href");
    expect(renderInline("[click](data:text/html,hi)")).toBe("click");
  });

  it("escapes raw HTML instead of rendering it", () => {
    expect(renderInline('<script>alert("x")</script>')).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;"
    );
    expect(renderInline('<img src=x onerror="alert(1)">')).not.toContain("<img");
  });

  it("can't be tricked by forged placeholder characters", () => {
    expect(renderInline("\u00000\u0001 `<b>`")).toBe("0 <code>&lt;b&gt;</code>");
  });
});

describe("renderMarkdown", () => {
  it("wraps consecutive lines in a paragraph and splits on blank lines", () => {
    expect(renderMarkdown("one\ntwo\n\nthree")).toBe("<p>one\ntwo</p>\n<p>three</p>");
  });

  it("shifts headings down a level so the title stays the only h1", () => {
    expect(renderMarkdown("# big\n## smaller\n###### tiny")).toBe(
      "<h2>big</h2>\n<h3>smaller</h3>\n<h6>tiny</h6>"
    );
    expect(renderMarkdown("# C#")).toBe("<h2>C#</h2>");
  });

  it("renders fenced code blocks verbatim and escaped", () => {
    expect(renderMarkdown("```ts\nconst a = <T>(x: T) => **x**;\n\n```")).toBe(
      '<pre><code class="language-ts">const a = &lt;T&gt;(x: T) =&gt; **x**;\n</code></pre>'
    );
  });

  it("renders bullet and numbered lists, with continuation lines", () => {
    expect(renderMarkdown("- a\n* **b**\n  more b\n\n3. c\n4. d")).toBe(
      '<ul><li>a</li><li><strong>b</strong> more b</li></ul>\n<ol start="3"><li>c</li><li>d</li></ol>'
    );
  });

  it("renders blockquotes with nested markdown", () => {
    expect(renderMarkdown("> quoted *text*\n> - item")).toBe(
      "<blockquote><p>quoted <em>text</em></p>\n<ul><li>item</li></ul></blockquote>"
    );
  });

  it("renders horizontal rules and lets blocks interrupt paragraphs", () => {
    expect(renderMarkdown("para\n- list\n\n---")).toBe(
      "<p>para</p>\n<ul><li>list</li></ul>\n<hr />"
    );
  });

  it("escapes raw HTML blocks", () => {
    expect(renderMarkdown("<div onclick=x>hi</div>")).toBe(
      "<p>&lt;div onclick=x&gt;hi&lt;/div&gt;</p>"
    );
  });
});

describe("review fixes", () => {
  it("keeps a code span inside a link label", () => {
    expect(renderInline("[`npm i`](https://x.com)")).toBe(
      '<a href="https://x.com" target="_blank" rel="noreferrer"><code>npm i</code></a>'
    );
    expect(toPlainText("[`x`](/y)")).toBe("x");
  });

  it("keeps balanced parens in link URLs", () => {
    expect(renderInline("[wiki](https://en.wikipedia.org/wiki/Foo_(bar))")).toBe(
      '<a href="https://en.wikipedia.org/wiki/Foo_(bar)" target="_blank" rel="noreferrer">wiki</a>'
    );
  });

  it("only lets 1. interrupt a paragraph", () => {
    expect(renderMarkdown("I was born in\n1999. it was cold")).toBe(
      "<p>I was born in\n1999. it was cold</p>"
    );
    expect(renderMarkdown("steps:\n1. go")).toBe("<p>steps:</p>\n<ol><li>go</li></ol>");
  });

  it("nests ***bold italic*** correctly", () => {
    expect(renderInline("***x***")).toBe("<strong><em>x</em></strong>");
  });

  it("renders indented sub-lists inside their parent item", () => {
    expect(renderMarkdown("- a\n  - nested\n- b")).toBe(
      "<ul><li>a<ul><li>nested</li></ul></li><li>b</li></ul>"
    );
    expect(renderMarkdown("1. a\n   - x\n   - y\n2. b")).toBe(
      "<ol><li>a<ul><li>x</li><li>y</li></ul></li><li>b</li></ol>"
    );
  });

  it("only closes a code block on a bare fence line", () => {
    expect(renderMarkdown("```\n```bash is the syntax\nmore\n```\nafter")).toBe(
      "<pre><code>```bash is the syntax\nmore</code></pre>\n<p>after</p>"
    );
  });
});

describe("toPlainText", () => {
  it("strips markup and decodes entities", () => {
    expect(toPlainText("## hi\n\nsome **bold**, `a < b` & [link](/x)")).toBe(
      "hi some bold, a < b & link"
    );
  });
});
