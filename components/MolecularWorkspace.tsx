"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { makeId } from "@/lib/id"
import { cleanDna, dnaLength, findMotifMatches, gcPercent, oligoTm, reverseComplement, toFasta, toGenBank, translateDna } from "@/lib/sequence"
import { storage } from "@/lib/storage"
import type { SequenceFeature, SequenceRecord, SequenceVersion, WorkspaceState } from "@/lib/types"
import { DownloadIcon, PlusIcon, TrashIcon, UploadIcon } from "./Icons"
import CircularSequenceMap from "./molecular/CircularSequenceMap"
import OrfPanel from "./molecular/OrfPanel"
import PrimerPanel from "./molecular/PrimerPanel"
import RestrictionPanel from "./molecular/RestrictionPanel"
import SequenceImportDialog from "./molecular/SequenceImportDialog"

type ViewMode = "split" | "map" | "sequence"
type AnalysisTab = "primers" | "restriction" | "orfs"
type MapPanelMode = "linear" | "plasmid" | "metadata"
type SequenceSelection = { start: number; end: number } | null

const featureColors = ["#7257c7", "#d56d82", "#d8942f", "#2f9d76", "#4b8fb6", "#9a73cf", "#df7651"]

function blankSequence(): SequenceRecord {
  return { id: makeId("seq"), name: "Untitled DNA", sequence: "", topology: "Circular", moleculeType: "DNA", features: [], primers: [], translationTable: 11, annotationSource: "OpenLab manual annotation", versions: [], updatedAt: new Date().toISOString() }
}

