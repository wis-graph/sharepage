# SharePage Obsidian Plugin Integration Guide

This guide is for developers (and AI agents) building an Obsidian plugin to interface with the SharePage GitHub repository.

## 🏗 Architectural Overview

To minimize deployment delay and ensure consistent social media previews (Open Graph), the system follows a **Hybrid Rendering Strategy**:

| Component | Responsibility |
| :--- | :--- |
| **Obsidian Plugin** | Immediate "Pre-packaging": Generates OG HTML and updates Dashboard before pushing. |
| **GitHub REST API** | Data Exchange: Handles multi-file commits without full repository clones. |
| **GitHub Actions** | Background Maintenance: Syncs legacy files, bundles CSS, and triggers final CDN deployment. |

---

## 🛠 Shared Logic (`scripts/core-logic.js`)

The plugin must mirror the logic in `scripts/core-logic.js` to ensure total consistency.

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

4.  **Dashboard Synchronizer**:
    *   Fetch `notes/_dashboard.md`.
    *   Inject `- [[NoteName]] YYYY-MM-DD` under the `## Inbox` section if not present.
    *   Do not replace the whole file; perform surgical insertion.

---

## 🚀 Plugin Workflow (Step-by-Step)

To achieve "Instant Share" without waiting for GitHub Actions, the plugin should perform the following sequence:

### Step 1: Data Retrieval
Fetch required context from GitHub via REST API (GET):
*   `src/index.html` (The template)
*   `notes/_dashboard.md` (The current index)
*   (Optional) `package.json` to detect system versions.

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

### Step 4: Deployment Tracking
After pushing, poll the GitHub API (`/repos/{owner}/{repo}/pages/deployments`) to track the deployment status.
1.  Inform the user: "Pushing to GitHub..."
2.  Inform the user: "Deploying to Web Server (approx. 30s)..."
3.  Once the status is `succeed`, copy the URL to the clipboard and alert: "Share link ready!"

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
