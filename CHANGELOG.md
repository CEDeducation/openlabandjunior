## v2.3 — Jr. OpenLab school studio (preview)

- New /junior immersive learning workspace with top-bar/sidebar/home entry points.
- Four interactive starter labs: periodic table and atomic shells, molecule formulas, DNA pairing, plane-mirror reflection.
- Class 9–12 science topic previews for Chemistry, Biology and Physics, planned topics clearly marked.
- English / Traditional Chinese (Taiwan), per-profile local notes and activity progress.
- No new Supabase migrations, changes to advanced scientific workspaces, or added dependencies.
- See V2.3_JUNIOR_SCHOOL.md for limitations.

# OpenLab changelog

## v2.1.0 — Adjustable scientific workspace UI

- Added interactive RDKit 2D molecule viewing with zoom in/out, wheel zoom, drag-to-pan, fit/reset, and an expanded full-screen-style viewer.
- Added a retractable Chemistry tool rail so the module navigation can collapse when more canvas space is needed.
- Fixed Molecular Biology metadata-tab overlap by removing the fixed-height map header, allowing the map/metadata tabs to wrap safely, and making metadata cards responsive to the actual pane width.
- Added expand/retract controls for the DNA/RNA record library, annotation inspector, molecular toolbar controls, and analysis tools dock.
- Added narrow rail states for collapsed DNA/RNA and annotation panels so users can reclaim horizontal space without losing access to the panels.
- Kept the v2.0.2 sequence sanitization, scientific regression tests, chemistry/RDKit functionality, and existing Supabase workspace persistence unchanged.

# OpenLab v2.0.2

- Fixed DNA length and GC calculations for formatted/multiline sequence records.
- DNA is normalized to valid IUPAC nucleotide symbols before persistence, load, cloud import, map display, digest length calculation, and version-history restore.
- Existing local/Supabase snapshots are repaired on load; formatting whitespace is never counted as base pairs.
- Added a build-time regression reproducing the 4,361-base + 45-newline failure mode (raw 4,406 characters) and guarding the corrected length/GC behavior.

# Changelog

## v2.0.0 — Molecular biology scientific audit & regression QA

- Upgraded the plasmid map with directional feature arrows, base-1-at-12-o’clock origin marking, clearer track legend, unique-cutter labels and leader-line label placement.
- Added +/− strand to feature metadata and corrected the bundled pUC19 lacZα and bla (AmpR) annotations to the reverse strand.
- Tied the starter pUC19 record to GenBank L09137.2 / NEB reference-map provenance and added a pUC high-copy origin note.
- Added synchronized selection across annotation list, circular/linear map and sequence pane.
- Added responsive bases-per-row, sequence-level feature coloring/bars and selected-range coordinates, length, GC% and short-oligo Tm summary.
- Added CDS translation strips with reverse-strand handling and selectable genetic code table 11 or table 1.
- Expanded feature editing with type, coordinates, strand, color, annotation source, notes and CDS translation preview.
- Expanded motif search to both strands, IUPAC ambiguity codes and circular-origin wrapping.
- Rebuilt restriction analysis with enzyme filtering, unique-cutter mode, recognition positions, cleavage coordinates, Type IIS entries, methylation-context warnings, predicted digest fragments and a virtual agarose gel.
- Added sequence version checkpoints/restore and automatic safety checkpoints before raw-sequence replacement, reverse complement and restoration.
- Added whole-record reverse-complement transformation for sequence, feature/primer coordinates and strand direction.
- Tightened chemistry terminology: RDKit canonical SMILES, Standard InChI, monoisotopic mass, Crippen logP (RDKit), explicit descriptor definitions and rule-of-five alerts instead of a drug-likeness verdict.
- Added ADMET applicability-domain capture and 3D coordinate-integrity warnings plus PDB metadata extraction.
- Extended coordinate-integrity checks to mmCIF atom-site coordinates so planar CIF records are flagged as 2D-like rather than silently treated as 3D conformations.
- Added `scripts/scientific-regression.mjs` and made it a `prebuild` guard for pUC19 reference invariants, Type IIS metadata and known small-molecule reference structures.
- Expanded Help and scientific-method documentation for all v2.0 molecular/chemistry changes.

## v1.8.0 — Chemistry & cheminformatics