export default function MolecularWorkspace() {
  const [state, setState] = useState<WorkspaceState | null>(null)
  const [activeId, setActiveId] = useState("")
  const [view, setView] = useState<ViewMode>("split")
  const [showImport, setShowImport] = useState(false)
  const [selectedFeatureId, setSelectedFeatureId] = useState("")
  const [analysisTab, setAnalysisTab] = useState<AnalysisTab>("primers")
  const [rotation, setRotation] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [showRestrictionSites, setShowRestrictionSites] = useState(true)
  const [mapPanelMode, setMapPanelMode] = useState<MapPanelMode>("plasmid")
  const [find, setFind] = useState("")
  const [rawEditing, setRawEditing] = useState(false)
  const [rawSequence, setRawSequence] = useState("")
  const [message, setMessage] = useState("")
  const [selection, setSelection] = useState<SequenceSelection>(null)
  const [showVersions, setShowVersions] = useState(false)
  const [libraryCollapsed, setLibraryCollapsed] = useState(false)
  const [inspectorCollapsed, setInspectorCollapsed] = useState(false)
  const [toolbarCollapsed, setToolbarCollapsed] = useState(false)
  const [analysisCollapsed, setAnalysisCollapsed] = useState(false)

  const refresh = () => {
    const next = storage.getState()
    setState(next)
    setActiveId(current => current && next.sequences.some(item => item.id === current) ? current : (next.sequences[0]?.id || ""))
  }

  useEffect(() => { refresh(); window.addEventListener(storage.eventName, refresh); return () => window.removeEventListener(storage.eventName, refresh) }, [])

  const record = state?.sequences.find(item => item.id === activeId)
  const selectedFeature = record?.features.find(feature => feature.id === selectedFeatureId)
  const findHits = useMemo(() => record && find.trim() ? findMotifMatches(record.sequence, find, record.topology === "Circular", true) : [], [record, find])
  const linkedEntity = state?.registry.find(entity => entity.sequenceId === activeId)

  function save(next: SequenceRecord) {
    const normalized = { ...next, sequence: cleanDna(next.sequence), translationTable: next.translationTable || 11, versions: next.versions || [], updatedAt: new Date().toISOString() }
    storage.saveSequence(normalized)
    setMessage("Saved")
    window.setTimeout(() => setMessage(""), 1200)
  }

  function versionSnapshot(current: SequenceRecord, label: string): SequenceVersion {
    return { id: makeId("seqver"), createdAt: new Date().toISOString(), label, sequence: current.sequence, topology: current.topology, moleculeType: current.moleculeType, features: current.features.map(feature => ({ ...feature })), primers: current.primers.map(primer => ({ ...primer })), accession: current.accession, sourceLabel: current.sourceLabel, sourceUrl: current.sourceUrl, annotationSource: current.annotationSource, translationTable: current.translationTable, notes: current.notes }
  }

  function captureVersion(label = "Manual checkpoint") {
    if (!record) return
    save({ ...record, versions: [versionSnapshot(record, label), ...(record.versions || [])].slice(0, 30) })
    setMessage("Version checkpoint saved")
  }

  function restoreVersion(version: SequenceVersion) {
    if (!record || !window.confirm(`Restore “${version.label}” from ${new Date(version.createdAt).toLocaleString()}? Current state will be checkpointed first.`)) return
    const currentCheckpoint = versionSnapshot(record, "Before restore")
    save({ ...record, sequence: version.sequence, topology: version.topology, moleculeType: version.moleculeType || record.moleculeType, features: version.features.map(item => ({ ...item })), primers: version.primers.map(item => ({ ...item })), accession: version.accession, sourceLabel: version.sourceLabel, sourceUrl: version.sourceUrl, annotationSource: version.annotationSource, translationTable: version.translationTable || record.translationTable || 11, notes: version.notes, versions: [currentCheckpoint, ...(record.versions || [])].slice(0, 30) })
    setSelectedFeatureId("")
    setSelection(null)
    setShowVersions(false)
  }

  function importRecords(records: SequenceRecord[]) { records.forEach(item => storage.saveSequence({ ...item, translationTable: item.translationTable || 11, versions: item.versions || [] })); if (records[0]) setActiveId(records[0].id); setMessage(`${records.length} sequence${records.length === 1 ? "" : "s"} imported`) }
  function createBlank() { const item=blankSequence(); storage.saveSequence(item); setActiveId(item.id); setSelectedFeatureId(""); setSelection(null) }
  function deleteSequence() { if (!record || !window.confirm(`Delete sequence “${record.name}”?`)) return; storage.deleteSequence(record.id); setActiveId(""); setSelectedFeatureId(""); setSelection(null) }

  function addFeature() {
    if (!record || !record.sequence.length) return
    const feature: SequenceFeature = { id: makeId("feature"), name: "New feature", type: "misc_feature", start: selection?.start ?? 0, end: selection?.end ?? Math.min(99, record.sequence.length - 1), direction: 1, color: featureColors[record.features.length % featureColors.length], translationTable: record.translationTable || 11, codonStart: 1, source: "OpenLab manual annotation" }
    save({ ...record, features: [...record.features, feature] }); setSelectedFeatureId(feature.id)
  }
  function patchFeature(patch: Partial<SequenceFeature>) { if (!record || !selectedFeature) return; save({ ...record, features: record.features.map(feature => feature.id === selectedFeature.id ? { ...feature, ...patch } : feature) }) }
  function deleteFeature() { if (!record || !selectedFeature) return; save({ ...record, features: record.features.filter(feature => feature.id !== selectedFeature.id) }); setSelectedFeatureId("") }

  function beginRawEdit() { if (!record) return; setRawSequence(record.sequence); setRawEditing(true) }
  function applyRawEdit() {
    if (!record) return
    const checkpoint = versionSnapshot(record, "Before raw sequence edit")
    const sequence=cleanDna(rawSequence); const max=Math.max(0,sequence.length-1)
    const features=record.features.filter(feature=>feature.start<=max).map(feature=>({...feature,end:Math.min(feature.end,max)})); const primers=record.primers.filter(primer=>primer.start<=max).map(primer=>({...primer,end:Math.min(primer.end,max)}))
    save({...record,sequence,features,primers,versions:[checkpoint,...(record.versions||[])].slice(0,30)}); setRawEditing(false)
  }

  function reverseComplementRecord() {
    if (!record || !record.sequence.length || !window.confirm("Reverse-complement the entire record? Feature and primer coordinates/strands will be transformed too, and a version checkpoint will be saved.")) return
    const checkpoint=versionSnapshot(record,"Before reverse complement"); const length=record.sequence.length
    save({ ...record, sequence: reverseComplement(record.sequence), features: record.features.map(feature=>({ ...feature, start:length-1-feature.end, end:length-1-feature.start, direction:(feature.direction===1?-1:1) as 1|-1 })), primers: record.primers.map(primer=>({ ...primer, start:length-1-primer.end, end:length-1-primer.start, direction:(primer.direction===1?-1:1) as 1|-1 })), versions:[checkpoint,...(record.versions||[])].slice(0,30) })
    setSelectedFeatureId(""); setSelection(null); setRotation(0)
  }

  function download(format: "fasta" | "genbank") { if (!record) return; const text=format==="fasta"?toFasta(record.name,record.sequence):toGenBank(record.name,record.sequence,record.features,record.topology); const blob=new Blob([text],{type:"text/plain"}); const url=URL.createObjectURL(blob); const link=document.createElement("a"); link.href=url; link.download=`${record.name.replace(/[^a-z0-9_-]+/gi,"_")}.${format==="fasta"?"fasta":"gb"}`; link.click(); URL.revokeObjectURL(url) }
  function linkToRegistry() { if (!record) return; if (linkedEntity) return window.alert(`This sequence is already linked to registry entity “${linkedEntity.name}”.`); const now=new Date().toISOString(); storage.saveRegistryEntity({id:makeId("entity"),name:record.name,type:"DNA",schema:record.topology==="Circular"?"Plasmid":"DNA sequence",description:"",aliases:[],sequenceId:record.id,metadata:record.accession?{accession:record.accession}:{},createdAt:now,updatedAt:now}); setMessage("Registry entity created") }

  const forwardHits = findHits.filter(hit => hit.strand === 1).length
  const reverseHits = findHits.filter(hit => hit.strand === -1).length

  return <div className={`molecularV1 ${libraryCollapsed ? "library-collapsed" : ""}`}>
    <aside className={`molecularLibrary ${libraryCollapsed ? "collapsed" : ""}`}>
      <div className="molecularLibraryHead">{!libraryCollapsed && <div><strong>DNA & RNA</strong><span>{state?.sequences.length || 0} records</span></div>}<div className="molecularLibraryHeadActions">{!libraryCollapsed && <button className="iconButton" onClick={createBlank} title="Create blank sequence"><PlusIcon size={16}/></button>}<button type="button" className="paneCollapseButton" onClick={() => setLibraryCollapsed(value => !value)} title={libraryCollapsed ? "Expand DNA library" : "Collapse DNA library"}>{libraryCollapsed ? "›" : "‹"}</button></div></div>
      {libraryCollapsed && <button type="button" className="molecularRailLabel" onClick={() => setLibraryCollapsed(false)}><span>DNA & RNA</span></button>}
      <button className="importSequenceButton" onClick={()=>setShowImport(true)}><UploadIcon size={16}/> Import sequences</button>
      <div className="sequenceLibraryList">{state?.sequences.map(item=><button key={item.id} className={activeId===item.id?"active":""} onClick={()=>{setActiveId(item.id);setSelectedFeatureId("");setSelection(null);setRotation(0);setZoom(1);setMapPanelMode(item.topology==="Linear"?"linear":"plasmid")}}><span className="sequenceTypeBadge">{item.topology==="Circular"?"◉":"━"}</span><div><strong>{item.name}</strong><span>{dnaLength(item.sequence).toLocaleString()} bp · {item.features.length} features</span></div></button>)}</div>
    </aside>

    <main className="molecularMain">
      {!record ? <div className="emptyState moleculeEmpty"><div className="emptyIcon">DNA</div><strong>Create or import a sequence</strong><p>OpenLab supports FASTA, GenBank, CSV, TSV, JSON and raw DNA text.</p><div className="buttonRow"><button className="primaryButton" onClick={()=>setShowImport(true)}>Import sequence</button><button className="ghostButton" onClick={createBlank}>Blank DNA</button></div></div> : <>
        <header className="molecularTopbar"><div className="molecularIdentity"><span className="entityBadge">{record.moleculeType}</span><div><input value={record.name} onChange={event=>save({...record,name:event.target.value})}/><small>{dnaLength(record.sequence).toLocaleString()} bp · {gcPercent(record.sequence).toFixed(1)}% GC · {record.topology}{record.accession?` · ${record.accession}`:""}</small></div></div><div className="molecularActions"><button className="ghostButton" onClick={()=>captureVersion()}>Save version</button><button className="ghostButton" onClick={()=>setShowVersions(true)}>History ({record.versions?.length||0})</button><button className="ghostButton" onClick={reverseComplementRecord}>Reverse complement</button><button className="ghostButton" onClick={linkToRegistry}>{linkedEntity?`Registry: ${linkedEntity.name}`:"Link to registry"}</button><div className="exportMenu"><button className="ghostButton"><DownloadIcon size={15}/> Export</button><div><button onClick={()=>download("fasta")}>FASTA</button><button onClick={()=>download("genbank")}>GenBank</button></div></div><button className="dangerGhost compactDanger" onClick={deleteSequence}><TrashIcon size={15}/></button></div></header>

        <div className={`molecularToolbarV1 ${toolbarCollapsed ? "controls-collapsed" : ""}`}>
          <div className="workspaceTabs"><button className={view==="split"?"active":""} onClick={()=>setView("split")}>Split</button><button className={view==="map"?"active":""} onClick={()=>setView("map")}>Map</button><button className={view==="sequence"?"active":""} onClick={()=>setView("sequence")}>Sequence</button></div>
          <label className="sequenceFind"><span>Find IUPAC</span><input value={find} onChange={event=>setFind(event.target.value)} placeholder="DNA motif (e.g. GGNCC)…"/>{find&&<b>{findHits.length} ({forwardHits}+ / {reverseHits}−)</b>}</label>
          <label className="toolbarSelect">Code<select value={record.translationTable||11} onChange={event=>save({...record,translationTable:Number(event.target.value) as 1|11})}><option value={11}>11 · Bacterial</option><option value={1}>1 · Standard</option></select></label>
          <label className="toolbarSelect">Topology<select value={record.topology} onChange={event=>save({...record,topology:event.target.value as SequenceRecord["topology"]})}><option>Circular</option><option>Linear</option></select></label>
          <label className="toolbarCheckbox"><input type="checkbox" checked={showRestrictionSites} onChange={event=>setShowRestrictionSites(event.target.checked)}/> Restriction marks</label>{message&&<span className="saveToast">{message}</span>}<button type="button" className="toolbarCollapseButton" onClick={() => setToolbarCollapsed(value => !value)}>{toolbarCollapsed ? "Show controls" : "Hide controls"}</button>
        </div>

        <div className={`molecularEditorGrid view-${view} ${inspectorCollapsed ? "inspector-collapsed" : ""}`}>
          <section className={`molecularInspector ${inspectorCollapsed ? "collapsed" : ""}`}><div className="inspectorTitle">{!inspectorCollapsed && <div><strong>Annotations</strong><span>{record.features.length} features · {record.primers.length} primers</span></div>}<div className="inspectorTitleActions"><button type="button" className="paneCollapseButton" onClick={() => setInspectorCollapsed(value => !value)} title={inspectorCollapsed ? "Expand annotations" : "Collapse annotations"}>{inspectorCollapsed ? "›" : "‹"}</button>{!inspectorCollapsed && <button onClick={addFeature} title="Add annotation"><PlusIcon size={15}/></button>}</div></div>{inspectorCollapsed && <button type="button" className="molecularRailLabel" onClick={() => setInspectorCollapsed(false)}><span>ANNOTATIONS</span></button>}
            <div className="featureListV1">{record.features.map(feature=><button key={feature.id} className={selectedFeatureId===feature.id?"active":""} onClick={()=>{setSelectedFeatureId(feature.id);setSelection({start:feature.start,end:feature.end})}}><i style={{background:feature.color}}/><div><strong>{feature.name} <em>{feature.direction===-1?"← −":"→ +"}</em></strong><span>{feature.start+1}–{feature.end+1} · {feature.type}</span></div></button>)}</div>
            {selectedFeature&&<div className="featureEditorV1"><div className="featureEditorHead"><strong>Edit feature</strong><button onClick={deleteFeature}><TrashIcon size={14}/></button></div><label><span>Name</span><input value={selectedFeature.name} onChange={event=>patchFeature({name:event.target.value})}/></label><label><span>Type</span><input value={selectedFeature.type} onChange={event=>patchFeature({type:event.target.value})}/></label><div className="formGrid twoCol"><label><span>Start</span><input type="number" min="1" max={record.sequence.length} value={selectedFeature.start+1} onChange={event=>patchFeature({start:Math.max(0,Number(event.target.value)-1)})}/></label><label><span>End</span><input type="number" min="1" max={record.sequence.length} value={selectedFeature.end+1} onChange={event=>patchFeature({end:Math.max(0,Number(event.target.value)-1)})}/></label></div><label><span>Strand / direction</span><select value={selectedFeature.direction} onChange={event=>patchFeature({direction:Number(event.target.value) as 1|-1})}><option value={1}>Forward (+) →</option><option value={-1}>Reverse (−) ←</option></select></label>{selectedFeature.type.toLowerCase()==="cds"&&<div className="formGrid twoCol"><label><span>Reading frame / codon start</span><select value={selectedFeature.codonStart||1} onChange={event=>patchFeature({codonStart:Number(event.target.value) as 1|2|3})}><option value={1}>1 · first base</option><option value={2}>2 · skip 1 base</option><option value={3}>3 · skip 2 bases</option></select></label><label><span>Genetic code</span><select value={selectedFeature.translationTable||record.translationTable||11} onChange={event=>patchFeature({translationTable:Number(event.target.value) as 1|11})}><option value={11}>11 · Bacterial/archaeal/plastid</option><option value={1}>1 · Standard</option></select></label></div>}<label><span>Color</span><input type="color" value={selectedFeature.color} onChange={event=>patchFeature({color:event.target.value})}/></label><label><span>Annotation source</span><input value={selectedFeature.source||""} onChange={event=>patchFeature({source:event.target.value})} placeholder="GenBank / manual / publication…"/></label><label><span>Notes</span><textarea rows={3} value={selectedFeature.notes||""} onChange={event=>patchFeature({notes:event.target.value})}/></label>{selectedFeature.type.toLowerCase()==="cds"&&<div className="translationPreview"><span>Translation · table {selectedFeature.translationTable||record.translationTable||11} · frame {selectedFeature.codonStart||1} · {selectedFeature.direction===-1?"reverse strand":"forward strand"}</span><code>{translateFeature(record,selectedFeature).slice(0,180)}{translateFeature(record,selectedFeature).length>180?"…":""}</code></div>}</div>}
            {!!record.primers.length&&<div className="primerLibrarySmall"><strong>Primers</strong>{record.primers.map(primer=><div key={primer.id}><i style={{background:primer.color}}/><span>{primer.name}</span><button onClick={()=>save({...record,primers:record.primers.filter(item=>item.id!==primer.id)})}>×</button></div>)}</div>}
          </section>

          {(view==="split"||view==="map")&&<section className="mapPaneV1"><div className="paneHeadV1 paneHeadV1Stack"><div><strong>{mapPanelMode==="metadata"?"Sequence metadata":mapPanelMode==="linear"?"Linear sequence map":"Plasmid map"}</strong><span>{mapPanelMode==="metadata"?"record summary, source and translation settings":mapPanelMode==="linear"?"coordinates, directional annotations and restriction sites":"base 1 defaults to 12 o’clock · arrows show strand direction · unique cutters labeled"}</span></div><div className="mapSubtabs mapSubtabsProminent"><button className={mapPanelMode==="linear"?"active":""} onClick={()=>setMapPanelMode("linear")}>LINEAR MAP</button><button className={mapPanelMode==="plasmid"?"active":""} onClick={()=>setMapPanelMode("plasmid")}>PLASMID MAP</button><button className={mapPanelMode==="metadata"?"active":""} onClick={()=>setMapPanelMode("metadata")}>METADATA</button></div></div>{mapPanelMode==="metadata"?<div className="mapMetadataPanel"><div className="metadataCardGrid"><div className="metadataPanelCard"><span>Length</span><strong>{dnaLength(record.sequence).toLocaleString()} bp</strong></div><div className="metadataPanelCard"><span>GC content</span><strong>{gcPercent(record.sequence).toFixed(1)}%</strong></div><div className="metadataPanelCard"><span>Topology</span><strong>{record.topology}</strong></div><div className="metadataPanelCard"><span>Translation</span><strong>Table {record.translationTable||11}</strong></div></div><div className="metadataTwoCol"><div className="metadataPanelBlock"><strong>Reference provenance</strong><ul><li>Accession: {record.accession||"Not set"}</li><li>Source: {record.sourceLabel||"Not set"}</li><li>Annotation source: {record.annotationSource||"Not set"}</li><li>Updated: {new Date(record.updatedAt).toLocaleString()}</li></ul>{record.sourceUrl&&<a href={record.sourceUrl} target="_blank" rel="noreferrer">Open source record ↗</a>}</div><div className="metadataPanelBlock"><strong>Annotation summary</strong>{record.features.length?<ul>{record.features.slice(0,10).map(feature=><li key={feature.id}>{feature.name} · {feature.start+1}–{feature.end+1} · {feature.direction===-1?"−":"+"} strand</li>)}</ul>:<p>No annotations yet.</p>}</div></div></div>:<CircularSequenceMap record={mapPanelMode==="linear"?{...record,topology:"Linear"}:record} selectedFeatureId={selectedFeatureId} onSelectFeature={id=>{setSelectedFeatureId(id);const feature=record.features.find(item=>item.id===id);if(feature)setSelection({start:feature.start,end:feature.end})}} rotation={rotation} onRotationChange={setRotation} zoom={zoom} onZoomChange={setZoom} showRestrictionSites={showRestrictionSites}/>}</section>}

          {(view==="split"||view==="sequence")&&<section className="sequencePaneV1"><div className="paneHeadV1"><div><strong>Sequence</strong><span>5′ → 3′ · IUPAC search scans both strands and circular origin</span></div><button className="ghostButton" onClick={beginRawEdit}>Edit raw sequence</button></div><SelectionSummary record={record} selection={selection}/><SequenceText record={record} find={find} selectedFeatureId={selectedFeatureId} onSelectFeature={id=>{setSelectedFeatureId(id);const feature=record.features.find(item=>item.id===id);if(feature)setSelection({start:feature.start,end:feature.end})}} selection={selection} onSelectionChange={setSelection}/></section>}
        </div>

        <section className={`analysisDock ${analysisCollapsed ? "collapsed" : ""}`}><div className="analysisTabs">{!analysisCollapsed && <><button className={analysisTab==="primers"?"active":""} onClick={()=>setAnalysisTab("primers")}>Primer design & PCR</button><button className={analysisTab==="restriction"?"active":""} onClick={()=>setAnalysisTab("restriction")}>Digest & virtual gel</button><button className={analysisTab==="orfs"?"active":""} onClick={()=>setAnalysisTab("orfs")}>ORF finder</button></>}{analysisCollapsed && <span className="analysisCollapsedLabel">Analysis tools</span>}<button type="button" className="analysisCollapseButton" onClick={() => setAnalysisCollapsed(value => !value)}>{analysisCollapsed ? "Expand tools" : "Collapse tools"}</button></div>{!analysisCollapsed && <>{analysisTab==="primers"&&<PrimerPanel record={record} onChange={save}/>} {analysisTab==="restriction"&&<RestrictionPanel record={record}/>} {analysisTab==="orfs"&&<OrfPanel record={record}/>}</>}</section>
      </>}
    </main>

    {showImport&&<SequenceImportDialog onClose={()=>setShowImport(false)} onImport={importRecords}/>} 
    {rawEditing&&record&&<div className="importModalBackdrop"><div className="importModal rawEditModal"><div className="importModalHead"><div><span>EDIT SEQUENCE</span><strong>{record.name}</strong><p>Whitespace and numbers are ignored. IUPAC DNA symbols are accepted; U is normalized to T.</p></div><button className="modalClose" onClick={()=>setRawEditing(false)}>×</button></div><textarea className="rawSequenceArea" value={rawSequence} onChange={event=>setRawSequence(event.target.value.toUpperCase())}/><div className="rawSequenceStats">Parsed length: {cleanDna(rawSequence).length.toLocaleString()} bp</div><div className="importModalActions"><button className="ghostButton" onClick={()=>setRawEditing(false)}>Cancel</button><button className="primaryButton" onClick={applyRawEdit}>Apply sequence</button></div></div></div>}
    {showVersions&&record&&<VersionHistory record={record} onClose={()=>setShowVersions(false)} onRestore={restoreVersion}/>} 
  </div>
}

