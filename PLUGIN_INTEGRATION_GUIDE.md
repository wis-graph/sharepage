# SharePage Obsidian Plugin Integration Guide

This guide is for developers (and AI agents) building an Obsidian plugin to interface with the SharePage GitHub repository.

## 🏗 Architectural Overview

To minimize deployment delay and ensure consistent social media previews (Open Graph), the system follows a **Hybrid Rendering Strategy**:

| Component | Responsibility |
| :--- | :--- |
| **Obsidian Plugin** | Immediate "Pre-packaging": Generates OG HTML and updates Dashboard before pushing. |
| **GitHub REST API** | Data Exchange: Handles multi-file commits without full repository clones. |
| **GitHub Actions** | Background Maintenance: Syncs legacy files, bundles CSS, and triggers final CDN deployment. **Orphan Cleanup**: Automatically removes HTML/Dashboard links if Markdown is deleted. |

---

## 📂 Core Scripts to Reference

Study these files to understand the transformation logic the plugin must implement:

1.  **`scripts/core-logic.js` (The Brain)**: 
    *   Contains `applyMetadataToTemplate` for HTML generation.
    *   Contains `updateDashboardContent` for surgical dashboard updates.
    *   Contains `normalizeName` for critical NFC normalization.
2.  **`scripts/classifier.js` (The Classifier)**:
    *   Defines the rules for mapped `type` or `source_type` to dashboard sections (e.g., "YouTube").
3.  **`scripts/processors/` (Metadata Extractors)**:
    *   Rules for extracting titles, descriptions, and thumbnails from different markdown types (e.g., YouTube vs Standard).

---

## 🛠 Shared Logic (`scripts/core-logic.js`, `scripts/classifier.js`)

The plugin must mirror the logic in these scripts to ensure total consistency.

### Key Logic Modules to Implement in Plugin:

1.  **NFC Normalization**: All Korean filenames/paths must be forced to NFC.
    ```javascript
    const normalized = name.normalize('NFC');
    ```

2.  **Metadata Extraction**: Parse YAML frontmatter and clean text for OG tags.
    *   Strip Markdown links `[[...]]` and formatting.
    *   Extract `title`, `description`, `thumbnail`, and `tags`.

3.  **HTML Builder**:
    *   Fetch `src/index.html` from the repo.
    *   Replace placeholders: `{{TITLE}}`, `{{DESCRIPTION}}`, `{{PAGE_URL}}`, `{{OG_IMAGE}}`, `{{DOMAIN}}`.
    *   **Rule**: Use absolute URLs for all assets. Format: `${DOMAIN}/posts/${normalizedName}.html`.

4.  **Classifier Engine**:
    *   Refer to `scripts/classifier.js` to determine which Dashboard section a note belongs to.
    *   **Logic**: Check for `type` or `source_type` in metadata.
    *   **Mapping**: If the type is `youtube`, the target section is `## YouTube`. Otherwise, defaults to `## Inbox`.

5.  **Dashboard Synchronizer**:
    *   Fetch `notes/_dashboard.md`.
    *   Use the **Classifier Engine** to find the correct heading (e.g., `## YouTube` or `## Inbox`).
    *   Inject `- [[NoteName]] YYYY-MM-DD` under that specific section.
    *   Do not replace the whole file; perform surgical insertion.

---

## 🚀 Plugin Workflow (Step-by-Step)

To achieve "Instant Share" without waiting for GitHub Actions, the plugin should perform the following sequence:

### Step 1: Data Retrieval
Fetch required context from GitHub via REST API (GET):
*   `src/index.html` (The template for HTML generation)
*   `notes/_dashboard.md` (The current index for surgery)
*   `posts/file_index.json` (The registry of all uploaded notes - use this for listing/management)

### Step 2: In-Memory Processing
Do not write to disk. Process everything in memory:
1.  Extract frontmatter from the active Obsidian note.
2.  Generate the static HTML for social previews.
3.  Generate the updated `_dashboard.md` string.

