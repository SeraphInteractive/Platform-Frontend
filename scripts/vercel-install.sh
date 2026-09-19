#!/bin/bash
# Vercel Install Script (Option A: Token-based Sibling Clone)
# Clones Platform-Internal-Logic as a sibling directory using GITHUB_TOKEN
# so the standard file:../vote-internals dependency builds properly.

set -e

echo ">>> Checking Platform-Internal-Logic dependency..."
if [ ! -d "../vote-internals" ]; then
  if [ -n "$GITHUB_TOKEN" ]; then
    echo ">>> Cloning Platform-Internal-Logic with GITHUB_TOKEN..."
    git clone --depth 1 "https://${GITHUB_TOKEN}@github.com/SeraphInteractive/Platform-Internal-Logic.git" ../vote-internals
  else
    echo ">>> Cloning Platform-Internal-Logic..."
    git clone --depth 1 "https://github.com/SeraphInteractive/Platform-Internal-Logic.git" ../vote-internals
  fi
  echo ">>> Platform-Internal-Logic cloned successfully."
else
  echo ">>> vote-internals already exists."
fi

echo ">>> Building vote-internals..."
cd ../vote-internals
npm install
npm run build
cd -

echo ">>> Installing vote-ui dependencies..."
npm install

echo ">>> Build environment ready."
