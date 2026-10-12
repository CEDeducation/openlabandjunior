"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import type { ChangeEvent } from "react"
import { makeId } from "@/lib/id"
import { storage } from "@/lib/storage"
import type {
  ChemistryActivity,
  ChemistryCompound,
  ChemistryPrediction,
  ChemistryPredictionKind,
  ChemistryReaction,
  ChemistryReactionComponent,
  ChemistryReactionRole,
  RegistryEntity,
  WorkspaceState,
} from "@/lib/types"
import {
  compoundsToCsv,
  compoundsToSdf,
  computeReactionMassMg,
  computeVolumeUl,
  computeYieldPercent,
  defaultScreeningRules,
  descriptorSummary,
  downloadText,
  inferStructureFile,
  screenCompound,
  tanimotoBytes,
  type ImportedStructure,
  type ScreeningRules,
} from "@/lib/chemistry"
import { analyzeWithRDKit, fingerprintWithRDKit, rdkitVersion, substructureMatchWithRDKit, type RDKitAnalysis } from "@/lib/rdkit"
import { BookIcon, ChemistryIcon, DatabaseIcon, DownloadIcon, RegistryIcon, SearchIcon, SparkIcon, UploadIcon } from "./Icons"
import Molecule2D from "./chemistry/Molecule2D"
import Molecule3DViewer from "./chemistry/Molecule3DViewer"

type ChemTab = "library" | "structure" | "search" | "sar" | "screening" | "reactions" | "viewer3d" | "admet" | "data"
type ViewerFormat = "pdb" | "sdf" | "mol2" | "xyz" | "cif" | "mol"
type ViewerStyle = "stick" | "sphere" | "line" | "cartoon"

type SimilarityHit = { compound: ChemistryCompound; score: number }
type SubstructureHit = { compound: ChemistryCompound; svg: string }

const tabs: { id: ChemTab; label: string; description: string }[] = [
  { id: "library", label: "Compound library", description: "Registered structures and identifiers" },
  { id: "structure", label: "Structure Lab", description: "SMILES / MOL / SDF + RDKit" },
  { id: "search", label: "Structure search", description: "Similarity and SMARTS" },
  { id: "sar", label: "SAR", description: "Activity data and property plots" },
  { id: "screening", label: "Screening", description: "Property and rule-of-five alerts" },
  { id: "reactions", label: "Reactions", description: "Stoichiometry, yield and procedure" },
  { id: "viewer3d", label: "3D & poses", description: "PDB / SDF / MOL2 / XYZ / CIF" },
  { id: "admet", label: "ADMET & predictions", description: "Measured vs predicted provenance" },
  { id: "data", label: "Data tools", description: "Bulk import, export and deduplication" },
]

const structurePresets = [
  { name: "Aspirin", smiles: "CC(=O)OC1=CC=CC=C1C(=O)O" },
  { name: "Caffeine", smiles: "Cn1c(=O)c2c(ncn2C)n(C)c1=O" },
  { name: "Acetaminophen", smiles: "CC(=O)NC1=CC=C(O)C=C1" },
  { name: "Ibuprofen", smiles: "CC(C)CC1=CC=C(C=C1)C(C)C(=O)O" },
]

function now() { return new Date().toISOString() }
function numberOrNull(value: string) { const parsed = Number(value); return value.trim() === "" || !Number.isFinite(parsed) ? null : parsed }
function formatNumber(value: number | null | undefined, digits = 2) { return value === null || value === undefined || !Number.isFinite(value) ? "—" : Number(value).toFixed(digits) }
function structureInput(compound: ChemistryCompound) { return compound.canonicalSmiles || compound.smiles || compound.molblock || compound.structureInput }

function blankCompound(name = "Untitled compound"): ChemistryCompound {
  return {
    id: makeId("compound"), name, projectId: null, sourceFormat: "Manual", structureInput: "", smiles: "", canonicalSmiles: "", inchi: "", inchiKey: "", formula: "", molblock: "", descriptors: {}, tags: [], series: "", notes: "", externalIds: {}, createdAt: now(), updatedAt: now(),
  }
}

function compoundFromAnalysis(name: string, input: string, sourceFormat: ChemistryCompound["sourceFormat"], analysis: RDKitAnalysis): ChemistryCompound {
  const timestamp = now()
  return {
    id: makeId("compound"), name: name || "Untitled compound", projectId: null, sourceFormat, structureInput: input,
    smiles: analysis.canonicalSmiles, canonicalSmiles: analysis.canonicalSmiles, cxsmiles: analysis.cxsmiles,
    inchi: analysis.inchi, inchiKey: analysis.inchiKey, formula: analysis.formula, molblock: analysis.molblock,
    descriptors: analysis.descriptors, tags: [], series: "", notes: "", externalIds: {}, createdAt: timestamp, updatedAt: timestamp,
  }
}

function updateCompoundFromAnalysis(compound: ChemistryCompound, input: string, analysis: RDKitAnalysis): ChemistryCompound {
  return {
    ...compound, structureInput: input, smiles: analysis.canonicalSmiles, canonicalSmiles: analysis.canonicalSmiles, cxsmiles: analysis.cxsmiles,
    inchi: analysis.inchi, inchiKey: analysis.inchiKey, formula: analysis.formula || compound.formula, molblock: analysis.molblock,
    descriptors: analysis.descriptors, updatedAt: now(),
  }
}

function freshActivity(compoundId: string): ChemistryActivity {
  const timestamp = now()
  return { id: makeId("activity"), compoundId, projectId: null, target: "", assay: "", endpoint: "IC50", qualifier: "=", value: null, unit: "nM", source: "", notes: "", createdAt: timestamp, updatedAt: timestamp }
}

function freshReaction(): ChemistryReaction {
  const timestamp = now()
  return { id: makeId("reaction"), name: "Untitled reaction", projectId: null, reactionSmiles: "", components: [], solvent: "", temperatureC: null, timeHours: null, limitingMmol: null, theoreticalYieldMg: null, actualYieldMg: null, yieldPercent: null, procedure: "", purification: "", analytics: "", createdAt: timestamp, updatedAt: timestamp }
}

function freshReactionComponent(role: ChemistryReactionRole): ChemistryReactionComponent {
  return { id: makeId("rxn_component"), name: "", smiles: "", role, equivalents: role === "Reactant" ? 1 : null, amountMmol: null, molecularWeight: null, density: null, massMg: null, volumeUl: null }
}

function freshPrediction(compoundId: string): ChemistryPrediction {
  return { id: makeId("prediction"), compoundId, property: "", value: "", unit: "", method: "", version: "", provenance: "", applicabilityDomain: "", uncertainty: "", kind: "Predicted", createdAt: now() }
}

function CompoundDepiction({ compound, compact = false }: { compound: ChemistryCompound; compact?: boolean }) {
  const [svg, setSvg] = useState("")
  useEffect(() => {
    let alive = true
    const input = structureInput(compound)
    if (!input) { setSvg(""); return }
    analyzeWithRDKit(input).then(result => { if (alive) setSvg(result.svg) }).catch(() => { if (alive) setSvg("") })
    return () => { alive = false }
  }, [compound.id, compound.updatedAt])
  return <Molecule2D svg={svg} alt={`${compound.name} 2D structure`} compact={compact}/>
}

