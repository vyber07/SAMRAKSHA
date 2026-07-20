# backend/db/seed.py
import asyncio
import random
import uuid
from datetime import datetime, timedelta
import asyncpg

DB_URL = "postgresql://samraksha:samraksha_secret@postgres:5432/samraksha"

WARDS = [
    'Jamalpur', 'Kalupur', 'Ambawadi', 'Ellisbridge', 'Satellite', 
    'Maninagar', 'Vastrapur', 'Navrangpura', 'Sabarmati', 'Ghatlodiya', 
    'Jodhpur', 'Bopal', 'Paldi', 'Ranip', 'Chandkheda', 'Shahpur', 
    'Dariyapur'
]

CRIME_TEMPLATES = [
    {
        'type': 'theft', 'code': 303, 'severity': 2,
        'narrative': 'Theft of a mobile phone and cash from a local shop during busy hours.',
        'location': 'Local Market Area',
        'bns': ['BNS 303', 'BNS 304'], 'bnss': ['BNSS 170'], 'bsa': [],
        'ipc': ['IPC 379', 'IPC 380']
    },
    {
        'type': 'robbery', 'code': 309, 'severity': 4,
        'narrative': 'Robbery reported at knifepoint near the subway crossing. Cash and valuables stolen.',
        'location': 'Subway Crossing near Main Road',
        'bns': ['BNS 309', 'BNS 310'], 'bnss': ['BNSS 170'], 'bsa': [],
        'ipc': ['IPC 379A', 'IPC 379B', 'IPC 392']
    },
    {
        'type': 'snatching', 'code': 309, 'severity': 3,
        'narrative': 'Chain snatching by two unidentified bike-borne riders in a residential street.',
        'location': 'Residential Lane 4',
        'bns': ['BNS 309'], 'bnss': ['BNSS 170'], 'bsa': [],
        'ipc': ['IPC 379A', 'IPC 379B']
    },
    {
        'type': 'murder', 'code': 101, 'severity': 5,
        'narrative': 'Homicide incident arising from a severe personal dispute. Body recovered from abandoned building.',
        'location': 'Industrial Outskirts, Block C',
        'bns': ['BNS 101', 'BNS 103'], 'bnss': ['BNSS 173'], 'bsa': [],
        'ipc': ['IPC 302']
    },
    {
        'type': 'assault', 'code': 115, 'severity': 3,
        'narrative': 'Physical assault and verbal altercation between two groups near a tea stall.',
        'location': 'Tea Stall Corner, Corner Street',
        'bns': ['BNS 115', 'BNS 117'], 'bnss': ['BNSS 170'], 'bsa': [],
        'ipc': ['IPC 323', 'IPC 325']
    },
    {
        'type': 'fraud', 'code': 318, 'severity': 3,
        'narrative': 'Phishing transaction reported where victim was defrauded of OTP and money stolen online.',
        'location': 'Cyber Cafe / Online',
        'bns': ['BNS 318', 'BNS 316'], 'bnss': [], 'bsa': [],
        'ipc': ['IPC 420', 'IPC 406']
    },
    {
        'type': 'organized', 'code': 111, 'severity': 4,
        'narrative': 'Illegal gambling den operated by an organized gang busted during a raid.',
        'location': 'Basement of Commercial Complex',
        'bns': ['BNS 111', 'BNS 61'], 'bnss': ['BNSS 173'], 'bsa': [],
        'ipc': []
    }
]

VNAME_LIST = ["Aarav Shah", "Vihaan Patel", "Aditya Mehta", "Sai Kumar", "Arjun Joshi", "Ananya Sharma", "Diya Iyer", "Kavya Nair", "Prisha Trivedi", "Meera Bhatt"]
ANAME_LIST = ["Ramesh Kumar", "Suresh Prasad", "Unknown Suspect", "Vikram Rathore", "Amit Singh", "Rajesh Varma", "Karan Dave", "Sunny Patil"]

