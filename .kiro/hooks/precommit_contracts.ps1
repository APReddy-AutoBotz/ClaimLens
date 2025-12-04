# ClaimLens Pre-commit Contract Validation (PowerShell)
Write-Host "🔍 Running pre-commit checks..." -ForegroundColor Cyan

Write-Host "Running Node.js tests..." -ForegroundColor Yellow
pnpm test:node
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Node tests failed" -ForegroundColor Red
    exit 1
}

Write-Host "Running Browser tests..." -ForegroundColor Yellow
pnpm test:browser
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Browser tests failed" -ForegroundColor Red
    exit 1
}

Write-Host "Running Fixtures..." -ForegroundColor Yellow
pnpm test:fixtures
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Fixtures failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Pre-commit checks passed" -ForegroundColor Green
exit 0
