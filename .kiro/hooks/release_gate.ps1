# ClaimLens Release Gate (PowerShell)
Write-Host "🚪 Running release gate checks..." -ForegroundColor Cyan

Write-Host "Running release gate..." -ForegroundColor Yellow
pnpm hooks:release
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Release gate failed" -ForegroundColor Red
    exit 1
}

Write-Host "Verifying coverage thresholds (≥80%)..." -ForegroundColor Yellow
pnpm test:node --coverage
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Node coverage check failed" -ForegroundColor Red
    exit 1
}

pnpm test:browser --coverage
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Browser coverage check failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Release gate passed" -ForegroundColor Green
exit 0
