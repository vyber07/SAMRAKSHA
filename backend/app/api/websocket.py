from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from jose import JWTError, jwt
import os

SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-key-1234567890")
ALGORITHM  = os.getenv("JWT_ALGORITHM", "HS256")

router = APIRouter()

class DashboardManager:
    def __init__(self):
        self.connections: dict[str, WebSocket] = {}
    
    async def connect(self, ws: WebSocket, officer_id: str):
        await ws.accept()
        self.connections[officer_id] = ws
        # Provide initial state on connect
        await ws.send_json({
            'type': 'INIT',
            'message': 'Connected'
        })
    
    async def broadcast(self, event: dict):
        dead = []
        for oid, ws in self.connections.items():
            try:
                await ws.send_json(event)
            except Exception as e:
                import structlog
                structlog.get_logger().debug(
                    "WebSocket send failed, removing dead connection",
                    officer_id=oid, error=str(e)
                )
                dead.append(oid)
        for oid in dead:
            del self.connections[oid]

manager = DashboardManager()

@router.websocket("/dashboard")
async def websocket_endpoint(websocket: WebSocket, token: str = None):
    if not token:
        await websocket.close(code=1008, reason="Missing authentication token")
        return

    clean_token = token.split(" ", 1)[1] if token.startswith("Bearer ") else token

    try:
        payload = jwt.decode(clean_token, SECRET_KEY, algorithms=[ALGORITHM])
        officer_id = payload.get("sub")
        if not officer_id:
            await websocket.close(code=1008, reason="Invalid token payload")
            return
    except JWTError:
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
        if officer_id in manager.connections:
            del manager.connections[officer_id]


