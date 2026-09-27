const MIN_SPACED_TOKENS = 4;
const MIN_SINGLE_CHAR_RATIO = 0.8;

function collapseLine(line: string): string {
  const trimmed = line.trim();
  const tokens = trimmed.split(/\s+/).filter(Boolean);
  if (tokens.length < MIN_SPACED_TOKENS) return line;
  const singles = tokens.filter((t) => t.length === 1).length;
  if (singles / tokens.length < MIN_SINGLE_CHAR_RATIO) return line;
  return trimmed
    .split(/\s{2,}/)
    .map((word) => word.replace(/\s+/g, ""))
    .join(" ");
}

/**
 * Some PDF fonts (e.g. BPI SOAs) make pdf.js emit one space between every glyph
 * ("B P I   A M O R E") and a wider gap between words. Collapse those lines back to
 * normal words; lines that are not letter-spaced are returned unchanged.
 */
export function collapseLetterSpacedText(text: string): string {
  return text.split("\n").map(collapseLine).join("\n");
}
