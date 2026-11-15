// Minimal, dependency-free RSS 2.0 / Atom item parser for news feeds.
// Handles CDATA, numeric + common named entities, and strips HTML from descriptions.

export interface RawFeedItem {
  title: string
  link: string
  description: string
  pubDate: string
  guid?: string
  categories: string[]
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  ndash: "–", mdash: "—", hellip: "…", lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”",
  deg: "°", micro: "µ", times: "×", middot: "·", copy: "©", reg: "®", trade: "™",
}

export function decodeEntities(input: string): string {
  return input.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === "#") {
      const n = code[1]?.toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10)
      return Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : ""
    }
    return NAMED_ENTITIES[code.toLowerCase()] ?? match
  })
}

function unwrapCdata(s: string): string {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
}

/** Plain text from an HTML-ish fragment (entities decoded, tags removed, whitespace collapsed). */
export function htmlToText(input: string): string {
  let s = unwrapCdata(input)
  // Entity-encoded markup (e.g. "&lt;p&gt;") — decode once so the tags can be stripped
  if (/&lt;\/?[a-z]/i.test(s)) s = decodeEntities(s)
  s = s
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>|<\/p>/gi, " ")
    .replace(/<[^>]+>/g, " ")
  return decodeEntities(s).replace(/\s+/g, " ").trim()
}

function tag(block: string, name: string): string {
  const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i"))
  return m ? unwrapCdata(m[1]!).trim() : ""
}

function allTags(block: string, name: string): string[] {
  const out: string[] = []
  const re = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "gi")
  let m: RegExpExecArray | null
  while ((m = re.exec(block))) out.push(htmlToText(m[1]!))
  return out.filter(Boolean)
}

export function parseFeed(xml: string): RawFeedItem[] {
  const items: RawFeedItem[] = []

  // RSS 2.0 <item>
  for (const m of xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)) {
    const b = m[1]!
    items.push({
      title: htmlToText(tag(b, "title")),
      link: decodeEntities(tag(b, "link")).trim(),
      description: htmlToText(tag(b, "description") || tag(b, "content:encoded")),
      pubDate: tag(b, "pubDate") || tag(b, "dc:date"),
      guid: tag(b, "guid") || undefined,
      categories: allTags(b, "category"),
    })
  }

  // Atom <entry> (in case a source switches format)
  if (items.length === 0) {
    for (const m of xml.matchAll(/<entry(?:\s[^>]*)?>([\s\S]*?)<\/entry>/gi)) {
      const b = m[1]!
      const href = b.match(/<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/i)?.[1] ?? b.match(/<link[^>]*href=["']([^"']+)["']/i)?.[1] ?? ""
      items.push({
        title: htmlToText(tag(b, "title")),
        link: decodeEntities(href).trim(),
        description: htmlToText(tag(b, "summary") || tag(b, "content")),
        pubDate: tag(b, "published") || tag(b, "updated"),
        guid: tag(b, "id") || undefined,
        categories: [],
      })
    }
  }

  return items.filter((i) => i.title && /^https?:\/\//i.test(i.link))
}
