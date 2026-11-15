// Concept Lab content. To add a concept: append an entry here and (if it needs a new diagram)
// register a visual component under the same `visual` key in components/concepts/visual-registry.tsx.
import type { LucideIcon } from "lucide-react"
import { Atom, CircleDot, Droplets, FlaskConical, Flame, Gauge, Layers, Link2, Orbit, Thermometer, Zap } from "lucide-react"

export type VisualKey = "cathode" | "canal" | "rutherford" | "chadwick" | "bonding" | "states" | "boyle" | "charles" | "ph"

export type CategoryId = "atomic" | "bonding-matter" | "gases-solutions"

/** Sidebar groups, in display order. Concepts appear in the order they are listed in conceptsData. */
export const CONCEPT_CATEGORIES: Array<{ id: CategoryId; title: string; icon: LucideIcon }> = [
  { id: "atomic", title: "Atomic Discoveries", icon: Atom },
  { id: "bonding-matter", title: "Bonding & Matter", icon: Layers },
  { id: "gases-solutions", title: "Gas Laws & Solutions", icon: FlaskConical },
]

export interface ConceptStep {
  title: string
  body: string
}

export interface Concept {
  id: string
  category: CategoryId
  title: string
  shortTitle: string
  icon: LucideIcon
  /** Tailwind classes for the concept's accent (selector icon + step numbers) */
  accent: string
  level: string
  summary: string
  steps: ConceptStep[]
  observations: string[]
  takeaway: string
  /** Optional key equation shown in its own card */
  formula?: { expression: string; caption: string }
  visual: VisualKey
  /** One-line hint shown above the visual */
  tryIt: string
}