function DescriptorGrid({ compound }: { compound: ChemistryCompound }) {
  const d = descriptorSummary(compound.descriptors)
  const rows: [string, string, string][] = [
    ["Molecular weight", d.mw === null ? "—" : `${d.mw.toFixed(2)} g/mol`, "RDKit molecular weight descriptor."],
    ["Monoisotopic mass", d.exactMw === null ? "—" : `${d.exactMw.toFixed(4)} Da`, "RDKit monoisotopic/exact molecular mass; use this terminology when comparing with high-resolution mass spectrometry."],
    ["Crippen logP (RDKit)", formatNumber(d.logP, 2), "RDKit MolLogP using the Wildman–Crippen atom-contribution model; this is not BioByte/Daylight ClogP."],
    ["TPSA (RDKit)", d.tpsa === null ? "—" : `${d.tpsa.toFixed(1)} Å²`, "RDKit topological polar surface area. The default implementation uses N/O polar surface contributions."],
    ["H-bond donors (RDKit)", formatNumber(d.hbd, 0), "Toolkit-defined hydrogen-bond donor count. Definitions can differ between software and medicinal-chemistry rule sets."],
    ["H-bond acceptors (RDKit)", formatNumber(d.hba, 0), "Toolkit-defined hydrogen-bond acceptor count. Definitions can differ between software and medicinal-chemistry rule sets."],
    ["Rotatable bonds", formatNumber(d.rotatable, 0), "RDKit rotatable-bond descriptor."],
    ["Rings", formatNumber(d.rings, 0), "RDKit ring count."],
    ["Aromatic rings", formatNumber(d.aromaticRings, 0), "RDKit aromatic ring count."],
    ["Fraction Csp3", formatNumber(d.fractionCsp3, 2), "Fraction of carbon atoms assigned sp3 hybridization by RDKit."],
  ]
  return <div className="chemDescriptorGrid">{rows.map(([label, value, help]) => <div key={label} title={help}><span>{label} <i className="chemInfoDot" aria-hidden="true">i</i></span><strong>{value}</strong></div>)}</div>
}

function CopyableReadout({ label, value, wide = false, onCopied }: { label: string; value: string; wide?: boolean; onCopied: (label: string) => void }) {
  const text = value || ""
  async function copy() {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      onCopied(label)
    } catch {
      const textarea = document.createElement("textarea")
      textarea.value = text
      textarea.style.position = "fixed"
      textarea.style.opacity = "0"
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      textarea.remove()
      onCopied(label)
    }
  }
  return <div className={`chemReadout ${wide ? "wide" : ""}`}>
    <div className="chemReadoutHead"><span>{label}</span><button type="button" onClick={copy} disabled={!text} title={`Copy ${label}`}>Copy</button></div>
    <code>{text || "—"}</code>
  </div>
}

function ChemistryLibrary({ state, activeCompoundId, setActiveCompoundId, setTab }: { state: WorkspaceState; activeCompoundId: string; setActiveCompoundId: (id: string) => void; setTab: (tab: ChemTab) => void }) {
  const compound = state.chemistryCompounds.find(item => item.id === activeCompoundId) || null
  const [query, setQuery] = useState("")
  const [analysisMessage, setAnalysisMessage] = useState("")
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return state.chemistryCompounds
    return state.chemistryCompounds.filter(item => `${item.name} ${item.formula} ${item.canonicalSmiles} ${item.inchiKey} ${item.series} ${item.tags.join(" ")}`.toLowerCase().includes(q))
  }, [state.chemistryCompounds, query])

  function save(next: ChemistryCompound) { storage.saveChemistryCompound({ ...next, updatedAt: now() }) }

  async function normalize() {
    if (!compound) return
    const input = structureInput(compound)
    if (!input) { setAnalysisMessage("Add a SMILES or MOL structure first."); return }
    setAnalysisMessage("Analyzing with RDKit…")
    try {
      const result = await analyzeWithRDKit(input)
      const duplicate = state.chemistryCompounds.find(item => item.id !== compound.id && result.inchiKey && item.inchiKey === result.inchiKey)
      save(updateCompoundFromAnalysis(compound, input, result))
      setAnalysisMessage(duplicate ? `RDKit complete. Duplicate structure also exists as “${duplicate.name}”.` : "RDKit complete. Identifiers and descriptors refreshed.")
    } catch (error) { setAnalysisMessage(error instanceof Error ? error.message : "RDKit analysis failed.") }
  }

  function registerEntity() {
    if (!compound) return
    const existing = state.registry.find(item => item.metadata?.chemistryCompoundId === compound.id)
    const timestamp = now()
    const entity: RegistryEntity = existing ? {
      ...existing, name: compound.name, description: compound.notes, aliases: existing.aliases, metadata: { ...existing.metadata, chemistryCompoundId: compound.id, formula: compound.formula, inchiKey: compound.inchiKey, smiles: compound.canonicalSmiles }, updatedAt: timestamp,
    } : {
      id: makeId("entity"), name: compound.name, type: "Compound", schema: "Small molecule", description: compound.notes, aliases: [], metadata: { chemistryCompoundId: compound.id, formula: compound.formula, inchiKey: compound.inchiKey, smiles: compound.canonicalSmiles }, createdAt: timestamp, updatedAt: timestamp,
    }
    storage.saveRegistryEntity(entity)
    setAnalysisMessage(existing ? "Registry entry updated." : "Compound registered in the OpenLab Registry.")
  }

  return <div className="chemLibraryLayout">
    <aside className="chemCompoundList panel">
      <div className="chemListHeader"><div><strong>Compound library</strong><span>{state.chemistryCompounds.length} structures</span></div><button className="iconButton" title="Open Structure Lab" onClick={() => setTab("structure")}>+</button></div>
      <label className="chemMiniSearch"><SearchIcon size={15}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Name, formula, SMILES, series…"/></label>
      <div className="chemCompoundRows">
        {filtered.map(item => <button key={item.id} className={item.id === activeCompoundId ? "active" : ""} onClick={() => setActiveCompoundId(item.id)}>
          <span className="chemFormulaBadge">{item.formula || "mol"}</span><span><strong>{item.name}</strong><small>{item.series || item.inchiKey || "Unassigned series"}</small></span>
        </button>)}
        {!filtered.length && (state.chemistryCompounds.length === 0 && !query.trim() ? <div className="chemLibraryEmptyMini"><ChemistryIcon size={24}/><strong>Your compound library is empty</strong><span>Analyze a SMILES, MOL or SDF structure and save it here to start building your searchable chemistry collection.</span><button type="button" onClick={() => setTab("structure")}>Analyze first compound</button></div> : <div className="chemQuietEmpty">No compounds match this search.</div>)}
      </div>
    </aside>

    <main className="chemEditorPanel panel">
      {!compound ? <div className="chemCenteredEmpty"><ChemistryIcon size={36}/><strong>No compound selected</strong><p>Create a structure in Structure Lab or import a compound file.</p><button className="primaryButton" onClick={() => setTab("structure")}>Open Structure Lab</button></div> : <>
        <div className="chemEditorHeader">
          <div><span className="sectionEyebrow">COMPOUND RECORD</span><input className="chemTitleInput" value={compound.name} onChange={event => save({ ...compound, name: event.target.value })}/><small>{compound.id} · Updated {new Date(compound.updatedAt).toLocaleString()}</small></div>
          <div className="chemHeaderActions"><button className="ghostButton" onClick={normalize}>Re-analyze with RDKit</button><button className="ghostButton" onClick={registerEntity}>Register entity</button><button className="dangerGhost" onClick={() => { if (confirm(`Delete ${compound.name}? Linked activity/prediction records will also be removed.`)) { storage.deleteChemistryCompound(compound.id); setActiveCompoundId("") } }}>Delete</button></div>
        </div>
        {analysisMessage && <div className="chemInlineMessage">{analysisMessage}</div>}
        <div className="chemIdentityGrid">
          <div className="chemStructureCard"><CompoundDepiction compound={compound}/></div>
          <div className="chemIdentityFields">
            <div className="chemTwoCols">
              <label><span>Project</span><select value={compound.projectId || ""} onChange={event => save({ ...compound, projectId: event.target.value || null })}><option value="">Unassigned</option>{state.projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
              <label><span>Series</span><input value={compound.series} onChange={event => save({ ...compound, series: event.target.value })} placeholder="e.g. PRMT5 series A"/></label>
            </div>
            <label><span>RDKit canonical SMILES</span><textarea rows={2} value={compound.canonicalSmiles || compound.smiles} onChange={event => save({ ...compound, canonicalSmiles: event.target.value, smiles: event.target.value, structureInput: event.target.value, sourceFormat: "SMILES" })}/></label>
            <label><span>InChIKey</span><input value={compound.inchiKey} readOnly placeholder="Analyze with RDKit"/></label>
            <div className="chemThreeCols"><label><span>Formula</span><input value={compound.formula} readOnly/></label><label><span>PubChem CID</span><input value={compound.externalIds.pubchem || ""} onChange={event => save({ ...compound, externalIds: { ...compound.externalIds, pubchem: event.target.value } })}/></label><label><span>ChEMBL ID</span><input value={compound.externalIds.chembl || ""} onChange={event => save({ ...compound, externalIds: { ...compound.externalIds, chembl: event.target.value } })}/></label></div>
            <label><span>Tags</span><input value={compound.tags.join(", ")} onChange={event => save({ ...compound, tags: event.target.value.split(",").map(item => item.trim()).filter(Boolean) })} placeholder="lead, active, series-a"/></label>
          </div>
        </div>
        <section className="chemSection"><div className="chemSectionHead"><div><strong>RDKit descriptors</strong><span>Calculated from the registered chemical graph, not experimental measurements.</span></div></div><DescriptorGrid compound={compound}/></section>
        <section className="chemSection"><div className="chemSectionHead"><div><strong>Notes & external records</strong><span>Keep medicinal chemistry context beside the structure.</span></div><div className="chemExternalLinks"><a target="_blank" rel="noreferrer" href={compound.externalIds.pubchem ? `https://pubchem.ncbi.nlm.nih.gov/compound/${encodeURIComponent(compound.externalIds.pubchem)}` : `https://pubchem.ncbi.nlm.nih.gov/#query=${encodeURIComponent(compound.canonicalSmiles || compound.name)}`}>PubChem ↗</a><a target="_blank" rel="noreferrer" href={compound.externalIds.chembl ? `https://www.ebi.ac.uk/chembl/explore/compound/${encodeURIComponent(compound.externalIds.chembl)}` : `https://www.ebi.ac.uk/chembl/explore/compounds/search?q=${encodeURIComponent(compound.name)}`}>ChEMBL ↗</a></div></div><textarea className="chemNotesArea" rows={5} value={compound.notes} onChange={event => save({ ...compound, notes: event.target.value })} placeholder="Synthesis notes, assay interpretation, liability hypotheses, literature context…"/></section>
      </>}
    </main>
  </div>
}

