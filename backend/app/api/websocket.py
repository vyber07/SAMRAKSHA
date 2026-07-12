# app/api/websocket.py

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

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
            except:
                dead.append(oid)
        for oid in dead:
            del self.connections[oid]

manager = DashboardManager()

@router.websocket("/dashboard")
async def websocket_endpoint(websocket: WebSocket, token: str = None):
    # Skip JWT decoding in demo, use a dummy ID
    officer_id = "demo_user"
    await manager.connect(websocket, officer_id)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        if officer_id in manager.connections:
            del manager.connections[officer_id]
