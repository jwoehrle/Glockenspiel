#!/usr/bin/env bash
# Build the gh-pages layout locally: live site at /Glockenspiel/, one PR preview at /Glockenspiel/pr-preview/pr-1/.
set -euo pipefail
cd "$(dirname "$0")/.."
rm -rf .site
npx vite build --outDir .site/Glockenspiel --emptyOutDir
BASE_PATH=/Glockenspiel/pr-preview/pr-1/ VITE_PREVIEW="PR 1" \
  npx vite build --outDir .site/Glockenspiel/pr-preview/pr-1 --emptyOutDir