function StructureLab({ state, setActiveCompoundId, setTab }: { state: WorkspaceState; setActiveCompoundId: (id: string) => void; setTab: (tab: ChemTab) => void }) {
  const [name, setName] = useState("New compound")
  const [input, setInput] = useState(structurePresets[0].smiles)
  const [format, setFormat] = useState<ChemistryCompound["sourceFormat"]>("SMILES")
  const [analysis, setAnalysis] = useState<RDKitAnalysis | null>(null)
  const [status, setStatus] = useState("RDKit is ready to load in your browser.")
  const [version, setVersion] = useState("")

  useEffect(() => { rdkitVersion().then(setVersion).catch(() => {}) }, [])

  useEffect(() => {
    if (format !== "SMILES") return
    const raw = input.trim()
    if (raw.length < 3) { setAnalysis(null); return }
    let alive = true
    const timer = window.setTimeout(async () => {
      try {
        const result = await analyzeWithRDKit(raw)
        if (!alive) return
        setAnalysis(result)
        setStatus("Live RDKit analysis is up to date.")
      } catch {
        if (!alive) return
        setAnalysis(null)
        setStatus("Keep typing a valid SMILES, or use Analyze structure when ready.")
      }
    }, 450)
    return () => { alive = false; window.clearTimeout(timer) }
  }, [input, format])

  async function analyze() {
    if (!input.trim()) { setAnalysis(null); setStatus("Enter a SMILES, MOL block or SDF record first."); return }
    setStatus("Analyzing chemical graph with RDKit…")
    try {
      const result = await analyzeWithRDKit(input)
      setAnalysis(result)
      const duplicate = state.chemistryCompounds.find(item => result.inchiKey && item.inchiKey === result.inchiKey) || state.chemistryCompounds.find(item => item.canonicalSmiles && item.canonicalSmiles === result.canonicalSmiles)
      setStatus(duplicate ? `Valid structure. This appears to duplicate “${duplicate.name}”.` : "Valid structure. RDKit identifiers, depiction, fingerprint and descriptors calculated.")
    } catch (error) { setAnalysis(null); setStatus(error instanceof Error ? error.message : "RDKit could not analyze the structure.") }
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const entries = inferStructureFile(text, file.name)
    if (!entries.length) { setStatus("No supported structures were found in this file."); return }
    const first = entries[0]
    setName(first.name)
    setInput(first.input)
    setFormat(first.format)
    setStatus(entries.length > 1 ? `Loaded the first of ${entries.length} structures. Use Data tools for batch import.` : `Loaded ${file.name}. Choose Analyze structure.`)
    setAnalysis(null)
    event.target.value = ""
  }

  function saveCompound() {
    if (!analysis) { setStatus("Analyze the structure before saving it to the compound registry."); return }
    const duplicate = state.chemistryCompounds.find(item => analysis.inchiKey && item.inchiKey === analysis.inchiKey) || state.chemistryCompounds.find(item => item.canonicalSmiles === analysis.canonicalSmiles)
    if (duplicate && !confirm(`This structure matches “${duplicate.name}”. Save another record anyway?`)) return
    const compound = compoundFromAnalysis(name, input, format, analysis)
    storage.saveChemistryCompound(compound)
    setActiveCompoundId(compound.id)
    setTab("library")
  }

  function safeFileName(value: string) {
    return (value || "molecule").trim().replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "") || "molecule"
  }

  function downloadSvg() {
    if (!analysis?.svg) return
    downloadText(`${safeFileName(name)}.svg`, analysis.svg, "image/svg+xml;charset=utf-8")
    setStatus("SVG depiction downloaded.")
  }

  async function downloadPng() {
    if (!analysis?.svg) return
    const blob = new Blob([analysis.svg], { type: "image/svg+xml;charset=utf-8" })
    const objectUrl = URL.createObjectURL(blob)
    const image = new Image()
    image.onload = () => {
      const width = Math.max(image.naturalWidth || 900, 900)
      const height = Math.max(image.naturalHeight || 600, 600)
      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      const context = canvas.getContext("2d")
      if (!context) { URL.revokeObjectURL(objectUrl); return }
      context.fillStyle = "#ffffff"
      context.fillRect(0, 0, width, height)
      context.drawImage(image, 0, 0, width, height)
      canvas.toBlob(png => {
        if (!png) return
        const url = URL.createObjectURL(png)
        const anchor = document.createElement("a")
        anchor.href = url
        anchor.download = `${safeFileName(name)}.png`
        anchor.click()
        window.setTimeout(() => URL.revokeObjectURL(url), 1000)
        setStatus("PNG depiction downloaded.")
      }, "image/png")
      URL.revokeObjectURL(objectUrl)
    }
    image.onerror = () => { URL.revokeObjectURL(objectUrl); setStatus("PNG export failed. SVG export is still available.") }
    image.src = objectUrl
  }

  return <div className="chemStructureLab">
    <section className="panel chemWorkbenchPanel">
      <div className="chemWorkbenchHeader"><div><span className="sectionEyebrow">RDKIT STRUCTURE LAB</span><h2>Parse, normalize and calculate a small molecule</h2><p>Paste SMILES, a MOL block or one SDF record. RDKit.js runs locally in the browser through WebAssembly. SMILES are analyzed automatically after a short pause.</p></div><span className="chemRuntimeBadge">{version || "RDKit.js"}</span></div>
      <div className="chemPresetRow">{structurePresets.map(preset => <button key={preset.name} onClick={() => { setName(preset.name); setInput(preset.smiles); setFormat("SMILES"); setAnalysis(null) }}>{preset.name}</button>)}<label className="chemFileButton"><UploadIcon size={14}/> Import file<input type="file" accept=".smi,.smiles,.txt,.csv,.mol,.sdf" onChange={handleFile}/></label></div>
      <div className="chemStructureInputGrid"><label><span>Compound name</span><input value={name} onChange={event => setName(event.target.value)}/></label><label><span>Input format</span><select value={format} onChange={event => setFormat(event.target.value as ChemistryCompound["sourceFormat"])}><option>SMILES</option><option>MOL</option><option>SDF</option><option>Manual</option></select></label></div>
      <label className="chemLargeInput"><span>Structure input</span><textarea rows={3} value={input} onChange={event => { setInput(event.target.value); setAnalysis(null) }} spellCheck={false}/></label>
      <div className="chemActionRow"><button className="primaryButton" onClick={analyze}>Analyze structure</button><button className="ghostButton chemSaveButton" disabled={!analysis} onClick={saveCompound}><RegistryIcon size={15}/> Save to compound library</button><span>{status}</span></div>
      {state.chemistryCompounds.length === 0 && <div className="chemFirstSaveHint"><strong>Start your library</strong><span>When the structure is valid, save it once. OpenLab will keep its identifiers, descriptors and searchable fingerprint with your workspace.</span></div>}
    </section>

    <section className="panel chemAnalysisPanel">
      <div className="chemAnalysisVisual"><Molecule2D svg={analysis?.svg || ""} alt={`${name} RDKit depiction`}/>{analysis && <div className="chemVisualActions"><button type="button" onClick={downloadSvg}><DownloadIcon size={14}/> SVG</button><button type="button" onClick={downloadPng}><DownloadIcon size={14}/> PNG</button></div>}</div>
      <div className="chemAnalysisData">
        <div className="chemSectionHead"><div><strong>Canonical structure</strong><span>Computed from the parsed molecular graph.</span></div></div>
        <div className="chemReadoutGrid">
          <CopyableReadout label="RDKit canonical SMILES" value={analysis?.canonicalSmiles || ""} wide onCopied={label => setStatus(`${label} copied.`)}/>
          <CopyableReadout label="Standard InChI" value={analysis?.inchi || ""} wide onCopied={label => setStatus(`${label} copied.`)}/>
          <CopyableReadout label="InChIKey" value={analysis?.inchiKey || ""} onCopied={label => setStatus(`${label} copied.`)}/>
          <CopyableReadout label="Formula" value={analysis?.formula || ""} onCopied={label => setStatus(`${label} copied.`)}/>
        </div>
        {analysis && <DescriptorGrid compound={{ ...blankCompound(name), descriptors: analysis.descriptors }}/>} 
      </div>
    </section>
  </div>
}

