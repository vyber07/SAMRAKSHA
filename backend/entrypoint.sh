#!/bin/bash
set -e

# Auto-seed database if enabled or in demo mode
if [ "$AUTO_SEED" = "true" ] || [ "$DEMO_MODE" = "true" ]; then
    echo "Running automatic database seeding script..."
    python scripts/generate_seed_data.py || echo "Warning: Seeding script finished with warnings/errors, continuing startup."
fi

exec "$@"
