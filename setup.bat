@echo off
echo.
echo ======================================
echo   NeuralPath — Setup Script (Windows)
echo ======================================
echo.

:: ── 1. Check Python ──────────────────────────────────────────────
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Install from https://python.org ^(check "Add to PATH"^) and re-run.
    pause & exit /b 1
)
echo [OK] Python found

:: ── 2. Check Node ─────────────────────────────────────────────────
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found. Install from https://nodejs.org and re-run.
    pause & exit /b 1
)
echo [OK] Node.js found

:: ── 3. Backend venv + deps ────────────────────────────────────────
echo.
echo [..] Setting up Python backend...
cd backend_hackathon

if not exist ".venv" (
    python -m venv .venv
    echo     Created .venv
)

call .venv\Scripts\activate.bat
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt
echo [OK] Backend dependencies installed
call deactivate
cd ..

:: ── 4. Frontend deps ──────────────────────────────────────────────
echo.
echo [..] Setting up Next.js frontend...
cd frontend

if not exist ".env.local" (
    copy .env.local.example .env.local
    echo     Created frontend\.env.local
)

npm install --silent
echo [OK] Frontend dependencies installed
cd ..

echo.
echo ======================================
echo   Setup complete!
echo ======================================
echo.
echo To start the app, open TWO Command Prompt windows:
echo.
echo   Window 1 - Backend:
echo     cd backend_hackathon
echo     .venv\Scripts\activate
echo     uvicorn app:app --reload --port 8000
echo.
echo   Window 2 - Frontend:
echo     cd frontend
echo     npm run dev
echo.
echo   Then open http://localhost:3000
echo.
echo   (Make sure Ollama is running: ollama serve)
echo.
pause
