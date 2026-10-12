"use client"
import { useEffect, useState } from "react"
import { localeStorageKey, translate, zhTW, type Locale } from "@/lib/i18n"
const englishByChinese = new Map(Object.entries(zhTW).map(([en, zh]) => [zh, en]))

/** Translates exact known UI labels, not content entered or stored by researchers. */
export default function InterfaceLanguage() {
 const [locale, setLocale] = useState<Locale>("en")
 useEffect(() => {
   const saved = localStorage.getItem(localeStorageKey)
   if (saved === "zh-TW") setLocale("zh-TW")
 }, [])
 useEffect(() => {
   document.documentElement.lang = locale
   localStorage.setItem(localeStorageKey, locale)
   window.dispatchEvent(new Event("openlab:language"))
   let pending = false
   const originals = new WeakMap<Text, string>()
   const attributes = new WeakMap<Element, Record<string,string>>()
   const apply = () => {
     pending = false
     const root = document.querySelector(".shell")
     if (!root) return
     const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
     let node: Node | null
     while ((node = walker.nextNode())) {
       const textNode = node as Text
       const parent = textNode.parentElement
       if (!parent || parent.closest("input,textarea,select,option,code,pre,svg,[contenteditable],.chem2dViewport,.notebookDocument")) continue
       const current = textNode.nodeValue || ""
       const saved = originals.get(textNode)
       const original = saved !== undefined && (current === translate(saved, "zh-TW") || current === saved) ? saved : current.replace(/^(\s*)(.*?)(\s*)$/s, (_full, pre: string, term: string, post: string) => pre + (englishByChinese.get(term) || term) + post)
       if (!zhTW[original.trim()] && saved === undefined) continue
       originals.set(textNode, original)
       const whitespace = original.match(/^(\s*)(.*?)(\s*)$/s)
       if (!whitespace) continue
       const translated = whitespace[1] + translate(whitespace[2], locale) + whitespace[3]
       if (textNode.nodeValue !== translated) textNode.nodeValue = translated
     }
     root.querySelectorAll("input[placeholder],textarea[placeholder],button[title]").forEach(element => {
       if (element.closest(".notebookDocument")) return
       const keys = element.tagName === "BUTTON" ? ["title"] : ["placeholder"]
       const originalValues = attributes.get(element) || {}
       keys.forEach(key => {
         const current = element.getAttribute(key) || ""
         const base = originalValues[key] || englishByChinese.get(current) || current
         if (!zhTW[base]) return
         originalValues[key] = base
         const next = translate(base, locale)
         if (next !== current) element.setAttribute(key, next)
       })
       attributes.set(element, originalValues)
     })
   }
   const schedule = () => { if (!pending) { pending = true; queueMicrotask(apply) } }
   apply()
   const observer = new MutationObserver(schedule)
   observer.observe(document.body, { subtree: true, childList: true, characterData: true })
   return () => observer.disconnect()
 }, [locale])
 return <label className="interfaceLanguage" aria-label="Interface language"><span>🌐</span><select value={locale} onChange={event => setLocale(event.target.value as Locale)} aria-label="Language / 語言"><option value="en">English</option><option value="zh-TW">繁體中文（台灣）</option></select></label>
}
