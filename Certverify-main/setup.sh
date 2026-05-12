#!/bin/bash
# CertVerify Quick Setup Script

echo ""
echo "╔══════════════════════════════════════╗"
echo "║     CertVerify — Quick Setup         ║"
echo "╚══════════════════════════════════════╝"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js not found. Please install Node.js v18+ from https://nodejs.org"
  exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Node.js v18+ required. Current: $(node -v)"
  exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check MongoDB
if ! command -v mongod &> /dev/null; then
  echo "⚠️  MongoDB not found locally. Make sure MONGODB_URI in backend/.env points to a running instance (local or Atlas)."
else
  echo "✅ MongoDB detected"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
echo "✅ All dependencies installed"

# Setup .env if not exists
if [ ! -f backend/.env ]; then
  cp backend/.env.example backend/.env
  echo "✅ Created backend/.env — please edit it with your MongoDB URI and JWT_SECRET"
else
  echo "ℹ️  backend/.env already exists, skipping"
fi

echo ""
echo "╔══════════════════════════════════════╗"
echo "║         Setup Complete! 🎉           ║"
echo "╚══════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "  1. Edit backend/.env — set MONGODB_URI and JWT_SECRET"
echo "  2. (Optional) Run: cd backend && node utils/seed.js"
echo "  3. Start dev: npm run dev"
echo ""
echo "App will be available at:"
echo "  Frontend → http://localhost:3000"
echo "  Backend  → http://localhost:5000"
echo ""
