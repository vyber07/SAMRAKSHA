"""
SAMRAKSHA Chatbot API Endpoints
WebSocket and HTTP endpoints for real-time and request-response chat
"""

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query
from pydantic import BaseModel
from typing import Optional
import structlog

from app.api.auth import get_current_officer
from app.db.connection import get_db
from app.services.chatbot import chatbot_service
from app.services.llm_integration import get_llm

router = APIRouter(prefix="/chatbot", tags=["chatbot"])
logger = structlog.get_logger()

class ChatMessage(BaseModel):
    """Chat message"""
    message: str

class ChatResponse(BaseModel):
    """Chat response"""
    answer: str
    session_id: str
    source: str
    conversation_count: int

@router.post("/start-session")
async def start_session(
    officer = Depends(get_current_officer)
) -> dict:
    """
    Start a new chatbot session
    
    Returns session_id for use in subsequent queries
    """
    ps_id = officer.get('ps_id') if isinstance(officer, dict) else getattr(officer, 'ps_id', None)
    session_id = await chatbot_service.create_session(officer['id'], ps_id)
    
    return {
        "session_id": session_id,
        "message": "Chatbot session started. You can now ask questions about cases and legal matters."
    }

@router.post("/query")
async def chatbot_query(
    body: ChatMessage,
    session_id: str = Query(...),
    db = Depends(get_db),
    officer = Depends(get_current_officer)
) -> ChatResponse:
    """
    Send a message to chatbot
    
    Args:
        message: User message/query
        session_id: Session ID from start-session
        
    Returns:
        ChatResponse with answer and conversation metadata
    """
    response = await chatbot_service.query(
        session_id=session_id,
        query=body.message,
        db=db,
        officer_id=officer.get('id')
    )
    
    if "error" in response:
        raise HTTPException(400, response["error"])
    
    return ChatResponse(
        answer=response["answer"],
        session_id=session_id,
        source=response["source"],
        conversation_count=response.get("conversation_count", 0)
    )

@router.post("/end-session")
async def end_session(
    session_id: str = Query(...),
    officer = Depends(get_current_officer)
) -> dict:
    """End chatbot session"""
    await chatbot_service.close_session(session_id)
    return {"message": "Session closed successfully"}

@router.get("/health")
async def health_check() -> dict:
    """Check LLaMA service health"""
    llm = get_llm()
    is_healthy = await llm.health_check()
    
    return {
        "status": "healthy" if is_healthy else "unhealthy",
        "llm_service": "connected" if is_healthy else "disconnected",
        "chatbot_service": "ready"
    }

# WebSocket connection manager
class ConnectionManager:
    """Manages WebSocket connections for real-time chat"""
    
    def __init__(self):
        self.active_connections: dict = {}
    
    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        self.active_connections[session_id] = websocket
        logger.info("WebSocket connected", session_id=session_id)
    
    def disconnect(self, session_id: str):
        if session_id in self.active_connections:
            del self.active_connections[session_id]
            logger.info("WebSocket disconnected", session_id=session_id)
    
    async def send_message(self, session_id: str, message: dict):
        if session_id in self.active_connections:
            await self.active_connections[session_id].send_json(message)

manager = ConnectionManager()

@router.websocket("/ws/{session_id}/{token}")
async def websocket_endpoint(websocket: WebSocket, session_id: str, token: str):
    """
    WebSocket endpoint for real-time chat
    
    Connection: ws://host/api/v1/chatbot/ws/{session_id}/{token}
    
    Message format:
        {"type": "message", "content": "user message"}
        
    Response format:
        {"type": "response", "content": "assistant response"}
        {"type": "status", "content": "session status"}
    """
    await manager.connect(websocket, session_id)
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_json()
            
            if data.get("type") == "message":
                # Process chatbot query
                response = await chatbot_service.query(
                    session_id=session_id,
                    query=data.get("content", ""),
                )
                
                # Send response back
                await websocket.send_json({
                    "type": "response",
                    "content": response.get("answer", ""),
                    "source": response.get("source", "")
                })
            
            elif data.get("type") == "ping":
                # Keep-alive ping
                await websocket.send_json({
                    "type": "pong",
                    "timestamp": __import__('datetime').datetime.utcnow().isoformat()
                })
    
    except WebSocketDisconnect:
        manager.disconnect(session_id)
        logger.info("WebSocket disconnected", session_id=session_id)
    
    except Exception as e:
        logger.error("WebSocket error", error=str(e))
        await websocket.send_json({
            "type": "error",
            "content": str(e)
        })
        manager.disconnect(session_id)

