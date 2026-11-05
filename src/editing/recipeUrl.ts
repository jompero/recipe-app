// Whether two source URLs point at the same recipe page (EPIC-4, US-4.3: the duplicate notice).

/**
 * True if both are web addresses of the same page, ignoring the protocol, a leading `www.`, the
 * query, the fragment and a trailing slash. A URL typed without `https://` counts. Empty or
 * unreadable addresses never match.
 */
export function sameRecipeUrl(a: string, b: string): boolean {
  const key = pageKey(a);
  return key !== null && key === pageKey(b);
}

function pageKey(url: string): string | null {
  const trimmed = url.trim();
  if (trimmed === "") return null;
  const withProtocol = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
  // URL lowercases the host and drops the default port; the path keeps its case.
  return parsed.host.replace(/^www\./, "") + parsed.pathname.replace(/\/+$/, "");
}
