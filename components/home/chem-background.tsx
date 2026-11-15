import { FloatingChemIcons, type FloatingItem } from "./chem-icons"

// Hero background: soft radial wash, faint dot grid and floating chemistry line-art.
// Placement keeps the densest area away from the headline (left-centre) on desktop.
const HERO_ITEMS: FloatingItem[] = [
  // ---- Desktop (lg+): two-column layout — icons sit in the gutters and the empty top/bottom bands
  { kind: "flask", className: "hidden lg:block left-[3%] top-[14%] w-16", dur: 15, delay: 0, rot: -12 },
  { kind: "benzene", className: "hidden lg:block left-[42%] top-[8%] w-14", dur: 18, delay: -4, rot: 10, spin: 20 },
  { kind: "dna", className: "hidden lg:block right-[2%] top-[12%] w-14", dur: 20, delay: -8, rot: 18 },
  { kind: "atom", className: "hidden lg:block left-[1.5%] bottom-[2%] w-16", dur: 22, delay: -2, spin: 35 },
  { kind: "tube", className: "hidden lg:block left-[48%] bottom-[6%] w-12", dur: 16, delay: -6, rot: 24 },
  { kind: "beaker", className: "hidden lg:block right-[3%] bottom-[8%] w-14", dur: 17, delay: -10, rot: -8 },
  { kind: "text", text: "H₂O", className: "hidden lg:block left-[24%] top-[9%] text-2xl", dur: 19, delay: -3, rot: -6, dx: -8 },
  { kind: "text", text: "CO₂", className: "hidden lg:block right-[28%] top-[9%] text-2xl", dur: 21, delay: -9, rot: 8, dx: 10 },
  { kind: "text", text: "CH₄", className: "hidden lg:block left-[30%] bottom-[3%] text-xl", dur: 18, delay: -7, rot: 4 },
  { kind: "text", text: "NaCl", className: "hidden lg:block right-[1.5%] top-[50%] text-xl", dur: 23, delay: -14, rot: -10 },
  // ---- Phones & tablets (< lg): single centred column — small icons in the empty corners only
  { kind: "benzene", className: "lg:hidden left-[4%] top-[80px] w-10", dur: 18, delay: -4, rot: 10, spin: 20 },
  { kind: "text", text: "H₂O", className: "lg:hidden right-[5%] top-[86px] text-lg", dur: 19, delay: -3, rot: -6 },
  { kind: "atom", className: "lg:hidden left-[4%] bottom-[8px] w-12", dur: 22, delay: -2, spin: 35 },
  { kind: "beaker", className: "lg:hidden right-[5%] bottom-[10px] w-10", dur: 17, delay: -10, rot: -8 },
  // Tablet: the preview card is narrower than the screen, so its side gutters have room
  { kind: "flask", className: "hidden md:block lg:hidden left-[4%] bottom-[22%] w-14", dur: 15, delay: 0, rot: -12 },
  { kind: "tube", className: "hidden md:block lg:hidden right-[5%] bottom-[28%] w-11", dur: 16, delay: -6, rot: 24 },
]

export function ChemBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_20%,color-mix(in_oklch,var(--primary)_12%,transparent),transparent_70%),radial-gradient(ellipse_60%_50%_at_0%_100%,color-mix(in_oklch,var(--primary)_8%,transparent),transparent_70%)]" />
      <div className="absolute inset-0 opacity-[0.35] [background-image:radial-gradient(color-mix(in_oklch,var(--primary)_18%,transparent)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_40%,black,transparent)]" />
      <FloatingChemIcons items={HERO_ITEMS} />
    </div>
  )
}
