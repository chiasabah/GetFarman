@echo off
rem Fermande uninstaller for Windows.
rem
rem   uninstall.cmd           removes the hooks, the /fermande command and the app; keeps your log
rem   uninstall.cmd --purge   also deletes the log and settings
setlocal
set "F=%USERPROFILE%\.fermande\bin\fermande.cmd"
if exist "%F%" (
  call "%F%" remove %*
) else (
  echo Fermande is not installed in %USERPROFILE%\.fermande.
)
echo.
pause
