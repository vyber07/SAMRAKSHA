from sqlalchemy.orm import declarative_base
from sqlalchemy import Column, Integer, String, Boolean, DateTime, JSON

Base = declarative_base()

class Officer(Base):
    __tablename__ = "officers"
    badge_no = Column(String, primary_key=True)
    name = Column(String)
    role = Column(String)
    ps_id = Column(String)
    is_active = Column(Boolean, default=True)

class Case(Base):
    __tablename__ = "cases"
    fir_no = Column(String, primary_key=True)
    crime_type = Column(String)
    status = Column(String)
    created_at = Column(DateTime)
