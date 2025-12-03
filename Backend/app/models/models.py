from sqlalchemy import Column, Integer, Float, String, DateTime, Boolean
from sqlalchemy.sql import func
from ..database import Base


class SensorReading(Base):
    __tablename__ = "sensor_readings"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, server_default=func.now(), index=True)
    
    # Sensor identification
    sensor_id = Column(Integer, nullable=False, default=1, index=True)
    
    # Soil metrics
    moisture = Column(Float, nullable=False)
    temperature = Column(Float, nullable=False)
    humidity = Column(Float, nullable=False)
    ph = Column(Float, nullable=False)
    
    # Optional location/zone info
    zone = Column(String, default="main")


class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, server_default=func.now(), index=True)
    
    type = Column(String, nullable=False)  # 'moisture', 'temp', 'security', etc.
    severity = Column(String, nullable=False)  # 'low', 'medium', 'high', 'critical'
    message = Column(String, nullable=False)
    
    is_read = Column(Boolean, default=False)
    is_resolved = Column(Boolean, default=False)
    
    # Optional metadata
    zone = Column(String, nullable=True)


class AnalysisLog(Base):
    __tablename__ = "analysis_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, server_default=func.now(), index=True)
    
    analysis_type = Column(String, nullable=False)  # 'plant_health', 'security'
    result = Column(String, nullable=False)
    
    # Store image reference or base64 (optional)
    image_path = Column(String, nullable=True)
