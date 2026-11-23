/**
 * Utility functions for HTML sanitization and plain text conversion
 */

/**
 * Strips HTML tags and normalizes whitespace for plain text contexts
 * (e.g., SEO meta tags, product cards, breadcrumbs, JSON-LD schema).
 */
export function stripHtml(html?: string | null): string {
  if (!html) return "";
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Checks whether a given string contains HTML markup tags.
 */
export function hasHtmlTags(str?: string | null): boolean {
  if (!str) return false;
  return /<[a-z][\s\S]*>/i.test(str);
}

/**
 * Extracts a clean, short plain-text summary for the above-the-fold product area.
 * Prefers the first <p> block when HTML markup is present, skipping <h3> titles.
 */
export function extractSummary(
  description?: string | null,
  maxLength = 240,
): { summary: string; hasMore: boolean } {
  if (!description) return { summary: "", hasMore: false };

  const firstParagraphMatch = description.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  const baseText = firstParagraphMatch
    ? stripHtml(firstParagraphMatch[1])
    : stripHtml(description);

  const fullPlain = stripHtml(description);
  let summary = baseText;
  let truncated = false;

  if (summary.length > maxLength) {
    const slice = summary.slice(0, maxLength);
    const lastSpace = slice.lastIndexOf(" ");
    summary = (lastSpace > 120 ? slice.slice(0, lastSpace) : slice).trimEnd() + "...";
    truncated = true;
  }

  const hasMore =
    truncated ||
    hasHtmlTags(description) && (/<(h4|ul|ol)\b/i.test(description) || fullPlain.length > summary.length + 20);

  return { summary, hasMore };
}
