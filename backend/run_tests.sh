#!/bin/bash
set -e

echo "=========================================================="
echo " SAMRAKSHA Automated Test Suite Execution Runner"
echo " Working Directory: $(pwd)"
echo " Environment: ${ENVIRONMENT:-development}"
echo " Timestamp: $(date -u)"
echo "=========================================================="

export PYTHONPATH="${PYTHONPATH}:$(pwd)"

echo "[1/3] Checking Database connectivity..."
python3 -c "
import asyncio, os, asyncpg
async def check_db():
    db_url = os.getenv('DATABASE_URL', 'postgresql://samraksha:samraksha_secret@localhost:5432/samraksha')
    db_url = db_url.replace('postgresql+asyncpg://', 'postgresql://')
    try:
        conn = await asyncpg.connect(db_url)
        await conn.close()
        print('PostgreSQL Connection: OK')
    except Exception as e:
        print(f'PostgreSQL Connection Warning: {e}')
asyncio.run(check_db())
" || true

echo "[2/3] Running Pytest Test Suite..."
python3 -m pytest tests/ -v -s --tb=short "$@"

echo "=========================================================="
echo " SAMRAKSHA Test Suite Execution Complete!"
echo "=========================================================="
