"use client"

import { useEffect, useMemo, useRef, useState } from "react"

type ViewerStyle = "stick" | "sphere" | "line" | "cartoon"
type SupportedFormat = "pdb" | "sdf" | "mol2" | "xyz" | "cif" | "mol"
type Point3D = { x: number; y: number; z: number }

function finitePoint(values: string[]): Point3D | null {
  const [x,y,z]=values.map(Number); return [x,y,z].every(Number.isFinite)?{x,y,z}:null
}

function tokenizeCifRow(line: string) {
  const tokens: string[] = []
  const regex = /(?:"([^"]*)"|'([^']*)'|(\S+))/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(line))) tokens.push(match[1] ?? match[2] ?? match[3])
  return tokens
}

function cifCoordinates(lines: string[]) {
  const points: Point3D[] = []
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].trim() !== "loop_") continue
    const headers: string[] = []
    let cursor = i + 1
    while (cursor < lines.length && lines[cursor].trim().startsWith("_")) {
      headers.push(lines[cursor].trim().split(/\s+/)[0])
      cursor += 1
    }
    const xIndex = headers.indexOf("_atom_site.Cartn_x")
    const yIndex = headers.indexOf("_atom_site.Cartn_y")
    const zIndex = headers.indexOf("_atom_site.Cartn_z")
    if (xIndex < 0 || yIndex < 0 || zIndex < 0) continue
    for (; cursor < lines.length; cursor += 1) {
      const trimmed = lines[cursor].trim()
      if (!trimmed || trimmed === "#") { if (trimmed === "#") break; continue }
      if (trimmed === "loop_" || trimmed.startsWith("_") || trimmed.startsWith("data_") || trimmed.startsWith("save_")) break
      const tokens = tokenizeCifRow(trimmed)
      if (tokens.length < headers.length) continue
      const p = finitePoint([tokens[xIndex], tokens[yIndex], tokens[zIndex]])
      if (p) points.push(p)
    }
    if (points.length) break
  }
  return points
}

function extractCoordinates(data: string, format: SupportedFormat) {
  const lines=data.split(/\r?\n/); const points:Point3D[]=[]
  if(format==="pdb") for(const line of lines){ if(line.startsWith("ATOM  ")||line.startsWith("HETATM")){ const p=finitePoint([line.slice(30,38).trim(),line.slice(38,46).trim(),line.slice(46,54).trim()]); if(p)points.push(p) } }
  else if(format==="xyz") for(const line of lines.slice(2)){ const parts=line.trim().split(/\s+/); if(parts.length>=4){ const p=finitePoint(parts.slice(1,4)); if(p)points.push(p) } }
  else if(format==="mol"||format==="sdf") { const count=Number(lines[3]?.slice(0,3).trim()); const atomLines=Number.isFinite(count)?lines.slice(4,4+count):lines.slice(4); for(const line of atomLines){ const p=finitePoint([line.slice(0,10).trim(),line.slice(10,20).trim(),line.slice(20,30).trim()]); if(p)points.push(p) } }
  else if(format==="mol2") { let inAtoms=false; for(const line of lines){ if(line.startsWith("@<TRIPOS>ATOM")){inAtoms=true;continue} if(inAtoms&&line.startsWith("@<TRIPOS>"))break; if(inAtoms){const parts=line.trim().split(/\s+/);if(parts.length>=5){const p=finitePoint(parts.slice(2,5));if(p)points.push(p)}} } }
  else if(format==="cif") return cifCoordinates(lines)
  return points
}

function pdbMetadata(data:string){
  const lines=data.split(/\r?\n/); const header=lines.find(line=>line.startsWith("HEADER"))||""; const id=header.length>=66?header.slice(62,66).trim():""; const method=lines.filter(line=>line.startsWith("EXPDTA")).map(line=>line.slice(10).trim()).join(" "); const resolutionLine=lines.find(line=>/^REMARK\s+2\s+RESOLUTION\./.test(line)); const resolution=resolutionLine?.match(/RESOLUTION\.\s+([0-9.]+)\s+ANGSTROMS/i)?.[1]||""; const title=lines.filter(line=>line.startsWith("TITLE ")).map(line=>line.slice(10).trim()).join(" "); return {id,method,resolution,title}
}

export default function Molecule3DViewer({ data, format, style = "stick", spin = false }: { data: string; format: SupportedFormat; style?: ViewerStyle; spin?: boolean }) {
  const hostRef=useRef<HTMLDivElement|null>(null); const viewerRef=useRef<any>(null); const [message,setMessage]=useState("Loading 3Dmol.js…")
  const inspection=useMemo(()=>{ const points=extractCoordinates(data,format); const z=points.map(point=>point.z); const zRange=z.length?Math.max(...z)-Math.min(...z):null; return {points:points.length,flat:zRange!==null&&points.length>=3&&zRange<0.01,zRange,metadata:format==="pdb"?pdbMetadata(data):null} },[data,format])

  useEffect(()=>{ let cancelled=false; let resize:ResizeObserver|null=null; async function render(){ if(!hostRef.current||!data.trim()){setMessage("Paste or upload molecular coordinates to begin.");return} setMessage("Loading 3Dmol.js…"); try{ const imported:any=await import("3dmol/build/3Dmol.js"); if(cancelled||!hostRef.current)return; const $3Dmol=imported.default||imported; hostRef.current.innerHTML=""; const viewer=$3Dmol.createViewer(hostRef.current,{backgroundColor:"white",antialias:true}); viewerRef.current=viewer; viewer.addModel(data,format==="mol"?"sdf":format); if(style==="cartoon")viewer.setStyle({},{cartoon:{color:"spectrum"},stick:{radius:.12}}); if(style==="sphere")viewer.setStyle({},{sphere:{scale:.3},stick:{radius:.08}}); if(style==="line")viewer.setStyle({},{line:{}}); if(style==="stick")viewer.setStyle({},{stick:{radius:.18}}); viewer.zoomTo(); viewer.render(); viewer.spin(spin?"y":false); resize=new ResizeObserver(()=>viewer.resize()); resize.observe(hostRef.current); setMessage("") }catch(error){setMessage(error instanceof Error?error.message:"3D viewer failed to initialize.")} } render(); return()=>{cancelled=true;resize?.disconnect();try{viewerRef.current?.spin(false);viewerRef.current?.clear()}catch{}viewerRef.current=null} },[data,format,style,spin])

  return <div className="chem3dFrame">
    {!!data.trim()&&<div className="chem3dIntegrityBar">
      {inspection.flat&&<span className="warning">⚠ Coordinates appear planar (z-range &lt; 0.01). Treat this as a 2D depiction, not a 3D conformation or docking pose.</span>}
      {!inspection.flat&&inspection.points>0&&<span>{inspection.points.toLocaleString()} atoms with parsed 3D coordinates{inspection.zRange!==null?` · z-range ${inspection.zRange.toFixed(2)} Å`:""}</span>}
      {inspection.metadata&&<span className="pdbMeta">{inspection.metadata.id&&<b>PDB {inspection.metadata.id}</b>}{inspection.metadata.resolution&&<> · {inspection.metadata.resolution} Å</>}{inspection.metadata.method&&<> · {inspection.metadata.method}</>}{inspection.metadata.title&&<small>{inspection.metadata.title}</small>}</span>}
    </div>}
    <div ref={hostRef} className="chem3dCanvas" />
    {message&&<div className="chem3dMessage">{message}</div>}
  </div>
}
