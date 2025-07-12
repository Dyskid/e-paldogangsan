#!/bin/bash

# Script to commit and push changes with proper permissions

echo "Staging all changes..."
sudo chown -R $(whoami):$(whoami) .git
git add -A

echo "Creating commit..."
git commit -m "$(cat <<'EOF'
Update intelligent scraper plan and add automation scripts

- Modified CLAUDE.md with development instructions
- Updated intelligent scraper plan documentation
- Added automate.py for scraping automation
- Added mall scraper mapping files

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

echo "Pushing to remote..."
git push origin test

echo "Done!"