from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from jose import jwt, JWTError
import os
import structlog
from app.db.connection import get_db, fetch_all
from app.api.auth import SECRET_KEY, ALGORITHM

router = APIRouter()
logger = structlog.get_logger()

class DashboardManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
        
    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active_connections.append(ws)
        logger.info("New dashboard WebSocket client connected", count=len(self.active_connections))
        
    def disconnect(self, ws: WebSocket):
        if ws in self.active_connections:
            self.active_connections.remove(ws)
            logger.info("Dashboard WebSocket client disconnected", count=len(self.active_connections))
            
    async def broadcast(self, event: dict):
        # Format timestamps in event payload if any are datetime objects
        # to prevent JSON serialization errors
        serializable_event = self.make_serializable(event)
        
        dead_connections = []
        for ws in self.active_connections:
            try:
                await ws.send_json(serializable_event)
            except Exception:
                dead_connections.append(ws)
        for ws in dead_connections:
            self.disconnect(ws)

    def make_serializable(self, data):
        if isinstance(data, dict):
            return {k: self.make_serializable(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [self.make_serializable(v) for v in data]
        elif hasattr(data, 'isoformat'):
            return data.isoformat()
        return data

manager = DashboardManager()

@router.websocket("/dashboard")
async def websocket_endpoint(
    websocket: WebSocket,
):
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4001)
        return
        
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        officer_id = payload.get("sub")
        if not officer_id:
            await websocket.close(code=4001)
            return
    except JWTError:
        await websocket.close(code=4001)
        return

    # Database session for initial load
    db_gen = get_db()
    db = await db_gen.__anext__()
    
    try:
        await manager.connect(websocket)
        
        # Load initial data to populate client dashboard on load
        incidents = await fetch_all(db, """
            SELECT id, crime_type, crime_code, lat, lon, timestamp, severity, ward, source, case_id
            FROM incidents WHERE status = 'active' ORDER BY timestamp DESC LIMIT 10
        """)
        
        alerts = await fetch_all(db, """
            SELECT id, camera_id, camera_name, source, alert_type, confidence, person_count, lat, lon, plate_no, ts
            FROM cctv_alerts ORDER BY ts DESC LIMIT 5
        """)
        
        # Serialize datetime fields
        for inc in incidents:
            if inc.get('timestamp'):
                inc['timestamp'] = inc['timestamp'].isoformat()
        for al in alerts:
            if al.get('ts'):
                al['ts'] = al['ts'].isoformat()

        await websocket.send_json({
            'type': 'INIT',
            'incidents': incidents,
            'alerts': alerts
        })
        
        # Wait loop to keep socket active
        while True:
            # We can receive ping messages or handle commands
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error("WebSocket connection handling failed", error=str(e))
        manager.disconnect(websocket)
    finally:
        # Clean up database generator session
        try:
            await db_gen.aclose()
        except Exception:
            pass
