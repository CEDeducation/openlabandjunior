# OpenLab v2.0

OpenLab is a local-first collaborative research operating system for academic wet-lab and dry-lab teams. v2.0 keeps the existing account/profile, notebook, projects, protocols, registry, chemistry, evidence, automation, bioprocess, in-vivo, workflow and Supabase-sync functionality while substantially upgrading molecular biology and tightening scientific terminology/QA.

## Product areas

- **Home** — intentionally minimal: welcome actions, recent work and compact application launchers.
- **Bioresearch** — structured assay runs and numerical measurement capture.
- **Bioprocess** — process recipes, study conditions/replicates, guided batch execution and process observations.
- **Automation** — persistent workflow builder and run history; physical instruments still require vendor-specific connectors.
- **In Vivo** — study design, cohorts, animals and dose/measurement/sample/observation events.
- **Notebook** — experiment records, procedures, observations, results, links, tags and attachments.
- **Protocols / Registry / Workflows** — reusable methods, scientific entities and team tasks.
- **Molecular biology** — sequence import/editing, circular/linear maps, synchronized feature/sequence selection, strand-aware CDS translation, primers, restriction analysis, virtual digest/gel, ORFs, reverse complement and version checkpoints.
- **Chemistry & cheminformatics** — RDKit-powered structure analysis, compound registration, similarity/substructure search, SAR, screening heuristics, reactions, 3D visualization, prediction provenance and bulk import/export.
- **Evidence + Scientific Copilot** — allow-listed scientific evidence retrieval with source-bounded synthesis.
- **Activity / Help / Settings & sync** — audit history, detailed operating manual, backups and cloud controls.

Inventory remains removed from visible product navigation. The legacy inventory field remains in the workspace data shape so older exports do not break.

## Molecular biology v2.0

The molecular workspace now includes:

1. **Directional feature annotations** — +/− strand is visible in the list, map and sequence, with directional arrows. The bundled pUC19 lacZα and bla annotations are explicitly reverse-strand.
2. **Synchronized inspection** — selecting a feature in the list, map or sequence synchronizes the other views. Dragging across bases reports coordinates, length, GC% and a simple short-oligo Tm estimate.
3. **Adaptive sequence display** — bases-per-row responds to pane width; feature bars/underlines are drawn directly with the sequence.
4. **CDS translation** — annotated CDS features can display translation using table 11 (bacterial/archaeal/plastid) or table 1; reverse-strand CDS intervals are reverse-complemented before translation.
5. **Improved circular map** — base 1 is marked at 12 o'clock at zero rotation, label callouts reduce overlap, and the legend distinguishes features, primers and restriction marks.
6. **Restriction workbench** — enzyme filtering, unique-cutter mode, recognition positions, cleavage coordinates, Type IIS entries, predicted digest fragments, methylation-context warnings and a virtual agarose gel.
7. **Motif search** — both-strand IUPAC motif searching with circular-origin wrap support.
8. **Feature editor** — name, type, coordinates, strand, color, annotation source, notes and translation code.
9. **Sequence provenance** — manual checkpoints plus automatic safety checkpoints before raw-sequence replacement, reverse complement and version restoration.
10. **Reference QA** — build-time scientific regression guards protect the bundled pUC19 sequence/GC/MCS restriction positions, key pUC19 strand annotations and selected chemistry reference structures.

The starter pUC19 record is 2,686 bp and tied to **GenBank L09137.2**. Its feature metadata records the reference source used by the starter dataset. Imported records remain authoritative for their own imported annotations.

## Chemistry stack and terminology

- `@rdkit/rdkit` `2026.3.6` — RDKit JavaScript/WebAssembly MinimalLib.
- `3dmol` `2.5.5` — interactive WebGL molecular visualization.

Chemistry terminology in v2.0 is intentionally explicit:

- **RDKit canonical SMILES** rather than implying canonicalization is toolkit-independent.
- **Standard InChI** / InChIKey where supported by the loaded build.
- **Monoisotopic mass** rather than the ambiguous UI label “exact mass”.
- **Crippen logP (RDKit)** rather than “cLogP (Crippen)”.
- H-bond donor/acceptor and TPSA labels include toolkit-definition help.
- Rule-of-five and Veber outputs are shown as **alerts/heuristics**, not a “drug-like” verdict.
- Predicted ADMET/property records carry method, version, uncertainty/confidence when available, provenance and an applicability-domain field.
- The 3D viewer warns when uploaded coordinates are effectively planar and extracts PDB ID/method/resolution metadata when present.

See `docs/CHEMISTRY.md` and `docs/SCIENTIFIC_METHODS.md` for scientific methods and limitations.

## Persistence and accounts

OpenLab is local-first. Structured workspace state is kept in browser storage and notebook attachment bytes use IndexedDB. When Supabase is configured, the application uses Supabase Auth, RLS-protected workspaces, private file storage, researcher profiles/PIN verification, background workspace snapshot sync and history.

Required public deployment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (browser-safe publishable/anon key; never use a secret/service-role key in browser code)

The Content Security Policy derives the allowed Supabase HTTPS/WebSocket origins from `NEXT_PUBLIC_SUPABASE_URL`. The current RDKit browser wrapper also requires JavaScript evaluation during initialization, so the application CSP permits both `wasm-unsafe-eval` and `unsafe-eval`. This is a deliberate compatibility trade-off documented in `SECURITY.md`; future hardening should isolate the chemistry runtime rather than silently breaking RDKit.

## Build and scientific QA

`npm run build` automatically runs:

```text
node scripts/scientific-regression.mjs
```

The regression guard currently fails the build if these bundled references drift unexpectedly:

- pUC19 length and GC%;
- classic pUC19 MCS recognition-site positions for EcoRI, SacI, KpnI, BamHI, XbaI, SalI, PstI, SphI and HindIII;
- reverse-strand lacZα and bla starter annotations, L09137.2 provenance and pUC high-copy-origin note;
- Type IIS recognition/cut-offset metadata for BsaI, BsmBI, BbsI and SapI;
- bundled aspirin, caffeine, acetaminophen and ibuprofen reference structures by formula and monoisotopic mass.

These guards are regression tests, not substitutes for independent scientific validation or browser-level RDKit tests.

## Source layout

- `app/` — Next.js routes and global styling.
- `components/` — application workspaces.
- `components/molecular/` — sequence/plasmid/restriction/primer/ORF UI.
- `components/chemistry/` — chemistry depictions and 3D viewer.
- `lib/types.ts` — domain model.
- `lib/storage.ts` — local structured-data persistence.
- `lib/cloud.ts` — Supabase auth/sync/storage adapter.
- `lib/sequence.ts` — sequence parsing/calculations and restriction metadata.
- `lib/rdkit.ts` — RDKit WASM loader and chemistry engine adapter.
- `lib/chemistry.ts` — chemistry import/export, descriptors, screening, similarity and stoichiometry helpers.
- `scripts/copy-rdkit-assets.mjs` — deployment asset copy step.
- `scripts/scientific-regression.mjs` — build-time reference regression checks.
- `supabase/migrations/` — cloud schema/RLS/profile/history setup.
- `docs/` — architecture, scientific methods and chemistry notes.

## Integration note

A complete production `npm install && npm run build` in Vercel/CI remains the final integration test because Next.js, RDKit and 3Dmol dependencies must be installed there. Source parsing and the deterministic regression guard do not by themselves prove a successful production bundle.
