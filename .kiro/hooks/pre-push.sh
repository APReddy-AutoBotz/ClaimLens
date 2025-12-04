#!/bin/bash
# ClaimLens Pre-push Hook (Bash)

echo "🚀 Running pre-push verification..."
echo ""

checks=(
    "Performance Tests:pnpm test:perf"
    "Latency Budgets:pnpm check:budgets"
    "E2E Tests:pnpm test:e2e"
)

for check in "${checks[@]}"; do
    IFS=':' read -r name cmd <<< "$check"
    echo ""
    echo "📋 $name..."
    
    if ! eval "$cmd"; then
        echo ""
        echo "❌ Pre-push verification failed"
        exit 1
    fi
done

echo ""
echo "✅ Pre-push verification passed"
exit 0
