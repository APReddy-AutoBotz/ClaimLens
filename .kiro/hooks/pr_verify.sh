#!/bin/bash
# ClaimLens PR Verification
# Runs performance tests and budget checks

set -e

echo "Running PR verification..."
pnpm test:perf && pnpm check:budgets
exit $?