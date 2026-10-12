# OpenLab Research + Jr. OpenLab — Full Combined Project (v2.4)

**This ONE ZIP contains the entire OpenLab app.** Do not combine this ZIP with v2.2/v2.3 updates; the latest Jr. studio is already included. The ZIP opens directly to the project root (`package.json`, `app/`, `components/`, etc.).

## Included

- All original v2.2 OpenLab Research code: Chemistry/RDKit, Plasmids, Molecular Biology, Notebook, Projects, Protocols, sample/registry, evidence/source tools, account/session infrastructure, etc.
- The Jr. OpenLab route `/junior`, linked from the top bar, dashboard and sidebar.
- Ten interactive **starter** labs (atomic explorer, ionic bonding, covalent molecule composer, chemical equations, cells, DNA, ecology, digestion, circuits, optics).
- Supabase SQL migration files, science reference data, app assets, and documentation.
- No `.env.local`, personal credentials, installed `node_modules`, or private Supabase keys are included.

## Easiest way to replace project safely

1. **Back up** your current GitHub repository (or create a backup branch) first.
2. Extract THIS ZIP locally. Do not add the old `v2.3` or `v2.4 update-only` ZIP files.
3. Using **GitHub Desktop**, clone your existing OpenLab GitHub repo, then copy the extracted project contents into the cloned repo, preserving the exact folder paths.
4. **Do not overwrite** `.env.local` or change your existing Vercel environment variables. Never commit secret Supabase service keys.
5. Check GitHub Desktop Changes, commit `Restore complete OpenLab Research and Jr. OpenLab v2.4`, and push to GitHub.
6. Vercel should start a deployment. If it fails, open Vercel → Deployments → failed deployment → Build Logs and copy the **first error**.

The browser GitHub file uploader commonly has a 100-file-per-upload limit; this project contains more files. GitHub Desktop avoids manually splitting the upload.

## Routes to smoke test after deployment

1. Home/dashboard and top-bar navigation
2. `/chemistry`, `/plasmids`, `/notebook` (Research)
3. `/junior` (School), Ionic Bonding, Molecule Composer, Food Chains, Human Digestion, Circuits
4. Login/profile switching, notebook save/reload, and any existing Supabase-backed modules

## What this is NOT

- Not complete NCERT Grade 9–12 coverage. The class/subject library is a roadmap and some activities remain placeholders.
- Not a validated physics/molecular-dynamics engine, advanced 3D anatomy system, or fully translated app.
- **Not fully production build-tested here**, because network dependency installation was unavailable. The legacy science regression passed and source paths were checked. A real Vercel build/browser smoke test is still required.

For detailed implementation limitations, see `V2.4_IMMERSIVE_JR.md`, `V2.4_QA.md`, and `SECURITY.md`.
