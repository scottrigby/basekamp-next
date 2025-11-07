#!/usr/bin/env bash
# filename: scrape-events.sh
# Usage:
#   ./scrape-events.sh <output_dir> [--verbose] [--dry-run]
#
# Description:
# - Uses grep/sed to extract /about/events/* links from http://basekamp.com
# - Excludes /about/events/list, /about/events/calendar, /about/events/feed
# - Creates/activates a local Python venv, ensures markdownify CLI is installed
# - Converts each event page HTML → Markdown via stdin piping
# - Outputs <slug>.md to the specified directory
# - Deactivates venv on completion
#
# Options:
# - --verbose  Print discovered links and per-file progress
# - --dry-run  Show what would be converted without fetching pages

set -euo pipefail

BASE_URL="http://basekamp.com"
HOME_URL="${BASE_URL}/"

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <output_dir> [--verbose] [--dry-run]"
  exit 1
fi

OUT_DIR="$1"
shift

VERBOSE="false"
DRY_RUN="false"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --verbose) VERBOSE="true" ;;
    --dry-run) DRY_RUN="true" ;;
    *) echo "Unknown option: $1" && exit 1 ;;
  esac
  shift
done

mkdir -p "${OUT_DIR}"

# Create/activate venv
VENV_DIR=".venv"
if [[ ! -d "${VENV_DIR}" ]]; then
  echo "Creating virtual environment at ${VENV_DIR}..."
  python3 -m venv "${VENV_DIR}"
fi
# shellcheck disable=SC1091
source "${VENV_DIR}/bin/activate"

# Ensure pip tooling and markdownify are installed
python -m pip install --upgrade pip setuptools wheel >/dev/null
if ! command -v markdownify >/dev/null 2>&1; then
  echo "Installing markdownify CLI..."
  pip install markdownify >/dev/null
fi

echo "Fetching homepage: ${HOME_URL}"

# Extract event hrefs from homepage using grep/sed
# -Eo: only matching; pattern: href="(/about/events/...)"
# Then strip href=" and trailing "
# Exclude list|calendar|feed
mapfile -t event_paths < <(
  curl -fsSL "${HOME_URL}" \
  | grep -Eo 'href="(/about/events/[^"]*)"' \
  | sed 's/^href="//; s/"$//' \
  | grep -Ev '^/about/events/(list|calendar|feed)(/|$)' \
  | sort -u
)

if [[ "${VERBOSE}" == "true" ]]; then
  echo "Discovered event paths:"
  if [[ ${#event_paths[@]} -gt 0 ]]; then
    for p in "${event_paths[@]}"; do
      echo "  - ${p}"
    done
  else
    echo "  (none)"
  fi
fi

if [[ ${#event_paths[@]} -eq 0 ]]; then
  echo "No event URLs found on homepage matching /about/events/ (excluding list/calendar/feed)."
  deactivate || true
  exit 0
fi

echo "Found ${#event_paths[@]} event URLs."

errors=0
converted=0
for path in "${event_paths[@]}"; do
  # Derive slug from path after /about/events/
  slug="${path#/about/events/}"
  slug="${slug%/}"
  if [[ -z "${slug}" ]]; then
    [[ "${VERBOSE}" == "true" ]] && echo "Skip (no slug): ${path}"
    continue
  fi
  url="${BASE_URL}${path}"
  outfile="${OUT_DIR}/${slug}.md"

  if [[ "${VERBOSE}" == "true" ]]; then
    echo "Processing: ${url} -> ${outfile}"
  fi

  if [[ "${DRY_RUN}" == "true" ]]; then
    echo "DRY-RUN would convert: ${url} -> ${outfile}"
    continue
  fi

  # Fetch HTML and pipe into markdownify CLI
  if ! curl -fsSL "${url}" \
    | markdownify --heading-style atx --strip script --strip style --autolinks \
    > "${outfile}"; then
    echo "Error converting ${url}"
    errors=$((errors + 1))
    continue
  fi

  # Ensure trailing newline
  if [[ -s "${outfile}" && "$(tail -c 1 "${outfile}" || true)" != $'\n' ]]; then
    echo >> "${outfile}"
  fi

  converted=$((converted + 1))
done

echo "Done. Converted ${converted} file(s). Output dir: ${OUT_DIR}"
if [[ ${errors} -gt 0 ]]; then
  echo "Completed with ${errors} error(s)."
fi

# Deactivate venv
deactivate || true
