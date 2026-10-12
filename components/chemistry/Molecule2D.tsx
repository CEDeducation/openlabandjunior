"use client"

import { useCallback, useEffect, useRef, useState } from "react"

const MIN_ZOOM = 0.25
const MAX_ZOOM = 8
const clamp = (value: number) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value))

/** Zoom is applied to a full-size, centred image rather than to the layout box. */
export default function Molecule2D({ svg, alt = "2D molecular structure", compact = false }: { svg: string; alt?: string; compact?: boolean }) {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [expanded, setExpanded] = useState(false)
  const [lang, setLang] = useState("en")
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null)
  const viewport = useRef<HTMLDivElement>(null)

  const reset = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }) }, [])
  useEffect(() => { reset() }, [svg, reset])
  useEffect(() => {
    const update = () => setLang(document.documentElement.lang)
    update(); window.addEventListener("openlab:language", update)
    return () => window.removeEventListener("openlab:language", update)
  }, [])
  useEffect(() => {
    if (!expanded) return
    const keydown = (event: KeyboardEvent) => { if (event.key === "Escape") setExpanded(false) }
    window.addEventListener("keydown", keydown)
    return () => window.removeEventListener("keydown", keydown)
  }, [expanded])

  if (!svg) return <div className={`chem2dEmpty ${compact ? "compact" : ""}`}><span>2D structure</span><small>Analyze with RDKit to render.</small></div>
  const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  if (compact) return <div className="chem2dImage compact"><img src={src} alt={alt}/></div>

  const zh = lang === "zh-TW"
  const changeZoom = (factor: number) => setZoom(z => clamp(Math.round(z * factor * 100) / 100))
  return <div className={`chem2dImage chem2dInteractive ${expanded ? "expanded" : ""}`}>
    <div ref={viewport} className="chem2dViewport" role="img" aria-label={alt}
      onWheel={event => { event.preventDefault(); changeZoom(event.deltaY < 0 ? 1.15 : 1 / 1.15) }}
      onPointerDown={event => {
        if (event.button !== 0) return
        drag.current = { x: event.clientX, y: event.clientY, px: pan.x, py: pan.y }
        event.currentTarget.setPointerCapture(event.pointerId)
      }}
      onPointerMove={event => {
        if (!drag.current) return
        setPan({ x: drag.current.px + event.clientX - drag.current.x, y: drag.current.py + event.clientY - drag.current.y })
      }}
      onPointerUp={event => { drag.current = null; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId) }}
      onPointerCancel={() => { drag.current = null }}
      onDoubleClick={reset}
    ><div className="chem2dStage" style={{ transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})` }}><img src={src} alt="" draggable={false}/></div></div>
    <div className="chem2dZoomControls" role="group" aria-label={zh ? "分子結構縮放控制" : "Molecular zoom controls"}>
      <button type="button" onClick={() => changeZoom(1 / 1.25)} aria-label="Zoom out" title={zh ? "縮小" : "Zoom out"}>−</button>
      <span aria-live="polite">{Math.round(zoom * 100)}%</span>
      <button type="button" onClick={() => changeZoom(1.25)} aria-label="Zoom in" title={zh ? "放大" : "Zoom in"}>+</button>
      <button type="button" className="fit" onClick={reset}>{zh ? "適合視窗" : "Fit"}</button>
      <button type="button" className="expand" onClick={() => setExpanded(v => !v)}>{expanded ? (zh ? "關閉" : "Close") : (zh ? "展開" : "Expand")}</button>
    </div>
    <div className="chem2dInteractionHint">{zh ? "拖曳移動 · 滾輪或按鈕縮放 · 雙擊重設" : "Drag to pan · wheel or buttons to zoom · double-click to fit"}</div>
  </div>
}
