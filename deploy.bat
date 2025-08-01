@echo off
echo Starting automated deployment...

REM Kill any processes that might lock files
taskkill /f /im explorer.exe >nul 2>&1
timeout /t 2 >nul

REM Remove and recreate dist folder
if exist dist rmdir /s /q dist
mkdir dist

REM Copy the main file
copy index.html dist\index.html

REM Git operations with timeout
echo Adding files to git...
git add . --timeout=10
if %errorlevel% neq 0 (
    echo Git add failed, trying alternative method...
    git add index.html --timeout=10
    git add dist/ --timeout=10
)

echo Committing changes...
git commit -m "Fix SPL Token instruction functions" --timeout=10

echo Pushing to GitHub...
git push --timeout=30

echo Deployment complete!
echo Your site is available at: https://darwinism-economy.github.io/Darwin-Platform/
pause 