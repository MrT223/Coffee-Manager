@echo off
echo ============================================================
echo   COFFEE MANAGER - Initial Setup
echo ============================================================

echo 1. Setting up Backend...
if not exist ".venv" (
    echo Creating virtual environment...
    python -m venv .venv
)
call .venv\Scripts\activate.bat
cd backend
if exist "requirements.txt" (
    echo Installing backend dependencies...
    pip install -r requirements.txt
)
cd ..

echo.
echo 2. Setting up Frontend...
cd frontend
echo Installing frontend dependencies...
call npm install
cd ..

echo.
echo ============================================================
echo Setup complete! 
echo Ban co the bat dau chay du an bang file run_project.bat
echo ============================================================
pause
