@echo off
setlocal
cd /d "%~dp0"

if not exist node_modules (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 goto :fail
)

if not exist .next\BUILD_ID goto build_app
if not exist .next\server\middleware-manifest.json goto build_app
goto start_app

:build_app
if exist .next (
  rmdir /s /q .next
)
echo Building Shruty Health Clinic...
call npm.cmd run build
if errorlevel 1 goto :fail

:start_app
echo Starting Shruty Health Clinic on http://localhost:3000
call npm.cmd run start
if errorlevel 1 goto :fail
goto :end

:fail
echo.
echo The clinic project could not be started.
pause
exit /b 1

:end
endlocal
