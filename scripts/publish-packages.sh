#!/usr/bin/env bash
#
# Publishes each package whose current version is not on the registry yet.
#
# Versioning still runs through `lerna version`, but the upload has to go through the
# npm CLI: lerna 4 publishes with libnpmpublish@4, which supports neither provenance
# nor OIDC trusted publishing, so `lerna publish` cannot satisfy npm's requirements.
#
# Run this after `npm run version:ci`, from the repo root.

set -euo pipefail

published=0

for manifest in packages/*/package.json; do
  pkg_dir=$(dirname "$manifest")
  name=$(node -p "require('./$manifest').name")
  version=$(node -p "require('./$manifest').version")

  if [ "$(node -p "require('./$manifest').private === true")" = "true" ]; then
    echo "skip     $name (private)"
    continue
  fi

  # Lerna versions packages independently, so a release may bump only one of them.
  if npm view "$name@$version" version >/dev/null 2>&1; then
    echo "skip     $name@$version (already on registry)"
    continue
  fi

  echo "publish  $name@$version"
  (cd "$pkg_dir" && npm publish --provenance --access public)
  published=$((published + 1))
done

echo "published $published package(s)"
