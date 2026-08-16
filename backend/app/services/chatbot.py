"""
SAMRAKSHA Chatbot Service
Conversational AI for police case queries and general assistance
"""
from sqlalchemy import text
from sqlalchemy import text

import structlog
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from app.services.llm_integration import get_llm


logger = structlog.get_logger()

class ChatbotSession:
    """Manages chatbot conversation session"""
    
    def __init__(self, session_id: str, officer_id: str, ps_id: Optional[str] = None):
        self.session_id = session_id
        self.officer_id = officer_id
        self.ps_id = ps_id
        self.messages: List[Dict[str, str]] = []
        self.created_at = datetime.utcnow()
        self.last_activity = datetime.utcnow()
    
    def add_message(self, role: str, content: str):
        """Add message to conversation history"""
        self.messages.append({
            "role": role,
            "content": content
        })
        self.last_activity = datetime.utcnow()
        
        # Keep only last 10 messages for context window
        if len(self.messages) > 20:
            self.messages = self.messages[-20:]
    
    def get_context(self) -> List[Dict[str, str]]:
        """Get conversation context for LLM"""
        return self.messages.copy()
    
    def is_expired(self, timeout_minutes: int = 60) -> bool:
        """Check if session has expired"""
        return (datetime.utcnow() - self.last_activity) > timedelta(minutes=timeout_minutes)

class Chatbot:
    """SAMRAKSHA Chatbot Service"""
    
    # Global session store (in production, use Redis)
    _sessions: Dict[str, ChatbotSession] = {}
    
    # Greeting patterns
    GREETINGS = {
        "hello": "Hello! I'm the SAMRAKSHA Assistant. How can I help you with case information?",
        "hi": "Hi there! I'm here to help with police case queries and legal information.",
        "help": "I can help you with:\n• Case information queries\n• Legal section references\n• Evidence details\n• Witness information\n• Case status updates",
        "commands": "Available commands:\n/case - Query specific case\n/search - Search cases\n/legal - Legal references\n/help - Get help",
    }
    
    @classmethod
    async def create_session(cls, officer_id: str, ps_id: Optional[str] = None) -> str:
        """Create new chatbot session"""
        import uuid
        session_id = str(uuid.uuid4())
        cls._sessions[session_id] = ChatbotSession(session_id, officer_id, ps_id)
        logger.info("Chatbot session created", session_id=session_id, officer_id=officer_id)
        return session_id
    
    @classmethod
    async def get_session(cls, session_id: str) -> Optional[ChatbotSession]:
        """Get chatbot session"""
        session = cls._sessions.get(session_id)
        if session and not session.is_expired():
            return session
        elif session:
            del cls._sessions[session_id]
        return None
    
    @classmethod
    async def query(
        cls,
        session_id: str,
        query: str,
        db = None,
        officer_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Process chatbot query
        
        Args:
            session_id: Conversation session ID
            query: User query
            db: Database connection
            officer_id: Officer making the query
            
        Returns:
            Response dict with answer and metadata
        """
        session = await cls.get_session(session_id)
        if not session:
            logger.warning("Session not found", session_id=session_id)
            return {
                "error": "Session expired or not found",
                "answer": "Your session has expired. Please start a new conversation."
            }
        
        # Check for greeting
        query_lower = query.lower().strip()
        for greeting, response in cls.GREETINGS.items():
            if greeting in query_lower:
                session.add_message("user", query)
                session.add_message("assistant", response)
                return {
                    "session_id": session_id,
                    "answer": response,
                    "source": "greeting",
                    "conversation_count": len(session.messages) // 2
                }
        
        # Add user message to history
        session.add_message("user", query)
        
        # Build context for LLM
        try:
            # Get relevant case context if querying about cases
            context = ""
            if "case" in query_lower or "fir" in query_lower or "crime" in query_lower:
                context = await cls._build_case_context(query, session.ps_id, db)
            
            # Get LLM response
            system_prompt = cls._get_system_prompt(session)
            
            llm = get_llm()
            response = await llm.chat_completion(
                messages=session.get_context(),
                system=system_prompt,
                temperature=0.1,
                max_tokens=500
            )
            
            # Add assistant response to history
            session.add_message("assistant", response)
            
            return {
                "session_id": session_id,
                "answer": response,
                "source": "llm",
                "conversation_count": len(session.messages) // 2,
                "context_used": bool(context)
            }
            
        except Exception as e:
            logger.error("Chatbot query error", error=str(e))
            fallback = cls._get_fallback_response(query)
            session.add_message("assistant", fallback)
            return {
                "session_id": session_id,
                "answer": fallback,
                "source": "fallback",
                "error": str(e)
            }
    
    @classmethod
    async def _build_case_context(
        cls,
        query: str,
        ps_id: Optional[str],
        db
    ) -> str:
        """Build case context from database"""
        if not db or not ps_id:
            return ""
        
        try:
            # Search for relevant cases
            cases = (await db.execute(text("""SELECT fir_no, crime_type, crime_date, case_status, 
                          victim_name, accused_name, bns_sections
                   FROM cases
                   WHERE ps_id = :p1
                   ORDER BY crime_date DESC
                   LIMIT 5"""), {'p1': ps_id})).mappings().fetchall()
            
            if cases:
                context = "Recent cases in jurisdiction:\n"
                for case in cases:
                    context += (
                        f"• FIR {case['fir_no']}: {case['crime_type']} "
                        f"({case['case_status']})\n"
                    )
                return context
        except Exception as e:
            logger.warning("Context building error", error=str(e))
        
        return ""
    
    @classmethod
    def _get_system_prompt(cls, session: ChatbotSession) -> str:
        """Get system prompt for LLM"""
        return (
            "You are a helpful SAMRAKSHA police assistant. "
            "You help police officers with case information, legal references, and general questions. "
            "Be professional, concise, and accurate. "
            "Always cite case numbers (FIR numbers) when referring to specific cases. "
            "If you don't know something, say so clearly. "
            "Never make up case information."
        )
    
    @classmethod
    def _get_fallback_response(cls, query: str) -> str:
        """Get fallback response when LLM fails"""
        query_lower = query.lower()
        
        if "evidence" in query_lower:
            return "Please provide the case FIR number to get evidence details."
        elif "section" in query_lower or "bns" in query_lower:
            return "Please specify which case you're asking about for legal section details."
        elif "arrest" in query_lower:
            return "To check arrest status, please provide the case FIR number."
        else:
            return (
                "I'm here to help with case information, legal references, and general queries. "
                "Please ask me a specific question about a case or legal matter."
            )
    
    @classmethod
    async def close_session(cls, session_id: str):
        """Close chatbot session"""
        if session_id in cls._sessions:
            del cls._sessions[session_id]
            logger.info("Chatbot session closed", session_id=session_id)
    
    @classmethod
    async def cleanup_expired_sessions(cls):
        """Remove expired sessions"""
        expired = [
            sid for sid, session in cls._sessions.items()
            if session.is_expired()
        ]
        for sid in expired:
            del cls._sessions[sid]
        if expired:
            logger.info("Expired sessions cleaned up", count=len(expired))

# Global chatbot instance
chatbot_service = Chatbot()

