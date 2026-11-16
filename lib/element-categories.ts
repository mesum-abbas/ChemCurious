// Single source of truth for periodic-table category colours, shared by the table cells,
// the element dialog and the page legend so they can never drift apart.
// These hues carry meaning (category), so they intentionally sit outside the teal/slate UI palette.
export const ELEMENT_CATEGORY_COLORS: Record<string, string> = {
  "Alkali Metal": "bg-red-500 hover:bg-red-600",
  "Alkaline Earth Metal": "bg-orange-500 hover:bg-orange-600",
  "Transition Metal": "bg-yellow-500 hover:bg-yellow-600",
  "Post-transition Metal": "bg-green-500 hover:bg-green-600",
  Metalloid: "bg-teal-500 hover:bg-teal-600",
  "Reactive Nonmetal": "bg-blue-500 hover:bg-blue-600",
  "Noble Gas": "bg-purple-500 hover:bg-purple-600",
  Lanthanide: "bg-pink-500 hover:bg-pink-600",
  Actinide: "bg-indigo-500 hover:bg-indigo-600",
  Unknown: "bg-gray-500 hover:bg-gray-600",
}

/** Legend entries (swatch class + label), excluding the "Unknown" fallback. */
export const ELEMENT_CATEGORY_LEGEND = Object.entries(ELEMENT_CATEGORY_COLORS)
  .filter(([name]) => name !== "Unknown")
  .map(([name, cls]) => ({ name, swatch: cls.split(" ")[0] }))