function translateFeature(record: SequenceRecord, feature: SequenceFeature) { const raw=record.sequence.slice(feature.start,feature.end+1); const frame=(feature.codonStart||1)-1; return translateDna(feature.direction===-1?reverseComplement(raw):raw,frame,feature.translationTable||record.translationTable||11,true) }

function SelectionSummary({ record, selection }: { record: SequenceRecord; selection: SequenceSelection }) {
  if (!selection) return <div className="sequenceSelectionSummary quiet">Drag across bases to inspect a range. Feature clicks synchronize the annotation list, map and sequence.</div>
  const start=Math.min(selection.start,selection.end); const end=Math.max(selection.start,selection.end); const seq=record.sequence.slice(start,end+1); const tm=seq.length<=100?`${oligoTm(seq).toFixed(1)} °C est.`:"—"
  return <div className="sequenceSelectionSummary"><span><b>{start+1}–{end+1}</b> coordinates</span><span><b>{seq.length}</b> bp</span><span><b>{gcPercent(seq).toFixed(1)}%</b> GC</span><span title="Tm uses OpenLab's simple oligo estimate and is suppressed for long selections"><b>{tm}</b> Tm</span><code>{seq.length<=50?seq:`${seq.slice(0,24)}…${seq.slice(-24)}`}</code></div>
}

