## v2.0.2 sequence normalization regression

- Synthetic 4,361-base record with exactly 45 newline characters has raw string length 4,406 but normalized biological length 4,361 bp.
- The same fixture contains 2,355 G/C bases and reports 54.0% GC after normalization.
- Legacy local/cloud workspace sequences and version snapshots are normalized during storage load/import.
- `saveSequence` also normalizes future records before persistence.

# OpenLab v2.0 QA report

Date: 2026-10-02

## Automated source checks

- TypeScript/TSX syntax transpilation: **PASS** — 72 source files, 0 syntax diagnostics.
- Local relative/alias import resolution: **PASS** — 149 local imports checked, 0 unresolved.
- `next.config.mjs` syntax: **PASS**.
- `scripts/scientific-regression.mjs` syntax: **PASS**.
- CSS structural brace check: **PASS** — balanced.
- Scientific regression guard: **PASS**.
- Sequence runtime smoke tests: **PASS**.

## Scientific regression set

The prebuild guard checks the bundled reference data that OpenLab itself ships with. It is intended to catch accidental source drift, not to replace independent scientific validation.

### pUC19

- Length: 2,686 bp.
- GC content: 50.6329% for the bundled sequence.
- Accession metadata: L09137.2.
- Reverse-strand annotations are guarded for lacZα and bla (AmpR).
- pUC high-copy origin label/source metadata are guarded.
- The reverse-complemented CDS intervals for lacZα and bla begin with an initiation codon in the bundled reference.
- Classic MCS recognition starts are guarded for EcoRI, SacI, KpnI, BamHI, XbaI, SalI, PstI, SphI and HindIII.
- Type IIS motif/cut-offset metadata are guarded for BsaI, BsmBI, BbsI and SapI.
- Genetic-code-table-11 start-codon and GenBank `/codon_start` / `/transl_table` support are guarded.

### Small molecules

The built-in preset structures are checked by formula and monoisotopic mass for:

- aspirin
- caffeine
- acetaminophen
- ibuprofen

## Runtime sequence smoke tests

- IUPAC reverse complement.
- IUPAC motif matching.
- both-strand motif search support.
- circular-origin motif wrapping.
- bacterial genetic code table 11 alternative initiation behavior.
- standard genetic code comparison.
- pUC19 EcoRI recognition position.
- circular single-cutter digest producing one full-length predicted fragment.

## Molecular-biology UI/logic coverage reviewed

- synchronized annotation/map/sequence selection
- responsive sequence wrapping and direct feature highlighting
- strand/direction arrows
- CDS translation with table/frame controls and reverse-strand handling
- feature add/edit/delete workflow
- restriction recognition positions vs cleavage boundaries
- unique-cutter filter
- Type IIS display
- Dam/Dcm overlap warnings phrased as context warnings rather than automatic cleavage-block claims
- predicted digest fragments and virtual-gel visualization
- version checkpoints, restore, and safety checkpoint before destructive sequence changes
- whole-record reverse complement with transformed feature/primer coordinates

## Chemistry terminology/QA reviewed

- `RDKit canonical SMILES`
- `Standard InChI`
- `Monoisotopic mass`
- `Crippen logP (RDKit)`
- toolkit-specific H-bond/TPSA explanations
- rule-of-five outputs labeled as heuristic alerts, not a drug-likeness verdict
- prediction records include method, version, uncertainty/confidence, provenance and applicability-domain assessment fields
- 3D coordinate integrity warnings for PDB, SDF/MOL, MOL2, XYZ and mmCIF atom-site coordinates
- PDB ID, resolution and experimental method extraction where present

## Build limitation in this packaging environment

A complete `npm install` / `next build` could not be completed in the packaging container because dependency installation timed out. No dependency or build error from the OpenLab source was observed; the dependency fetch itself did not finish. The Vercel deployment remains the final integration build and should run the `prebuild` scientific regression automatically before `next build`.

## Deliberately not claimed in v2.0

- Gibson Assembly design/execution is not implemented yet.
- Golden Gate assembly planning is not implemented yet.
- virtual-gel bands are predicted fragment visualization, not a physical gel-mobility/intensity simulator.
- primer-design output is a local sequence heuristic and not a substitute for genome-wide specificity analysis.
- ADMET predictions are never fabricated by OpenLab; externally generated or experimentally measured values must carry provenance.

## v2.1 UI regression notes

- RDKit 2D viewer now supports zoom in/out, wheel zoom, drag-to-pan, fit/reset, and expanded viewing without altering the underlying molecular calculation.
- Chemistry module navigation can collapse to a narrow rail.
- Molecular Biology map/metadata header no longer uses a fixed height; tabs can wrap without covering metadata cards.
- Molecular Biology DNA/RNA library, annotation inspector, top controls, and analysis dock can be retracted and expanded independently.
- Sequence sanitization and the scientific regression suite remain unchanged from v2.0.2.
