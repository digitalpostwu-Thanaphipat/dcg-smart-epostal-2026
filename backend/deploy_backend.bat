@echo off
echo [Loki Mode] Starting Backend Deployment...
clasp push
echo.
echo [Loki Mode] Pushed code to GAS Editor.
echo [IMPORTANT] Please ensure you create a NEW DEPLOYMENT in the GAS UI
echo or run 'clasp deploy' to update the active Web App version.
echo.
echo [Loki Mode] Deployment Result: Done!
pause
