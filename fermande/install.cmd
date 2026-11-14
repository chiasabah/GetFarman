@echo off
rem Fermande installer for Windows. Double-click it, or run it from a terminal.
rem It needs Python 3.8 or newer. No bash and no WSL.
rem
rem   install.cmd               install or update
rem   install.cmd --no-history  install without reading existing conversations
setlocal
set "HERE=%~dp0"
set "RUN="

py -3 -c "import sys; sys.exit(0 if sys.version_info >= (3, 8) else 1)" >nul 2>nul
if not errorlevel 1 set RUN=py -3
if not defined RUN (
  python -c "import sys; sys.exit(0 if sys.version_info >= (3, 8) else 1)" >nul 2>nul
  if not errorlevel 1 set RUN=python
)
if not defined RUN (
  python3 -c "import sys; sys.exit(0 if sys.version_info >= (3, 8) else 1)" >nul 2>nul
  if not errorlevel 1 set RUN=python3
)
if not defined RUN for /d %%D in ("%LOCALAPPDATA%\Programs\Python\Python3*") do call :try "%%~D\python.exe"
if not defined RUN call :try "%USERPROFILE%\miniconda3\python.exe"
if not defined RUN call :try "%USERPROFILE%\anaconda3\python.exe"
if not defined RUN call :try "%USERPROFILE%\miniforge3\python.exe"
if not defined RUN call :try "%ProgramData%\miniconda3\python.exe"
if not defined RUN call :try "%ProgramData%\anaconda3\python.exe"

if not defined RUN (
  echo Fermande needs Python 3.8 or newer, and none was found.
  echo Install it from https://www.python.org/downloads/ and tick "Add python.exe to PATH",
  echo then run install.cmd again.
  echo.
  pause
  exit /b 1
)

%RUN% "%HERE%app\fermande.py" setup --from "%HERE%." %*
set "RC=%ERRORLEVEL%"
echo.
pause
exit /b %RC%

:try
if defined RUN exit /b 0
if not exist "%~1" exit /b 0
"%~1" -c "import sys; sys.exit(0 if sys.version_info >= (3, 8) else 1)" >nul 2>nul
if not errorlevel 1 set RUN="%~1"
exit /b 0
