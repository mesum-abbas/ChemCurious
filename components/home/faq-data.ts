// Home page FAQ — single source for the accordion UI and the FAQPage structured data.
// Keep answers factual to what the app actually does.

export type FaqItem = { q: string; a: string }

export const FAQ_ITEMS: FaqItem[] = [
  {
    q: "What is ChemCurious and how does it work?",
    a: "ChemCurious is a browser-based chemistry lab for students in Classes 9–12. Pick a module — the 3D Molecular Viewer, the Interactive Periodic Table, the Reaction Simulator or chapter quizzes — and start exploring. Everything runs in your browser, so there is nothing to install, and ChemBot, the built-in AI tutor, is one tap away if you get stuck.",
  },
  {
    q: "Can I rotate, zoom, and inspect molecules in full 3D space?",
    a: "Yes. Search any compound by name or formula (for example caffeine, H₂O or C₆H₁₂O₆) and its 3D structure is loaded from the PubChem database. Drag to rotate, scroll or pinch to zoom, switch between ball-and-stick, spacefill, stick and wireframe styles, add an electron-cloud surface, and tap any atom to see its element and coordinates.",
  },
  {
    q: "How interactive is the Periodic Table?",
    a: "Every one of the 118 elements is clickable. You get its atomic number, atomic mass, group, period, category and electron configuration, plus an animated shell model showing how its electrons are arranged. You can also search by name or symbol and filter by category such as alkali metals or noble gases.",
  },
  {
    q: "Can I simulate real-time chemical reactions safely?",
    a: "Completely safely — the Reaction Simulator is virtual. Choose an organic or inorganic reaction, inspect each reactant in 3D, then press Simulate to watch the products form. It is a risk-free way to revise reactions you would never try at home.",
  },
  {
    q: "Are there quizzes and self-assessments to test my understanding?",
    a: "Yes. Quizzes are organised by class (9 to 12) and chapter. Each answer is checked instantly with an explanation, and your scores are saved to your personal dashboard so you can see how you are improving over time.",
  },
  {
    q: "Is ChemCurious suitable for both students and educators?",
    a: "Yes. Students learn at their own pace, and teachers can use the 3D viewer and reaction simulator live in class. Teachers and staff can also request a staff account — once an administrator approves it, they can add and edit quiz questions, reactions and molecules.",
  },
  {
    q: "Can I access ChemCurious on mobile and tablet devices?",
    a: "Yes. ChemCurious works in any modern browser on phones, tablets and laptops, and every page adapts to your screen size. On touch screens, tap a 3D model to start rotating it so the page still scrolls normally.",
  },
  {
    q: "Do I need an account to use ChemCurious?",
    a: "No account is needed for the 3D Molecular Viewer, the Periodic Table or the Reaction Simulator. Create a free student account when you want to take quizzes and track your progress on the dashboard.",
  },
]
