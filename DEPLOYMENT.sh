#!/bin/bash
# SAMRAKSHA Complete Deployment Script
# Production-ready deployment via Docker Compose

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     SAMRAKSHA - Production Deployment Script                   ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo

# Check prerequisites
echo "📋 Checking Prerequisites..."
command -v docker >/dev/null 2>&1 || { echo "❌ Docker not found"; exit 1; }
docker compose version >/dev/null 2>&1 || { echo "❌ Docker Compose not found"; exit 1; }

echo "✓ Docker version: $(docker --version)"
echo "✓ Docker Compose version: $(docker compose version)"
echo

# Step 1: Start Docker Services
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 1: Starting Services"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo

docker compose build
docker compose up -d

echo "Waiting for services to be ready (30 seconds)..."
sleep 30

# Check health
if curl -s http://127.0.0.1:8000/health > /dev/null 2>&1; then
    echo "✓ API service is running"
else
    echo "⚠️  API service may still be loading..."
fi

echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ DEPLOYMENT COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo
echo "Services are now running in the background."
echo "Frontend: http://localhost:80"
echo "Backend API: http://localhost:8000"
echo "To view logs, run: docker compose logs -f"
echo
