from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import jwt as _jwt  # PyJWT — replaces python-jose (CVE-2024-33663, CVE-2024-33664)
from collections import defaultdict
import os
import structlog

SECRET_KEY = os.getenv("SECRET_KEY") or ""
if not SECRET_KEY:
    import warnings; warnings.warn("SECRET_KEY env var not set — WebSocket JWT verification will reject all connections", RuntimeWarning)
ALGORITHM = "HS256"  # pinned — no algorithm negotiation

logger = structlog.get_logger()
router = APIRouter()

class DashboardManager:
    def __init__(self):
        self.connections: dict[str, list[WebSocket]] = defaultdict(list)
    
    async def connect(self, ws: WebSocket, officer_id: str):
        await ws.accept()
        if ws not in self.connections[officer_id]:
            self.connections[officer_id].append(ws)
        # Provide initial state on connect
        await ws.send_json({
            'type': 'INIT',
            'message': 'Connected'
        })

    def disconnect(self, ws: WebSocket, officer_id: str):
        if officer_id in self.connections:
            if ws in self.connections[officer_id]:
                self.connections[officer_id].remove(ws)
            if not self.connections[officer_id]:
                del self.connections[officer_id]
    
    async def broadcast(self, event: dict):
        empty_officers = []
        for oid, ws_list in list(self.connections.items()):
            dead_ws = []
            for ws in list(ws_list):
                try:
                    await ws.send_json(event)
                except Exception as e:
                    logger.debug(
                        "WebSocket send failed, removing dead connection",
                        officer_id=oid, error=str(e)
                    )
                    dead_ws.append(ws)
            for ws in dead_ws:
                if ws in ws_list:
                    ws_list.remove(ws)
            if not ws_list:
                empty_officers.append(oid)
        for oid in empty_officers:
            if oid in self.connections and not self.connections[oid]:
                del self.connections[oid]

manager = DashboardManager()

@router.websocket("/dashboard")
async def websocket_endpoint(websocket: WebSocket, token: str = None):
    if not token:
        await websocket.close(code=1008, reason="Missing authentication token")
        return

    clean_token = token.split(" ", 1)[1] if token.startswith("Bearer ") else token

    try:
        payload = _jwt.decode(clean_token, SECRET_KEY, algorithms=[ALGORITHM])  # algorithms pinned, no negotiation
        officer_id = payload.get("sub")
        if not officer_id:
            await websocket.close(code=1008, reason="Invalid token payload")
            return
    except (_jwt.ExpiredSignatureError, _jwt.InvalidTokenError):
        await websocket.close(code=1008, reason="Invalid or expired token")
        return
    except Exception:
        await websocket.close(code=1008, reason="Authentication failed")
        return

    await manager.connect(websocket, officer_id)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, officer_id)


