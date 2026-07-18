# Atlas release deploy - deploys atlas-backend + atlas-scene-packet-worker
# from one clean, explicitly approved commit, polls enabled services to SUCCESS,
# then runs the production release gate from that same commit.
#
# Usage (PowerShell, from anywhere):
#   powershell -ExecutionPolicy Bypass -File C:\Users\mzwin\Documents\Atlas\scripts\release-deploy.ps1 `
#     -ExpectedSha <full-40-character-sha> `
#     -ExpectedUpdateId <artifacts/current-update.json-id>
#
# Safe preflight (runs no Railway deployment command):
#   powershell -ExecutionPolicy Bypass -File C:\Users\mzwin\Documents\Atlas\scripts\release-deploy.ps1 `
#     -ExpectedSha <full-40-character-sha> `
#     -ExpectedUpdateId <artifacts/current-update.json-id> `
#     -PreflightOnly
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidatePattern("^[0-9a-fA-F]{40}$")]
  [string]$ExpectedSha,

  [Parameter(Mandatory = $true)]
  [string]$ExpectedUpdateId,

  [switch]$PreflightOnly
)

$ErrorActionPreference = "Stop"
$worktree = "C:\Users\mzwin\Documents\atlas-deploy-worktree"
$prodUrl = "https://atlas-backend-production-e6fc.up.railway.app"
$expectedProject = "atlas-chatgpt-app"
$expectedEnvironment = "production"
$backendService = "atlas-backend"
$workerService = "atlas-scene-packet-worker"

function Invoke-GitText([string[]]$GitArguments) {
  $output = & git @GitArguments 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "git $($GitArguments -join ' ') failed: $(($output | Out-String).Trim())"
  }
  return ($output | Out-String).Trim()
}

function Read-RailwayIdentity {
  $output = & railway status 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "Unable to read linked Railway identity: $(($output | Out-String).Trim())"
  }

  $identity = @{}
  foreach ($line in @($output)) {
    if (("$line") -match "^\s*(Project|Environment|Service):\s*(.+?)\s*$") {
      $identity[$matches[1]] = $matches[2]
    }
  }
  return $identity
}