- Added a dedicated Chemistry workspace without adding more large sections to the intentionally minimal Home page.
- Added official RDKit.js/WebAssembly runtime (`@rdkit/rdkit` 2026.3.6) with self-hosted deployment assets.
- Production CSP initially permitted RDKit WebAssembly compilation via `wasm-unsafe-eval`; the deployed RDKit wrapper later required `unsafe-eval` during initialization, and the compatibility/security trade-off is now documented in `SECURITY.md`.
- Added compound records with canonical SMILES, InChI/InChIKey, MOL blocks, formula display, series/tags, external IDs, notes, projects and RDKit descriptor cache.
- Added exact-duplicate warnings/audit using InChIKey with canonical-SMILES fallback.
- Added Structure Lab for SMILES/MOL/SDF parsing, RDKit 2D depiction, normalization, descriptors and fingerprint generation.
- Added Morgan radius-2 / 2048-bit fingerprint similarity search with browser-side Tanimoto scoring.
- Added SMARTS substructure search with RDKit match highlighting.
- Added SAR activity records plus an explicitly exploratory property-vs-activity plot.
- Added activity provenance fields (source/DOI and notes) directly in the SAR table.
- Added configurable property filters plus separately labeled Lipinski-style and Veber-style heuristics.
- Added Reaction Workbench for stoichiometry, mass/volume calculations, theoretical yield, actual yield, procedure, purification and analytical notes.
- Reaction components can link directly to registered compounds and inherit the compound name, SMILES and RDKit molecular weight.
- Added 3D & poses workspace powered by 3Dmol.js 2.5.5 for PDB/SDF/MOL/MOL2/XYZ/CIF visualization.
- Added ADMET/property provenance ledger separating Experimental, Predicted and Heuristic data.
- Added SMILES/CSV/MOL/SDF bulk import, 500-record browser batch guard, CSV/SDF export and duplicate audit.
- Added compound/reaction records to global search and Chemistry to Core navigation.
- Added detailed Chemistry & cheminformatics Help category and `docs/CHEMISTRY.md`.
- Extended WorkspaceState/storage normalization so older v1 exports load with empty chemistry arrays and new chemistry state participates in the existing workspace autosave/cloud snapshot path.

# OpenLab changelog

## v1.5

- Rebuilt the home page to be substantially less crowded.
- Removed the full-height Copilot column from Home; Copilot remains in the Evidence workflow.
- Added compact workspace overview, recent experiments/sequences, recent activity, and four application launchers.
- Removed the Inventory page/component from the application surface.
- Kept v1.4 Bioresearch, Bioprocess, Automation, and In Vivo data models and persistence.
- Re-ran source syntax, local import, CSS parser, sequence/scientific smoke, and CSP generation checks.

## v1.4.0
- Replaced the previous marketing-only Bioresearch/Bioprocess/Automation/In Vivo cards with four working application modules.
- Bioresearch now includes structured assay-run data capture and summary metrics.
- Bioprocess now includes recipe design, condition/replicate study planning, guided batch execution, and process insight summaries.
- Automation now includes a persistent visual flow builder and run history. Hardware connectors are represented honestly as adapter points; unsupported instruments are not claimed as connected.
- In Vivo now includes study design, cohorts, planned animals, and guided records for dosing, measurements, samples, and observations.
- All four modules persist in the OpenLab workspace state and therefore participate in existing local autosave and Supabase workspace snapshot sync.
- Kept Inventory out of the visible navigation as requested.
- Kept the v1.3 plasmid-map interaction and Help Center work.
- CSP now derives the allowed Supabase HTTP/WebSocket origin from `NEXT_PUBLIC_SUPABASE_URL`, avoiding project-specific hardcoding.

## v1.6
- Added a Supabase-backed Forgot password flow to the main cloud login.
- Added recovery-link handling and secure password update support.
- Simplified the home page again: removed metrics, activity feed, utility row, and extra promotional blocks.
- Home now contains only a welcome header, recent work, and four application shortcuts.

## v1.7 — Detailed Help Center
- Replaced the short Help page with a searchable, categorized operating manual.
- Added step-by-step guides for accounts, profiles, password recovery, navigation, Projects, Notebook, Protocols, Registry, Molecular Biology, Bioresearch, Bioprocess, Automation, In Vivo, Workflows, Evidence/Copilot, Activity, cloud sync, backups, data storage, and troubleshooting.
- Added direct links from help topics into the relevant OpenLab workspaces.
- Added molecular-specific instructions for import, plasmid interaction, annotations, motif search, raw DNA editing, primers/PCR, restriction analysis, ORFs, and export.

## v1.9 — Chemistry ergonomics & navigation refinement

- Reduced Structure Lab input height and added debounced live RDKit analysis for SMILES.
- Made the chemistry result panel compact and sticky on desktop so structure identifiers and key descriptors stay visible.
- Increased contrast and font size for chemistry helper text, labels, and readouts.
- Added a useful first-compound empty state and save guidance for new chemistry workspaces.
- Added collapsible Applications/Core/System groups to reduce left-sidebar crowding.
- Strengthened the Save to compound library action with a Registry icon and clearer visual hierarchy.
- Added one-click copy actions for SMILES, InChI, InChIKey, and formula.
- Added 2D depiction export as SVG and PNG.
- Kept the manual Analyze structure button while adding automatic SMILES analysis.
- Included the RDKit CSP compatibility fix used by the deployed chemistry workspace.
