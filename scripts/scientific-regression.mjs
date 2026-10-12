import fs from "node:fs"
import path from "node:path"
import process from "node:process"

const root = process.cwd()
const seedSource = fs.readFileSync(path.join(root, "lib", "seed.ts"), "utf8")
const chemistrySource = fs.readFileSync(path.join(root, "components", "ChemistryWorkspace.tsx"), "utf8")
const sequenceSource = fs.readFileSync(path.join(root, "lib", "sequence.ts"), "utf8")

function fail(message) {
  throw new Error(`Scientific regression failed: ${message}`)
}
function assert(condition, message) { if (!condition) fail(message) }
function near(actual, expected, tolerance, label) {
  if (!Number.isFinite(actual) || Math.abs(actual - expected) > tolerance) {
    fail(`${label}: expected ${expected} ± ${tolerance}, got ${actual}`)
  }
}

function extractQuotedConstant(source, name) {
  const match = source.match(new RegExp(`const\\s+${name}\\s*=\\s*[\"'\\\`]([^\"'\\\`]+)[\"'\\\`]`))
  if (!match) fail(`Could not locate ${name}`)
  return match[1]
}

function findAll(sequence, motif) {
  const out = []
  let from = 0
  while (from <= sequence.length - motif.length) {
    const hit = sequence.indexOf(motif, from)
    if (hit < 0) break
    out.push(hit + 1) // report one-based recognition-site start
    from = hit + 1
  }
  return out
}

// Guard against formatted DNA text being counted as bases. This reproduces
// the reported failure mode: 4,361 biological bases + 45 newline characters
// yields a raw JavaScript string length of 4,406.
const synthetic4361 = "G".repeat(2355) + "A".repeat(2006)
const chunks = []
let cursor = 0
for (let line = 0; line < 46; line += 1) {
  const remainingLines = 46 - line
  const remainingBases = synthetic4361.length - cursor
  const take = line === 45 ? remainingBases : Math.floor(remainingBases / remainingLines)
  chunks.push(synthetic4361.slice(cursor, cursor + take))
  cursor += take
}
const formatted4361 = chunks.join("\n")
assert(formatted4361.length === 4406, `newline regression fixture drifted: expected raw length 4406, got ${formatted4361.length}`)
const normalized4361 = formatted4361.toUpperCase().replace(/U/g, "T").replace(/[^ACGTRYSWKMBDHVN]/g, "")
assert(normalized4361.length === 4361, `formatted sequence normalization failed: expected 4361 bp, got ${normalized4361.length}`)
const normalizedGc = [...normalized4361].filter(base => base === "G" || base === "C").length / normalized4361.length * 100
near(normalizedGc, 54.0, 0.05, "formatted 4,361-bp GC%")
assert(sequenceSource.includes('replace(/[^ACGTRYSWKMBDHVN]/g, "")'), "cleanDna must explicitly strip non-IUPAC formatting characters")

const pUC19 = extractQuotedConstant(seedSource, "pUC19")
assert(pUC19.length === 2686, `pUC19 length drifted: expected 2686 bp, got ${pUC19.length}`)
const gc = [...pUC19].filter(base => base === "G" || base === "C").length / pUC19.length * 100
near(gc, 50.6329113924, 0.000001, "pUC19 GC%")

const pUC19Sites = {
  EcoRI: [396],
  SacI: [402],
  KpnI: [408],
  BamHI: [417],
  XbaI: [423],
  SalI: [429],
  PstI: [435],
  SphI: [441],
  HindIII: [447],
}
const motifs = {
  EcoRI: "GAATTC",
  SacI: "GAGCTC",
  KpnI: "GGTACC",
  BamHI: "GGATCC",
  XbaI: "TCTAGA",
  SalI: "GTCGAC",
  PstI: "CTGCAG",
  SphI: "GCATGC",
  HindIII: "AAGCTT",
}
for (const [enzyme, expected] of Object.entries(pUC19Sites)) {
  const hits = findAll(pUC19, motifs[enzyme])
  assert(JSON.stringify(hits) === JSON.stringify(expected), `${enzyme} pUC19 recognition sites drifted: expected ${expected}, got ${hits}`)
}

