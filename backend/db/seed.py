import asyncio
import asyncpg
import os
import random
from datetime import datetime, timedelta
import bcrypt

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://samraksha:samraksha_secret@localhost:5432/samraksha")

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

async def seed_db():
    print("Connecting to database...")
    conn = await asyncpg.connect(DATABASE_URL)

    # Cleanup existing data
    print("Cleaning existing records...")
    await conn.execute("TRUNCATE TABLE doc_log, case_diary, cctv_alerts, incidents, patrol_units, cases, officers, police_stations RESTART IDENTITY CASCADE")

    print("Seeding Police Stations...")
    stations = [
        ("ps101", "Navrangpura Police Station", "Ahmedabad West", "079-26442345", 23.0366, 72.5611),
        ("ps102", "Vastrapur Police Station", "Ahmedabad West", "079-26854321", 23.0350, 72.5293),
        ("ps103", "Satellite Police Station", "Ahmedabad West", "079-26765432", 23.0276, 72.5218),
        ("ps104", "Maninagar Police Station", "Ahmedabad East", "079-25467890", 22.9978, 72.6025),
    ]
    ps_ids = []
    for s in stations:
        ps_id = await conn.fetchval("""
            INSERT INTO police_stations (name, zone, address, lat, lon)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
        """, s[1], s[2], s[3], s[4], s[5])
        ps_ids.append(ps_id)

    print("Seeding Officers...")
    hashed_pwd = hash_password("password123")
    
    await conn.execute("""
        INSERT INTO officers (ps_id, badge_no, name, role, rank, password_hash)
        VALUES 
        ($1, 'ADMIN001', 'Super Admin', 'admin', 'Commissioner', $2),
        ($1, 'SHO001', 'Inspector Patel', 'sho', 'Inspector', $2),
        ($1, 'OP001', 'Operator Joshi', 'constable', 'Constable', $2)
    """, ps_ids[0], hashed_pwd)
    
    officers = await conn.fetch("SELECT id FROM officers WHERE role = 'sho'")
    io_id = officers[0]['id']

    print("Seeding Cases and FIRs...")
    crime_types = ["Theft", "Cyber Crime", "Assault", "Fraud", "Traffic Violation"]
    statuses = ["open", "arrested", "chargesheeted", "closed"]
    
    for i in range(25):
        await conn.execute("""
            INSERT INTO cases (
                fir_no, ps_id, crime_type, crime_date, crime_location, crime_lat, crime_lon, victim_name, 
                accused_name, case_status, io_id, crime_narrative
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
            )
        """,
        f"FIR/2026/{1000+i}",
        random.choice(ps_ids),
        random.choice(crime_types),
        datetime.now() - timedelta(days=random.randint(1, 100)),
        "Ahmedabad Street " + str(i),
        23.0366 + random.uniform(-0.05, 0.05), # Lat
        72.5611 + random.uniform(-0.05, 0.05), # Lng
        f"Victim {i}",
        f"Accused {i}",
        random.choice(statuses),
        io_id,
        "Sample narrative for case " + str(i)
        )

    print("Seeding CCTV and Patrols...")
    await conn.execute("""
        INSERT INTO cctv_alerts (camera_id, source, alert_type, confidence, lat, lon)
        VALUES 
        ('CCTV-101', 'iccc', 'loitering', 0.95, 23.0225, 72.5714),
        ('CCTV-102', 'iccc', 'crowd_density', 0.88, 23.0315, 72.5512)
    """)

    await conn.execute("""
        INSERT INTO patrol_units (unit_name, ps_id, status, current_lat, current_lon)
        VALUES 
        ('PCR-Alpha', $1, 'available', 23.0450, 72.5670),
        ('PCR-Beta', $2, 'responding', 23.0210, 72.5810)
    """, ps_ids[0], ps_ids[1])

    print("Database seeding completed successfully.")
    await conn.close()

if __name__ == "__main__":
    asyncio.run(seed_db())
