import { FloatingChemIcons, type FloatingItem } from "@/components/home/chem-icons"

// Shared header line-art: teal (#14B8A6) flasks, test tubes, benzene rings and atom orbitals at
// ~22% opacity, stroke 2. Every page header uses it so the routes feel like one site.
// Pure SVG/CSS (server-safe); animation is disabled for reduced motion in globals.css.

// Centred headers: icons stay in the side gutters on desktop, small corner icons on phones.
const CENTER_ITEMS: FloatingItem[] = [
  { kind: "bubblingFlask", className: "hidden lg:block left-[4%] top-[26%] w-14", dur: 16, delay: -2, rot: -10 },
  { kind: "benzene", className: "hidden lg:block right-[6%] top-[22%] w-12", dur: 20, delay: -6, rot: 12, spin: 22 },
  { kind: "atom", className: "hidden lg:block left-[10%] top-[64%] w-14", dur: 24, delay: -9, spin: 36 },
  { kind: "tube", className: "hidden lg:block right-[3%] top-[60%] w-10", dur: 18, delay: -4, rot: 26 },
  { kind: "text", text: "H₂O", className: "hidden xl:block left-[20%] top-[30%] text-2xl", dur: 19, delay: -5, rot: -6 },
  { kind: "text", text: "CO₂", className: "hidden xl:block right-[18%] top-[70%] text-xl", dur: 21, delay: -11, rot: 8 },
  { kind: "benzene", className: "lg:hidden left-[4%] top-[84px] w-9", dur: 20, delay: -6, spin: 22 },
  { kind: "tube", className: "lg:hidden right-[5%] top-[88px] w-7", dur: 18, delay: -4, rot: 26 },
]

// Left-aligned headers: the copy sits on the left, so the line-art lives on the right.
const LEFT_ITEMS: FloatingItem[] = [
  { kind: "atom", className: "hidden lg:block right-[4%] top-[30%] w-16", dur: 24, delay: -7, spin: 36 },
  { kind: "bubblingFlask", className: "hidden lg:block right-[15%] top-[48%] w-12", dur: 16, delay: -2, rot: -10 },
  { kind: "benzene", className: "hidden xl:block right-[26%] top-[26%] w-12", dur: 20, delay: -5, rot: 12, spin: 22 },
  { kind: "tube", className: "hidden xl:block right-[33%] top-[58%] w-9", dur: 18, delay: -9, rot: 24 },
  { kind: "text", text: "NaCl", className: "hidden xl:block right-[22%] top-[74%] text-xl", dur: 22, delay: -10, rot: 8 },
  { kind: "flask", className: "lg:hidden right-[5%] top-[84px] w-9", dur: 16, delay: -2, rot: -10 },
  { kind: "text", text: "CO₂", className: "lg:hidden right-[20%] top-[92px] text-lg", dur: 21, delay: -8 },
]

export function FloatingChemBackground({
  align = "center",
  items,
  className,
}: {
  /** Which side the header copy sits on; the icons stay clear of it. */
  align?: "center" | "left"
  /** Custom placement, if a page needs it */
  items?: FloatingItem[]
  className?: string
}) {
  return <FloatingChemIcons items={items ?? (align === "left" ? LEFT_ITEMS : CENTER_ITEMS)} className={className} />
}
