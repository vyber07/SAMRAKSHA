"""
SAMRAKSHA — pytest test suite
Run: pytest backend/tests/ -v
"""
import pytest
import json
import asyncio


# ──────────────────────────────────────────────────────────────
# prediction.py
# ──────────────────────────────────────────────────────────────
class TestPrediction:
    def test_festival_flag_navratri(self):
        from app.services.prediction import get_festival_flag
        assert get_festival_flag(10, 1) is True

    def test_festival_flag_no_match(self):
        from app.services.prediction import get_festival_flag
        assert get_festival_flag(8, 15) is False

    def test_build_features_columns(self):
        import pandas as pd
        from app.services.prediction import build_features
        df = pd.DataFrame([{
            'id': 1,
            'timestamp': '2024-03-15 22:00:00',
            'lat': 23.02, 'lon': 72.57, 'ward': 'Ambawadi',
            'crime_type': 'theft', 'severity': 3
        }])
        out = build_features(df)
        for col in ['hour', 'day_of_week', 'month', 'is_night', 'festival_flag']:
            assert col in out.columns, f"Missing column: {col}"

    def test_dbscan_returns_list(self):
        import pandas as pd
        from app.services.prediction import run_dbscan_clustering
        df = pd.DataFrame([
            {'lat': 23.02, 'lon': 72.57, 'crime_type': 'theft', 'timestamp': '2024-01-01 10:00:00',
             'ward': 'Ambawadi', 'severity': 2},
        ] * 20)
        clusters = run_dbscan_clustering(df)
        assert isinstance(clusters, list)


# ──────────────────────────────────────────────────────────────
# legal_intel.py
# ──────────────────────────────────────────────────────────────
class TestLegalIntel:
    def test_theft_bns_section(self):
        from app.services.legal_intel import suggest_sections
        result = suggest_sections("accused was caught stealing a mobile phone from a shop")
        assert any('BNS 303' in s or 'BNS 304' in s for s in result.get('bns', []))

    def test_bsa_populated(self):
        from app.services.legal_intel import suggest_sections
        result = suggest_sections("accused committed robbery at knifepoint")
        assert len(result.get('bsa', [])) > 0, "BSA sections must not be empty for robbery"

    def test_murder_crossref(self):
        from app.services.legal_intel import suggest_sections, get_ipc_crossref
        secs = suggest_sections("accused killed the victim with a sharp weapon")
        crossref = get_ipc_crossref(secs)
        assert any('IPC' in c for c in crossref)

    def test_drug_other_sections(self):
        from app.services.legal_intel import suggest_sections
        result = suggest_sections("accused found with 2kg ganja")
        assert 'NDPS 20' in result.get('other', [])


# ──────────────────────────────────────────────────────────────
# document_gen.py
# ──────────────────────────────────────────────────────────────
class TestDocumentGen:
    ALL_TYPES = [
        'chargesheet', 'medical_letter', 'remand_request',
        'seizure_receipt', 'court_custody', 'panchanama', 'face_id'
    ]
    SAMPLE_CASE = {
        'fir_no': 'AMB/2024/0001',
        'ps_name': 'Ambawadi PS',
        'victim_name': 'Test Victim',
        'victim_address': '123, Ring Road, Ahmedabad',
        'victim_age': 35,
        'victim_gender': 'Male',
        'accused_name': 'Test Accused',
        'accused_address': '456, CG Road',
        'accused_age': 28,
        'crime_type': 'Robbery',
        'crime_date': '2024-01-01T22:00:00',
        'crime_location': 'Near SBI ATM',
        'crime_narrative': 'At approximately 10 PM accused snatched chain.',
        'bns_sections': ['BNS 309', 'BNS 310'],
        'bnss_sections': ['BNSS 170'],
        'bsa_sections': ['BSA 23', 'BSA 27'],
        'ipc_crossref': ['IPC 392'],
        'evidence_items': [{'item': 'Mobile phone', 'description': 'Samsung', 'value': '15000'}],
        'witnesses': [{'name': 'Witness One', 'statement': 'Saw accused running'}],
    }
    SAMPLE_OFFICER = {
        'name': 'SI Ramesh Patel',
        'badge_no': 'B-1234',
    }

    def test_all_seven_types_generate(self, tmp_path):
        from app.services.document_gen import generate_document
        import os
        for doc_type in self.ALL_TYPES:
            raw_bytes, sha256 = generate_document(doc_type, self.SAMPLE_CASE, self.SAMPLE_OFFICER, lang='en')
            # Save to tmp path for inspection
            out_path = tmp_path / f"{doc_type}.docx"
            out_path.write_bytes(raw_bytes)
            assert out_path.exists(), f"{doc_type} did not produce output"
            assert len(raw_bytes) > 100, f"{doc_type} produced empty/tiny file"

    def test_sha256_returned(self, tmp_path):
        from app.services.document_gen import generate_document
        raw_bytes, sha256 = generate_document('chargesheet', self.SAMPLE_CASE, self.SAMPLE_OFFICER, lang='en')
        assert len(sha256) == 64, "SHA-256 must be 64 hex chars"
        assert sha256.isalnum(), "SHA-256 must be hex alphanumeric"


