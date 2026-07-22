# Samraksha - Police Crime Monitoring & Case Management Dashboard

## Overview
Samraksha is a cutting-edge real-time Police Crime Monitoring and Case Management system. It seamlessly integrates a powerful Python backend with a high-performance React front end, leveraging modern AI/ML and geospatial techniques to give law enforcement an unprecedented edge in operational capabilities.

## Features
- **Real-time Map & Routing**: Features dynamic, real-time routing logic that generates exact road-based paths using locally hosted OSRM. 
- **AI/ML Patrol Dispatching**: Uses Google OR-Tools to dynamically re-calculate and re-route police patrols precisely along real-world road networks, prioritizing areas with active hotspots.
- **Dynamic Database-backed Infrastructure**: Every piece of data—from unit locations, live incident alerts, officer credentials, and IAM-style granular permissions—is live and directly fed from PostgreSQL. There are NO hardcoded mocks masking data outages.
- **Analytics & Predictive Insights**: Tracks historical trends and forecasts localized crime hotspots using data science analytics models, helping commanding officers pre-deploy units automatically.
- **Live Notifications & Control Center**: Integrates live WebSocket events so officers are notified immediately of changes, PCR webhooks, and routing re-assignments.

## Architecture & Stack
- **Frontend**: React 19, Vite, Leaflet, Zustand, Axios
- **Backend**: FastAPI, Asyncpg, SQLAlchemy, XGBoost, Scikit-learn
- **Databases**: PostgreSQL (with PostGIS for GeoSpatial mapping) and Redis
- **Routing Engine**: OSRM + Google OR-Tools

## Deployment
All services are containerized via Docker and orchestrated using Docker Compose.
Run `docker compose up -d --build` to deploy the entire stack instantly.