function SequenceText({ record, find, selectedFeatureId, onSelectFeature, selection, onSelectionChange }: { record: SequenceRecord; find: string; selectedFeatureId: string; onSelectFeature: (id:string)=>void; selection: SequenceSelection; onSelectionChange:(selection:SequenceSelection)=>void }) {
  const hostRef=useRef<HTMLDivElement|null>(null); const dragStart=useRef<number|null>(null); const [basesPerRow,setBasesPerRow]=useState(50)
  const matches=useMemo(()=>find.trim()?findMotifMatches(record.sequence,find,record.topology==="Circular",true):[],[record.sequence,record.topology,find]); const motifLength=cleanDna(find).length
  useEffect(()=>{ const host=hostRef.current; if(!host)return; const update=()=>{const width=host.clientWidth; const estimate=Math.floor(Math.max(20,Math.min(80,(width-88)/9))/10)*10; setBasesPerRow(Math.max(20,estimate||20))}; update(); const ro=new ResizeObserver(update); ro.observe(host); return()=>ro.disconnect() },[])
  useEffect(()=>{ const up=()=>{dragStart.current=null}; window.addEventListener("pointerup",up); return()=>window.removeEventListener("pointerup",up) },[])
  useEffect(()=>{ if(!selectedFeatureId)return; const feature=record.features.find(item=>item.id===selectedFeatureId); if(!feature)return; hostRef.current?.querySelector(`[data-base-index="${feature.start}"]`)?.scrollIntoView({block:"center",behavior:"smooth"}) },[selectedFeatureId,record.features])
  const rows:{start:number;text:string}[]=[]; for(let index=0;index<record.sequence.length;index+=basesPerRow) rows.push({start:index,text:record.sequence.slice(index,index+basesPerRow)})
  const range=selection?{start:Math.min(selection.start,selection.end),end:Math.max(selection.start,selection.end)}:null
  const isHit=(index:number)=>matches.some(match=>{ if(!motifLength)return false; const rel=(index-match.position+record.sequence.length)%record.sequence.length; return record.topology==="Circular"?rel<motifLength:(index>=match.position&&index<match.position+motifLength) })
  return <div className="sequenceTextV2" ref={hostRef}>{rows.map(row=>{ const rowEnd=row.start+row.text.length-1; const overlappingFeatures=record.features.filter(feature=>feature.start<=rowEnd&&feature.end>=row.start); const cds=overlappingFeatures.filter(feature=>feature.type.toLowerCase()==="cds"); return <div className="sequenceRowV2" key={row.start}>
    <div className="sequenceRowMain"><span className="sequenceCoord">{row.start+1}</span><code className="sequenceBases">{[...row.text].map((base,offset)=>{ const index=row.start+offset; const features=overlappingFeatures.filter(feature=>index>=feature.start&&index<=feature.end); const primary=features.find(feature=>feature.id===selectedFeatureId)||features[0]; const selected=range&&index>=range.start&&index<=range.end; return <span key={index} data-base-index={index} className={`${isHit(index)?"motifHit":""} ${selected?"rangeSelected":""} ${primary?.id===selectedFeatureId?"featureSelectedBase":""}`} style={primary?{borderBottomColor:primary.color}:undefined} title={features.map(feature=>`${feature.name} (${feature.direction===-1?"−":"+"})`).join(", ")} onClick={()=>{if(primary)onSelectFeature(primary.id)}} onPointerDown={event=>{event.preventDefault();dragStart.current=index;onSelectionChange({start:index,end:index})}} onPointerEnter={()=>{if(dragStart.current!==null)onSelectionChange({start:dragStart.current,end:index})}}>{base}</span>})}</code><span className="sequenceCoord end">{rowEnd+1}</span></div>
    {!!overlappingFeatures.length&&<div className="sequenceFeatureBars">{overlappingFeatures.map(feature=>{ const left=Math.max(feature.start,row.start)-row.start; const right=Math.min(feature.end,rowEnd)-row.start; const leftPct=left/row.text.length*100; const widthPct=(right-left+1)/row.text.length*100; return <button key={feature.id} className={feature.id===selectedFeatureId?"active":""} style={{left:`${leftPct}%`,width:`${widthPct}%`,background:feature.color}} onClick={()=>onSelectFeature(feature.id)} title={`${feature.name} · ${feature.direction===-1?"reverse":"forward"} strand`}>{widthPct>18?`${feature.name} ${feature.direction===-1?"←":"→"}`:""}</button>})}</div>}
    {cds.map(feature=><TranslationStrip key={feature.id} record={record} feature={feature} rowStart={row.start} rowEnd={rowEnd}/>)}
  </div>})}{!record.sequence.length&&<div className="analysisEmpty">This sequence is empty. Use Edit raw sequence or Import sequences.</div>}</div>
}