async def seed():
    conn = await asyncpg.connect(DB_URL)
    print("Connected to PostgreSQL database for seeding.")

    # Fetch existing officer and police station to link
    officer = await conn.fetchrow("SELECT id, ps_id FROM officers LIMIT 1")
    if not officer:
        print("Error: No officers found in database. Run migration/initial seeds first.")
        await conn.close()
        return
    
    officer_id = officer['id']
    ps_id = officer['ps_id']

    # 1. Generate 200 synthetic incidents and corresponding cases
    print("Generating 200 incidents and cases...")
    
    case_ids = []
    
    # We will wrap in a transaction
    async with conn.transaction():
        # Clear existing data in incidents, cases to ensure clean state if needed,
        # but let's just insert to avoid breaking existing manual test data unless requested.
        # Actually, let's keep them and append or clear? Clearing first ensures 
        # exactly the seed data is present and clean, but let's check: 
        # "Write a python script that connects... must insert 200 synthetic incidents...". 
        # It's safer to clear or just insert. Let's do DELETE/TRUNCATE on cases/incidents 
        # to ensure it's clean and we have exactly what we want.
        await conn.execute("DELETE FROM case_diary CASCADE")
        await conn.execute("DELETE FROM case_audit CASCADE")
        await conn.execute("DELETE FROM doc_log CASCADE")
        await conn.execute("DELETE FROM incidents CASCADE")
        await conn.execute("DELETE FROM cctv_alerts CASCADE")
        await conn.execute("DELETE FROM cases CASCADE")
        await conn.execute("DELETE FROM zone_risk_scores CASCADE")
        await conn.execute("DELETE FROM patrol_units CASCADE")

        for i in range(200):
            case_id = str(uuid.uuid4())
            fir_no = f"SEED/2026/{i+1:04d}"
            
            template = random.choice(CRIME_TEMPLATES)
            crime_type = template['type']
            crime_code = template['code']
            severity = template['severity']
            
            # coords in range lat: [22.95, 23.10], lon: [72.50, 72.65]
            lat = random.uniform(22.95, 23.10)
            lon = random.uniform(72.50, 72.65)
            
            # timestamp within the last 30 days
            days_ago = random.uniform(0, 30)
            timestamp = datetime.now() - timedelta(days=days_ago)
            
            ward = random.choice(WARDS)
            
            victim_name = random.choice(VNAME_LIST)
            victim_phone = f"+9198{random.randint(10000000, 99999999)}"
            victim_age = random.randint(18, 75)
            victim_gender = random.choice(["Male", "Female"])
            
            accused_name = random.choice(ANAME_LIST)
            accused_age = random.randint(20, 60)
            
            # Insert Case
            await conn.execute("""
                INSERT INTO cases (
                    case_id, fir_no, ps_id, io_id,
                    victim_name, victim_address, victim_phone, victim_age, victim_gender,
                    accused_name, accused_age,
                    crime_type, crime_code, crime_narrative, crime_date, crime_location,
                    crime_lat, crime_lon, geoloc,
                    bns_sections, bnss_sections, bsa_sections, ipc_crossref,
                    case_status, created_at, updated_at
                ) VALUES (
                    $1, $2, $3, $4,
                    $5, $6, $7, $8, $9,
                    $10, $11,
                    $12, $13, $14, $15, $16,
                    $17, $18, ST_MakePoint($18, $17)::GEOGRAPHY,
                    $19, $20, $21, $22,
                    'open', $23, $23
                )
            """, 
                case_id, fir_no, ps_id, officer_id,
                victim_name, f"Address of {victim_name}", victim_phone, victim_age, victim_gender,
                accused_name, accused_age,
                crime_type, crime_code, template['narrative'], timestamp, template['location'],
                lat, lon,
                template['bns'], template['bnss'], template['bsa'], template['ipc'],
                timestamp
            )
            
            # Insert Incident
            await conn.execute("""
                INSERT INTO incidents (
                    case_id, source, crime_code, crime_type,
                    lat, lon, geoloc, timestamp, severity, zone, ward, status
                ) VALUES (
                    $1, 'fir', $2, $3,
                    $4, $5, ST_MakePoint($5, $4)::GEOGRAPHY, $6, $7, $8, $9, 'active'
                )
            """,
                case_id, crime_code, crime_type,
                lat, lon, timestamp, severity, "Ahmedabad Zone", ward
            )
            
            case_ids.append(case_id)
            
        print("200 incidents and cases successfully inserted.")

        # 2. Insert 5-10 active patrol_units
        print("Seeding patrol units...")
        for i in range(8):
            unit_id = str(uuid.uuid4())
            unit_name = f"Patrol Unit {i+1:02d}"
            lat = random.uniform(22.95, 23.10)
            lon = random.uniform(72.50, 72.65)
            status = random.choice(['available', 'deployed', 'responding'])
            
            await conn.execute("""
                INSERT INTO patrol_units (
                    id, unit_name, ps_id, current_lat, current_lon, status, last_update
                ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
            """, unit_id, unit_name, ps_id, lat, lon, status)
        print("Patrol units successfully inserted.")

        # 3. CCTV alerts in the cctv_alerts table
        print("Seeding CCTV alerts...")
        for i in range(25):
            camera_id = f"CAM-{random.randint(100, 999)}"
            source = random.choice(['iccc', 'samraksha_model'])
            alert_type = random.choice(['crowd_density', 'loitering', 'anomaly', 'anpr'])
            confidence = random.uniform(0.65, 0.99)
            person_count = random.randint(5, 50) if alert_type == 'crowd_density' else None
            plate_no = f"GJ01AB{random.randint(1000, 9999)}" if alert_type == 'anpr' else None
            
            lat = random.uniform(22.95, 23.10)
            lon = random.uniform(72.50, 72.65)
            
            # Map randomly to a case
            matched_case = random.choice(case_ids) if random.random() > 0.5 else None
            days_ago = random.uniform(0, 15)
            ts = datetime.now() - timedelta(days=days_ago)

            await conn.execute("""
                INSERT INTO cctv_alerts (
                    camera_id, source, alert_type, confidence, person_count,
                    lat, lon, geoloc, plate_no, matched_case, ts
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, ST_MakePoint($7, $6)::GEOGRAPHY, $8, $9, $10)
            """, camera_id, source, alert_type, confidence, person_count, lat, lon, plate_no, matched_case, ts)
        print("CCTV alerts successfully inserted.")

        # 4. Zone risk scores in the zone_risk_scores table
        print("Seeding zone risk scores...")
        for ward in WARDS:
            for hour in range(24):
                for dow in range(7):
                    risk_score = random.uniform(10.0, 95.0)
                    festival_flag = random.choice([True, False]) if risk_score > 75 else False
                    await conn.execute("""
                        INSERT INTO zone_risk_scores (
                            ward, hour_slot, day_of_week, risk_score, festival_flag, computed_at
                        ) VALUES ($1, $2, $3, $4, $5, NOW())
                    """, ward, hour, dow, risk_score, festival_flag)
        print("Zone risk scores successfully inserted.")

    await conn.close()
    print("Database seeding completed successfully.")

if __name__ == '__main__':
    asyncio.run(seed())
