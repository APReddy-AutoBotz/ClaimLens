#!/bin/bash
# ClaimLens Pre-commit Contract Validation
# Runs unit tests, browser tests, and fixtures

set -e

echo "Running pre-commit checks..."
pnpm test:node && pnpm test:browser && pnpm test:fixtures
exit $?