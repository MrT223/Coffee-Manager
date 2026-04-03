@echo off
echo ============================================================
echo   COFFEE MANAGER - Start Project
echo ============================================================

echo Starting Backend (FastAPI)...
start "Backend Server" cmd /k "cd backend && (if exist ..\.venv\Scripts\activate.bat (call ..\.venv\Scripts\activate.bat) else if exist .venv\Scripts\activate.bat (call .venv\Scripts\activate.bat)) && uvicorn app.main:app --reload"

echo Starting Frontend (React/Vite)...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo Done! Backend and Frontend are running in separate windows.
echo Vui long giu cac cua so nay mo trong qua trinh su dung.
