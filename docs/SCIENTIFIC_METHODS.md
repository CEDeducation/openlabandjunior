# Scientific methods and limits

OpenLab distinguishes deterministic calculations, source annotations, heuristic screening, model predictions and experimental measurements. It should not turn a calculated or predicted value into an experimental claim.

## Sequence import and coordinate conventions

- FASTA imports sequence only; FASTA contains no topology metadata, so imported FASTA records should be reviewed for linear/circular topology.
- GenBank imports sequence, supported feature annotations and topology where present.
- CSV/TSV/JSON recognizes common sequence fields.
- IUPAC nucleotide symbols are retained where possible.
- UI coordinates are displayed one-based to users while the internal TypeScript data model uses zero-based inclusive feature coordinates.

## GC content and selected ranges

GC% counts canonical G/C bases relative to canonical A/C/G/T positions. Ambiguous symbols are handled conservatively. Dragging a range in the sequence pane reports displayed coordinates, selected length and GC%. Short selections also show OpenLab's simple oligo Tm estimate; this is not a nearest-neighbour thermodynamic model.

## Motif search

The v2.0 motif search:

- accepts IUPAC ambiguity symbols;
- searches both forward and reverse-complement strands;
- supports matches that cross the origin of a circular sequence;
- reports forward/reverse hit counts.

A motif hit is a sequence match, not proof of biological function.

## Restriction sites, Type IIS enzymes and virtual digest

The restriction workbench separates the recognition-sequence coordinate from calculated top/bottom cleavage positions. The focused built-in table includes common Type II enzymes and selected Type IIS enzymes (BsaI, BsmBI, BbsI and SapI). Circular matching can cross the origin.

OpenLab can filter to unique cutters, calculate predicted fragment lengths for selected enzymes and draw a relative virtual-gel view. This is an in-silico sequence calculation only.

Dam/Dcm context is treated as a **warning context**. A site that overlaps a methylation motif is flagged so the researcher checks the specific enzyme/vendor guidance. OpenLab does not claim that every such overlap blocks cleavage, and it does not model star activity, buffer compatibility, partial digestion, enzyme kinetics or gel-intensity physics.

## Primer screening and in-silico PCR

OpenLab generates/inspects primer candidates from the active sequence and reports sequence, length, GC%, estimated Tm and predicted amplicon. PCR checking uses sequence matching in the loaded record. It does not establish genome-wide specificity, mismatch tolerance or polymerase-specific behavior. Publication or experimental work should be validated with an established design/specificity workflow and wet-lab controls.

## CDS translation and genetic code

Annotated CDS features can be translated with table 11 or table 1. Reverse-strand CDS intervals are reverse-complemented before translation. Table 11 is exposed for bacterial/archaeal/plastid records and table 1 for standard-code records.

The UI does not infer the biologically correct CDS boundary, alternative start site, intron structure, translational recoding or expression. The annotation source remains responsible for those biological assertions.

## Version history and reverse complement

Sequence checkpoints store sequence, topology, features, primers and notes. Raw-sequence replacement, whole-record reverse complement and version restoration create safety checkpoints. Whole-record reverse complement transforms feature/primer coordinates and flips strand directions. Users should still verify the resulting biological annotation against the intended source record.

## Bundled pUC19 reference

The starter pUC19 record is a reference/test record tied to GenBank **L09137.2** and the NEB pUC19 reference map. It is not experimental data produced by OpenLab.

The bundled sequence is 2,686 bp. v2.0 explicitly represents lacZα and bla (AmpR) on the reverse strand, records the classic MCS region, and labels the pMB1/ColE1-family origin as the pUC high-copy mutant context. Annotation names and exact feature boundaries can vary among reference records; imported source annotations should remain attributable to their source.

## 3D coordinate integrity

The chemistry 3D viewer inspects coordinate-containing input. If all extracted z coordinates are effectively planar, the UI warns that the record behaves like a 2D depiction rather than a meaningful 3D conformer/pose. For PDB input it extracts the PDB ID, experimental method and reported resolution when those fields are present.

A rendered orientation does not imply a validated docking pose or binding affinity.

## Chemistry and cheminformatics

See `docs/CHEMISTRY.md` for chemistry-specific methods. Key principles are:

- RDKit structure parsing/descriptors/fingerprints are calculated properties from the submitted molecular graph.
- SAR activity values are supplied by the researcher; OpenLab does not generate potency.
- Descriptor/activity plots are exploratory, not validated QSAR models.
- Rule-of-five and Veber outputs are heuristic alerts, not a drug-likeness verdict.
- ADMET/property predictions must carry an explicit evidence kind, model/method, version, provenance and applicability-domain assessment.
- Reaction calculations are transparent arithmetic and do not establish reaction safety, feasibility, selectivity or purity.

## Build-time scientific regression guard

`npm run build` first runs `scripts/scientific-regression.mjs`. The script protects selected known reference invariants (pUC19 length/GC/MCS positions/strand metadata and bundled small-molecule formula/monoisotopic-mass references). It intentionally fails the build if those values drift unexpectedly.

This is a regression guard against accidental code/data changes, not a comprehensive validation suite. Browser-level RDKit rendering, imported records and experimental interpretation still require integration testing and domain review.
