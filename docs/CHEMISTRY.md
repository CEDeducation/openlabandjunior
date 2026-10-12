# Chemistry & cheminformatics implementation notes

OpenLab v2.0 keeps experimental measurements, deterministic structure calculations, model predictions and heuristic filters explicitly separated.

## RDKit.js

OpenLab uses the official `@rdkit/rdkit` JavaScript/WebAssembly MinimalLib distribution for browser-side cheminformatics. `scripts/copy-rdkit-assets.mjs` copies the pinned runtime into `public/rdkit/`; `lib/rdkit.ts` loads it on demand.

Current uses include:

- SMILES/MOL/SDF parsing;
- **RDKit canonical SMILES** and CXSMILES where available;
- **Standard InChI** and InChIKey where supported by the loaded build;
- V2000 MOL blocks and SVG 2D depiction;
- molecular descriptors exposed by MinimalLib;
- Morgan circular fingerprints;
- SMARTS substructure matching/highlighting.

RDKit objects created by OpenLab are deleted after use to release the underlying WebAssembly/C++ object.

## Similarity and substructure search

Similarity search uses RDKit Morgan bit fingerprints with radius 2 and a 2048-bit fingerprint length. OpenLab calculates Tanimoto similarity from the fingerprint bit vectors. Fingerprint similarity depends on representation/settings; it is not a direct statement of biological activity, safety or synthetic accessibility.

SMARTS input is parsed as a query molecule. Invalid patterns return an error instead of silently becoming a valid query.

## Descriptor terminology

The UI uses the following wording:

- average molecular weight (`amw`);
- **monoisotopic mass** (`exactmw` in RDKit's descriptor payload);
- **Crippen logP (RDKit)** (`CrippenClogP`, Wildman–Crippen implementation);
- **TPSA (RDKit)** (`tpsa`; the default descriptor uses N/O polar contributions);
- **H-bond donors (RDKit)** and **H-bond acceptors (RDKit)** (`NumHBD`/`NumHBA`, with available RDKit fallbacks);
- rotatable bonds, ring counts, aromatic rings and fraction Csp3.

Descriptor definitions are toolkit conventions. They should not be silently treated as experimentally measured values or assumed identical to every other software package.

The molecular formula display is derived from the molecular representation/InChI formula layer when available.

## Rule-of-five / Veber alerts

OpenLab exposes user-configurable property gates and separately displays simple reference alerts:

- rule-of-five thresholds: MW 500, Crippen logP 5, HBD 5, HBA 10;
- Veber-style thresholds: rotatable bonds 10 and TPSA 140 Å².

These are **heuristic alerts**, not a “drug-like” verdict. Applicability is context-dependent and can be poor for classes such as natural products, macrocycles and PROTACs.

## SAR

Activity values are user-entered/source-derived records. OpenLab does not fabricate potency. The descriptor-vs-activity plot is exploratory only; it is not a fitted, cross-validated or prospective QSAR model. Targets, endpoints, assay formats and units must be interpreted in their proper experimental context.

## Reactions

Transparent calculations include mass from mmol × molecular weight, density-based approximate liquid volume, theoretical product mass and percent yield. Researchers must verify salt/solvate form, concentration, purity, density, limiting reagent assignment and units.

## 3Dmol.js and coordinate integrity

The 3D & poses page uses `3dmol` to render coordinate-containing PDB, SDF/MOL, MOL2, XYZ and CIF records. OpenLab checks extracted coordinates and warns when they are effectively planar (all z values nearly equal), because a 2D MOL depiction shown in a 3D canvas is not a validated conformer or docking pose.

For PDB input, the UI extracts PDB identifier, experimental method, title and reported resolution when present. OpenLab does not create or validate docking poses and does not infer affinity from a visualized orientation.

## ADMET / prediction provenance

OpenLab provides a provenance ledger, not a hidden prediction model. Each property record is explicitly marked `Experimental`, `Predicted` or `Heuristic` and can store:

- method/model name;
- model/version;
- provenance/source;
- uncertainty/confidence when the method provides it;
- **applicability-domain assessment**;
- notes.

A predicted value should not be presented as experimentally measured. A model result outside or without a documented applicability domain should be interpreted accordingly.

## Import/export

- Single structure: SMILES text, MOL block or one SDF record via Structure Lab.
- Bulk: SMILES list, straightforward CSV with a SMILES/structure column or multi-record SDF.
- Browser batch guard: 500 records per import.
- Exact duplicate screening: InChIKey when available, then RDKit canonical SMILES fallback.
- Export: CSV/SDF plus the complete OpenLab workspace backup.

## Regression references

The build-time scientific regression script protects the bundled aspirin, caffeine, acetaminophen and ibuprofen reference SMILES by independently checking molecular formula and monoisotopic mass. It is deliberately independent of the browser RDKit UI so accidental changes to reference structures fail the build.

The guard does not replace browser-level RDKit tests or external chemical validation.

## Current boundaries

OpenLab does **not** claim to provide a validated docking/scoring engine, browser conformer-energy workflow, validated ADMET/QSAR models, retrosynthesis planner, reaction-condition predictor or full commercial chemical registration system. Unsupported capabilities should not be represented by placeholder scientific scores.
