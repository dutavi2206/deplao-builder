# ============================================================
#  Deplao Builder - Windows Setup Script
#  Usage:
#    powershell -ExecutionPolicy Bypass -File setup.ps1
# ============================================================

param(
    [switch]$BuildOnly,
    [switch]$DevMode
)

Set-StrictMode -Off
$ErrorActionPreference = "Stop"

function Write-Step { param($msg) Write-Host "`n[*] $msg" -ForegroundColor Cyan }
function Write-OK   { param($msg) Write-Host "    [OK] $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "    [!]  $msg" -ForegroundColor Yellow }
function Write-Fail { param($msg) Write-Host "    [X]  $msg" -ForegroundColor Red }
function Write-Info { param($msg) Write-Host "         $msg" -ForegroundColor Gray }

Write-Host ""
Write-Host "  Deplao Builder - Windows Setup" -ForegroundColor Magenta
Write-Host ""

# Check we are in the project folder
if (-not (Test-Path "package.json")) {
    Write-Fail "package.json not found."
    Write-Info "Please cd into deplao-builder folder first."
    exit 1
}

$pkg = Get-Content "package.json" -Raw | ConvertFrom-Json
Write-Info "Project: $($pkg.name) v$($pkg.version)"

# ============================================================
#  PART 1 - Check and Install Node.js
# ============================================================
Write-Step "Checking Node.js..."

$NODE_MIN = 20
$NODE_MAX = 25
$NODE_RECOMMENDED = "22"

$nodeOk = $false
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion -match "v(\d+)\.") {
        $nodeMajor = [int]$Matches[1]
        if ($nodeMajor -ge $NODE_MIN -and $nodeMajor -le $NODE_MAX) {
            Write-OK "Node.js $nodeVersion (compatible)"
            $nodeOk = $true
        } elseif ($nodeMajor -gt $NODE_MAX) {
            Write-Warn "Node.js $nodeVersion is too new - better-sqlite3 requires Node $NODE_MIN to $NODE_MAX"
        } else {
            Write-Warn "Node.js $nodeVersion is too old (need >= $NODE_MIN)"
        }
    }
} catch {
    Write-Warn "Node.js not found."
}

