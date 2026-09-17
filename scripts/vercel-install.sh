#!/bin/bash
# Vercel Install Script
# Clones the vote-internals sibling repo so the Vite alias and
# file: dependency resolve correctly during the Vercel build.

set -e

echo ">>> Cloning Platform-Internal-Logic as sibling..."
if [ ! -d "../vote-internals" ]; then
  git clone --depth 1 https://github.com/SeraphInteractive/Platform-Internal-Logic.git ../vote-internals
  echo ">>> Cloned successfully."
else
  echo ">>> vote-internals already exists, skipping clone."
fi

echo ">>> Building vote-internals..."
cd ../vote-internals
npm install
npm run build
cd -

echo ">>> Installing vote-ui dependencies..."
npm install

echo ">>> Done."
