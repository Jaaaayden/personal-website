/**
 * Serves /resume.pdf by proxying the live "export as PDF" of a Google Doc,
 * so editing the doc updates the resume with no redeploy.
 */

const DOC_ID = process.env.RESUME_GDOC_ID;

/** How long a fetched copy is reused before re-exporting from Google. */
const REVALIDATE_SECONDS = 3600;

/** Builds a minimal valid one-page PDF with the given lines of text. */
function buildPlaceholderPdf(lines: string[]): ArrayBuffer {
  const content = lines
    .map(
      (line, i) =>
        `BT /F1 ${i === 0 ? 24 : 12} Tf 72 ${700 - i * 34} Td (${line
          .replace(/\\/g, "\\\\")
          .replace(/[()]/g, "\\$&")}) Tj ET`
    )
    .join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) {
    pdf += `${String(off).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  // encode() allocates a fresh, exactly-sized buffer for ASCII input
  return new TextEncoder().encode(pdf).buffer as ArrayBuffer;
}

function pdfResponse(body: BodyInit, cacheSeconds: number): Response {
  return new Response(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="jayden-le-resume.pdf"',
      "Cache-Control": `public, s-maxage=${cacheSeconds}, stale-while-revalidate=86400`,
    },
  });
}

export async function GET() {
  if (!DOC_ID) {
    return pdfResponse(
      buildPlaceholderPdf([
        "Resume placeholder",
        "Set RESUME_GDOC_ID to serve the live Google Doc export here.",
      ]),
      0
    );
  }

  try {
    const res = await fetch(
      `https://docs.google.com/document/d/${DOC_ID}/export?format=pdf`,
      { next: { revalidate: REVALIDATE_SECONDS } }
    );
    if (!res.ok) throw new Error(`Google Docs export returned ${res.status}`);
    return pdfResponse(await res.arrayBuffer(), REVALIDATE_SECONDS);
  } catch (error) {
    console.error("resume.pdf proxy failed:", error);
    return pdfResponse(
      buildPlaceholderPdf([
        "Resume temporarily unavailable",
        "Please try again shortly, or reach me at jaydenle@g.ucla.edu",
      ]),
      0
    );
  }
}
