const YEAR_PATTERN = /(?:©\s*)(20\d{2})\b|(\b20\d{2}\b)/;

export function formatCopyright(
  text: string,
  year: number = new Date().getFullYear(),
): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;

  if (YEAR_PATTERN.test(trimmed)) {
    return trimmed.replace(/\b20\d{2}\b/g, String(year));
  }

  if (trimmed.startsWith("©")) {
    return `© ${year} ${trimmed.replace(/^©\s*/, "").trim()}`;
  }

  return `© ${year} ${trimmed}`;
}
