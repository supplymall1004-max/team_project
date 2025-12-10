<#
  Setup MCP_CLI on Windows and verify availability.
  This script attempts to install MCP_CLI via Chocolatey or npm if not already present.
  After installation, it verifies the command can be executed.
#>
param()

$ErrorActionPreference = "Stop"

function Test-McpCli {
  $cmd = Get-Command MCP_CLI -ErrorAction SilentlyContinue
  return $null -ne $cmd
}

Write-Host "Checking MCP_CLI availability..."
if (Test-McpCli) {
  Write-Host "MCP_CLI is already available: $(Get-Command MCP_CLI).Path"
  exit 0
}

Write-Host "MCP_CLI not found. Attempting installation..."
# Try Chocolatey
try {
  if (Get-Command choco -ErrorAction SilentlyContinue) {
    Write-Host "Using Chocolatey to install MCP_CLI..."
    choco install mcp-cli -y
  } elseif (Get-Command npm -ErrorAction SilentlyContinue) {
    Write-Host "Using npm to install MCP_CLI..."
    npm install -g mcp-cli
  } else {
    Write-Error "No known package manager found (choco or npm). Please install MCP_CLI manually."
    exit 1
  }
} catch {
  Write-Warning "Initial MCP_CLI installation attempt failed: $_"
  if (Get-Command npm -ErrorAction SilentlyContinue) {
    Write-Host "Retrying MCP_CLI install via npm..."
    try {
      npm install -g mcp-cli
    } catch {
      Write-Error "Second attempt via npm also failed: $_"
      exit 1
    }
  } else {
    Write-Error "No usable package manager available for retry."
    exit 1
  }
}

Start-Sleep -Seconds 2
if (Test-McpCli) {
  Write-Host "MCP_CLI installation successful."
  exit 0
} else {
  Write-Error "MCP_CLI installation appears to have failed or MCP_CLI not in PATH."
  exit 1
}