# ──────────────────────────────────────────────────────────────
# routing.py
# ──────────────────────────────────────────────────────────────
class TestRouting:
    UNITS = [
        {'id': 'u1', 'unit_name': 'PCR-1', 'current_lat': 23.02, 'current_lon': 72.57},
        {'id': 'u2', 'unit_name': 'PCR-2', 'current_lat': 23.04, 'current_lon': 72.55},
    ]
    HOTSPOTS = [
        {'lat': 23.03, 'lon': 72.56, 'risk_score': 85, 'ward': 'Ambawadi'},
        {'lat': 23.05, 'lon': 72.58, 'risk_score': 60, 'ward': 'Naranpura'},
    ]

    def test_routes_returned_for_each_unit(self):
        from app.services.routing import optimize_patrol_routes
        result = asyncio.get_event_loop().run_until_complete(
            optimize_patrol_routes(self.UNITS, self.HOTSPOTS)
        )
        assert isinstance(result, list)
        assert len(result) == len(self.UNITS)

    def test_route_has_waypoints(self):
        from app.services.routing import optimize_patrol_routes
        result = asyncio.get_event_loop().run_until_complete(
            optimize_patrol_routes(self.UNITS, self.HOTSPOTS)
        )
        for route in result:
            assert 'unit_id' in route
            assert 'route' in route
            assert isinstance(route['route'], list)


# ──────────────────────────────────────────────────────────────
# schema helpers (no DB — just structural)
# ──────────────────────────────────────────────────────────────
class TestSchemaFile:
    REQUIRED_TABLES = [
        'officers', 'police_stations', 'cases', 'incidents',
        'case_audit', 'case_diary', 'doc_log', 'cctv_alerts',
        'zone_risk_scores', 'patrol_units',
        'fir_sequences', 'scene_log', 'evidence_custody',
        'forensic_requests', 'statements', 'warrants', 'court_proceedings',
    ]
    REQUIRED_FUNCTIONS = ['next_fir_number', 'log_case_changes']

    def _schema(self):
        # Path relative to container working directory /app
        schema_path = 'db/schema.sql'
        with open(schema_path) as f:
            return f.read()

    def test_all_tables_present(self):
        sql = self._schema()
        for table in self.REQUIRED_TABLES:
            assert table in sql, f"Missing table: {table}"

    def test_fir_sequence_function(self):
        sql = self._schema()
        for fn in self.REQUIRED_FUNCTIONS:
            assert fn in sql, f"Missing function: {fn}"

    def test_ward_column_in_cases(self):
        sql = self._schema()
        # Find cases CREATE TABLE block
        start = sql.index('CREATE TABLE IF NOT EXISTS cases')
        end   = sql.index(');', start)
        block = sql[start:end]
        assert 'ward' in block, "'ward' column missing from cases table"

    def test_closure_columns_in_cases(self):
        sql = self._schema()
        assert 'closure_type' in sql
        assert 'closure_reason' in sql
        assert 'closed_at' in sql
