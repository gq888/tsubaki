# Generate Seed and Run Node Script - Clean Version
# Usage: .\generate_seed.ps1 <input_string>

param(
    [Parameter(Mandatory=$true)]
    [string]$InputString
)

# Get current date in YYYYMMDD format
$CURRENT_DATE = Get-Date -Format "yyyyMMdd"

# Combine input string with date
$SEED_BASE = "$InputString$CURRENT_DATE"

# Generate hash using MD5
$md5 = [System.Security.Cryptography.MD5]::Create()
$hashBytes = $md5.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($SEED_BASE))
$md5.Dispose()

# Convert hash to hex string
$HASH_STRING = [System.BitConverter]::ToString($hashBytes).Replace("-", "")

# Extract numeric characters and take first 13 digits
$NUMERIC_CHARS = $HASH_STRING.ToCharArray() | Where-Object { $_ -match '[0-9]' }
$NUMERIC_HASH = -join ($NUMERIC_CHARS | Select-Object -First 13)

# Pad with zeros if less than 13 digits
while ($NUMERIC_HASH.Length -lt 13) {
    $NUMERIC_HASH += "0"
}

# Convert to number and ensure it's not greater than 1e13
$MAX_VALUE = 10000000000000
$SEED = [long]$NUMERIC_HASH % $MAX_VALUE

# If SEED is 0, set to 1
if ($SEED -eq 0) {
    $SEED = 1
}

# Execute node command
$NODE_SCRIPT = "C:\Users\zjwzwzu\tsubaki\scripts\renderToString-method-tester.js"
$OUTPUT = & node $NODE_SCRIPT "month.js" "pass" "seed=$SEED" 2>&1 | Out-String

# Check if command succeeded
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Node command failed"
    exit 1
}

# Extract and output only the LUCKY line and seed
$lines = $OUTPUT -split "`r?`n" | Where-Object { $_.Trim() -ne "" }
if ($lines.Count -ge 3) {
    $LUCKY_LINE = $lines[-3]
    Write-Host $LUCKY_LINE
}

Write-Host "Seed: $SEED"
