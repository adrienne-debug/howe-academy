#!/bin/bash
# Bakes tts/<hash>.m4a speech files from scripts/tts_list.tsv (built by gen_tts.js)
# using the Mac's Samantha voice. Incremental: existing files are skipped, so re-runs
# after deck changes only synthesize the new words. Run from anywhere:
#   node scripts/gen_tts.js && bash scripts/gen_tts.sh
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p tts
n=0; skip=0
while IFS=$'\t' read -r hash text; do
  [ -z "$hash" ] && continue
  out="tts/$hash.m4a"
  if [ -f "$out" ]; then skip=$((skip+1)); continue; fi
  tmp="$(mktemp -t hatts).aiff"
  say -v Samantha -o "$tmp" -- "$text"
  afconvert -f m4af -d aac -b 48000 "$tmp" "$out" >/dev/null
  rm -f "$tmp"
  n=$((n+1))
done < scripts/tts_list.tsv
echo "synthesized $n new, skipped $skip existing → tts/ ($(ls tts | wc -l | tr -d ' ') files)"
