#!/usr/bin/env pwsh
# ClaimLens Pre-commit Hook (PowerShell)

Write-Host "🔍 Running pre-commit checks...`n" -ForegroundColor Cyan

$checks = @(
    @{ Name = "Schema Validation"; Cmd = "node scripts/validate-schemas.mjs" },
    @{ Name = "Signature Verification"; Cmd = "node scripts/verify-signatures.mjs" },
    @{ Name = "Node.js Tests"; Cmd = "pnpm test:node" },
    @{ Name = "Browser Tests"; Cmd = "pnpm test:browser" },
    @{ Name = "Fixtures"; Cmd = "pnpm test:fixtures" }
)

$failed = $false

foreach ($check in $checks) {
    Write-Host "`n📋 $($check.Name)..." -ForegroundColor Yellow
    
    try {
        Invoke-Expression $check.Cmd
        if ($LASTEXITCODE -ne 0) {
            throw "Command failed with exit code $LASTEXITCODE"
        }
    }
    catch {
        Write-Host "❌ $($check.Name) failed" -ForegroundColor Red
        $failed = $true
        break
    }
}

if ($failed) {
    Write-Host "`n❌ Pre-commit checks failed" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Pre-commit checks passed" -ForegroundColor Green
exit 0
