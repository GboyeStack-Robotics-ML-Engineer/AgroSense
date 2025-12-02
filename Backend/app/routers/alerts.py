from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
from ..database import get_db
from ..models import Alert
from ..schemas import AlertCreate, AlertResponse, AlertUpdate

router = APIRouter()


@router.post("/", response_model=AlertResponse)
async def create_alert(
    alert: AlertCreate,
    db: Session = Depends(get_db)
):
    """Create a new alert."""
    db_alert = Alert(**alert.model_dump())
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)
    return db_alert


@router.get("/", response_model=List[AlertResponse])
async def get_alerts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    unread_only: bool = Query(False, description="Show only unread alerts"),
    unresolved_only: bool = Query(False, description="Show only unresolved alerts"),
    severity: str = Query(None, description="Filter by severity"),
    db: Session = Depends(get_db)
):
    """Get alerts with optional filtering."""
    query = db.query(Alert)
    
    if unread_only:
        query = query.filter(Alert.is_read == False)
    
    if unresolved_only:
        query = query.filter(Alert.is_resolved == False)
    
    if severity:
        query = query.filter(Alert.severity == severity)
    
    alerts = query.order_by(Alert.timestamp.desc()).offset(skip).limit(limit).all()
    return alerts


@router.get("/recent", response_model=List[AlertResponse])
async def get_recent_alerts(
    hours: int = Query(24, ge=1, le=168),
    db: Session = Depends(get_db)
):
    """Get alerts from the last N hours."""
    cutoff_time = datetime.utcnow() - timedelta(hours=hours)
    
    alerts = db.query(Alert).filter(
        Alert.timestamp >= cutoff_time
    ).order_by(Alert.timestamp.desc()).all()
    
    return alerts


@router.get("/unread/count")
async def get_unread_count(db: Session = Depends(get_db)):
    """Get count of unread alerts."""
    count = db.query(Alert).filter(Alert.is_read == False).count()
    return {"unread_count": count}


@router.patch("/{alert_id}", response_model=AlertResponse)
async def update_alert(
    alert_id: int,
    alert_update: AlertUpdate,
    db: Session = Depends(get_db)
):
    """Update alert status (mark as read/resolved)."""
    db_alert = db.query(Alert).filter(Alert.id == alert_id).first()
    
    if not db_alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    update_data = alert_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_alert, field, value)
    
    db.commit()
    db.refresh(db_alert)
    return db_alert


@router.post("/mark-all-read")
async def mark_all_alerts_read(db: Session = Depends(get_db)):
    """Mark all alerts as read."""
    db.query(Alert).filter(Alert.is_read == False).update({"is_read": True})
    db.commit()
    return {"message": "All alerts marked as read"}


@router.delete("/{alert_id}")
async def delete_alert(
    alert_id: int,
    db: Session = Depends(get_db)
):
    """Delete a specific alert."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    db.delete(alert)
    db.commit()
    return {"message": "Alert deleted successfully"}
