# SAMRAKSHA
## Unified Predictive Policing & AI Case Intelligence Platform

**Kanad S.H.I.E.L.D. Cybersecurity Hackathon 2026**
Ahmedabad City Police | Cyber Crime Branch | i-Hub Gujarat

---

### Problem Statements Addressed
- **KANADSHIELD26_P2_06** — CrimeGPT: AI-Powered Automation for Crime Documentation and Legal Intelligence
- **KANADSHIELD26_P2_07** — Crime Hotspot Mapping & Predictive Patrol Routing System (Cyber-Integrated)

---

### Core Concept
One FIR entry simultaneously updates the crime prediction map AND pre-fills all 7 required legal documents. No data is entered twice.

---

### Quick Start

```bash
# 1. Start all docker services
./setup.sh

# 2. Access dashboard
# Open http://localhost:80
```

Demo login credentials (change before any real deployment):
| Role | Badge | Password |
|---|---|---|
| DCP | DCP001 | Demo@2026 |
| SHO | SHO_ELL | Demo@2026 |
| IO | IO_ELL_1 | Demo@2026 |

---

### Features
- Live crime heatmap on real Ahmedabad 48-ward GIS boundaries
- XGBoost risk prediction + DBSCAN spatial clustering
- OR-Tools patrol route optimization (re-solves in <3 seconds)
- Automatic generation of all 7 BNS/BNSS/BSA-compliant documents
- Dual-mode AI case assistant (This Case / All Cases)
- MediaPipe CCTV crowd/anomaly detection pipeline
- IndicTrans2 multilingual support (Gujarati, Hindi, English)
- Real-time WebSocket dashboard updates
- Festival/event simulation (Rath Yatra, Navratri, etc.)
- Complete audit trail — tamper-proof, forensically admissible

---

### Legal Notice
This system uses BNS/BNSS/BSA 2024 (effective 1 July 2024).
All legal section suggestions are for officer review only.
DEMO DATA is synthetic — not real police records.
CCTV pipeline generates risk signals only.
No automated enforcement action is taken without human confirmation.

---

### Disclaimer
Built for Kanad S.H.I.E.L.D. 2026 hackathon.
All demo data is synthetic and anonymized.
Real deployment requires institutional data-sharing agreements with Ahmedabad Police and ASCL (ICCC).
