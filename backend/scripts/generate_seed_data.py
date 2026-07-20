import random
import uuid
import asyncio
import asyncpg
import os
import sys
import bcrypt
from datetime import datetime, timedelta

# Ensure /app is on path so `app.*` imports work
sys.path.insert(0, '/app')

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12)).decode()

AHMEDABAD_WARDS = [
    ('Satellite',   23.0300, 72.5100),
    ('Bodakdev',    23.0470, 72.5060),
    ('Vastrapur',   23.0370, 72.5290),
    ('Ambawadi',    23.0200, 72.5510),
    ('Navrangpura', 23.0270, 72.5620),
    ('Maninagar',   22.9890, 72.6030),
    ('Vatwa',       22.9720, 72.6380),
    ('Gomtipur',    23.0380, 72.6260),
    ('Jamalpur',    23.0370, 72.6050),
    ('Kalupur',     23.0240, 72.5990),
    ('Shahibaug',   23.0600, 72.5900),
    ('Chandkheda',  23.1010, 72.5870),
    ('Bopal',       23.0170, 72.4680),
    ('Ghatlodiya',  23.0670, 72.5540),
    ('Naranpura',   23.0530, 72.5550),
    ('Ellisbridge', 23.0225, 72.5714),
]

CRIME_TYPES = [
    ('theft',    303, 3),
    ('snatching', 309, 4),
    ('assault',  115, 3),
    ('robbery',   310, 5),
    ('fraud',    318, 2),
    ('cyber',     318, 2),
    ('vehicle_theft', 303, 3),
    ('burglary', 303, 4),
]

GUJARATI_FIRST = ['Rajesh','Suresh','Mohan','Ramesh','Dilip','Priya','Sunita','Geeta','Meena','Kavita','Vijay','Amit','Karan','Jay','Harsh']
GUJARATI_LAST  = ['Patel','Shah','Modi','Desai','Mehta','Joshi','Trivedi','Bhatt','Pandya','Parikh','Raval','Solanki','Gohil','Vaghela']

def random_name():
    return f"{random.choice(GUJARATI_FIRST)} {random.choice(GUJARATI_LAST)}"

def random_fir_no(ps_code: str, i: int, year: int = 2026):
    return f"{ps_code}/{year}/{str(i).zfill(4)}"

