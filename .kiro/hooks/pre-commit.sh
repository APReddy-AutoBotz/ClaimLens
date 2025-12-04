#!/bin/bash
# ClaimLens Pre-commit Hook (Bash)

echo "🔍 Running pre-commit checks..."
echo ""

checks=(
    "Schema Validation:node scripts/validate-schemas.mjs"
    "Signature Verification:node scripts/verify-signatures.mjs"
    "Node.js Tests:pnpm test:node"
    "Browser Tests:pnpm test:browser"
    "Fixtures:pnpm test:fixtures"
)

for check in "${checks[@]}"; do
    IFS=':' read -r name cmd <<< "$check"
    echo ""
    echo "📋 $name..."
    
    if ! eval "$cmd"; then
        echo ""
        echo "❌ Pre-commit checks failed"
        exit 1
    fi
done

echo ""
echo "✅ Pre-commit checks passed"
exit 0
