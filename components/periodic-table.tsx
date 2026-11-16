"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { AtomicViewer } from "@/components/atomic-viewer"
import { Search, Filter } from "lucide-react"
import { ELEMENT_CATEGORY_COLORS } from "@/lib/element-categories"
import { allElements, type Element } from "@/lib/elements-data"

const categoryColors = ELEMENT_CATEGORY_COLORS

interface ElementCellProps {
  element: Element
  isSelected: boolean
  onClick: () => void
}

function ElementCell({ element, isSelected, onClick }: ElementCellProps) {
  const categoryColor = categoryColors[element.category] || "bg-gray-500"

  return (
    <button
      onClick={onClick}
      className={`
        w-full aspect-square sm:aspect-auto sm:w-12 sm:h-12 border rounded-[3px] sm:rounded cursor-pointer overflow-hidden
        transition-all duration-200 transform
        ${
          isSelected
            ? "relative z-20 ring-2 ring-emerald-600 ring-offset-1 sm:scale-105 shadow-xl font-black"
            : "relative z-0 hover:z-10 hover:scale-103 shadow-sm"
        }
        ${categoryColor} text-white font-bold
        flex flex-col items-center justify-center text-center
        group
      `}
      title={element.name}
    >
      <div className="hidden sm:block text-[8px] absolute top-0.5 left-0.5 font-semibold">{element.atomicNumber}</div>
      <div className="text-[9px] leading-none min-[400px]:text-[10px] sm:text-sm font-black">{element.symbol}</div>
      <div className="hidden sm:block text-[7px] absolute bottom-0.5 leading-tight opacity-90">{element.atomicMass}</div>
    </button>
  )
}