export const conceptsData: Concept[] = [
  {
    id: "cathode-rays",
    category: "atomic",
    title: "Discovery of the Electron: Cathode Ray Tube",
    shortTitle: "Cathode Ray Tube (Electrons)",
    icon: Zap,
    accent: "bg-emerald-500/10 text-emerald-600",
    level: "Class 9 · Atomic Structure · J.J. Thomson, 1897",
    summary:
      "J.J. Thomson passed a high voltage through a glass tube with almost all the air pumped out. A beam travelled from the negative electrode (cathode) and made the far end of the tube glow. By bending that beam with electric and magnetic fields, he showed it was made of tiny, negatively charged particles that are part of every atom: electrons.",
    steps: [
      {
        title: "An evacuated tube and a high voltage",
        body: "Inside a sealed glass tube at very low pressure, a high voltage between the cathode (−) and the anode (+) produces a beam called a cathode ray. A slit in the anode narrows it into a thin line.",
      },
      {
        title: "The beam bends towards the positive plate",
        body: "Between two charged metal plates the beam curves towards the positive plate and away from the negative one. Opposite charges attract, so the particles in the beam must be negative.",
      },
      {
        title: "A magnetic field bends it too",
        body: "A magnetic field also deflects the beam, which only happens to moving charged particles. By balancing the two fields so the beam ran straight, Thomson measured the particles' charge-to-mass ratio — the same for every metal and gas he tried.",
      },
    ],
    observations: [
      "The beam travels in straight lines and casts sharp shadows, so it is a stream of particles.",
      "It is deflected towards the positive plate, so the particles carry negative charge.",
      "Electrons are about 1,800 times lighter than a hydrogen atom, so atoms are not indivisible.",
    ],
    takeaway:
      "Atoms contain electrons: tiny, negatively charged particles found in all matter. This led Thomson to his “plum pudding” model, with electrons scattered through a positive sphere.",
    formula: { expression: "e/m ≈ 1.76 × 10¹¹ C/kg", caption: "Thomson's charge-to-mass ratio for the electron, the same in every element." },
    visual: "cathode",
    tryIt: "Switch the electric and magnetic fields on and off to see which way the beam bends.",
  },
  {
    id: "canal-rays",
    category: "atomic",
    title: "Discovery of the Proton: Canal Rays",
    shortTitle: "Canal Rays (Protons)",
    icon: CircleDot,
    accent: "bg-rose-500/10 text-rose-600",
    level: "Class 9 · Atomic Structure · Eugen Goldstein, 1886",
    summary:
      "Eugen Goldstein used a discharge tube with holes drilled through the cathode. Behind the cathode he saw glowing rays travelling in the opposite direction to cathode rays. These “canal rays” turned out to be positively charged ions, and the lightest of them — from hydrogen — is the proton.",
    steps: [
      {
        title: "A perforated cathode",
        body: "The tube contains a little gas at low pressure. Electrons racing from the cathode knock electrons off gas atoms, leaving positive ions behind.",
      },
      {
        title: "Positive rays go the other way",
        body: "The positive ions are pulled towards the negative cathode. Some fly straight through its holes (the “canals”) and glow behind it — moving opposite to the electrons.",
      },
      {
        title: "Lighter ions bend more",
        body: "Electric and magnetic fields deflect canal rays, showing they are positive. The amount depends on the gas: hydrogen ions bend the most because they are the lightest. That hydrogen ion, H⁺, is a single proton.",
      },
    ],
    observations: [
      "Canal rays are deflected the opposite way to cathode rays, so they are positive.",
      "Unlike cathode rays, their charge-to-mass ratio depends on the gas in the tube.",
      "Hydrogen gives the lightest positive particle, about 1,836 times heavier than an electron.",
    ],
    takeaway:
      "Atoms also contain positive particles. The smallest, from hydrogen, is the proton — a name Rutherford gave it in 1920.",
    formula: { expression: "H → H⁺ + e⁻", caption: "Removing hydrogen's only electron leaves a bare proton." },
    visual: "canal",
    tryIt: "Choose hydrogen or helium, then apply the field to compare how far each ion beam bends.",
  },
  {
    id: "rutherford",
    category: "atomic",
    title: "Rutherford's Gold Foil Experiment",
    shortTitle: "Gold Foil Experiment (Nucleus)",
    icon: Atom,
    accent: "bg-amber-500/10 text-amber-600",
    level: "Class 9 · Atomic Structure",
    summary:
      "In 1909 Hans Geiger and Ernest Marsden, working under Ernest Rutherford, fired alpha particles at gold foil only a few hundred atoms thick. In 1911 Rutherford explained the surprising results: almost all of an atom's mass and positive charge is packed into a tiny nucleus at its centre, and the rest of the atom is mostly empty space.",
    steps: [
      {
        title: "Alpha particle beam",
        body: "A radioactive source fires a beam of positively charged alpha particles (helium nuclei, He²⁺) at an ultra-thin sheet of gold foil.",
      },
      {
        title: "Most pass straight through",
        body: "The vast majority — well over 99% — pass straight through without changing direction. An atom must therefore be mostly empty space.",
      },
      {
        title: "Rare sharp deflections",
        body: "A tiny fraction are deflected at large angles, and about 1 in 8,000 bounce almost straight back. Only a very small, dense, positively charged nucleus could repel them that strongly.",
      },
    ],
    observations: [
      "Undeflected particles show that most of the atom is empty space.",
      "Large deflections show the positive charge is concentrated, not spread out.",
      "Very few hits mean the nucleus is tiny compared with the whole atom.",
    ],
    takeaway:
      "The atom has a tiny, dense, positively charged nucleus with electrons around it. This nuclear model replaced Thomson's “plum pudding” model, in which positive charge was spread evenly through the atom.",
    visual: "rutherford",
    tryIt: "Fire a single particle or a continuous beam and watch the detector count where they land.",
  },
  {
    id: "chadwick",
    category: "atomic",
    title: "Discovery of the Neutron: Chadwick's Experiment",
    shortTitle: "Chadwick's Experiment (Neutrons)",
    icon: Orbit,
    accent: "bg-slate-500/10 text-slate-600",
    level: "Class 9 · Atomic Structure · James Chadwick, 1932",
    summary:
      "Alpha particles from polonium hitting a thin sheet of beryllium produced a strange, very penetrating radiation that no electric or magnetic field could bend. When it struck paraffin wax, it knocked protons out. James Chadwick showed it must be a neutral particle with almost the same mass as a proton: the neutron.",
    steps: [
      {
        title: "Alpha particles hit beryllium",
        body: "A polonium source emits alpha particles at a thin beryllium sheet. Beryllium nuclei absorb them and release a new kind of radiation.",
      },
      {
        title: "Neutral, penetrating radiation",
        body: "The radiation passes straight through electric and magnetic fields without bending, so it has no charge. It also passes through thick lead that stops alpha particles.",
      },
      {
        title: "Protons knocked out of paraffin",
        body: "Paraffin wax is rich in hydrogen. The radiation knocked protons out of it at high speed — only a particle with about the same mass as a proton could do that, so it could not be gamma rays.",
      },
    ],
    observations: [
      "The radiation is undeflected by fields, so the particles are neutral.",
      "Knocked-out protons are fast, so the incoming particles have a mass close to a proton's.",
      "Neutrons explained why atoms are heavier than their protons alone account for.",
    ],
    takeaway:
      "The nucleus contains neutrons as well as protons. A neutron has no charge and a mass of about 1 u, almost equal to a proton. Chadwick won the 1935 Nobel Prize in Physics for the discovery.",
    formula: { expression: "⁹Be + ⁴He → ¹²C + ¹n", caption: "A beryllium nucleus captures an alpha particle and releases a neutron." },
    visual: "chadwick",
    tryIt: "Fire an alpha burst, then switch on the field: the neutron beam stays straight while charged particles bend.",
  },
  {
    id: "bonding",
    category: "bonding-matter",
    title: "Covalent vs. Ionic Bonding",
    shortTitle: "Ionic vs. Covalent Bonding",
    icon: Link2,
    accent: "bg-violet-500/10 text-violet-600",
    level: "Class 9–10 · Chemical Bonding",
    summary:
      "Atoms bond to reach a stable, full outer shell of electrons, like the noble gases. They do it in two main ways: by transferring electrons (ionic bonding) or by sharing them (covalent bonding).",
    steps: [
      {
        title: "Valence electrons",
        body: "Only the electrons in the outermost shell take part in bonding. Sodium (2, 8, 1) has one valence electron; chlorine (2, 8, 7) has seven; hydrogen has one.",
      },
      {
        title: "Ionic bond — electron transfer",
        body: "A metal gives electrons to a non-metal. Sodium loses its one valence electron to chlorine, forming Na⁺ (2, 8) and Cl⁻ (2, 8, 8). The opposite charges attract strongly — that attraction is the ionic bond in NaCl.",
      },
      {
        title: "Covalent bond — electron sharing",
        body: "Non-metals share pairs of electrons instead. Two hydrogen atoms each contribute one electron to a shared pair, so both get a full shell (like helium). The same happens in Cl₂ and in the two O–H bonds of H₂O.",
      },
    ],
    observations: [
      "Ionic compounds form between metals and non-metals; covalent bonds form between non-metals.",
      "Ionic compounds form giant lattices with high melting points and conduct electricity when molten or dissolved.",
      "Simple covalent molecules usually have low melting points and do not conduct electricity.",
    ],
    takeaway:
      "Ionic bonding = electron transfer, giving oppositely charged ions held by electrostatic attraction. Covalent bonding = electron sharing, giving molecules held together by shared electron pairs.",
    visual: "bonding",
    tryIt: "Switch between Ionic and Covalent, then press Trigger Bond to see the electrons move.",
  },
  {
    id: "states",
    category: "bonding-matter",
    title: "States of Matter & Particle Motion",
    shortTitle: "States of Matter",
    icon: Thermometer,
    accent: "bg-sky-500/10 text-sky-600",
    level: "Class 9 · Matter",
    summary:
      "All matter is made of particles that are always moving. Temperature measures their average kinetic energy. As you heat a substance, its particles move faster and overcome more of the attractive forces between them — changing it from solid to liquid to gas.",
    steps: [
      {
        title: "Solid — fixed positions",
        body: "Particles are packed closely in a regular pattern. Strong forces hold them in place, so they can only vibrate. Solids have a fixed shape and a fixed volume.",
      },
      {
        title: "Liquid — sliding past each other",
        body: "Particles are still close together but have enough energy to slide past one another. Liquids have a fixed volume but take the shape of their container.",
      },
      {
        title: "Gas — rapid, random motion",
        body: "Particles are far apart and move quickly in all directions. Attractive forces are negligible, so a gas spreads out to fill its whole container.",
      },
    ],
    observations: [
      "Higher temperature means faster particles (more kinetic energy).",
      "Water melts at 0 °C and boils at 100 °C at normal atmospheric pressure.",
      "During melting or boiling, the temperature stays constant: the energy goes into overcoming the forces between particles.",
    ],
    takeaway:
      "The state of a substance depends on the balance between the kinetic energy of its particles and the attractive forces between them. Heating adds energy; cooling removes it.",
    visual: "states",
    tryIt: "Drag the temperature slider (modelled on water) or tap a preset to change the state.",
  },
  {
    id: "boyles-law",
    category: "gases-solutions",
    title: "Boyle's Law: Pressure and Volume",
    shortTitle: "Boyle's Law (Pressure & Volume)",
    icon: Gauge,
    accent: "bg-cyan-500/10 text-cyan-600",
    level: "Class 11 · Gases · Robert Boyle, 1662",
    summary:
      "For a fixed amount of gas at constant temperature, pressure and volume are inversely proportional: squeeze the gas into half the space and its pressure doubles. The particles are not moving faster — they simply hit the walls more often.",
    steps: [
      {
        title: "Gas pressure comes from collisions",
        body: "Gas particles move constantly and collide with the walls of their container. Every collision pushes on the wall; together these pushes are the gas pressure.",
      },
      {
        title: "Smaller volume, more collisions",
        body: "Pushing the piston in gives the particles less space. At the same speed they reach the walls sooner and hit them more often, so the pressure rises.",
      },
      {
        title: "P × V stays constant",
        body: "Halve the volume and the pressure doubles; double the volume and it halves. As long as the temperature and amount of gas don't change, P₁V₁ = P₂V₂.",
      },
    ],
    observations: [
      "Temperature is constant, so the particles keep the same average speed.",
      "A graph of P against V is a curve; P against 1/V is a straight line.",
      "This is why a syringe gets harder to push the more you compress the air inside.",
    ],
    takeaway: "At constant temperature, the pressure of a fixed amount of gas is inversely proportional to its volume.",
    formula: { expression: "P₁V₁ = P₂V₂", caption: "Pressure × volume is constant at fixed temperature and amount of gas." },
    visual: "boyle",
    tryIt: "Drag the piston or use the slider, and watch the pressure gauge and the collision rate.",
  },
  {
    id: "charles-law",
    category: "gases-solutions",
    title: "Charles's Law: Volume and Temperature",
    shortTitle: "Charles's Law (Volume & Temperature)",
    icon: Flame,
    accent: "bg-orange-500/10 text-orange-600",
    level: "Class 11 · Gases · Jacques Charles, 1787",
    summary:
      "At constant pressure, the volume of a fixed amount of gas is directly proportional to its absolute temperature in kelvin. Heat the gas and its particles move faster, push harder on the piston, and the gas expands until the pressure inside matches the pressure outside again.",
    steps: [
      {
        title: "Use the kelvin scale",
        body: "The law works with absolute temperature: K = °C + 273. At 0 K (absolute zero, −273 °C) an ideal gas would have zero volume, which is why Celsius won't do.",
      },
      {
        title: "Heating speeds the particles up",
        body: "Higher temperature means more kinetic energy. Faster particles hit the piston harder and more often, briefly raising the pressure inside.",
      },
      {
        title: "The piston rises until pressures balance",
        body: "The piston moves freely, so the gas expands until its pressure falls back to the outside pressure (1 atm). Doubling the kelvin temperature doubles the volume.",
      },
    ],
    observations: [
      "The pressure stays at 1 atm throughout, because the piston is free to move.",
      "A graph of V against T (in kelvin) is a straight line through the origin.",
      "A balloon shrinks in a freezer and expands again in a warm room.",
    ],
    takeaway: "At constant pressure, the volume of a fixed amount of gas is directly proportional to its absolute temperature.",
    formula: { expression: "V₁ / T₁ = V₂ / T₂", caption: "Temperatures must be in kelvin." },
    visual: "charles",
    tryIt: "Move the temperature from the cooling bath to the burner and watch the piston rise and fall.",
  },
  {
    id: "ph",
    category: "gases-solutions",
    title: "Acids, Bases & the pH Scale",
    shortTitle: "Acids, Bases & pH",
    icon: Droplets,
    accent: "bg-rose-500/10 text-rose-600",
    level: "Class 10 · Acids & Bases",
    summary:
      "The pH scale (0–14) measures how acidic or basic a solution is. It depends on the concentration of hydrogen ions (H⁺) compared with hydroxide ions (OH⁻): pH = −log[H⁺].",
    steps: [
      {
        title: "Acids — more H⁺",
        body: "Acids release hydrogen ions in water, so [H⁺] is greater than [OH⁻] and the pH is below 7. Lemon juice (pH ≈ 2) and stomach acid are acidic.",
      },
      {
        title: "Bases — more OH⁻",
        body: "Bases produce hydroxide ions in water, so [OH⁻] is greater than [H⁺] and the pH is above 7. Baking soda solution (pH ≈ 9) and bleach (pH ≈ 13) are basic.",
      },
      {
        title: "Neutralisation",
        body: "When an acid and a base react, H⁺ and OH⁻ combine to form water: H⁺ + OH⁻ → H₂O. Acid + base → salt + water, and the pH moves towards 7.",
      },
    ],
    observations: [
      "Each step of 1 on the pH scale is a 10× change in H⁺ concentration — pH 3 is ten times more acidic than pH 4.",
      "Pure water is neutral (pH 7 at 25 °C) because it contains equal amounts of H⁺ and OH⁻.",
      "Universal indicator turns red in strong acids, green when neutral and purple in strong bases.",
    ],
    takeaway:
      "pH tells you the balance of H⁺ and OH⁻ ions: below 7 is acidic, 7 is neutral and above 7 is basic. Neutralisation combines them into water.",
    formula: { expression: "pH = −log₁₀[H⁺]", caption: "Each pH unit is a tenfold change in hydrogen-ion concentration." },
    visual: "ph",
    tryIt: "Slide the pH or pick a household substance to see the indicator colour and ion balance change.",
  },
]

/** Topics linked from the Overview's quick-start list */
export const POPULAR_CONCEPT_IDS = ["rutherford", "boyles-law", "ph"]

export function findConcept(id: string | null | undefined): Concept | undefined {
  return id ? conceptsData.find((c) => c.id === id) : undefined
}
