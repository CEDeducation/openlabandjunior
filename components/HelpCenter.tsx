"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { BookIcon, ChemistryIcon, CloudIcon, DatabaseIcon, DnaIcon, FlaskIcon, FolderIcon, HelpIcon, RegistryIcon, SearchIcon, SettingsIcon, SparkIcon, UploadIcon, WorkflowIcon } from "./Icons"

type HelpSection = {
  id: string
  category: string
  title: string
  summary: string
  href?: string
  action?: string
  steps: string[]
  tips?: string[]
  icon: (props: { size?: number }) => JSX.Element
}

const sections: HelpSection[] = [
  {
    id: "account",
    category: "Getting started",
    title: "Create your lab account and researcher profile",
    summary: "OpenLab uses one main lab login and up to four protected researcher profiles inside that lab workspace.",
    steps: [
      "On the OpenLab sign-in screen, choose Create a new lab account.",
      "Enter the lab email and a password of at least 8 characters.",
      "After the main account is created, name the shared lab workspace.",
      "Create the first researcher profile. The first profile is automatically the Lab owner / PI.",
      "Choose a 4–8 digit PIN for that profile. Additional profiles can be Owner, Researcher, Student, or Viewer.",
      "When you return later, sign in with the main lab email/password, choose your profile, and enter that profile PIN.",
    ],
    tips: [
      "The main password and profile PIN are different credentials.",
      "A lab can have a maximum of four active profiles in the current profile model.",
      "Use the profile button at the top-right of OpenLab to switch researcher profiles without leaving the lab workspace.",
    ],
    icon: HelpIcon,
  },
  {
    id: "password",
    category: "Getting started",
    title: "Reset a forgotten password",
    summary: "Use the Supabase-backed recovery flow if the main lab password is forgotten.",
    steps: [
      "On the login screen, click Forgot password?.",
      "Enter the main OpenLab account email and choose Send reset email.",
      "Open the recovery email and follow its link back to OpenLab.",
      "Enter a new password of at least 8 characters twice.",
      "Choose Update password. The previous password will no longer work after the reset succeeds.",
    ],
    tips: [
      "Password recovery works only when OpenLab is connected to Supabase cloud mode.",
      "If the recovery link does not return to OpenLab, check the allowed redirect URL in Supabase Authentication → URL Configuration.",
    ],
    icon: CloudIcon,
  },
  {
    id: "navigation",
    category: "Getting started",
    title: "Understand the OpenLab layout",
    summary: "The left sidebar contains applications, core research workspaces, and system tools. The top bar provides global search, sync status, and profile switching.",
    steps: [
      "Use Applications for Bioresearch, Bioprocess, Automation, and In Vivo work.",
      "Use Core for Projects, Notebook, Protocols, Registry, Molecular biology, and Workflows.",
      "Use System for Evidence, Activity, Help, and Settings & sync.",
      "Use the global search box in the top bar to search projects, experiments, protocols, registry entities, sequences, tasks, and evidence.",
      "Press Ctrl+K on Windows/Linux or Command+K on macOS to jump directly into global search.",
      "Watch the cloud badge in the top-right: Saving… means changes are syncing, Saved means the last cloud write completed, and Sync issue means the connection needs attention.",
    ],
    icon: SearchIcon,
  },
  {
    id: "home",
    category: "Core workflow",
    title: "Use Home as a launch point, not a control room",
    summary: "The Home page is intentionally minimal. It should help you resume work quickly instead of showing every feature at once.",
    href: "/",
    action: "Open Home",
    steps: [
      "Choose New experiment when you want to begin a notebook entry.",
      "Choose Molecular biology when you want to import or inspect DNA/RNA records.",
      "Use Recent work to reopen the records you were working on most recently.",
      "Use the compact application shortcuts for Bioresearch, Bioprocess, Automation, and In Vivo.",
      "For everything else, use the persistent left sidebar rather than searching the Home page.",
    ],
    icon: HelpIcon,
  },
  {
    id: "projects",
    category: "Core workflow",
    title: "Organize research with Projects",
    summary: "Projects provide a shared context for experiments, assay runs, tasks, and other research objects.",
    href: "/projects",
    action: "Open Projects",
    steps: [
      "Open Projects and create a new project.",
      "Give the project a clear name and set its status.",
      "Use the project in Notebook entries, Bioresearch assay runs, and Workflow tasks so related work stays connected.",
      "Open an existing project from the list to update its details instead of creating duplicate projects.",
    ],
    tips: ["Use one project for one coherent research objective or study rather than creating a project for every individual experiment."],
    icon: FolderIcon,
  },
  {
    id: "notebook",
    category: "Core workflow",
    title: "Record an experiment in Notebook",
    summary: "Notebook is the central electronic experiment record for procedures, observations, results, files, tags, projects, and linked biological entities.",
    href: "/notebook",
    action: "Open Notebook",
    steps: [
      "Choose Create entry to make a new experiment record.",
      "Replace the default title with a descriptive experiment name.",
      "Set the experiment status to Draft, Running, or Complete.",
      "Link the experiment to a Project when applicable.",
      "Add tags so the experiment is easier to find later.",
      "Link relevant Registry entities such as plasmids, proteins, compounds, samples, or cell lines.",
      "Write the protocol/procedure, observations, and results in the large notebook sections.",
      "Use Add files to attach supporting material such as images, PDFs, tables, or result files.",
      "Open an attachment from the attachment list when you need to retrieve it later.",
    ],
    tips: [
      "Notebook changes are local-first and autosaved as you work.",
      "When cloud sync is configured, the workspace snapshot is also synchronized to Supabase.",
    ],
    icon: BookIcon,
  },
  {
    id: "protocols",
    category: "Core workflow",
    title: "Build reusable Protocols",
    summary: "Protocols let the lab store repeatable wet-lab, dry-lab, or general procedures as ordered steps.",
    href: "/protocols",
    action: "Open Protocols",
    steps: [
      "Choose New protocol.",
      "Set the protocol name, category, version, tags, and description.",
      "Choose Add step for each procedure step.",
      "Write the action for the step and, when appropriate, record its expected duration in minutes.",
      "Use the up/down controls to reorder procedure steps.",
      "Increment the version number when you intentionally publish a revised method.",
    ],
    tips: ["Keep steps operational and specific enough that a different lab member can reproduce the procedure."],
    icon: FlaskIcon,
  },
  {
    id: "registry",
    category: "Core workflow",
    title: "Track biological entities in Registry",
    summary: "Registry stores the identity and relationships of DNA, RNA, proteins, cell lines, compounds, samples, organisms, and reagents.",
    href: "/registry",
    action: "Open Registry",
    steps: [
      "Choose New entity.",
      "Set the entity type and, if useful, a schema such as Plasmid or Cell line.",
      "Give the entity a unique, descriptive name and optional aliases.",
      "Use Parent / lineage to show that one entity was derived from another.",
      "Add a description and structured metadata fields for lab-specific properties.",
      "If the entity has a DNA sequence, link it to a Molecular biology sequence record.",
      "Use the type filter on the left to narrow the registry when it grows.",
    ],
    icon: RegistryIcon,
  },
  {
    id: "molecular-import",
    category: "Molecular biology",
    title: "Import FASTA, GenBank, CSV, TSV, JSON, or raw DNA",
    summary: "The molecular workbench accepts common sequence formats and converts them into editable OpenLab sequence records.",
    href: "/plasmids",
    action: "Open Molecular biology",
    steps: [
      "Open Molecular biology and choose Import sequences.",
      "Upload a .fasta/.fa/.fna file for sequence-only records, or .gb/.gbk/.genbank when you want annotated GenBank features and topology.",
      "CSV, TSV, and JSON imports can be used when the file contains recognizable sequence fields.",
      "You can also paste raw DNA or FASTA text directly into the import dialog.",
      "Review the parsed record, then import it into the workspace.",
      "The imported record appears in the DNA & RNA library on the left.",
    ],
    tips: [
      "FASTA itself does not encode circular/linear topology, so FASTA records should be reviewed after import.",
      "GenBank records can preserve supported feature annotations and circular topology information.",
    ],
    icon: DnaIcon,
  },
  {
    id: "plasmid-map",
    category: "Molecular biology",
    title: "Read the plasmid map, strand arrows, and restriction marks",
    summary: "PLASMID MAP is an interactive circular view with directional feature arrows, base-1 origin, restriction labels, primers, track legend, rotation, and zoom.",
    href: "/plasmids",
    action: "Open Molecular biology",
    steps: [
      "Select a circular sequence from the DNA & RNA list and choose PLASMID MAP. At 0° rotation, base 1 is marked at 12 o'clock.",
      "Feature arrows show strand/orientation: → indicates the forward (+) strand and ← indicates the reverse (−) strand.",
      "Move the pointer over the map for a gentle auto-rotation preview, drag the disc to rotate manually, or use the rotation controls.",
      "Hold Ctrl or Command while using the mouse wheel to zoom. The normal wheel rotates in smaller steps.",
      "Hover a feature to emphasize it and read its strand, coordinates, type, and notes. Click it to synchronize the annotation list and sequence pane.",
      "When Restriction marks is enabled, all detected sites are ticked and unique cutters receive labels with leader lines to reduce clutter.",
      "Use the track key below the map to distinguish feature tracks, primer track, and restriction marks.",
      "Choose LINEAR MAP for coordinate-oriented inspection or METADATA for accession, annotation source, topology, translation table, and feature summary.",
      "Use the retract buttons on DNA & RNA, Annotations, the upper controls bar, and Analysis tools when you need more space. Each collapsed rail can be expanded again without changing the sequence record.",
    ],
    tips: [
      "Dense maps can still contain nearby labels; leader-line placement reduces overlap but the sequence/restriction tables remain the authoritative coordinate views.",
      "The starter pUC19 record is tied to the bundled L09137.2 sequence and records its annotation provenance in Metadata.",
    ],
    icon: DnaIcon,
  },
  {
    id: "annotations",
    category: "Molecular biology",
    title: "Create, edit, orient, and translate sequence features",
    summary: "Annotations carry coordinates, feature type, strand/direction, color, source, notes, and CDS translation settings rather than acting as decorative labels.",
    href: "/plasmids",
    action: "Open Molecular biology",
    steps: [
      "Choose the + button beside Annotations. If a sequence range is selected, the new feature starts with that range.",
      "Set the feature name, type, start/end coordinates, Forward (+) or Reverse (−) strand, display color, annotation source, and notes.",
      "The feature list and map show a direction arrow so reverse-strand genes are not visually mistaken for forward-strand genes.",
      "Click a feature in the list, map, or colored sequence bar. All three views synchronize to the same selected feature.",
      "For CDS features, OpenLab translates the annotated strand. Reverse-strand CDS features are reverse-complemented before translation.",
      "Choose translation table 11 for bacterial/archaeal/plastid coding sequences or table 1 when that is the appropriate source annotation.",
      "Use the delete button in the feature editor to remove a feature. Save a version checkpoint before major annotation changes when provenance matters.",
    ],
    tips: ["Translation is derived from the annotated nucleotide interval and reading start; confirm biological start/stop boundaries against the source record before interpreting a protein sequence."],
    icon: DnaIcon,
  },
  {
    id: "sequence-edit",
    category: "Molecular biology",
    title: "Inspect ranges, search IUPAC motifs, and edit raw DNA",
    summary: "The sequence pane auto-fits bases to its width, colors feature spans, synchronizes with the map, and supports both-strand/circular motif search.",
    href: "/plasmids",
    action: "Open Molecular biology",
    steps: [
      "Use Find to search a DNA motif. IUPAC ambiguity symbols such as R, Y, W, S, K, M, B, D, H, V, and N are supported.",
      "For circular records the search can detect motifs that cross the sequence origin, and the result summary separates forward- and reverse-strand matches.",
      "Drag across bases to select a sequence range. OpenLab reports one-based coordinates, length, GC%, and an estimated oligo Tm for short selections.",
      "Colored bars/underlines show which annotations overlap each sequence row. Click a colored span or a base under a feature to select that feature everywhere.",
      "CDS translation strips appear beneath overlapping sequence rows and show the feature direction and translation table.",
      "Choose Edit raw sequence to replace the underlying DNA. OpenLab creates a safety checkpoint before applying the edit.",
      "Use Reverse complement when you intentionally want to reverse-complement the whole record; OpenLab transforms feature/primer coordinates, flips strand directions, and checkpoints the previous record first.",
      "After any length-changing edit, verify all annotation and primer coordinates against the intended reference.",
    ],
    icon: SearchIcon,
  },
  {
    id: "primer",
    category: "Molecular biology",
    title: "Design primers and check PCR",
    summary: "The Primer design & PCR panel creates primer candidates from the active DNA record and maps saved primers back onto the sequence.",
    href: "/plasmids",
    action: "Open Molecular biology",
    steps: [
      "Open the Primer design & PCR tab below the sequence editor.",
      "Choose the target region and design settings exposed by the panel.",
      "Generate primer candidates from the actual sequence.",
      "Review forward/reverse primer sequence, length, GC%, estimated melting temperature, and amplicon size.",
      "Review any warnings before using a candidate experimentally.",
      "Add the chosen pair to the sequence so the primers appear on the map and in the primer list.",
      "Use the PCR check to confirm exact sequence matching and the predicted product in the current record.",
    ],
    tips: [
      "OpenLab's browser primer calculations are screening calculations, not a substitute for experimental validation.",
      "For publication-grade primer design, validate candidates with an established tool such as Primer3/Primer-BLAST and appropriate wet-lab controls.",
    ],
    icon: DnaIcon,
  },
  {
    id: "restriction-orf-export",
    category: "Molecular biology",
    title: "Analyze restriction sites, simulate a digest/gel, find ORFs, and export",
    summary: "Restriction analysis separates recognition positions from cleavage coordinates, includes Type IIS enzymes, predicts fragments, and draws a virtual agarose gel.",
    href: "/plasmids",
    action: "Open Molecular biology",
    steps: [
      "Open Digest & virtual gel. Filter enzymes by name or recognition sequence, or enable Unique cutters only to focus on single-site enzymes.",
      "Read Recognition site and Top-strand cut as separate columns. This matters for offset cutters and Type IIS enzymes such as BsaI, BsmBI, BbsI, and SapI.",
      "Select one or more enzymes to simulate a digest. OpenLab lists predicted fragment sizes and renders their expected relative migration in a virtual agarose gel beside a reference ladder.",
      "Review methylation-context warnings when a site overlaps a Dam/Dcm motif. The warning is a prompt to check the enzyme manufacturer's methylation guidance, not a claim that cleavage is always blocked.",
      "Enable Restriction marks in the map toolbar to show cut-site ticks and labels for unique cutters on the plasmid map.",
      "Open ORF finder to inspect candidate open reading frames. Use the record's selected genetic code when interpreting coding features.",
      "Use Export to download FASTA or GenBank, and Registry to link the sequence into the lab's tracked entity system.",
    ],
    tips: ["Virtual digest and gel output is a sequence-based prediction. Real band intensity/mobility can differ with DNA conformation, gel %, stain, loading, run conditions, and partial digestion."],
    icon: DnaIcon,
  },
  {
    id: "sequence-history",
    category: "Molecular biology",
    title: "Use sequence version history and restore checkpoints",
    summary: "OpenLab keeps manual/safety checkpoints so plasmid edits can be inspected and reverted without losing the current record silently.",
    href: "/plasmids",
    action: "Open Molecular biology",
    steps: [
      "Choose Save version before a major sequence or annotation change and give the checkpoint a meaningful label.",
      "Open History to see checkpoint date/time, sequence length, and feature count.",
      "Raw sequence replacement, reverse complement, and restore operations automatically create a safety checkpoint before changing the active record.",
      "Choose Restore on an older checkpoint when you need to revert. OpenLab first checkpoints the current state, then restores sequence, topology, features, primers, and notes.",
      "Version history is capped to the most recent checkpoints in the active workspace, so use exported workspace backups for long-term archival provenance.",
    ],
    icon: DnaIcon,
  },
  {
    id: "bioresearch",
    category: "Applications",
    title: "Use Bioresearch for structured assay results",
    summary: "Bioresearch stores assay runs with project links, status, samples, metrics, numerical values, and units.",
    href: "/bioresearch",
    action: "Open Bioresearch",
    steps: [
      "Choose + New assay run.",
      "Rename the assay and set its status to Draft, Running, or Complete.",
      "Set the assay type and optionally link it to a Project.",
      "Choose + Add row to create a structured result row.",
      "Enter the sample name, metric, numeric value, and unit.",
      "Add additional rows for replicates or additional samples.",
      "The application shows the number of rows and a simple mean across entered numerical values.",
    ],
    tips: ["Use the quick links at the top of Bioresearch to jump to Notebook, Molecular biology, Registry, or Evidence without losing the broader research context."],
    icon: DnaIcon,
  },
  {
    id: "bioprocess",
    category: "Applications",
    title: "Use Bioprocess from recipe design to process insights",
    summary: "Bioprocess is organized as Process design → Experiment planning → Batch execution → Process insights.",
    href: "/bioprocess",
    action: "Open Bioprocess",
    steps: [
      "In Process design, choose + New recipe and name the process recipe.",
      "Use + Add unit operation to define each ordered operation and the associated equipment.",
      "Mark a recipe Published when you want to indicate that it is the intended process definition.",
      "Open Experiment planning, choose the recipe, enter a study name, enter comma-separated conditions, and set replicates per condition.",
      "Choose Generate study runs. OpenLab creates a run for every condition × replicate combination.",
      "Open Batch execution, choose the study, and move each run through Planned, Running, and Complete.",
      "Record the current unit operation, observations, and yield/response values as runs progress.",
      "Open Process insights to see total runs, completed runs, mean yield/response, and individual run values.",
    ],
    icon: WorkflowIcon,
  },
  {
    id: "automation",
    category: "Applications",
    title: "Build and run Automation flows",
    summary: "Automation lets you create a visual sequence of repeatable nodes and keep execution history for the flow.",
    href: "/automation",
    action: "Open Automation",
    steps: [
      "Choose + New automation.",
      "Rename the automation flow.",
      "Choose a node type and then + Add node.",
      "Typical nodes include Instrument input, Transform, Analysis, Decision, and Notebook output.",
      "Rename each node so its purpose is obvious to other lab members.",
      "Use the up/down controls to change execution order and × to remove a node.",
      "Choose Run flow to create an execution record.",
      "Review Run history to see when the flow ran, its status, and the generated execution log.",
    ],
    tips: ["The current application models and executes OpenLab workflow logic. Physical instrument control still requires a real vendor/instrument connector."],
    icon: SparkIcon,
  },
  {
    id: "invivo",
    category: "Applications",
    title: "Plan and document In Vivo studies",
    summary: "In Vivo supports study design, groups/cohorts, planned animals, and traceable Dose, Measurement, Sample, and Observation events.",
    href: "/invivo",
    action: "Open In Vivo",
    steps: [
      "Choose + New study and enter the study name.",
      "In Study design, set species and study status.",
      "Create study groups and enter the treatment/condition for each group.",
      "Open Animals & groups and choose + Add animal for every planned animal.",
      "Assign an animal ID, group, sex, weight, and status.",
      "Open Guided workflow when the study is running.",
      "Choose an animal, select Dose, Measurement, Sample, or Observation, enter the value/unit, and choose Record.",
      "Review the chronological event list as the study progresses.",
    ],
    tips: ["OpenLab records study operations; institutional animal-care approvals, protocol compliance, and ethical review remain the responsibility of the research institution."],
    icon: FlaskIcon,
  },
  {
    id: "workflows",
    category: "Core workflow",
    title: "Track research tasks in Workflows",
    summary: "Workflows is a Kanban-style task board for research work that is planned, ready, in progress, blocked, or complete.",
    href: "/workflows",
    action: "Open Workflows",
    steps: [
      "Choose the + button in the appropriate status column to create a task there.",
      "Open the task card to edit its title, status, due date, and assignee.",
      "Link the task to a Project when it belongs to a defined study.",
      "Link Registry entities when the task concerns specific biological materials or constructs.",
      "Change the status as the task moves through the workflow.",
      "Delete obsolete tasks from the task drawer rather than leaving stale work in the board.",
    ],
    icon: WorkflowIcon,
  },
  {
    id: "evidence",
    category: "Evidence & Copilot",
    title: "Search the Scientific Sandbox",
    summary: "Evidence searches approved scientific sources instead of general-web results and lets you save relevant records into the lab Evidence library.",
    href: "/sources",
    action: "Open Evidence",
    steps: [
      "Enter a specific research query such as a gene symbol, compound, DOI, accession, or paper title.",
      "Choose All science, Papers, Genetics, Chemistry, or Structures to narrow the search mode.",
      "Choose Search and review the records returned from the approved scientific providers.",
      "Choose Open source when you want to inspect the record at its original provider.",
      "Choose Save record to add a useful result to the private OpenLab Evidence library.",
      "When an eligible open-access full text is available, choose Import OA full text to save additional source text.",
      "You can also add private lab evidence manually with a title, optional URL, and source text, or import a text/Markdown/CSV/JSON file.",
    ],
    tips: ["Saving evidence makes it available to source-bounded research assistance without relying on arbitrary general-web pages."],
    icon: DatabaseIcon,
  },
  {
    id: "copilot",
    category: "Evidence & Copilot",
    title: "Use the source-bounded Copilot responsibly",
    summary: "The Scientific Copilot is intended to synthesize retrieved evidence, not to invent unsupported scientific conclusions.",
    href: "/sources",
    action: "Open Evidence & Copilot",
    steps: [
      "Search for relevant scientific evidence first.",
      "Save the most relevant records when you want them retained in the workspace Evidence library.",
      "Ask a focused scientific question rather than a vague topic request.",
      "If you want private lab Evidence included in the response, explicitly enable the lab-evidence option.",
      "Read the cited source cards alongside the answer instead of treating the generated summary as primary evidence.",
      "Open the original source when a claim will affect an experiment, publication, clinical decision, or other high-stakes work.",
    ],
    tips: ["If no AI API is configured, the scientific search/evidence system can still be used without generated synthesis."],
    icon: SparkIcon,
  },
  {
    id: "activity",
    category: "System",
    title: "Review Activity history",
    summary: "Activity shows recent record creation, edits, and deletions captured by OpenLab's workspace event log.",
    href: "/activity",
    action: "Open Activity",
    steps: [
      "Open Activity from the System section of the sidebar.",
      "Review what changed, the record involved, and the timestamp.",
      "Use Activity when you need to understand how the current workspace state was reached.",
    ],
    icon: HelpIcon,
  },
  {
    id: "sync",
    category: "System",
    title: "Configure cloud persistence and autosave",
    summary: "OpenLab works local-first. Supabase adds authenticated cloud persistence, shared workspace storage, and cross-device restoration.",
    href: "/settings",
    action: "Open Settings & sync",
    steps: [
      "Deploy OpenLab with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY configured in the hosting environment.",
      "Run the supplied Supabase migrations once in the OpenLab Supabase project.",
      "Sign in to the main OpenLab account.",
      "Choose or create the cloud workspace used by the lab.",
      "Use Upload local → cloud when you intentionally want to push the current local workspace into the selected cloud workspace.",
      "Use Download cloud → local when you intentionally want to replace the local working copy with the selected cloud copy.",
      "During normal work, watch the top-right cloud badge for automatic save state.",
    ],
    tips: [
      "Do not put a Supabase service-role/secret key in a browser-exposed NEXT_PUBLIC variable.",
      "The publishable/anon key is intended for the client; Row Level Security is responsible for data access control.",
    ],
    icon: CloudIcon,
  },
  {
    id: "backup",
    category: "System",
    title: "Export, import, and recover workspace data",
    summary: "Settings includes portable local backups in addition to cloud persistence.",
    href: "/settings",
    action: "Open Settings & sync",
    steps: [
      "Choose Export workspace to download a portable JSON backup of the current workspace data.",
      "Store important backups somewhere separate from the browser/device.",
      "Use Import backup when you intentionally want to restore a previously exported OpenLab workspace file.",
      "Use Reset local data only when you are certain the local workspace can be discarded or recovered elsewhere.",
    ],
    tips: ["Treat Reset local data as destructive. Export or confirm the cloud copy before resetting."],
    icon: SettingsIcon,
  },
  {
    id: "data",
    category: "System",
    title: "Know where OpenLab stores your work",
    summary: "OpenLab uses a local working copy for responsiveness and optional Supabase cloud persistence for durable shared storage.",
    steps: [
      "Structured workspace state is maintained locally in the browser so OpenLab responds immediately while you work.",
      "Notebook attachments use browser-side file storage locally and can be synchronized to the private OpenLab storage bucket when cloud mode is configured.",
      "Cloud workspace state is stored in the OpenLab Supabase project, not in the PocketNT Supabase project.",
      "Authentication accounts are managed by Supabase Auth when cloud mode is enabled.",
      "The main account password is handled by Supabase Auth and is not displayed back to the OpenLab administrator.",
      "Researcher profile PINs are verified through the profile system and should be stored only as hashes rather than readable PIN text.",
    ],
    icon: DatabaseIcon,
  },
  {
    id: "chemistry-start",
    category: "Chemistry & cheminformatics",
    title: "Start a chemistry project in 10 minutes",
    summary: "Use Chemistry when your research centers on small molecules, compound series, measured activity, chemical reactions, or structure-aware analysis.",
    href: "/chemistry",
    action: "Open Chemistry",
    steps: [
      "Open Chemistry from the Core section of the left sidebar. The Home page stays intentionally minimal, so the full chemistry suite lives in its own workspace.",
      "Choose Structure Lab and paste a SMILES string, MOL block, or one SDF record. You can also load one of the small reference structures to test the workflow.",
      "For SMILES input, OpenLab now runs a debounced live RDKit analysis after you pause typing. You can still choose Analyze structure manually for an explicit refresh or when working with MOL/SDF content. RDKit validates the graph and creates the 2D depiction, canonical identifiers, fingerprint, and descriptors.",
      "Review the calculated structure and compact descriptor grid. Use Copy beside RDKit canonical SMILES, Standard InChI, InChIKey, or formula when you need an identifier elsewhere, and export the 2D depiction as SVG or PNG when needed. If the structure is valid, choose Save to compound library.",
      "Open Compound library to add a project, series, tags, notes, PubChem/ChEMBL IDs, and optionally register the compound as an OpenLab Registry entity.",
      "Use Structure search for similarity or SMARTS substructure searching, SAR for experimental activity data, Screening for property filters, Reactions for synthesis records, and 3D & poses for coordinate files.",
      "Use Data tools to bulk-import a compound file or export the chemistry library as CSV/SDF.",
    ],
    tips: [
      "Calculated RDKit descriptors are not experimental measurements.",
      "OpenLab deliberately separates experimentally measured values, model predictions, and heuristic rules.",
      "The chemistry records are stored in the same OpenLab workspace state and therefore participate in the normal local autosave and cloud snapshot flow.",
    ],
    icon: ChemistryIcon,
  },
  {
    id: "chemistry-rdkit",
    category: "Chemistry & cheminformatics",
    title: "Understand the RDKit engine and structure normalization",
    summary: "OpenLab uses the official RDKit JavaScript/WebAssembly distribution for browser-side cheminformatics instead of hard-coded molecular values.",
    href: "/chemistry",
    action: "Open Structure Lab",
    steps: [
      "Open Chemistry → Structure Lab.",
      "Enter a valid SMILES, MOL block, or SDF structure. SMILES are analyzed automatically after a short pause; Analyze structure remains available for manual analysis and non-SMILES inputs.",
      "RDKit parses the molecular graph. Invalid valence, malformed syntax, or an unsupported structure produces an error instead of silently creating a record.",
      "For a valid molecule, OpenLab stores the RDKit canonical SMILES returned by the loaded RDKit build so later comparisons use a normalized representation.",
      "OpenLab also requests Standard InChI and InChIKey when that functionality is present in the loaded RDKit MinimalLib build. The formula display is derived from the InChI formula layer when available.",
      "The MOL block returned by RDKit is saved for SDF export and for handoff to other chemistry tools.",
      "The descriptor panel shows RDKit-calculated values such as molecular weight, monoisotopic mass, Crippen logP (RDKit), TPSA, H-bond donors/acceptors, rotatable bonds, ring counts, and fraction Csp3 when available. Tooltip definitions identify the RDKit convention used; the default TPSA descriptor is the N/O polar-surface-area calculation.",
      "Use Re-analyze with RDKit on an existing compound after changing its structure so cached identifiers/descriptors are refreshed.",
      "In the 2D structure viewer use +/− or the mouse wheel to zoom, drag to pan, Fit (or double-click) to reset, and Expand when you need a large inspection canvas.",
      "The Chemistry tool rail can be collapsed with the chevron beside Chemistry to give the structure/results workspace more horizontal space.",
    ],
    tips: [
      "RDKit runs locally in the browser through WebAssembly; the chemistry calculation itself does not require sending the structure to a third-party chemistry API.",
      "If the RDKit runtime fails to load after deployment, confirm that npm dependencies installed successfully and that /public/rdkit contains RDKit_minimal.js and RDKit_minimal.wasm after the postinstall step.",
    ],
    icon: ChemistryIcon,
  },
  {
    id: "chemistry-import",
    category: "Chemistry & cheminformatics",
    title: "Import SMILES, CSV, MOL, and SDF compound files",
    summary: "Use Structure Lab for a single molecule and Data tools for a compound library or multi-record SDF.",
    href: "/chemistry",
    action: "Open Chemistry",
    steps: [
      "For one structure, open Structure Lab and choose Import file. Supported single-record inputs include .smi/.smiles/.txt/.csv/.mol/.sdf.",
      "For many compounds, open Data tools and choose Choose structure file.",
      "For SMILES text, use one structure per line. A second tab- or whitespace-separated field is treated as the compound name when present.",
      "For CSV, include a header named smiles, canonical_smiles, canonical smiles, or structure. A name/compound/title/id column is used as the display name when present; normalized structures are stored as RDKit canonical SMILES after analysis.",
      "For SDF, OpenLab separates records at $$$$ and sends each MOL block to RDKit for validation and normalization.",
      "Each valid structure receives normalized identifiers/descriptors before it is added to the chemistry library.",
      "Exact duplicates are skipped during bulk import using InChIKey when available, with RDKit canonical SMILES as the fallback.",
      "The browser batch is intentionally limited to 500 structures at once so the interface remains responsive. Split larger libraries into several files or use a future server-side pipeline for very large collections.",
    ],
    tips: [
      "A skipped duplicate is not an error. Review the Duplicate audit in Data tools if you intentionally maintain multiple records for one structure.",
      "CSV parsing in this version is intended for straightforward compound tables; preserve a source copy of complex vendor files.",
    ],
    icon: UploadIcon,
  },
  {
    id: "chemistry-registry",
    category: "Chemistry & cheminformatics",
    title: "Maintain a compound registry and detect duplicates",
    summary: "Every chemistry record can carry structure identifiers, project/series metadata, external IDs, tags, notes, and an optional OpenLab Registry link.",
    href: "/chemistry",
    action: "Open Compound library",
    steps: [
      "Open Compound library and select a record from the left list.",
      "Set the project and medicinal-chemistry series so compounds from one optimization program can be grouped.",
      "Use tags for workflow labels such as lead, control, intermediate, inactive, or resynthesis-needed.",
      "Record PubChem CID and ChEMBL ID only when you have verified the external identity. The quick links open those databases in a new tab.",
      "Choose Re-analyze with RDKit to refresh canonical SMILES/InChIKey and check whether the structure duplicates another registered record.",
      "Choose Register entity when you want the molecule to appear in the broader OpenLab Registry. The linked Registry metadata stores the chemistry compound ID, formula, InChIKey, and SMILES.",
      "Use Data tools → Duplicate audit to find exact duplicate groups already present in the chemistry library.",
    ],
    tips: [
      "Names are not reliable chemical identifiers. Prefer structure-derived identifiers for duplicate detection.",
      "Stereoisomers can have different structure identifiers; review stereochemistry rather than merging records solely because their names look similar.",
    ],
    icon: RegistryIcon,
  },
  {
    id: "chemistry-search",
    category: "Chemistry & cheminformatics",
    title: "Run similarity and SMARTS substructure searches",
    summary: "Search the lab's registered compounds by whole-molecule fingerprint similarity or by a chemical substructure pattern.",
    href: "/chemistry",
    action: "Open Structure search",
    steps: [
      "Open Chemistry → Structure search.",
      "For similarity search, choose the query compound from the compound library.",
      "Set the minimum Tanimoto threshold. A higher threshold requires a more similar fingerprint; a lower threshold returns a broader neighborhood.",
      "Choose Run similarity search. OpenLab calculates Morgan circular fingerprints with radius 2 and a 2048-bit length through RDKit, then calculates Tanimoto similarity in the browser.",
      "Results are sorted from most similar to least similar among compounds that meet the threshold.",
      "For substructure search, enter a SMARTS pattern or use one of the example motifs.",
      "Choose Search substructures. RDKit checks each compound graph and OpenLab displays matching molecules; highlighted depictions are used when the RDKit build returns match coordinates for rendering.",
      "Click a result to make it the active compound for the other chemistry tools.",
    ],
    tips: [
      "Fingerprint similarity depends on fingerprint settings and is not a direct measure of biological similarity.",
      "SMARTS is a query language, not ordinary SMILES. Broad SMARTS patterns can match many structures.",
    ],
    icon: SearchIcon,
  },
  {
    id: "chemistry-sar",
    category: "Chemistry & cheminformatics",
    title: "Build a structure–activity relationship (SAR) table",
    summary: "Link experimental potency or response measurements to compounds, targets, assays, endpoints, and sources without mixing them with calculated descriptors.",
    href: "/chemistry",
    action: "Open SAR",
    steps: [
      "Open Chemistry → SAR and choose Add activity.",
      "Select the compound, then enter the biological target, assay name/type, endpoint such as IC50/EC50/Kd, qualifier, numerical value, and unit.",
      "Keep units consistent when you intend to compare a series numerically. Do not compare 10 nM with 10 µM as if the numbers are equivalent.",
      "Use the Source and Notes fields in the data model when provenance or interpretation needs to be preserved; the activity record remains linked to its compound/project.",
      "Choose a molecular descriptor for the exploratory scatter plot. Only activity rows with both a numerical measurement and that RDKit descriptor are plotted.",
      "Treat the plot as a visual exploration only. OpenLab does not fit or validate a QSAR model in this view.",
      "When different targets, endpoints, assay formats, or units are present in one table, filter/interpret them as separate experimental contexts before drawing conclusions.",
    ],
    tips: [
      "OpenLab does not generate potency values. Enter measured or traceable source-derived activity data only.",
      "A correlation in a small SAR series is not evidence of causation or prospective predictive performance.",
    ],
    icon: ChemistryIcon,
  },
  {
    id: "chemistry-screening",
    category: "Chemistry & cheminformatics",
    title: "Use medicinal-chemistry screening filters",
    summary: "Screen the registered library with editable descriptor gates plus clearly labeled rule-of-five and Veber-style heuristic alerts.",
    href: "/chemistry",
    action: "Open Screening",
    steps: [
      "Open Chemistry → Screening.",
      "Confirm that compounds have RDKit descriptors. Records that have not been analyzed show Need RDKit rather than receiving a made-up result.",
      "Adjust maximum molecular weight, Crippen logP (RDKit), TPSA, HBD, HBA, and rotatable-bond limits to match the purpose of your triage.",
      "Review the Custom column to see whether each compound passes all of the current user-defined gates.",
      "Review rule-of-five alerts separately. The reference thresholds are MW 500, Crippen logP 5, HBD 5, and HBA 10; they are triage heuristics rather than a drug-likeness verdict.",
      "Review the Veber-style display separately. This implementation uses rotatable bonds ≤10 and TPSA ≤140 Å² as a simple heuristic view.",
      "Use these outputs to prioritize manual review or downstream computation, not to label a molecule safe, effective, developable, or clinically viable.",
    ],
    tips: [
      "Rule-of-five/Veber heuristics are context-dependent and can be inappropriate for classes such as natural products, macrocycles, and PROTACs.",
      "This version does not silently run PAINS, toxicity, docking, or ADMET models under the word screening.",
    ],
    icon: ChemistryIcon,
  },
  {
    id: "chemistry-reactions",
    category: "Chemistry & cheminformatics",
    title: "Record reactions and calculate stoichiometry/yield",
    summary: "The Reaction Workbench records synthesis context and performs transparent unit calculations for mass, liquid volume, theoretical yield, and percent yield.",
    href: "/chemistry",
    action: "Open Reactions",
    steps: [
      "Open Chemistry → Reactions and create a new reaction record.",
      "Assign the project, solvent, temperature, reaction time, and optional reaction SMILES.",
      "Add Reactant, Reagent, Solvent, or Product rows as needed.",
      "For each component, enter the amount in mmol and molecular weight in g/mol. OpenLab calculates mass in mg using mmol × molecular weight.",
      "For a liquid, enter density in g/mL. OpenLab calculates approximate volume in µL as mass mg ÷ density g/mL.",
      "Enter the limiting-reagent amount in mmol and the product molecular weight. OpenLab calculates theoretical product mass.",
      "Enter isolated actual product mass to calculate percent yield.",
      "Record the experimental procedure, purification method, and analytical characterization such as LC-MS, NMR, HPLC, and purity.",
    ],
    tips: [
      "Check molecular weight, density, salt/solvate form, purity, and concentration before relying on an automatic quantity calculation.",
      "The Reaction Workbench is an electronic calculation/record system; it does not validate whether a chemical synthesis is safe or appropriate to perform.",
    ],
    icon: FlaskIcon,
  },
  {
    id: "chemistry-3d",
    category: "Chemistry & cheminformatics",
    title: "Inspect molecules and protein structures in 3D",
    summary: "The 3D & poses workspace uses 3Dmol.js to render coordinate-containing molecular files interactively in the browser.",
    href: "/chemistry",
    action: "Open 3D & poses",
    steps: [
      "Open Chemistry → 3D & poses.",
      "Upload or paste a PDB, SDF, MOL2, XYZ, CIF, or MOL coordinate record.",
      "Confirm the detected/selected file format.",
      "Choose Stick, Sphere + stick, Line, or Cartoon + stick rendering. Cartoon is most useful for macromolecular structures such as proteins.",
      "Enable Spin when you want continuous rotation, and use the 3D viewer's mouse controls to rotate/zoom interactively.",
      "You can load the currently selected compound's RDKit MOL block. Remember that RDKit's 2D depiction coordinates can appear flat in a 3D renderer.",
      "For a meaningful conformer, crystallographic structure, docking pose, or protein–ligand complex, upload data that actually contains 3D coordinates.",
    ],
    tips: [
      "The viewer does not create or validate docking poses.",
      "A visually plausible 3D orientation is not evidence of binding affinity.",
    ],
    icon: ChemistryIcon,
  },
  {
    id: "chemistry-admet",
    category: "Chemistry & cheminformatics",
    title: "Store ADMET, property predictions, and experimental measurements honestly",
    summary: "The ADMET & predictions ledger makes the evidence type and provenance explicit instead of presenting generated numbers as facts.",
    href: "/chemistry",
    action: "Open ADMET & predictions",
    steps: [
      "Open Chemistry → ADMET & predictions and choose Add record.",
      "Select the compound and set Kind to Experimental, Predicted, or Heuristic.",
      "Enter the property name such as solubility, permeability, logD, CYP inhibition, hERG, BBB penetration, clearance, PPB, or another endpoint.",
      "Enter the value and unit exactly as reported by the experiment/model/source.",
      "For a model prediction, enter the model/method name and version. Record uncertainty/confidence when the model provides it (for example a confidence interval, standard deviation, score, probability, or documented qualitative confidence).",
      "Use Provenance for a DOI, dataset, notebook experiment, external service, model run ID, or other traceable origin. Do not invent an uncertainty value when the method does not provide one.",
      "Enter an applicability-domain assessment for predicted values, then interpret the result only within the domain supported by that method. OpenLab stores the result; it does not imply the model is validated for your molecule class.",
    ],
    tips: [
      "Predicted ≠ experimentally measured.",
      "Do not enter an AI-generated number without a documented model/source and then label it Experimental.",
    ],
    icon: SparkIcon,
  },
  {
    id: "chemistry-export",
    category: "Chemistry & cheminformatics",
    title: "Export and move chemistry data between tools",
    summary: "Chemistry Data tools provide CSV and SDF exports while the global OpenLab backup preserves the full chemistry workspace with the rest of the lab data.",
    href: "/chemistry",
    action: "Open Data tools",
    steps: [
      "Open Chemistry → Data tools.",
      "Choose Export CSV for a tabular compound file containing OpenLab ID, name, RDKit canonical SMILES, InChI/InChIKey, formula, series, tags, and common RDKit descriptor columns.",
      "Choose Export SDF for compounds that have an RDKit MOL block. OpenLab writes selected metadata such as OpenLab ID, name, SMILES, InChIKey, series, and tags as SDF properties.",
      "Use Settings & sync → Export workspace when you need a complete OpenLab backup including compound records, activity data, reactions, predictions, notebook, projects, sequences, and other workspace objects.",
      "When moving data to another cheminformatics application, verify stereochemistry, charges, isotopes, salts, and property naming after import rather than assuming every tool interprets every field identically.",
    ],
    tips: [
      "Keep an immutable copy of important raw vendor/source files alongside normalized OpenLab data.",
      "SDF export requires a MOL block; re-analyze older SMILES-only records with RDKit first if needed.",
    ],
    icon: DatabaseIcon,
  },
  {
    id: "troubleshooting",
    category: "Troubleshooting",
    title: "Fix common problems",
    summary: "Use these checks before changing code or deleting data.",
    steps: [
      "Login says Failed to fetch: verify the Supabase project URL/key in Vercel and make sure the site's Content Security Policy permits the Supabase HTTPS and WebSocket origins.",
      "Cloud badge shows Sync issue: check network connectivity, the active Supabase session, the selected cloud workspace, and Row Level Security policies.",
      "Password reset email arrives but the link fails: check Supabase Authentication → URL Configuration and confirm the OpenLab deployment URL is allowed.",
      "Imported FASTA looks linear/circular incorrectly: remember that FASTA does not store topology; set topology manually or use an annotated GenBank record.",
      "Plasmid annotations look wrong after raw sequence replacement: verify annotation coordinates because editing the underlying sequence can invalidate previous positions.",
      "A record appears missing: use global search, then check the relevant list and cloud/local workspace selection before assuming it was deleted.",
      "Before destructive reset/deletion, export a workspace backup or confirm that the cloud copy is current.",
    ],
    icon: HelpIcon,
  },
]

