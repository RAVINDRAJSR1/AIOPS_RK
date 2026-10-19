@echo off
REM Double-click this file on Windows to start the Python Playground.
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
    py -3 playground.py
    goto end
)
where python >nul 2>nul
if %errorlevel%==0 (
    python playground.py
    goto end
)
echo.
echo  Python is not installed yet.
echo  Download it from https://www.python.org/downloads/
echo  and tick "Add Python to PATH" while installing.
:end
echo.
pause
