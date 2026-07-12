from sqlalchemy import Column, Integer, String, Boolean, JSON, DateTime, ForeignKey, Float, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from geoalchemy2 import Geometry
from .base import Base

class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    fir_number = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    
    # Crime location
    location_name = Column(String)
    location_geom = Column(Geometry(geometry_type='POINT', srid=4326))
    ward = Column(String, index=True)
    
    # BNS sections
    bns_sections = Column(JSON, default=list)
    
    status = Column(String, default="OPEN") # OPEN, UNDER_INVESTIGATION, CLOSED
    victim_injury = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Assignee (User)
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    assigned_to = relationship("User")
    evidences = relationship("Evidence", back_populates="case", cascade="all, delete-orphan")
    diary_entries = relationship("CaseDiary", back_populates="case", cascade="all, delete-orphan")


class Evidence(Base):
    __tablename__ = "evidences"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    file_url = Column(String)
    file_hash = Column(String) # SHA-256
    
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    
    case = relationship("Case", back_populates="evidences")


class CaseDiary(Base):
    __tablename__ = "case_diary"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    action = Column(String, nullable=False) # e.g., "FIR_REGISTERED", "EVIDENCE_ADDED"
    details = Column(JSON, default=dict)
    
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    case = relationship("Case", back_populates="diary_entries")

