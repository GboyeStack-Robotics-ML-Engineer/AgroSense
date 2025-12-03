from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
from ..database import get_db
from ..models import SensorReading
from ..schemas import SensorReadingCreate, SensorReadingResponse

router = APIRouter()


@router.post("/", response_model=SensorReadingResponse)
async def create_sensor_reading(
    reading: SensorReadingCreate,
    db: Session = Depends(get_db)
):
    """Create a new sensor reading."""
    db_reading = SensorReading(**reading.model_dump())
    db.add(db_reading)
    db.commit()
    db.refresh(db_reading)
    return db_reading


@router.get("/", response_model=List[SensorReadingResponse])
async def get_sensor_readings(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    hours: int = Query(24, ge=1, le=168, description="Get readings from last N hours"),
    zone: str = Query(None, description="Filter by zone"),
    db: Session = Depends(get_db)
):
    """Get sensor readings with optional filtering."""
    query = db.query(SensorReading)
    
    # Filter by time
    cutoff_time = datetime.utcnow() - timedelta(hours=hours)
    query = query.filter(SensorReading.timestamp >= cutoff_time)
    
    # Filter by zone if provided
    if zone:
        query = query.filter(SensorReading.zone == zone)
    
    # Order by timestamp descending and apply pagination
    readings = query.order_by(SensorReading.timestamp.desc()).offset(skip).limit(limit).all()
    return readings


@router.get("/all", response_model=List[SensorReadingResponse])
async def get_all_sensor_readings(
    limit: int = Query(1000, ge=1, le=5000),
    zone: str = Query(None, description="Filter by zone"),
    db: Session = Depends(get_db)
):
    """Get all sensor readings regardless of time (up to limit)."""
    query = db.query(SensorReading)
    
    # Filter by zone if provided
    if zone:
        query = query.filter(SensorReading.zone == zone)
    
    # Order by timestamp descending and apply limit
    readings = query.order_by(SensorReading.timestamp.desc()).limit(limit).all()
    return readings


@router.get("/latest", response_model=SensorReadingResponse)
async def get_latest_reading(
    zone: str = Query("main", description="Zone to get latest reading from"),
    db: Session = Depends(get_db)
):
    """Get the most recent sensor reading."""
    reading = db.query(SensorReading).filter(
        SensorReading.zone == zone
    ).order_by(SensorReading.timestamp.desc()).first()
    
    if not reading:
        raise HTTPException(status_code=404, detail="No readings found")
    
    return reading


@router.get("/stats")
async def get_sensor_stats(
    hours: int = Query(24, ge=1, le=168),
    zone: str = Query("main"),
    db: Session = Depends(get_db)
):
    """Get statistical summary of sensor data."""
    from sqlalchemy import func
    
    cutoff_time = datetime.utcnow() - timedelta(hours=hours)
    
    stats = db.query(
        func.avg(SensorReading.moisture).label('avg_moisture'),
        func.min(SensorReading.moisture).label('min_moisture'),
        func.max(SensorReading.moisture).label('max_moisture'),
        func.avg(SensorReading.temperature).label('avg_temperature'),
        func.min(SensorReading.temperature).label('min_temperature'),
        func.max(SensorReading.temperature).label('max_temperature'),
        func.avg(SensorReading.humidity).label('avg_humidity'),
        func.avg(SensorReading.ph).label('avg_ph'),
        func.count(SensorReading.id).label('reading_count')
    ).filter(
        SensorReading.timestamp >= cutoff_time,
        SensorReading.zone == zone
    ).first()
    
    if not stats or stats.reading_count == 0:
        raise HTTPException(status_code=404, detail="No readings found for the specified period")
    
    return {
        "zone": zone,
        "period_hours": hours,
        "moisture": {
            "avg": round(stats.avg_moisture, 2),
            "min": round(stats.min_moisture, 2),
            "max": round(stats.max_moisture, 2)
        },
        "temperature": {
            "avg": round(stats.avg_temperature, 2),
            "min": round(stats.min_temperature, 2),
            "max": round(stats.max_temperature, 2)
        },
        "humidity": {
            "avg": round(stats.avg_humidity, 2)
        },
        "ph": {
            "avg": round(stats.avg_ph, 2)
        },
        "reading_count": stats.reading_count
    }


@router.delete("/{reading_id}")
async def delete_sensor_reading(
    reading_id: int,
    db: Session = Depends(get_db)
):
    """Delete a specific sensor reading."""
    reading = db.query(SensorReading).filter(SensorReading.id == reading_id).first()
    if not reading:
        raise HTTPException(status_code=404, detail="Reading not found")
    
    db.delete(reading)
    db.commit()
    return {"message": "Reading deleted successfully"}
