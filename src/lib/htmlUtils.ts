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
