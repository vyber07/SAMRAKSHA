# SAMRAKSHA Backend API

Police Crime Monitoring & Case Management API built with FastAPI

## Overview

The SAMRAKSHA backend provides a comprehensive REST API for police crime monitoring, incident tracking, case management, and patrol coordination. Built with FastAPI, it features high performance, automatic API documentation, and PostgreSQL with PostGIS for geospatial queries.

---

## Technology Stack

- **FastAPI 0.104+** - Modern async web framework
- **PostgreSQL 16** - Relational database with PostGIS
- **SQLAlchemy 2.0** - ORM for database operations
- **Pydantic** - Data validation and serialization
- **JWT** - Token-based authentication
- **Redis** - Session and data caching
- **Uvicorn** - ASGI server

---

## Features

### Authentication & Authorization
- JWT token-based authentication
- Role-based access control (RBAC)
- User roles: Admin, SHO, DCP, IO, Constable
- Secure password hashing with bcrypt

### Core Functionality
- **Case Management** - Create, read, update, delete cases
- **Incident Tracking** - Real-time incident tracking and updates
- **Geospatial Analysis** - Crime hotspot mapping with PostGIS
- **Patrol Coordination** - Track patrol units and assignments
- **CCTV Management** - Camera monitoring and status
- **Analytics** - Statistics and reporting endpoints

### Data Management
- Incident data collection and tracking
- Case status monitoring
- Officer and unit management
- Audit trail logging
- Data validation and integrity

---

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── endpoints/
│   │   │   ├── auth.py         # Authentication routes
│   │   │   ├── cases.py        # Case management routes
│   │   │   ├── incidents.py    # Incident routes
│   │   │   ├── map.py          # Geospatial routes
│   │   │   ├── patrol.py       # Patrol management
│   │   │   ├── cctv.py         # CCTV management
│   │   │   ├── analytics.py    # Analytics routes
│   │   │   └── admin.py        # Admin routes
│   │   └── routes.py           # Route aggregation
│   │
│   ├── models/
│   │   ├── user.py             # User model
│   │   ├── case.py             # Case model
│   │   ├── incident.py         # Incident model
│   │   ├── officer.py          # Officer model
│   │   ├── patrol.py           # Patrol unit model
│   │   ├── cctv.py             # CCTV camera model
│   │   └── base.py             # Base model class
│   │
│   ├── schemas/
│   │   ├── user.py             # User schemas (requests/responses)
│   │   ├── case.py             # Case schemas
│   │   ├── incident.py         # Incident schemas
│   │   └── common.py           # Shared schemas
│   │
│   ├── database.py             # Database configuration
│   ├── security.py             # JWT and password utilities
│   ├── config.py               # App configuration
│   ├── main.py                 # FastAPI app initialization
│   └── dependencies.py         # Dependency injection
│
├── db/
│   └── schema.sql              # Database initialization
│
├── Dockerfile                  # Container build
├── requirements.txt            # Python dependencies
├── main.py                     # Entry point
└── README.md                   # This file
```

---

## Installation

### Prerequisites
- Python 3.11+
- PostgreSQL 14+ with PostGIS extension
- Redis 6+
- Docker (optional, for containerized deployment)

### Local Setup

1. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Initialize database**
   ```bash
   # The database is auto-initialized from schema.sql when Docker starts
   # For local development:
   psql -U postgres -f db/schema.sql
   ```

5. **Run the server**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

Server runs on `http://localhost:8000`

---

## API Documentation

### Interactive Documentation
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

All endpoints are automatically documented with request/response examples.

### Health Check
```bash
GET /health
```

---

## Endpoints Overview

### Authentication (`/auth`)
```
POST   /auth/login              Login with credentials
POST   /auth/logout             Logout user
GET    /auth/me                 Get current user info
POST   /auth/refresh            Refresh JWT token
```

