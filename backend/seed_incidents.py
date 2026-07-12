import asyncio
from app.db.connection import init_db, get_db, execute, close_db

async def seed():
    await init_db()
    
    # Try to get db connection
    import asyncpg
    from app.db.connection import pool
    
    async with pool.acquire() as conn:
        # Create incidents
        await conn.execute("""
            INSERT INTO incidents (source, crime_type, lat, lon, severity, status)
            VALUES 
            ('pcr', 'Assault in progress', 28.6139, 77.2090, 4, 'active'),
            ('cctv', 'Suspicious Loitering', 28.6150, 77.2100, 2, 'active'),
            ('patrol', 'Traffic Collision', 28.6120, 77.2080, 3, 'active')
        """)
    
    await close_db()
    print("Seeded incidents!")

if __name__ == '__main__':
    asyncio.run(seed())
