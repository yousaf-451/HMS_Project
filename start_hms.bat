@echo off
cd /d "%~dp0"
echo Starting HMS ...
where py >nul 2>nul
if %errorlevel%==0 ( py server.py & goto done )
where python >nul 2>nul
if %errorlevel%==0 ( python server.py & goto done )
where python3 >nul 2>nul
if %errorlevel%==0 ( python3 server.py & goto done )
echo.
echo Python was not found on this computer.
echo Install it from https://www.python.org/downloads/  (tick "Add Python to PATH"), then run this file again.
:done
pause
