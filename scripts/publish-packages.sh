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

# A run that publishes nothing is a failure, not a success. `lerna version` exits 0 when
# it declines to version (an EBEHIND warning on a stale checkout, for example), which
# leaves the manifests at their released versions and makes every package look already
# published. Without this the job goes green having shipped nothing.
if [ "$published" -eq 0 ]; then
  echo "error: no packages were published." >&2
  echo "The manifest versions above are already on the registry, so the Version step" >&2
  echo "did not produce a new release. Check the Version step output rather than" >&2
  echo "re-running this job: re-running a workflow checks out its original commit," >&2
  echo "which still carries the pre-release versions." >&2
  exit 1
fi
