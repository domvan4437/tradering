@echo off
cd /d "%~dp0"
if exist .git\index.lock del /f .git\index.lock
git add -A
git commit -m "update"
git push origin main
echo.
echo Pushed! Vercel will deploy in ~1 minute.
pause
