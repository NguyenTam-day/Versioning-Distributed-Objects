@echo off
REM Setup and run the entire Distributed CAD Versioning System
REM This script assumes you have Node.js, Java, and Maven installed

echo ================================================
echo Distributed CAD Versioning System Setup
echo ================================================
echo.

REM Check prerequisites
echo Checking prerequisites...
where java >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Java is not installed or not in PATH
    pause
    exit /b 1
)

where mvn >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Maven is not installed or not in PATH
    pause
    exit /b 1
)

where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    pause
    exit /b 1
)

echo ✓ Java is installed
echo ✓ Maven is installed
echo ✓ Node.js is installed
echo.

REM Build backend projects
echo ================================================
echo Building Node A Backend...
echo ================================================
cd node_a
call mvn clean install -q
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to build Node A
    pause
    exit /b 1
)
echo ✓ Node A built successfully
cd ..
echo.

echo ================================================
echo Building Node B Backend...
echo ================================================
cd node_b
call mvn clean install -q
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to build Node B
    pause
    exit /b 1
)
echo ✓ Node B built successfully
cd ..
echo.

echo ================================================
echo Installing Frontend Dependencies...
echo ================================================
cd frontend
call npm install --silent
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to install frontend dependencies
    pause
    exit /b 1
)
echo ✓ Frontend dependencies installed
cd ..
echo.

echo ================================================
echo Setup Complete!
echo ================================================
echo.
echo To start the system, run the following commands in separate terminals:
echo.
echo Terminal 1 (Node A - Port 5000):
echo   cd node_a
echo   mvn spring-boot:run
echo.
echo Terminal 2 (Node B - Port 5001):
echo   cd node_b
echo   mvn spring-boot:run
echo.
echo Terminal 3 (Frontend - Port 3000):
echo   cd frontend
echo   npm start
echo.
echo Then open http://localhost:3000 in your browser.
echo.
pause
