from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class SensorReadingCreate(BaseModel):
    sensor_id: int = Field(1, ge=1, description="Hardware sensor ID")
    moisture: float = Field(..., ge=0, le=100, description="Soil moisture percentage")
    temperature: float = Field(..., ge=-50, le=100, description="Temperature in Celsius")
    humidity: float = Field(..., ge=0, le=100, description="Humidity percentage")
    ph: float = Field(..., ge=0, le=14, description="Soil pH level")
    zone: Optional[str] = "main"


class SensorReadingResponse(BaseModel):
    id: int
    timestamp: datetime
    sensor_id: int
    moisture: float
    temperature: float
    humidity: float
    ph: float
    zone: str
    
    class Config:
        from_attributes = True


class AlertCreate(BaseModel):
    type: str
    severity: str
    message: str
    zone: Optional[str] = None


class AlertResponse(BaseModel):
    id: int
    timestamp: datetime
    type: str
    severity: str
    message: str
    is_read: bool
    is_resolved: bool
    zone: Optional[str]
    
    class Config:
        from_attributes = True


class AlertUpdate(BaseModel):
    is_read: Optional[bool] = None
    is_resolved: Optional[bool] = None


class AnalysisRequest(BaseModel):
    image_base64: str
    analysis_type: str  # 'plant_health' or 'security'


class AnalysisResponse(BaseModel):
    analysis_type: str
    result: str
    timestamp: datetime
