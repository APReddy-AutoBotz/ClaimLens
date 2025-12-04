#!/usr/bin/env pwsh
# ClaimLens Pre-push Hook (PowerShell)

Write-Host "🚀 Running pre-push verification...`n" -ForegroundColor Cyan

$checks = @(
    @{ Name = "Performance Tests"; Cmd = "pnpm test:perf" },
    @{ Name = "Latency Budgets"; Cmd = "pnpm check:budgets" },
    @{ Name = "E2E Tests"; Cmd = "pnpm test:e2e" }
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
    Write-Host "`n❌ Pre-push verification failed" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Pre-push verification passed" -ForegroundColor Green
exit 0
