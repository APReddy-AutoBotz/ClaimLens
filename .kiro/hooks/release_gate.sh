#!/bin/bash
# ClaimLens Release Gate
# Full CI pipeline with coverage checks

set -e

echo "Running release gate checks..."
pnpm hooks:release

echo "Verifying coverage thresholds (≥80%)..."
pnpm test:node --coverage
pnpm test:browser --coverage

exit $?