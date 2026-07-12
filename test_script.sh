#!/bin/bash
echo "=== Phase 1: Infrastructure ==="
docker ps --filter name=sam
ss -tlnp sport = :80
curl -s http://localhost/health
echo ""

echo "=== Phase 16: Database & Data ==="
docker exec sam-postgres-1 psql -U samraksha_user -d samraksha -c '\dt'
docker exec sam-postgres-1 psql -U samraksha_user -d samraksha -c 'SELECT badge_no, role FROM officers LIMIT 5'
echo ""

echo "=== Running Pytest ==="
docker exec sam-api-1 pytest tests/ -v
