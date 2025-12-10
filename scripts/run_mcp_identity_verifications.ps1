<#
  MCP Identity Verifications 테스트 실행 스크립트 (Option A 실행용)
  필요한 입력: OrganizationId, ProjectId, BranchName, CostId, DatabaseUrl
  사용 예: .\scripts\run_mcp_identity_verifications.ps1 -OrganizationId "org_..." -ProjectId "proj_..." -BranchName "develop/mcp-identity-verifications" -CostId "cost_..." -DatabaseUrl "postgresql://..."
#>
param(
  [Parameter(Mandatory=$true)]
  [string]$OrganizationId,
  [Parameter(Mandatory=$true)]
  [string]$ProjectId,
  [Parameter(Mandatory=$true)]
  [string]$BranchName,
  [Parameter(Mandatory=$true)]
  [string]$CostId,
  [Parameter(Mandatory=$true)]
  [string]$DatabaseUrl
)

$ErrorActionPreference = "Stop"

Write-Host "Starting MCP Identity Verifications test run..."
Write-Host "OrganizationId: $OrganizationId"
Write-Host "ProjectId: $ProjectId"
Write-Host "BranchName: $BranchName"

try {
  Write-Host "Creating MCP test branch..."
  & MCP_CLI branch create --project-id $ProjectId --name $BranchName --cost-id $CostId
} catch {
  Write-Error "Failed to create MCP test branch: $_"
  exit 1
}

try {
  Write-Host "Applying migration..."
  & MCP_CLI migrations apply --branch $BranchName --file supabase/migrations/20260101000000_create_identity_verifications.sql
} catch {
  Write-Error "Failed to apply migration: $_"
  exit 1
}

try {
  Write-Host "Running test SQL..."
  & psql "$DatabaseUrl" -f tests/mcp_identity_verifications_test.sql
} catch {
  Write-Error "Failed to run test SQL: $_"
  exit 1
}

Write-Host "MCP Identity Verifications test run completed successfully."
exit 0