if (-not $nodeOk -and -not $BuildOnly) {
    Write-Step "Installing Node.js $NODE_RECOMMENDED LTS..."

    $wingetOk = $false
    try { $null = winget --version 2>$null; $wingetOk = $true } catch {}

    if ($wingetOk) {
        try {
            winget install --id OpenJS.NodeJS.LTS --version "$NODE_RECOMMENDED" `
                --accept-source-agreements --accept-package-agreements --silent
            $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
                        [System.Environment]::GetEnvironmentVariable("Path", "User")
            Write-OK "Node.js installed."
        } catch {
            Write-Warn "winget install failed: $_"
            $wingetOk = $false
        }
    }

    if (-not $wingetOk) {
        Write-Warn "winget not available."
        Write-Info "Download Node.js $NODE_RECOMMENDED LTS manually:"
        Write-Info "  https://nodejs.org/dist/latest-v$NODE_RECOMMENDED.x/node-v$NODE_RECOMMENDED-x64.msi"
        Write-Info ""
        Write-Info "Then re-run setup.ps1"
        exit 1
    }

    try {
        $nodeVersion = node --version 2>$null
        Write-OK "Node.js $nodeVersion ready."
    } catch {
        Write-Fail "Node.js installed but not found in PATH."
        Write-Info "Please open a new PowerShell window and re-run setup.ps1"
        exit 1
    }
}

# ============================================================
#  PART 2 - Check and Install Git
# ============================================================
Write-Step "Checking Git..."

$gitOk = $false
try {
    $gitVersion = git --version 2>$null
    Write-OK "$gitVersion"
    $gitOk = $true
} catch {
    Write-Warn "Git not found."
}

if (-not $gitOk -and -not $BuildOnly) {
    Write-Step "Installing Git..."
    $wingetOk = $false
    try { $null = winget --version 2>$null; $wingetOk = $true } catch {}

    if ($wingetOk) {
        try {
            winget install --id Git.Git --accept-source-agreements --accept-package-agreements --silent
            $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
                        [System.Environment]::GetEnvironmentVariable("Path", "User")
            Write-OK "Git installed."
        } catch {
            Write-Warn "Git install failed: $_"
            Write-Info "Download manually: https://git-scm.com/download/win"
        }
    } else {
        Write-Info "Download Git manually: https://git-scm.com/download/win"
    }
}

# ============================================================
#  PART 3 - npm install
# ============================================================
Write-Step "Installing dependencies (npm install --legacy-peer-deps)..."
Write-Info "Note: ffmpeg (~44MB) and cloudflared (~37MB) will be downloaded, internet required."
Write-Info ""

$installSuccess = $false
$attempt = 0

while (-not $installSuccess -and $attempt -lt 2) {
    $attempt++
    try {
        if ($attempt -eq 1) {
            npm install --legacy-peer-deps
        } else {
            Write-Warn "Retrying with --prefer-offline..."
            npm install --legacy-peer-deps --prefer-offline
        }
        $installSuccess = $true
    } catch {
        Write-Warn "npm install failed (attempt $attempt): $_"
    }
}

if (-not $installSuccess) {
    Write-Fail "npm install failed after 2 attempts."
    Write-Info "Check your internet connection and try again."
    exit 1
}

Write-OK "Dependencies installed."

# Check better-sqlite3
Write-Step "Checking better-sqlite3 (native module)..."

$sqliteOk = $false
try {
    $result = node -e "require('better-sqlite3'); process.stdout.write('ok')" 2>$null
    if ($result -eq "ok") {
        Write-OK "better-sqlite3 works."
        $sqliteOk = $true
    }
} catch {}

if (-not $sqliteOk) {
    Write-Warn "better-sqlite3 needs rebuild. Running node-gyp..."

    $vcFound = $false
    $possiblePaths = @(
        "${env:ProgramFiles(x86)}\Microsoft Visual Studio",
        "${env:ProgramFiles}\Microsoft Visual Studio",
        "${env:ProgramFiles(x86)}\Windows Kits"
    )
    foreach ($p in $possiblePaths) {
        if (Test-Path $p) { $vcFound = $true; break }
    }

    if (-not $vcFound) {
        Write-Warn "Visual C++ Build Tools not found."
        Write-Info "Installing via winget..."
        try {
            $null = winget --version 2>$null
            winget install --id Microsoft.VisualStudio.2022.BuildTools `
                --accept-source-agreements --accept-package-agreements --silent `
                --override "--quiet --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
            Write-OK "Build Tools installed. Rebuilding better-sqlite3..."
        } catch {
            Write-Warn "Auto install failed."
            Write-Info "Download: https://visualstudio.microsoft.com/visual-cpp-build-tools/"
            Write-Info "Select workload: C++ build tools -> install -> re-run setup.ps1"
            exit 1
        }
    }

    try {
        npm rebuild better-sqlite3 --legacy-peer-deps
        $result = node -e "require('better-sqlite3'); process.stdout.write('ok')" 2>$null
        if ($result -eq "ok") {
            Write-OK "better-sqlite3 rebuild successful."
        } else {
            throw "still failing after rebuild"
        }
    } catch {
        Write-Fail "better-sqlite3 rebuild failed: $_"
        Write-Info "Run manually: npm rebuild better-sqlite3 --legacy-peer-deps"
        exit 1
    }
}

# Check ffmpeg-static
Write-Step "Checking ffmpeg-static..."
try {
    $ffmpegPath = node -e "try{var p=require('ffmpeg-static');process.stdout.write(p||'missing')}catch(e){process.stdout.write('missing')}" 2>$null
    if ($ffmpegPath -and $ffmpegPath -ne "missing" -and (Test-Path $ffmpegPath)) {
        Write-OK "ffmpeg-static: $ffmpegPath"
    } else {
        Write-Warn "ffmpeg-static not downloaded. Downloading now..."
        node node_modules/ffmpeg-static/install.js
        Write-OK "ffmpeg-static downloaded."
    }
} catch {
    Write-Warn "ffmpeg-static check failed (non-critical): $_"
}

# Check cloudflared
Write-Step "Checking cloudflared..."
$cloudflaredExe = "node_modules\cloudflared\bin\cloudflared.exe"
if (Test-Path $cloudflaredExe) {
    Write-OK "cloudflared: $cloudflaredExe"
} else {
    Write-Warn "cloudflared.exe not found. Downloading..."
    try {
        node node_modules/cloudflared/lib/cloudflared.js bin install latest
        if (Test-Path $cloudflaredExe) {
            Write-OK "cloudflared downloaded."
        } else {
            Write-Warn "cloudflared download failed (Tunnel feature will not work)."
        }
    } catch {
        Write-Warn "cloudflared download failed (non-critical): $_"
    }
}

# ============================================================
#  PART 4 - Build or Dev
# ============================================================
Write-Host ""
Write-Host "  Setup complete! Choose next step:" -ForegroundColor Green
Write-Host ""

if ($BuildOnly) {
    $choice = "1"
} elseif ($DevMode) {
    $choice = "2"
} elseif ($env:CI -eq "true") {
    Write-Info "CI mode: auto-selecting production build."
    $choice = "1"
} else {
    Write-Host "  [1] Build production  -> dist-electron-build\Deplao-Setup-*.exe" -ForegroundColor White
    Write-Host "  [2] Run dev mode      -> npm run dev (hot-reload)" -ForegroundColor White
    Write-Host "  [3] Exit              -> build/dev later" -ForegroundColor White
    Write-Host ""
    $choice = Read-Host "  Enter choice (1/2/3)"
}

switch ($choice.Trim()) {
    "1" {
        Write-Step "Building production..."
        Write-Info "This takes 3-8 minutes..."
        Write-Info ""
        npm run production
        Write-Host ""

        $portable = "dist-electron-build\win-unpacked\Deplao.exe"
        $installer = Get-ChildItem "dist-electron-build\*.exe" -Exclude "win-unpacked" -ErrorAction SilentlyContinue | Select-Object -First 1

        if (Test-Path $portable) {
            Write-OK "Build successful!"
            Write-Info "Installer: $($installer.FullName)"
            Write-Info "Portable:  $portable"
            Write-Host ""
            Write-Step "Launching app..."
            Start-Process $portable
            Write-OK "App started."
        } elseif ($installer) {
            Write-OK "Build successful! Running installer..."
            Start-Process $installer.FullName -ArgumentList "/S" -Wait
            Write-OK "Installed. Launching app..."
            $appExe = "$env:LOCALAPPDATA\Programs\Deplao\Deplao.exe"
            if (Test-Path $appExe) {
                Start-Process $appExe
                Write-OK "App started."
            } else {
                Write-Info "App installed. Find Deplao in Start Menu to launch."
            }
        } else {
            Write-Fail "Build failed - no .exe found in dist-electron-build\"
            exit 1
        }
    }
    "2" {
        Write-Step "Starting dev mode..."
        Write-Info "Press Ctrl+C to stop."
        Write-Host ""
        npm run dev
    }
    default {
        Write-Host ""
        Write-OK "Setup complete."
        Write-Info "Build later:  npm run production"
        Write-Info "Dev later:    npm run dev"
    }
}

Write-Host ""
