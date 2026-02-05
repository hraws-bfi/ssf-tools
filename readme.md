# 📦 TOOLS

A utility for LORA, to sync the readset and visualize the doc.

## 📥 Installation & Usage

```bash
# Clone Project
git clone https://github.com/wira-bfi/tools.git
cd <your-project-folder>

# Install Dependencies
npm install

# Sync Readset
npm run sync-readset-ndf -- <path-to-lora-partnership-ndf>
npm run sync-readset-ssf -- <path-to-lora-partnership-ssf>

# Commit Changes
git add .
git commit -m "sync"
git push
```

## 📌 Notes
Requires Node.js and npm installed.

Ensure you have access to the lora-partnership-ndf directory before running the sync command.

Readset outputs are written to:
- public/readset-output-ndf.json and readset-output-ndf.json
- public/readset-output-ssf.json and readset-output-ssf.json