### Cases (`/cases`)
```
GET    /cases                   List all cases
POST   /cases                   Create new case
GET    /cases/{id}             Get case details
PATCH  /cases/{id}             Update case
DELETE /cases/{id}             Delete case
```

### Incidents (`/incident`)
```
GET    /incident                List incidents
POST   /incident                Create incident
GET    /incident/{id}          Get incident details
PATCH  /incident/{id}          Update incident
```

### Mapping (`/map`)
```
GET    /map/hotspots           Get crime hotspots
GET    /map/analytics          Get map analytics
```

### Patrol (`/patrol`)
```
GET    /patrol                  List patrol units
GET    /patrol/location        Get patrol locations
POST   /patrol/location        Update patrol location
```

### CCTV (`/cctv`)
```
GET    /cctv                    List cameras
GET    /cctv/{id}              Get camera details
GET    /cctv/{id}/feed         Get camera feed
```

### Analytics (`/analytics`)
```
GET    /analytics/dashboard    Dashboard statistics
GET    /analytics/incidents    Incident analytics
GET    /analytics/cases        Case analytics
```

### Admin (`/admin`)
```
GET    /admin/users            List users
POST   /admin/users            Create user
GET    /admin/settings         System settings
POST   /admin/logs             Query audit logs
```

---

## Database Schema

### Core Tables
- **users** - User accounts with roles
- **officers** - Police officer information
- **cases** - Criminal cases
- **incidents** - Crime incidents
- **patrol_units** - Patrol vehicle assignments
- **cctv_cameras** - CCTV camera management

### Relationships
- Users → Officers (1:1)
- Officers → Cases (1:many)
- Officers → Incidents (1:many)
- Cases → Incidents (1:many)

---

## Authentication & Authorization

### JWT Token Flow
```
1. Client sends credentials to /auth/login
2. Server validates and returns JWT token
3. Client includes token in Authorization header
4. Server validates token on each request
```

### Role-Based Access

| Endpoint | Admin | SHO | DCP | IO | Constable |
|----------|:-----:|:---:|:---:|:--:|:---------:|
| Cases | ✅ | ✅ | ✅ | ✅ | ❌ |
| Incidents | ✅ | ✅ | ✅ | ✅ | ✅ |
| Analytics | ✅ | ✅ | ✅ | ❌ | ❌ |
| Patrol | ✅ | ✅ | ✅ | ✅ | ✅ |
| CCTV | ✅ | ✅ | ✅ | ❌ | ❌ |
| Admin | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## Configuration

### Environment Variables
```
DATABASE_URL         PostgreSQL connection string
REDIS_URL           Redis connection string
SECRET_KEY          JWT secret key
ACCESS_TOKEN_EXPIRE_MINUTES  Token expiry time
ALGORITHM           JWT algorithm (HS256)
ENVIRONMENT         development/production
DEMO_MODE          Enable demo data
```

### Database Configuration
```python
# database.py
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")
SQLALCHEMY_ECHO = False  # Set to True for SQL logging
```

---

## Error Handling

### Standard Error Response
```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "status_code": 400,
  "details": {}
}
```

