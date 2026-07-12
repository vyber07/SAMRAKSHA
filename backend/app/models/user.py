from sqlalchemy import Column, Integer, String, Boolean, JSON, DateTime
from sqlalchemy.sql import func
from .base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False) # e.g., IO, SHO, DCP
    
    # PBAC: fine-grained permission keys (e.g., ["view_all_cases", "edit_fir"])
    permissions = Column(JSON, default=list) 
    
    # For jurisdiction filtering (which police station or ward)
    jurisdiction = Column(String, nullable=True) 

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