function StructureSearch({ state, activeCompoundId, setActiveCompoundId }: { state: WorkspaceState; activeCompoundId: string; setActiveCompoundId: (id: string) => void }) {
  const [threshold, setThreshold] = useState(0.4)
  const [similarity, setSimilarity] = useState<SimilarityHit[]>([])
  const [smarts, setSmarts] = useState("c1ccccc1")
  const [subHits, setSubHits] = useState<SubstructureHit[]>([])
  const [status, setStatus] = useState("Choose a query compound, then run a search.")
  const queryCompound = state.chemistryCompounds.find(item => item.id === activeCompoundId) || state.chemistryCompounds[0]

  async function runSimilarity() {
    if (!queryCompound) return
    setStatus("Calculating Morgan fingerprints and Tanimoto similarity…")
    try {
      const queryFp = await fingerprintWithRDKit(structureInput(queryCompound))
      const hits: SimilarityHit[] = []
      for (const compound of state.chemistryCompounds) {
        if (compound.id === queryCompound.id) continue
        try {
          const fp = await fingerprintWithRDKit(structureInput(compound))
          const score = tanimotoBytes(queryFp, fp)
          if (score >= threshold) hits.push({ compound, score })
        } catch { /* Skip invalid structures but keep the search running. */ }
      }
      hits.sort((a, b) => b.score - a.score)
      setSimilarity(hits)
      setStatus(`Found ${hits.length} compound${hits.length === 1 ? "" : "s"} at or above Tanimoto ${threshold.toFixed(2)}.`)
    } catch (error) { setStatus(error instanceof Error ? error.message : "Similarity search failed.") }
  }

  async function runSubstructure() {
    if (!smarts.trim()) return
    setStatus("Running RDKit SMARTS substructure search…")
    const hits: SubstructureHit[] = []
    for (const compound of state.chemistryCompounds) {
      try {
        const result = await substructureMatchWithRDKit(structureInput(compound), smarts.trim())
        if (result.matched) hits.push({ compound, svg: result.svg })
      } catch { /* One malformed record should not abort the library search. */ }
    }
    setSubHits(hits)
    setStatus(`SMARTS matched ${hits.length} compound${hits.length === 1 ? "" : "s"}.`)
  }

  return <div className="chemSearchGrid">
    <section className="panel chemSearchPanel"><div className="chemSectionHead"><div><strong>Similarity search</strong><span>Morgan circular fingerprints (radius 2, 2048 bits) + Tanimoto similarity.</span></div></div>
      <label><span>Query compound</span><select value={queryCompound?.id || ""} onChange={event => setActiveCompoundId(event.target.value)}>{state.chemistryCompounds.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label><span>Minimum Tanimoto similarity: {threshold.toFixed(2)}</span><input type="range" min="0" max="1" step="0.05" value={threshold} onChange={event => setThreshold(Number(event.target.value))}/></label>
      <button className="primaryButton" onClick={runSimilarity} disabled={!queryCompound}>Run similarity search</button>
      <div className="chemResultList">{similarity.map(hit => <button key={hit.compound.id} onClick={() => setActiveCompoundId(hit.compound.id)}><span><strong>{hit.compound.name}</strong><small>{hit.compound.formula || hit.compound.series || "Compound"}</small></span><b>{(hit.score * 100).toFixed(1)}%</b></button>)}{!similarity.length && <div className="chemQuietEmpty">No similarity results yet.</div>}</div>
    </section>
    <section className="panel chemSearchPanel"><div className="chemSectionHead"><div><strong>SMARTS substructure search</strong><span>Find every registered molecule containing a query pattern.</span></div></div>
      <label><span>SMARTS query</span><input value={smarts} onChange={event => setSmarts(event.target.value)} spellCheck={false}/></label>
      <div className="chemSmartExamples"><button onClick={() => setSmarts("c1ccccc1")}>Aromatic ring</button><button onClick={() => setSmarts("C(=O)N")}>Amide</button><button onClick={() => setSmarts("[OH]")}>Hydroxyl</button><button onClick={() => setSmarts("C(=O)O")}>Carboxyl / ester motif</button></div>
      <button className="primaryButton" onClick={runSubstructure}>Search substructures</button>
      <div className="chemSubstructureGrid">{subHits.map(hit => <button key={hit.compound.id} onClick={() => setActiveCompoundId(hit.compound.id)}><Molecule2D svg={hit.svg} alt={`${hit.compound.name} highlighted substructure`} compact/><strong>{hit.compound.name}</strong></button>)}{!subHits.length && <div className="chemQuietEmpty">No substructure results yet.</div>}</div>
    </section>
    <div className="chemWideMessage">{status}</div>
  </div>
}

function SarWorkspace({ state, activeCompoundId, setActiveCompoundId }: { state: WorkspaceState; activeCompoundId: string; setActiveCompoundId: (id: string) => void }) {
  const [descriptor, setDescriptor] = useState<"mw" | "logP" | "tpsa" | "hbd" | "hba" | "rotatable">("logP")
  const activities = state.chemistryActivities
  const points = useMemo(() => activities.flatMap(activity => {
    const compound = state.chemistryCompounds.find(item => item.id === activity.compoundId)
    if (!compound || activity.value === null) return []
    const x = descriptorSummary(compound.descriptors)[descriptor]
    if (x === null) return []
    return [{ x, y: activity.value, compound, activity }]
  }), [activities, state.chemistryCompounds, descriptor])

  function addActivity() {
    const compoundId = activeCompoundId || state.chemistryCompounds[0]?.id
    if (!compoundId) return
    storage.saveChemistryActivity(freshActivity(compoundId))
  }
  function save(activity: ChemistryActivity) { storage.saveChemistryActivity({ ...activity, updatedAt: now() }) }

  const xs = points.map(item => Number(item.x)); const ys = points.map(item => item.y)
  const xMin = xs.length ? Math.min(...xs) : 0; const xMax = xs.length ? Math.max(...xs) : 1
  const yMin = ys.length ? Math.min(...ys) : 0; const yMax = ys.length ? Math.max(...ys) : 1
  const px = (x: number) => 50 + ((x - xMin) / Math.max(xMax - xMin, 1e-9)) * 510
  const py = (y: number) => 260 - ((y - yMin) / Math.max(yMax - yMin, 1e-9)) * 210

  return <div className="chemSarLayout">
    <section className="panel chemSarTable"><div className="chemSectionHead"><div><strong>Structure–activity relationship table</strong><span>Experimental activity records linked to registered compounds. Values are never generated by OpenLab.</span></div><button className="ghostButton" onClick={addActivity}>+ Add activity</button></div>
      <div className="chemActivityHeader"><span>Compound</span><span>Target</span><span>Assay</span><span>Endpoint</span><span>Value</span><span>Unit</span><span>Source / DOI</span><span>Notes</span><span/></div>
      {activities.map(activity => <div className="chemActivityRow" key={activity.id}>
        <select value={activity.compoundId} onChange={event => { setActiveCompoundId(event.target.value); save({ ...activity, compoundId: event.target.value }) }}>{state.chemistryCompounds.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <input value={activity.target} onChange={event => save({ ...activity, target: event.target.value })} placeholder="PRMT5"/>
        <input value={activity.assay} onChange={event => save({ ...activity, assay: event.target.value })} placeholder="Biochemical"/>
        <input value={activity.endpoint} onChange={event => save({ ...activity, endpoint: event.target.value })} placeholder="IC50"/>
        <div className="chemQualifiedValue"><select value={activity.qualifier} onChange={event => save({ ...activity, qualifier: event.target.value as ChemistryActivity["qualifier"] })}><option>=</option><option>&lt;</option><option>&gt;</option><option>&lt;=</option><option>&gt;=</option></select><input type="number" value={activity.value ?? ""} onChange={event => save({ ...activity, value: numberOrNull(event.target.value) })}/></div>
        <input value={activity.unit} onChange={event => save({ ...activity, unit: event.target.value })}/>
        <input value={activity.source} onChange={event => save({ ...activity, source: event.target.value })} placeholder="DOI / notebook / dataset"/>
        <input value={activity.notes} onChange={event => save({ ...activity, notes: event.target.value })} placeholder="Conditions / comments"/>
        <button className="chemDeleteMini" onClick={() => storage.deleteChemistryActivity(activity.id)}>×</button>
      </div>)}
      {!activities.length && <div className="chemQuietEmpty">No SAR measurements yet. Add only measured or source-backed activity values.</div>}
    </section>
    <section className="panel chemSarPlot"><div className="chemSectionHead"><div><strong>Exploratory property plot</strong><span>Visual association only — this is not a fitted or validated QSAR model.</span></div><select value={descriptor} onChange={event => setDescriptor(event.target.value as typeof descriptor)}><option value="logP">Crippen logP (RDKit)</option><option value="mw">Molecular weight</option><option value="tpsa">TPSA</option><option value="hbd">HBD</option><option value="hba">HBA</option><option value="rotatable">Rotatable bonds</option></select></div>
      <svg viewBox="0 0 600 300" className="chemScatterPlot" role="img" aria-label={`${descriptor} versus activity scatter plot`}><line x1="50" y1="260" x2="575" y2="260"/><line x1="50" y1="35" x2="50" y2="260"/><text x="300" y="292">{descriptor}</text><text x="12" y="145" transform="rotate(-90 12 145)">Activity value</text>{points.map((point, index) => <g key={point.activity.id}><circle cx={px(Number(point.x))} cy={py(point.y)} r="6"/><title>{point.compound.name}: {point.activity.qualifier}{point.y} {point.activity.unit}</title></g>)}</svg>
      <div className="chemPlotFoot">{points.length} plottable measurement{points.length === 1 ? "" : "s"}. Different targets/endpoints/units should not be interpreted as one quantitative series.</div>
    </section>
  </div>
}

function ScreeningWorkspace({ state }: { state: WorkspaceState }) {
  const [rules, setRules] = useState<ScreeningRules>(defaultScreeningRules)
  const results = state.chemistryCompounds.map(compound => ({ compound, screen: screenCompound(compound, rules) }))
  function setRule(key: keyof ScreeningRules, value: string) { const n = Number(value); if (Number.isFinite(n)) setRules(current => ({ ...current, [key]: n })) }
  return <div className="chemScreeningLayout">
    <section className="panel chemRulePanel"><div className="chemSectionHead"><div><strong>Property filters</strong><span>Editable heuristic gates for triage, not safety or efficacy predictions.</span></div></div>
      <div className="chemRuleGrid"><label><span>Max MW</span><input type="number" value={rules.maxMw} onChange={event => setRule("maxMw", event.target.value)}/></label><label><span>Max Crippen logP</span><input type="number" value={rules.maxLogP} onChange={event => setRule("maxLogP", event.target.value)}/></label><label><span>Max TPSA</span><input type="number" value={rules.maxTpsa} onChange={event => setRule("maxTpsa", event.target.value)}/></label><label><span>Max HBD</span><input type="number" value={rules.maxHbd} onChange={event => setRule("maxHbd", event.target.value)}/></label><label><span>Max HBA</span><input type="number" value={rules.maxHba} onChange={event => setRule("maxHba", event.target.value)}/></label><label><span>Max rotatable</span><input type="number" value={rules.maxRotatable} onChange={event => setRule("maxRotatable", event.target.value)}/></label></div>
      <div className="chemRuleNote"><strong>Built-in reference heuristics</strong><p>Rule-of-five alert checks use MW 500, RDKit Crippen logP 5, HBD 5 and HBA 10. The Veber-style alert shown here uses rotatable bonds ≤10 and TPSA ≤140 Å². These are triage heuristics, not a verdict that a molecule is “drug-like,” and they are often inappropriate for modalities such as natural products, macrocycles and PROTACs.</p></div>
    </section>
    <section className="panel chemScreenResults"><div className="chemSectionHead"><div><strong>Compound screen</strong><span>Calculated RDKit descriptors are tested against your current gates.</span></div></div>
      <div className="chemScreenHeader"><span>Compound</span><span>MW</span><span>Crippen logP</span><span>TPSA</span><span>RO5 alerts</span><span>Veber alert</span><span>Custom gate</span></div>
      {results.map(({ compound, screen }) => { const d = descriptorSummary(compound.descriptors); return <div className="chemScreenRow" key={compound.id}><strong>{compound.name}</strong><span>{formatNumber(d.mw)}</span><span>{formatNumber(d.logP)}</span><span>{formatNumber(d.tpsa, 1)}</span><span>{screen.lipinskiViolations === null ? "Need data" : `${screen.lipinskiViolations} violation${screen.lipinskiViolations === 1 ? "" : "s"}`}</span><span>{screen.veberPass === null ? "Need data" : screen.veberPass ? "0 alerts" : "Outside heuristic"}</span><span className={screen.pass === true ? "chemPass" : screen.pass === false ? "chemFail" : "chemUnknown"}>{screen.pass === true ? "Within gate" : screen.pass === false ? `${screen.failures.length} alert${screen.failures.length === 1 ? "" : "s"}` : "Need RDKit"}</span></div>})}
    </section>
  </div>
}

function ReactionWorkspace({ state }: { state: WorkspaceState }) {
  const [activeId, setActiveId] = useState(state.chemistryReactions[0]?.id || "")
  useEffect(() => { setActiveId(current => current && state.chemistryReactions.some(item => item.id === current) ? current : state.chemistryReactions[0]?.id || "") }, [state.chemistryReactions])
  const reaction = state.chemistryReactions.find(item => item.id === activeId) || null

  function save(next: ChemistryReaction) {
    const product = next.components.find(item => item.role === "Product")
    const theoretical = next.limitingMmol !== null && product?.molecularWeight ? next.limitingMmol * product.molecularWeight : null
    storage.saveChemistryReaction({ ...next, theoreticalYieldMg: theoretical, yieldPercent: computeYieldPercent(next.actualYieldMg, theoretical), updatedAt: now() })
  }
  function create() { const next = freshReaction(); storage.saveChemistryReaction(next); setActiveId(next.id) }
  function updateComponent(component: ChemistryReactionComponent, patch: Partial<ChemistryReactionComponent>) {
    if (!reaction) return
    const merged = { ...component, ...patch }
    const mass = computeReactionMassMg(merged.amountMmol, merged.molecularWeight)
    const volume = computeVolumeUl(mass, merged.density)
    save({ ...reaction, components: reaction.components.map(item => item.id === component.id ? { ...merged, massMg: mass, volumeUl: volume } : item) })
  }
  function linkCompound(component: ChemistryReactionComponent, compoundId: string) {
    const compound = state.chemistryCompounds.find(item => item.id === compoundId)
    if (!compound) { updateComponent(component, { compoundId: undefined }); return }
    const mw = descriptorSummary(compound.descriptors).mw
    updateComponent(component, { compoundId: compound.id, name: compound.name, smiles: compound.canonicalSmiles || compound.smiles, molecularWeight: mw ?? component.molecularWeight })
  }

  return <div className="chemReactionLayout">
    <aside className="panel chemReactionList"><div className="chemListHeader"><div><strong>Reaction records</strong><span>{state.chemistryReactions.length}</span></div><button className="iconButton" onClick={create}>+</button></div>{state.chemistryReactions.map(item => <button className={item.id === activeId ? "active" : ""} key={item.id} onClick={() => setActiveId(item.id)}><strong>{item.name}</strong><span>{item.solvent || "No solvent"} · {item.yieldPercent === null ? "yield —" : `${item.yieldPercent.toFixed(1)}% yield`}</span></button>)}</aside>
    <main className="panel chemReactionEditor">{!reaction ? <div className="chemCenteredEmpty"><ChemistryIcon size={34}/><strong>Create a reaction record</strong><p>Record reagents, stoichiometry, procedure, purification and yield.</p><button className="primaryButton" onClick={create}>New reaction</button></div> : <>
      <div className="chemEditorHeader"><div><span className="sectionEyebrow">REACTION WORKBENCH</span><input className="chemTitleInput" value={reaction.name} onChange={event => save({ ...reaction, name: event.target.value })}/></div><button className="dangerGhost" onClick={() => { storage.deleteChemistryReaction(reaction.id); setActiveId("") }}>Delete</button></div>
      <div className="chemReactionMeta"><label><span>Project</span><select value={reaction.projectId || ""} onChange={event => save({ ...reaction, projectId: event.target.value || null })}><option value="">Unassigned</option>{state.projects.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label><span>Solvent</span><input value={reaction.solvent} onChange={event => save({ ...reaction, solvent: event.target.value })}/></label><label><span>Temperature (°C)</span><input type="number" value={reaction.temperatureC ?? ""} onChange={event => save({ ...reaction, temperatureC: numberOrNull(event.target.value) })}/></label><label><span>Time (h)</span><input type="number" value={reaction.timeHours ?? ""} onChange={event => save({ ...reaction, timeHours: numberOrNull(event.target.value) })}/></label></div>
      <label><span>Reaction SMILES (optional)</span><input value={reaction.reactionSmiles} onChange={event => save({ ...reaction, reactionSmiles: event.target.value })} placeholder="reactant.reactant>reagent>product"/></label>
      <section className="chemSection"><div className="chemSectionHead"><div><strong>Stoichiometry</strong><span>Mass = mmol × MW. For liquids, volume µL = mass mg ÷ density g/mL.</span></div><div className="chemAddRole"><button onClick={() => save({ ...reaction, components: [...reaction.components, freshReactionComponent("Reactant")] })}>+ Reactant</button><button onClick={() => save({ ...reaction, components: [...reaction.components, freshReactionComponent("Reagent")] })}>+ Reagent</button><button onClick={() => save({ ...reaction, components: [...reaction.components, freshReactionComponent("Product")] })}>+ Product</button></div></div>
        <div className="chemStoichHeader"><span>Role</span><span>Library compound</span><span>Name</span><span>eq</span><span>mmol</span><span>MW</span><span>Density</span><span>Mass mg</span><span>Vol µL</span><span/></div>
        {reaction.components.map(component => <div className="chemStoichRow" key={component.id}><select value={component.role} onChange={event => updateComponent(component, { role: event.target.value as ChemistryReactionRole })}><option>Reactant</option><option>Reagent</option><option>Solvent</option><option>Product</option></select><select value={component.compoundId || ""} onChange={event => linkCompound(component, event.target.value)}><option value="">Manual entry</option>{state.chemistryCompounds.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select><input value={component.name} onChange={event => updateComponent(component, { name: event.target.value, compoundId: undefined })}/><input type="number" value={component.equivalents ?? ""} onChange={event => updateComponent(component, { equivalents: numberOrNull(event.target.value) })}/><input type="number" value={component.amountMmol ?? ""} onChange={event => updateComponent(component, { amountMmol: numberOrNull(event.target.value) })}/><input type="number" value={component.molecularWeight ?? ""} onChange={event => updateComponent(component, { molecularWeight: numberOrNull(event.target.value) })}/><input type="number" value={component.density ?? ""} onChange={event => updateComponent(component, { density: numberOrNull(event.target.value) })}/><span>{formatNumber(component.massMg, 2)}</span><span>{formatNumber(component.volumeUl, 2)}</span><button className="chemDeleteMini" onClick={() => save({ ...reaction, components: reaction.components.filter(item => item.id !== component.id) })}>×</button></div>)}
      </section>
      <div className="chemYieldStrip"><label><span>Limiting reagent (mmol)</span><input type="number" value={reaction.limitingMmol ?? ""} onChange={event => save({ ...reaction, limitingMmol: numberOrNull(event.target.value) })}/></label><div><span>Theoretical yield</span><strong>{formatNumber(reaction.theoreticalYieldMg, 2)} mg</strong></div><label><span>Actual product (mg)</span><input type="number" value={reaction.actualYieldMg ?? ""} onChange={event => save({ ...reaction, actualYieldMg: numberOrNull(event.target.value) })}/></label><div><span>Yield</span><strong>{reaction.yieldPercent === null ? "—" : `${reaction.yieldPercent.toFixed(1)}%`}</strong></div></div>
      <div className="chemReactionTextGrid"><label><span>Procedure</span><textarea rows={7} value={reaction.procedure} onChange={event => save({ ...reaction, procedure: event.target.value })}/></label><label><span>Purification</span><textarea rows={7} value={reaction.purification} onChange={event => save({ ...reaction, purification: event.target.value })}/></label><label><span>Analytical characterization</span><textarea rows={7} value={reaction.analytics} onChange={event => save({ ...reaction, analytics: event.target.value })} placeholder="LC-MS, NMR, HPLC, purity…"/></label></div>
    </>}</main>
  </div>
}

function Viewer3DWorkspace({ state, activeCompoundId }: { state: WorkspaceState; activeCompoundId: string }) {
  const [data, setData] = useState("")
  const [format, setFormat] = useState<ViewerFormat>("pdb")
  const [style, setStyle] = useState<ViewerStyle>("stick")
  const [spin, setSpin] = useState(false)
  const compound = state.chemistryCompounds.find(item => item.id === activeCompoundId)
  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return
    const text = await file.text(); setData(text)
    const ext = file.name.toLowerCase().split(".").pop() || ""
    if (["pdb", "sdf", "mol2", "xyz", "cif", "mol"].includes(ext)) setFormat(ext as ViewerFormat)
    event.target.value = ""
  }
  function loadCompound() { if (!compound?.molblock) return; setData(compound.molblock); setFormat("mol") }
  return <div className="chem3dLayout"><section className="panel chem3dControls"><div className="chemSectionHead"><div><strong>3D molecular viewer</strong><span>Interactive rendering powered by 3Dmol.js.</span></div></div><div className="chem3dControlGrid"><label><span>Format</span><select value={format} onChange={event => setFormat(event.target.value as ViewerFormat)}><option value="pdb">PDB</option><option value="sdf">SDF</option><option value="mol2">MOL2</option><option value="xyz">XYZ</option><option value="cif">CIF</option><option value="mol">MOL</option></select></label><label><span>Style</span><select value={style} onChange={event => setStyle(event.target.value as ViewerStyle)}><option value="stick">Stick</option><option value="sphere">Sphere + stick</option><option value="line">Line</option><option value="cartoon">Cartoon + stick</option></select></label></div><div className="chemPresetRow"><label className="chemFileButton"><UploadIcon size={14}/> Upload coordinates<input type="file" accept=".pdb,.sdf,.mol,.mol2,.xyz,.cif" onChange={handleFile}/></label><button disabled={!compound?.molblock} onClick={loadCompound}>Load selected compound</button><label className="chemCheck"><input type="checkbox" checked={spin} onChange={event => setSpin(event.target.checked)}/> Spin</label></div><label className="chemLargeInput"><span>Molecular coordinate text</span><textarea rows={15} value={data} onChange={event => setData(event.target.value)} spellCheck={false} placeholder="Paste PDB, SDF, MOL2, XYZ or CIF data…"/></label><div className="chemRuleNote"><strong>Coordinate integrity</strong><p>RDKit 2D MOL blocks contain planar drawing coordinates. For scientifically meaningful conformations or protein–ligand poses, upload a file containing real 3D coordinates. OpenLab does not invent a docking pose here.</p></div></section><section className="panel chem3dViewerPanel"><Molecule3DViewer data={data} format={format} style={style} spin={spin}/></section></div>
}

function AdmetWorkspace({ state, activeCompoundId, setActiveCompoundId }: { state: WorkspaceState; activeCompoundId: string; setActiveCompoundId: (id: string) => void }) {
  const predictions = state.chemistryPredictions
  function add() { const id = activeCompoundId || state.chemistryCompounds[0]?.id; if (id) storage.saveChemistryPrediction(freshPrediction(id)) }
  function save(item: ChemistryPrediction) { storage.saveChemistryPrediction(item) }
  return <div className="panel chemAdmetPanel"><div className="chemPredictionWarning"><SparkIcon size={19}/><div><strong>Prediction provenance is mandatory</strong><p>OpenLab stores experimental measurements, model predictions and heuristics separately. It does not fabricate ADMET values. For every prediction, record the model, version, uncertainty/confidence when available, provenance and applicability-domain assessment; a numerical output outside a model’s domain should be treated as unreliable.</p></div></div><div className="chemSectionHead"><div><strong>ADMET / property evidence ledger</strong><span>Solubility, permeability, CYP, hERG, BBB, clearance, PPB, toxicity or any other property can be recorded with provenance.</span></div><button className="ghostButton" onClick={add}>+ Add record</button></div><div className="chemPredictionHeader"><span>Compound</span><span>Kind</span><span>Property</span><span>Value</span><span>Unit</span><span>Method</span><span>Version</span><span>Uncertainty / confidence</span><span>Applicability domain</span><span>Provenance</span><span/></div>{predictions.map(item => <div className="chemPredictionRow" key={item.id}><select value={item.compoundId} onChange={event => { setActiveCompoundId(event.target.value); save({ ...item, compoundId: event.target.value }) }}>{state.chemistryCompounds.map(compound => <option key={compound.id} value={compound.id}>{compound.name}</option>)}</select><select value={item.kind} onChange={event => save({ ...item, kind: event.target.value as ChemistryPredictionKind })}><option>Experimental</option><option>Predicted</option><option>Heuristic</option></select><input value={item.property} onChange={event => save({ ...item, property: event.target.value })} placeholder="Solubility"/><input value={item.value} onChange={event => save({ ...item, value: event.target.value })}/><input value={item.unit} onChange={event => save({ ...item, unit: event.target.value })}/><input value={item.method} onChange={event => save({ ...item, method: event.target.value })} placeholder="Model / assay"/><input value={item.version} onChange={event => save({ ...item, version: event.target.value })}/><input value={item.uncertainty || ""} onChange={event => save({ ...item, uncertainty: event.target.value })} placeholder="CI / SD / score / qualitative confidence"/><input value={item.applicabilityDomain || ""} onChange={event => save({ ...item, applicabilityDomain: event.target.value })} placeholder="In-domain / warning / rationale"/><input value={item.provenance} onChange={event => save({ ...item, provenance: event.target.value })} placeholder="DOI, dataset, notebook…"/><button className="chemDeleteMini" onClick={() => storage.deleteChemistryPrediction(item.id)}>×</button></div>)}{!predictions.length && <div className="chemQuietEmpty">No ADMET/property records yet.</div>}</div>
}

function DataTools({ state, setActiveCompoundId }: { state: WorkspaceState; setActiveCompoundId: (id: string) => void }) {
  const [status, setStatus] = useState("Import .smi/.smiles/.csv/.mol/.sdf files. RDKit validates every structure before it is registered.")
  const [busy, setBusy] = useState(false)
  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return
    const text = await file.text(); const entries = inferStructureFile(text, file.name)
    if (!entries.length) { setStatus("No supported structures found."); return }
    if (entries.length > 500) { setStatus(`This file contains ${entries.length} records. OpenLab limits one browser batch to 500 to keep the interface responsive.`); return }
    setBusy(true); let added = 0; let duplicates = 0; let failed = 0; let lastId = ""
    const keys = new Set(state.chemistryCompounds.map(item => item.inchiKey).filter(Boolean)); const smiles = new Set(state.chemistryCompounds.map(item => item.canonicalSmiles).filter(Boolean))
    for (const entry of entries) {
      try {
        const result = await analyzeWithRDKit(entry.input)
        if ((result.inchiKey && keys.has(result.inchiKey)) || smiles.has(result.canonicalSmiles)) { duplicates += 1; continue }
        const compound = compoundFromAnalysis(entry.name, entry.input, entry.format, result)
        storage.saveChemistryCompound(compound); added += 1; lastId = compound.id
        if (result.inchiKey) keys.add(result.inchiKey); smiles.add(result.canonicalSmiles)
      } catch { failed += 1 }
    }
    if (lastId) setActiveCompoundId(lastId)
    setBusy(false); setStatus(`Import complete: ${added} added · ${duplicates} duplicates skipped · ${failed} invalid/unsupported.`); event.target.value = ""
  }
  const duplicates = useMemo(() => {
    const groups = new Map<string, ChemistryCompound[]>()
    for (const compound of state.chemistryCompounds) {
      const key = compound.inchiKey || compound.canonicalSmiles
      if (!key) continue
      groups.set(key, [...(groups.get(key) || []), compound])
    }
    return Array.from(groups.values()).filter(group => group.length > 1)
  }, [state.chemistryCompounds])
  return <div className="chemDataLayout"><section className="panel chemDataCard"><UploadIcon size={25}/><h3>Bulk structure import</h3><p>SMILES lists, CSV with a smiles column, MOL and multi-record SDF are supported. Imported structures are normalized by RDKit and exact duplicates are skipped.</p><label className="primaryButton chemUploadPrimary">{busy ? "Importing…" : "Choose structure file"}<input type="file" disabled={busy} accept=".smi,.smiles,.txt,.csv,.mol,.sdf" onChange={importFile}/></label><span className="chemDataStatus">{status}</span></section><section className="panel chemDataCard"><DatabaseIcon size={25}/><h3>Export chemistry data</h3><p>CSV includes identifiers and common computed descriptors. SDF export includes registered MOL blocks plus OpenLab IDs and selected metadata.</p><div className="chemDataActions"><button className="ghostButton" onClick={() => downloadText("openlab-compounds.csv", compoundsToCsv(state.chemistryCompounds), "text/csv;charset=utf-8")}>Export CSV</button><button className="ghostButton" onClick={() => downloadText("openlab-compounds.sdf", compoundsToSdf(state.chemistryCompounds))}>Export SDF</button></div><small>{state.chemistryCompounds.length} registered compounds · {state.chemistryCompounds.filter(item => item.molblock).length} with exportable MOL blocks</small></section><section className="panel chemDataCard chemDuplicateCard"><SearchIcon size={25}/><h3>Duplicate audit</h3><p>Duplicates are grouped by InChIKey when available, otherwise by canonical SMILES.</p>{duplicates.length ? duplicates.map((group, index) => <div className="chemDuplicateGroup" key={index}><strong>{group.map(item => item.name).join(" · ")}</strong><code>{group[0].inchiKey || group[0].canonicalSmiles}</code></div>) : <div className="chemPassBox">No exact registered duplicates detected.</div>}</section></div>
}

export default function ChemistryWorkspace() {
  const [state, setState] = useState<WorkspaceState | null>(null)
  const [tab, setTab] = useState<ChemTab>("library")
  const [activeCompoundId, setActiveCompoundId] = useState("")
  const [navCollapsed, setNavCollapsed] = useState(false)

  useEffect(() => {
    const refresh = () => {
      const next = storage.getState()
      setState(next)
      setActiveCompoundId(current => current && next.chemistryCompounds.some(item => item.id === current) ? current : next.chemistryCompounds[0]?.id || "")
    }
    refresh(); window.addEventListener(storage.eventName, refresh)
    return () => window.removeEventListener(storage.eventName, refresh)
  }, [])

  if (!state) return <div className="applicationWorkspace"><div className="chemLoading">Loading Chemistry workspace…</div></div>

  return <div className="chemistryWorkspace">
    <header className="chemistryHero">
      <div><div className="sectionEyebrow">CHEMISTRY & CHEMINFORMATICS</div><h1>Small molecules, SAR, reactions and structure-aware analysis</h1><p>RDKit-powered 2D cheminformatics, compound registration, structure search, medicinal-chemistry triage, reaction calculations and 3D molecular visualization — connected to the same OpenLab workspace.</p></div>
      <div className="chemHeroLinks"><Link href="/notebook"><BookIcon size={16}/> Notebook</Link><Link href="/registry"><RegistryIcon size={16}/> Registry</Link><Link href="/sources"><SparkIcon size={16}/> Evidence</Link></div>
    </header>

    <div className={`chemistryShell ${navCollapsed ? "chemNavIsCollapsed" : ""}`}>
      <nav className={`panel chemistryNav ${navCollapsed ? "collapsed" : ""}`}>
        <div className="chemNavTitle"><ChemistryIcon size={20}/>{!navCollapsed && <span><strong>Chemistry</strong><small>{state.chemistryCompounds.length} compounds</small></span>}<button type="button" className="chemNavCollapseButton" onClick={() => setNavCollapsed(value => !value)} title={navCollapsed ? "Expand Chemistry tools" : "Collapse Chemistry tools"}>{navCollapsed ? "›" : "‹"}</button></div>
        {!navCollapsed && tabs.map(item => <button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => setTab(item.id)}><strong>{item.label}</strong><span>{item.description}</span></button>)}
        {navCollapsed && <button type="button" className="chemNavRailLabel" onClick={() => setNavCollapsed(false)} title="Expand Chemistry tools"><span>CHEMISTRY</span></button>}
      </nav>
      <div className="chemistryContent">
        {tab === "library" && <ChemistryLibrary state={state} activeCompoundId={activeCompoundId} setActiveCompoundId={setActiveCompoundId} setTab={setTab}/>} 
        {tab === "structure" && <StructureLab state={state} setActiveCompoundId={setActiveCompoundId} setTab={setTab}/>} 
        {tab === "search" && <StructureSearch state={state} activeCompoundId={activeCompoundId} setActiveCompoundId={setActiveCompoundId}/>} 
        {tab === "sar" && <SarWorkspace state={state} activeCompoundId={activeCompoundId} setActiveCompoundId={setActiveCompoundId}/>} 
        {tab === "screening" && <ScreeningWorkspace state={state}/>} 
        {tab === "reactions" && <ReactionWorkspace state={state}/>} 
        {tab === "viewer3d" && <Viewer3DWorkspace state={state} activeCompoundId={activeCompoundId}/>} 
        {tab === "admet" && <AdmetWorkspace state={state} activeCompoundId={activeCompoundId} setActiveCompoundId={setActiveCompoundId}/>} 
        {tab === "data" && <DataTools state={state} setActiveCompoundId={setActiveCompoundId}/>} 
      </div>
    </div>
  </div>
}