def random_timestamp(days_back: int = 60):
    base = datetime.now() - timedelta(days=days_back)
    random_minutes = random.choices(
        range(1440),
        weights=[
            3 if (h >= 20 or h <= 2) else
            1.5 if (h >= 12 and h <= 14) else
            1 if (h >= 7 and h <= 9) else
            0.5
            for h in [m//60 for m in range(1440)]
        ]
    )[0]
    return base + timedelta(
        days=random.randint(0, days_back),
        minutes=random_minutes
    )

async def seed():
    print("Connecting to database...")
    # Read environment variable
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        # Construct from individual env vars — all must be set
        db_user = os.getenv("DB_USER", "samraksha_user")
        db_pass = os.getenv("DB_PASSWORD") or os.getenv("POSTGRES_PASSWORD")
        db_name = os.getenv("DB_NAME", "samraksha")
        if not db_pass:
            raise RuntimeError("DB_PASSWORD / POSTGRES_PASSWORD environment variable is not set.")
        db_url = f"postgresql://{db_user}:{db_pass}@postgres/{db_name}"
    
    # Replace asyncpg dialect with standard postgresql for driver compatibility if needed
    db_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
    
    conn = await asyncpg.connect(db_url)
    
    # Clear existing data in correct dependency order
    print("Clearing old tables...")
    await conn.execute("TRUNCATE TABLE case_audit CASCADE")
    await conn.execute("TRUNCATE TABLE case_diary CASCADE")
    await conn.execute("TRUNCATE TABLE doc_log CASCADE")
    await conn.execute("TRUNCATE TABLE cctv_alerts CASCADE")
    await conn.execute("TRUNCATE TABLE incidents CASCADE")
    await conn.execute("TRUNCATE TABLE cases CASCADE")
    await conn.execute("TRUNCATE TABLE patrol_units CASCADE")
    await conn.execute("TRUNCATE TABLE officers CASCADE")
    await conn.execute("TRUNCATE TABLE police_stations CASCADE")
    await conn.execute("TRUNCATE TABLE zone_risk_scores CASCADE")
    
    print("Inserting police stations...")
    ps_ids = {}
    stations_data = [
        ("Ellisbridge Police Station", "Zone 1", "Ellisbridge", 23.0225, 72.5714, "Near Town Hall, Ellisbridge, Ahmedabad"),
        ("Satellite Police Station", "Zone 1", "Satellite", 23.0300, 72.5100, "Satellite Road, Satellite, Ahmedabad"),
        ("Maninagar Police Station", "Zone 2", "Maninagar", 22.9890, 72.6030, "Maninagar Crossing, Maninagar, Ahmedabad"),
        ("Jamalpur Police Station", "Zone 2", "Jamalpur", 23.0370, 72.6050, "Jamalpur Gate, Jamalpur, Ahmedabad"),
        ("Bodakdev Police Station", "Zone 1", "Bodakdev", 23.0470, 72.5060, "S.G. Highway, Bodakdev, Ahmedabad")
    ]
    for name, zone, ward, lat, lon, addr in stations_data:
        ps_id = str(uuid.uuid4())
        await conn.execute("""
            INSERT INTO police_stations (id, name, zone, ward, lat, lon, address)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        """, ps_id, name, zone, ward, lat, lon, addr)
        ps_ids[ward] = ps_id

    print("Inserting officers...")
    officer_ids = []
    _demo_pwd = os.getenv("DEMO_SEED_PASSWORD")
    _admin_pwd = os.getenv("ADMIN_SEED_PASSWORD")
    if not _demo_pwd or not _admin_pwd:
        raise RuntimeError(
            "DEMO_SEED_PASSWORD and ADMIN_SEED_PASSWORD must be set in the environment before seeding."
        )
    pwd_hash      = hash_password(_demo_pwd)
    admin_pwd_hash = hash_password(_admin_pwd)

    await conn.execute("""
        INSERT INTO officers (badge_no, name, rank, role, ps_id, password_hash, is_active)
        VALUES ('ADMIN001', 'System Admin', 'Admin', 'admin', $1, $2, TRUE)
        ON CONFLICT (badge_no) DO UPDATE SET password_hash = EXCLUDED.password_hash, is_active = TRUE
    """, ps_ids['Ellisbridge'], admin_pwd_hash)
    
    # 1. DCP (Zone-level manager)
    dcp_id = str(uuid.uuid4())
    await conn.execute("""
        INSERT INTO officers (id, badge_no, name, rank, role, ps_id, password_hash, is_active)
        VALUES ($1, 'DCP001', 'Dr. Kanad Vyas', 'DCP', 'dcp', $2, $3, TRUE)
    """, dcp_id, ps_ids['Ellisbridge'], pwd_hash)
    
    # 2. SHOs (Station managers)
    sho_ids = {}
    for ward, ps_id in ps_ids.items():
        sho_id = str(uuid.uuid4())
        badge = f"SHO_{ward[:3].upper()}"
        name = f"Inspector {random_name()}"
        await conn.execute("""
            INSERT INTO officers (id, badge_no, name, rank, role, ps_id, password_hash, is_active)
            VALUES ($1, $2, $3, 'SHO', 'sho', $4, $5, TRUE)
        """, sho_id, badge, name, ps_id, pwd_hash)
        sho_ids[ps_id] = sho_id

    # 3. IOs (Investigating Officers)
    io_list = []
    for ward, ps_id in ps_ids.items():
        for i in range(1, 3):
            io_id = str(uuid.uuid4())
            badge = f"IO_{ward[:3].upper()}_{i}"
            name = f"Sub-Inspector {random_name()}"
            await conn.execute("""
                INSERT INTO officers (id, badge_no, name, rank, role, ps_id, password_hash, is_active)
                VALUES ($1, $2, $3, 'PSI', 'io', $4, $5, TRUE)
            """, io_id, badge, name, ps_id, pwd_hash)
            io_list.append((io_id, ps_id, ward[:3].upper()))

    print("Inserting patrol units...")
    for idx, (ward, ps_id) in enumerate(ps_ids.items(), 1):
        # available units
        await conn.execute("""
            INSERT INTO patrol_units (id, unit_name, ps_id, current_lat, current_lon, status)
            VALUES ($1, $2, $3, $4, $5, 'available')
        """, str(uuid.uuid4()), f"PCR Mobile {idx}", ps_id, AHMEDABAD_WARDS[idx-1][1], AHMEDABAD_WARDS[idx-1][2])

    print("Generating 200 synthetic case files & incident markers...")
    from app.services.legal_intel import suggest_sections, get_ipc_crossref
    
    for i in range(1, 201):
        ward_name, base_lat, base_lon = random.choice(AHMEDABAD_WARDS)
        crime_type, crime_code, severity = random.choice(CRIME_TYPES)
        ts = random_timestamp()
        
        # Add GPS noise within ward
        lat = base_lat + random.uniform(-0.004, 0.004)
        lon = base_lon + random.uniform(-0.004, 0.004)
        
        # Match nearest police station for this case (or default to Jamalpur)
        ps_id = ps_ids.get(ward_name, ps_ids['Jamalpur'])
        
        # Select active IO for this station
        station_ios = [io for io in io_list if io[1] == ps_id]
        io_id, _, ps_code = station_ios[0] if station_ios else io_list[0]
        
        fir_no = random_fir_no(ps_code, i, ts.year)
        case_id = str(uuid.uuid4())
        
        victim = random_name()
        accused = random_name() if random.random() > 0.4 else None
        
        narratives = {
            'theft': f"The victim {victim} reported that while shopping in the busy market area of {ward_name}, an unknown person stole their wallet containing Rs. 8,500 and credit cards from their bag.",
            'snatching': f"The victim {victim} was walking near {ward_name} cross roads when two men on a black motorcycle snatched their gold chain weighing 15 grams and sped away towards Ahmedabad highway.",
            'assault': f"A physical altercation broke out near the local bus stand in {ward_name}. The accused {accused or 'unknown person'} verbally abused and physically assaulted {victim} with a wooden stick, causing minor bruises.",
            'robbery': f"The victim {victim} was stopped in a secluded alleyway in {ward_name} by the accused {accused or 'a masked man'} who threatened them at knifepoint and robbed them of their smartphone and cash.",
            'fraud': f"The victim {victim} received a phishing call claiming to update their bank KYC. The fraudster induced them to share an OTP and withdrew Rs. 45,000 from their account.",
            'cyber': f"The complainant {victim} stated that their social media profile was hacked by unknown cybercriminals who were sending malicious messages and demand money from contacts.",
            'vehicle_theft': f"The victim {victim} parked their silver hatchback near {ward_name} metro station in the morning. When they returned in the evening, the vehicle was missing and suspected stolen.",
            'burglary': f"The residents of house 42 in {ward_name} were out for dinner. The lock of the main door was broken and gold jewelry worth Rs. 1.2 Lakhs along with cash was burglarized."
        }
        
        narrative = narratives.get(crime_type, f"Incident of {crime_type} occurred at {ward_name} involving {victim}.")
        
        sections = suggest_sections(narrative)
        crossref = get_ipc_crossref(sections)
        
        status = random.choices(
            ['open', 'arrested', 'chargesheeted'],
            weights=[60, 25, 15]
        )[0]
        
        evidence = []
        if crime_type in ('theft', 'snatching', 'robbery', 'burglary'):
            evidence = [{"item": "Gold Chain fragment", "description": "Recovered from scene", "value": 5000}]
        elif crime_type in ('fraud', 'cyber'):
            evidence = [{"item": "Screenshot of transaction log", "description": "IP trace printout", "value": 0}]
            
        witnesses = [{"name": random_name(), "statement": "I saw two individuals running away from the scene immediately after the incident."}]
        
        arrest_date = ts + timedelta(days=random.randint(1, 5)) if status != 'open' else None
        
        # Insert cases
        await conn.execute("""
            INSERT INTO cases (
                case_id, fir_no, ps_id, io_id,
                victim_name, victim_address, victim_phone, victim_age, victim_gender, victim_injury,
                accused_name, accused_address, accused_age,
                crime_type, crime_code, crime_narrative, crime_date, crime_location,
                crime_lat, crime_lon, geoloc,
                bns_sections, bnss_sections, bsa_sections, ipc_crossref,
                case_status, evidence_items, witnesses, arrest_date, created_at
            ) VALUES (
                $1, $2, $3, $4,
                $5, $6, $7, $8, $9, $10,
                $11, $12, $13,
                $14, $15, $16, $17, $18,
                $19, $20, ST_MakePoint($20,$19)::GEOGRAPHY,
                $21, $22, $23, $24,
                $25, $26, $27, $28, $29
            )
        """, case_id, fir_no, ps_id, io_id,
           victim, f"Flat 101, {ward_name}, Ahmedabad", "9876543210", random.randint(19, 68), random.choice(['male', 'female']), severity >= 4,
           accused, f"Secluded area, {ward_name}, Ahmedabad" if accused else None, random.randint(18, 50) if accused else None,
           crime_type, crime_code, narrative, ts, f"Near {ward_name} Market Road, Ahmedabad",
           lat, lon,
           sections.get('bns', []), sections.get('bnss', []), sections.get('bsa', []), crossref,
           status, json_dumps(evidence), json_dumps(witnesses), arrest_date, ts)
           
        # Insert incidents
        await conn.execute("""
            INSERT INTO incidents (case_id, source, crime_code, crime_type, lat, lon, geoloc, timestamp, severity, ward, status)
            VALUES ($1, 'fir', $2, $3, $4, $5, ST_MakePoint($5,$4)::GEOGRAPHY, $6, $7, $8, 'active')
        """, case_id, crime_code, crime_type, lat, lon, ts, severity, ward_name)
        
        # Log case diary
        await conn.execute("""
            INSERT INTO case_diary (case_id, entry_type, description, officer_id, location, auto_generated, ts)
            VALUES ($1, 'fir', $2, $3, $4, TRUE, $5)
        """, case_id, f"FIR registered under sections {', '.join(sections.get('bns', []))}", io_id, f"Near {ward_name} Market, Ahmedabad", ts)

        if status != 'open':
            await conn.execute("""
                INSERT INTO case_diary (case_id, entry_type, description, officer_id, auto_generated, ts)
                VALUES ($1, 'arrest', $2, $3, TRUE, $4)
            """, case_id, f"Accused {accused or 'Unnamed Accused'} successfully apprehended and taken into custody", io_id, arrest_date)
            
    print("Generating CCTV alerts...")
    for idx, (ward, ps_id) in enumerate(ps_ids.items(), 1):
        # Generate some synthetic loitering and crowd density alerts
        await conn.execute("""
            INSERT INTO cctv_alerts (camera_id, source, alert_type, confidence, person_count, lat, lon, geoloc, ts)
            VALUES ($1, 'samraksha_model', 'loitering', 0.86, 2, $2, $3, ST_MakePoint($3,$2)::GEOGRAPHY, NOW() - INTERVAL '30 minutes')
        """, f"CAM_{ward[:3].upper()}_01", AHMEDABAD_WARDS[idx-1][1], AHMEDABAD_WARDS[idx-1][2])

        await conn.execute("""
            INSERT INTO cctv_alerts (camera_id, source, alert_type, confidence, person_count, lat, lon, geoloc, ts)
            VALUES ($1, 'iccc', 'crowd_density', 0.92, 42, $2, $3, ST_MakePoint($3,$2)::GEOGRAPHY, NOW() - INTERVAL '15 minutes')
        """, f"CAM_{ward[:3].upper()}_02", AHMEDABAD_WARDS[idx-1][1] + 0.001, AHMEDABAD_WARDS[idx-1][2] - 0.001)

    print("Computing hourly zone risk scores cache...")
    for ward, _, _ in AHMEDABAD_WARDS:
        for hour in range(24):
            for dow in range(7):
                # Calculate synthetic risk: base risk + temporal spikes
                # higher risk on weekends (dow >= 5) and night (hour >= 20 or hour <= 2)
                base = 20.0
                if dow >= 5:
                    base += 15.0
                if hour >= 20 or hour <= 2:
                    base += 25.0
                # Add random noise
                score = min(max(base + random.uniform(5.0, 15.0), 10.0), 95.0)
                await conn.execute("""
                    INSERT INTO zone_risk_scores (ward, hour_slot, day_of_week, risk_score, festival_flag, computed_at)
                    VALUES ($1, $2, $3, $4, FALSE, NOW())
                """, ward, hour, dow, score)

    await conn.close()
    print("Database seeding completed successfully!")
    print("Demo officer badge numbers: DCP001, SHO_ELL, IO_ELL_1 — passwords set from env DEMO_SEED_PASSWORD")

def json_dumps(obj):
    import json
    return json.dumps(obj)

if __name__ == '__main__':
    asyncio.run(seed())
