# Run from any directory. This checks the kit only, not the Atlas app.
$ErrorActionPreference = 'Stop'
$KitRoot = Split-Path $PSScriptRoot -Parent
& node (Join-Path $PSScriptRoot 'atlas-plan.mjs') validate
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
& node --test (Join-Path $KitRoot 'tests/planner.test.mjs')
exit $LASTEXITCODE
