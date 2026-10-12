"use client"

import { useMemo, useState } from "react"
import { digestFragments, dnaLength, restrictionSites } from "@/lib/sequence"
import type { SequenceRecord } from "@/lib/types"


function cutBoundaryLabel(cut: number | null, length: number, circular: boolean) {
  if (cut === null) return "outside"
  if (!length) return "—"
  if (circular) {
    const boundary = ((cut % length) + length) % length
    return boundary === 0 ? `${length}|1` : `${boundary}|${boundary + 1}`
  }
  if (cut <= 0) return "0|1"
  if (cut >= length) return `${length}|end`
  return `${cut}|${cut + 1}`
}

export default function RestrictionPanel({ record }: { record: SequenceRecord }) {
  const sites = useMemo(() => restrictionSites(record.sequence, record.topology === "Circular"), [record.sequence, record.topology])
  const [selected, setSelected] = useState<string[]>([])
  const [uniqueOnly, setUniqueOnly] = useState(false)
  const [query, setQuery] = useState("")

  const visibleSites = sites.filter(site => (!uniqueOnly || site.matches.length === 1) && (!query.trim() || `${site.name} ${site.motif}`.toLowerCase().includes(query.trim().toLowerCase())))
  const selectedSites = sites.filter(site => selected.includes(site.name))
  const cuts = selectedSites.flatMap(site => site.matches.map(match => match.cutTop).filter((value): value is number => value !== null))
  const fragments = digestFragments(dnaLength(record.sequence), cuts, record.topology === "Circular")
  const methylationContexts = selectedSites.flatMap(site => site.matches.flatMap(match => match.methylationContext.map(context => `${site.name} site at ${match.position + 1} overlaps ${context}`)))

  return <div className="analysisPanelBody restrictionWorkbench">
    <div className="analysisIntro restrictionIntro">
      <div><strong>Restriction digest & virtual gel</strong><span>Recognition positions and cleavage coordinates are reported separately. Type IIS enzymes are supported, including BsaI, BsmBI, BbsI and SapI.</span></div>
      <div className="restrictionFilters"><label><input type="checkbox" checked={uniqueOnly} onChange={event => setUniqueOnly(event.target.checked)}/> Unique cutters only</label><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Filter enzyme…"/></div>
    </div>

    <div className="restrictionTable restrictionTableV2">
      <div className="restrictionHead"><span>Use</span><span>Enzyme</span><span>Class</span><span>Recognition</span><span>Recognition site(s)</span><span>Cleavage (top / bottom)</span><span>Count</span></div>
      {visibleSites.map(site => <label className="restrictionRow" key={site.name}>
        <input type="checkbox" checked={selected.includes(site.name)} onChange={event => setSelected(event.target.checked ? [...selected, site.name] : selected.filter(name => name !== site.name))}/>
        <strong>{site.name}</strong>
        <span>{site.typeIIS ? "Type IIS" : "Type II"}</span>
        <code>{site.motif}{site.typeIIS ? ` (${site.cutForward - site.motif.length}/${site.cutReverse - site.motif.length})` : ""}</code>
        <span className="restrictionPositions">{site.matches.map(match => `${match.position + 1}${match.strand === -1 ? " (−)" : " (+)"}`).join(", ")}</span>
        <span className="restrictionPositions">{site.matches.map(match => `${cutBoundaryLabel(match.cutTop, dnaLength(record.sequence), record.topology === "Circular")} / ${cutBoundaryLabel(match.cutBottom, dnaLength(record.sequence), record.topology === "Circular")}`).join(", ")}</span>
        <b>{site.matches.length}</b>
      </label>)}
      {!visibleSites.length && <div className="analysisEmpty">No enzymes in the current built-in cloning set match this filter.</div>}
    </div>

    <div className="restrictionFootnote">Cleavage is shown as a phosphodiester-bond boundary (for example 396|397), with top-strand and bottom-strand boundaries reported separately. For non-palindromic Type IIS sites, strand orientation changes where cleavage falls relative to the recognition sequence.</div>

    {methylationContexts.length > 0 && <div className="restrictionWarning"><strong>Methylation context warning</strong><span>{methylationContexts.slice(0, 6).join(" · ")}. An overlapping Dam/Dcm motif does not prove that cleavage is blocked; sensitivity is enzyme-specific, so verify the enzyme manufacturer’s methylation guidance.</span></div>}

    {selectedSites.some(site => site.methylationNote) && <div className="restrictionWarning"><strong>Enzyme-specific note</strong><span>{selectedSites.map(site => site.methylationNote).filter(Boolean).join(" ")}</span></div>}

    <div className="digestWorkspace">
      <div className="digestSummary"><strong>{selected.length ? `Digest: ${selected.join(" + ")}` : "Select enzymes to simulate a digest"}</strong>{selected.length > 0 && <><span>{cuts.length} physical cut position{cuts.length === 1 ? "" : "s"} · {fragments.length} predicted fragment{fragments.length === 1 ? "" : "s"}</span><div className="fragmentChips">{fragments.map((length, index) => <span key={`${length}-${index}`}>{length.toLocaleString()} bp</span>)}</div></>}</div>
      <VirtualGel fragments={selected.length ? fragments : []}/>
    </div>
  </div>
}

function VirtualGel({ fragments }: { fragments: number[] }) {
  const ladder = [10000, 8000, 6000, 5000, 4000, 3000, 2000, 1500, 1000, 750, 500, 250, 100]
  const max = 10000
  const min = 100
  const y = (bp: number) => {
    const value = Math.max(min, Math.min(max, bp))
    const fraction = (Math.log10(max) - Math.log10(value)) / (Math.log10(max) - Math.log10(min))
    return 22 + fraction * 236
  }
  return <div className="virtualGelCard">
    <div className="virtualGelHeader"><strong>Virtual agarose gel</strong><span>Approximate log migration · visualization only</span></div>
    <svg viewBox="0 0 340 285" className="virtualGel" role="img" aria-label="Simulated agarose gel">
      <rect x="44" y="10" width="272" height="260" rx="12" className="gelBackground"/>
      <text x="82" y="280" textAnchor="middle">Ladder</text><text x="220" y="280" textAnchor="middle">Digest</text>
      {ladder.map(bp => <g key={bp}><line x1="58" y1={y(bp)} x2="108" y2={y(bp)} className="gelBand ladderBand"/><text x="38" y={y(bp)+3} textAnchor="end" className="gelLabel">{bp >= 1000 ? `${bp/1000}k` : bp}</text></g>)}
      {fragments.map((bp, index) => <g key={`${bp}-${index}`}><line x1="175" y1={y(bp)} x2="265" y2={y(bp)} className="gelBand sampleBand"/><text x="274" y={y(bp)+3} className="gelLabel">{bp.toLocaleString()} bp</text></g>)}
      {!fragments.length && <text x="220" y="140" textAnchor="middle" className="gelEmpty">Select enzyme(s)</text>}
    </svg>
  </div>
}