const categories = ["All", "Getting started", "Core workflow", "Molecular biology", "Chemistry & cheminformatics", "Applications", "Evidence & Copilot", "System", "Troubleshooting"]

export default function HelpCenter() {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("All")

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return sections.filter(section => {
      if (category !== "All" && section.category !== category) return false
      if (!needle) return true
      const haystack = [section.title, section.summary, section.category, ...section.steps, ...(section.tips || [])].join(" ").toLowerCase()
      return haystack.includes(needle)
    })
  }, [query, category])

  return (
    <div className="pageBody helpManualPage">
      <div className="pageHeading helpManualHeading">
        <div>
          <div className="sectionEyebrow">OPENLAB HELP CENTER</div>
          <h1>How to use OpenLab</h1>
          <p>A detailed, step-by-step operating guide for the lab account, research workspaces, molecular biology, chemistry/cheminformatics, scientific evidence, cloud sync, backups, and troubleshooting.</p>
        </div>
        <Link href="/" className="ghostButton linkButton">Back to Home</Link>
      </div>

      <section className="surfaceCard helpStartCard">
        <div>
          <div className="sectionEyebrow">10-MINUTE START</div>
          <h2>New to OpenLab? Follow this order.</h2>
          <p>Sign in → choose your researcher profile → create a Project → record an experiment in Notebook → import or create molecular records → save scientific Evidence → connect recurring work to Workflows.</p>
        </div>
        <div className="helpStartActions">
          <Link href="/projects" className="primaryButton linkButton">Start with a project</Link>
          <Link href="/notebook" className="ghostButton linkButton">Create an experiment</Link>
          <Link href="/plasmids" className="ghostButton linkButton">Import DNA</Link>
          <Link href="/chemistry" className="ghostButton linkButton">Analyze a compound</Link>
        </div>
      </section>

      <div className="helpManualLayout">
        <aside className="helpManualSidebar surfaceCard">
          <div className="helpSearchBox">
            <SearchIcon size={17}/>
            <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search help…" aria-label="Search help"/>
          </div>
          <div className="helpCategoryList">
            {categories.map(item => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}
          </div>
          <div className="helpSidebarNote">
            <strong>Need a specific page?</strong>
            <p>Most guides below include a button that opens the related OpenLab workspace directly.</p>
          </div>
        </aside>

        <main className="helpManualContent">
          <div className="helpResultsBar"><strong>{filtered.length} guide{filtered.length === 1 ? "" : "s"}</strong><span>{category === "All" ? "All topics" : category}{query ? ` · matching “${query}”` : ""}</span></div>

          {filtered.map((section, index) => {
            const Icon = section.icon
            return (
              <article className="surfaceCard helpGuideCard" id={section.id} key={section.id}>
                <div className="helpGuideHeader">
                  <div className="helpGuideIcon"><Icon size={20}/></div>
                  <div>
                    <span>{section.category}</span>
                    <h2>{section.title}</h2>
                    <p>{section.summary}</p>
                  </div>
                  {section.href && <Link href={section.href} className="ghostButton linkButton helpGuideAction">{section.action || "Open workspace"}</Link>}
                </div>

                <div className="helpSteps">
                  <div className="helpStepsTitle">Step by step</div>
                  {section.steps.map((step, stepIndex) => (
                    <div className="helpStepRow" key={`${section.id}-${stepIndex}`}>
                      <span>{stepIndex + 1}</span>
                      <p>{step}</p>
                    </div>
                  ))}
                </div>

                {!!section.tips?.length && <div className="helpTips"><strong>Important</strong>{section.tips.map((tip, tipIndex) => <p key={`${section.id}-tip-${tipIndex}`}>{tip}</p>)}</div>}

                {index < filtered.length - 1 && <a className="helpBackTop" href="#top">Back to top ↑</a>}
              </article>
            )
          })}

          {!filtered.length && <div className="surfaceCard helpNoResults"><HelpIcon size={26}/><strong>No guide matches that search</strong><p>Try a broader word such as “sequence”, “compound”, “SMILES”, “password”, “cloud”, “primer”, or “workflow”.</p><button className="ghostButton" onClick={() => { setQuery(""); setCategory("All") }}>Show all guides</button></div>}
        </main>
      </div>
    </div>
  )
}
