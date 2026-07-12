from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class EvidenceSchema(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    file_url: Optional[str] = None
    file_hash: Optional[str] = None
    
    class Config:
        from_attributes = True

class CaseCreate(BaseModel):
    fir_number: str
    title: str
    description: str
    location_name: str
    ward: str
    bns_sections: List[str]
    victim_injury: bool = False
    
    # Lat/Lon for GeoAlchemy2 Geometry Point
    latitude: float
    longitude: float

class CaseResponse(BaseModel):
    id: int
    fir_number: str
    title: str
    description: str
    location_name: str
    ward: str
    bns_sections: List[str]
    status: str
    victim_injury: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    evidences: List[EvidenceSchema] = []
    
    class Config:
        from_attributes = True
