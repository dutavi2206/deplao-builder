# ============================================================
#  Deplao Builder — Windows Setup Script
#  Cách chạy:
#    powershell -ExecutionPolicy Bypass -File setup.ps1
# ============================================================

param(
    [switch]$BuildOnly,   # Chỉ build, bỏ qua cài Node/Git
    [switch]$DevMode      # Sau khi setup, chạy npm run dev luôn
)

Set-StrictMode -Off
$ErrorActionPreference = "Stop"

# ── Màu sắc helper ───────────────────────────────────────────
function Write-Step  { param($msg) Write-Host "`n[*] $msg" -ForegroundColor Cyan }
function Write-OK    { param($msg) Write-Host "    [OK] $msg" -ForegroundColor Green }
function Write-Warn  { param($msg) Write-Host "    [!]  $msg" -ForegroundColor Yellow }
function Write-Fail  { param($msg) Write-Host "    [X]  $msg" -ForegroundColor Red }
function Write-Info  { param($msg) Write-Host "         $msg" -ForegroundColor Gray }

# ── Banner ───────────────────────────────────────────────────
Write-Host ""
Write-Host "  ╔══════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "  ║       Deplao Builder — Windows Setup     ║" -ForegroundColor Magenta
Write-Host "  ╚══════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""

# ── Kiểm tra đang ở đúng thư mục project ────────────────────
if (-not (Test-Path "package.json")) {
    Write-Fail "Không tìm thấy package.json."
    Write-Info "Hãy cd vào thư mục deplao-builder trước khi chạy script này."
    exit 1
}

$pkg = Get-Content "package.json" -Raw | ConvertFrom-Json
Write-Info "Project: $($pkg.name) v$($pkg.version)"

# ============================================================
#  PHẦN 1 — Kiểm tra & Cài Node.js
# ============================================================
Write-Step "Kiểm tra Node.js..."

$NODE_MIN = 20
$NODE_MAX = 25  # better-sqlite3 v12.9.0 yêu cầu <26
$NODE_RECOMMENDED = "22"  # LTS

$nodeOk = $false
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion -match "v(\d+)\.") {
        $nodeMajor = [int]$Matches[1]
        if ($nodeMajor -ge $NODE_MIN -and $nodeMajor -le $NODE_MAX) {
            Write-OK "Node.js $nodeVersion (tương thích)"
            $nodeOk = $true
        } elseif ($nodeMajor -gt $NODE_MAX) {
            Write-Warn "Node.js $nodeVersion quá mới — better-sqlite3 yêu cầu Node $NODE_MIN–$NODE_MAX"
            Write-Info "Sẽ cài lại Node.js $NODE_RECOMMENDED LTS..."
        } else {
            Write-Warn "Node.js $nodeVersion quá cũ (cần >= $NODE_MIN)"
        }
    }
} catch {
    Write-Warn "Node.js chưa được cài."
}