function TranslationStrip({record,feature,rowStart,rowEnd}:{record:SequenceRecord;feature:SequenceFeature;rowStart:number;rowEnd:number}) {
  const overlapStart=Math.max(rowStart,feature.start); const overlapEnd=Math.min(rowEnd,feature.end); if(overlapStart>overlapEnd)return null
  const protein=translateFeature(record,feature); let aaStart:number; let aaEnd:number
  const frameOffset=(feature.codonStart||1)-1
  if(feature.direction===1){aaStart=Math.floor((overlapStart-feature.start-frameOffset)/3);aaEnd=Math.ceil((overlapEnd-feature.start+1-frameOffset)/3)} else {aaStart=Math.floor((feature.end-overlapEnd-frameOffset)/3);aaEnd=Math.ceil((feature.end-overlapStart+1-frameOffset)/3)}
  return <div className="sequenceTranslationStrip" style={{borderLeftColor:feature.color}}><span>{feature.name} {feature.direction===-1?"← −":"→ +"} · table {feature.translationTable||record.translationTable||11} · frame {feature.codonStart||1}</span><code>{protein.slice(Math.max(0,aaStart),Math.max(aaStart,aaEnd))||"·"}</code></div>
}

function VersionHistory({record,onClose,onRestore}:{record:SequenceRecord;onClose:()=>void;onRestore:(version:SequenceVersion)=>void}) { return <div className="importModalBackdrop"><div className="importModal versionModal"><div className="importModalHead"><div><span>SEQUENCE PROVENANCE</span><strong>{record.name} version history</strong><p>Manual and safety checkpoints preserve the sequence, annotations, primer positions and topology.</p></div><button className="modalClose" onClick={onClose}>×</button></div><div className="versionList">{(record.versions||[]).map(version=><div key={version.id}><div><strong>{version.label}</strong><span>{new Date(version.createdAt).toLocaleString()} · {version.sequence.length.toLocaleString()} bp · {version.features.length} features</span></div><button onClick={()=>onRestore(version)}>Restore</button></div>)}{!(record.versions||[]).length&&<div className="analysisEmpty">No checkpoints yet. Use Save version before a major edit.</div>}</div></div></div> }
