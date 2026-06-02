# 📦 TOOLS

A utility for LORA, to sync readset data and visualize doc revision behavior.

## 📥 Installation

```bash
git clone git@github.com:hraws-bfi/ssf-tools.git
cd <your-project-folder>
npm install
```

## ➕ Add New Supported System

Use the interactive wizard:

```bash
npm run add-readset-system
```

You will be prompted for:
- system key (lowercase-kebab format, e.g. `abc-core`)
- display name

This updates `systems.config.json` and creates output targets:
- `public/readset-output-<system>.json`

## 🔄 Sync Readset

Use the generic sync command:

```bash
npm run sync-readset
```

This shows an interactive system picker from `systems.config.json`.

You can still run directly with a key:

```bash
npm run sync-readset -- <system-key>
```

The command will always prompt:
- `Enter repo path for <system-key>:`

Path is validated to ensure it exists, is a directory, and contains expected Go process files.

You can also run non-interactive mode (useful for CI):

```bash
npm run sync-readset -- <system-key> --repo-path <local-repo-path>
```

Example:

```bash
npm run sync-readset -- ssf --repo-path ~/workspace/ssf
```

## 🤖 GitHub Action: Sync From Remote Repo URL

Manual workflow is available at:
- `.github/workflows/sync-readset-remote.yml`

From Actions → **Sync Readset (Remote Repo)**, provide:
- `system_key` (from `systems.config.json`)
- `commit_changes` (whether to push updated `public/readset-output-<system>.json`)

Remote source repo is now resolved from each system config entry:
- `sourceRepoUrl` (required for workflow use)
- `sourceRepoRef` (optional branch/tag/SHA)

If source repo is private and you use HTTPS URL, add repository secret:
- `SOURCE_REPO_TOKEN`: a GitHub token with read access to the source repository

Security note:
- Workflow auth uses HTTP headers (not token-in-URL), and generated `gitInfo` URLs are sanitized to avoid credential leakage.

How it works:
- checks out this tools repo
- looks up selected system in `systems.config.json`
- reads `sourceRepoUrl` (+ optional `sourceRepoRef`) from that system
- clones the resolved remote repo URL
- runs sync using `--repo-path` with the cloned local directory
- uploads `public/readset-output-<system>.json` as an artifact
- optionally commits and pushes the updated output file

## 📌 Notes
- Requires Node.js and npm.
- Sync output is written only to `public/readset-output-<system>.json`.
- ReadSet checker systems are loaded from `systems.config.json`.
- A system is shown in the dropdown only if its output file can be fetched successfully.


GH page url: https://hraws-bfi.github.io/ssf-tools/