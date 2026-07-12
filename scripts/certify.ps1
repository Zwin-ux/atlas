# One-call certification ladder. Usage:
#   powershell -File scripts/certify.ps1            (full ladder)
#   powershell -File scripts/certify.ps1 -NodeOnly  (skip browser gates)
param([switch]$NodeOnly)
$ErrorActionPreference = "Continue"
Set-Location "$PSScriptRoot\.."
$fails = @()
function Step($name, $script) {
  Write-Host "== $name" -ForegroundColor Cyan
  $global:LASTEXITCODE = 0
  & $script
  # Pipelines ending in cmdlets can leave LASTEXITCODE stale from an earlier
  # native call — each Step body must therefore end with the native command
  # OR the block captures its own code. Reset-before + read-after is the
  # contract; audit false-FAIL on 162/0 was this bug.
  if ($LASTEXITCODE -ne 0) { $script:fails += $name; Write-Host "FAIL $name" -ForegroundColor Red }
}
Step "typecheck" { pnpm typecheck:starter 2>$null | Out-Null }
Step "test:core" { pnpm test:core 2>$null | Select-String 'Tests ' }
Step "sweep" { node scripts/verify-archetype-identity-sweep.mjs 2>$null | Select-Object -Last 1 }
Step "tool-shape" { node scripts/verify-tool-result-shape.mjs 2>$null | Out-Null }
Step "save-surface" { node scripts/verify-save-surface-flag.mjs 2>$null | Out-Null }
Step "hardening" { node scripts/verify-server-hardening.mjs 2>$null | Out-Null }
if (-not $NodeOnly) {
  Step "build:web" { pnpm build:web 2>$null | Select-Object -Last 1 }
  Get-NetTCPConnection -LocalPort 8787 -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique |
    ForEach-Object { Stop-Process -Id $_ -Force -Confirm:$false -ErrorAction SilentlyContinue }
  Start-Process -FilePath node -ArgumentList "node_modules\tsx\dist\cli.mjs","server/src/index.ts" -WindowStyle Hidden
  Start-Sleep -Seconds 14
  Step "audit" { node scripts/verify-emulator-audit.mjs 2>$null | Select-String '"pass":|"fail":' | Select-Object -First 2 }
  Step "perf" { node scripts/verify-emulator-perf.mjs 2>$null | Out-Null }
}
if ($fails.Count -eq 0) { Write-Host "CERTIFIED GREEN" -ForegroundColor Green; exit 0 }
Write-Host ("CERTIFICATION FAILED: " + ($fails -join ", ")) -ForegroundColor Red
exit 1