// Protect the strand/origin corrections in the starter pUC19 record.
assert(/name:\s*"lacZα"[^\n]+direction:\s*-1/.test(seedSource), "lacZα must remain annotated on the reverse (−) strand")
assert(/name:\s*"bla \(AmpR\)"[^\n]+direction:\s*-1/.test(seedSource), "bla (AmpR) must remain annotated on the reverse (−) strand")
assert(seedSource.includes('accession: "L09137.2"'), "pUC19 starter accession must remain L09137.2")
assert(seedSource.includes("pMB1/ColE1 origin (pUC high-copy mutant)"), "pUC high-copy origin annotation note is missing")
assert(/name:\s*"lacZα"[^\n]+start:\s*145[^\n]+end:\s*468/.test(seedSource), "lacZα starter coordinates must remain 146–469 one-based")
assert(/name:\s*"bla \(AmpR\)"[^\n]+start:\s*1625[^\n]+end:\s*2485/.test(seedSource), "bla starter coordinates must remain 1626–2486 one-based")
const reverseComplement = sequence => sequence.replace(/A/g, "t").replace(/T/g, "a").replace(/G/g, "c").replace(/C/g, "g").toUpperCase().split("").reverse().join("")
assert(reverseComplement(pUC19.slice(145, 469)).startsWith("ATG"), "lacZα reverse-strand CDS no longer starts with ATG at the guarded coordinates")
assert(reverseComplement(pUC19.slice(1625, 2486)).startsWith("ATG"), "bla reverse-strand CDS no longer starts with ATG at the guarded coordinates")

// Protect translation-table/GenBank qualifier handling used by CDS views.
assert(sequenceSource.includes('new Set(["TTG", "CTG", "ATT", "ATC", "ATA", "ATG", "GTG"])'), "translation table 11 bacterial initiation-codon guard is missing")
assert(sequenceSource.includes('/codon_start=') && sequenceSource.includes('/transl_table='), "GenBank CDS codon_start/transl_table import/export handling is missing")

// Protect Type IIS recognition/cut-offset metadata used by the restriction workbench.
for (const [enzyme, motif, top, bottom] of [
  ["BsaI", "GGTCTC", 7, 11],
  ["BsmBI", "CGTCTC", 7, 11],
  ["BbsI", "GAAGAC", 8, 12],
  ["SapI", "GCTCTTC", 8, 11],
]) {
  assert(sequenceSource.includes(`name: "${enzyme}"`), `${enzyme} definition is missing`)
  assert(sequenceSource.includes(`motif: "${motif}"`), `${enzyme} recognition sequence drifted`)
  assert(sequenceSource.includes(`cutForward: ${top}`) && sequenceSource.includes(`cutReverse: ${bottom}`), `${enzyme} cut offsets are missing or changed`)
}

function extractPreset(name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const match = chemistrySource.match(new RegExp(`name:\\s*"${escaped}"\\s*,\\s*smiles:\\s*"([^"]+)"`))
  if (!match) fail(`Chemistry preset ${name} is missing`)
  return match[1]
}

