# Changelog

## [1.3.1] - 2026-02-22
### Fixed
- **Dashboard Card Click**: Fixed navigation breaking when note titles contain single quotes (').
  - Changed inline onclick handlers to use `data-*` attributes for safer string handling.
  - Applied to card paths, file references, and tag filters.

## [1.3.0] - 2026-02-22
### Added
- **Copy Markdown Button**: Added a button to copy the original markdown source to clipboard.
  - Located in the navbar (next to Share button) and only visible on document pages.
  - Uses clipboard icon with the same styling as other navbar buttons.
  - Shows "Markdown Copied!" toast notification on success.

## [1.2.0] - 2026-02-17
### Fixed
- **Indented Callouts**: Supported callouts nested within lists or blocks with leading whitespace.
  - Correctly detects `  > [!TYPE]` patterns.
  - Preserves indentation level to maintain list hierarchy during rendering.
  - Improved multi-line callout parsing to handle nested markdown more robustly.

## [1.1.9] - 2026-02-17
### Added
- **Global Toast Notification System**: Replaced localized tooltips with a premium, top-centered notification system.
  - **Thematic Integration**: Automatically adapts colors based on light/dark mode with glassmorphism (blur) effects.
  - **Sharp Design**: Matches the project's aesthetic with zero border-radius and high-contrast borders.
  - **Top-Down UX**: Positioned near the navbar to minimize eye movement after interaction.
- **Refined Share UX**: 
  - Added smooth rotations and micro-scale animations to the Share button.
  - Enhanced visual feedback with success (✅) and error (❌) states in toasts.

### Improved
- **Deployment Robustness**: Updated `npm run deploy` to use a "local-first" (`-X ours`) merge strategy.
  - Prevents "git push rejected" errors caused by GitHub Actions' automatic index updates.
  - Ensures local source-of-truth is always preserved while integrating remote changes.

### Fixed
- **Local Development Environment**: Updated `index.html` to use relative paths for CSS/JS assets during local testing, ensuring real-time changes are visible without deployment.

[1.1.8] - 2026-02-17
### Added
- **Share Link Feature**: Added a "Share" button to the navbar that copies the current page's URL to the clipboard.
  - Automatically **decodes Korean characters** (unencoded) in the URL for better readability when sharing.
  - Provides visual feedback (button color change) upon successful copying.
  - Supports both dashboard and individual document pages.

## [1.1.7] - 2026-02-16
### Added
- **Internal Link Infrastructure**: Robust handling of Obsidian same-page heading links (`[[#Heading]]`) and cross-page heading links (`[[Note#Heading]]`).
  - Implemented smooth scrolling with fixed header offset (-85px) for anchor navigation.
- **Custom CSS Support**: Users can now override any system style by editing `css/custom.css`.
  - Added `CUSTOM_STYLE_GUIDE.md` (EN/KR) for users and developers.
- **Hybrid Rendering Strategy**: Formalized "Hybrid Render" workflow for Obsidian plugins (Pre-render local HTML -> Atomic Push -> Indexing).
- **Korean Localization**: Added `PLUGIN_INTEGRATION_GUIDE_KR.md` for Korean plugin developers.

### Fixed
- **State Persistence**: Fixed a critical issue where `file_index.json` updates and orphan cleanups were not being pushed back to the repository from GitHub Actions.
- **Orphan Cleanup**: Enhanced the sync script to automatically detect and remove legacy folder structures (`posts/Note/index.html`) to maintain a clean file-based architecture.
- **Navigation**: Preserved URL hashes during client-side routing transitions.

## [1.1.6] - 2026-02-15
### Added
- **Plugin Infrastructure**: Added `scripts/core-logic.js` for standalone logic reuse in Obsidian plugins without requiring full repository clones.
- **OG Stability**: Switched to a flat `.html` file structure in `posts/` for 100% compatibility with KakaoTalk/SNS crawlers (resolves 301 redirect issues).
- **Dashboard Intelligence**: Automatic management of `_dashboard.md`.
  - Automatically adds unlinked notes to the `## Inbox` section.
  - Automatically cleans up dead links from the dashboard when files are deleted.
- **Korean OS Support**: Forced NFC (Normalization Form C) for all filenames to fix encoding mismatches between macOS (NFD) and GitHub/SNS Crawlers.

### Optimized
- **GitHub Actions**: 
  - Implementation of deployment concurrency to cancel redundant runs.
  - Faster builds by removing unnecessary dependency installs.
- **Absolute Paths**: All critical assets and OG meta tags now use absolute URLs linked to the target domain for better indexability.

### Fixed
- **Dashboard Interactivity**: Fixed broken search and tag filtering event handlers.
- **Path Resolution**: Resolved issues where Korean filenames caused 404s on certain scrapers.

## [1.1.0] - 2026-02-15
### Added
- Content Management: Delete uploaded notes directly from Obsidian settings.
- Background Deployment Monitoring: Real-time notifications for GitHub Actions status.
- Real-time Timer: Tracks deployment duration in the deletion manager.
- Deployment Status Board: View build history and retry failed deployments from settings.

### Fixed
- Description Cleaning: Strips Markdown formatting and Obsidian links from dashboard cards.
- Layout: Hide sections with zero notes on the dashboard.
- GitHub Sync: Strategic polling (30s delay + 5s intervals) for more responsive updates.
- Atomicity: Core files are updated as a single commit to prevent deployment race conditions.

## [1.0.0] - 2026-02-10
- Initial release with automated GitHub Pages deployment.
- Mobile-responsive dashboard with search and tag filtering.
- Automatic image upload support.
