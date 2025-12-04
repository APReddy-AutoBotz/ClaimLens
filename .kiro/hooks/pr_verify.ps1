# ClaimLens PR Verification (PowerShell)
Write-Host "🚀 Running PR verification..." -ForegroundColor Cyan

Write-Host "Running Performance tests..." -ForegroundColor Yellow
pnpm test:perf
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Performance tests failed" -ForegroundColor Red
    exit 1
}

Write-Host "Checking Budgets..." -ForegroundColor Yellow
pnpm check:budgets
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Budget checks failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ PR verification passed" -ForegroundColor Green
exit 0
