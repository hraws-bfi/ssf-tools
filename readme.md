# 📦 TOOLS

A utility for LORA, to sync readset data and visualize doc revision behavior.

## 📥 Installation

```bash
git clone https://github.com/wira-bfi/tools.git
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

## 📌 Notes
- Requires Node.js and npm.
- Sync output is written only to `public/readset-output-<system>.json`.
- ReadSet checker systems are loaded from `systems.config.json`.
- A system is shown in the dropdown only if its output file can be fetched successfully.