if (-not $nodeOk -and -not $BuildOnly) {
    Write-Step "Cài Node.js $NODE_RECOMMENDED LTS..."

    # Thử winget trước (Windows 10 1709+ / Windows 11)
    $wingetOk = $false
    try {
        $null = winget --version 2>$null
        $wingetOk = $true
    } catch {}

    if ($wingetOk) {
        Write-Info "Dùng winget để cài Node.js $NODE_RECOMMENDED LTS..."
        try {
            winget install --id OpenJS.NodeJS.LTS --version "$NODE_RECOMMENDED" `
                --accept-source-agreements --accept-package-agreements --silent
            # Refresh PATH trong session hiện tại
            $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
                        [System.Environment]::GetEnvironmentVariable("Path", "User")
            Write-OK "Node.js đã cài xong."
        } catch {
            Write-Warn "winget cài thất bại: $_"
            $wingetOk = $false
        }
    }

    if (-not $wingetOk) {
        Write-Warn "winget không khả dụng hoặc thất bại."
        Write-Info "Tải và cài Node.js $NODE_RECOMMENDED LTS thủ công:"
        Write-Info "  https://nodejs.org/dist/latest-v$NODE_RECOMMENDED.x/node-v$NODE_RECOMMENDED-x64.msi"
        Write-Info ""
        Write-Info "Sau khi cài xong, chạy lại setup.ps1"
        exit 1
    }

    # Kiểm tra lại
    try {
        $nodeVersion = node --version 2>$null
        Write-OK "Node.js $nodeVersion sẵn sàng."
    } catch {
        Write-Fail "Cài Node.js thành công nhưng không tìm thấy trong PATH."
        Write-Info "Hãy mở lại PowerShell rồi chạy lại setup.ps1"
        exit 1
    }
}

# ============================================================
#  PHẦN 2 — Kiểm tra & Cài Git
# ============================================================
Write-Step "Kiểm tra Git..."

$gitOk = $false
try {
    $gitVersion = git --version 2>$null
    Write-OK "$gitVersion"
    $gitOk = $true
} catch {
    Write-Warn "Git chưa được cài."
}

if (-not $gitOk -and -not $BuildOnly) {
    Write-Step "Cài Git..."
    $wingetOk = $false
    try { $null = winget --version 2>$null; $wingetOk = $true } catch {}

    if ($wingetOk) {
        try {
            winget install --id Git.Git --accept-source-agreements --accept-package-agreements --silent
            $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
                        [System.Environment]::GetEnvironmentVariable("Path", "User")
            Write-OK "Git đã cài xong."
        } catch {
            Write-Warn "Cài Git thất bại: $_"
            Write-Info "Tải thủ công: https://git-scm.com/download/win"
        }
    } else {
        Write-Info "Tải Git thủ công: https://git-scm.com/download/win"
    }
}

# ============================================================
#  PHẦN 3 — npm install
# ============================================================
Write-Step "Cài dependencies (npm install --legacy-peer-deps)..."
Write-Info "Lưu ý: ffmpeg (~44MB) và cloudflared (~37MB) sẽ tự tải về, cần internet."
Write-Info ""

$installSuccess = $false
$attempt = 0

while (-not $installSuccess -and $attempt -lt 2) {
    $attempt++
    try {
        if ($attempt -eq 1) {
            npm install --legacy-peer-deps
        } else {
            Write-Warn "Thử lại với --prefer-offline..."
            npm install --legacy-peer-deps --prefer-offline
        }
        $installSuccess = $true
    } catch {
        Write-Warn "npm install thất bại (lần $attempt): $_"
    }
}

if (-not $installSuccess) {
    Write-Fail "npm install thất bại sau 2 lần thử."
    Write-Info "Kiểm tra kết nối internet và thử lại."
    exit 1
}

Write-OK "Dependencies đã cài xong."

# ── Kiểm tra better-sqlite3 ──────────────────────────────────
Write-Step "Kiểm tra better-sqlite3 (native module)..."

$sqliteOk = $false
try {
    $result = node -e "require('better-sqlite3'); console.log('ok')" 2>$null
    if ($result -eq "ok") {
        Write-OK "better-sqlite3 hoạt động bình thường."
        $sqliteOk = $true
    }
} catch {}

if (-not $sqliteOk) {
    Write-Warn "better-sqlite3 cần rebuild. Đang chạy node-gyp..."

    # Kiểm tra Visual C++ Build Tools
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
        Write-Warn "Không tìm thấy Visual C++ Build Tools."
        Write-Info "Đang cài Visual Studio Build Tools qua winget..."
        try {
            $null = winget --version 2>$null
            winget install --id Microsoft.VisualStudio.2022.BuildTools `
                --accept-source-agreements --accept-package-agreements --silent `
                --override "--quiet --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
            Write-OK "Build Tools đã cài. Rebuild better-sqlite3..."
        } catch {
            Write-Warn "Cài Build Tools tự động thất bại."
            Write-Info "Tải thủ công: https://visualstudio.microsoft.com/visual-cpp-build-tools/"
            Write-Info "Chọn workload: C++ build tools → cài → chạy lại setup.ps1"
            exit 1
        }
    }

    try {
        npm rebuild better-sqlite3 --legacy-peer-deps
        $result = node -e "require('better-sqlite3'); console.log('ok')" 2>$null
        if ($result -eq "ok") {
            Write-OK "better-sqlite3 rebuild thành công."
        } else {
            throw "vẫn lỗi sau rebuild"
        }
    } catch {
        Write-Fail "better-sqlite3 rebuild thất bại: $_"
        Write-Info "Chạy thủ công: npm rebuild better-sqlite3 --legacy-peer-deps"
        exit 1
    }
}

# ── Kiểm tra ffmpeg-static ───────────────────────────────────
Write-Step "Kiểm tra ffmpeg-static..."
try {
    $ffmpegPath = node -e "try{const p=require('ffmpeg-static');console.log(p||'missing')}catch{console.log('missing')}" 2>$null
    if ($ffmpegPath -and $ffmpegPath -ne "missing" -and (Test-Path $ffmpegPath)) {
        Write-OK "ffmpeg-static: $ffmpegPath"
    } else {
        Write-Warn "ffmpeg-static chưa tải về. Đang tải lại..."
        node node_modules/ffmpeg-static/install.js
        Write-OK "ffmpeg-static đã tải xong."
    }
} catch {
    Write-Warn "ffmpeg-static kiểm tra thất bại (không ảnh hưởng chức năng chính): $_"
}

# ── Kiểm tra cloudflared ──────────────────────────────────────
Write-Step "Kiểm tra cloudflared..."
$cloudflaredExe = "node_modules\cloudflared\bin\cloudflared.exe"
if (Test-Path $cloudflaredExe) {
    Write-OK "cloudflared: $cloudflaredExe"
} else {
    Write-Warn "cloudflared.exe chưa có. Đang tải về..."
    try {
        node node_modules/cloudflared/lib/cloudflared.js bin install latest
        if (Test-Path $cloudflaredExe) {
            Write-OK "cloudflared đã tải xong."
        } else {
            Write-Warn "Không tải được cloudflared (tính năng Tunnel sẽ không hoạt động)."
        }
    } catch {
        Write-Warn "Tải cloudflared thất bại: $_ (không ảnh hưởng chức năng chính)"
    }
}

# ============================================================
#  PHẦN 4 — Chọn Build hoặc Dev
# ============================================================
Write-Host ""
Write-Host "  ════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host "   Setup hoàn tất! Chọn bước tiếp theo:" -ForegroundColor Green
Write-Host "  ════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host ""

if ($BuildOnly) {
    $choice = "1"
} elseif ($DevMode) {
    $choice = "2"
} elseif ($env:CI -eq "true") {
    # Môi trường CI (GitHub Actions) — tự động chọn build
    Write-Info "CI mode: tự động build production."
    $choice = "1"
} else {
    Write-Host "  [1] Build production  → dist-electron-build\Deplao-Setup-*.exe" -ForegroundColor White
    Write-Host "  [2] Chạy dev mode     → npm run dev (hot-reload)" -ForegroundColor White
    Write-Host "  [3] Thoát             → Tự build/dev sau" -ForegroundColor White
    Write-Host ""
    $choice = Read-Host "  Nhập lựa chọn (1/2/3)"
}

switch ($choice.Trim()) {
    "1" {
        Write-Step "Build production..."
        Write-Info "Quá trình này mất 3–8 phút..."
        Write-Info ""
        npm run production
        Write-Host ""
        if (Test-Path "dist-electron-build") {
            $exeFile = Get-ChildItem "dist-electron-build\*.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($exeFile) {
                Write-OK "Build thành công!"
                Write-Info "Installer: $($exeFile.FullName)"
                Write-Info "Portable:  dist-electron-build\win-unpacked\Deplao.exe"
            } else {
                Write-OK "Build xong. Kiểm tra thư mục dist-electron-build\"
            }
        }
    }
    "2" {
        Write-Step "Khởi chạy dev mode..."
        Write-Info "Ctrl+C để dừng."
        Write-Host ""
        npm run dev
    }
    default {
        Write-Host ""
        Write-OK "Setup hoàn tất."
        Write-Info "Chạy build sau:  npm run production"
        Write-Info "Chạy dev sau:    npm run dev"
    }
}

Write-Host ""