export function PeriodicTable() {
  const [selectedElement, setSelectedElement] = useState<Element | null>(null)
  const [isAtomicViewerOpen, setIsAtomicViewerOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState<string>("all")

  const handleElementClick = (element: Element) => {
    setSelectedElement(element)
    setIsAtomicViewerOpen(true)
  }

  const filteredElements = allElements.filter((element) => {
    const matchesSearch =
      element.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      element.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      element.atomicNumber.toString().includes(searchTerm)
    const matchesCategory = filterCategory === "all" || element.category === filterCategory

    return matchesSearch && matchesCategory
  })

  const categories = Array.from(new Set(allElements.map((e) => e.category))).sort()

  // Separate lanthanides and actinides
  const mainTableElements = filteredElements.filter((e) => e.category !== "Lanthanide" && e.category !== "Actinide")
  const lanthanides = filteredElements
    .filter((e) => e.category === "Lanthanide")
    .sort((a, b) => a.atomicNumber - b.atomicNumber)
  const actinides = filteredElements
    .filter((e) => e.category === "Actinide")
    .sort((a, b) => a.atomicNumber - b.atomicNumber)

  // Helper function to get element by group and period
  const getElementByPosition = (group: number, period: number) => {
    return mainTableElements.find((e) => e.group === group && e.period === period)
  }

  return (
    <div className="w-full space-y-3">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search element..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-sm py-1 h-8"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="h-8 flex-1 rounded-md border border-input bg-card px-2 py-1 text-xs text-foreground outline-none transition-[color,box-shadow] focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/20 sm:flex-none"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        {/* Periodic Table Grid */}
        <div className="min-w-0 lg:col-span-3">
          <Card className="p-3">
            <CardHeader className="pb-2">
              <CardTitle className="font-serif text-lg">Periodic Table of Elements</CardTitle>
              <CardDescription className="text-xs">
                Organized by periods (rows) and groups (columns)
                <span className="sm:hidden"> · Tap an element for details</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="pb-2">
                {/* Main Periodic Table */}
                <div className="w-full overflow-x-auto">
                  {/* Group Labels */}
                  <div className="grid gap-px sm:gap-0.5 mb-1 grid-cols-[repeat(18,minmax(0,1fr))] sm:grid-cols-[repeat(18,minmax(35px,1fr))]">
                    {Array.from({ length: 18 }, (_, i) => i + 1).map((group) => (
                      <div
                        key={`group-${group}`}
                        className="text-center text-[7px] sm:text-[9px] font-semibold text-muted-foreground"
                      >
                        {group}
                      </div>
                    ))}
                  </div>

                  {/* Periodic Table Rows */}
                  {Array.from({ length: 7 }, (_, i) => i + 1).map((period) => (
                    <div
                      key={`period-${period}`}
                      className="grid gap-px sm:gap-0.5 mb-px sm:mb-1 items-start grid-cols-[repeat(18,minmax(0,1fr))] sm:grid-cols-[repeat(18,minmax(35px,1fr))]"
                    >
                      {Array.from({ length: 18 }, (_, i) => i + 1).map((group) => {
                        const element = getElementByPosition(group, period)
                        const isSelected = Boolean(element && selectedElement?.atomicNumber === element.atomicNumber)
                        return (
                          <div key={`${group}-${period}`} className={`relative ${isSelected ? "z-20" : "z-0"}`}>
                            {element ? (
                              <ElementCell
                                element={element}
                                isSelected={isSelected}
                                onClick={() => handleElementClick(element)}
                              />
                            ) : (
                              <div className="w-full aspect-square sm:aspect-auto sm:h-12 rounded-[3px] sm:rounded bg-muted/10 border border-dashed border-muted"></div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ))}

                  {/* Lanthanides Row */}
                  {lanthanides.length > 0 && (
                    <div className="mt-2 pt-2 border-t">
                      <div className="text-[9px] font-semibold text-muted-foreground mb-1">Lanthanides</div>
                      <div
                        className="grid gap-px sm:gap-0.5 grid-cols-[repeat(15,minmax(0,1fr))] sm:grid-cols-[repeat(auto-fit,minmax(35px,1fr))]"
                      >
                        {lanthanides.map((element) => {
                          const isSelected = selectedElement?.atomicNumber === element.atomicNumber
                          return (
                            <div key={element.atomicNumber} className={`relative ${isSelected ? "z-20" : "z-0"}`}>
                              <ElementCell
                                element={element}
                                isSelected={isSelected}
                                onClick={() => handleElementClick(element)}
                              />
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Actinides Row */}
                  {actinides.length > 0 && (
                    <div className="mt-2 pt-2 border-t">
                      <div className="text-[9px] font-semibold text-muted-foreground mb-1">Actinides</div>
                      <div
                        className="grid gap-px sm:gap-0.5 grid-cols-[repeat(15,minmax(0,1fr))] sm:grid-cols-[repeat(auto-fit,minmax(35px,1fr))]"
                      >
                        {actinides.map((element) => {
                          const isSelected = selectedElement?.atomicNumber === element.atomicNumber
                          return (
                            <div key={element.atomicNumber} className={`relative ${isSelected ? "z-20" : "z-0"}`}>
                              <ElementCell
                                element={element}
                                isSelected={isSelected}
                                onClick={() => handleElementClick(element)}
                              />
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Element Details Panel */}
        <div className="min-w-0 lg:col-span-2 space-y-3">
          {selectedElement ? (
            <Card className="p-3">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <CardTitle className="font-serif text-base">{selectedElement.name}</CardTitle>
                    <CardDescription className="text-sm font-semibold">{selectedElement.symbol}</CardDescription>
                  </div>
                  <div
                    className={`w-12 h-12 rounded flex items-center justify-center text-white font-black text-lg flex-shrink-0 ${
                      categoryColors[selectedElement.category]?.split(" ")[0]
                    }`}
                  >
                    {selectedElement.symbol}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 p-0">
                <p className="text-xs text-muted-foreground italic">{selectedElement.summary}</p>

                <div className="space-y-1">
                  <h4 className="font-semibold text-xs">Basic Info</h4>
                  <div className="grid grid-cols-2 gap-1 text-[10px]">
                    <div className="bg-muted p-1 rounded">
                      <div className="text-muted-foreground">Atomic #</div>
                      <div className="font-bold">{selectedElement.atomicNumber}</div>
                    </div>
                    <div className="bg-muted p-1 rounded">
                      <div className="text-muted-foreground">Mass</div>
                      <div className="font-bold">{selectedElement.atomicMass}</div>
                    </div>
                    <div className="bg-muted p-1 rounded">
                      <div className="text-muted-foreground">Group</div>
                      <div className="font-bold">{selectedElement.group}</div>
                    </div>
                    <div className="bg-muted p-1 rounded">
                      <div className="text-muted-foreground">Period</div>
                      <div className="font-bold">{selectedElement.period}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="font-semibold text-xs">Category</h4>
                  <Badge className="w-full justify-center py-0 text-[10px]">
                    {selectedElement.category.toUpperCase()}
                  </Badge>
                </div>

                <div className="space-y-1">
                  <h4 className="font-semibold text-xs">Electron Config</h4>
                  <code className="text-[9px] bg-muted px-1 py-0.5 rounded block break-words">
                    {selectedElement.electronConfiguration}
                  </code>
                </div>

                <div className="space-y-1">
                  <h4 className="font-semibold text-xs">Phase at STP</h4>
                  <div className="text-xs text-muted-foreground">{selectedElement.phaseAtSTP}</div>
                </div>

                <div className="space-y-1">
                  <h4 className="font-semibold text-xs">Discovery</h4>
                  <div className="text-xs text-muted-foreground">
                    {selectedElement.discoveredBy} ({selectedElement.discoveryYear})
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="font-semibold text-xs">Source</h4>
                  <div className="text-xs text-muted-foreground">{selectedElement.source}</div>
                </div>

                <div className="space-y-1">
                  <h4 className="font-semibold text-xs">Melting Point</h4>
                  <div className="text-xs text-muted-foreground">
                    {selectedElement.meltingPointC !== null ? `${selectedElement.meltingPointC}°C` : "N/A"}
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="font-semibold text-xs">Boiling Point</h4>
                  <div className="text-xs text-muted-foreground">
                    {selectedElement.boilingPointC !== null ? `${selectedElement.boilingPointC}°C` : "N/A"}
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="font-semibold text-xs">Density</h4>
                  <div className="text-xs text-muted-foreground">
                    {selectedElement.density !== null ? `${selectedElement.density} g/cm³` : "N/A"}
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="font-semibold text-xs">Electronegativity</h4>
                  <div className="text-xs text-muted-foreground">
                    {selectedElement.electronegativity !== null ? `${selectedElement.electronegativity}` : "N/A"}
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="font-semibold text-xs">Ionization Energy</h4>
                  <div className="text-xs text-muted-foreground">
                    {selectedElement.ionizationEnergy !== null ? `${selectedElement.ionizationEnergy} kJ/mol` : "N/A"}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="p-3">
              <CardHeader className="pb-2">
                <CardTitle className="font-serif text-lg">Select an Element</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground">
                Click on any element in the periodic table to view details.
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={isAtomicViewerOpen} onOpenChange={setIsAtomicViewerOpen}>
        <DialogContent className="grid-cols-1 max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-[calc(100%-1.5rem)] overflow-y-auto overflow-x-hidden p-4 sm:max-w-2xl sm:p-6 lg:max-w-3xl">
          {selectedElement && (
            <>
              <DialogHeader className="min-w-0 pr-8 text-left">
                <div className="flex items-center gap-3 sm:items-start sm:gap-4">
                  <div
                    className={`flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl text-xl font-black text-white shadow-sm ${
                      categoryColors[selectedElement.category]?.split(" ")[0]
                    }`}
                  >
                    {selectedElement.symbol}
                  </div>
                  <div className="min-w-0">
                    <DialogTitle className="font-serif text-xl sm:text-2xl">
                      {selectedElement.name}
                    </DialogTitle>
                    <DialogDescription className="mt-1">
                      Atomic number {selectedElement.atomicNumber} · Atomic mass {selectedElement.atomicMass} u
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="min-w-0 rounded-2xl border border-slate-200/80 bg-slate-50 p-3 sm:p-5">
                <AtomicViewer
                  elementName={selectedElement.name}
                  symbol={selectedElement.symbol}
                  atomicNumber={selectedElement.atomicNumber}
                  electronConfiguration={selectedElement.electronConfiguration}
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
