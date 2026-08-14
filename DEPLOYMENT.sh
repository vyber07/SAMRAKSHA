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

# Step 1: Build and Start Services
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 1: Starting Services"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo

docker compose build
docker compose up -d

echo "Waiting for services to be ready (20 seconds)..."
sleep 20

# Check health
echo "Checking backend health (port 8000)..."
if curl -s -f http://127.0.0.1:8000/health > /dev/null 2>&1; then
    echo "✓ Backend API service is running and healthy (http://127.0.0.1:8000/health)"
else
    echo "⚠️  Backend API service may still be initializing..."
fi

echo "Checking frontend gateway health (port 80)..."
if curl -s -f http://127.0.0.1:80/health > /dev/null 2>&1; then
    echo "✓ Frontend Nginx reverse proxy is healthy (http://127.0.0.1:80/health)"
else
    echo "⚠️  Frontend proxy may still be initializing..."
fi

if curl -s -f http://127.0.0.1:80 > /dev/null 2>&1; then
    echo "✓ Frontend UI is served successfully (http://127.0.0.1:80)"
else
    echo "⚠️  Frontend UI check returned non-200"
fi

echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ DEPLOYMENT COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo
echo "Services are now running in the background."
echo "Frontend UI: http://localhost:80"
echo "Backend API: http://localhost:8000"
echo "Reverse Proxied API: http://localhost:80/api/v1/"
echo "To view logs, run: docker compose logs -f"
echo
