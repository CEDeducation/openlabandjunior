"use client"

import { useMemo, useState } from "react"
import { findOrfs } from "@/lib/sequence"
import type { SequenceRecord } from "@/lib/types"

export default function OrfPanel({ record }: { record: SequenceRecord }) {
  const [minAa, setMinAa] = useState(75)
  const table = record.translationTable || 11
  const orfs = useMemo(() => findOrfs(record.sequence, minAa, table), [record.sequence, minAa, table])
  return <div className="analysisPanelBody">
    <div className="analysisIntro"><strong>Open reading frames</strong><span>Scan both strands using genetic-code table {table}; table 11 includes recognized bacterial alternative initiation codons and translates an accepted initiation codon as Met.</span></div>
    <label className="inlineControl"><span>Minimum length</span><input type="number" min="10" max="1000" value={minAa} onChange={event => setMinAa(Number(event.target.value))}/><b>aa</b></label>
    <div className="orfList">{orfs.slice(0, 100).map(orf => <div className="orfRow" key={orf.id}><div><strong>{orf.start + 1}–{orf.end + 1}</strong><span>{orf.strand === 1 ? "+" : "−"} strand · frame {orf.frame}</span></div><b>{Math.floor(orf.lengthBp / 3)} aa</b><code>{orf.protein.slice(0, 48)}{orf.protein.length > 48 ? "…" : ""}</code></div>)}{!orfs.length && <div className="analysisEmpty">No ORFs meet this length threshold.</div>}</div>
  </div>
}
