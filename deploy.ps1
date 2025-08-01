Write-Host "Starting deployment..." -ForegroundColor Green

# Kill explorer to prevent file locking
Write-Host "Killing explorer to prevent file locking..." -ForegroundColor Yellow
taskkill /f /im explorer.exe 2>$null
Start-Sleep -Seconds 2

# Remove and recreate dist folder
Write-Host "Recreating dist folder..." -ForegroundColor Yellow
if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }
New-Item -ItemType Directory -Name "dist" | Out-Null

# Copy the main file
Write-Host "Copying index.html..." -ForegroundColor Yellow
Copy-Item "index.html" "dist/index.html" -Force

# Git operations
Write-Host "Adding files to git..." -ForegroundColor Yellow
git add index.html
git add dist/

Write-Host "Committing changes..." -ForegroundColor Yellow
git commit -m "Fix SPL Token instruction functions - complete deployment"

Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
git push

Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "Your site is available at: https://darwinism-economy.github.io/Darwin-Platform/" -ForegroundColor Cyan 