### Common Error Codes
- `400` - Bad request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found (resource doesn't exist)
- `409` - Conflict (duplicate data)
- `500` - Server error

---

## Development

### Running Tests
```bash
pytest tests/
pytest -v --cov=app/  # With coverage
```

### Code Quality
```bash
# Format code
black app/

# Lint
flake8 app/

# Type checking
mypy app/
```

### Database Migrations
```bash
# Using Alembic (if configured)
alembic upgrade head
alembic revision --autogenerate -m "Add new column"
```

---

## Performance Optimization

### Caching Strategy
- Session data in Redis
- Frequently accessed queries cached
- Cache invalidation on data updates

### Database Optimization
- Indexed on foreign keys
- Indexed on frequently queried fields
- PostGIS spatial indexes for location queries

### API Optimization
- Async/await for non-blocking I/O
- Connection pooling
- Request/response compression
- Pagination on list endpoints

---

## Security

### Password Security
- Bcrypt hashing with salt
- Minimum 8 character requirement
- No password logging

### API Security
- JWT token validation
- CORS configured
- Rate limiting (configurable)
- SQL injection prevention via SQLAlchemy ORM
- CSRF protection

### Data Protection
- Environment variable secrets
- HTTPS in production
- Audit trail logging
- User permission enforcement

---

## Deployment

### Docker Deployment
```bash
# Build image
docker build -t samraksha-api .

# Run container
docker run -p 8000:8000 \
  -e DATABASE_URL=postgresql://... \
  -e REDIS_URL=redis://... \
  samraksha-api
```

### Docker Compose
```bash
# From project root
docker-compose up -d api

# View logs
docker-compose logs -f api
```

### Production Checklist
- [ ] Change SECRET_KEY to strong random value
- [ ] Set ENVIRONMENT=production
- [ ] Configure HTTPS/SSL
- [ ] Enable CORS for frontend domain
- [ ] Set up logging and monitoring
- [ ] Configure database backups
- [ ] Set up rate limiting
- [ ] Enable database indexes
- [ ] Monitor performance and errors

---

## Troubleshooting

### Database Connection Failed
```bash
# Check PostgreSQL is running
psql -U samraksha -d samraksha -c "SELECT 1"

# Verify DATABASE_URL is correct
echo $DATABASE_URL
```

### Import Errors
```bash
# Reinstall dependencies
pip install -r requirements.txt --force-reinstall

# Check Python path
export PYTHONPATH=$PYTHONPATH:$(pwd)
```

### Port Already in Use
```bash
# Check what's using port 8000
lsof -i :8000

# Kill process
kill -9 <PID>
```

### JWT Token Issues
```bash
# Check token expiry
# Tokens expire after ACCESS_TOKEN_EXPIRE_MINUTES

# Get new token
POST /auth/login with credentials

# Use token in header
Authorization: Bearer <token>
```

---

## Logging

### Configuration
```python
# Logs are output to console and optional file
LOG_LEVEL=INFO  # DEBUG, INFO, WARNING, ERROR, CRITICAL
LOG_FILE=/var/log/samraksha/app.log  # Optional
```

### Viewing Logs
```bash
# Docker logs
docker-compose logs -f api

# File logs (if configured)
tail -f /var/log/samraksha/app.log
```

---

## Monitoring & Maintenance

### Health Monitoring
```bash
# Check API health
curl http://localhost:8000/health

# Check database connection
curl http://localhost:8000/admin/health/db

# Check cache connection
curl http://localhost:8000/admin/health/cache
```

### Database Maintenance
```bash
# Vacuum and analyze (PostgreSQL)
VACUUM ANALYZE;

# Check index health
SELECT * FROM pg_stat_user_indexes;
```

### Regular Tasks
- Daily: Check error logs
- Weekly: Monitor performance metrics
- Monthly: Update dependencies
- Quarterly: Optimize slow queries

---

## Documentation

- [Main README](../README.md) - Project overview
- [Frontend README](../frontend/README.md) - Frontend documentation
- [Implementation Guide](../IMPLEMENTATION_SUMMARY.md) - Architecture details

---

## Support

### Getting Help
1. Check logs: `docker-compose logs -f api`
2. Test endpoint: `curl http://localhost:8000/health`
3. Review API docs: `http://localhost:8000/docs`
4. Check configuration: Verify .env variables

---

## License

SAMRAKSHA © 2026 - Kanad S.H.I.E.L.D. Hackathon

---

## Status

```
Version:    2.0.0
Status:     ✅ Production Ready
Build Date: July 2026
Endpoints:  25+ implemented
Tests:      Ready for QA
```

---

**SAMRAKSHA Backend API** | FastAPI | PostgreSQL + PostGIS | Redis
