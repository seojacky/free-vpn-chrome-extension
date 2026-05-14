# Release Instructions for Free VPN Chrome Extension

This document describes the process for releasing a new version of the extension.

---

## Prerequisites

- Work is done on a feature branch (e.g., `claude/feature-name`)
- All changes are committed and pushed
- Version number is bumped in `manifest.json`
- README.md and documentation are updated

---

## Release Process (Browser-Only, No Git CLI)

### Step 1: Create a Release Branch
1. Go to GitHub repository in browser
2. Switch to your feature branch (e.g., `claude/analyze-proxy-validation-KHRQ8`)
3. Click **Branch** dropdown → **New branch**
4. Name it with the version: `X.Y` (e.g., `2.8`)
5. Leave "Create from" as your feature branch
6. Click **Create branch**

---

### Step 2: Download the Version Archive

1. Go to the `X.Y` branch
2. Click green **Code** button → **Download ZIP**
3. Save it as `free-vpn-chrome-extension-X.Y.zip` (e.g., `free-vpn-chrome-extension-2.8.zip`)

---

### Step 3: Rename Archive and Folder

1. **Extract** the downloaded zip file
2. **Inside the extracted folder**, rename the root folder from:
   - `free-vpn-chrome-extension-X.Y/` 
   - to `free-chrome-vpn-manager-by-seojacky/`
3. **Re-zip** the folder with the new name: `free-chrome-vpn-manager-by-seojacky.zip`

> **Note:** The zip file name and internal folder name must match exactly:
> ```
> free-chrome-vpn-manager-by-seojacky.zip
>   └── free-chrome-vpn-manager-by-seojacky/
>       ├── manifest.json
>       ├── popup.html
>       ├── options.html
>       └── ...
> ```

---

### Step 4: Update the "latest" Release

1. Go to **Releases** tab on GitHub
2. Click on the **"latest"** release (marked with green "Latest" badge)
3. Click **Edit** (pencil icon) in the top-right
4. Scroll to **Assets** section
5. Delete the old `free-chrome-vpn-manager-by-seojacky.zip` file
6. Click **Upload** and select your renamed zip: `free-chrome-vpn-manager-by-seojacky.zip`
7. Click **Update release** to save

---

### Step 5: Verify

1. Go back to **Releases** tab
2. Check that the "latest" release now has the new zip file
3. Click the zip link to verify it downloads the correct version
4. Extract it to confirm the folder structure is correct

---

## Checklist Before Release

- [ ] Feature branch is complete and pushed
- [ ] Version bumped in `manifest.json` (e.g., 2.7 → 2.8)
- [ ] README.md updated with new features/fixes
- [ ] All changes committed
- [ ] Release branch `X.Y` created from feature branch
- [ ] Archive downloaded and renamed correctly
- [ ] Old zip removed from "latest" release
- [ ] New zip uploaded to "latest" release
- [ ] Download link verified to work

---

## Download Link

The permanent download link that always points to the latest version:

```
https://github.com/seojacky/free-vpn-chrome-extension/releases/download/latest/free-chrome-vpn-manager-by-seojacky.zip
```

This link is used in README.md and never changes.

---

## Naming Convention

- **Release name:** Match version in manifest.json (e.g., `v2.8 - Local proxy support`)
- **Branch name:** Version only (e.g., `2.8`)
- **Archive file name:** `free-chrome-vpn-manager-by-seojacky.zip` (always the same)
- **Folder inside archive:** `free-chrome-vpn-manager-by-seojacky/` (must match zip name)

---

## Notes

- Do NOT delete old releases, just keep them as version history
- Only the "latest" release gets updated with new versions
- The zip file name stays consistent so the download link never breaks
- Users will always download the latest version via the permanent link in README.md
