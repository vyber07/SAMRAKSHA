import asyncio
import os
import uuid
import bcrypt
import random
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from sqlalchemy import text
from app.db.connection import engine, AsyncSessionLocal

ZONES = ["West", "East", "North", "South"]
WARDS = ["Navrangpura", "Vastrapur", "Satellite", "Bapunagar", "Maninagar"]

def get_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def get_random_coord(base_lat, base_lon, offset=0.05):
    return (
        base_lat + random.uniform(-offset, offset),
        base_lon + random.uniform(-offset, offset)
    )

async def seed_db():
    print("Starting extended database seed for Ahmedabad City Police...")
    
    async with AsyncSessionLocal() as db:
        await db.execute(text("TRUNCATE TABLE officers, police_stations, cases, incidents, patrol_units, cctv_alerts, doc_log, officer_permission_overrides CASCADE;"))
        
        # 1. Police Stations
        print("Seeding Police Stations...")
        stations = [
            (uuid.uuid4(), 'Navrangpura Police Station', 'West', 'Navrangpura', 23.0366, 72.5611, 'Navrangpura, Ahmedabad'),
            (uuid.uuid4(), 'Vastrapur Police Station', 'West', 'Vastrapur', 23.0354, 72.5293, 'Vastrapur, Ahmedabad'),
            (uuid.uuid4(), 'Satellite Police Station', 'West', 'Satellite', 23.0276, 72.5111, 'Satellite, Ahmedabad'),
            (uuid.uuid4(), 'Bapunagar Police Station', 'East', 'Bapunagar', 23.0400, 72.6244, 'Bapunagar, Ahmedabad'),
            (uuid.uuid4(), 'Maninagar Police Station', 'South', 'Maninagar', 22.9961, 72.5996, 'Maninagar, Ahmedabad')
        ]
        
        for ps in stations:
            await db.execute(text("""
                INSERT INTO police_stations (id, name, zone, ward, lat, lon, address)
                VALUES (:id, :name, :zone, :ward, :lat, :lon, :addr)
            """), {'id': ps[0], 'name': ps[1], 'zone': ps[2], 'ward': ps[3], 'lat': ps[4], 'lon': ps[5], 'addr': ps[6]})
        
        # 2. Officers
        print("Seeding Officers...")
        roles = ['admin', 'dcp', 'sho', 'io', 'constable']
        officers = []
        # Add 1 admin, 1 dcp
        officers.append((uuid.uuid4(), 'ADM-001', 'Admin Singh', 'Inspector General', 'admin', None, get_hash('admin123')))
        officers.append((uuid.uuid4(), 'DCP-101', 'Rajesh Kumar', 'DCP', 'dcp', stations[0][0], get_hash('dcp123')))
        
        # Full officer accounts per station
        for ps in stations:
            officers.append((uuid.uuid4(), f'SHO-{str(uuid.uuid4())[:4]}', f'SHO {ps[3]}', 'SHO', 'sho', ps[0], get_hash('sho123')))
            officers.append((uuid.uuid4(), f'IO-{str(uuid.uuid4())[:4]}', f'IO 1 {ps[3]}', 'Sub-Inspector', 'io', ps[0], get_hash('io123')))
            officers.append((uuid.uuid4(), f'IO-{str(uuid.uuid4())[:4]}', f'IO 2 {ps[3]}', 'Sub-Inspector', 'io', ps[0], get_hash('io123')))
            officers.append((uuid.uuid4(), f'CON-{str(uuid.uuid4())[:4]}', f'Constable {ps[3]}', 'Constable', 'constable', ps[0], get_hash('con123')))
            
        for o in officers:
            await db.execute(text("""
                INSERT INTO officers (id, badge_no, name, rank, role, ps_id, password_hash)
                VALUES (:id, :badge, :name, :rank, :role, :ps, :pwd)
            """), {'id': o[0], 'badge': o[1], 'name': o[2], 'rank': o[3], 'role': o[4], 'ps': o[5], 'pwd': o[6]})
        
        # 3. Cases (20 Realistic FIRs)
        print("Seeding Cases...")
        now = datetime.now(timezone.utc)
        crime_types = ['Theft', 'Assault', 'Robbery', 'Fraud', 'Cybercrime', 'Burglary', 'Vandalism']
        statuses = ['open', 'chargesheeted', 'arrested', 'closed']
        
        io_list = [o for o in officers if o[4] == 'io']
        
        for i in range(20):
            ps = random.choice(stations)
            io = random.choice([o for o in io_list if o[5] == ps[0]])
            c_lat, c_lon = get_random_coord(ps[4], ps[5])
            
            await db.execute(text("""
                INSERT INTO cases (
                    case_id, fir_no, ps_id, io_id, victim_name, accused_name, crime_type, 
                    crime_narrative, crime_date, crime_lat, crime_lon, ward, geoloc, 
                    bns_sections, case_status
                ) VALUES (
                    :cid, :fir, :ps, :io, :victim, :accused, :ctype,
                    :narrative, :date, :lat, :lon, :ward,
                    ST_SetSRID(ST_MakePoint(:lon, :lat), 4326), :sections, :status
                )
            """), {
                'cid': uuid.uuid4(),
                'fir': f'FIR-2026-{i+100}',
                'ps': ps[0],
                'io': io[0],
                'victim': f'Victim {i}',
                'accused': random.choice(['Unknown', f'Accused {i}']),
                'ctype': random.choice(crime_types),
                'narrative': f'Reported incident of {random.choice(crime_types)} near {ps[3]} area.',
                'date': now - timedelta(days=random.randint(1, 30)),
                'lat': c_lat,
                'lon': c_lon,
                'ward': ps[3],
                'sections': [str(random.randint(300, 500))],
                'status': random.choice(statuses)
            })
            
        # 4. CCTV Alerts (20 alerts)
        print("Seeding CCTV Alerts...")
        alert_types = ['anomaly', 'crowd_density', 'loitering', 'anpr']
        for i in range(20):
            ps = random.choice(stations)
            c_lat, c_lon = get_random_coord(ps[4], ps[5])
            await db.execute(text("""
                INSERT INTO cctv_alerts (camera_id, source, alert_type, confidence, lat, lon)
                VALUES (:cam, 'samraksha_model', :atype, :conf, :lat, :lon)
            """), {
                'cam': f'CAM-{ps[3][:3].upper()}-{random.randint(1, 50)}',
                'atype': random.choice(alert_types),
                'conf': round(random.uniform(0.6, 0.99), 2),
                'lat': c_lat,
                'lon': c_lon
            })
            
        # 5. Patrol Units (10 units)
        print("Seeding Patrol Units...")
        for i in range(10):
            ps = random.choice(stations)
            c_lat, c_lon = get_random_coord(ps[4], ps[5])
            await db.execute(text("""
                INSERT INTO patrol_units (id, unit_name, vehicle, officer_name, ps_id, current_lat, current_lon, status)
                VALUES (:id, :uname, :veh, :off, :ps, :lat, :lon, :status)
            """), {
                'id': uuid.uuid4(),
                'uname': f'PCR-{ps[3][:3].upper()}-{i+1}',
                'veh': random.choice(['SUV', 'Motorcycle', 'Van']),
                'off': f'Constable {i}',
                'ps': ps[0],
                'lat': c_lat,
                'lon': c_lon,
                'status': random.choice(['available', 'deployed', 'unavailable', 'responding'])
            })
            
        await db.commit()
        print("Database seeded successfully!")

if __name__ == "__main__":
    asyncio.run(seed_db())
