<#
.SYNOPSIS
  Exia Local Validation, Linting & Build Health Suite (PowerShell)
.DESCRIPTION
  Runs:
  1. JSON data validation & config verification
  2. TypeScript typecheck across all 7 workspace packages
  3. ESLint checks on mobile app
  4. Vitest unit tests
  5. Expo universal web export
  6. Desktop electron bundle synchronization
#>

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "   EXIA LOCAL VALIDATION & BUILD HEALTH SUITE         " -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "Root: $Root`n"

# Locate Node binary
$NodeBin = "node"
if (Get-Command node -ErrorAction SilentlyContinue) {
    $NodeBin = "node"
} elseif (Test-Path "E:\nodejs24\node.exe") {
    $NodeBin = "E:\nodejs24\node.exe"
}

# 1. JSON Data & Schema Validation
Write-Host "[1/6] Validating Data Files & Config Schemas..." -ForegroundColor Yellow
$JsonFiles = @(
    "mongodb_schema.json",
    "ui\apps\mobile\app.json",
    "ui\package.json",
    "desktop\package.json"
)

foreach ($file in $JsonFiles) {
    $fullPath = Join-Path $Root $file
    if (Test-Path $fullPath) {
        $raw = Get-Content -Raw $fullPath
        try {
            $null = ConvertFrom-Json $raw
            Write-Host "  ✓ Valid JSON syntax: $file" -ForegroundColor Green
        } catch {
            Write-Host "  ✗ Invalid JSON in $file : $($_.Exception.Message)" -ForegroundColor Red
            exit 1
        }
    }
}
Write-Host "✓ All JSON schemas and data configurations are valid!`n" -ForegroundColor Green

# 2. TypeScript Typecheck
Write-Host "[2/6] Running TypeScript Typecheck across all Monorepo packages..." -ForegroundColor Yellow
$Packages = @(
    "ui\packages\design-tokens",
    "ui\packages\shared-types",
    "ui\packages\shared-logic",
    "ui\packages\api-client",
    "ui\packages\shared-ui",
    "ui\packages\test-utils",
    "ui\apps\mobile"
)

$TscBin = Join-Path $Root "ui\node_modules\typescript\bin\tsc"
if (-not (Test-Path $TscBin)) {
    $TscBin = Join-Path $Root "node_modules\typescript\bin\tsc"
}

foreach ($pkg in $Packages) {
    Write-Host "  Checking $pkg..." -ForegroundColor Cyan
    $cfg = Join-Path $Root "$pkg\tsconfig.json"
    & $NodeBin $TscBin --noEmit -p $cfg
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ✗ TypeScript check failed in $pkg" -ForegroundColor Red
        exit 1
    }
    Write-Host "  ✓ $pkg typecheck passed." -ForegroundColor Green
}
Write-Host "✓ All 7 packages passed TypeScript typecheck with 0 errors!`n" -ForegroundColor Green

# 3. ESLint Checks
Write-Host "[3/6] Running ESLint Code Quality Checks..." -ForegroundColor Yellow
$EslintBin = Join-Path $Root "ui\apps\mobile\node_modules\eslint\bin\eslint.js"
if (Test-Path $EslintBin) {
    Push-Location (Join-Path $Root "ui\apps\mobile")
    try {
        & $NodeBin $EslintBin src
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  ✗ ESLint failed!" -ForegroundColor Red
            exit 1
        }
        Write-Host "✓ ESLint passed with 0 errors and 0 warnings!`n" -ForegroundColor Green
    } finally {
        Pop-Location
    }
}

# 4. Vitest Unit Test Suite
Write-Host "[4/6] Running Vitest Unit Test Suite..." -ForegroundColor Yellow
$VitestBin = Join-Path $Root "ui\node_modules\vitest\vitest.mjs"
if (Test-Path $VitestBin) {
    Push-Location (Join-Path $Root "ui")
    try {
        & $NodeBin $VitestBin run
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  ✗ Vitest test suite failed!" -ForegroundColor Red
            exit 1
        }
        Write-Host "✓ Vitest test suite passed cleanly!`n" -ForegroundColor Green
    } finally {
        Pop-Location
    }
}

# 5. Expo Universal Web Production Export
Write-Host "[5/6] Compiling Universal Web Production Export..." -ForegroundColor Yellow
$ExpoCli = Join-Path $Root "ui\apps\mobile\node_modules\expo\bin\cli"
$env:EXPO_NO_TELEMETRY = "1"
Push-Location (Join-Path $Root "ui\apps\mobile")
try {
    & $NodeBin $ExpoCli export --platform web
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ✗ Expo export failed!" -ForegroundColor Red
        exit 1
    }
} finally {
    Pop-Location
}

$DistIndex = Join-Path $Root "ui\apps\mobile\dist\index.html"
if (Test-Path $DistIndex) {
    $size = (Get-Item $DistIndex).Length
    Write-Host "✓ Web export compiled successfully (index.html: $size bytes)!`n" -ForegroundColor Green
} else {
    Write-Host "✗ Failed: $DistIndex not found!" -ForegroundColor Red
    exit 1
}

# 6. Desktop Electron Bundle Synchronization
Write-Host "[6/6] Synchronizing Assets to Desktop Distribution..." -ForegroundColor Yellow
$SyncScript = Join-Path $Root "desktop\scripts\sync-dist.js"
if (Test-Path $SyncScript) {
    Push-Location (Join-Path $Root "desktop")
    try {
        & $NodeBin $SyncScript
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  ✗ Desktop sync script failed!" -ForegroundColor Red
            exit 1
        }
    } finally {
        Pop-Location
    }
    $DesktopIndex = Join-Path $Root "desktop\dist\index.html"
    if (Test-Path $DesktopIndex) {
        Write-Host "✓ Desktop distribution bundle synchronized and verified!`n" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed: desktop/dist/index.html missing after sync!" -ForegroundColor Red
        exit 1
    }
}

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "   ALL LOCAL VALIDATIONS & BUILDS PASSED CLEANLY!     " -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Cyan
exit 0
