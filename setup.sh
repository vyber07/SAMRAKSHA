#!/bin/bash
# setup.sh — run this once after cloning the repo

set -e  # Exit on any error

echo "=========================================="
echo " SAMRAKSHA — Setup Script"
echo "=========================================="

if ! docker info > /dev/null 2>&1; then
    echo "ERROR: Docker is not running. Start Docker and retry."
    exit 1
fi

if [ ! -f .env ]; then
    echo "Creating .env from .env.example..."
    cp backend/.env.example .env
    echo ""
    echo "=========================================="
    echo "SECRET_KEY generated and appended to .env."
    echo "=========================================="
fi

echo "Building Docker images..."
docker-compose build --no-cache

echo "Starting services..."
docker-compose up -d

echo "Waiting for database..."
sleep 8
until docker-compose exec -T postgres pg_isready -U samraksha_user -d samraksha; do
    echo "  Database not ready, waiting..."
    sleep 3
done

echo "Loading seed data..."
docker-compose exec -T api python scripts/generate_seed_data.py

echo ""
echo "=========================================="
echo " SAMRAKSHA is ready!"
echo "=========================================="
echo ""
echo " Dashboard:  http://localhost:80"
echo " API Docs:   http://localhost:8000/docs"
echo " Health:     http://localhost:8000/health"
echo ""
echo " Demo Login:"
echo "   DCP:  DCP001 / Demo@2026"
echo "   SHO:  SHO_ELL / Demo@2026"
echo "   IO:   IO_ELL_1  / Demo@2026"
echo ""
echo " To stop:  docker-compose down"
echo " To reset: docker-compose down -v"
echo ""
echo " OpenStreetMap attribution required on all map views:"
echo " '© OpenStreetMap contributors'"
echo "=========================================="
