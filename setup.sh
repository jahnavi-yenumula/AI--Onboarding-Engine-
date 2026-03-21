#!/bin/bash
set -e

echo ""
echo "======================================"
echo "  NeuralPath — Setup Script (Mac/Linux)"
echo "======================================"
echo ""

# ── 1. Check Python ──────────────────────────────────────────────
if ! command -v python3 &>/dev/null; then
  echo "❌  Python 3 not found. Install it from https://python.org and re-run."
  exit 1
fi
PYTHON_VERSION=$(python3 -c 'import sys; print(sys.version_info.minor)')
if [ "$PYTHON_VERSION" -lt 10 ]; then
  echo "❌  Python 3.10+ required. You have $(python3 --version)."
  exit 1
fi
echo "✅  Python $(python3 --version)"

# ── 2. Check Node ─────────────────────────────────────────────────
if ! command -v node &>/dev/null; then
  echo "❌  Node.js not found. Install it from https://nodejs.org and re-run."
  exit 1
fi
echo "✅  Node $(node --version)"

# ── 3. Check Ollama ───────────────────────────────────────────────
if ! command -v ollama &>/dev/null; then
  echo ""
  echo "⚠️   Ollama not found."
  echo "    Install it from https://ollama.com/download then run:"
  echo "    ollama pull llama3.2"
  echo ""
else
  echo "✅  Ollama found"
fi

# ── 4. Backend venv + deps ────────────────────────────────────────
echo ""
echo "📦  Setting up Python backend..."
cd backend_hackathon

if [ ! -d ".venv" ]; then
  python3 -m venv .venv
  echo "    Created .venv"
fi

source .venv/bin/activate
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt
echo "✅  Backend dependencies installed"
deactivate
cd ..

# ── 5. Frontend deps ──────────────────────────────────────────────
echo ""
echo "📦  Setting up Next.js frontend..."
cd frontend

if [ ! -f ".env.local" ]; then
  cp .env.local.example .env.local
  echo "    Created frontend/.env.local"
fi

npm install --silent
echo "✅  Frontend dependencies installed"
cd ..

echo ""
echo "======================================"
echo "  ✅  Setup complete!"
echo "======================================"
echo ""
echo "To start the app, open TWO terminal tabs:"
echo ""
echo "  Tab 1 — Backend:"
echo "    cd backend_hackathon"
echo "    source .venv/bin/activate"
echo "    uvicorn app:app --reload --port 8000"
echo ""
echo "  Tab 2 — Frontend:"
echo "    cd frontend"
echo "    npm run dev"
echo ""
echo "  Then open http://localhost:3000"
echo ""
echo "  (Make sure Ollama is running: ollama serve)"
echo ""