// Small, intentionally limited SMILES graph parser used only as an independent
// build-time guard for the bundled reference molecules. The application itself
// uses RDKit in the browser for scientific chemistry calculations.
function formulaFromSmiles(smiles) {
  const atoms = []
  const bonds = []
  const stack = []
  const rings = new Map()
  let current = null
  let pending = null

  const addBond = (a, b, order) => { if (a !== null && b !== null) bonds.push([a, b, order]) }
  function parseAtom(i) {
    const c = smiles[i]
    if (c === "[") {
      const j = smiles.indexOf("]", i + 1)
      if (j < 0) fail(`Malformed bracket atom in ${smiles}`)
      const inner = smiles.slice(i + 1, j)
      const match = inner.match(/^([A-Z][a-z]?|[cnosp])(?:H(\d*)?)?/)
      if (!match) fail(`Unsupported bracket atom in regression SMILES: [${inner}]`)
      const token = match[1]
      return [{ element: token[0].toUpperCase() + token.slice(1), aromatic: /^[cnosp]$/.test(token), explicitH: match[2] !== undefined ? (match[2] ? Number(match[2]) : 1) : 0 }, j + 1]
    }
    if (/[cnosp]/.test(c)) return [{ element: c.toUpperCase(), aromatic: true, explicitH: 0 }, i + 1]
    if (/[A-Z]/.test(c)) {
      const two = smiles.slice(i, i + 2)
      const element = /^(Cl|Br)$/.test(two) ? two : c
      return [{ element, aromatic: false, explicitH: 0 }, i + element.length]
    }
    return [null, i + 1]
  }

  for (let i = 0; i < smiles.length;) {
    const c = smiles[i]
    if (c === "(") { stack.push(current); i += 1; continue }
    if (c === ")") { current = stack.pop() ?? null; i += 1; continue }
    if (c === "=") { pending = 2; i += 1; continue }
    if (c === "#") { pending = 3; i += 1; continue }
    if (c === "-") { pending = 1; i += 1; continue }
    if (c === ":") { pending = 1.5; i += 1; continue }
    if (c === ".") { current = null; i += 1; continue }
    if (/\d/.test(c)) {
      if (rings.has(c)) {
        const [other, storedOrder] = rings.get(c)
        const order = pending ?? storedOrder ?? ((atoms[current]?.aromatic && atoms[other]?.aromatic) ? 1.5 : 1)
        addBond(current, other, order)
        rings.delete(c)
      } else rings.set(c, [current, pending])
      pending = null
      i += 1
      continue
    }
    const [atom, next] = parseAtom(i)
    if (atom) {
      const index = atoms.push(atom) - 1
      if (current !== null) {
        const order = pending ?? ((atoms[current].aromatic && atom.aromatic) ? 1.5 : 1)
        addBond(current, index, order)
      }
      current = index
      pending = null
      i = next
      continue
    }
    i += 1
  }

  const valence = { C: 4, N: 3, O: 2, S: 2, P: 3, F: 1, Cl: 1, Br: 1, I: 1 }
  const counts = {}
  atoms.forEach((atom, index) => {
    counts[atom.element] = (counts[atom.element] || 0) + 1
    let bondSum = atom.explicitH
    for (const [a, b, order] of bonds) if (a === index || b === index) bondSum += order
    const target = valence[atom.element] ?? 0
    const implicitH = Math.max(0, Math.round(target - (bondSum - atom.explicitH)))
    const h = atom.explicitH + implicitH
    if (h) counts.H = (counts.H || 0) + h
  })
  return counts
}

const mono = {
  H: 1.00782503223,
  C: 12,
  N: 14.00307400443,
  O: 15.99491461957,
  F: 18.99840316273,
  P: 30.97376199842,
  S: 31.9720711744,
  Cl: 34.968852682,
  Br: 78.9183376,
  I: 126.904468,
}
function formulaString(counts) {
  const keys = ["C", "H", ...Object.keys(counts).filter(key => key !== "C" && key !== "H").sort()]
  return keys.filter(key => counts[key]).map(key => `${key}${counts[key] === 1 ? "" : counts[key]}`).join("")
}
function monoisotopicMass(counts) {
  return Object.entries(counts).reduce((sum, [element, count]) => {
    if (!(element in mono)) fail(`No monoisotopic reference mass for ${element}`)
    return sum + mono[element] * count
  }, 0)
}

const chemistryRefs = {
  Aspirin: { formula: "C9H8O4", mono: 180.042258736 },
  Caffeine: { formula: "C8H10N4O2", mono: 194.08037556 },
  Acetaminophen: { formula: "C8H9NO2", mono: 151.063328528 },
  Ibuprofen: { formula: "C13H18O2", mono: 206.130679816 },
}
for (const [name, expected] of Object.entries(chemistryRefs)) {
  const smiles = extractPreset(name)
  const counts = formulaFromSmiles(smiles)
  const formula = formulaString(counts)
  assert(formula === expected.formula, `${name} bundled SMILES formula drifted: expected ${expected.formula}, got ${formula}`)
  near(monoisotopicMass(counts), expected.mono, 0.000001, `${name} monoisotopic mass guard`)
}

console.log("Scientific regression: PASS")
console.log(`  Sequence normalization: raw ${formatted4361.length} chars -> ${normalized4361.length} bp, ${normalizedGc.toFixed(1)}% GC`)
console.log(`  pUC19: ${pUC19.length} bp, ${gc.toFixed(4)}% GC, canonical MCS restriction positions verified`)
console.log("  pUC19 strand/origin/source annotations + CDS starts verified")
console.log("  Translation-table and GenBank CDS qualifier guards verified")
console.log("  Type IIS recognition/cut-offset metadata verified")
console.log("  Aspirin/caffeine/acetaminophen/ibuprofen reference structures verified by formula + monoisotopic mass")
