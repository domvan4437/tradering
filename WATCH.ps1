Set-Location "C:\Users\Domin\Documents\tradering"
Write-Host "Watching for changes... (Ctrl+C to stop)" -ForegroundColor Cyan

$lastHash = ""

while ($true) {
    Start-Sleep -Seconds 4

    if (Test-Path ".git\index.lock") {
        Remove-Item ".git\index.lock" -Force -ErrorAction SilentlyContinue
    }

    $status = git status --porcelain 2>&1
    $hash = ($status | Out-String).Trim()

    if ($hash -ne "" -and $hash -ne $lastHash) {
        $lastHash = $hash
        Write-Host "Changes detected - pushing..." -ForegroundColor Yellow
        git add -A
        git commit -m "auto: save changes"
        git push origin main
        Write-Host "Done! Vercel deploying..." -ForegroundColor Green
    }
}