function Wait-Deployment([string]$service) {
  $deadline = (Get-Date).AddMinutes(15)
  while ((Get-Date) -lt $deadline) {
    Start-Sleep -Seconds 15
    $raw = railway deployment list --service $service --environment $expectedEnvironment --json 2>$null | Out-String
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

if ([string]::IsNullOrWhiteSpace($ExpectedUpdateId)) {
  throw "ExpectedUpdateId is required and must match the committed artifacts/current-update.json id."
}
if (-not (Test-Path -LiteralPath $worktree -PathType Container)) {
  throw "Deploy worktree does not exist: $worktree"
}

Set-Location $worktree
$resolvedWorktree = (Resolve-Path -LiteralPath $worktree).Path.TrimEnd("\")
$gitTopLevel = (Resolve-Path -LiteralPath (Invoke-GitText -GitArguments @("rev-parse", "--show-toplevel"))).Path.TrimEnd("\")
if (-not $resolvedWorktree.Equals($gitTopLevel, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Deploy path is not the Git worktree root (expected $resolvedWorktree, got $gitTopLevel)."
}

$dirtyOutput = & git status --porcelain=v1 --untracked-files=all 2>&1
if ($LASTEXITCODE -ne 0) {
  throw "Unable to inspect deploy worktree status: $(($dirtyOutput | Out-String).Trim())"
}
$dirtyEntries = @($dirtyOutput | Where-Object { -not [string]::IsNullOrWhiteSpace("$_") })
if ($dirtyEntries.Count -ne 0) {
  throw "Deploy worktree is not clean ($($dirtyEntries.Count) entries) - refusing to deploy."
}

$commit = Invoke-GitText -GitArguments @("rev-parse", "HEAD")
if (-not $commit.Equals($ExpectedSha, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Deploy SHA mismatch: expected $ExpectedSha, clean worktree is $commit."
}

$currentUpdateJson = Invoke-GitText -GitArguments @("show", "${commit}:artifacts/current-update.json")
try {
  $currentUpdate = $currentUpdateJson | ConvertFrom-Json
} catch {
  throw "Committed artifacts/current-update.json is not valid JSON at ${commit}: $($_.Exception.Message)"
}
$committedUpdateId = "$($currentUpdate.id)"
if ([string]::IsNullOrWhiteSpace($committedUpdateId)) {
  throw "Committed artifacts/current-update.json has no id at $commit."
}
if (-not $committedUpdateId.Equals($ExpectedUpdateId, [System.StringComparison]::Ordinal)) {
  throw "Current-update mismatch: expected '$ExpectedUpdateId', committed id is '$committedUpdateId'."
}

$releaseBaseSha = "$($currentUpdate.releaseCandidate.baseSha)"
$releasePathCount = [int]$currentUpdate.releaseCandidate.pathCount
if ($releaseBaseSha -notmatch "^[0-9a-fA-F]{40}$" -or $releasePathCount -le 0) {
  throw "Committed current update must record a full releaseCandidate.baseSha and positive pathCount."
}
$releaseRange = "${releaseBaseSha}..${commit}"
$splitOutput = & node scripts/verify-alpha-rc-split.mjs --git-range $releaseRange --strict-selected-rc --rc-mode national-generation-contract --json-only 2>&1
if ($LASTEXITCODE -ne 0) {
  throw "Committed release range failed the strict split guard: $(($splitOutput | Out-String).Trim())"
}
try {
  $splitResult = ($splitOutput | Out-String) | ConvertFrom-Json
} catch {
  throw "Committed release split guard did not return valid JSON: $($_.Exception.Message)"
}
if ($splitResult.ok -ne $true -or [int]$splitResult.fileCount -ne $releasePathCount -or [int]$splitResult.blockerCount -ne 0) {
  throw "Committed release range mismatch: expected $releasePathCount paths and 0 blockers; got paths=$($splitResult.fileCount), blockers=$($splitResult.blockerCount)."
}

$serverSource = Invoke-GitText -GitArguments @("show", "${commit}:server/src/index.ts")
$widgetUris = @(
  [regex]::Matches($serverSource, "ui://widget/[A-Za-z0-9._/-]+") |
    ForEach-Object { $_.Value } |
    Sort-Object -Unique
)
if ($widgetUris.Count -ne 1) {
  throw "Expected exactly one committed widget URI at $commit; found $($widgetUris.Count): $($widgetUris -join ', ')."
}
$widgetUri = $widgetUris[0]

$railwayIdentity = Read-RailwayIdentity
if ($railwayIdentity["Project"] -ne $expectedProject) {
  throw "Railway project mismatch: expected '$expectedProject', linked '$($railwayIdentity['Project'])'."
}
if ($railwayIdentity["Environment"] -ne $expectedEnvironment) {
  throw "Railway environment mismatch: expected '$expectedEnvironment', linked '$($railwayIdentity['Environment'])'."
}
if ($railwayIdentity["Service"] -ne $backendService) {
  throw "Railway service mismatch: expected '$backendService', linked '$($railwayIdentity['Service'])'."
}

$railwayStatusJson = (& railway status --json 2>$null | Out-String)
if ($LASTEXITCODE -ne 0) {
  throw "Unable to inspect Railway project services before deployment."
}
try {
  $railwayStatus = $railwayStatusJson | ConvertFrom-Json
} catch {
  throw "Railway status did not return valid JSON: $($_.Exception.Message)"
}
$productionEnvironments = @(
  $railwayStatus.environments.edges |
    ForEach-Object { $_.node } |
    Where-Object { $_.name -eq $expectedEnvironment }
)
if ($productionEnvironments.Count -ne 1) {
  throw "Expected one Railway '$expectedEnvironment' environment; found $($productionEnvironments.Count)."
}
$productionServices = @($productionEnvironments[0].serviceInstances.edges | ForEach-Object { $_.node })
$backendInstances = @($productionServices | Where-Object { $_.serviceName -eq $backendService })
if ($backendInstances.Count -ne 1) {
  throw "Expected one '$backendService' service in Railway '$expectedEnvironment'; found $($backendInstances.Count)."
}
$backendInstance = $backendInstances[0]
$expectedProdHost = ([Uri]$prodUrl).Host
$backendDomains = @(
  @($backendInstance.domains.serviceDomains) + @($backendInstance.domains.customDomains) |
    ForEach-Object { $_.domain }
)
if ($expectedProdHost -notin $backendDomains) {
  throw "Railway service '$backendService' does not own expected production host '$expectedProdHost'."
}

$workerInstances = @($productionServices | Where-Object { $_.serviceName -eq $workerService })
if ($env:ATLAS_DEPLOY_WORKER -eq "1" -and $workerInstances.Count -ne 1) {
  throw "Worker deploy was requested, but expected one '$workerService' service in '$expectedEnvironment'; found $($workerInstances.Count)."
}

Write-Host "`nRelease identity preflight passed" -ForegroundColor Cyan
Write-Host "  SHA:         $commit"
Write-Host "  Update:      $committedUpdateId"
Write-Host "  RC range:    $releaseRange ($releasePathCount paths)"
Write-Host "  Widget URI:  $widgetUri"
Write-Host "  Worktree:    $resolvedWorktree"
Write-Host "  Railway:     project=$expectedProject environment=$expectedEnvironment service=$backendService serviceId=$($backendInstance.serviceId)"
if ($env:ATLAS_DEPLOY_WORKER -eq "1") {
  Write-Host "  Worker:      enabled by ATLAS_DEPLOY_WORKER=1 serviceId=$($workerInstances[0].serviceId)" -ForegroundColor Yellow
} else {
  Write-Host "  Worker:      skipped unless ATLAS_DEPLOY_WORKER=1" -ForegroundColor Yellow
}

Write-Host "`nWorker lifecycle and Redis handshake regression..." -ForegroundColor Cyan
pnpm exec tsx --test server/test/scene-packet-worker-lifecycle.test.ts server/test/lazy-redis-connector.test.ts
if ($LASTEXITCODE -ne 0) { throw "Worker lifecycle or Redis handshake regression failed." }

Write-Host "`nNational Census town-anchor contract..." -ForegroundColor Cyan
pnpm build:core
if ($LASTEXITCODE -ne 0) { throw "Core build failed before the town-anchor contract check." }
node scripts/verify-county-town-anchors.mjs --json-only
if ($LASTEXITCODE -ne 0) { throw "National Census town-anchor contract failed." }

if ($PreflightOnly) {
  Write-Host "`nPREFLIGHT ONLY: no Railway deployment command was run." -ForegroundColor Green
  return
}

Write-Host "`n[1/4] Deploying atlas-backend..." -ForegroundColor Cyan
railway up --service $backendService --environment $expectedEnvironment --detach
if ($LASTEXITCODE -ne 0) { throw "Railway rejected the $backendService deployment request." }
if (-not (Wait-Deployment $backendService)) { exit 1 }

Write-Host "`n[2/4] Worker deployment lane..." -ForegroundColor Cyan
if ($env:ATLAS_DEPLOY_WORKER -eq "1") {
  railway up --service $workerService --environment $expectedEnvironment --detach
  if ($LASTEXITCODE -ne 0) { throw "Railway rejected the $workerService deployment request." }
  if (-not (Wait-Deployment $workerService)) { exit 1 }
} else {
  Write-Host "Worker deploy skipped. Set ATLAS_DEPLOY_WORKER=1 only for a certified worker-lifecycle release." -ForegroundColor Yellow
}

Write-Host "`n[3/4] Release gate (cold-start retries built in)..." -ForegroundColor Cyan
$env:ATLAS_PUBLIC_BASE_URL = $prodUrl
node scripts/verify-release-prod.mjs
if ($LASTEXITCODE -ne 0) { Write-Host "RELEASE GATE FAILED" -ForegroundColor Red; exit 1 }

Write-Host "`n[4/4] Public sanity sweep..." -ForegroundColor Cyan
node scripts/verify-alpha-public-sanity.mjs
if ($LASTEXITCODE -ne 0) { Write-Host "PUBLIC SANITY FAILED (retry once - cold start)" -ForegroundColor Yellow; node scripts/verify-alpha-public-sanity.mjs; if ($LASTEXITCODE -ne 0) { exit 1 } }

Write-Host "`nRELEASE COMPLETE: commit $commit / update $committedUpdateId / widget $widgetUri live and validated on $prodUrl" -ForegroundColor Green
