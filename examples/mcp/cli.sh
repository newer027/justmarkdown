#!/usr/bin/env bash
set -euo pipefail

# Anonymous: a few text conversions per day.
npx -y justmarkdown convert ./paper.pdf -o paper.md

# Account key: OCR, larger uploads, higher limits.
npx -y justmarkdown convert ./scanned.pdf \
  --api-key "$JUSTMARKDOWN_API_KEY" \
  -o scanned.md

# Public URL.
npx -y justmarkdown convert https://example.com/report.pdf -o report.md

# stdin → stdout.
cat notes.txt | npx -y justmarkdown convert - --filename notes.txt
