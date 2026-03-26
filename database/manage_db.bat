@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

:: Get script directory (database/)
set "DB_DIR=%~dp0"
:: Get project root (parent of database/)
for %%I in ("%DB_DIR%..") do set "PROJECT_ROOT=%%~fI"

:: Load .env
set DB_HOST=localhost
set DB_PORT=5432
set DB_NAME=coffee_db
set DB_USER=postgres
set DB_PASSWORD=postgres

if exist "%DB_DIR%.env" (
    for /f "usebackq eol=# tokens=1,* delims==" %%A in ("%DB_DIR%.env") do (
        if not "%%A"=="" if not "%%B"=="" set "%%A=%%B"
    )
)

:MENU
cls
echo ============================================================
echo   COFFEE MANAGER - Database Manager
echo ============================================================
echo   Server: %DB_HOST%:%DB_PORT%  Database: %DB_NAME%
echo ============================================================
echo.
echo   [1] Init    - Tao tables + seed du lieu
echo   [2] Reset   - Xoa toan bo va tao lai tu dau
echo   [3] Seed    - Chay lai seed data (khong xoa)
echo   [4] Status  - Kiem tra trang thai database
echo   [5] SQL     - Chay file database.sql goc
echo   [6] Create  - Tao database moi (neu chua co)
echo   [7] Drop    - Xoa database hoan toan
echo   [0] Exit
echo.
set /p choice="  Chon [0-7]: "

if "%choice%"=="1" goto INIT
if "%choice%"=="2" goto RESET
if "%choice%"=="3" goto SEED
if "%choice%"=="4" goto STATUS
if "%choice%"=="5" goto RUN_SQL
if "%choice%"=="6" goto CREATE_DB
if "%choice%"=="7" goto DROP_DB
if "%choice%"=="0" goto EXIT
echo.
echo   Lua chon khong hop le!
timeout /t 2 >nul
goto MENU

:: ------------------------------------------------------------
:INIT
echo.
echo [INIT] Dang tao tables va seed du lieu...
cd /d "%PROJECT_ROOT%"
python -m database.init_db
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Init that bai!
)
echo.
pause
goto MENU

:: ------------------------------------------------------------
:RESET
echo.
echo [RESET] Se XOA TOAN BO du lieu va tao lai!
cd /d "%PROJECT_ROOT%"
python -m database.reset_db
echo.
pause
goto MENU

:: ------------------------------------------------------------
:SEED
echo.
echo [SEED] Chay seed du lieu (khong xoa tables)...
cd /d "%PROJECT_ROOT%"
python -m database.seeds.seed
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Seed that bai!
)
echo.
pause
goto MENU

:: ------------------------------------------------------------
:STATUS
echo.
cd /d "%PROJECT_ROOT%"
python -m database.status_db
echo.
pause
goto MENU

:: ------------------------------------------------------------
:RUN_SQL
echo.
where psql >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] psql khong tim thay. Cai PostgreSQL CLI truoc.
    pause
    goto MENU
)
echo [SQL] Chay database.sql tren %DB_NAME%...
set PGPASSWORD=%DB_PASSWORD%
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f "%DB_DIR%database.sql"
if %ERRORLEVEL% equ 0 (
    echo [OK] Chay SQL thanh cong (bao gom triggers, indexes).
) else (
    echo [WARNING] Co loi khi chay SQL. Kiem tra output phia tren.
)
echo.
pause
goto MENU

:: ------------------------------------------------------------
:CREATE_DB
echo.
where psql >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] psql khong tim thay. Cai PostgreSQL CLI truoc.
    pause
    goto MENU
)
echo [CREATE] Tao database "%DB_NAME%"...
set PGPASSWORD=%DB_PASSWORD%
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -tc "SELECT 1 FROM pg_database WHERE datname='%DB_NAME%'" 2>nul | findstr "1" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [INFO] Database "%DB_NAME%" da ton tai.
) else (
    psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -c "CREATE DATABASE %DB_NAME%;"
    if %ERRORLEVEL% equ 0 (
        echo [OK] Da tao database "%DB_NAME%".
    ) else (
        echo [ERROR] Khong the tao database.
    )
)
echo.
pause
goto MENU

:: ------------------------------------------------------------
:DROP_DB
echo.
echo !!! CANH BAO: Se XOA HOAN TOAN database "%DB_NAME%" !!!
set /p confirm="Nhap 'YES' de xac nhan: "
if not "%confirm%"=="YES" (
    echo Da huy.
    pause
    goto MENU
)
where psql >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] psql khong tim thay.
    pause
    goto MENU
)
set PGPASSWORD=%DB_PASSWORD%
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -c "DROP DATABASE IF EXISTS %DB_NAME%;"
if %ERRORLEVEL% equ 0 (
    echo [OK] Da xoa database "%DB_NAME%".
) else (
    echo [ERROR] Khong the xoa database.
)
echo.
pause
goto MENU

:: ------------------------------------------------------------
:EXIT
endlocal
exit /b 0
