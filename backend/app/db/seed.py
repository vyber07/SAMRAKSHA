import asyncio
import os
import uuid
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from sqlalchemy import text
from app.db.connection import engine, AsyncSessionLocal

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Ahmedabad specific data
ZONES = ["West", "East", "North", "South"]
WARDS = ["Navrangpura", "Vastrapur", "Satellite", "Bapunagar", "Maninagar"]

def get_hash(password: str) -> str:
    return pwd_ctx.hash(password)

async def seed_db():
    print("Starting database seed for Ahmedabad City Police...")
    
    async with AsyncSessionLocal() as db:
        # Clear existing
        await db.execute(text("TRUNCATE TABLE officers, police_stations, cases, incidents, patrol_units, patrol_routes, cctv_cameras, cctv_alerts, doc_log, officer_permission_overrides CASCADE;"))
        
        # 1. Seed Police Stations
        print("Seeding Police Stations...")
        ps_id1 = uuid.uuid4()
        ps_id2 = uuid.uuid4()
        await db.execute(text("""
            INSERT INTO police_stations (id, name, zone, ward, lat, lon, address)
            VALUES 
            (:id1, 'Navrangpura Police Station', 'West', 'Navrangpura', 23.0366, 72.5611, 'Navrangpura, Ahmedabad, Gujarat'),
            (:id2, 'Vastrapur Police Station', 'West', 'Vastrapur', 23.0354, 72.5293, 'Vastrapur, Ahmedabad, Gujarat')
        """), {'id1': ps_id1, 'id2': ps_id2})
        
        # 2. Seed Officers
        print("Seeding Officers...")
        admin_id = uuid.uuid4()
        dcp_id = uuid.uuid4()
        sho_id = uuid.uuid4()
        io_id = uuid.uuid4()
        constable_id = uuid.uuid4()
        
        officers = [
            (admin_id, 'ADM-001', 'Admin Singh', 'Inspector General', 'admin', None, get_hash('admin123')),
            (dcp_id, 'DCP-101', 'Rajesh Kumar', 'DCP', 'dcp', ps_id1, get_hash('dcp123')),
            (sho_id, 'SHO-202', 'Amit Patel', 'SHO', 'sho', ps_id1, get_hash('sho123')),
            (io_id, 'IO-303', 'Ramesh Shah', 'Sub-Inspector', 'io', ps_id1, get_hash('io123')),
            (constable_id, 'CON-404', 'Suresh Desai', 'Constable', 'constable', ps_id1, get_hash('con123'))
        ]
        
        for o in officers:
            await db.execute(text("""
                INSERT INTO officers (id, badge_no, name, rank, role, ps_id, password_hash)
                VALUES (:id, :badge, :name, :rank, :role, :ps, :pwd)
            """), {'id': o[0], 'badge': o[1], 'name': o[2], 'rank': o[3], 'role': o[4], 'ps': o[5], 'pwd': o[6]})
        
        # 3. Seed Cases
        print("Seeding Cases...")
        now = datetime.now(timezone.utc)
        case_id1 = uuid.uuid4()
        case_id2 = uuid.uuid4()
        
        await db.execute(text("""
            INSERT INTO cases (
                case_id, fir_no, ps_id, io_id, victim_name, accused_name, crime_type, 
                crime_narrative, crime_date, crime_lat, crime_lon, ward, geoloc, 
                bns_sections, case_status
            ) VALUES 
            (:cid1, 'FIR-2026-001', :ps, :io, 'Vikram Bhai', 'Unknown', 'Theft',
             'Stolen motorcycle near CG Road', :date, 23.037, 72.562, 'Navrangpura',
             ST_SetSRID(ST_MakePoint(72.562, 23.037), 4326), ARRAY['379'], 'open'),
             
            (:cid2, 'FIR-2026-002', :ps, :io, 'Priya Patel', 'Raju', 'Assault',
             'Assaulted at local market', :date2, 23.035, 72.529, 'Vastrapur',
             ST_SetSRID(ST_MakePoint(72.529, 23.035), 4326), ARRAY['323', '504'], 'arrested')
        """), {
            'cid1': case_id1, 'cid2': case_id2, 'ps': ps_id1, 'io': io_id, 
            'date': now - timedelta(days=2), 'date2': now - timedelta(days=1)
        })
        
        # 4. Seed CCTV Cameras & Alerts
        print("Seeding CCTV Cameras & Alerts...")
        cam_id = uuid.uuid4()
        await db.execute(text("""
            INSERT INTO cctv_cameras (id, name, location_desc, lat, lon, ward, resolution, status)
            VALUES (:id, 'CAM-NAV-01', 'CG Road Junction', 23.036, 72.561, 'Navrangpura', '1080p', 'active')
        """), {'id': cam_id})
        
        await db.execute(text("""
            INSERT INTO cctv_alerts (id, camera_id, alert_type, confidence, frame_img, lat, lon)
            VALUES (uuid_generate_v4(), :cam, 'Weapon Detected', 0.89, 'base64...', 23.036, 72.561)
        """), {'cam': cam_id})
        
        # 5. Seed Patrol Units
        print("Seeding Patrol Units...")
        unit_id = uuid.uuid4()
        await db.execute(text("""
            INSERT INTO patrol_units (id, name, vehicle_type, officer_id, ps_id, lat, lon, status)
            VALUES (:id, 'PCR-Alpha', 'SUV', :off, :ps, 23.037, 72.560, 'patrolling')
        """), {'id': unit_id, 'off': constable_id, 'ps': ps_id1})
        
        await db.commit()
        print("Database seeded successfully!")

if __name__ == "__main__":
    asyncio.run(seed_db())
