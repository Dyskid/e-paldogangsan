# Project Overview Update System

This directory contains scripts for automatically updating the PROJECT_OVERVIEW.md file.

## Files

- `update-overview.ts` - Main script that updates the overview
- `overview-helpers.ts` - Helper functions for scanning and analyzing the project

## Usage

### Manual Update
```bash
npm run update-overview
```

### Watch Mode
Automatically updates the overview when files change:
```bash
npm run update-overview:watch
```

### Git Hooks
The overview is automatically updated:
- Before each commit (pre-commit hook)
- After merging branches (post-merge hook)

## Features

### Automatic Updates
- Project structure tree generation
- Data statistics (malls, products, regions, categories)
- File and directory counts
- Git branch and commit information
- Timestamp updates

### File Watching
- Monitors src/, public/, and data directories
- Debounced updates (2 second delay)
- Ignores node_modules and hidden files

### Helper Functions
- Component scanning and documentation
- API endpoint discovery
- Dependency analysis
- Lines of code counting
- Changelog generation

## Setup

1. Install dependencies:
```bash
npm install
```

2. Initialize git hooks:
```bash
npm run prepare
```

## How It Works

1. **Data Collection**: The script reads JSON files in src/data/ to get counts
2. **Structure Analysis**: Recursively scans directories to build the tree
3. **Git Integration**: Uses git commands to get branch and commit info
4. **Section Updates**: Updates specific sections while preserving others
5. **Footer Statistics**: Adds comprehensive statistics at the end

## Customization

To add new sections or modify existing ones:

1. Edit `update-overview.ts`
2. Add new update methods following the pattern:
   ```typescript
   private updateNewSection(content: string, stats: ProjectStats): string {
     // Your update logic
   }
   ```
3. Call your method in the `updateOverview()` function

## Notes

- The script preserves manual edits to sections it doesn't update
- Statistics are always current when the script runs
- File watching uses native fs.watch for efficiency
- Git hooks ensure the overview is always up-to-date in commits