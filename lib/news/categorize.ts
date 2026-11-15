export const NEWS_CATEGORIES = [
  "Elements & Materials",
  "Organic & Synthesis",
  "Biochemistry",
  "Green Chemistry",
] as const

export type NewsCategory = (typeof NEWS_CATEGORIES)[number] | "General Discovery"

// Keyword stems scored against title (x2) + summary + feed categories (x3). Highest score wins.
const KEYWORDS: Record<(typeof NEWS_CATEGORIES)[number], RegExp[]> = {
  "Elements & Materials": [
    /\belement/, /\bmetal/, /alloy/, /material/, /semiconduct/, /crystal/, /graphene/, /\bbatter/, /electrode/,
    /superconduct/, /oxide/, /nanopartic/, /nanomaterial/, /\bquantum/, /mineral/, /isotope/, /periodic table/,
    /ceramic/, /magnet/, /perovskite/, /lithium/, /\bsodium/, /diamond/, /\bglass/, /geochem/, /inorganic/,
  ],
  "Organic & Synthesis": [
    /synthe/, /organic/, /\breaction/, /catalys/, /catalyt/, /compound/, /\bbond/, /chiral/, /polymer/, /molecul/,
    /reagent/, /solvent/, /\bc[-–]h\b/, /ligand/, /photochem/, /electrochem/, /drug discover/, /\bmof/, /framework/,
  ],
  Biochemistry: [
    /protein/, /enzyme/, /\bdna\b/, /\brna\b/, /\bcell/, /biolog/, /metabol/, /peptide/, /antibiot/, /bacteri/,
    /\bgene/, /tissue/, /\bdrug/, /medic/, /biochem/, /virus/, /\bbrain/, /cancer/, /amino acid/, /microb/,
  ],
  "Green Chemistry": [
    /sustainab/, /\bgreen\b/, /renewable/, /recycl/, /carbon dioxide/, /\bco2\b/, /\bco₂\b/, /emission/, /climate/,
    /\bsolar/, /hydrogen/, /biodegrad/, /pollut/, /plastic/, /clean energy/, /water purif/, /waste/, /carbon capture/,
    /fossil/, /environment/, /pfas/, /toxic/, /biofuel/,
  ],
}

export function categorize(title: string, summary: string, feedCategories: string[] = []): NewsCategory {
  const t = title.toLowerCase()
  const s = summary.toLowerCase()
  const c = feedCategories.join(" ").toLowerCase()

  let best: NewsCategory = "General Discovery"
  let bestScore = 0
  for (const cat of NEWS_CATEGORIES) {
    let score = 0
    for (const re of KEYWORDS[cat]) {
      if (re.test(t)) score += 2
      if (re.test(s)) score += 1
      if (re.test(c)) score += 3
    }
    if (score > bestScore) {
      best = cat
      bestScore = score
    }
  }
  return best
}
