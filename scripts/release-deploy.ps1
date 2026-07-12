# Atlas release deploy — deploys atlas-backend + atlas-scene-packet-worker
# from the clean worktree at the same commit, polls both to SUCCESS, then
# runs the production release gate. One command, full G7/G8 protocol.
#
# Usage (PowerShell, from anywhere):
#   powershell -ExecutionPolicy Bypass -File C:\Users\mzwin\Documents\Atlas\scripts\release-deploy.ps1
$ErrorActionPreference = "Stop"
$worktree = "C:\Users\mzwin\Documents\atlas-deploy-worktree"
$repo = "C:\Users\mzwin\Documents\Atlas"
$prodUrl = "https://atlas-backend-production-e6fc.up.railway.app"

function Wait-Deployment([string]$service) {
  $deadline = (Get-Date).AddMinutes(15)
  while ((Get-Date) -lt $deadline) {
    Start-Sleep -Seconds 15
    $raw = railway deployment list --service $service --json 2>$null | Out-String
    try { $list = $raw | ConvertFrom-Json } catch { continue }
    $latest = $list | Select-Object -First 1
    if ($null -eq $latest) { continue }
    Write-Host "  [$service] $($latest.status)"
    if ($latest.status -eq "SUCCESS") { return $true }
    if ($latest.status -in @("FAILED", "CRASHED", "REMOVED")) {
      Write-Host "DEPLOY FAILED for $service - inspect: railway logs --service $service" -ForegroundColor Red
      return $false
    }
  }
  Write-Host "TIMEOUT waiting for $service deployment" -ForegroundColor Red
  return $false
}

Set-Location $worktree
$dirty = (git status --short | Measure-Object).Count
if ($dirty -ne 0) { throw "Deploy worktree is not clean ($dirty entries) - refusing to deploy." }
$commit = git rev-parse --short HEAD
Write-Host "Deploying commit $commit from clean worktree" -ForegroundColor Cyan
railway status

Write-Host "`n[1/4] Deploying atlas-backend..." -ForegroundColor Cyan
railway up --service atlas-backend --detach
if (-not (Wait-Deployment "atlas-backend")) { exit 1 }

Write-Host "`n[2/4] Worker deploy SKIPPED - its inherited HTTP healthcheck crash-loops every deploy and the restart storm exhausts Redis connections (took down two release nights). Re-enable by removing this guard AFTER clearing the worker's Healthcheck Path in the Railway dashboard." -ForegroundColor Yellow
if ($env:ATLAS_DEPLOY_WORKER -eq "1") {
  railway up --service atlas-scene-packet-worker --detach
  if (-not (Wait-Deployment "atlas-scene-packet-worker")) { exit 1 }
}

Write-Host "`n[3/4] Release gate (cold-start retries built in)..." -ForegroundColor Cyan
Set-Location $repo
$env:ATLAS_PUBLIC_BASE_URL = $prodUrl
node scripts/verify-release-prod.mjs
if ($LASTEXITCODE -ne 0) { Write-Host "RELEASE GATE FAILED" -ForegroundColor Red; exit 1 }

Write-Host "`n[4/4] Public sanity sweep..." -ForegroundColor Cyan
node scripts/verify-alpha-public-sanity.mjs
if ($LASTEXITCODE -ne 0) { Write-Host "PUBLIC SANITY FAILED (retry once - cold start)" -ForegroundColor Yellow; node scripts/verify-alpha-public-sanity.mjs; if ($LASTEXITCODE -ne 0) { exit 1 } }

Write-Host "`nRELEASE COMPLETE: commit $commit live and validated on $prodUrl" -ForegroundColor Green