### Step 3: Atomic Multi-File Commit
Use the GitHub REST API to push **all files in a single commit**. This prevents partial deployments and reduces Action triggers.
*   **Files in Commit**:
    1.  `notes/Your-Note.md` (The content)
    2.  `posts/Your-Note.html` (The OG preview)
    3.  `notes/_dashboard.md` (The updated index)

### Step 4: Note Removal & Bulk Operations
To delete notes or perform bulk actions:
1.  **Listing**: Read `posts/file_index.json` to get the list of shared notes.
2.  **Removal**: Sending a `DELETE` operation for `notes/Name.md` is sufficient. 
    *   *Note*: The GitHub Action will automatically clean up the corresponding `posts/Name.html` and `_dashboard.md` links (Orphan Cleanup).
    *   For absolute instant consistency, you may also delete `posts/Name.html` in the same commit.

### Step 5: Deployment Tracking
After pushing, poll the GitHub API (`/repos/{owner}/{repo}/pages/deployments`) to track the deployment status.
1.  Inform the user: "Pushing to GitHub..."
2.  Inform the user: "Deploying to Web Server (approx. 30s)..."
3.  Once the status is `succeed`, copy the URL to the clipboard and alert: "Share link ready!"

---

## 🔄 Force Rebuild

### Overview
A "nuclear option" for when templates change significantly or all HTML files need to be regenerated.

### How It Works
1.  A `.rebuild` file exists at the repository root.
2.  When the plugin updates this file's content (timestamp) and pushes, the `rebuild.yml` workflow is triggered.
3.  GitHub Actions runs `scripts/rebuild-all.js` to force-regenerate all HTML and clean orphan files.

### Plugin Implementation

**1. Add a "Force Rebuild" button in settings**
```typescript
// Example (Plugin settings tab)
new ButtonComponent(containerEl)
    .setButtonText("Force Rebuild All")
    .setTooltip("Rebuild all documents from scratch")
    .onClick(async () => {
        await this.triggerRebuild();
    });
```

**2. Implement the trigger function**
```typescript
async function triggerRebuild(): Promise<void> {
    // 1. Fetch current .rebuild file
    const response = await octokit.rest.repos.getContent({
        owner: OWNER,
        repo: REPO,
        path: '.rebuild'
    });
    
    // 2. Update with new timestamp
    const newContent = `last_rebuild: ${new Date().toISOString()}\n`;
    
    // 3. Commit & push
    await octokit.rest.repos.createOrUpdateFileContents({
        owner: OWNER,
        repo: REPO,
        path: '.rebuild',
        message: 'chore: trigger force rebuild',
        content: Buffer.from(newContent).toString('base64'),
        sha: response.data.sha // Existing file SHA required
    });
    
    // 4. Notify user
    new Notice('Rebuild triggered. Completion takes ~1-2 minutes.');
}
```

### What Rebuild Does
- Iterates through all `notes/*.md` files
- **Forces** regeneration of `posts/*.html` (no incremental check)
- Automatically deletes orphan HTML files (no corresponding markdown)
- Cache busting (applies new timestamps to all JS/CSS)
- Updates `index.html`, `404.html`, `file_index.json`

### When to Use
- After major template (`src/index.html`) changes
- After `js/` or `css/` core file updates
- When some HTML files are corrupted or missing

### Caution
- **Don't overuse**: Full rebuild takes time.
- **Normal uploads**: Regular note uploads are handled incrementally by `deploy.yml`.

---

## 🤖 Tips for AI Developers

- **No Clone Needed**: Use `Octokit` or native `fetch` with GitHub REST API.
- **Base64 Encoding**: GitHub API requires file content to be Base64 encoded.
- **Handle 404s**: Create `posts/` or `notes/` directories silently if the first push fails due to missing paths.
- **NFC is Critical**: If you miss `.normalize('NFC')`, Korean links will break on KakaoTalk/Facebook.
- **URL Safety**: Always use `encodeURIComponent` for filenames in the `{{PAGE_URL}}` tag.

---

## 🔗 Reference URLs
- **Post Path**: `${DOMAIN}/posts/${encodeURIComponent(name)}.html`
- **Asset Path**: `${DOMAIN}/images/${imageName}`
- **Styles**: Always link to `${DOMAIN}/css/bundle.css`
