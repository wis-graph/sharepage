# Changelog

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
